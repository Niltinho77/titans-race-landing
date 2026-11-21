import { prisma } from "../src/lib/prisma";

// Limpa os dados operacionais da edição anterior. FAÇA UM BACKUP ANTES (pg_dump em data/backups/).
// Mantém: VeteranAthlete, PortalUser, AnalyticsEvent, patrocínio e Liga.
async function main() {
  console.log("Iniciando limpeza do banco...");

  const [extras, participants, invites, orders, bibs, coupons] = await prisma.$transaction([
    prisma.participantExtra.deleteMany(),
    prisma.participant.deleteMany(), // ParticipantChangeLog cai em cascata
    prisma.registrationInvite.deleteMany(),
    prisma.order.deleteMany(),
    prisma.bibCounter.deleteMany(),
    // Cupons antigos ficam desativados (não zera o uso, para não reabrir cupons esgotados).
    prisma.coupon.updateMany({ data: { active: false } }),
  ]);

  console.log(JSON.stringify({
    participantExtras: extras.count,
    participants: participants.count,
    registrationInvites: invites.count,
    orders: orders.count,
    bibCounters: bibs.count,
    couponsDeactivated: coupons.count,
  }, null, 2));
}

main()
  .catch((err) => {
    console.error("Erro ao limpar banco:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
