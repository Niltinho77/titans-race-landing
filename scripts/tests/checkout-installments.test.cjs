/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

function load(file, mocks = {}) {
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: (name) => mocks[name] ?? require(name), console: { error() {} }, Date, Map, Set, URL, process: { env: {} } });
  return exports;
}

const checkout = load('src/config/checkout.ts');
const { loadLots, loadLotPricing } = require('./_lotMocks.cjs');
const lots = loadLots();
const lotPricing = loadLotPricing(lots);

async function run({ installments, couponCode = null, coupon = null } = {}) {
  const writes = [];
  const asaasCalls = [];
  const db = {
    coupon: { findFirst: async () => coupon, updateMany: async () => ({ count: 1 }) },
    order: { create: async ({ data }) => { writes.push(data); return { id: 'test-order', ...data, participants: data.participants.create }; }, update: async () => ({}), updateMany: async () => ({}) },
    $transaction: async (fn) => fn(db),
  };
  const route = load('src/app/api/checkout/start-asaas/route.ts', {
    '@/config/externalPayment': load('src/config/externalPayment.ts'),
    '@/config/registration': { publicRegistrationsAreClosed: () => false, registrationClosedMessage: () => 'Inscrições encerradas' },
    '@/config/lots': lots,
    '@/lib/lotPricing': lotPricing,
    '@/config/checkout': checkout,
    '@/lib/prisma': { prisma: db },
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
    '@/lib/asaas': {
      normalizeCpfCnpj: (s) => s,
      normalizePhone: (s) => s,
      centsToAsaasValue: (c) => c / 100,
      createAsaasCheckout: async (input) => { asaasCalls.push(input); return { checkoutId: 'chk_1', checkoutUrl: 'https://asaas.test/c' }; },
    },
    '@/lib/email': { sendOrderConfirmationEmail: async () => {} },
    '@/lib/orderAttribution': { cleanOrderAttribution: () => ({}) },
    '@/lib/registrationInvites': load('src/lib/registrationInvites.ts'),
    '@/lib/teams': { resolveParticipantTeams: async (choices) => choices.map(() => null) },
  });
  const participant = { fullName: 'Test Participant', cpf: '00000000000', birthDate: '01/01/1990', phone: '00000000000', email: 'test@example.test', tshirtSize: 'M', extras: [] };
  const response = await route.POST({
    url: 'https://titans.test/api/checkout/start-asaas',
    headers: { get: () => null },
    json: async () => ({ couponCode, tickets: 1, modalityId: 'competicao', termsAccepted: true, installments, participants: [participant] }),
  });
  return { response, writes, asaasCalls };
}

const price = () => lots.getTicketPrice('competicao', lots.getCurrentLot());

test('installment total grows with each extra installment', () => {
  let previous = checkout.calculatePaymentFee(14800, 1).totalWithFee;
  for (let n = 2; n <= checkout.INSTALLMENTS.maxCount; n++) {
    const total = checkout.calculatePaymentFee(14800, n).totalWithFee;
    assert.ok(total > previous, `${n}x`);
    previous = total;
  }
  assert.equal(checkout.calculatePaymentFee(0, 6).totalWithFee, 0);
});

test('organizer nets at least the upfront amount even when anticipating every installment', () => {
  // Tabela pública do Asaas: cartão 1x 2,99% e 2–6x 3,49%, + R$ 0,49; antecipação 1,25% ao mês.
  const asaasNet = (total, n) => {
    const card = n <= 1 ? 0.0299 : 0.0349;
    const months = n <= 1 ? 0 : (n + 1) / 2 + 2 / 30;
    return total * (1 - card - 0.0125 * months) - 49;
  };
  for (const amount of [7500, 14800, 29600, 59200]) {
    const upfront = asaasNet(checkout.calculatePaymentFee(amount, 1).totalWithFee, 1);
    for (let n = 2; n <= checkout.INSTALLMENTS.maxCount; n++) {
      const net = asaasNet(checkout.calculatePaymentFee(amount, n).totalWithFee, n);
      assert.ok(net >= upfront - 1, `${amount} em ${n}x: ${net} < ${upfront}`);
    }
  }
});

test('max installments respects the minimum installment value', () => {
  assert.equal(checkout.getMaxInstallments(14800), checkout.INSTALLMENTS.maxCount);
  assert.equal(checkout.getMaxInstallments(800), 1);
  assert.equal(checkout.getMaxInstallments(0), 1);
});

test('upfront order keeps PIX + card and records no installments', async () => {
  const result = await run({});
  assert.equal(result.response.status, 200);
  assert.equal(result.writes[0].installmentCount, null);
  assert.equal(result.writes[0].totalAmountWithFee, checkout.calculatePaymentFee(price(), 1).totalWithFee);
  assert.equal(result.asaasCalls[0].installments, 1);
});

test('installment order charges the installment fee and opens an installment checkout', async () => {
  const result = await run({ installments: 6 });
  assert.equal(result.response.status, 200);
  const order = result.writes[0];
  const expected = checkout.calculatePaymentFee(price(), 6);
  assert.equal(order.installmentCount, 6);
  assert.equal(order.totalAmountWithFee, expected.totalWithFee);
  assert.equal(order.feeAmount, expected.feeAmount);
  assert.equal(result.asaasCalls[0].installments, 6);
  assert.equal(result.asaasCalls[0].items[0].value, expected.totalWithFee / 100);
  assert.ok(result.asaasCalls[0].items[0].name.length <= 30);
});

test('rejects invalid or too many installments without creating an order', async () => {
  for (const installments of [0, 2.5, '3', checkout.INSTALLMENTS.maxCount + 1]) {
    const result = await run({ installments });
    assert.equal(result.response.status, 400, String(installments));
    assert.equal(result.writes.length, 0);
    assert.equal(result.asaasCalls.length, 0);
  }
});

test('complimentary order ignores installments', async () => {
  const coupon = { code: 'CORTESIA', active: true, type: 'PERCENT', amount: 100, usedCount: 0, maxUses: 1, modalityId: null };
  const result = await run({ installments: 6, couponCode: 'CORTESIA', coupon });
  assert.equal(result.response.status, 200);
  assert.equal(result.writes[0].installmentCount, null);
  assert.equal(result.writes[0].totalAmountWithFee, 0);
  assert.equal(result.asaasCalls.length, 0);
});

test('Asaas checkout body follows the API rules for installments', async () => {
  const bodies = [];
  const code = ts.transpileModule(readFileSync('src/lib/asaas.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const asaas = {};
  vm.runInNewContext(code, {
    exports: asaas, require, console, URL,
    process: { env: { ASAAS_API_BASE_URL: 'https://asaas.test/v3', ASAAS_API_KEY: 'key' } },
    fetch: async (_url, init) => { bodies.push(JSON.parse(init.body)); return { ok: true, json: async () => ({ id: 'chk', link: 'https://asaas.test/c' }) }; },
  });
  const input = (installments) => ({ installments, externalReference: 'o', successUrl: 'https://s', cancelUrl: 'https://c', expiredUrl: 'https://e', items: [{ name: 'Titans Race - Quartetos com nome bem longo', description: 'Pedido o', quantity: 1, value: 10 }] });
  await asaas.createAsaasCheckout(input(6));
  await asaas.createAsaasCheckout(input(1));
  // Asaas exige DETACHED junto com INSTALLMENT e nome do item com até 30 caracteres.
  assert.deepEqual(bodies[0].chargeTypes, ['DETACHED', 'INSTALLMENT']);
  assert.deepEqual(bodies[0].installment, { maxInstallmentCount: 6 });
  assert.deepEqual(bodies[0].billingTypes, ['CREDIT_CARD']);
  assert.deepEqual(bodies[1].chargeTypes, ['DETACHED']);
  assert.deepEqual(bodies[1].billingTypes, ['PIX', 'CREDIT_CARD']);
  for (const body of bodies) assert.ok(body.items[0].name.length <= 30);
});
