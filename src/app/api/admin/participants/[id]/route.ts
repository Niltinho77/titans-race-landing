import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentPortalUser } from "@/lib/portalAuth";

const onlyDigits = (v: string) => (v ?? "").replace(/\D/g, "");

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentPortalUser();
  if (!user) return NextResponse.json({ error: "NÃ£o autorizado." }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);

    const data: any = {};
    if (typeof body?.fullName === "string") data.fullName = body.fullName.trim();
    if (typeof body?.cpf === "string") data.cpf = onlyDigits(body.cpf).slice(0, 11);
    if (typeof body?.birthDate === "string") data.birthDate = body.birthDate.trim();
    if (typeof body?.phone === "string") data.phone = onlyDigits(body.phone).slice(0, 11);
    if (typeof body?.email === "string") data.email = body.email.trim().toLowerCase();
    if (typeof body?.city === "string") data.city = body.city.trim() || null;
    if (typeof body?.state === "string") data.state = body.state.trim().toUpperCase().slice(0, 2) || null;
    if (typeof body?.tshirtSize === "string") data.tshirtSize = body.tshirtSize.trim();
    if (typeof body?.emergencyName === "string") data.emergencyName = body.emergencyName.trim() || null;
    if (typeof body?.emergencyPhone === "string")
      data.emergencyPhone = onlyDigits(body.emergencyPhone).slice(0, 11) || null;
    if (typeof body?.healthInfo === "string") data.healthInfo = body.healthInfo.trim() || null;

    await prisma.participant.update({ where: { id }, data });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("PATCH /api/admin/participants/[id] error:", e);
    return NextResponse.json({ error: "Erro ao salvar participante." }, { status: 500 });
  }
}
