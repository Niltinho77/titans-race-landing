// src/app/api/admin/export-inscricoes/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function modalityKind(modalityId: string) {
  if (modalityId === "equipes") return "equipes" as const;
  if (modalityId === "duplas") return "duplas" as const;
  return "solo" as const;
}

function escapeCsvValue(value: unknown) {
  // CSV com ; mas ainda assim vamos escapar aspas e quebras de linha
  const str = String(value ?? "").replace(/\r?\n/g, " ").trim();
  if (str.includes(";") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      participants: {
        include: { extras: true },
      },
    },
  });

  const header = [
    "orderId",
    "status",
    "modalityId",
    "tickets",
    "totalAmount",

    // ✅ novas colunas
    "groupType",
    "groupNumber",
    "memberIndex",
    "bibNumber",

    // ✅ dados do participante
    "participantName",
    "email",
    "cpf",
    "phone",
    "birthDate",
    "tshirtSize",
    "city",
    "state",

    "extras",
  ].join(";");

  const rows: string[] = [header];

  for (const order of orders) {
    const kind = modalityKind(order.modalityId);

    // Para duplas/equipes, todos devem ter o mesmo bibNumber (groupNumber)
    const groupNumber =
      kind === "solo"
        ? ""
        : String(order.participants.find((p) => p.bibNumber != null)?.bibNumber ?? "");

    // Ordena para ficar bonito (integrante 1..)
    const participantsSorted =
      kind === "solo"
        ? order.participants
        : [...order.participants].sort(
            (a, b) => (a.teamIndex ?? 0) - (b.teamIndex ?? 0)
          );

    for (const p of participantsSorted) {
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
          ((order.totalAmount ?? 0) / 100).toFixed(2),

          // ✅ novas colunas
          kind,
          groupNumber,
          p.teamIndex ?? "",
          p.bibNumber ?? "",

          // ✅ dados do participante
          p.fullName,
          p.email,
          p.cpf,
          p.phone,
          p.birthDate,
          p.tshirtSize,
          p.city ?? "",
          p.state ?? "",

          extrasStr,
        ]
          .map(escapeCsvValue)
          .join(";")
      );
    }
  }

  const csv = rows.join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="inscricoes-titans-race.csv"',
    },
  });
}
