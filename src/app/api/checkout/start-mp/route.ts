import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, CouponType } from "@prisma/client";
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
  couponCode?: string | null; // ✅ novo
};

// ✅ taxa
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

function normalizeCode(code: unknown) {
  if (typeof code !== "string") return null;
  const normalized = code.trim().toUpperCase();
  return normalized.length ? normalized : null;
}

function isDateInWindow(now: Date, startsAt?: Date | null, expiresAt?: Date | null) {
  if (startsAt && now < startsAt) return false;
  if (expiresAt && now > expiresAt) return false;
  return true;
}

async function validateAndComputeCoupon(params: {
  tx: Prisma.TransactionClient;
  code: string | null;
  modalityId: string;
  subtotal: number; // centavos
}) {
  const { tx, code, modalityId, subtotal } = params;

  if (!code) {
    return { coupon: null as any, discountAmount: 0 };
  }

  const coupon = await tx.coupon.findUnique({
    where: { code },
  });

  if (!coupon || !coupon.active) {
    return { error: "Cupom inválido." as const };
  }

  const now = new Date();

  if (!isDateInWindow(now, coupon.startsAt, coupon.expiresAt)) {
    return { error: "Cupom fora do período de validade." as const };
  }

  if (coupon.modalityId && coupon.modalityId !== modalityId) {
    return { error: "Cupom não é válido para esta modalidade." as const };
  }

  if (typeof coupon.minSubtotal === "number" && subtotal < coupon.minSubtotal) {
    return { error: "Subtotal abaixo do mínimo para este cupom." as const };
  }

  // ⚠️ Percentual somente (mas deixei FIXED protegido caso exista no enum)
  let discountAmount = 0;

  if (coupon.type === CouponType.PERCENT) {
    const pct = Math.max(0, Math.min(100, coupon.amount)); // 0..100
    discountAmount = Math.round((subtotal * pct) / 100);
  } else {
    // Se tu realmente vai usar só percent, dá até pra retornar erro aqui:
    // return { error: "Cupom inválido (tipo não suportado)." as const };
    discountAmount = Math.max(0, coupon.amount);
  }

  discountAmount = Math.min(discountAmount, subtotal);

  // ✅ maxUses (limite global)
  if (typeof coupon.maxUses === "number" && coupon.usedCount >= coupon.maxUses) {
    return { error: "Cupom atingiu o limite de usos." as const };
  }

  return { coupon, discountAmount };
}

/**
 * Reserva N números sequenciais para uma modalidade (atômico no Postgres).
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

  await tx.bibCounter.upsert({
    where: { id: modalityId },
    create: { id: modalityId, nextNumber: startAt },
    update: {},
  });

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

    // ✅ totais brutos
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

    const subtotal = ticketsAmount + extrasAmount;

    if (subtotal <= 0) {
      return NextResponse.json(
        { error: "Valor total zero. Defina preços antes de habilitar pagamento." },
        { status: 400 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const notificationUrl =
      process.env.MP_WEBHOOK_URL ?? `${siteUrl}/api/mercadopago/webhook`;

    const normalizedCoupon = normalizeCode(body.couponCode);

    // ✅ Criação do pedido + bibs + validação cupom numa transação
    const order = await prisma.$transaction(async (tx) => {
      // ✅ valida cupom em "fonte de verdade"
      const couponResult = await validateAndComputeCoupon({
        tx,
        code: normalizedCoupon,
        modalityId: modality.id,
        subtotal,
      });

      if ("error" in couponResult) {
        throw new Error(couponResult.error);
      }

      const coupon = couponResult.coupon; // Coupon | null
      const discountAmount = couponResult.discountAmount; // centavos
      const discountedTotalAmount = Math.max(0, subtotal - discountAmount);

      // ✅ taxa sobre total líquido
      const { totalWithFee, feeAmount } = applyFee(discountedTotalAmount);

      // ✅ bibs
      const needGroupBib = modalityId === "duplas" || modalityId === "equipes";
      const bibQty = needGroupBib ? body.tickets : body.participants.length;

      const bibs = await reserveBibNumbers(tx, modalityId, bibQty);

      const created = await tx.order.create({
        data: {
          modalityId: modality.id,
          tickets: body.tickets,
          status: "PENDING",
          termsAccepted: body.termsAccepted,

          // ✅ valores
          ticketsAmount,
          extrasAmount,

          // totalAmount: valor líquido final (após desconto)
          totalAmount: discountedTotalAmount,

          discountAmount: discountAmount || null,
          discountedTotalAmount: discountedTotalAmount || null,

          couponCode: coupon?.code ?? null, // ✅ relacionamento com Coupon

          feeAmount,
          totalAmountWithFee: totalWithFee,

          participants: {
            create: body.participants.map((p, idx) => {
              const groupIndex = Math.floor(idx / perTicket);
              const bibNumber = needGroupBib ? bibs[groupIndex] : bibs[idx];

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

      // ✅ Retorna também os valores calculados pra montar o MP
      return {
        order: created,
        totalWithFee,
        discountAmount,
        discountedTotalAmount,
        couponCode: coupon?.code ?? null,
      };
    });

    // ✅ Criar preferência MP (valor final com taxa já considerando desconto)
    const preference = await mpPreference.create({
      body: {
        items: [
          {
            id: modality.id,
            title: `Titans Race – ${modality.name}`,
            quantity: 1,
            currency_id: "BRL",
            unit_price: Number((order.totalWithFee / 100).toFixed(2)),
          },
        ],

        external_reference: order.order.id,
        notification_url: notificationUrl,

        back_urls: {
          success: `${siteUrl}/checkout/sucesso?orderId=${order.order.id}`,
          pending: `${siteUrl}/checkout/pendente`,
          failure: `${siteUrl}/checkout/falha?orderId=${order.order.id}`,
        },

        auto_return: "approved",
        statement_descriptor: "TITANS RACE",

        metadata: {
          orderId: order.order.id,
          modalityId: modality.id,
          couponCode: order.couponCode,
          discountAmount: order.discountAmount,
          discountedTotalAmount: order.discountedTotalAmount,
        },
      },
    });

    await prisma.order.update({
      where: { id: order.order.id },
      data: { mpPreferenceId: preference.id },
    });

    return NextResponse.json(
      { orderId: order.order.id, checkoutUrl: preference.init_point },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Erro em /api/checkout/start-mp:", err);

    // ✅ se for erro controlado (cupom inválido etc.)
    const msg = typeof err?.message === "string" ? err.message : "Erro ao iniciar checkout.";
    if (
      msg.includes("Cupom") ||
      msg.includes("Subtotal") ||
      msg.includes("modalidade") ||
      msg.includes("validade") ||
      msg.includes("limite")
    ) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({ error: "Erro ao iniciar checkout." }, { status: 500 });
  }
}