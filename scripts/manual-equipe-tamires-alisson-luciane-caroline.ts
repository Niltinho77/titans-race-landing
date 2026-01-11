import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getModalityById, ModalityId } from "@/config/checkout";
import { sendOrderConfirmationEmail } from "@/lib/email";

// ===================== CONFIG RÁPIDA =====================
const MODALITY_ID: ModalityId = "equipes";
const TICKETS = 1;

// Desconto: 10% SOMENTE nos ingressos (PIX fora da plataforma, sem taxa)
const DISCOUNT_PERCENT_TICKETS_ONLY = 10;

// Se quiser amarrar ao cupom (FK), coloque um code que EXISTE no banco.
// Se não tiver certeza, deixe null.
const COUPON_CODE: string | null = null; // ex: "BOX10"

// =========================================================

function onlyDigits(v: string) {
  return (v ?? "").toString().replace(/\D/g, "");
}

function normalizeCPF(cpf: string) {
  return onlyDigits(cpf).slice(0, 11);
}

function normalizePhone(phone: string) {
  // esperado: 11 dígitos
  const d = onlyDigits(phone);
  // se vier com 10, você pode decidir tratar, mas vou manter simples:
  return d.slice(0, 11);
}

function normalizeDateBR(input: string) {
  // aceita "dd/mm/aaaa" e também "dd\mm\aaaa"
  const v = (input ?? "").replace(/\\/g, "/").trim();
  // mantém como string, igual seu schema atual
  return v;
}

// ✅ regra centralizada (duplas/equipes)
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

  // ========= PARTICIPANTES (EQUIPE) =========
  const participants = [
    {
      fullName: "Tamires Gomes Silveira",
      cpf: normalizeCPF("024.213.940-07"),
      birthDate: normalizeDateBR("07/09/1999"),
      phone: normalizePhone("55999658333"),
      email: "tamiressilveira014@gmail.com",
      city: null,
      state: "RS",
      tshirtSize: "P",
      emergencyName: "Taimara Jobim",
      emergencyPhone: normalizePhone("55999499663"),
      healthInfo: null,
      extras: [],
    },
    {
      fullName: "Alisson Lucas Langendorf Nunes Machado",
      cpf: normalizeCPF("022479290-36"),
      birthDate: normalizeDateBR("04/06/1990"),
      phone: normalizePhone("(55) 991718801"),
      email: "alissongts18@gmail.com",
      city: "São Gabriel",
      state: "RS",
      tshirtSize: "GG",
      emergencyName: "Aline Boll",
      emergencyPhone: normalizePhone("(55)9 9977-8811"),
      healthInfo: null,
      extras: [],
    },
    {
      fullName: "Luciane Machado dos Santos",
      cpf: normalizeCPF("02434182054"),
      birthDate: normalizeDateBR("21/09/1991"),
      phone: normalizePhone("55999210610"),
      email: "lucysg2109@gmail.com",
      city: null,
      state: "RS",
      tshirtSize: "PP",
      emergencyName: "PAULO ROBERTO",
      emergencyPhone: normalizePhone("55996943935"),
      healthInfo: null,
      extras: [],
    },
    {
      fullName: "Caroline Ramos Pires Rodrigues",
      cpf: normalizeCPF("04828028048"),
      birthDate: normalizeDateBR("22/07/1999"),
      phone: normalizePhone("55991882285"),
      email: "carolramos14pires@gmail.com",
      city: null,
      state: "RS",
      tshirtSize: "GG",
      emergencyName: "Fernanda Ramos",
      emergencyPhone: normalizePhone("55 996403539"),
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
  const ticketsAmount = modality.basePrice * TICKETS; // 66000
  const extrasAmount = 0;

  const discountTicketsOnly = Math.round(
    (ticketsAmount * DISCOUNT_PERCENT_TICKETS_ONLY) / 100
  );

  const discountAmount = Math.min(discountTicketsOnly, ticketsAmount); // nunca > tickets
  const discountedTotalAmount = Math.max(
    0,
    ticketsAmount + extrasAmount - discountAmount
  );

  // PIX fora, sem taxa
  const feeAmount = 0;
  const totalAmount = ticketsAmount + extrasAmount; // líquido "cheio"
  const totalAmountWithFee = discountedTotalAmount; // cobrado no pix (sem taxa)

  const order = await prisma.$transaction(async (tx) => {
    // equipes: 1 bib por equipe (por ticket)
    const bibs = await reserveBibNumbers(tx, MODALITY_ID, TICKETS);
    const bibNumber = bibs[0];

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

        // ⚠️ só preenche se existir no banco
        couponCode: COUPON_CODE,

        mpPaymentStatus: "manual_pix",
        mpPaymentId: "manual_pix",
        mpPreferenceId: null,

        participants: {
          create: participants.map((p, idx) => ({
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

            bibNumber,
            teamIndex: idx + 1,

            extras: { create: [] },
          })),
        },
      },
      include: { participants: true },
    });

    return created;
  },{
    maxWait: 10000, // espera conexão até 10s
    timeout: 30000, // transação pode durar até 30s
  });

  // ========= E-MAILS =========
  // Envia para TODOS os participantes e marca confirmationEmailSentAt uma vez.
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
  console.log("✅ Bib da equipe:", order.participants[0]?.bibNumber);
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
