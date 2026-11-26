/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
function load(file, mocks, env = {}) {
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => mocks[name] ?? require(name), console: { error() {}, warn() {} }, process: { env }, Date, Intl });
  return exports;
}
async function request({ existing = null, participant = null, fail = false, email = ' ATLETA@example.com ' } = {}) {
  const calls = [];
  const route = load('src/app/api/portal/password/request/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
    '@/lib/portalAuth': { normalizeEmail: s => s.trim().toLowerCase(), portalBaseUrl: () => 'https://titansrace.com.br', createPasswordToken: async id => { calls.push(['token', id]); return { token: 'test-token', expiresAt: new Date() }; } },
    '@/lib/prisma': { prisma: {
      portalUser: { findUnique: async () => existing, upsert: async args => { calls.push(['create', args]); return { id: 'new', ...args.create }; } },
      participant: { findFirst: async args => { calls.push(['participant', args]); return participant; } },
    } },
    '@/lib/email': { sendPortalPasswordSetupEmail: async args => { calls.push(['email', args]); if (fail) throw Error('Provider rejected'); } },
  });
  return { response: await route.POST({ json: async () => ({ email }) }), calls };
}
test('paid participant without portal account gets first access on demand', async () => {
  const { response, calls } = await request({ participant: { fullName: 'Atleta' } });
  assert.equal(response.status, 200);
  assert.equal(calls.find(x => x[0] === 'participant')[1].where.order.status, 'PAID');
  assert.equal(calls.find(x => x[0] === 'create')[1].create.email, 'atleta@example.com');
  assert.equal(calls.find(x => x[0] === 'email')[1].to, 'atleta@example.com');
});
test('existing account receives reset without modifying account or password', async () => {
  const { response, calls } = await request({ existing: { id: 'existing', email: 'atleta@example.com' } });
  assert.equal(response.status, 200);
  assert.deepEqual(calls.map(x => x[0]), ['token', 'email']);
});
test('unknown email receives generic response without creating account or sending', async () => {
  const { response, calls } = await request();
  assert.equal(response.status, 200);
  assert.deepEqual(calls.map(x => x[0]), ['participant']);
});
test('provider failure returns actionable error instead of success', async () => {
  const { response } = await request({ existing: { id: 'existing', email: 'atleta@example.com' }, fail: true });
  assert.equal(response.status, 503);
  assert.equal(response.body.ok, undefined);
});
test('invalid email is rejected before database or provider calls', async () => {
  const { response, calls } = await request({ email: 'invalid' });
  assert.equal(response.status, 400);
  assert.equal(calls.length, 0);
});
for (const scenario of ['missing-config', 'rejected', 'missing-id', 'accepted']) {
  test(`password mail handles ${scenario}`, async () => {
    let payload;
    const lib = load('src/lib/email.ts', {
      resend: { Resend: class { emails = { send: async args => { payload = args; return scenario === 'rejected' ? { error: { message: 'rate limit' } } : { data: scenario === 'missing-id' ? null : { id: 'email-id' } }; } }; } },
      '@/lib/dateTime': { BRAZIL_TIME_ZONE: 'America/Sao_Paulo' },
      '@/config/event': { EVENT: {} },
      '@/lib/portalAccess': {},
    }, scenario === 'missing-config' ? {} : { RESEND_API_KEY: 'test', RESEND_FROM: 'test@example.com' });
    const send = () => lib.sendPortalPasswordSetupEmail({ to: 'athlete@example.com', name: '<Athlete>', setupUrl: 'https://titansrace.com.br/portal/definir-senha?token=test', expiresAt: new Date() });
    if (scenario === 'accepted') {
      await send();
      assert.match(payload.html, /&lt;Athlete&gt;/);
      assert.match(payload.text, /token=test/);
    } else await assert.rejects(send);
  });
}

function loadConfirmation({ access, reject = false }) {
  const sent = [];
  let reverted = 0;
  const lib = load('src/lib/email.ts', {
    resend: { Resend: class { emails = { send: async args => { sent.push(args); return reject ? { error: { message: 'rate limit' } } : { data: { id: 'email-id' } }; } }; } },
    '@/lib/dateTime': { BRAZIL_TIME_ZONE: 'America/Sao_Paulo' },
    '@/config/event': { EVENT: { dateLabel: '14 de março de 2027', editionLabel: '3ª edição', city: 'Alegrete/RS' } },
    '@/lib/portalAccess': { ensurePortalAccess: async () => (access === 'error' ? Promise.reject(new Error('db down')) : { ...access, revert: async () => { reverted++; } }) },
  }, { RESEND_API_KEY: 'test', RESEND_FROM: 'test@example.com' });
  const send = () => lib.sendOrderConfirmationEmail({ to: 'atleta@example.com', participantName: '<Jorge> Nei', orderId: 'cmwwmjrmt016hto8kamlfc3rz', modalityName: 'Competição', totalAmount: 13373 });
  return { send, sent, reverted: () => reverted };
}

test('confirmation email brings login and temporary password for new portal accounts', async () => {
  const { send, sent } = loadConfirmation({ access: { login: 'atleta@example.com', temporaryPassword: 'Ab3dEf7hJk' } });
  await send();
  assert.match(sent[0].html, /atleta@example\.com/);
  assert.match(sent[0].html, /Ab3dEf7hJk/);
  assert.match(sent[0].html, /&lt;Jorge&gt;/);
  assert.doesNotMatch(sent[0].html, /<Jorge>/);
  assert.match(sent[0].text, /Senha provisória: Ab3dEf7hJk/);
  assert.match(sent[0].html, /R\$\s?133,73/);
});

test('confirmation email never shows a password for accounts that already have one', async () => {
  const { send, sent } = loadConfirmation({ access: { login: 'atleta@example.com', temporaryPassword: null } });
  await send();
  assert.match(sent[0].html, /a mesma que você já usa/);
});

test('confirmation email still goes out if portal access fails', async () => {
  const { send, sent } = loadConfirmation({ access: 'error' });
  await send();
  assert.equal(sent.length, 1);
  assert.match(sent[0].text, /Definir ou recuperar senha/);
});

test('temporary password is undone when the email is rejected', async () => {
  const { send, reverted } = loadConfirmation({ access: { login: 'atleta@example.com', temporaryPassword: 'Ab3dEf7hJk' }, reject: true });
  await assert.rejects(send);
  assert.equal(reverted(), 1);
});

function loadAccess(existing) {
  const writes = [];
  const prisma = { portalUser: {
    findUnique: async () => existing,
    updateMany: async (args) => { writes.push(['update', args]); return { count: 1 }; },
    create: async (args) => { writes.push(['create', args]); return { id: 'new-user' }; },
  } };
  const lib = load('src/lib/portalAccess.ts', {
    crypto: { default: require('node:crypto') },
    '@/lib/prisma': { prisma },
    '@/lib/portalAuth': { normalizeEmail: s => s.trim().toLowerCase(), hashPassword: async p => `hash:${p}` },
  });
  return { lib, writes };
}

test('portal access never replaces an existing password', async () => {
  const { lib, writes } = loadAccess({ id: 'u1', passwordHash: 'scrypt$old' });
  const access = await lib.ensurePortalAccess(' Atleta@Example.com ', 'Atleta');
  assert.equal(access.login, 'atleta@example.com');
  assert.equal(access.temporaryPassword, null);
  assert.equal(writes.length, 0);
});

test('portal access creates an account with a temporary password', async () => {
  const { lib, writes } = loadAccess(null);
  const access = await lib.ensurePortalAccess('atleta@example.com', 'Atleta');
  assert.match(access.temporaryPassword, /^[A-HJ-NP-Za-hj-np-z2-9]{10}$/);
  assert.equal(writes[0][0], 'create');
  assert.equal(writes[0][1].data.passwordHash, `hash:${access.temporaryPassword}`);
  assert.equal(writes[0][1].data.role, 'PARTICIPANT');
});

test('portal access fills in a password only for accounts still without one', async () => {
  const { lib, writes } = loadAccess({ id: 'u2', passwordHash: null });
  const access = await lib.ensurePortalAccess('atleta@example.com', 'Atleta');
  assert.ok(access.temporaryPassword);
  assert.equal(JSON.stringify(writes[0][1].where), JSON.stringify({ id: 'u2', passwordHash: null }));
});
