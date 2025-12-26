// src/app/api/coupons/preview/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function normalizeCode(code: unknown) {
  if (typeof code !== "string") return null;
  const normalized = code.trim().toUpperCase();
  return normalized.length ? normalized : null;
}

function now() {
  return new Date();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const code = normalizeCode(body?.code);
    const modalityId = typeof body?.modalityId === "string" ? body.modalityId : null;

    // subtotal em centavos
    const subtotal =
      typeof body?.subtotal === "number" && Number.isFinite(body.subtotal)
        ? Math.round(body.subtotal)
        : null;

    if (!code) {
      return NextResponse.json({ error: "Informe um código de cupom." }, { status: 400 });
    }

    if (!modalityId) {
      return NextResponse.json({ error: "Modalidade inválida." }, { status: 400 });
    }

    if (subtotal === null || subtotal < 0) {
      return NextResponse.json({ error: "Subtotal inválido." }, { status: 400 });
    }

    if (subtotal === 0) {
      return NextResponse.json(
        { error: "Carrinho vazio. Adicione itens antes de aplicar cupom." },
        { status: 400 }
      );
    }

    // ✅ Busca no BANCO (fonte da verdade / “single source of truth”)
    const coupon = await prisma.coupon.findUnique({
      where: { code },
      select: {
        code: true,
        type: true,
        amount: true,
        active: true,
        startsAt: true,
        expiresAt: true,
        maxUses: true,
        usedCount: true,
        minSubtotal: true,
        modalityId: true,
      },
    });

    if (!coupon || !coupon.active) {
      return NextResponse.json({ error: "Cupom inválido." }, { status: 400 });
    }

    const nowDate = now();

    // janela de validade
    if (coupon.startsAt && nowDate < coupon.startsAt) {
      return NextResponse.json({ error: "Cupom ainda não está válido." }, { status: 400 });
    }
    if (coupon.expiresAt && nowDate > coupon.expiresAt) {
      return NextResponse.json({ error: "Cupom expirado." }, { status: 400 });
    }

    // limite de usos global (se existir)
    if (typeof coupon.maxUses === "number" && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: "Cupom esgotado." }, { status: 400 });
    }

    // mínimo de subtotal (se existir)
    if (typeof coupon.minSubtotal === "number" && subtotal < coupon.minSubtotal) {
      return NextResponse.json(
        { error: `Cupom válido apenas para subtotal mínimo de R$ ${(coupon.minSubtotal / 100).toFixed(2)}.` },
        { status: 400 }
      );
    }

    // restrição por modalidade (se existir)
    if (coupon.modalityId && coupon.modalityId !== modalityId) {
      return NextResponse.json(
        { error: "Cupom não é válido para esta modalidade." },
        { status: 400 }
      );
    }

    // calcula desconto
    let discountAmount = 0;

    if (coupon.type === "FIXED") {
      discountAmount = Math.max(0, Math.round(coupon.amount)); // já em centavos
    } else {
      // PERCENT
      const pct = Math.max(0, Math.min(100, coupon.amount)); // ex: 10 = 10%
      discountAmount = Math.round((subtotal * pct) / 100);
    }

    discountAmount = Math.min(discountAmount, subtotal);
    const totalAfterDiscount = Math.max(0, subtotal - discountAmount);

    return NextResponse.json({
      code: coupon.code,
      discountAmount,
      totalAfterDiscount,
    });
  } catch (err) {
    console.error("POST /api/coupons/preview error:", err);
    return NextResponse.json({ error: "Erro interno ao validar cupom." }, { status: 500 });
  }
}