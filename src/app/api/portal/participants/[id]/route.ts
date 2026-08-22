import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  changesAreOpen,
  normalizeEmail,
  requirePortalUser,
} from "@/lib/portalAuth";

export const runtime = "nodejs";

const onlyDigits = (value: string) => (value ?? "").replace(/\D/g, "");

type Ctx = {
  params: Promise<{ id: string }>;
};

function editableData(body: unknown) {
  const input = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const data: Record<string, string | null> = {};

  if (typeof input.phone === "string") data.phone = onlyDigits(input.phone).slice(0, 11);
  if (typeof input.city === "string") data.city = input.city.trim() || null;
  if (typeof input.state === "string") data.state = input.state.trim().toUpperCase().slice(0, 2) || null;
  if (typeof input.tshirtSize === "string") data.tshirtSize = input.tshirtSize.trim();
  if (typeof input.emergencyName === "string") data.emergencyName = input.emergencyName.trim() || null;
  if (typeof input.emergencyPhone === "string") {
    data.emergencyPhone = onlyDigits(input.emergencyPhone).slice(0, 11) || null;
  }
  if (typeof input.healthInfo === "string") data.healthInfo = input.healthInfo.trim() || null;

  return data;
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const user = await requirePortalUser();

  if (!changesAreOpen() && user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "O prazo para alterações pelo portal foi encerrado." },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const data = editableData(body);

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nenhum campo permitido informado." }, { status: 400 });
  }

  const participant = await prisma.participant.findFirst({
    where: {
      id,
      order: { status: "PAID" },
      ...(user.role === "ADMIN" ? {} : { email: normalizeEmail(user.email) }),
    },
  });

  if (!participant) {
    return NextResponse.json({ error: "Inscrição não encontrada." }, { status: 404 });
  }

  const beforeJson = {
    phone: participant.phone,
    city: participant.city,
    state: participant.state,
    tshirtSize: participant.tshirtSize,
    emergencyName: participant.emergencyName,
    emergencyPhone: participant.emergencyPhone,
    healthInfo: participant.healthInfo,
  };

  const updated = await prisma.participant.update({
    where: { id },
    data,
  });

  await prisma.participantChangeLog.create({
    data: {
      participantId: id,
      actorUserId: user.id,
      action: "PARTICIPANT_UPDATE",
      beforeJson,
      afterJson: data,
    },
  });

  return NextResponse.json({
    ok: true,
    participant: {
      id: updated.id,
      phone: updated.phone,
      city: updated.city,
      state: updated.state,
      tshirtSize: updated.tshirtSize,
      emergencyName: updated.emergencyName,
      emergencyPhone: updated.emergencyPhone,
      healthInfo: updated.healthInfo,
    },
  });
}
