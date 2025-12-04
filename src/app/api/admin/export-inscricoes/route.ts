// src/app/api/admin/export-inscricoes/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      participants: {
        include: {
          extras: true,
        },
      },
    },
  });

  const header = [
    "orderId",
    "status",
    "modalityId",
    "tickets",
    "totalAmount",
    "participantName",
    "email",
    "cpf",
    "extras",
  ].join(";");

  const rows: string[] = [header];

  for (const order of orders) {
    for (const p of order.participants) {
      const extrasStr =
        p.extras
          .map((e) => `${e.type}${e.size ? `(${e.size})` : ""} x${e.quantity}`)
          .join(" | ") || "Nenhum";

      rows.push(
        [
          order.id,
          order.status,
          order.modalityId,
          order.tickets,
          (order.totalAmount ?? 0) / 100,
          p.fullName,
          p.email,
          p.cpf,
          extrasStr,
        ].join(";")
      );
    }
  }

  const csv = rows.join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="inscricoes-titans-race.csv"',
    },
  });
}