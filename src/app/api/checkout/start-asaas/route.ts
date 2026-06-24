// src/app/api/checkout/start-asaas/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  EXTRAS,
  ModalityId,
  getModalityById,
  PAYMENT_FEE,
} from "@/config/checkout";
import {
  centsToAsaasValue,
  createAsaasCheckout,
  normalizeCpfCnpj,
  normalizePhone,
} from "@/lib/asaas";

type ExtraType = "camisa" | "luva" | "meia";

type ParticipantExtraInput = {
  type: ExtraType;
  size?: string;
  quantity?: number;
};

type ParticipantInput = {
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
  extras?: ParticipantExtraInput[];
};

type CheckoutPayload = {
  modalityId: ModalityId;
  tickets: number;
  participants: ParticipantInput[];
  termsAccepted: boolean;
  couponCode?: string | null;
};

function calculateFee(amountCents: number) {
  if (amountCents <= 0) {
    return { totalWithFee: 0, feeAmount: 0 };
  }

  const bruto = (amountCents + PAYMENT_FEE.fixed) / (1 - PAYMENT_FEE.percent);
  const totalWithFee = Math.round(bruto);
  const feeAmount = totalWithFee - amountCents;

  return { totalWithFee, feeAmount };
}

function getParticipantsPerTicket(modalityId: ModalityId) {
  if (modalityId === "duplas") return 2;
  if (modalityId === "equipes") return 4;
  return 1;
}

function normalizeCoupon(code?: string | null) {
  const normalized = code?.trim().toUpperCase() ?? "";
  return normalized.length > 0 ? normalized : null;
}

function getBaseUrl(req: Request) {
  const envBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envBaseUrl) return envBaseUrl.replace(/\/+$/, "");

  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CheckoutPayload;

    const modality = getModalityById(body.modalityId);
    if (!modality) {
      return NextResponse.json(
        { error: "Modalidade inválida." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(body.tickets) || body.tickets < 1) {
      return NextResponse.json(
        { error: "Quantidade de ingressos inválida." },
        { status: 400 }
      );
    }

    if (!body.termsAccepted) {
      return NextResponse.json(
        { error: "É necessário aceitar os termos para continuar." },
        { status: 400 }
      );
    }

    const expectedParticipants =
      body.tickets * getParticipantsPerTicket(body.modalityId);

    if (!Array.isArray(body.participants) || body.participants.length !== expectedParticipants) {
      return NextResponse.json(
        {
          error: `Quantidade de participantes inválida para a modalidade ${modality.name}.`,
        },
        { status: 400 }
      );
    }

    const ticketsAmount = body.tickets * modality.basePrice;

    let extrasAmount = 0;

    for (const participant of body.participants) {
      for (const extra of participant.extras ?? []) {
        const config = EXTRAS.find((item) => item.id === extra.type);
        if (!config) continue;

        const quantity = Math.max(1, Number(extra.quantity) || 1);
        extrasAmount += config.price * quantity;
      }
    }

    const subtotal = ticketsAmount + extrasAmount;
    const couponCode = normalizeCoupon(body.couponCode);

    let discountAmount = 0;
    let appliedCouponCode: string | null = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: { equals: couponCode, mode: "insensitive" },
        },
      });

      if (!coupon || !coupon.active) {
        return NextResponse.json(
          { error: "Cupom inválido ou inativo." },
          { status: 400 }
        );
      }

      const now = new Date();

      if (coupon.startsAt && coupon.startsAt > now) {
        return NextResponse.json(
          { error: "Cupom ainda não está válido." },
          { status: 400 }
        );
      }

      if (coupon.expiresAt && coupon.expiresAt < now) {
        return NextResponse.json(
          { error: "Cupom expirado." },
          { status: 400 }
        );
      }

      if (coupon.maxUses !== null && coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses) {
        return NextResponse.json(
          { error: "Cupom esgotado." },
          { status: 400 }
        );
      }

      if (coupon.modalityId && coupon.modalityId !== body.modalityId) {
        return NextResponse.json(
          { error: "Cupom não é válido para esta modalidade." },
          { status: 400 }
        );
      }

      if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
        return NextResponse.json(
          { error: "Subtotal mínimo não atingido para este cupom." },
          { status: 400 }
        );
      }

      if (coupon.type === "PERCENT") {
        discountAmount = Math.round(subtotal * (coupon.amount / 100));
      } else {
        discountAmount = coupon.amount;
      }

      discountAmount = Math.min(discountAmount, subtotal);
      appliedCouponCode = coupon.code;
    }

    const discountedTotalAmount = Math.max(0, subtotal - discountAmount);
    const { totalWithFee, feeAmount } = calculateFee(discountedTotalAmount);

    const teamMode = body.modalityId === "equipes";

    const order = await prisma.order.create({
      data: {
        modalityId: body.modalityId,
        tickets: body.tickets,
        status: "PENDING",
        termsAccepted: body.termsAccepted,

        ticketsAmount,
        extrasAmount,
        totalAmount: subtotal,
        discountAmount,
        discountedTotalAmount,
        feeAmount,
        totalAmountWithFee: totalWithFee,

        couponCode: appliedCouponCode,

        participants: {
          create: body.participants.map((participant, index) => ({
            fullName: participant.fullName.trim(),
            cpf: normalizeCpfCnpj(participant.cpf),
            birthDate: participant.birthDate,
            phone: normalizePhone(participant.phone),
            email: participant.email.trim().toLowerCase(),
            city: participant.city?.trim() || null,
            state: participant.state?.trim().toUpperCase() || null,
            tshirtSize: participant.tshirtSize,
            emergencyName: participant.emergencyName?.trim() || null,
            emergencyPhone: participant.emergencyPhone
              ? normalizePhone(participant.emergencyPhone)
              : null,
            healthInfo: participant.healthInfo?.trim() || null,
            teamIndex: teamMode ? Math.floor(index / 4) + 1 : null,
            extras: {
              create: (participant.extras ?? []).map((extra) => ({
                type: extra.type,
                size: extra.size || null,
                quantity: Math.max(1, Number(extra.quantity) || 1),
              })),
            },
          })),
        },
      },
      include: {
        participants: true,
      },
    });

    const responsibleParticipant = body.participants[0];
    const baseUrl = getBaseUrl(req);

    const checkout = await createAsaasCheckout({
      externalReference: order.id,
      minutesToExpire: 60,
      successUrl: `${baseUrl}/checkout/sucesso?orderId=${order.id}`,
      cancelUrl: `${baseUrl}/checkout/falha?orderId=${order.id}`,
      expiredUrl: `${baseUrl}/checkout/pendente?orderId=${order.id}`,
      items: [
        {
          name: `Titans Race - ${modality.name}`,
          description: `Pedido ${order.id}`,
          quantity: 1,
          value: centsToAsaasValue(totalWithFee),
        },
      ],
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        asaasCheckoutId: checkout.checkoutId,
        asaasPaymentStatus: "CHECKOUT_CREATED",
        asaasInvoiceUrl: checkout.checkoutUrl,
      },
    });

    if (!checkout.checkoutUrl) {
      return NextResponse.json(
        {
          orderId: order.id,
          warning:
            "Pedido criado, mas o Asaas não retornou uma URL de checkout utilizável.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      orderId: order.id,
      checkoutUrl: checkout.checkoutUrl,
    });
  } catch (error: any) {
    console.error("Erro ao iniciar checkout Asaas:", error);

    return NextResponse.json(
      {
        error:
          error?.message || "Não foi possível iniciar o pagamento com o Asaas.",
      },
      { status: 500 }
    );
  }
}
