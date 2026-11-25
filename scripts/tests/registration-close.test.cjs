/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const { loadLots, pinnedDate } = require('./_lotMocks.cjs');

function load(file, mocks = {}, iso) {
  const code = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require: name => mocks[name] ?? (name === 'react/jsx-runtime' || name === 'react' ? require(name) : {}),
    Date: iso ? pinnedDate(iso) : Date, Intl,
  });
  return exports;
}

function schedule(iso) {
  return load('src/config/registration.ts', { './lots': loadLots(iso) }, iso);
}

test('inscrições públicas seguem a janela dos lotes', () => {
  assert.equal(schedule('2026-11-24T23:59:59-03:00').publicRegistrationsAreClosed(), true);
  assert.equal(schedule('2026-11-24T23:59:59-03:00').registrationClosedMessage(), 'As inscrições ainda não abriram.');
  assert.equal(schedule('2026-11-25T00:00:00-03:00').publicRegistrationsAreClosed(), false);
  assert.equal(schedule('2027-03-07T23:59:59-03:00').publicRegistrationsAreClosed(), false);
  assert.equal(schedule('2027-03-08T00:00:00-03:00').publicRegistrationsAreClosed(), true);
  assert.equal(schedule('2027-03-08T00:00:00-03:00').registrationClosedMessage(), 'Inscrições encerradas');
});

const closed = { publicRegistrationsAreClosed: () => true, registrationClosedMessage: () => 'Inscrições encerradas', legacyCheckoutIsClosed: () => true, REGISTRATION_CLOSED_MESSAGE: 'Inscrições encerradas' };
for (const gateway of ['start', 'start-asaas', 'start-mp', 'start-pagbank']) {
  test(`${gateway} recusa inscrição fechada antes de ler o pedido ou tocar no banco`, async () => {
    const fail = () => { throw Error('Unexpected side effect after closing'); };
    const route = load(`src/app/api/checkout/${gateway}/route.ts`, {
      '@/config/registration': closed,
      'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
      '@/lib/prisma': { prisma: new Proxy({}, { get: fail }) },
    });
    const response = await route.POST({ headers: { get: () => null }, json: fail });
    assert.equal(response.status, 403);
    assert.equal(response.body.error, 'Inscrições encerradas');
  });
}

const { renderToStaticMarkup } = require('react-dom/server');
const { createElement } = require('react');
const motion = new Proxy({}, { get: () => 'div' });
const icons = new Proxy({}, { get: () => () => null });

function renderHome(iso) {
  const lots = loadLots(iso);
  const status = lots.getPublicLotStatus();
  const mocks = {
    '@/hooks/useRegistrationClosed': { useLotStatus: () => status, usePublicLotStatus: () => status },
    '@/config/checkout': load('src/config/checkout.ts'),
    '@/config/lots': lots,
    '@/config/event': load('src/config/event.ts'),
    'framer-motion': { motion },
    'lucide-react': icons,
  };
  const grid = renderToStaticMarkup(createElement(load('src/components/ExperienceGridSection.tsx', mocks).ExperienceGridSection));
  const lotsHtml = renderToStaticMarkup(createElement(load('src/components/RegistrationSection.tsx', mocks).RegistrationSection));
  return { grid, lots: lotsHtml };
}

test('antes da pré-venda: nada de veteranos no site, anuncia a Black Week', () => {
  const { grid, lots } = renderHome('2026-11-21T12:00:00-03:00');
  assert.doesNotMatch(grid, /href="\/checkout/);
  assert.match(grid, /em breve/);
  assert.match(lots, /Black Week abre em/);
  assert.doesNotMatch(lots, />agora</);
  assert.doesNotMatch(grid + lots, /[Vv]eteran|Pré-venda/);
});

test('durante a pré-venda: aparece no site como exclusiva dos veteranos', () => {
  const { grid, lots } = renderHome('2026-11-25T12:00:00-03:00');
  assert.equal((grid.match(/href="\/checkout/g) || []).length, 5);
  assert.match(grid, /exclusiva para quem correu a 1ª ou a 2ª edição/);
  assert.match(lots, /Pré-venda Veteranos aberta · Black Week abre em/);
});

test('Black Week aberta até 02/12: 5 modalidades com checkout e preço do lote', () => {
  const { grid, lots } = renderHome('2026-12-02T12:00:00-03:00');
  assert.equal((grid.match(/href="\/checkout/g) || []).length, 5);
  assert.match(grid, /R\$\s?128,00/);
  assert.match(grid, /R\$\s?512,00/);
  assert.match(grid, /Black Week até 02\/12/);
  assert.match(lots, /O preço sobe em/);
  assert.match(lots, />agora</);
  assert.doesNotMatch(grid + lots, /[Vv]eteran/);
});

test('Lote Extra aberto: avisa que é sem camiseta', () => {
  const { grid, lots } = renderHome('2027-02-20T12:00:00-03:00');
  assert.match(grid, /sem camiseta/);
  assert.match(lots, /Inscrições encerram em/);
});

test('depois de 07/03: inscrições encerradas', () => {
  const { grid, lots } = renderHome('2027-03-08T00:00:01-03:00');
  assert.match(grid, /Inscrições encerradas/);
  assert.doesNotMatch(grid, /href="\/checkout/);
  assert.match(grid, /https:\/\/wa.me/);
  assert.match(lots, /Inscrições encerradas/);
});
