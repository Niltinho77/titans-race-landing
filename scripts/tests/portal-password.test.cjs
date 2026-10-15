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
    }, scenario === 'missing-config' ? {} : { RESEND_API_KEY: 'test', RESEND_FROM: 'test@example.com' });
    const send = () => lib.sendPortalPasswordSetupEmail({ to: 'athlete@example.com', name: '<Athlete>', setupUrl: 'https://titansrace.com.br/portal/definir-senha?token=test', expiresAt: new Date() });
    if (scenario === 'accepted') {
      await send();
      assert.match(payload.html, /&lt;Athlete&gt;/);
      assert.match(payload.text, /token=test/);
    } else await assert.rejects(send);
  });
}
