import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getModalityById, ModalityId } from "@/config/checkout";

// ===================== CONFIG =====================
const MODALITY_ID: ModalityId = "equipes";
const TICKETS = 1;

// Pedido antigo (OVERDUE / Asaas EXPIRED) que será removido
const OLD_ORDER_ID = "cmo1w65iy0011131t5cy1uqt5";

// Valores em centavos (mesmo do pedido original — 2º Lote, sem taxa pois é PIX manual)
const TICKETS_AMOUNT = 62000; // R$ 620,00
const EXTRAS_AMOUNT = 0;
const DISCOUNT_AMOUNT = 0;
// =================================================

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
  return (input ?? "").replace(/\\/g, "/").trim();
}

function getParticipantsPerTicket(modalityId: ModalityId) {
  if (modalityId === "duplas") return 2;
  if (modalityId === "equipes") return 4;
  return 1;
}

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

  const participants = [
    {
      fullName: "Tailise de Avila Almeida Pereira",
      cpf: normalizeCPF("034.829.780-77"),
      birthDate: normalizeDateBR("11/06/1993"),
      phone: normalizePhone("55991532009"),
      email: "tailisepereira893@gmail.com",
      city: "São Borja",
      state: "RS",
      tshirtSize: "Baby Look - G",
      emergencyName: "Darlan esposo",
      emergencyPhone: normalizePhone("55992347945"),
      healthInfo: "Saudável",
      extras: [],
    },
    {
      // Substitui Marielli
      fullName: "Daniel Uhlmann de Avila Borges",
      cpf: normalizeCPF("042.020.950-65"),
      birthDate: normalizeDateBR("17/12/2001"),
      phone: normalizePhone("55999204180"),
      email: "daniel.uhlmann228@gmail.com",
      city: "São Borja",
      state: "RS",
      tshirtSize: "Camiseta G",
      emergencyName: "Rafaela de Souza",
      emergencyPhone: normalizePhone("55996741730"),
      healthInfo: null,
      extras: [],
    },
    {
      fullName: "Elisandra Matos da Silva",
      cpf: normalizeCPF("042.444.530-16"),
      birthDate: normalizeDateBR("05/04/1999"),
      phone: normalizePhone("55997063989"),
      email: "elisandramatos08@gmail.com",
      city: "São Borja",
      state: "RS",
      tshirtSize: "Baby Look - M",
      emergencyName: "Maurício esposo",
      emergencyPhone: normalizePhone("55991701829"),
      healthInfo: "Pós bariátrica",
      extras: [],
    },
    {
      fullName: "Elisiane Frois",
      cpf: normalizeCPF("021.580.370-16"),
      birthDate: normalizeDateBR("07/11/1991"),
      phone: normalizePhone("55996908635"),
      email: "lisifroiscorrea@gmail.com",
      city: "São Borja",
      state: "RS",
      tshirtSize: "Baby Look - G",
      emergencyName: "Evandro esposo",
      emergencyPhone: normalizePhone("55999514552"),
      healthInfo: "saudável",
      extras: [],
    },
  ];

  if (participants.length !== expectedParticipants) {
    throw new Error(
      `Participantes inválidos. Esperado ${expectedParticipants}, recebido ${participants.length}`
    );
  }

  const ticketsAmount = TICKETS_AMOUNT;
  const extrasAmount = EXTRAS_AMOUNT;
  const discountAmount = DISCOUNT_AMOUNT;
  const discountedTotalAmount = Math.max(
    0,
    ticketsAmount + extrasAmount - discountAmount
  );
  const feeAmount = 0;
  const totalAmount = ticketsAmount + extrasAmount;
  const totalAmountWithFee = discountedTotalAmount;

  const order = await prisma.$transaction(
    async (tx) => {
      // 1) Apaga pedido antigo (Opção A) — primeiro extras, depois participants, depois order
      const old = await tx.order.findUnique({
        where: { id: OLD_ORDER_ID },
        include: { participants: { include: { extras: true } } },
      });

      if (old) {
        const participantIds = old.participants.map((p) => p.id);
        if (participantIds.length > 0) {
          await tx.participantExtra.deleteMany({
            where: { participantId: { in: participantIds } },
          });
          await tx.participant.deleteMany({
            where: { id: { in: participantIds } },
          });
        }
        await tx.order.delete({ where: { id: OLD_ORDER_ID } });
        console.log(`🗑️  Pedido antigo removido: ${OLD_ORDER_ID}`);
      } else {
        console.log(`ℹ️  Pedido antigo já não existe: ${OLD_ORDER_ID}`);
      }

      // 2) Reserva bib (1 por equipe)
      const bibs = await reserveBibNumbers(tx, MODALITY_ID, TICKETS);
      const bibNumber = bibs[0];

      // 3) Cria novo pedido PAID (manual PIX, sem Asaas)
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

          couponCode: null,

          mpPaymentStatus: "manual_pix",
          mpPaymentId: "manual_pix",
          mpPreferenceId: null,

          // marca como já enviado para impedir reenvio caso algum webhook futuro chegue
          confirmationEmailSentAt: new Date(),

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
    },
    {
      maxWait: 10000,
      timeout: 30000,
    }
  );

  console.log("✅ Novo pedido criado e PAGO:", order.id);
  console.log("✅ Bib da equipe:", order.participants[0]?.bibNumber);
  console.log("ℹ️  Nenhum e-mail enviado (conforme solicitado).");
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
