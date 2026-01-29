import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.participantExtra.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("DELETE extra error:", e);
    return NextResponse.json({ error: "Erro ao remover extra." }, { status: 500 });
  }
}