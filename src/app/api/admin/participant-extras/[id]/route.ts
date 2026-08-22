import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentPortalUser } from "@/lib/portalAuth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentPortalUser();
  if (!user) return NextResponse.json({ error: "NÃ£o autorizado." }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  try {
    const { id } = await params;

    await prisma.participantExtra.delete({ where: { id } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("DELETE extra error:", e);
    return NextResponse.json({ error: "Erro ao remover extra." }, { status: 500 });
  }
}
