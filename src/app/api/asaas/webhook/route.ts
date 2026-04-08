// src/app/api/asaas/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { getModalityById } from "@/config/checkout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AsaasWebhookPayload = {
  id?: string;
  event?: string;
  payment?: {
    id?: string;
    status?: string;
    externalReference?: string | null;
    invoiceUrl?: string | null;
    checkoutSession?: string | null;
  };
  checkout?: {
    id?: string;
    status?: string;
    externalReference?: string | null;
    link?: string | null;
  };
};

function mapAsaasEventToOrderStatus(event?: string): string | null {
  switch (event) {
    case "PAYMENT_CREATED":
    case "PAYMENT_AWAITING_RISK_ANALYSIS":
    case "PAYMENT_APPROVED_BY_RISK_ANALYSIS":
    case "PAYMENT_AUTHORIZED":
    case "CHECKOUT_CREATED":
      return "PENDING";

    case "PAYMENT_CONFIRMED":
    case "PAYMENT_RECEIVED":
    case "CHECKOUT_PAID":
      return "PAID";

    case "PAYMENT_OVERDUE":
    case "CHECKOUT_EXPIRED":
      return "OVERDUE";

    case "PAYMENT_DELETED":
    case "CHECKOUT_CANCELED":
      return "CANCELED";

    case "PAYMENT_REFUNDED":
      return "REFUNDED";

    case "PAYMENT_PARTIALLY_REFUNDED":
      return "PARTIALLY_REFUNDED";

    case "PAYMENT_REPROVED_BY_RISK_ANALYSIS":
    case "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED":
      return "FAILED";

    default:
      return null;
  }
}

function getWebhookTokenFromHeader(req: NextRequest) {
  return req.headers.get("asaas-access-token")?.trim() ?? null;
}

function shouldUpdateOrderStatus(current: string, next: string | null) {
  if (!next) return false;

  if (current === "PAID" && next === "PENDING") return false;
  if (current === "REFUNDED") return false;
  if (current === "PARTIALLY_REFUNDED" && next === "PENDING") return false;

  return true;
}

export async function POST(req: NextRequest) {
  try {
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN?.trim() ?? null;
    const receivedToken = getWebhookTokenFromHeader(req);

    if (!expectedToken) {
      console.error("[ASAAS WEBHOOK] ASAAS_WEBHOOK_TOKEN não configurado.");
      return NextResponse.json(
        { received: false, error: "ASAAS_WEBHOOK_TOKEN não configurado." },
        { status: 500 }
      );
    }

    if (!receivedToken || receivedToken !== expectedToken) {
      console.warn("[ASAAS WEBHOOK] Token inválido ou ausente.");
      return NextResponse.json(
        { received: false, error: "Token do webhook inválido." },
        { status: 401 }
      );
    }

    const body = (await req.json()) as AsaasWebhookPayload;

    const eventId = body.id ?? null;
    const event = body.event ?? null;
    const payment = body.payment ?? null;
    const checkout = body.checkout ?? null;

    const externalReference =
      payment?.externalReference ?? checkout?.externalReference ?? null;

    const checkoutSessionId =
      payment?.checkoutSession ?? checkout?.id ?? null;

    const asaasPaymentId =
      payment?.id ?? checkout?.id ?? null;

    const asaasPaymentStatus =
      payment?.status ?? checkout?.status ?? event ?? null;

    const asaasInvoiceUrl =
      payment?.invoiceUrl ?? checkout?.link ?? null;

    if (!event) {
      return NextResponse.json(
        {
          received: true,
          ignored: true,
          reason: "Payload sem event.",
        },
        { status: 200 }
      );
    }

    let order = externalReference
      ? await prisma.order.findUnique({
          where: { id: externalReference },
          include: {
            participants: true,
          },
        })
      : null;

    if (!order && checkoutSessionId) {
      order = await prisma.order.findFirst({
        where: { asaasCheckoutId: checkoutSessionId },
        include: {
          participants: true,
        },
      });
    }

    if (!order) {
      console.warn("[ASAAS WEBHOOK] Pedido não encontrado:", {
        eventId,
        event,
        externalReference,
        checkoutSessionId,
      });

      return NextResponse.json(
        {
          received: true,
          ignored: true,
          reason: "Pedido não encontrado.",
        },
        { status: 200 }
      );
    }

    const mappedStatus = mapAsaasEventToOrderStatus(event);

    const updateData: {
      asaasPaymentId?: string | null;
      asaasPaymentStatus?: string | null;
      asaasInvoiceUrl?: string | null;
      status?: string;
    } = {
      asaasPaymentId,
      asaasPaymentStatus,
    };

    if (asaasInvoiceUrl) {
      updateData.asaasInvoiceUrl = asaasInvoiceUrl;
    }

    if (shouldUpdateOrderStatus(order.status, mappedStatus)) {
      updateData.status = mappedStatus!;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: updateData,
      include: {
        participants: true,
      },
    });

    const becamePaid =
      updateData.status === "PAID" && order.status !== "PAID";

    const recipients = Array.from(
  new Map(
    updatedOrder.participants
      .filter((p) => p.email && p.email.trim().length > 0)
      .map((p) => [p.email.trim().toLowerCase(), p])
  ).values()
);

const modality = getModalityById(updatedOrder.modalityId);

if (becamePaid && !updatedOrder.confirmationEmailSentAt && recipients.length > 0) {
  try {
    for (const participant of recipients) {
      await sendOrderConfirmationEmail({
        to: participant.email.trim().toLowerCase(),
        participantName: participant.fullName,
        orderId: updatedOrder.id,
        modalityName: modality?.name ?? updatedOrder.modalityId,
        totalAmount:
          updatedOrder.totalAmountWithFee ??
          updatedOrder.totalAmount ??
          0,
      });
    }

    await prisma.order.update({
      where: { id: updatedOrder.id },
      data: {
        confirmationEmailSentAt: new Date(),
      },
    });

    console.log("[ASAAS WEBHOOK] E-mails de confirmação enviados:", {
      orderId: updatedOrder.id,
      recipients: recipients.map((p) => p.email),
    });
  } catch (emailError) {
    console.error(
      "[ASAAS WEBHOOK] Falha ao enviar e-mails de confirmação:",
      emailError
    );
  }
}  
    
    console.log("[ASAAS WEBHOOK] Pedido atualizado com sucesso:", {
      eventId,
      event,
      orderId: updatedOrder.id,
      externalReference,
      checkoutSessionId,
      asaasPaymentId,
      asaasPaymentStatus,
      mappedStatus,
    });

    return NextResponse.json(
      {
        received: true,
        orderId: updatedOrder.id,
        eventId,
        event,
        mappedStatus: mappedStatus ?? null,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[ASAAS WEBHOOK] Erro interno:", error);

    return NextResponse.json(
      {
        received: false,
        error: error?.message || "Erro interno no webhook Asaas.",
      },
      { status: 500 }
    );
  }
}