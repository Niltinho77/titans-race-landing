import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params; // ✅ Next 16: params é Promise
    const body = await req.json().catch(() => null);

    const type = typeof body?.type === "string" ? body.type.trim() : null;
    const size = typeof body?.size === "string" ? body.size.trim() : null;
    const quantity =
      typeof body?.quantity === "number" && Number.isFinite(body.quantity)
        ? Math.max(1, Math.round(body.quantity))
        : 1;

    if (!type) {
      return NextResponse.json({ error: "type é obrigatório." }, { status: 400 });
    }

    const existing = await prisma.participantExtra.findFirst({
      where: { participantId: id, type },
    });

    // se já existe extra do mesmo type, SOMA quantidade e atualiza size se vier
    if (existing) {
    await prisma.participantExtra.update({
        where: { id: existing.id },
        data: {
        quantity: { increment: quantity },
        size: size ?? existing.size,
        },
    });
    } else {
    await prisma.participantExtra.create({
        data: { participantId: id, type, size, quantity },
    });
    }

    const extras = await prisma.participantExtra.findMany({
      where: { participantId: id },
      orderBy: { type: "asc" },
    });

    return NextResponse.json({ ok: true, extras }, { status: 200 });
  } catch (e) {
    console.error("POST extras error:", e);
    return NextResponse.json({ error: "Erro ao salvar extra." }, { status: 500 });
  }
}