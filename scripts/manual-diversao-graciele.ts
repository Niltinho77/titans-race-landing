// scripts/manual-diversao-graciele.ts
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getModalityById, ModalityId } from "@/config/checkout";
import { sendOrderConfirmationEmail } from "@/lib/email";

// ✅ Cupom (desconto APENAS em ingressos)
const COUPON_CODE = "CTLACADOR10";

// ✅ Dados (Diversão) — PIX manual (sem taxa)
const INPUT = {
  modalityId: "diversao" as ModalityId,
  tickets: 1,
  participant: {
    fullName: "Graciele Protti da Silva",
    cpf: "001.668.960-71",
    birthDate: "02/03/1981",
    phone: "54999561515",
    email: "edaips@gmail.com",
    city: "Alegrete",
    state: "RS",
    tshirtSize: "M",
    emergencyName: "Márcio",
    emergencyPhone: "55999401305",
    healthInfo: "",
  },
};

// -------------------- helpers --------------------
const onlyDigits = (v: string) => (v ?? "").replace(/\D/g, "");
const normalizeCpf = (v: string) => onlyDigits(v).slice(0, 11);
const normalizePhone = (v: string) => onlyDigits(v).slice(0, 11);

function parseCouponWindowOk(startsAt?: Date | null, expiresAt?: Date | null) {
  const now = new Date();
  if (startsAt && now < startsAt) return false;
  if (expiresAt && now > expiresAt) return false;
  return true;
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

// -------------------- main --------------------
async function main() {
  const modality = getModalityById(INPUT.modalityId);
  if (!modality) throw new Error("Modalidade inválida.");

  const perTicket = getParticipantsPerTicket(modality.id);
  const expectedParticipants = INPUT.tickets * perTicket;
  if (expectedParticipants !== 1) {
    throw new Error(
      `Este script é para 1 participante. Esperado ${expectedParticipants} para modalidade ${modality.id}.`
    );
  }

  const fullName = INPUT.participant.fullName.trim();
  const cpf = normalizeCpf(INPUT.participant.cpf);
  const phone = normalizePhone(INPUT.participant.phone);
  const email = INPUT.participant.email.trim().toLowerCase();

  if (!fullName || fullName.length < 4) throw new Error("Nome inválido.");
  if (cpf.length !== 11) throw new Error("CPF inválido.");
  if (phone.length !== 11) throw new Error("Telefone inválido.");
  if (!email.includes("@")) throw new Error("Email inválido.");

  const ticketsAmount = modality.basePrice * INPUT.tickets; // só ingressos
  const extrasAmount = 0;

  // ✅ busca cupom FORA da transação (evita estourar timeout do tx)
  const coupon = await prisma.coupon.findUnique({ where: { code: COUPON_CODE } });

  if (!coupon || !coupon.active) throw new Error(`Cupom inválido/inativo: ${COUPON_CODE}`);
  if (!parseCouponWindowOk(coupon.startsAt, coupon.expiresAt))
    throw new Error(`Cupom fora da validade: ${COUPON_CODE}`);
  if (coupon.modalityId && coupon.modalityId !== modality.id)
    throw new Error(`Cupom não válido para modalidade ${modality.id}.`);

  if (typeof coupon.minSubtotal === "number" && ticketsAmount < coupon.minSubtotal) {
    throw new Error(
      `Cupom exige subtotal mínimo de R$ ${(coupon.minSubtotal / 100).toFixed(2)}.`
    );
  }

  if (typeof coupon.maxUses === "number" && coupon.usedCount >= coupon.maxUses) {
    throw new Error(`Cupom esgotado: ${COUPON_CODE}`);
  }

  // ✅ desconto APENAS em ingressos
  let discountAmount = 0;
  if (coupon.type === "PERCENT") {
    const pct = Math.max(0, Math.min(100, coupon.amount));
    discountAmount = Math.round((ticketsAmount * pct) / 100);
  } else {
    discountAmount = Math.max(0, coupon.amount); // FIXED em centavos
  }

  discountAmount = Math.min(discountAmount, ticketsAmount);
  const discountedTicketsAmount = Math.max(0, ticketsAmount - discountAmount);

  const discountedTotalAmount = discountedTicketsAmount + extrasAmount;

  // ✅ PIX manual: sem taxa
  const totalAmount = discountedTotalAmount;
  const feeAmount = 0;
  const totalAmountWithFee = totalAmount;

  // ✅ cria pedido + bib dentro de transação (rápida)
  const created = await prisma.$transaction(async (tx) => {
    const bibs = await reserveBibNumbers(tx, modality.id, 1);
    const bibNumber = bibs[0];

    const order = await tx.order.create({
      data: {
        modalityId: modality.id,
        tickets: INPUT.tickets,
        status: "PAID",
        termsAccepted: true,

        ticketsAmount,
        extrasAmount,
        totalAmount,
        feeAmount,
        totalAmountWithFee,

        couponCode: coupon.code,
        discountAmount,
        discountedTotalAmount,

        mpPaymentStatus: "MANUAL_PIX",

        participants: {
          create: [
            {
              fullName,
              cpf,
              birthDate: INPUT.participant.birthDate,
              phone,
              email,
              city: INPUT.participant.city,
              state: INPUT.participant.state,
              tshirtSize: INPUT.participant.tshirtSize,

              emergencyName: INPUT.participant.emergencyName,
              emergencyPhone: normalizePhone(INPUT.participant.emergencyPhone),
              healthInfo: INPUT.participant.healthInfo || null,

              bibNumber,
              teamIndex: null,

              extras: { create: [] },
            },
          ],
        },
      },
      include: { participants: true },
    });

    return order;
  });

  // ✅ incrementa uso do cupom FORA do tx (resolve seu erro)
  try {
    await prisma.coupon.update({
      where: { code: coupon.code },
      data: { usedCount: { increment: 1 } },
    });
  } catch (e) {
    console.warn("⚠️ Pedido criado, mas falhou ao incrementar usedCount do cupom:", e);
  }

  // ✅ Envia e-mail (fora da transação)
  const mainP = created.participants[0];

  const freshOrder = await prisma.order.findUnique({
    where: { id: created.id },
    include: { participants: true },
  });

  if (freshOrder && !freshOrder.confirmationEmailSentAt) {
    await sendOrderConfirmationEmail({
      to: mainP.email,
      participantName: mainP.fullName,
      orderId: created.id,
      modalityName: modality.name,
      totalAmount: created.totalAmountWithFee ?? created.totalAmount ?? 0,
    });

    await prisma.order.update({
      where: { id: created.id },
      data: { confirmationEmailSentAt: new Date() },
    });
  }

  console.log("✅ Pedido criado e marcado como PAGO:", created.id);
  console.log("✅ Participante:", mainP.fullName, "| Bib:", mainP.bibNumber);
  console.log("✅ Cupom:", created.couponCode, "| Desconto:", created.discountAmount);
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e?.message ?? e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
