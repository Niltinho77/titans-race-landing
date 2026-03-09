// src/app/api/admin/export-inscricoes/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function modalityKind(modalityId: string) {
  if (modalityId === "equipes") return "equipes" as const;
  if (modalityId === "duplas") return "duplas" as const;
  return "solo" as const;
}

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

function formatDateBR(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export async function GET() {
  const orders = await prisma.order.findMany({
    where: { status: "PAID" },
    include: {
      participants: {
        include: { extras: true },
      },
    },
  });

  type Row = {
    modalityId: string;
    kind: "solo" | "duplas" | "equipes";
    groupNumber: number | null;
    bibNumber: number | null;
    memberIndex: number | null;
    participantName: string;
    tshirtSize: string | null;
    extrasStr: string;
    createdAt: Date;
  };

  const flat: Row[] = [];

  for (const order of orders) {
    const kind = modalityKind(order.modalityId);

    const groupBib =
      kind === "solo"
        ? null
        : (order.participants.find((p) => p.bibNumber != null)?.bibNumber ?? null);

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
        createdAt: order.createdAt,
      });
    }
  }

  flat.sort((a, b) => {
    const mr = modalityRank(a.modalityId) - modalityRank(b.modalityId);
    if (mr !== 0) return mr;

    const ab = a.bibNumber ?? 0;
    const bb = b.bibNumber ?? 0;
    if (ab !== bb) return ab - bb;

    const ai = a.memberIndex ?? 0;
    const bi = b.memberIndex ?? 0;
    if (ai !== bi) return ai - bi;

    return (a.participantName || "").localeCompare(b.participantName || "", "pt-BR");
  });

  const header = [
    "dataInscricao",
    "dataInscricaoISO",
    "modalidade",
    "numero",
    "integrante",
    "nome",
    "camisa",
    "extras",
  ].join(";");

  const rows: string[] = [header];

  for (const r of flat) {
    rows.push(
      [
        formatDateBR(r.createdAt),
        r.createdAt.toISOString(),
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