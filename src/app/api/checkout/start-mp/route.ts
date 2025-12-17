import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EXTRAS, getModalityById, ExtraType } from "@/config/checkout";
import { mpPreference } from "@/lib/mercadopago";

type ParticipantExtraPayload = { type: ExtraType; size?: string; quantity: number };
type ParticipantPayload = {
  fullName: string; cpf: string; birthDate: string; phone: string; email: string;
  city?: string; state?: string; tshirtSize: string;
  emergencyName?: string; emergencyPhone?: string; healthInfo?: string;
  extras: ParticipantExtraPayload[];
};
type CheckoutPayload = {
  modalityId: string;
  tickets: number;
  participants: ParticipantPayload[];
  termsAccepted: boolean;
};

// ✅ sua taxa “da plataforma” pode continuar igual (só muda o gateway)
const FEE_PERCENT = 0.0399;
const FEE_FIXED = 39; // centavos

function applyFee(amountCents: number) {
  if (amountCents <= 0) return { totalWithFee: 0, feeAmount: 0 };
  const bruto = (amountCents + FEE_FIXED) / (1 - FEE_PERCENT);
  const totalWithFee = Math.round(bruto);
  return { totalWithFee, feeAmount: totalWithFee - amountCents };
}

export async function POST(req: NextRequest) {
  try {
    if (!mpPreference) {
      return NextResponse.json({ error: "Mercado Pago não configurado." }, { status: 500 });
    }

    const body = (await req.json()) as CheckoutPayload;

    const modality = getModalityById(body.modalityId);
    if (!modality) return NextResponse.json({ error: "Modalidade inválida." }, { status: 400 });

    if (!body.termsAccepted) {
      return NextResponse.json({ error: "É necessário aceitar o regulamento." }, { status: 400 });
    }

    if (!body.tickets || body.tickets < 1) {
      return NextResponse.json({ error: "Quantidade de ingressos inválida." }, { status: 400 });
    }

    if (!Array.isArray(body.participants) || body.participants.length === 0) {
      return NextResponse.json({ error: "Nenhum participante informado." }, { status: 400 });
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

    const order = await prisma.order.create({
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
              create: (p.extras ?? []).map((e) => ({
                type: e.type,
                size: e.size ?? null,
                quantity: e.quantity && e.quantity > 0 ? e.quantity : 1,
              })),
            },
          })),
        },
      },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const notificationUrl = process.env.MP_WEBHOOK_URL; // webhook público

    const preference = await mpPreference.create({
      body: {
        items: [
          {
              title: `Titans Race – ${modality.name}`,
              quantity: 1,
              currency_id: "BRL",
              unit_price: Number((totalWithFee / 100).toFixed(2)),
              id: ""
          },
        ],
        external_reference: order.id, // ✅ chave do seu pedido
        notification_url: notificationUrl,
        back_urls: {
          success: `${siteUrl}/checkout/sucesso?orderId=${order.id}`,
          pending: `${siteUrl}/checkout/pendente?orderId=${order.id}`,
          failure: `${siteUrl}/checkout?modality=${modality.id}&cancelled=1`,
        },
        auto_return: "approved",
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { mpPreferenceId: preference.id },
    });

    return NextResponse.json(
      { orderId: order.id, checkoutUrl: preference.init_point },
      { status: 201 }
    );
  } catch (err) {
    console.error("Erro em /api/checkout/start-mp:", err);
    return NextResponse.json({ error: "Erro ao iniciar checkout." }, { status: 500 });
  }
}
