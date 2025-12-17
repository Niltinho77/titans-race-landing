import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mpPayment } from "@/lib/mercadopago";
import { sendOrderConfirmationEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (!mpPayment) {
      return NextResponse.json({ error: "Mercado Pago não configurado." }, { status: 500 });
    }

    const body = await req.json().catch(() => null);

    // Mercado Pago pode mandar formatos diferentes.
    // O mais comum hoje: { type: "payment", data: { id: "123" } }
    const paymentId =
      body?.data?.id ?? body?.id ?? req.nextUrl.searchParams.get("id");

    if (!paymentId) {
      return NextResponse.json({ received: true, ignored: true }, { status: 200 });
    }

    // ✅ Validação “de verdade”: buscar pagamento na API do MP
    const payment = await mpPayment.get({ id: String(paymentId) });

    const status = payment.status; // approved / pending / rejected / etc
    const orderId = payment.external_reference; // seu order.id

    if (!orderId) {
      return NextResponse.json({ received: true, missingOrder: true }, { status: 200 });
    }

    // (opcional, mas muito bom) valida valores
    // payment.transaction_amount = valor em reais
    const paidAmountCents = Math.round(Number(payment.transaction_amount ?? 0) * 100);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { participants: true },
    });

    if (!order) {
      return NextResponse.json({ received: true, orderNotFound: true }, { status: 200 });
    }

    // ✅ Só aceita “approved” como pago
    if (status === "approved") {
      // evita duplicar e-mail / processamento
      const alreadyPaid = order.status === "PAID";
      const alreadyEmailed = !!order.confirmationEmailSentAt;

      // valida total (opcional, mas recomendado)
      const expected = order.totalAmountWithFee ?? 0;
      if (expected > 0 && paidAmountCents > 0 && paidAmountCents !== expected) {
        console.warn("Pagamento aprovado, mas valor diverge", {
          orderId,
          expected,
          paidAmountCents,
        });
        // você pode decidir: marcar como PAID mesmo assim, ou segurar e revisar manualmente
      }

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          mpPaymentId: String(paymentId),
          mpPaymentStatus: String(status),
        },
      });

      if (!alreadyPaid && !alreadyEmailed) {
        const main = order.participants[0];
        if (main) {
          await sendOrderConfirmationEmail({
            to: main.email,
            participantName: main.fullName,
            orderId: order.id,
            modalityName: order.modalityId,
            totalAmount: order.totalAmountWithFee ?? 0,
          });

          await prisma.order.update({
            where: { id: order.id },
            data: { confirmationEmailSentAt: new Date() },
          });
        }
      }
    } else if (status === "rejected" || status === "cancelled") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "FAILED",
          mpPaymentId: String(paymentId),
          mpPaymentStatus: String(status),
        },
      });
    } else {
      // pending / in_process etc
      await prisma.order.update({
        where: { id: order.id },
        data: {
          mpPaymentId: String(paymentId),
          mpPaymentStatus: String(status),
        },
      });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("Erro no webhook Mercado Pago:", err);
    return NextResponse.json({ error: "Erro no webhook" }, { status: 500 });
  }
}
