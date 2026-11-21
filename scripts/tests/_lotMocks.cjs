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

function loadLotPricing(lots, veteranCpfs = []) {
  const exports = {};
  const prisma = { veteranAthlete: { findMany: async ({ where }) => where.cpf.in.filter((cpf) => veteranCpfs.includes(cpf)).map((cpf) => ({ cpf })) } };
  vm.runInNewContext(transpile('src/lib/lotPricing.ts'), {
    exports, Set, Array,
    require: (name) => (name === '@/lib/prisma' ? { prisma } : name === '@/config/lots' ? lots : {}),
  });
  return exports;
}

module.exports = { loadLots, loadLotPricing, pinnedDate };
