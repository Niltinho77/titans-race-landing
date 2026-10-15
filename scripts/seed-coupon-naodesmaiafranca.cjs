const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();
const code = 'NAODESMAIAFRANCA';

async function main() {
  const existing = await db.coupon.findMany({
    where: { code: { equals: code, mode: 'insensitive' } },
    select: {
      code: true,
      type: true,
      amount: true,
      active: true,
      maxUses: true,
      usedCount: true,
      modalityId: true,
      startsAt: true,
      expiresAt: true,
      minSubtotal: true,
    },
  });

  if (existing.length > 0) {
    console.log(`COUPON_SEED_EXISTING ${JSON.stringify(existing)}`);
    return;
  }

  const coupon = await db.coupon.create({
    data: {
      code,
      type: 'PERCENT',
      amount: 100,
      active: true,
      maxUses: 1,
      usedCount: 0,
      modalityId: null,
      startsAt: null,
      expiresAt: null,
      minSubtotal: null,
    },
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

  console.log(`COUPON_SEED_CREATED ${JSON.stringify(coupon)}`);
}

main()
  .catch((error) => {
    console.error('COUPON_SEED_FAILED', error.code || error.message);
  })
  .finally(() => db.$disconnect());
