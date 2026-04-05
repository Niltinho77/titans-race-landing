import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Iniciando limpeza do banco...");

  await prisma.$transaction([
    prisma.participantExtra.deleteMany(),
    prisma.participant.deleteMany(),
    prisma.order.deleteMany(),
    prisma.bibCounter.deleteMany(),
    prisma.coupon.updateMany({
      data: { usedCount: 0 },
    }),
  ]);

  console.log("Banco operacional limpo com sucesso.");
  console.log("Tabelas limpas: ParticipantExtra, Participant, Order, BibCounter");
  console.log("Cupons resetados: usedCount = 0");
}

main()
  .catch((err) => {
    console.error("Erro ao limpar banco:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });