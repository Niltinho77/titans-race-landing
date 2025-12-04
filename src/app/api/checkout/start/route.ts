// src/app/api/checkout/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EXTRAS, getModalityById, ExtraType } from "@/config/checkout";
import { stripe } from "@/lib/stripe";

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
        { error: "É necessário aceitar o regulamento." },
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

    // 💰 Cálculo do valor base (centavos)
    const baseAmount = modality.basePrice * body.tickets;

    // 💰 Cálculo dos extras (centavos)
    const extrasAmount = body.participants.reduce((total, participant) => {
      if (!participant.extras) return total;

      const extrasSum = participant.extras.reduce((subTotal, extra) => {
        const config = EXTRAS.find((e) => e.id === extra.type);
        if (!config) return subTotal;

        const quantity = extra.quantity && extra.quantity > 0 ? extra.quantity : 1;
        return subTotal + config.price * quantity;
      }, 0);

      return total + extrasSum;
    }, 0);

    const totalAmount = baseAmount + extrasAmount;

    if (totalAmount <= 0) {
      return NextResponse.json(
        {
          error:
            "Valor total da inscrição é zero. Defina os preços das modalidades e extras antes de habilitar o pagamento.",
        },
        { status: 400 }
      );
    }

    // 💾 Cria Order no banco
    const order = await prisma.order.create({
      data: {
        modalityId: modality.id,
        tickets: body.tickets,
        status: "PENDING",
        termsAccepted: body.termsAccepted,
        totalAmount,
        participants: {
          create: body.participants.map((p) => ({
            fullName: p.fullName,
            cpf: p.cpf,
            birthDate: p.birthDate,
            phone: p.phone,
            email: p.email,
            city: p.city ?? "",
            state: p.state ?? "",
            tshirtSize: p.tshirtSize,
            emergencyName: p.emergencyName ?? "",
            emergencyPhone: p.emergencyPhone ?? "",
            healthInfo: p.healthInfo ?? "",
            extras: {
              create:
                p.extras?.map((e) => ({
                  type: e.type,
                  size: e.size ?? null,
                  quantity: e.quantity && e.quantity > 0 ? e.quantity : 1,
                })) ?? [],
            },
          })),
        },
      },
    });

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    // 🧾 Cria a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: "brl",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "brl",
            unit_amount: totalAmount, // centavos
            product_data: {
              name: `Titans Race – ${modality.name}`,
              description: `Ingressos: ${body.tickets}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        orderId: order.id,
        modalityId: modality.id,
      },
      success_url: `${siteUrl}/checkout/sucesso?orderId=${order.id}`,
      cancel_url: `${siteUrl}/checkout?modality=${modality.id}&cancelled=1`,
    });

    return NextResponse.json(
      {
        orderId: order.id,
        totalAmount: order.totalAmount,
        checkoutUrl: session.url,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Erro em /api/checkout/start:", err);
    return NextResponse.json(
      { error: "Erro ao iniciar checkout." },
      { status: 500 }
    );
  }
}