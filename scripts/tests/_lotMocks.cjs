/* eslint-disable @typescript-eslint/no-require-imports */
// Carrega src/config/lots.ts e src/lib/lotPricing.ts com o relógio fixo numa data de teste.
const ts = require('typescript');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

function transpile(file) {
  return ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
}

function pinnedDate(iso) {
  const fixed = Date.parse(iso);
  return class extends Date {
    constructor(...args) { super(...(args.length ? args : [fixed])); }
    static now() { return fixed; }
  };
}

function loadLots(iso = '2026-12-10T12:00:00-03:00') {
  const exports = {};
  vm.runInNewContext(transpile('src/config/lots.ts'), { exports, require: () => ({}), Date: pinnedDate(iso) });
  return exports;
}

// veteranCpfs: correram a 1ª ou a 2ª edição. bothEditionCpfs: correram as duas (ganham o desconto).
// paidByLot: atletas em pedidos pagos por lote, ex.: { blackWeek: 100 } (vagas esgotadas).
function loadLotPricing(lots, veteranCpfs = [], bothEditionCpfs = veteranCpfs, { paidByLot = {}, iso } = {}) {
  const exports = {};
  const prisma = {
    veteranAthlete: { findMany: async ({ where }) => where.cpf.in.filter((cpf) => veteranCpfs.includes(cpf)).map((cpf) => ({ cpf, bothEditions: bothEditionCpfs.includes(cpf) })) },
    participant: { count: async ({ where }) => (where.order.status === 'PAID' ? where.order.lotId.in.reduce((sum, id) => sum + (paidByLot[id] ?? 0), 0) : 0) },
  };
  vm.runInNewContext(transpile('src/lib/lotPricing.ts'), {
    exports, Set, Array, Infinity, console: { error() {} },
    ...(iso ? { Date: pinnedDate(iso) } : {}),
    require: (name) => (name === '@/lib/prisma' ? { prisma } : name === '@/config/lots' ? lots : {}),
  });
  return exports;
}

module.exports = { loadLots, loadLotPricing, pinnedDate };
