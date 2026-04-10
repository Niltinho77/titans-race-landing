// scripts/manual-duplas-yanna-luciane.ts
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getModalityById, ModalityId } from "@/config/checkout";
import { sendOrderConfirmationEmail } from "@/lib/email";

// ===================== CONFIG RÁPIDA =====================
const MODALITY_ID: ModalityId = "duplas";
const TICKETS = 1;

// Desconto: 0% (pagamento manual / fora da plataforma)
const DISCOUNT_PERCENT_TICKETS_ONLY = 0;

// Se quiser vincular a um cupom existente no banco, informe aqui.
// Caso contrário, deixe null.
const COUPON_CODE: string | null = null;
// =========================================================

function onlyDigits(v: string) {
  return (v ?? "").toString().replace(/\D/g, "");
}

function normalizeCPF(cpf: string) {
  return onlyDigits(cpf).slice(0, 11);
}

function normalizePhone(phone: string) {
  return onlyDigits(phone).slice(0, 11);
}

function normalizeDateBR(input: string) {
  return (input ?? "")
    .replace(/\\/g, "/")
    .replace(/\./g, "/")
    .replace(/,/g, "/")
    .trim();
}

function getParticipantsPerTicket(modalityId: ModalityId) {
  if (modalityId === "duplas") return 2;
  if (modalityId === "equipes") return 4;
  return 1;
}

/**
 * Reserva N números sequenciais para uma modalidade (transação).
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

async function main() {
  const modality = getModalityById(MODALITY_ID);
  if (!modality) throw new Error("Modalidade inválida no config/checkout.");

  const perTicket = getParticipantsPerTicket(MODALITY_ID);
  const expectedParticipants = TICKETS * perTicket;

  // ========= PARTICIPANTES =========
  const participants = [
    {
      fullName: "Yanna Basso Andrigheto",
      cpf: normalizeCPF("019805660-54"),
      birthDate: normalizeDateBR("23/11/1988"),
      phone: normalizePhone("055991176721"),
      email: "yanna.slg@gmail.com",
      city: null,
      state: "RS",
      tshirtSize: "M",
      emergencyName: "Contato de emergência",
      emergencyPhone: normalizePhone("55981159151"),
      healthInfo: null,
      extras: [],
    },
    {
      fullName: "Luciane Machado dos Santos Santos",
      cpf: normalizeCPF("02434182054"),
      birthDate: normalizeDateBR("21/09/1991"),
      phone: normalizePhone("55999210610"),
      email: "lucysg2109@gmail.com",
      city: null,
      state: "RS",
      tshirtSize: "P",
      emergencyName: null,
      emergencyPhone: null,
      healthInfo: null,
      extras: [],
    },
  ];

  if (participants.length !== expectedParticipants) {
    throw new Error(
      `Participantes inválidos. Esperado ${expectedParticipants}, recebido ${participants.length}`
    );
  }

  // ========= TOTAIS =========
  const ticketsAmount = modality.basePrice * TICKETS;
  const extrasAmount = 0;

  const discountTicketsOnly = Math.round(
    (ticketsAmount * DISCOUNT_PERCENT_TICKETS_ONLY) / 100
  );

  const discountAmount = Math.min(discountTicketsOnly, ticketsAmount);
  const discountedTotalAmount = Math.max(
    0,
    ticketsAmount + extrasAmount - discountAmount
  );

  // pagamento manual, sem taxa
  const feeAmount = 0;
  const totalAmount = ticketsAmount + extrasAmount;
  const totalAmountWithFee = discountedTotalAmount;

  const order = await prisma.$transaction(
    async (tx) => {
      // duplas: 1 bib por dupla
      const bibs = await reserveBibNumbers(tx, MODALITY_ID, TICKETS);

      const created = await tx.order.create({
        data: {
          modalityId: MODALITY_ID,
          tickets: TICKETS,
          status: "PAID",
          termsAccepted: true,

          ticketsAmount,
          extrasAmount,
          totalAmount,
          discountAmount,
          discountedTotalAmount,
          feeAmount,
          totalAmountWithFee,

          couponCode: COUPON_CODE,

          // marca como pagamento manual
          mpPaymentStatus: "manual",
          mpPaymentId: "manual",
          mpPreferenceId: null,

          participants: {
            create: participants.map((p) => ({
              fullName: p.fullName,
              cpf: p.cpf,
              birthDate: p.birthDate,
              phone: p.phone,
              email: p.email,
              city: p.city,
              state: p.state,
              tshirtSize: p.tshirtSize,
              emergencyName: p.emergencyName,
              emergencyPhone: p.emergencyPhone,
              healthInfo: p.healthInfo,

              // mesma numeração para a dupla
              bibNumber: bibs[0],

              // mesma dupla
              teamIndex: 1,

              extras: { create: [] },
            })),
          },
        },
        include: { participants: true },
      });

      return created;
    },
    {
      maxWait: 10000,
      timeout: 30000,
    }
  );

  // ========= E-MAIL =========
  const modalityName = modality.name;

  for (const p of order.participants) {
    if (!p.email) continue;

    await sendOrderConfirmationEmail({
      to: p.email,
      participantName: p.fullName ?? "Participante",
      orderId: order.id,
      modalityName,
      totalAmount: order.totalAmountWithFee ?? order.totalAmount ?? 0,
    });

    console.log("E-mail enviado para:", p.email);
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { confirmationEmailSentAt: new Date() },
  });

  console.log("✅ Pedido criado e pago:", order.id);
  console.log(
    "✅ BIBs:",
    order.participants
      .map((x) => `${x.fullName} => ${x.bibNumber}`)
      .join(" | ")
  );
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });