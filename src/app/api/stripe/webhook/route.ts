// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export const runtime = "nodejs"; // importante: stripe não roda em edge

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET não configurado");
    return NextResponse.json(
      { error: "Webhook não configurado no servidor." },
      { status: 500 }
    );
  }

  const payload = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  } catch (err: any) {
    console.error("Erro ao validar webhook Stripe:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const orderId = session.metadata?.orderId;
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null;

        if (!orderId) {
          console.warn(
            "checkout.session.completed recebido sem orderId em metadata"
          );
          break;
        }

        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: "PAID",
            stripeSessionId: session.id,
            stripePaymentIntentId: paymentIntentId,
          },
        });

        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.metadata?.orderId;

        if (!orderId) break;

        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: "FAILED",
            stripePaymentIntentId: pi.id,
          },
        });

        break;
      }

      // você pode tratar refund, cancel etc. depois
      default:
        // console.log(`Evento Stripe ignorado: ${event.type}`);
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("Erro ao processar webhook Stripe:", err);
    return NextResponse.json(
      { error: "Erro ao processar webhook" },
      { status: 500 }
    );
  }
}