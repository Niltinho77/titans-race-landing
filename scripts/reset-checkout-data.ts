import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Limpando dados de teste...");

  await prisma.participantExtra.deleteMany();
  await prisma.participant.deleteMany();
  await prisma.order.deleteMany();
  await prisma.bibCounter.deleteMany();
  await prisma.coupon.deleteMany();

  console.log("Banco zerado com sucesso.");
}

main()
  .catch((err) => {
    console.error("Erro ao zerar banco:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });