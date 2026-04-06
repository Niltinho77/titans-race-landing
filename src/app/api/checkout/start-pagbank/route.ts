// src/app/api/checkout/start-pagbank/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EXTRAS, getModalityById, ExtraType } from "@/config/checkout";
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
  couponCode?: string | null;
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

function onlyDigits(value: string | undefined | null) {
  return (value ?? "").replace(/\D/g, "");
}

function getSiteUrl(req: NextRequest) {
  const envUrl =
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL;

  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  const origin = req.headers.get("origin");
  if (origin) {
    return origin.replace(/\/$/, "");
  }

  return "http://localhost:3000";
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

    if (body.participants.length !== body.tickets) {
      return NextResponse.json(
        {
          error:
            "A quantidade de participantes deve ser igual à quantidade de inscrições.",
        },
        { status: 400 }
      );
    }

    for (const participant of body.participants) {
      if (!participant.fullName?.trim() || participant.fullName.trim().length < 3) {
        return NextResponse.json(
          { error: "Nome do participante inválido." },
          { status: 400 }
        );
      }

      if (!participant.email?.trim()) {
        return NextResponse.json(
          { error: "E-mail do participante inválido." },
          { status: 400 }
        );
      }

      if (!participant.cpf?.trim()) {
        return NextResponse.json(
          { error: "CPF do participante inválido." },
          { status: 400 }
        );
      }

      if (!participant.phone?.trim()) {
        return NextResponse.json(
          { error: "Telefone do participante inválido." },
          { status: 400 }
        );
      }
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

    const normalizedCoupon =
      typeof body.couponCode === "string" && body.couponCode.trim().length > 0
        ? body.couponCode.trim().toUpperCase()
        : null;

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

        // Se já existir esse campo no schema, descomenta:
        // couponCode: normalizedCoupon,

        participants: {
          create: body.participants.map((participant) => ({
            fullName: participant.fullName.trim(),
            cpf: onlyDigits(participant.cpf),
            birthDate: participant.birthDate,
            phone: onlyDigits(participant.phone),
            email: participant.email.trim().toLowerCase(),
            city: participant.city?.trim() || null,
            state: participant.state?.trim() || null,
            tshirtSize: participant.tshirtSize,
            emergencyName: participant.emergencyName?.trim() || null,
            emergencyPhone: participant.emergencyPhone
              ? onlyDigits(participant.emergencyPhone)
              : null,
            healthInfo: participant.healthInfo?.trim() || null,
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
      include: {
        participants: true,
      },
    });

    const payer = order.participants[0];
    const siteUrl = getSiteUrl(req);

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
  } catch (err: any) {
    console.error("Erro checkout PagBank:", err);

    return NextResponse.json(
      {
        error:
          err?.message || "Erro ao iniciar checkout PagBank.",
      },
      { status: 500 }
    );
  }
}