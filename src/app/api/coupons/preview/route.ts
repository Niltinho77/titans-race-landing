import { NextResponse } from "next/server";

/**
 * ✅ CUPONS (preview)
 * - subtotal em CENTAVOS
 * - discountAmount em CENTAVOS
 *
 * Depois você pode trocar esse array por Prisma sem mudar o contrato do endpoint.
 */

type Coupon = {
  code: string; // sempre salvo em UPPERCASE
  type: "percent" | "fixed";
  value: number; // percent: 10 => 10% | fixed: 2000 => R$20,00
  active: boolean;

  // regras opcionais
  modalityIds?: string[]; // ex: ["individual", "duplas", "equipes"]
  minSubtotal?: number; // em centavos
  startsAt?: string; // ISO
  expiresAt?: string; // ISO
};

// ✅ exemplos (ajuste como quiser)
const COUPONS: Coupon[] = [
  {
    code: "PRESENTEDENATAL",
    type: "percent",
    value: 10,
    active: true,
  },
  {
    code: "VIP50",
    type: "fixed",
    value: 5000, // R$ 50,00
    active: true,
    minSubtotal: 15000, // mínimo R$ 150,00
  },
  {
    code: "EQUIPE20",
    type: "percent",
    value: 20,
    active: true,
    modalityIds: ["equipes"],
  },
];

function normalizeCode(code: unknown) {
  if (typeof code !== "string") return null;
  const normalized = code.trim().toUpperCase();
  return normalized.length ? normalized : null;
}

function nowMs() {
  return Date.now();
}

function parseMs(iso?: string) {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const code = normalizeCode(body?.code);
    const modalityId =
      typeof body?.modalityId === "string" ? body.modalityId : null;
    const subtotal =
      typeof body?.subtotal === "number" && Number.isFinite(body.subtotal)
        ? Math.round(body.subtotal)
        : null;

    if (!code) {
      return NextResponse.json(
        { error: "Informe um código de cupom." },
        { status: 400 }
      );
    }

    if (!modalityId) {
      return NextResponse.json(
        { error: "Modalidade inválida." },
        { status: 400 }
      );
    }

    if (subtotal === null || subtotal < 0) {
      return NextResponse.json(
        { error: "Subtotal inválido." },
        { status: 400 }
      );
    }

    // 🔒 Preview não deve aceitar subtotal 0 (fica estranho aplicar cupom em carrinho vazio)
    if (subtotal === 0) {
      return NextResponse.json(
        { error: "Carrinho vazio. Adicione itens antes de aplicar cupom." },
        { status: 400 }
      );
    }

    const coupon = COUPONS.find((c) => c.code === code);

    if (!coupon || !coupon.active) {
      return NextResponse.json({ error: "Cupom inválido." }, { status: 400 });
    }

    // valida janela de validade (opcional)
    const start = parseMs(coupon.startsAt);
    const end = parseMs(coupon.expiresAt);
    const now = nowMs();

    if (start && now < start) {
      return NextResponse.json(
        { error: "Cupom ainda não está válido." },
        { status: 400 }
      );
    }

    if (end && now > end) {
      return NextResponse.json(
        { error: "Cupom expirado." },
        { status: 400 }
      );
    }

    // valida modalidade (opcional)
    if (coupon.modalityIds && !coupon.modalityIds.includes(modalityId)) {
      return NextResponse.json(
        { error: "Cupom não é válido para esta modalidade." },
        { status: 400 }
      );
    }

    // valida mínimo (opcional)
    if (typeof coupon.minSubtotal === "number" && subtotal < coupon.minSubtotal) {
      return NextResponse.json(
        {
          error: `Cupom válido apenas para subtotal mínimo de R$ ${(coupon.minSubtotal / 100).toFixed(2)}.`,
        },
        { status: 400 }
      );
    }

    // calcula desconto
    let discountAmount = 0;

    if (coupon.type === "fixed") {
      discountAmount = Math.max(0, Math.round(coupon.value));
    } else {
      // percent
      const pct = Math.max(0, Math.min(100, coupon.value));
      discountAmount = Math.round((subtotal * pct) / 100);
    }

    // nunca ultrapassa subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    const totalAfterDiscount = Math.max(0, subtotal - discountAmount);

    return NextResponse.json({
      code: coupon.code,
      discountAmount,
      totalAfterDiscount,
    });
  } catch (err) {
    console.error("POST /api/coupons/preview error:", err);
    return NextResponse.json(
      { error: "Erro interno ao validar cupom." },
      { status: 500 }
    );
  }
}