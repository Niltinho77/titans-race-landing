import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const ALLOWED_EVENTS = new Set([
  "page_view",
  "click",
  "time_on_page",
  "checkout_view",
  "checkout_step_1",
  "checkout_step_2",
  "checkout_step_3",
  "checkout_submit",
  "checkout_order_created",
  "checkout_error",
]);

function cleanString(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim().slice(0, 500);
}

function cleanMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const eventName = cleanString(body.eventName);

    if (!ALLOWED_EVENTS.has(eventName)) {
      return NextResponse.json({ error: "Evento inválido." }, { status: 400 });
    }

    const sessionId = cleanString(body.sessionId);
    const path = cleanString(body.path, "/");

    if (!sessionId || !path) {
      return NextResponse.json({ error: "Dados obrigatórios ausentes." }, { status: 400 });
    }

    await prisma.analyticsEvent.create({
      data: {
        sessionId,
        eventName,
        path,
        title: cleanString(body.title) || null,
        referrer: cleanString(body.referrer) || null,
        userAgent: cleanString(body.userAgent) || null,
        device: cleanString(body.device) || null,
        metadata: cleanMetadata(body.metadata) as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("analytics event error", error);
    return NextResponse.json({ error: "Não foi possível registrar o evento." }, { status: 500 });
  }
}
