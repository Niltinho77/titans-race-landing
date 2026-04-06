// src/app/api/pagbank/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function mapPagBankStatus(status?: string) {
  switch (status) {
    case "PAID":
    case "AUTHORIZED":
      return "PAID";
    case "WAITING":
    case "IN_ANALYSIS":
      return "PENDING";
    case "DECLINED":
    case "CANCELED":
      return "CANCELED";
    default:
      return "PENDING";
  }
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    console.log("PagBank webhook raw:", raw);

    let body: any = null;
    try {
      body = JSON.parse(raw);
    } catch {
      console.error("Webhook PagBank não veio em JSON válido.");
      return NextResponse.json({ ok: true });
    }

    console.log("PagBank webhook parsed:", body);

    const referenceId =
      body?.reference_id ||
      body?.referenceId ||
      body?.charges?.[0]?.reference_id ||
      body?.payment_response?.reference_id ||
      null;

    const status =
      body?.status ||
      body?.charges?.[0]?.status ||
      body?.payment_response?.status ||
      null;

    if (!referenceId) {
      console.log("Webhook recebido sem reference_id.");
      return NextResponse.json({ ok: true });
    }

    const mappedStatus = mapPagBankStatus(status);

    await prisma.order.update({
      where: { id: referenceId },
      data: {
        status: mappedStatus,
      },
    });

    console.log(
      `Pedido ${referenceId} atualizado via webhook para status ${mappedStatus}`
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro no webhook do PagBank:", error);
    return NextResponse.json({ ok: true });
  }
}