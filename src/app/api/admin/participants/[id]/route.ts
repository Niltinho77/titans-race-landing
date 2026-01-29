import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const onlyDigits = (v: string) => (v ?? "").replace(/\D/g, "");

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params; // ✅ Next 16: params é Promise
    const body = await req.json().catch(() => null);

    const data: any = {};

    if (typeof body?.fullName === "string") data.fullName = body.fullName.trim();
    if (typeof body?.cpf === "string") data.cpf = onlyDigits(body.cpf).slice(0, 11);
    if (typeof body?.birthDate === "string") data.birthDate = body.birthDate.trim();
    if (typeof body?.phone === "string") data.phone = onlyDigits(body.phone).slice(0, 11);
    if (typeof body?.email === "string") data.email = body.email.trim().toLowerCase();
    if (typeof body?.city === "string") data.city = body.city.trim() || null;

    if (typeof body?.state === "string") {
      const s = body.state.trim().toUpperCase();
      data.state = s ? s.slice(0, 2) : null;
    }

    if (typeof body?.tshirtSize === "string") data.tshirtSize = body.tshirtSize.trim();
    if (typeof body?.emergencyName === "string") data.emergencyName = body.emergencyName.trim() || null;

    if (typeof body?.emergencyPhone === "string") {
      const p = onlyDigits(body.emergencyPhone).slice(0, 11);
      data.emergencyPhone = p.length ? p : null;
    }

    if (typeof body?.healthInfo === "string") data.healthInfo = body.healthInfo.trim() || null;

    await prisma.participant.update({
      where: { id },
      data,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("PATCH /api/admin/participants/[id] error:", e);
    return NextResponse.json({ error: "Erro ao salvar participante." }, { status: 500 });
  }
}