// src/app/api/admin/export-inscricoes/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function modalityKind(modalityId: string) {
  if (modalityId === "equipes") return "equipes" as const;
  if (modalityId === "duplas") return "duplas" as const;
  return "solo" as const;
}

// Ordem “humana” das modalidades no CSV (ajuste como quiser)
const modalityOrder: Record<string, number> = {
  kids: 1,
  diversao: 2,
  competicao: 3,
  duplas: 4,
  equipes: 5,
};

function modalityRank(modalityId: string) {
  return modalityOrder[modalityId] ?? 99;
}

function escapeCsvValue(value: unknown) {
  const str = String(value ?? "").replace(/\r?\n/g, " ").trim();
  if (str.includes(";") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function extrasToStr(extras: Array<{ type: string; size: string | null; quantity: number }>) {
  const s =
    extras
      .map((e) => `${e.type}${e.size ? `(${e.size})` : ""} x${e.quantity}`)
      .join(" | ") || "";
  return s || "Nenhum";
}

export async function GET() {
  // ✅ Só pedidos pagos
  const orders = await prisma.order.findMany({
    where: { status: "PAID" },
    include: {
      participants: {
        include: { extras: true },
      },
    },
  });

  /**
   * Vamos “achatar” tudo em linhas e depois ordenar.
   * Assim dá pra ordenar por modalidade / número / integrante / nome
   * sem depender do orderBy do Prisma em relações.
   */
  type Row = {
    modalityId: string;
    kind: "solo" | "duplas" | "equipes";
    groupNumber: number | null; // bib do grupo (duplas/equipes)
    bibNumber: number | null; // bib individual (solo) ou bib grupo (duplas/equipes)
    memberIndex: number | null;
    participantName: string;
    tshirtSize: string | null;
    extrasStr: string;
  };

  const flat: Row[] = [];

  for (const order of orders) {
    const kind = modalityKind(order.modalityId);

    // ✅ Para duplas/equipes: todos compartilham o mesmo número (bibNumber).
    // Pega o primeiro bib não-nulo como número do grupo.
    const groupBib =
      kind === "solo"
        ? null
        : (order.participants.find((p) => p.bibNumber != null)?.bibNumber ?? null);

    // Ordena integrantes 1..N (quando for grupo)
    const participantsSorted =
      kind === "solo"
        ? order.participants
        : [...order.participants].sort(
            (a, b) => (a.teamIndex ?? 0) - (b.teamIndex ?? 0)
          );

    for (const p of participantsSorted) {
      const bib = kind === "solo" ? (p.bibNumber ?? null) : groupBib;

      flat.push({
        modalityId: order.modalityId,
        kind,
        groupNumber: groupBib,
        bibNumber: bib,
        memberIndex: kind === "solo" ? null : (p.teamIndex ?? null),
        participantName: p.fullName ?? "",
        tshirtSize: p.tshirtSize ?? "",
        extrasStr: extrasToStr(p.extras as any),
      });
    }
  }

  // ✅ Ordenação final para ficar “visual”
  flat.sort((a, b) => {
    // 1) modalidade (ordem humana)
    const mr = modalityRank(a.modalityId) - modalityRank(b.modalityId);
    if (mr !== 0) return mr;

    // 2) número (bib)
    const ab = a.bibNumber ?? 0;
    const bb = b.bibNumber ?? 0;
    if (ab !== bb) return ab - bb;

    // 3) integrante (teamIndex)
    const ai = a.memberIndex ?? 0;
    const bi = b.memberIndex ?? 0;
    if (ai !== bi) return ai - bi;

    // 4) nome
    return (a.participantName || "").localeCompare(b.participantName || "", "pt-BR");
  });

  // ✅ Cabeçalho enxuto e útil
  const header = ["modalidade", "numero", "integrante", "nome", "camisa", "extras"].join(";");

  const rows: string[] = [header];

  for (const r of flat) {
    rows.push(
      [
        r.modalityId,
        r.bibNumber ?? "",
        r.memberIndex ?? "",
        r.participantName,
        r.tshirtSize ?? "",
        r.extrasStr,
      ]
        .map(escapeCsvValue)
        .join(";")
    );
  }

  const csv = rows.join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="inscricoes-pagas.csv"',
    },
  });
}