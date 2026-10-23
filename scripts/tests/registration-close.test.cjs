/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

function load(file, mocks = {}) {
  const code = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => mocks[name] ?? (name === 'react/jsx-runtime' ? require(name) : {}), Date });
  return exports;
}
const schedule = load('src/config/registration.ts');
test('registrations are closed from October 23 in Brasilia', () => {
  const cutoff = Date.parse(schedule.REGISTRATION_CLOSES_AT);
  assert.equal(new Date(cutoff).toISOString(), '2026-10-23T03:00:00.000Z');
  assert.equal(schedule.registrationsAreClosed(cutoff - 1), false);
  assert.equal(schedule.registrationsAreClosed(cutoff), true);
  assert.equal(schedule.registrationsAreClosed(cutoff + 86400000), true);
  assert.equal(schedule.registrationsAreClosed(), true);
});
for (const gateway of ['start', 'start-asaas', 'start-mp', 'start-pagbank']) {
  test(`${gateway} refuses registration at cutoff before reading payload or accessing payments/database`, async () => {
    const fail = () => { throw Error('Unexpected side effect after closing'); };
    const route = load(`src/app/api/checkout/${gateway}/route.ts`, {
      '@/config/registration': schedule,
      'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
      '@/lib/prisma': { prisma: new Proxy({}, { get: fail }) },
    });
    const response = await route.POST({ json: fail });
    assert.equal(response.status, 403);
    assert.equal(response.body.error, 'Inscrições encerradas');
  });
}

const { renderToStaticMarkup } = require('react-dom/server');
const { createElement } = require('react');
for (const closed of [false, true]) {
  test(`homepage modalities and lots show ${closed ? 'closed' : 'open'} state`, () => {
    const mocks = {
      '@/hooks/useRegistrationClosed': { useRegistrationClosed: () => closed },
      '@/config/checkout': load('src/config/checkout.ts'),
      'framer-motion': { motion: new Proxy({}, { get: () => 'div' }) },
      'lucide-react': { Lock: () => null, Flame: () => null },
    };
    const { ExperienceGridSection } = load('src/components/ExperienceGridSection.tsx', mocks);
    const { RegistrationSection } = load('src/components/RegistrationSection.tsx', mocks);
    const grid = renderToStaticMarkup(createElement(ExperienceGridSection));
    const lots = renderToStaticMarkup(createElement(RegistrationSection));
    if (closed) {
      assert.match(grid, /Inscrições encerradas/);
      assert.doesNotMatch(grid, /href="\/checkout/);
      assert.match(grid, /https:\/\/wa.me/);
      assert.match(lots, /Inscrições encerradas/);
      assert.doesNotMatch(lots, /Aberto agora|Último lote aberto|inscrições abertas/);
    } else {
      assert.equal((grid.match(/href="\/checkout/g) || []).length, 5);
      assert.match(lots, /Aberto agora/);
    }
  });
}
