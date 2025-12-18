import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = {
  params: Promise<{ orderId: string }>;
};

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { orderId } = await params;

  if (!orderId) {
    return NextResponse.json({ error: "orderId ausente" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ status: order.status }, { status: 200 });
}
