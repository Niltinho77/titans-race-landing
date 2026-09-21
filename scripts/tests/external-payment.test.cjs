const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

function load(file, mocks = {}) {
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: (name) => mocks[name] ?? require(name), console: { error() {} }, Date, Map, Set });
  return exports;
}
const config = load('src/config/externalPayment.ts');
const checkout = load('src/config/checkout.ts');

async function run({ code = 'SOLOPORFORA100', tickets = 1, extras = [], claimed = 1, modalityId = 'competicao', couponModalityId = 'competicao' } = {}) {
  const writes = [];
  let gatewayCalls = 0;
  let emails = 0;
  const db = {
    coupon: { findFirst: async () => ({ code, active: true, type: 'PERCENT', amount: 100, usedCount: 0, maxUses: 1, modalityId: couponModalityId }), updateMany: async () => ({ count: claimed }) },
    order: { create: async ({ data }) => { writes.push(data); return { id: 'test-order', ...data, participants: data.participants.create }; }, update: async () => ({}) },
    $transaction: async (fn) => fn(db),
  };
  const route = load('src/app/api/checkout/start-asaas/route.ts', {
    '@/config/externalPayment': config,
    '@/config/checkout': checkout,
    '@/lib/prisma': { prisma: db },
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
    '@/lib/asaas': { normalizeCpfCnpj: (s) => s, normalizePhone: (s) => s, createAsaasCheckout: async () => { gatewayCalls++; throw Error('unexpected gateway'); } },
    '@/lib/email': { sendOrderConfirmationEmail: async () => { emails++; } },
    '@/lib/orderAttribution': { cleanOrderAttribution: () => ({}) },
  });
  const participant = { fullName: 'Test Participant', cpf: '00000000000', phone: '00000000000', email: 'test@example.test', extras };
  const response = await route.POST({ json: async () => ({ couponCode: code, tickets, modalityId, termsAccepted: true, participants: Array.from({ length: tickets }, () => participant) }) });
  return { response, writes, gatewayCalls, emails };
}

test('external registration records received payment, consumes coupon and skips online collection', async () => {
  const result = await run({ code: 'ISABELLISOLO100' });
  assert.equal(result.response.status, 200);
  assert.equal(result.response.body.externalPayment, true);
  const order = result.writes[0];
  assert.equal(order.status, 'PAID');
  assert.equal(order.asaasPaymentStatus, 'EXTERNAL_PAID');
  assert.equal(order.totalAmountWithFee, 18000);
  assert.equal(order.discountAmount, 0);
  assert.equal(order.feeAmount, 0);
  assert.ok(order.paidAt instanceof Date);
  assert.equal(result.gatewayCalls, 0);
  assert.equal(result.emails, 1);
});
test('Diversão external coupon records the correct price and skips online collection', async () => {
  const result = await run({ code: 'JULIADIVERSAO100', modalityId: 'diversao', couponModalityId: 'diversao' });
  assert.equal(result.response.status, 200);
  assert.equal(result.response.body.externalPayment, true);
  const order = result.writes[0];
  assert.equal(order.status, 'PAID');
  assert.equal(order.asaasPaymentStatus, 'EXTERNAL_PAID');
  assert.equal(order.totalAmountWithFee, 17500);
  assert.equal(order.discountAmount, 0);
  assert.equal(order.feeAmount, 0);
  assert.equal(result.gatewayCalls, 0);
});
test('ordinary 100% coupon remains a complimentary registration', async () => {
  const result = await run({ code: 'COURTESY100' });
  assert.equal(result.writes[0].asaasPaymentStatus, 'COMPLIMENTARY');
  assert.equal(result.writes[0].status, 'PAID');
  assert.equal(result.writes[0].totalAmountWithFee, 0);
});
test('concurrent coupon claim failure creates no order', async () => {
  const result = await run({ claimed: 0 });
  assert.equal(result.writes.length, 0);
  assert.notEqual(result.response.status, 200);
});
test('external coupon rejects multiple tickets and extras', async () => {
  for (const input of [{ tickets: 2 }, { extras: [{ type: 'camisa', quantity: 1 }] }]) {
    const result = await run(input);
    assert.equal(result.response.status, 400);
    assert.equal(result.writes.length, 0);
  }
});
test('Solo coupon rejects another modality', async () => {
  const result = await run({ modalityId: 'diversao' });
  assert.equal(result.response.status, 400);
  assert.equal(result.writes.length, 0);
});
test('Anna and Ana Paula coupons are configured as external payments', async () => {
  assert.equal(config.isExternalPaymentCoupon('annadiversao100'), true);
  assert.equal(config.isExternalPaymentCoupon('anapaulasolo100'), true);

  const diversao = await run({
    code: 'ANNADIVERSAO100',
    modalityId: 'diversao',
    couponModalityId: 'diversao',
  });
  const solo = await run({ code: 'ANAPAULASOLO100' });

  assert.equal(diversao.response.body.externalPayment, true);
  assert.equal(solo.response.body.externalPayment, true);
});
