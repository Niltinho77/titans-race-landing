import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: participantId } = await params;
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

    await prisma.participantExtra.create({
      data: { participantId, type, size, quantity },
    });

    const extras = await prisma.participantExtra.findMany({
      where: { participantId },
      orderBy: { type: "asc" },
    });

    return NextResponse.json({ ok: true, extras }, { status: 200 });
  } catch (e) {
    console.error("POST extras error:", e);
    return NextResponse.json({ error: "Erro ao salvar extra." }, { status: 500 });
  }
}