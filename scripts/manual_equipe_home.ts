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
    fullName: "Priscila Ruffo",
    cpf: normalizeCPF("030.413.840-19"),
    birthDate: normalizeDateBR("28/11/1990"),
    phone: normalizePhone("55 996974642"),
    email: "priscila.ruffo@gmail.com",
    city: null,
    state: "RS",
    tshirtSize: "M",
    emergencyName: "Contato de emergência",
    emergencyPhone: normalizePhone("55 999277890"),
    healthInfo: null,
    extras: [],
  },
  {
    fullName: "Victoria Martins Cabreira",
    cpf: normalizeCPF("043.157.320-44"),
    birthDate: normalizeDateBR("11/12/1998"),
    phone: normalizePhone("55 996330577"),
    email: "viccabreira303@gmail.com",
    city: null,
    state: "RS",
    tshirtSize: "P",
    emergencyName: "Ana Paula Martins Cabreira",
    emergencyPhone: normalizePhone("55 996737363"),
    healthInfo: null,
    extras: [],
  },
  {
    fullName: "Dyouser Adriani de Freitas",
    cpf: normalizeCPF("035.123.290-71"),
    birthDate: normalizeDateBR("15/11/1995"),
    phone: normalizePhone("55 99650-6061"),
    email: "dyouser01@gmail.com",
    city: null,
    state: "RS",
    tshirtSize: "G",
    emergencyName: "Ana Paula Martins Cabreira",
    emergencyPhone: normalizePhone("55 996737363"),
    healthInfo: null,
    extras: [],
  },
  {
    fullName: "Camila Padilha de Lima",
    cpf: normalizeCPF("027.439.660-25"),
    birthDate: normalizeDateBR("31/12/1995"),
    phone: normalizePhone("55 999685335"),
    email: "camilapl.padilha@hotmail.com",
    city: null,
    state: "RS",
    // se seu schema aceitar "G (Masculina)" ok; se não, troque por "G"
    tshirtSize: "G (Masculina)",
    emergencyName: "Fatima Regina Alves Padilha",
    emergencyPhone: normalizePhone("55 999527852"),
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
