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

  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  }

  try {
    let user = await prisma.portalUser.findUnique({ where: { email } });

    // Inscritos novos também precisam conseguir criar o primeiro acesso,
    // sem depender da execução manual do script de convites.
    if (!user) {
      const participant = await prisma.participant.findFirst({
        where: { email: { equals: email, mode: "insensitive" }, order: { status: "PAID" } },
        select: { fullName: true },
      });
      if (participant) {
        user = await prisma.portalUser.upsert({
          where: { email },
          create: { email, name: participant.fullName, role: "PARTICIPANT", requiresPasswordSetup: true },
          update: {},
        });
      }
    }

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
  } catch (error) {
    console.error("[portal/password/request] Falha ao solicitar senha:", error);
    return NextResponse.json(
      { error: "Não foi possível enviar o e-mail agora. Tente novamente em alguns minutos. Se o problema continuar, entre em contato com a organização." },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Se este e-mail estiver cadastrado no portal ou em uma inscrição paga, você receberá um link para definir ou recuperar sua senha. Confira também o spam e o lixo eletrônico e use o mesmo e-mail informado na inscrição.",
  });
}
