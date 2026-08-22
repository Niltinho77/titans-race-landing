import { NextRequest, NextResponse } from "next/server";
import {
  PORTAL_SESSION_COOKIE,
  createSession,
  hashPassword,
  hashToken,
  portalCookieOptions,
} from "@/lib/portalAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function validPassword(password: string) {
  return password.length >= 8;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!token || !validPassword(password)) {
    return NextResponse.json(
      { error: "Token inválido ou senha com menos de 8 caracteres." },
      { status: 400 }
    );
  }

  const passwordToken = await prisma.portalPasswordToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (
    !passwordToken ||
    passwordToken.usedAt ||
    passwordToken.expiresAt <= new Date()
  ) {
    return NextResponse.json({ error: "Link expirado ou inválido." }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction([
    prisma.portalUser.update({
      where: { id: passwordToken.userId },
      data: {
        passwordHash,
        requiresPasswordSetup: false,
      },
    }),
    prisma.portalPasswordToken.update({
      where: { id: passwordToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  const session = await createSession(passwordToken.userId);
  const res = NextResponse.json({
    ok: true,
    redirectTo:
      passwordToken.user.role === "ADMIN"
        ? "/portal/admin/inscricoes"
        : "/portal/minhas-inscricoes",
  });

  res.cookies.set(PORTAL_SESSION_COOKIE, session.token, portalCookieOptions(session.expiresAt));
  return res;
}
