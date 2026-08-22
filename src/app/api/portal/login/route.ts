import { NextRequest, NextResponse } from "next/server";
import {
  PORTAL_SESSION_COOKIE,
  createSession,
  normalizeEmail,
  portalCookieOptions,
  verifyPassword,
} from "@/lib/portalAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 });
  }

  const user = await prisma.portalUser.findUnique({ where: { email } });
  const valid = await verifyPassword(password, user?.passwordHash ?? null);

  if (!user || !valid) {
    return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
  }

  const session = await createSession(user.id);
  const res = NextResponse.json({
    ok: true,
    role: user.role,
    redirectTo: user.role === "ADMIN" ? "/portal/admin/inscricoes" : "/portal/minhas-inscricoes",
  });

  res.cookies.set(PORTAL_SESSION_COOKIE, session.token, portalCookieOptions(session.expiresAt));
  return res;
}
