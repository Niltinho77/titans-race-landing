import { NextResponse } from "next/server";
import { getCurrentPortalUser } from "@/lib/portalAuth";
import { prisma } from "@/lib/prisma";
import { getModalityById } from "@/config/checkout";
import { createInviteToken, hashInviteToken } from "@/lib/registrationInvites";

export async function POST(req: Request) {
  const user = await getCurrentPortalUser();
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body.modalityId !== "string" || !getModalityById(body.modalityId) ||
      typeof body.label !== "string" || !body.label.trim() || body.label.length > 120 ||
      !Number.isInteger(body.validHours) || body.validHours < 1 || body.validHours > 168) {
    return NextResponse.json({ error: "Informe identificação, modalidade e validade de 1 a 168 horas." }, { status: 400 });
  }
  const token = createInviteToken();
  const invite = await prisma.registrationInvite.create({ data: {
    tokenHash: hashInviteToken(token), label: body.label.trim(), modalityId: body.modalityId,
    expiresAt: new Date(Date.now() + body.validHours * 60 * 60 * 1000),
  } });
  return NextResponse.json({ id: invite.id, path: `/convite/${token}`, expiresAt: invite.expiresAt }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(req: Request) {
  const user = await getCurrentPortalUser();
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (typeof body?.id !== "string") return NextResponse.json({ error: "Convite inválido." }, { status: 400 });
  // Convites já usados não são liberados novamente: a cobrança pode continuar ativa.
  const result = await prisma.registrationInvite.updateMany({ where: { id: body.id, claimedAt: null, revokedAt: null }, data: { revokedAt: new Date() } });
  return NextResponse.json({ ok: result.count === 1 });
}
