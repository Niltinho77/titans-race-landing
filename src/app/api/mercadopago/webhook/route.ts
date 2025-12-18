// src/app/api/mercadopago/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { mpPayment } from "@/lib/mercadopago";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { getModalityById } from "@/config/checkout";


export const runtime = "nodejs";



// -------------------- Signature helpers --------------------
function parseSignatureHeader(signature: string | null) {
  if (!signature) return null;

  // formato típico: "ts=1700000000,v1=abcdef..."
  const parts = signature.split(",");
  let ts: string | undefined;
  let v1: string | undefined;

  for (const part of parts) {
    const [k, v] = part.split("=");
    if (!k || !v) continue;
    const key = k.trim();
    const val = v.trim();
    if (key === "ts") ts = val;
    if (key === "v1") v1 = val;
  }

  if (!ts || !v1) return null;
  return { ts, v1 };
}

function safeEqual(a: string, b: string) {
  // evita timing attacks
  const aa = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function verifyMpSignature(params: {
  resourceId: string;
  xRequestId: string | null;
  xSignature: string | null;
  secret: string | undefined;
}) {
  const { resourceId, xRequestId, xSignature, secret } = params;

  // Se você não configurar secret, não bloqueia.
  if (!secret) return true;

  const parsed = parseSignatureHeader(xSignature);
  if (!parsed) return false;
  if (!xRequestId) return false;

  // manifest (modelo prático usado nos exemplos do MP):
  // `id:${id};request-id:${requestId};ts:${ts};`
  const manifest = `id:${resourceId};request-id:${xRequestId};ts:${parsed.ts};`;

  const computed = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  return safeEqual(computed, parsed.v1);
}

// -------------------- Status mapping --------------------
function mapMpToOrderStatus(mpStatus?: string) {
  
  switch (mpStatus) {
    case "approved":
      return "PAID";
    case "rejected":
    case "cancelled":
    case "refunded":
    case "charged_back":
      return "FAILED";
    default:
      return "PENDING";
  }
}

// -------------------- Merchant order -> paymentId --------------------
async function resolvePaymentIdFromMerchantOrder(merchantOrderId: string) {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return null;

  const res = await fetch(
    `https://api.mercadopago.com/merchant_orders/${merchantOrderId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );

  if (!res.ok) return null;

  const mo = await res.json();
  const pid = mo?.payments?.[0]?.id;
  return pid ? String(pid) : null;
}

export async function POST(req: NextRequest) {
  // ✅ webhook deve quase sempre responder 200 para o MP (ack)
  try {
    if (!mpPayment) {
      console.warn("MP webhook: mpPayment null (MP_ACCESS_TOKEN ausente?)");
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const url = new URL(req.url);
    const searchParams = url.searchParams;

    // tenta ler body (nem sempre vem JSON parseável)
    let body: any = null;
    try {
      body = await req.json();
    } catch {
      body = null;
    }

    // MP pode mandar identificação por query ou body
    const topic =
      searchParams.get("topic") ||
      searchParams.get("type") ||
      body?.type ||
      null;

    const resourceIdRaw =
      searchParams.get("data.id") ||
      searchParams.get("id") ||
      body?.data?.id ||
      body?.id ||
      null;

    if (!resourceIdRaw) {
      console.warn("MP webhook sem resourceId", {
        url: req.url,
        query: Object.fromEntries(searchParams),
        body,
      });
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const resourceId = String(resourceIdRaw);

    // (Opcional) validar assinatura do webhook
    const mpSecret = process.env.MP_WEBHOOK_SECRET; // defina no painel do MP (opcional)
    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");

    const valid = verifyMpSignature({
      resourceId, // assinatura é do ID notificado (resource)
      xRequestId,
      xSignature,
      secret: mpSecret,
    });

    if (!valid) {
      // se você ativou secret, essa proteção faz sentido
      return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
    }

    // resolve paymentId dependendo do tipo de notificação
    let paymentId: string | null = null;

    const isMerchantOrder =
      topic === "merchant_order" ||
      topic === "order" ||
      (typeof topic === "string" && topic.includes("merchant_order")) ||
      (typeof topic === "string" && topic.includes("order"));


    if (isMerchantOrder) {
  paymentId = await resolvePaymentIdFromMerchantOrder(resourceId);

      // se ainda não existe payment no merchant order, ACK e espera próximo webhook
      if (!paymentId) {
        return NextResponse.json({ ok: true }, { status: 200 });
      }
    } else {
      paymentId = resourceId;
    }


    // busca o pagamento (fonte da verdade)
    let payment: any;
    try {
      payment = await mpPayment.get({ id: paymentId });
    } catch (e: any) {
      // ✅ isso acontece no "teste do painel" (id fake) e em alguns cenários de notificação
      console.warn("MP payment.get falhou (ignorado)", {
        paymentId,
        status: e?.status,
        message: e?.message,
        cause: e?.cause,
        topic,
        resourceId,
      });
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const externalRef = payment?.external_reference; // order.id
    const mpStatus = payment?.status as string | undefined;

    if (!externalRef) {
      console.warn("MP payment sem external_reference", { paymentId, mpStatus });
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const newOrderStatus = mapMpToOrderStatus(mpStatus);

    const updatedOrder = await prisma.order.update({
  where: { id: String(externalRef) },
  data: {
    status: newOrderStatus,
    mpPaymentId: String(payment.id),
    mpPaymentStatus: mpStatus ?? null,
  },
});

// ✅ Se aprovou, envia e-mail 1 vez só
if (newOrderStatus === "PAID") {
  const order = await prisma.order.findUnique({
    where: { id: String(externalRef) },
    include: { participants: true },
  });

  if (order && !order.confirmationEmailSentAt) {
    const main = order.participants[0];
    const modality = getModalityById(order.modalityId);

    try {
      await sendOrderConfirmationEmail({
        to: main?.email ?? "",
        participantName: main?.fullName ?? "Participante",
        orderId: order.id,
        modalityName: modality?.name ?? order.modalityId,
        totalAmount: order.totalAmountWithFee ?? order.totalAmount ?? 0,
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { confirmationEmailSentAt: new Date() },
      });

      console.log("E-mail de confirmação enviado:", order.id, main?.email);
    } catch (e) {
      console.error("Falha ao enviar e-mail Resend:", e);
      // não retorna erro; pagamento já foi processado
    }
  }
}

return NextResponse.json({ ok: true }, { status: 200 });


  } catch (err) {
    console.error("Erro webhook Mercado Pago:", err);
    // ✅ não derruba o webhook
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}
