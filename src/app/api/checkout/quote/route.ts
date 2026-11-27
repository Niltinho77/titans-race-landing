import { NextResponse } from "next/server";
import { getModalityById } from "@/config/checkout";
import { getParticipantsPerTicket } from "@/config/lots";
import { getSellingLot, quoteTickets } from "@/lib/lotPricing";

// Calcula o valor dos ingressos no lote vigente e o desconto de veterano por CPF.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const modality = getModalityById(body?.modalityId);
    const tickets = Number(body?.tickets);
    const cpfs: unknown[] = Array.isArray(body?.cpfs) ? body.cpfs : [];

    if (!modality || !Number.isInteger(tickets) || tickets < 1 || tickets > 20) {
      return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
    }
    if (cpfs.length > tickets * getParticipantsPerTicket(modality.id)) {
      return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
    }

    const lot = await getSellingLot();
    const quote = await quoteTickets({ modalityId: modality.id, tickets, cpfs, lot });

    return NextResponse.json({
      ...quote,
      lotName: lot.name,
      veteransOnly: lot.veteransOnly,
    });
  } catch (error) {
    console.error("Erro ao calcular cotação do lote:", error);
    return NextResponse.json({ error: "Não foi possível calcular o valor." }, { status: 500 });
  }
}
