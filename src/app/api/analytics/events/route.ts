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

const BOT_USER_AGENT = /bot|crawler|spider|headless|slurp|facebookexternalhit|whatsapp|telegrambot|preview|uptime|monitoring/i;
const MAX_EVENTS_PER_SESSION_PER_MINUTE = 120;

function cleanString(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim().slice(0, 500);
}

function cleanMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const clean: Record<string, string | number | boolean | null> = {};
  for (const [key, item] of Object.entries(value).slice(0, 30)) {
    const safeKey = key.trim().slice(0, 80);
    if (!safeKey) continue;
    if (typeof item === "string") clean[safeKey] = item.slice(0, 500);
    else if (typeof item === "number" && Number.isFinite(item)) clean[safeKey] = item;
    else if (typeof item === "boolean" || item === null) clean[safeKey] = item;
  }
  return clean;
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
    const userAgent = cleanString(body.userAgent || request.headers.get("user-agent"));

    if (!sessionId || !path) {
      return NextResponse.json({ error: "Dados obrigatórios ausentes." }, { status: 400 });
    }

    if (BOT_USER_AGENT.test(userAgent)) {
      return NextResponse.json({ ok: true, ignored: "bot" });
    }

    const oneMinuteAgo = new Date(Date.now() - 60_000);
    const recentEventCount = await prisma.analyticsEvent.count({
      where: { sessionId, createdAt: { gte: oneMinuteAgo } },
    });
    if (recentEventCount >= MAX_EVENTS_PER_SESSION_PER_MINUTE) {
      return NextResponse.json({ error: "Muitos eventos." }, { status: 429 });
    }

    await prisma.analyticsEvent.create({
      data: {
        sessionId,
        eventName,
        path,
        title: cleanString(body.title) || null,
        referrer: cleanString(body.referrer) || null,
        userAgent: userAgent || null,
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
