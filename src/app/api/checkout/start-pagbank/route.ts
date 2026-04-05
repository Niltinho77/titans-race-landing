// src/app/api/checkout/start-pagbank/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  EXTRAS,
  getModalityById,
  ExtraType,
} from "@/config/checkout";
import { createPagbankCheckout } from "@/lib/pagbank";

export const runtime = "nodejs";

type ParticipantExtraPayload = {
  type: ExtraType;
  size?: string;
  quantity: number;
};

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

const FEE_PERCENT = 0.0399;
const FEE_FIXED = 39;

function applyFee(amountCents: number) {
  if (amountCents <= 0) {
    return { totalWithFee: 0, feeAmount: 0 };
  }

  const bruto = (amountCents + FEE_FIXED) / (1 - FEE_PERCENT);
  const totalWithFee = Math.round(bruto);

  return {
    totalWithFee,
    feeAmount: totalWithFee - amountCents,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckoutPayload;

    const modality = getModalityById(body.modalityId);
    if (!modality) {
      return NextResponse.json(
        { error: "Modalidade inválida." },
        { status: 400 }
      );
    }

    if (!body.termsAccepted) {
      return NextResponse.json(
        { error: "Aceite o regulamento." },
        { status: 400 }
      );
    }

    if (!body.tickets || body.tickets < 1) {
      return NextResponse.json(
        { error: "Quantidade de ingressos inválida." },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.participants) || body.participants.length === 0) {
      return NextResponse.json(
        { error: "Nenhum participante informado." },
        { status: 400 }
      );
    }

    const ticketsAmount = modality.basePrice * body.tickets;

    const extrasAmount = body.participants.reduce((total, participant) => {
      const extrasTotal = (participant.extras ?? []).reduce((subTotal, extra) => {
        const config = EXTRAS.find((item) => item.id === extra.type);
        if (!config) return subTotal;

        const quantity =
          typeof extra.quantity === "number" && extra.quantity > 0
            ? extra.quantity
            : 1;

        return subTotal + config.price * quantity;
      }, 0);

      return total + extrasTotal;
    }, 0);

    const subtotal = ticketsAmount + extrasAmount;

    if (subtotal <= 0) {
      return NextResponse.json(
        { error: "Valor total inválido." },
        { status: 400 }
      );
    }

    const { totalWithFee, feeAmount } = applyFee(subtotal);

    const order = await prisma.order.create({
      data: {
        modalityId: modality.id,
        tickets: body.tickets,
        status: "PENDING",
        termsAccepted: body.termsAccepted,

        ticketsAmount,
        extrasAmount,
        totalAmount: subtotal,
        feeAmount,
        totalAmountWithFee: totalWithFee,

        participants: {
          create: body.participants.map((participant) => ({
            fullName: participant.fullName,
            cpf: participant.cpf,
            birthDate: participant.birthDate,
            phone: participant.phone,
            email: participant.email,
            city: participant.city ?? null,
            state: participant.state ?? null,
            tshirtSize: participant.tshirtSize,
            emergencyName: participant.emergencyName ?? null,
            emergencyPhone: participant.emergencyPhone ?? null,
            healthInfo: participant.healthInfo ?? null,
            extras: {
              create: (participant.extras ?? []).map((extra) => ({
                type: extra.type,
                size: extra.size ?? null,
                quantity:
                  typeof extra.quantity === "number" && extra.quantity > 0
                    ? extra.quantity
                    : 1,
              })),
            },
          })),
        },
      },
    });

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const checkout = await createPagbankCheckout({
      orderId: order.id,
      amount: totalWithFee,
      description: `Titans Race – ${modality.name}`,
      redirectUrl: `${siteUrl}/checkout/sucesso?orderId=${order.id}`,
      notificationUrl: `${siteUrl}/api/pagbank/webhook`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        pagbankCheckoutId: checkout.id,
      },
    });

    return NextResponse.json(
      {
        orderId: order.id,
        checkoutUrl: checkout.checkoutUrl,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Erro checkout PagBank:", err);

    return NextResponse.json(
      { error: "Erro ao iniciar checkout PagBank." },
      { status: 500 }
    );
  }
}