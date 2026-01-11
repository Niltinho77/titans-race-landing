// scripts/manual-duplas-jessica-lucas.ts
import { prisma } from "@/lib/prisma";
import { getModalityById } from "@/config/checkout";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { Prisma } from "@prisma/client";

// ------- helpers -------
const onlyDigits = (v: string) => (v ?? "").replace(/\D/g, "");
const formatCpfDigits = (v: string) => onlyDigits(v).slice(0, 11);
const formatPhoneDigits = (v: string) => onlyDigits(v).slice(0, 11);

// Reserva bibs (igual sua lógica do start-mp)
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
  const modality = getModalityById("duplas");
  if (!modality) throw new Error("Modalidade 'duplas' não encontrada no config.");

  const tickets = 1; // 1 ingresso de dupla = 2 pessoas
  const ticketsAmount = modality.basePrice * tickets; // 34000
  const extrasAmount = 0;

  // ✅ desconto só nos ingressos (10%)
  const discountPercent = 10;
  const discountAmount = Math.round((ticketsAmount * discountPercent) / 100); // 3400
  const discountedTotalAmount = Math.max(0, ticketsAmount - discountAmount); // 30600

  // Pix fora da plataforma => sem taxa
  const feeAmount = 0;
  const totalAmount = discountedTotalAmount + extrasAmount; // 30600
  const totalAmountWithFee = totalAmount;

  // Participantes (dupla)
  const participants = [
    {
      fullName: "Jessica de Souza Soares",
      cpf: formatCpfDigits("01751095088"),
      birthDate: "16/05/2001",
      phone: formatPhoneDigits("55996306780"),
      email: "soaresjessicads@gmail.com",
      city: null as string | null,
      state: "RS", // UF não informado
      tshirtSize: "P",
      emergencyName: "Iara Soares",
      emergencyPhone: formatPhoneDigits("55996699950"),
      healthInfo: null as string | null,
      extras: [] as Array<{ type: string; size?: string | null; quantity: number }>,
    },
    {
      fullName: "Lucas Olmes Rodrigues",
      cpf: formatCpfDigits("035.966.540-33"),
      birthDate: "25/09/1993",
      phone: formatPhoneDigits("(55) 999393947"),
      email: "lucasolmes@yahoo.com.br",
      city: null as string | null,
      state: "RS",
      tshirtSize: "M",
      emergencyName: "Clair Olmes",
      emergencyPhone: formatPhoneDigits("(55) 999173225"),
      healthInfo: null as string | null,
      extras: [] as Array<{ type: string; size?: string | null; quantity: number }>,
    },
  ];

  // -------- criação no banco (PAID) + bib --------
  const order = await prisma.$transaction(async (tx) => {
    // duplas => 1 bib por ingresso (grupo)
    const bibs = await reserveBibNumbers(tx, "duplas", tickets);
    const bibNumber = bibs[0]; // mesmo bib pros 2 integrantes

    const created = await tx.order.create({
      data: {
        modalityId: modality.id,
        tickets,
        status: "PAID",
        termsAccepted: true,

        ticketsAmount,
        extrasAmount,
        totalAmount,
        feeAmount,
        totalAmountWithFee,

        couponCode: "HOMECENTRO10", // opcional (só registro)
        discountAmount,
        discountedTotalAmount,

        mpPreferenceId: null,
        mpPaymentId: "PIX-MANUAL",
        mpPaymentStatus: "approved",

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
            teamIndex: idx + 1, // 1 e 2
            extras: { create: [] },
          })),
        },
      },
      include: { participants: true },
    });

    return created;
  });

  // -------- e-mails (envia pros 2) --------
  for (const p of order.participants) {
    await sendOrderConfirmationEmail({
      to: p.email,
      participantName: p.fullName,
      orderId: order.id,
      modalityName: modality.name,
      totalAmount: order.totalAmountWithFee ?? order.totalAmount ?? 0,
    });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { confirmationEmailSentAt: new Date() },
  });

  console.log("✅ Pedido criado e e-mails enviados!");
  console.log("orderId:", order.id);
  console.log("bib:", order.participants[0]?.bibNumber);
  console.log("emails:", order.participants.map((p) => p.email).join(", "));
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
