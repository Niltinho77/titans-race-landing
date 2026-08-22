import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const PORTAL_SESSION_COOKIE = "titans_portal_session";

const SESSION_DAYS = 14;
const PASSWORD_TOKEN_HOURS = 24;

export type PortalUserSession = {
  id: string;
  email: string;
  name: string | null;
  role: "PARTICIPANT" | "ADMIN";
  requiresPasswordSetup: boolean;
};

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("base64url");
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });

  return `scrypt$${salt}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, storedHash: string | null) {
  if (!storedHash) return false;

  const [algorithm, salt, expected] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !expected) return false;

  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });

  const expectedBuffer = Buffer.from(expected, "base64url");
  if (derived.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(derived, expectedBuffer);
}

export async function createPasswordToken(userId: string) {
  const token = randomToken();
  const tokenHash = sha256(token);
  const expiresAt = addHours(new Date(), PASSWORD_TOKEN_HOURS);

  await prisma.portalPasswordToken.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function createSession(userId: string) {
  const token = randomToken();
  const tokenHash = sha256(token);
  const expiresAt = addDays(new Date(), SESSION_DAYS);

  await prisma.portalSession.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function getCurrentPortalUser(): Promise<PortalUserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PORTAL_SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.portalSession.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true },
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) {
      await prisma.portalSession.delete({ where: { id: session.id } }).catch(() => null);
    }
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    requiresPasswordSetup: session.user.requiresPasswordSetup,
  };
}

export async function requirePortalUser() {
  const user = await getCurrentPortalUser();
  if (!user) redirect("/portal/login");
  return user;
}

export async function requireAdminUser() {
  const user = await requirePortalUser();
  if (user.role !== "ADMIN") redirect("/portal/minhas-inscricoes");
  return user;
}

export async function deleteCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(PORTAL_SESSION_COOKIE)?.value;
  if (!token) return;

  await prisma.portalSession
    .delete({ where: { tokenHash: sha256(token) } })
    .catch(() => null);
}

export function hashToken(token: string) {
  return sha256(token);
}

export function portalCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  };
}

export function portalBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ??
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ??
    "https://titansrace.com.br"
  );
}

export function changesAreOpen() {
  const raw = process.env.PORTAL_CHANGES_CLOSE_AT?.trim();
  if (!raw) return true;

  const closeAt = new Date(raw);
  if (Number.isNaN(closeAt.getTime())) return true;

  return new Date() <= closeAt;
}
