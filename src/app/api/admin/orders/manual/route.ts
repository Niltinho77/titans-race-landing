// src/app/api/admin/orders/manual/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { EXTRAS, getModalityById, ExtraType, ModalityId } from "@/config/checkout";
import { sendOrderConfirmationEmail } from "@/lib/email";

export const runtime = "nodejs";

// -------------------- Types --------------------
type ParticipantExtraPayload = { type: ExtraType; size?: string; quantity: number };

type ParticipantPayload = {
  fullName: string;
  cpf: string;
  birthDate: string;
  phone: string;
  email: string;
  city?: string;
  state?: string;
  tshirtSize: string;
  emergencyName?: string;
  emergencyPhone?: string;
  healthInfo?: string;
  extras: ParticipantExtraPayload[];
};

type ManualOrderPayload = {
  modalityId: string;
  tickets: number;
  participants: ParticipantPayload[];
  // opcional: você pode guardar um cupom do box (ex: "BOX10") ou só uma tag
  couponCode?: string | null;

  // opcional: identificação do parceiro (pra auditoria)
  paidVia?: string; // ex: "PIX_BOX_CROSSROSUL"
  // opcional: se quiser sobrescrever o desconto padrão de 10%
  ticketsDiscountPercent?: number; // default 10
};

// -------------------- Helpers --------------------
const DEFAULT_DISCOUNT_PERCENT = 10;

function onlyDigits(v: string) {
  return (v ?? "").replace(/\D/g, "");
}

function getParticipantsPerTicket(modalityId: ModalityId) {
  if (modalityId === "duplas") return 2;
  if (modalityId === "equipes") return 4;
  return 1;
}

/**
 * Reserva N números sequenciais para uma modalidade (atômico no Postgres).
 * Retorna um array [start..start+qty-1].
 */
async function reserveBibNumbers(
  tx: Prisma.TransactionClient,
  modalityId: string,
  qty: number
): Promise<number[]> {
  if (qty <= 0) return [];

  const startMap: Record<string, number> = {
    kids: 0,
    diversao: 100,
    competicao: 500,
    duplas: 800,
    equipes: 900,
  };

  const startAt = startMap[modalityId] ?? 1000;

  await tx.bibCounter.upsert({
    where: { id: modalityId },
    create: { id: modalityId, nextNumber: startAt },
    update: {},
  });

  const updated = await tx.bibCounter.update({
    where: { id: modalityId },
    data: { nextNumber: { increment: qty } },
    select: { nextNumber: true },
  });

  const newNext = updated.nextNumber;
  const start = newNext - qty;

  return Array.from({ length: qty }, (_, i) => start + i);
}

function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

function unauthorized(msg = "Não autorizado.") {
  return NextResponse.json({ error: msg }, { status: 401 });
}

// -------------------- Route --------------------
export async function POST(req: NextRequest) {
  try {
    // ✅ proteção simples por chave
    const adminKey = process.env.ADMIN_MANUAL_ORDER_KEY;
    if (!adminKey) {
      return NextResponse.json(
        { error: "ADMIN_MANUAL_ORDER_KEY não configurada no servidor." },
        { status: 500 }
      );
    }

    const provided = req.headers.get("x-admin-key");
    if (!provided || !crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(adminKey))) {
      return unauthorized();
    }

    const body = (await req.json().catch(() => null)) as ManualOrderPayload | null;
    if (!body) return badRequest("Body inválido.");

    const modality = getModalityById(body.modalityId);
    if (!modality) return badRequest("Modalidade inválida.");

    const modalityId = modality.id as ModalityId;

    if (!body.tickets || body.tickets < 1) return badRequest("Quantidade de ingressos inválida.");
    if (!Array.isArray(body.participants) || body.participants.length === 0)
      return badRequest("Nenhum participante informado.");

    // ✅ validação de contagem por modalidade
    const perTicket = getParticipantsPerTicket(modalityId);
    const expectedParticipants = body.tickets * perTicket;
    if (body.participants.length !== expectedParticipants) {
      return badRequest(
        `Quantidade de participantes inválida para ${modality.name}. Esperado: ${expectedParticipants}, recebido: ${body.participants.length}.`
      );
    }

    // ✅ validação mínima (pra não entrar lixo)
    for (const p of body.participants) {
      if (!p.fullName?.trim() || p.fullName.trim().length < 3) return badRequest("Nome inválido.");
      if (onlyDigits(p.cpf).length !== 11) return badRequest("CPF inválido.");
      if (!p.birthDate || p.birthDate.length !== 10) return badRequest("Data nascimento inválida.");
      if (onlyDigits(p.phone).length !== 11) return badRequest("Telefone inválido.");
      if (!p.email?.includes("@")) return badRequest("E-mail inválido.");
      if (!p.tshirtSize?.trim()) return badRequest("Tamanho de camiseta inválido.");
    }

    // -------------------- Cálculo valores --------------------
    // ingressos (bruto)
    const ticketsAmountRaw = modality.basePrice * body.tickets;

    // extras
    const extrasAmount = body.participants.reduce((total, participant) => {
      const extrasSum = (participant.extras ?? []).reduce((sub, extra) => {
        const config = EXTRAS.find((e) => e.id === extra.type);
        if (!config) return sub;
        const qty = extra.quantity && extra.quantity > 0 ? extra.quantity : 1;
        return sub + config.price * qty;
      }, 0);
      return total + extrasSum;
    }, 0);

    // ✅ desconto somente nos ingressos
    const discountPercent =
      typeof body.ticketsDiscountPercent === "number"
        ? Math.max(0, Math.min(100, body.ticketsDiscountPercent))
        : DEFAULT_DISCOUNT_PERCENT;

    const ticketsDiscountAmount = Math.round((ticketsAmountRaw * discountPercent) / 100);

    const ticketsAmountAfterDiscount = Math.max(0, ticketsAmountRaw - ticketsDiscountAmount);

    // total líquido (sem taxa)
    const totalAmount = ticketsAmountAfterDiscount + extrasAmount;

    if (totalAmount <= 0) return badRequest("Total inválido (<= 0).");

    // ✅ sem taxa no PIX direto
    const feeAmount = 0;
    const totalAmountWithFee = totalAmount;

    const normalizedCoupon =
      typeof body.couponCode === "string" && body.couponCode.trim()
        ? body.couponCode.trim().toUpperCase()
        : null;

    const paidVia =
      typeof body.paidVia === "string" && body.paidVia.trim()
        ? body.paidVia.trim()
        : "MANUAL_PIX";

    // -------------------- Criação + BIBs --------------------
    const order = await prisma.$transaction(async (tx) => {
      const needGroupBib = modalityId === "duplas" || modalityId === "equipes";
      const bibQty = needGroupBib ? body.tickets : body.participants.length;

      const bibs = await reserveBibNumbers(tx, modalityId, bibQty);

      const created = await tx.order.create({
        data: {
          modalityId: modality.id,
          tickets: body.tickets,
          status: "PAID",
          termsAccepted: true, // ✅ manual: você está confirmando
          // valores
          ticketsAmount: ticketsAmountAfterDiscount,
          extrasAmount,
          totalAmount,
          feeAmount,
          totalAmountWithFee,
          // cupom (opcional) + desconto registrado
          couponCode: normalizedCoupon,
          discountAmount: ticketsDiscountAmount, // ✅ desconto aplicado nos ingressos
          discountedTotalAmount: totalAmount, // ✅ total já líquido (sem taxa)
          // “MP” manual (pra rastrear)
          mpPaymentId: paidVia,
          mpPaymentStatus: "approved_manual",
          participants: {
            create: body.participants.map((p, idx) => {
              const groupIndex = Math.floor(idx / perTicket);
              const bibNumber = needGroupBib ? bibs[groupIndex] : bibs[idx];
              const teamIndex =
                modalityId === "duplas" || modalityId === "equipes"
                  ? (idx % perTicket) + 1
                  : null;

              return {
                fullName: p.fullName,
                cpf: p.cpf,
                birthDate: p.birthDate,
                phone: p.phone,
                email: p.email,
                city: p.city ?? null,
                state: p.state ?? null,
                tshirtSize: p.tshirtSize,
                emergencyName: p.emergencyName ?? null,
                emergencyPhone: p.emergencyPhone ?? null,
                healthInfo: p.healthInfo ?? null,
                bibNumber,
                teamIndex,
                extras: {
                  create: (p.extras ?? []).map((e) => ({
                    type: e.type,
                    size: e.size ?? null,
                    quantity: e.quantity && e.quantity > 0 ? e.quantity : 1,
                  })),
                },
              };
            }),
          },
        },
        include: { participants: true },
      });

      // ✅ se quiser controlar “uso” de cupom no banco, dá pra incrementar aqui
      // (só faça se você realmente estiver usando Coupon como controle)
      // if (normalizedCoupon) {
      //   await tx.coupon.update({
      //     where: { code: normalizedCoupon },
      //     data: { usedCount: { increment: 1 } },
      //   });
      // }

      return created;
    });

    // -------------------- Email confirmação --------------------
    const main = order.participants?.[0];
    if (main?.email && !order.confirmationEmailSentAt) {
      try {
        await sendOrderConfirmationEmail({
          to: main.email,
          participantName: main.fullName ?? "Participante",
          orderId: order.id,
          modalityName: modality.name,
          totalAmount: order.totalAmountWithFee ?? order.totalAmount ?? 0,
        });

        await prisma.order.update({
          where: { id: order.id },
          data: { confirmationEmailSentAt: new Date() },
        });
      } catch (e) {
        console.error("Falha ao enviar e-mail (manual):", e);
        // não falha o endpoint; pedido já está criado como pago
      }
    }

    return NextResponse.json(
      {
        ok: true,
        orderId: order.id,
        status: order.status,
        ticketsDiscountPercent: discountPercent,
        ticketsDiscountAmount,
        totalAmount,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Erro /api/admin/orders/manual:", err);
    return NextResponse.json({ error: "Erro ao criar pedido manual." }, { status: 500 });
  }
}
