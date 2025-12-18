import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { EXTRAS, getModalityById, ExtraType, ModalityId } from "@/config/checkout";
import { mpPreference } from "@/lib/mercadopago";

export const runtime = "nodejs";

type ParticipantExtraPayload = { type: ExtraType; size?: string; quantity: number };

type ParticipantPayload = {
  fullName: string;
  cpf: string;
  birthDate: string;
  phone: string;
  email: string;
  city?: string;
  state?: string;
  tshirtSize: string;
  emergencyName?: string;
  emergencyPhone?: string;
  healthInfo?: string;
  extras: ParticipantExtraPayload[];
};

type CheckoutPayload = {
  modalityId: string;
  tickets: number;
  participants: ParticipantPayload[];
  termsAccepted: boolean;
};

// ✅ sua taxa “da plataforma” pode continuar igual
const FEE_PERCENT = 0.0399;
const FEE_FIXED = 39; // centavos

function applyFee(amountCents: number) {
  if (amountCents <= 0) return { totalWithFee: 0, feeAmount: 0 };
  const bruto = (amountCents + FEE_FIXED) / (1 - FEE_PERCENT);
  const totalWithFee = Math.round(bruto);
  return { totalWithFee, feeAmount: totalWithFee - amountCents };
}

// ✅ regra centralizada (duplas/equipes)
function getParticipantsPerTicket(modalityId: ModalityId) {
  if (modalityId === "duplas") return 2;
  if (modalityId === "equipes") return 4;
  return 1;
}

/**
 * Reserva N números sequenciais para uma modalidade (atômico no Postgres).
 * Retorna um array [start..start+qty-1].
 *
 * Requer: tabela BibCounter com id = modalityId e nextNumber inicial.
 */

async function reserveBibNumbers(
  tx: Prisma.TransactionClient,
  modalityId: string,
  qty: number
): Promise<number[]> {
  if (qty <= 0) return [];

  const startMap: Record<string, number> = {
    kids: 0,
    diversao: 100,
    competicao: 500,
    duplas: 800,
    equipes: 900,
  };

  const startAt = startMap[modalityId] ?? 1000;

  // 1) garante que existe o contador
  await tx.bibCounter.upsert({
    where: { id: modalityId },
    create: { id: modalityId, nextNumber: startAt },
    update: {}, // não altera se já existe
  });

  // 2) incrementa de forma atômica e pega o novo nextNumber
  const updated = await tx.bibCounter.update({
    where: { id: modalityId },
    data: { nextNumber: { increment: qty } },
    select: { nextNumber: true },
  });

  const newNext = updated.nextNumber;
  const start = newNext - qty;

  return Array.from({ length: qty }, (_, i) => start + i);
}




export async function POST(req: NextRequest) {
  try {
    if (!mpPreference) {
      return NextResponse.json({ error: "Mercado Pago não configurado." }, { status: 500 });
    }

    const body = (await req.json()) as CheckoutPayload;

    const modality = getModalityById(body.modalityId);
    if (!modality) {
      return NextResponse.json({ error: "Modalidade inválida." }, { status: 400 });
    }

    const modalityId = modality.id as ModalityId;

    if (!body.termsAccepted) {
      return NextResponse.json({ error: "É necessário aceitar o regulamento." }, { status: 400 });
    }

    if (!body.tickets || body.tickets < 1) {
      return NextResponse.json({ error: "Quantidade de ingressos inválida." }, { status: 400 });
    }

    if (!Array.isArray(body.participants) || body.participants.length === 0) {
      return NextResponse.json({ error: "Nenhum participante informado." }, { status: 400 });
    }

    // ✅ validação de contagem por modalidade
    const perTicket = getParticipantsPerTicket(modalityId);
    const expectedParticipants = body.tickets * perTicket;

    if (body.participants.length !== expectedParticipants) {
      return NextResponse.json(
        {
          error: `Quantidade de participantes inválida para ${modality.name}. Esperado: ${expectedParticipants}, recebido: ${body.participants.length}.`,
        },
        { status: 400 }
      );
    }

    const ticketsAmount = modality.basePrice * body.tickets;

    const extrasAmount = body.participants.reduce((total, participant) => {
      const extrasSum = (participant.extras ?? []).reduce((sub, extra) => {
        const config = EXTRAS.find((e) => e.id === extra.type);
        if (!config) return sub;
        const qty = extra.quantity && extra.quantity > 0 ? extra.quantity : 1;
        return sub + config.price * qty;
      }, 0);
      return total + extrasSum;
    }, 0);

    const totalAmount = ticketsAmount + extrasAmount;

    if (totalAmount <= 0) {
      return NextResponse.json(
        { error: "Valor total zero. Defina preços antes de habilitar pagamento." },
        { status: 400 }
      );
    }

    const { totalWithFee, feeAmount } = applyFee(totalAmount);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const notificationUrl =
     process.env.MP_WEBHOOK_URL ?? `${siteUrl}/api/mercadopago/webhook`;

    // ✅ Criação do pedido + reserva de bibs numa transação (evita duplicidade)
    const order = await prisma.$transaction(async (tx) => {
      // ✅ QUANTOS BIBS RESERVAR?
      // - duplas/equipes: 1 bib por grupo => qty = tickets
      // - demais: 1 bib por participante => qty = participants.length
      const needGroupBib = modalityId === "duplas" || modalityId === "equipes";
      const bibQty = needGroupBib ? body.tickets : body.participants.length;

      const bibs = await reserveBibNumbers(tx, modalityId, bibQty);

      const created = await tx.order.create({
        data: {
          modalityId: modality.id,
          tickets: body.tickets,
          status: "PENDING",
          termsAccepted: body.termsAccepted,

          ticketsAmount,
          extrasAmount,
          totalAmount,
          feeAmount,
          totalAmountWithFee: totalWithFee,

          participants: {
            create: body.participants.map((p, idx) => {
              // ✅ groupIndex:
              // - duplas: cada 2 pessoas = 1 grupo
              // - equipes: cada 4 pessoas = 1 grupo
              // - demais: 1 pessoa = 1 grupo
              const groupIndex = Math.floor(idx / perTicket);

              // ✅ bibNumber:
              // - duplas/equipes: bib por grupo => bibs[groupIndex]
              // - demais: bib por participante => bibs[idx]
              const bibNumber = needGroupBib ? bibs[groupIndex] : bibs[idx];

              // ✅ teamIndex (posição dentro do grupo):
              // - duplas: 1..2
              // - equipes: 1..4
              // - demais: null
              const teamIndex =
                modalityId === "duplas" || modalityId === "equipes"
                  ? (idx % perTicket) + 1
                  : null;

              return {
                fullName: p.fullName,
                cpf: p.cpf,
                birthDate: p.birthDate,
                phone: p.phone,
                email: p.email,
                city: p.city ?? null,
                state: p.state ?? null,
                tshirtSize: p.tshirtSize,
                emergencyName: p.emergencyName ?? null,
                emergencyPhone: p.emergencyPhone ?? null,
                healthInfo: p.healthInfo ?? null,

                // ✅ campos novos no schema
                bibNumber,
                teamIndex,

                extras: {
                  create: (p.extras ?? []).map((e) => ({
                    type: e.type,
                    size: e.size ?? null,
                    quantity: e.quantity && e.quantity > 0 ? e.quantity : 1,
                  })),
                },
              };
            }),
          },
        },
      });

      return created;
    });

    // ✅ Criar preferência do Mercado Pago
    const preference = await mpPreference.create({
      body: {
        items: [
          {
            id: modality.id,
            title: `Titans Race – ${modality.name}`,
            quantity: 1,
            currency_id: "BRL",
            unit_price: Number((totalWithFee / 100).toFixed(2)),
          },
        ],

        external_reference: order.id,
        notification_url: notificationUrl,

        back_urls: {
          success: `${siteUrl}/checkout/sucesso?orderId=${order.id}`,
          pending: `${siteUrl}/checkout/pendente`,
          failure: `${siteUrl}/checkout/falha?orderId=${order.id}`,

          },
        auto_return: "approved",

        statement_descriptor: "TITANS RACE",
        metadata: { orderId: order.id, modalityId: modality.id },
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { mpPreferenceId: preference.id },
    });

    return NextResponse.json({ orderId: order.id, checkoutUrl: preference.init_point }, { status: 201 });
  } catch (err) {
    console.error("Erro em /api/checkout/start-mp:", err);
    return NextResponse.json({ error: "Erro ao iniciar checkout." }, { status: 500 });
  }
}
