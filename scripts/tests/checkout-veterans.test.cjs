/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const { loadLots, loadLotPricing } = require('./_lotMocks.cjs');

function load(file, mocks = {}) {
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: (name) => mocks[name] ?? require(name), console: { error() {} }, Date, Map, Set, URL, process: { env: {} } });
  return exports;
}
const checkout = load('src/config/checkout.ts');
const VETERAN = '11111111111';
const ROOKIE = '22222222222';

async function run({ iso, modalityId = 'competicao', cpfs = [VETERAN], extras = [] }) {
  const lots = loadLots(iso);
  const writes = [];
  const db = {
    order: { create: async ({ data }) => { writes.push(data); return { id: 'order', ...data, participants: data.participants.create }; }, update: async () => ({}), updateMany: async () => ({}) },
    $transaction: async (fn) => fn(db),
  };
  const route = load('src/app/api/checkout/start-asaas/route.ts', {
    '@/config/registration': { publicRegistrationsAreClosed: () => lots.getLotStatus().phase !== 'open', registrationClosedMessage: () => 'fechado' },
    '@/config/lots': lots,
    '@/lib/lotPricing': loadLotPricing(lots, [VETERAN]),
    '@/config/checkout': checkout,
    '@/config/externalPayment': { isExternalPaymentCoupon: () => false },
    '@/lib/prisma': { prisma: db },
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
    '@/lib/asaas': { normalizeCpfCnpj: (s) => s, normalizePhone: (s) => s, centsToAsaasValue: (c) => c / 100, createAsaasCheckout: async () => ({ checkoutId: 'c', checkoutUrl: 'https://pay.example' }) },
    '@/lib/email': {}, '@/lib/orderAttribution': { cleanOrderAttribution: () => ({}) },
    '@/lib/registrationInvites': {},
  });
  const participants = cpfs.map((cpf) => ({ fullName: 'Atleta Teste', cpf, phone: '55999999999', email: 'a@example.test', birthDate: '01/01/1990', tshirtSize: 'Camiseta M', extras }));
  const response = await route.POST({ url: 'https://titans.example/api', headers: { get: () => null }, json: async () => ({ modalityId, tickets: cpfs.length / ({ duplas: 2, equipes: 4 }[modalityId] ?? 1), termsAccepted: true, participants }) });
  return { response, order: writes[0] };
}

test('pré-venda aceita só pedidos em que todos os CPFs são veteranos', async () => {
  const ok = await run({ iso: '2026-11-25T10:00:00-03:00' });
  assert.equal(ok.response.status, 200);
  assert.equal(ok.order.ticketsAmount, 12800);
  assert.equal(ok.order.veteranDiscountAmount, 0);
  assert.equal(ok.order.lotId, 'preVendaVeteranos');

  const rookie = await run({ iso: '2026-11-25T10:00:00-03:00', cpfs: [ROOKIE] });
  assert.equal(rookie.response.status, 403);
  const mixed = await run({ iso: '2026-11-25T10:00:00-03:00', modalityId: 'duplas', cpfs: [VETERAN, ROOKIE] });
  assert.equal(mixed.response.status, 403);
  const repeated = await run({ iso: '2026-11-25T10:00:00-03:00', modalityId: 'duplas', cpfs: [VETERAN, VETERAN] });
  assert.equal(repeated.response.status, 403);
});

test('sem desconto de veterano na Black Week (lote promocional, até 02/12)', async () => {
  const { response, order } = await run({ iso: '2026-12-02T20:00:00-03:00' });
  assert.equal(response.status, 200);
  assert.equal(order.lotId, 'blackWeek');
  assert.equal(order.veteranDiscountAmount, 0);
  assert.equal(order.discountedTotalAmount, 12800);
});

test('veterano ganha R$ 10 por pessoa nos Lotes 1, 2 e Final', async () => {
  const lote1 = await run({ iso: '2026-12-10T10:00:00-03:00', modalityId: 'duplas', cpfs: [VETERAN, ROOKIE] });
  assert.equal(lote1.order.ticketsAmount, 29600);
  assert.equal(lote1.order.veteranDiscountAmount, 1000);
  assert.equal(lote1.order.discountedTotalAmount, 28600);
  const final = await run({ iso: '2027-02-10T10:00:00-03:00' });
  assert.equal(final.order.discountedTotalAmount, 17800);
});

test('Lote Extra: sem desconto, sem camiseta e sem extras', async () => {
  const { response, order } = await run({ iso: '2027-02-20T10:00:00-03:00' });
  assert.equal(response.status, 200);
  assert.equal(order.ticketsAmount, 18800);
  assert.equal(order.veteranDiscountAmount, 0);
  assert.equal(order.participants.create[0].tshirtSize, 'Sem camiseta');
  const withExtra = await run({ iso: '2027-02-20T10:00:00-03:00', extras: [{ type: 'luva', size: 'M', quantity: 1 }] });
  assert.equal(withExtra.response.status, 400);
});

const many = (n, veterans = 0) => Array.from({ length: n }, (_, i) => (i < veterans ? VETERAN : String(30000000000 + i)));

test('grupo de 10+ atletas ganha R$ 10 por pessoa', async () => {
  const ten = await run({ iso: '2026-12-10T10:00:00-03:00', cpfs: many(10) });
  assert.equal(ten.response.status, 200);
  assert.equal(ten.order.ticketsAmount, 148000);
  assert.equal(ten.order.discountedTotalAmount, 138000);
  const nine = await run({ iso: '2026-12-10T10:00:00-03:00', cpfs: many(9) });
  assert.equal(nine.order.discountedTotalAmount, 9 * 14800);
  const quartets = await run({ iso: '2026-12-10T10:00:00-03:00', modalityId: 'equipes', cpfs: many(12) });
  assert.equal(quartets.order.discountedTotalAmount, 12 * 14800 - 12 * 1000);
});

test('desconto de grupo não acumula com o de veterano', async () => {
  const { order } = await run({ iso: '2026-12-10T10:00:00-03:00', cpfs: many(10, 1) });
  assert.equal(order.discountedTotalAmount, 148000 - 10000);
  assert.equal(order.veteranDiscountAmount, 0);
});

test('desconto de grupo vale na Black Week e no Lote Extra', async () => {
  const bw = await run({ iso: '2026-11-28T10:00:00-03:00', cpfs: many(10) });
  assert.equal(bw.order.discountedTotalAmount, 10 * 12800 - 10000);
  const extra = await run({ iso: '2027-02-20T10:00:00-03:00', cpfs: many(10) });
  assert.equal(extra.order.discountedTotalAmount, 10 * 18800 - 10000);
});
