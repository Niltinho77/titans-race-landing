// scripts/move-duplas-para-diversao.ts
//
// Troca uma dupla da modalidade "duplas" para "diversao".
// - Confere que os dois nomes estão no MESMO pedido de duplas (e só eles).
// - Muda o pedido para "diversao" (tickets = 2, um ingresso por pessoa).
// - Gera números de peito novos na faixa da Diversão e zera o teamIndex.
// - Registra a mudança no ParticipantChangeLog.
// - Valores pagos NÃO são alterados.
//
// Por padrão roda em modo SIMULAÇÃO (não grava nada). Para gravar, use --apply:
//   npx tsx scripts/move-duplas-para-diversao.ts           # só mostra o que faria
//   npx tsx scripts/move-duplas-para-diversao.ts --apply   # grava no banco

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const NAMES = [
  "Anderson Pakulski Caczmareki",
  "Mariana Ferreira de Boer Simas",
];

const FROM_MODALITY = "duplas";
const TO_MODALITY = "diversao";
const APPLY = process.argv.includes("--apply");

const BIB_START: Record<string, number> = {
  kids: 0,
  diversao: 100,
  competicao: 500,
  duplas: 800,
  equipes: 900,
};

async function reserveBibNumbers(
  tx: Prisma.TransactionClient,
  modalityId: string,
  qty: number
): Promise<number[]> {
  const startAt = BIB_START[modalityId] ?? 1000;
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
  const first = updated.nextNumber - qty;
  return Array.from({ length: qty }, (_, i) => first + i);
}

async function main() {
  console.log(APPLY ? "🔴 MODO APLICAR (vai gravar)" : "🟡 MODO SIMULAÇÃO (nada será gravado)");

  const found = [];
  for (const name of NAMES) {
    const matches = await prisma.participant.findMany({
      where: { fullName: { contains: name.trim(), mode: "insensitive" } },
      include: { order: true },
    });
    if (matches.length !== 1) {
      throw new Error(`"${name}": encontrei ${matches.length} participante(s). Esperava exatamente 1.`);
    }
    found.push(matches[0]);
  }

  const orderId = found[0].orderId;
  if (!found.every((p) => p.orderId === orderId)) {
    throw new Error("Os dois participantes estão em pedidos diferentes. Nada foi alterado.");
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { participants: true },
  });
  if (!order) throw new Error("Pedido não encontrado.");
  if (order.modalityId !== FROM_MODALITY) {
    throw new Error(`O pedido está em "${order.modalityId}", não em "${FROM_MODALITY}".`);
  }
  if (order.participants.length !== NAMES.length) {
    throw new Error(
      `O pedido tem ${order.participants.length} participantes (esperava ${NAMES.length}). Nada foi alterado.`
    );
  }

  console.log(`Pedido ${order.id} | status ${order.status} | ${order.modalityId} | tickets ${order.tickets}`);
  for (const p of order.participants) {
    console.log(`  - ${p.fullName} | peito ${p.bibNumber ?? "-"} | teamIndex ${p.teamIndex ?? "-"}`);
  }

  if (!APPLY) {
    console.log(`\nFaria: pedido → "${TO_MODALITY}", tickets → ${order.participants.length}, novos números de Diversão.`);
    console.log("Rode de novo com --apply para gravar.");
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    const bibs = await reserveBibNumbers(tx, TO_MODALITY, order.participants.length);

    await tx.order.update({
      where: { id: order.id },
      data: { modalityId: TO_MODALITY, tickets: order.participants.length },
    });

    const out: { name: string; oldBib: number | null; newBib: number }[] = [];
    for (const [i, p] of order.participants.entries()) {
      await tx.participant.update({
        where: { id: p.id },
        data: { bibNumber: bibs[i], teamIndex: null },
      });
      await tx.participantChangeLog.create({
        data: {
          participantId: p.id,
          action: "MODALITY_CHANGE",
          beforeJson: { modalityId: FROM_MODALITY, bibNumber: p.bibNumber, teamIndex: p.teamIndex },
          afterJson: { modalityId: TO_MODALITY, bibNumber: bibs[i], teamIndex: null },
        },
      });
      out.push({ name: p.fullName, oldBib: p.bibNumber, newBib: bibs[i] });
    }
    return out;
  });

  console.log("\n✅ Feito:");
  for (const r of result) console.log(`  - ${r.name}: peito ${r.oldBib ?? "-"} → ${r.newBib}`);
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e?.message ?? e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
