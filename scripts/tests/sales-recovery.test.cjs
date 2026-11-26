/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(readFileSync('src/lib/salesRecovery.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports: exportsObject, Date });
const { isSalesRecoveryOrder } = exportsObject;
const now = Date.parse('2026-10-16T02:45:00Z');
const recent = { id: 'roseval', status: 'PENDING', createdAt: new Date(now - 5 * 60 * 1000) };

test('manual inclusion shows only the specified recent order', () => {
  assert.equal(isSalesRecoveryOrder(recent, new Set(['roseval']), now), true);
  assert.equal(isSalesRecoveryOrder({ ...recent, id: 'other' }, new Set(['roseval']), now), false);
});
test('normal 30-minute wait remains unchanged', () => {
  assert.equal(isSalesRecoveryOrder(recent, new Set(), now), false);
  assert.equal(isSalesRecoveryOrder({ ...recent, createdAt: new Date(now - 30 * 60 * 1000) }, new Set(), now), true);
});
test('paid or refunded orders cannot be included by the manual flag', () => {
  for (const status of ['PAID', 'CONFIRMED', 'REFUNDED', 'CHARGEBACK']) {
    assert.equal(isSalesRecoveryOrder({ ...recent, status }, new Set(['roseval']), now), false);
  }
});
test('failed, expired and canceled attempts remain visible', () => {
  for (const status of ['FAILED', 'OVERDUE', 'CANCELED']) {
    assert.equal(isSalesRecoveryOrder({ ...recent, status }, new Set(), now), true);
  }
});
