import { NextRequest, NextResponse } from "next/server";
import {
  createPasswordToken,
  normalizeEmail,
  portalBaseUrl,
} from "@/lib/portalAuth";
import { sendPortalPasswordSetupEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";

  if (!email) {
    return NextResponse.json({ error: "Informe o e-mail." }, { status: 400 });
  }

  const user = await prisma.portalUser.findUnique({ where: { email } });

  if (user) {
    const { token, expiresAt } = await createPasswordToken(user.id);
    const setupUrl = `${portalBaseUrl()}/portal/definir-senha?token=${token}`;

    await sendPortalPasswordSetupEmail({
      to: user.email,
      name: user.name,
      setupUrl,
      expiresAt,
    });
  }

  return NextResponse.json({
    ok: true,
    message: "Se este e-mail existir no portal, enviaremos um link de definição de senha.",
  });
}
