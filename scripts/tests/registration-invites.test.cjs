/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

function load(file, mocks = {}, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { exports, require: name => mocks[name] ?? require(name), Date, Error, Map, Set, URL, process: { env: {} }, console: { error() {} }, ...globals });
  return exports;
}
const helpers = load('src/lib/registrationInvites.ts');
const checkout = load('src/config/checkout.ts');
const json = { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } };

function setup({ expired = false, revoked = false, used = false, modality = 'equipes', failGateway = false } = {}) {
  const token = helpers.createInviteToken();
  const invite = { tokenHash: helpers.hashInviteToken(token), modalityId: modality, expiresAt: new Date(Date.now() + (expired ? -1000 : 3600000)), claimedAt: used ? new Date() : null, revokedAt: revoked ? new Date() : null };
  let orders = 0; let gatewayCalls = 0; let linkedOrder;
  const db = {
    registrationInvite: {
      updateMany: async ({ where, data }) => {
        if (where.tokenHash !== invite.tokenHash || where.modalityId !== invite.modalityId || invite.claimedAt || invite.revokedAt || invite.expiresAt <= where.expiresAt.gt) return { count: 0 };
        Object.assign(invite, data); return { count: 1 };
      },
      update: async ({ data }) => { linkedOrder = data.orderId; },
    },
    order: {
      create: async ({ data }) => { orders++; return { id: 'order-one', ...data, participants: data.participants.create }; },
      update: async () => ({}), updateMany: async () => ({}),
    },
    $transaction: async fn => fn(db),
  };
  const route = load('src/app/api/checkout/start-asaas/route.ts', {
    'next/server': json, '@/lib/prisma': { prisma: db }, '@/config/checkout': checkout,
    '@/config/registration': { registrationsAreClosed: () => true, REGISTRATION_CLOSED_MESSAGE: 'Inscrições encerradas' },
    '@/config/externalPayment': { isExternalPaymentCoupon: () => false },
    '@/lib/registrationInvites': helpers, '@/lib/email': {}, '@/lib/orderAttribution': { cleanOrderAttribution: () => ({}) },
    '@/lib/asaas': {
      normalizeCpfCnpj: s => s, normalizePhone: s => s, centsToAsaasValue: s => s / 100,
      createAsaasCheckout: async () => { gatewayCalls++; if (failGateway) throw Error('Gateway unavailable'); return { checkoutId: 'asaas-one', checkoutUrl: 'https://asaas.example/pay' }; },
    },
  });
  const body = { modalityId: modality, tickets: 1, termsAccepted: true, participants: Array.from({ length: modality === 'equipes' ? 4 : 1 }, (_, i) => ({ fullName: `Athlete ${i}`, email: `athlete${i}@example.test`, cpf: '00000000000', phone: '00000000000', tshirtSize: 'M' })) };
  const request = (changes = {}, suppliedToken = token) => ({ url: 'https://titans.example/api/checkout/start-asaas', headers: { get: () => suppliedToken }, json: async () => ({ ...body, ...changes }) });
  return { route, request, token, get orders() { return orders; }, get gatewayCalls() { return gatewayCalls; }, get linkedOrder() { return linkedOrder; } };
}

test('tokens are random, unguessable and stored as hashes', () => {
  const a = helpers.createInviteToken(); const b = helpers.createInviteToken();
  assert.equal(helpers.isInviteToken(a), true); assert.notEqual(a, b);
  assert.notEqual(helpers.hashInviteToken(a), a); assert.equal(helpers.hashInviteToken(a).length, 64);
  assert.equal(helpers.isInviteToken('../bad'), false);
});
test('public checkout remains blocked without reading participant data', async () => {
  const s = setup();
  const response = await s.route.POST({ headers: { get: () => null }, json: () => { throw Error('must not read'); } });
  assert.equal(response.status, 403); assert.equal(s.orders, 0); assert.equal(s.gatewayCalls, 0);
});
test('valid invitation permits one quartet and links it to one payment', async () => {
  const s = setup(); const response = await s.route.POST(s.request());
  assert.equal(response.status, 200); assert.equal(s.orders, 1); assert.equal(s.gatewayCalls, 1); assert.equal(s.linkedOrder, 'order-one');
});

test('finishing the invitation form sends its token and opens payment after public closing', async () => {
  const s = setup();
  let stateIndex = 0;
  let sentToken;
  const { participants } = await s.request().json();
  const browser = { location: { href: '' } };
  const { CheckoutScreen } = load('src/components/checkout/CheckoutScreen.tsx', {
    react: {
      useState: initial => {
        const index = stateIndex++;
        return [index === 0 ? 3 : index === 3 ? participants.map(p => ({ ...p, birthDate: '01/01/1990', extras: [] })) : index === 4 ? true : initial, () => {}];
      },
      useEffect: () => {}, useMemo: fn => fn(),
    },
    '@/hooks/useRegistrationClosed': { useRegistrationClosed: () => true },
    '@/config/checkout': checkout,
    '@/config/externalPayment': { isExternalPaymentCoupon: () => false },
    '@/lib/analytics': { trackAnalyticsEvent: () => {} },
    '@/components/AnalyticsTracker': { getAnalyticsContext: () => ({}) },
    'framer-motion': { motion: { div: 'div' } },
    'next/link': { default: 'a' },
  }, {
    window: browser,
    fetch: async (url, options) => {
      assert.equal(url, '/api/checkout/start-asaas');
      sentToken = options.headers['x-registration-invite'];
      const response = await s.route.POST(s.request(JSON.parse(options.body), sentToken ?? null));
      assert.equal(response.status, 200);
      return { ok: true, json: async () => response.body };
    },
  });
  const tree = CheckoutScreen({ initialModality: checkout.getModalityById('equipes'), inviteToken: s.token });
  function findFinish(node) {
    if (!node || typeof node !== 'object') return null;
    if (node.type === 'button' && node.props?.children === 'Finalizar inscrição') return node.props.onClick;
    for (const child of [node.props?.children].flat(Infinity)) {
      const found = findFinish(child);
      if (found) return found;
    }
    return null;
  }
  const finish = findFinish(tree);
  assert.equal(typeof finish, 'function');
  await finish();
  await new Promise(setImmediate);
  assert.equal(sentToken, s.token);
  assert.equal(s.orders, 1);
  assert.equal(s.gatewayCalls, 1);
  assert.equal(browser.location.href, 'https://asaas.example/pay');
});
test('concurrent use of the same link creates only one order and one charge', async () => {
  const s = setup(); const results = await Promise.all([s.route.POST(s.request()), s.route.POST(s.request())]);
  assert.deepEqual(results.map(r => r.status).sort(), [200, 403]); assert.equal(s.orders, 1); assert.equal(s.gatewayCalls, 1);
});
for (const options of [{ expired: true }, { revoked: true }, { used: true }]) {
  test(`unavailable invitation is refused: ${JSON.stringify(options)}`, async () => {
    const s = setup(options); assert.equal((await s.route.POST(s.request())).status, 403); assert.equal(s.orders, 0); assert.equal(s.gatewayCalls, 0);
  });
}
test('tampered token and modality cannot bypass closing', async () => {
  for (const attack of ['token', 'modality', 'tickets']) {
    const s = setup();
    const req = attack === 'token' ? s.request({}, helpers.createInviteToken()) : attack === 'modality' ? s.request({ modalityId: 'kids', participants: [{ fullName: 'Other', email: 'other@example.test' }] }) : s.request({ tickets: 2 });
    assert.notEqual((await s.route.POST(req)).status, 200); assert.equal(s.orders, 0); assert.equal(s.gatewayCalls, 0);
  }
});
test('uncertain gateway failure never releases link for another order', async () => {
  const s = setup({ failGateway: true });
  assert.equal((await s.route.POST(s.request())).status, 500);
  assert.equal((await s.route.POST(s.request())).status, 403);
  assert.equal(s.orders, 1); assert.equal(s.gatewayCalls, 1);
});
test('admin API denies unauthenticated and non-admin callers', async () => {
  for (const user of [null, { role: 'PARTICIPANT' }]) {
    const route = load('src/app/api/admin/registration-invites/route.ts', {
      'next/server': json, '@/lib/prisma': {}, '@/config/checkout': checkout, '@/lib/registrationInvites': helpers,
      '@/lib/portalAuth': { getCurrentPortalUser: async () => user },
    });
    const req = { json: () => { throw Error('must not read'); } };
    assert.equal((await route.POST(req)).status, 403); assert.equal((await route.DELETE(req)).status, 403);
  }
});

test('admin creation stores only token hash and enforces a bounded validity', async () => {
  let saved;
  const route = load('src/app/api/admin/registration-invites/route.ts', {
    'next/server': json, '@/config/checkout': checkout, '@/lib/registrationInvites': helpers,
    '@/lib/portalAuth': { getCurrentPortalUser: async () => ({ role: 'ADMIN' }) },
    '@/lib/prisma': { prisma: { registrationInvite: { create: async ({ data }) => { saved = data; return { id: 'invite-one', ...data }; } } } },
  });
  for (const validHours of [0, 169, 1.5]) {
    assert.equal((await route.POST({ json: async () => ({ label: 'Quarteto', modalityId: 'equipes', validHours }) })).status, 400);
    assert.equal(saved, undefined);
  }
  const result = await route.POST({ json: async () => ({ label: 'Quarteto', modalityId: 'equipes', validHours: 24 }) });
  assert.equal(result.status, 200);
  const token = result.body.path.split('/').at(-1);
  assert.equal(helpers.isInviteToken(token), true); assert.equal(saved.tokenHash, helpers.hashInviteToken(token));
  assert.equal(JSON.stringify(saved).includes(token), false);
});

test('revocation targets only invitations that have not been claimed', async () => {
  let query;
  const route = load('src/app/api/admin/registration-invites/route.ts', {
    'next/server': json, '@/config/checkout': checkout, '@/lib/registrationInvites': helpers,
    '@/lib/portalAuth': { getCurrentPortalUser: async () => ({ role: 'ADMIN' }) },
    '@/lib/prisma': { prisma: { registrationInvite: { updateMany: async args => { query = args; return { count: 1 }; } } } },
  });
  const result = await route.DELETE({ json: async () => ({ id: 'invite-one' }) });
  assert.equal(result.body.ok, true); assert.equal(query.where.claimedAt, null); assert.equal(query.where.revokedAt, null); assert.ok(query.data.revokedAt instanceof Date);
});

const { renderToStaticMarkup } = require('react-dom/server');
for (const state of ['available', 'expired', 'revoked', 'pending', 'paid', 'failed']) {
  test(`invitation page presents the correct state: ${state}`, async () => {
    const token = helpers.createInviteToken();
    const claimed = ['pending', 'paid', 'failed'].includes(state);
    const invite = {
      modalityId: 'equipes', expiresAt: new Date(Date.now() + (state === 'expired' ? -1000 : 3600000)),
      revokedAt: state === 'revoked' ? new Date() : null, claimedAt: claimed ? new Date() : null,
      order: claimed ? { status: state.toUpperCase(), asaasInvoiceUrl: 'https://asaas.example/pay' } : null,
    };
    const { default: Page } = load('src/app/convite/[token]/page.tsx', {
      '@/lib/prisma': { prisma: { registrationInvite: { findUnique: async () => invite } } },
      '@/lib/registrationInvites': helpers, '@/config/checkout': checkout,
      '@/components/checkout/CheckoutScreen': { CheckoutScreen: () => require('react').createElement('div', {}, 'INVITE_FORM') },
    });
    const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ token }) }));
    assert.equal(html.includes('INVITE_FORM'), state === 'available');
    assert.equal(html.includes('Continuar pagamento'), state === 'pending');
    if (state === 'paid') assert.match(html, /já foi confirmada/);
  });
}
