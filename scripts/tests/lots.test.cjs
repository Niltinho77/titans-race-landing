/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(readFileSync('src/config/lots.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports: exportsObject, require: () => ({}), Date });
const { getLotStatus, getTicketPrice, getVeteranDiscount, getPricingLot } = exportsObject;
const at = (iso) => Date.parse(iso);

test('antes da pré-venda as inscrições ainda não abriram', () => {
  const status = getLotStatus(at('2026-11-24T23:59:59-03:00'));
  assert.equal(status.phase, 'upcoming');
  assert.equal(status.next.id, 'preVendaVeteranos');
});

test('viradas de lote acontecem à meia-noite de Brasília (Black Week abre às 00:01)', () => {
  assert.equal(getLotStatus(at('2026-11-25T00:00:00-03:00')).current.id, 'preVendaVeteranos');
  assert.equal(getLotStatus(at('2026-11-26T23:59:59-03:00')).current.id, 'preVendaVeteranos');
  assert.equal(getLotStatus(at('2026-11-27T00:00:59-03:00')).current.id, 'preVendaVeteranos');
  assert.equal(getLotStatus(at('2026-11-27T00:01:00-03:00')).current.id, 'blackWeek');
  assert.equal(getLotStatus(at('2026-12-02T23:59:59-03:00')).current.id, 'blackWeek');
  assert.equal(getLotStatus(at('2026-12-03T00:00:00-03:00')).current.id, 'lote1');
  assert.equal(getLotStatus(at('2027-01-15T12:00:00-03:00')).current.id, 'lote2');
  assert.equal(getLotStatus(at('2027-02-14T23:59:59-03:00')).current.id, 'loteFinal');
  assert.equal(getLotStatus(at('2027-02-15T00:00:00-03:00')).current.id, 'loteExtra');
  assert.equal(getLotStatus(at('2027-03-07T23:59:59-03:00')).current.id, 'loteExtra');
});

test('inscrições encerram em 08/03 00h00', () => {
  const status = getLotStatus(at('2027-03-08T00:00:00-03:00'));
  assert.equal(status.phase, 'ended');
  assert.equal(getPricingLot(at('2027-03-10T00:00:00-03:00')).id, 'loteExtra');
});

test('preços por modalidade', () => {
  const lote1 = getLotStatus(at('2026-12-10T12:00:00-03:00')).current;
  assert.equal(getTicketPrice('competicao', lote1), 14800);
  assert.equal(getTicketPrice('diversao', lote1), 14800);
  assert.equal(getTicketPrice('duplas', lote1), 29600);
  assert.equal(getTicketPrice('equipes', lote1), 59200);
  assert.equal(getTicketPrice('kids', lote1), 8000);
  const bf = getLotStatus(at('2026-11-28T12:00:00-03:00')).current;
  assert.equal(getTicketPrice('competicao', bf), 12800);
  assert.equal(getTicketPrice('kids', bf), 7500);
});

test('desconto de veterano só nos lotes 1, 2 e Final', () => {
  const lote2 = getLotStatus(at('2027-01-10T12:00:00-03:00')).current;
  assert.equal(getVeteranDiscount('duplas', lote2, 2), 2000);
  const bf = getLotStatus(at('2026-11-28T12:00:00-03:00')).current;
  assert.equal(getVeteranDiscount('competicao', bf, 1), 0);
  const final = getLotStatus(at('2027-02-10T12:00:00-03:00')).current;
  assert.equal(getVeteranDiscount('competicao', final, 1), 1000);
  const extra = getLotStatus(at('2027-03-02T12:00:00-03:00')).current;
  assert.equal(getVeteranDiscount('competicao', extra, 1), 0);
});

test('Lote Extra custa o mesmo que o Lote Final e não inclui camiseta', () => {
  const final = getLotStatus(at('2027-02-10T12:00:00-03:00')).current;
  const extra = getLotStatus(at('2027-03-02T12:00:00-03:00')).current;
  assert.equal(extra.adultPrice, final.adultPrice);
  assert.equal(extra.kidsPrice, final.kidsPrice);
  assert.equal(final.includesShirt, true);
  assert.equal(extra.includesShirt, false);
});
