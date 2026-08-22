import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  changesAreOpen,
  createPasswordToken,
  normalizeEmail,
  portalBaseUrl,
  requirePortalUser,
} from "@/lib/portalAuth";
import { sendPortalPasswordSetupEmail } from "@/lib/email";

export const runtime = "nodejs";

type Ctx = {
  params: Promise<{ id: string }>;
};

const onlyDigits = (value: string) => (value ?? "").replace(/\D/g, "");

function validateTransfer(body: unknown) {
  const input = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const fullName = typeof input.fullName === "string" ? input.fullName.trim() : "";
  const cpf = typeof input.cpf === "string" ? onlyDigits(input.cpf).slice(0, 11) : "";
  const birthDate = typeof input.birthDate === "string" ? input.birthDate.trim() : "";
  const phone = typeof input.phone === "string" ? onlyDigits(input.phone).slice(0, 11) : "";
  const email = typeof input.email === "string" ? normalizeEmail(input.email) : "";
  const city = typeof input.city === "string" ? input.city.trim() : "";
  const state = typeof input.state === "string" ? input.state.trim().toUpperCase().slice(0, 2) : "";
  const tshirtSize = typeof input.tshirtSize === "string" ? input.tshirtSize.trim() : "";
  const emergencyName = typeof input.emergencyName === "string" ? input.emergencyName.trim() : "";
  const emergencyPhone =
    typeof input.emergencyPhone === "string"
      ? onlyDigits(input.emergencyPhone).slice(0, 11)
      : "";
  const healthInfo = typeof input.healthInfo === "string" ? input.healthInfo.trim() : "";
  const termsAccepted = input.termsAccepted === true;

  if (fullName.length < 3) return { error: "Informe o nome completo." as const };
  if (cpf.length !== 11) return { error: "Informe um CPF válido." as const };
  if (birthDate.length !== 10) return { error: "Informe a data de nascimento." as const };
  if (phone.length !== 11) return { error: "Informe um telefone válido." as const };
  if (!email.includes("@") || !email.includes(".")) return { error: "Informe um e-mail válido." as const };
  if (!tshirtSize) return { error: "Informe o tamanho da camiseta." as const };
  if (!termsAccepted) return { error: "O novo participante precisa aceitar os termos." as const };

  return {
    data: {
      fullName,
      cpf,
      birthDate,
      phone,
      email,
      city: city || null,
      state: state || null,
      tshirtSize,
      emergencyName: emergencyName || null,
      emergencyPhone: emergencyPhone || null,
      healthInfo: healthInfo || null,
    },
  };
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const user = await requirePortalUser();

  if (!changesAreOpen() && user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "O prazo para transferências pelo portal foi encerrado." },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = validateTransfer(body);

  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const participant = await prisma.participant.findFirst({
    where: {
      id,
      order: { status: "PAID" },
      ...(user.role === "ADMIN" ? {} : { email: normalizeEmail(user.email) }),
    },
    include: { order: true },
  });

  if (!participant) {
    return NextResponse.json({ error: "Inscrição não encontrada." }, { status: 404 });
  }

  const beforeJson = {
    fullName: participant.fullName,
    cpf: participant.cpf,
    birthDate: participant.birthDate,
    phone: participant.phone,
    email: participant.email,
    city: participant.city,
    state: participant.state,
    tshirtSize: participant.tshirtSize,
    emergencyName: participant.emergencyName,
    emergencyPhone: participant.emergencyPhone,
    healthInfo: participant.healthInfo,
    orderId: participant.orderId,
    modalityId: participant.order.modalityId,
  };

  await prisma.$transaction([
    prisma.participant.update({
      where: { id },
      data: parsed.data,
    }),
    prisma.participantChangeLog.create({
      data: {
        participantId: id,
        actorUserId: user.id,
        action: "PARTICIPANT_TRANSFER",
        beforeJson,
        afterJson: parsed.data,
      },
    }),
  ]);

  const newUser = await prisma.portalUser.upsert({
    where: { email: parsed.data.email },
    create: {
      email: parsed.data.email,
      name: parsed.data.fullName,
      role: "PARTICIPANT",
      requiresPasswordSetup: true,
    },
    update: {
      name: parsed.data.fullName,
    },
  });

  if (newUser.requiresPasswordSetup || !newUser.passwordHash) {
    const { token, expiresAt } = await createPasswordToken(newUser.id);
    await sendPortalPasswordSetupEmail({
      to: newUser.email,
      name: newUser.name,
      setupUrl: `${portalBaseUrl()}/portal/definir-senha?token=${token}`,
      expiresAt,
    });
  }

  return NextResponse.json({ ok: true });
}
