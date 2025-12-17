// src/app/api/mercadopago/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { mpPayment } from "@/lib/mercadopago";

export const runtime = "nodejs";

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
  paymentId: string;
  xRequestId: string | null;
  xSignature: string | null;
  secret: string | undefined;
}) {
  const { paymentId, xRequestId, xSignature, secret } = params;

  // Se você não configurar secret, não bloqueia.
  if (!secret) return true;

  const parsed = parseSignatureHeader(xSignature);
  if (!parsed) return false;
  if (!xRequestId) return false;

  // Manifest usado pelo MP em exemplos: `id:${id};request-id:${requestId};ts:${ts};`
  // (há discussões públicas com esse formato) :contentReference[oaicite:1]{index=1}
  const manifest = `id:${paymentId};request-id:${xRequestId};ts:${parsed.ts};`;

  const computed = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  return safeEqual(computed, parsed.v1);
}

function mapMpToOrderStatus(mpStatus?: string) {
  // você pode ajustar os nomes como quiser no seu sistema
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

export async function POST(req: NextRequest) {
  try {
    if (!mpPayment) {
      return NextResponse.json({ error: "Mercado Pago não configurado." }, { status: 500 });
    }

    // MP costuma enviar o id no query (data.id / id) e às vezes também no body
    const { searchParams } = new URL(req.url);

    let paymentId =
      searchParams.get("data.id") ||
      searchParams.get("id") ||
      undefined;

    let body: any = null;
    try {
      body = await req.json();
    } catch {
      // ok: alguns webhooks vêm sem JSON parseável no Next
    }

    paymentId =
      paymentId ||
      body?.data?.id ||
      body?.id ||
      undefined;

    if (!paymentId) {
      // responde 200 pra não ficar re-tentando infinito, mas loga
      console.warn("MP webhook sem paymentId", { query: Object.fromEntries(searchParams), body });
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // (Opcional) validar assinatura do webhook
    const mpSecret = process.env.MP_WEBHOOK_SECRET; // você define no painel do MP
    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");

    const valid = verifyMpSignature({
      paymentId,
      xRequestId,
      xSignature,
      secret: mpSecret,
    });

    if (!valid) {
      return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
    }

    // Busca o pagamento real na API (fonte da verdade)
    const payment = await mpPayment.get({ id: paymentId });

    const externalRef = payment?.external_reference; // deve ser order.id (como você setou)
    const mpStatus = payment?.status as string | undefined;

    if (!externalRef) {
      console.warn("MP payment sem external_reference", { paymentId, mpStatus });
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const newOrderStatus = mapMpToOrderStatus(mpStatus);

    // Atualização idempotente
    await prisma.order.update({
      where: { id: externalRef },
      data: {
        status: newOrderStatus,
        mpPaymentId: String(payment.id),
        mpPaymentStatus: mpStatus ?? null,
      },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("Erro webhook Mercado Pago:", err);
    // importante: normalmente é melhor responder 200 se você já recebeu e vai reprocessar por fila.
    // mas como você ainda está integrando, deixo 500 para você enxergar erros.
    return NextResponse.json({ error: "Erro no webhook." }, { status: 500 });
  }
}
