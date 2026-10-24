/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

async function run(transfer, body, role = 'PARTICIPANT') {
  const participant = { id: 'athlete', tshirtSize: 'Camiseta M', email: 'athlete@example.com', order: { modalityId: 'competicao' } };
  const writes = [];
  const mocks = {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
    '@/lib/portalAuth': { changesAreOpen: () => true, requirePortalUser: async () => ({ id: 'user', email: participant.email, role }), normalizeEmail: s => s.trim().toLowerCase() },
    '@/lib/email': { sendPortalPasswordSetupEmail: async () => { throw Error('Unexpected email'); } },
    '@/lib/prisma': { prisma: {
      participant: { findFirst: async () => participant, update: async ({ data }) => { writes.push(data); Object.assign(participant, data); return participant; } },
      participantChangeLog: { create: async () => ({}) },
      portalUser: { upsert: async () => ({ requiresPasswordSetup: false, passwordHash: 'existing' }) },
      $transaction: async ops => Promise.all(ops),
    } },
  };
  const path = `src/app/api/portal/participants/[id]/${transfer ? 'transfer/' : ''}route.ts`;
  const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => mocks[name] ?? require(name) });
  const response = await exports[transfer ? 'POST' : 'PATCH']({ json: async () => body }, { params: Promise.resolve({ id: participant.id }) });
  return { response, participant, writes };
}

for (const role of ['PARTICIPANT', 'ADMIN']) {
  test(`portal update preserves shirt size against crafted payload (${role})`, async () => {
    const result = await run(false, { tshirtSize: 'Camiseta GG', city: 'Alegrete' }, role);
    assert.equal(result.response.status, 200);
    assert.equal(result.participant.tshirtSize, 'Camiseta M');
    assert.equal(result.participant.city, 'Alegrete');
    assert.equal(Object.hasOwn(result.writes[0], 'tshirtSize'), false);
  });
}
test('shirt-only update makes no database writes', async () => {
  const result = await run(false, { tshirtSize: 'Camiseta GG' });
  assert.equal(result.response.status, 400);
  assert.equal(result.writes.length, 0);
});
for (const tshirtSize of [undefined, 'Camiseta GG']) {
  test(`transfer preserves original shirt with requested size ${tshirtSize}`, async () => {
    const result = await run(true, { fullName: 'New Athlete', cpf: '12345678901', birthDate: '1990-01-01', phone: '55999999999', email: 'new@example.com', termsAccepted: true, tshirtSize });
    assert.equal(result.response.status, 200);
    assert.equal(result.participant.fullName, 'New Athlete');
    assert.equal(result.participant.tshirtSize, 'Camiseta M');
    assert.equal(Object.hasOwn(result.writes[0], 'tshirtSize'), false);
  });
}
