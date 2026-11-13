/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

function load(path, mocks) {
  const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, process, Date, require: name => mocks[name] ?? require(name) });
  return exports;
}

const portalAuth = load('src/lib/portalAuth.ts', {
  'next/headers': { cookies: async () => ({}) },
  'next/navigation': { redirect: () => {} },
  '@/lib/prisma': { prisma: {} },
});

async function run(transfer, role) {
  const participant = { id: 'athlete', fullName: 'Old Athlete', tshirtSize: 'Camiseta M', email: 'athlete@example.com', order: { modalityId: 'competicao' } };
  const writes = [];
  const mocks = {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
    '@/lib/portalAuth': { ...portalAuth, requirePortalUser: async () => ({ id: 'user', email: participant.email, role }), createPasswordToken: async () => ({ token: 't', expiresAt: new Date() }), portalBaseUrl: () => 'https://example.com' },
    '@/lib/email': { sendPortalPasswordSetupEmail: async () => {} },
    '@/lib/prisma': { prisma: {
      participant: { findFirst: async () => participant, update: async ({ data }) => { writes.push(data); Object.assign(participant, data); return participant; } },
      participantChangeLog: { create: async () => { writes.push('log'); return {}; } },
      portalUser: { upsert: async () => ({ requiresPasswordSetup: false, passwordHash: 'existing' }) },
      $transaction: async ops => Promise.all(ops),
    } },
  };
  const route = load(`src/app/api/portal/participants/[id]/${transfer ? 'transfer/' : ''}route.ts`, mocks);
  const body = transfer
    ? { fullName: 'New Athlete', cpf: '12345678901', birthDate: '01/01/1990', phone: '55999999999', email: 'new@example.com', termsAccepted: true }
    : { city: 'Alegrete', phone: '55999999999' };
  const response = await route[transfer ? 'POST' : 'PATCH']({ json: async () => body }, { params: Promise.resolve({ id: participant.id }) });
  return { response, participant, writes };
}

test('portal changes are locked regardless of PORTAL_CHANGES_CLOSE_AT', () => {
  assert.equal(portalAuth.PORTAL_CHANGES_LOCKED, true);
  process.env.PORTAL_CHANGES_CLOSE_AT = '2999-01-01T00:00:00-03:00';
  try {
    assert.equal(portalAuth.changesAreOpen(), false);
  } finally {
    delete process.env.PORTAL_CHANGES_CLOSE_AT;
  }
  assert.equal(portalAuth.changesAreOpen(), false);
});

for (const transfer of [false, true]) {
  const kind = transfer ? 'transfer' : 'update';
  test(`athlete ${kind} is refused with no database writes`, async () => {
    const result = await run(transfer, 'PARTICIPANT');
    assert.equal(result.response.status, 403);
    assert.equal(result.writes.length, 0);
    assert.equal(result.participant.fullName, 'Old Athlete');
  });
  test(`admin ${kind} still works`, async () => {
    const result = await run(transfer, 'ADMIN');
    assert.equal(result.response.status, 200);
    assert.ok(result.writes.length > 0);
  });
}
