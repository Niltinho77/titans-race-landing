const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();
const code = 'NAODESMAIAFRANCA';

async function main() {
  const existing = await db.coupon.findUnique({
    where: { code },
    select: {
      code: true,
      type: true,
      amount: true,
      active: true,
      maxUses: true,
      usedCount: true,
      modalityId: true,
    },
  });

  if (!existing || existing.type !== 'PERCENT' || existing.amount !== 100 ||
      !existing.active || existing.maxUses !== 1) {
    throw new Error('Estado inesperado do cupom; atualização cancelada.');
  }

  if (existing.modalityId === 'competicao') {
    console.log(`COUPON_SCOPE_ALREADY_SET ${JSON.stringify(existing)}`);
    return;
  }

  if (existing.modalityId !== null) {
    throw new Error('O cupom já possui outra modalidade; atualização cancelada.');
  }

  const updated = await db.coupon.update({
    where: { code },
    data: { modalityId: 'competicao' },
    select: {
      code: true,
      type: true,
      amount: true,
      active: true,
      maxUses: true,
      usedCount: true,
      modalityId: true,
    },
  });
  console.log(`COUPON_SCOPE_UPDATED ${JSON.stringify(updated)}`);
}

main()
  .catch((error) => {
    console.error('COUPON_SCOPE_FAILED', error.code || error.message);
  })
  .finally(() => db.$disconnect());
