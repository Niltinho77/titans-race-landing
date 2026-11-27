/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

function load(file, mocks = {}, extra = {}) {
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: (name) => mocks[name] ?? require(name), console: { error() {} }, Date, Map, Set, URL, JSON, ...extra });
  return exports;
}
const plain = (value) => JSON.parse(JSON.stringify(value));

const names = load('src/lib/teamNames.ts');
const cities = load('src/config/cities.ts');
const rankingConfig = load('src/config/ranking.ts');
const rankingMocks = { '@/lib/prisma': { prisma: {} }, '@/config/cities': cities, '@/config/ranking': rankingConfig };
const { buildRanking, countsForRanking } = load('src/lib/ranking.ts', rankingMocks);

test('nomes de equipe parecidos viram a mesma chave', () => {
  assert.equal(names.normalizeTeamName('MP Fit'), 'mpfit');
  assert.equal(names.normalizeTeamName('MPFit'), 'mpfit');
  assert.equal(names.normalizeTeamName('mp-fit'), 'mpfit');
  assert.equal(names.normalizeTeamName('Evolução Gym'), 'evolucaogym');
  assert.equal(names.cleanTeamName('  Bora   Correr  SG '), 'Bora Correr SG');
});

test('Instagram aceita @, link ou nome puro', () => {
  assert.equal(names.normalizeInstagram('@MPFit'), 'mpfit');
  assert.equal(names.normalizeInstagram('https://www.instagram.com/mp.fit_/?hl=pt'), 'mp.fit_');
  assert.equal(names.normalizeInstagram('nome com espaço'), 'nome');
  assert.equal(names.normalizeInstagram('!!!'), '');
});

test('escolha de equipe inválida é ignorada', () => {
  assert.equal(names.parseTeamChoice(null), null);
  assert.equal(names.parseTeamChoice({ teamId: "x'; drop" }), null);
  assert.equal(names.parseTeamChoice({ newTeam: { name: 'a' } }), null);
  assert.deepEqual(plain(names.parseTeamChoice({ independent: true })), { independent: true });
  assert.deepEqual(plain(names.parseTeamChoice({ teamId: 'cmwwmjrmt016hto8kamlfc3rz' })), { teamId: 'cmwwmjrmt016hto8kamlfc3rz' });
  assert.deepEqual(plain(names.parseTeamChoice({ newTeam: { name: ' Box  Fronteira ', instagram: '@BoxFronteira' } })), { newTeam: { name: 'Box Fronteira', instagram: 'boxfronteira' } });
});

test('escudo provisório: iniciais e cor fixa', () => {
  assert.equal(names.teamInitials('Evolution Gym'), 'EG');
  assert.equal(names.teamInitials('Bora Correr SG'), 'BC');
  assert.equal(names.teamInitials('Academia da Praça'), 'AP');
  assert.equal(names.teamInitials('CrossFit'), 'CR');
  assert.equal(names.teamColor('MP Fit'), names.teamColor('mpfit'));
});

test('cidade digitada de jeitos diferentes cai na mesma cidade', () => {
  const livramento = ['Santana do Livramento', 'Santana do livramento', "Sant'Ana do Livramento", 'Sant’Ana do Livramento', 'Santana do Livramento RS', 'Livramento'];
  for (const text of livramento) assert.equal(cities.findCity(text)?.id, 'santana-do-livramento', text);
  assert.equal(cities.findCity('Uruguaiana Rs')?.id, 'uruguaiana');
  assert.equal(cities.findCity('SÃo Gabriel')?.id, 'sao-gabriel');
  assert.equal(cities.findCity('Jaguari RS')?.id, 'jaguari');
  assert.equal(cities.findCity('Rosário Do Sul')?.id, 'rosario-do-sul');
  assert.equal(cities.findCity('LS Assessoria'), null);
  assert.equal(cities.findCity(''), null);
});

const paid = { status: 'PAID', asaasPaymentStatus: 'RECEIVED', paidAt: new Date('2026-12-01T12:00:00-03:00'), createdAt: new Date('2026-12-01T12:00:00-03:00') };
const team = (id, name, extra = {}) => ({ id, name, city: null, logoUrl: null, status: 'APPROVED', mergedIntoId: null, isIndependent: false, ...extra });
const athletes = (n, teamId, city = 'Alegrete', order = paid) => Array.from({ length: n }, () => ({ teamId, city, order }));

test('só conta inscrição paga, sem cortesia, até 28/02', () => {
  assert.equal(countsForRanking(paid), true);
  assert.equal(countsForRanking({ ...paid, asaasPaymentStatus: 'EXTERNAL_PAID' }), true);
  assert.equal(countsForRanking({ ...paid, asaasPaymentStatus: null }), true);
  assert.equal(countsForRanking({ ...paid, asaasPaymentStatus: 'COMPLIMENTARY' }), false);
  assert.equal(countsForRanking({ ...paid, status: 'PENDING' }), false);
  assert.equal(countsForRanking({ ...paid, paidAt: new Date('2027-02-28T23:59:00-03:00') }), true);
  assert.equal(countsForRanking({ ...paid, paidAt: new Date('2027-03-01T00:00:00-03:00') }), false);
});

test('tabela: a partir de 4 atletas; no empate fica na frente quem chegou primeiro; pódio só com 3', () => {
  const teams = [team('a', 'Alfa'), team('b', 'Bravo'), team('c', 'Charlie'), team('d', 'Delta'), team('e', 'Eco')];
  const early = { ...paid, paidAt: new Date('2026-12-01T10:00:00-03:00') };
  const late = { ...paid, paidAt: new Date('2026-12-05T10:00:00-03:00') };
  const ranking = buildRanking([
    ...athletes(10, 'a'), ...athletes(5, 'b', 'Alegrete', early), ...athletes(1, 'b', 'Alegrete', late),
    ...athletes(6, 'c', 'Alegrete', early), ...athletes(4, 'd'), ...athletes(3, 'e'),
  ], teams);
  assert.deepEqual(plain(ranking.teams.map((r) => [r.position, r.name, r.athletes, r.podium])), [
    [1, 'Alfa', 10, true], [2, 'Charlie', 6, true], [3, 'Bravo', 6, true], [4, 'Delta', 4, false],
  ]);
  assert.equal('reachedAt' in ranking.teams[0], false);
});

test('Independentes aparecem à parte, fora do pódio', () => {
  const teams = [team('ind', 'Independentes', { isIndependent: true }), team('a', 'Alfa')];
  const ranking = buildRanking([...athletes(30, 'ind'), ...athletes(5, 'a')], teams);
  assert.equal(ranking.teams.length, 1);
  assert.equal(ranking.teams[0].position, 1);
  assert.equal(ranking.teams[0].podium, true);
  assert.equal(ranking.independents.athletes, 30);
});

test('duplicata fundida soma na equipe principal; cortesia e pendente não contam', () => {
  const teams = [team('a', 'MP Fit'), team('dup', 'Mp fit academia', { status: 'MERGED', mergedIntoId: 'a' })];
  const ranking = buildRanking([
    ...athletes(2, 'a'), ...athletes(2, 'dup'),
    ...athletes(5, 'a', 'Alegrete', { ...paid, asaasPaymentStatus: 'COMPLIMENTARY' }),
    ...athletes(5, 'a', 'Alegrete', { ...paid, status: 'PENDING' }),
  ], teams);
  assert.deepEqual(plain(ranking.teams.map((r) => [r.name, r.athletes])), [['MP Fit', 4]]);
});

test('aba Cidades conta a cidade do atleta, mesmo sem equipe', () => {
  const ranking = buildRanking([
    ...athletes(3, null, 'Santana do Livramento'), ...athletes(2, null, "Sant'Ana do Livramento"),
    ...athletes(4, null, 'Uruguaiana RS'), ...athletes(9, null, 'Cidade Desconhecida'), ...athletes(3, null, 'Itaqui'),
  ], []);
  assert.deepEqual(plain(ranking.cities.map((r) => [r.position, r.name, r.athletes])), [[1, 'Santana do Livramento', 5], [2, 'Uruguaiana', 4]]);
  assert.equal(ranking.cities[1].logoUrl, null); // Uruguaiana usa o escudo de iniciais
});

// --- equipe na inscrição (src/lib/teams.ts) ---
function teamsWithDb(rows) {
  const db = { rows: rows.map((r) => ({ ...r })), created: [] };
  const prisma = {
    team: {
      findUnique: async ({ where }) => db.rows.find((r) => (where.id ? r.id === where.id : where.normalizedName ? r.normalizedName === where.normalizedName : r.couponCode === where.couponCode)) ?? null,
      findFirst: async ({ where }) => db.rows.find((r) => r.isIndependent === where.isIndependent) ?? null,
      create: async ({ data }) => { const row = { id: `new-${db.rows.length}`, status: 'NEW', mergedIntoId: null, ...data }; db.rows.push(row); db.created.push(row); return row; },
    },
  };
  const mod = load('src/lib/teams.ts', { '@/lib/prisma': { prisma }, '@/lib/teamNames': names });
  return { ...mod, db };
}
const ROWS = [
  { id: 'ind', name: 'Independentes', normalizedName: 'independentes', status: 'APPROVED', mergedIntoId: null, isIndependent: true },
  { id: 'mpfit', name: 'MP Fit', normalizedName: 'mpfit', status: 'APPROVED', mergedIntoId: null, isIndependent: false },
  { id: 'dup', name: 'Mp fit academia', normalizedName: 'mpfitacademia', status: 'MERGED', mergedIntoId: 'mpfit', isIndependent: false },
  { id: 'bora', name: 'Bora Correr SG', normalizedName: 'boracorrersg', status: 'APPROVED', mergedIntoId: null, isIndependent: false, couponCode: 'BORACORRERSG' },
];

test('inscrição: equipe existente, fundida, Independente, nova e cupom do grupo', async () => {
  const { resolveParticipantTeams, db } = teamsWithDb(ROWS);
  const ids = await resolveParticipantTeams([
    { teamId: 'cmwwmjrmt016hto8kamlfc3rz' }, // não existe
    { independent: true },
    { newTeam: { name: 'MPFit', instagram: '' } }, // já existe como "MP Fit"
    { newTeam: { name: 'Box Fronteira', instagram: '@boxfronteira' } },
    { newTeam: { name: 'box fronteira', instagram: '' } }, // mesma equipe nova, criada uma vez
    null,
  ], 'BORACORRERSG');
  assert.deepEqual(plain(ids), ['bora', 'ind', 'mpfit', 'new-4', 'new-4', 'bora']);
  assert.equal(db.created.length, 1);
  assert.equal(db.created[0].instagram, 'boxfronteira');
});

test('inscrição: equipe fundida leva para a principal; erro no banco não bloqueia', async () => {
  const { resolveTeamChoice } = teamsWithDb([...ROWS, { id: 'cmwwmjrmt016hto8kamlfc3rz', name: 'x', normalizedName: 'x', status: 'MERGED', mergedIntoId: 'mpfit' }]);
  assert.equal(await resolveTeamChoice({ teamId: 'cmwwmjrmt016hto8kamlfc3rz' }), 'mpfit');
  const broken = load('src/lib/teams.ts', { '@/lib/prisma': { prisma: { team: { findUnique: async () => { throw new Error('db down'); } } } }, '@/lib/teamNames': names });
  assert.deepEqual(plain(await broken.resolveParticipantTeams([{ teamId: 'cmwwmjrmt016hto8kamlfc3rz' }, null], 'X')), [null, null]);
});

// --- /minha-equipe (src/app/api/teams/join/route.ts) ---
function joinRoute({ participants = [], open = true } = {}) {
  const calls = { updates: [], logs: [] };
  const prisma = {
    participant: {
      findMany: async ({ where }) => participants.filter((p) => p.cpf === where.cpf && p.email === where.email.equals),
      updateMany: (args) => { calls.updates.push(args); return args; },
    },
    participantChangeLog: { createMany: (args) => { calls.logs.push(args); return args; } },
    team: { findUnique: async () => ({ name: 'MP Fit' }) },
    $transaction: async (ops) => ops,
  };
  const route = load('src/app/api/teams/join/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
    '@/lib/prisma': { prisma },
    '@/config/ranking': { RANKING: { closesLabel: '28/02' }, teamChangeIsOpen: () => open },
    '@/lib/teamNames': names,
    '@/lib/teams': { resolveTeamChoice: async () => 'mpfit' },
  });
  return { route, calls };
}
const req = (body) => ({ json: async () => body });
const ATHLETE = { id: 'p1', fullName: 'Maria Souza', cpf: '12345678901', email: 'maria@example.test', teamId: null };

test('/minha-equipe: CPF + e-mail da inscrição escolhem a equipe e registram a troca', async () => {
  const { route, calls } = joinRoute({ participants: [ATHLETE] });
  const res = await route.POST(req({ cpf: '123.456.789-01', email: ' Maria@Example.test ', team: { teamId: 'cmwwmjrmt016hto8kamlfc3rz' } }));
  assert.equal(res.status, 200);
  assert.deepEqual(plain(res.body), { firstName: 'Maria', teamName: 'MP Fit' });
  assert.deepEqual(plain(calls.updates[0].where.id.in), ['p1']);
  assert.equal(calls.updates[0].data.teamId, 'mpfit');
  assert.equal(calls.logs[0].data[0].action, 'TEAM_CHANGE');
});

test('/minha-equipe: dados errados, escolha vazia e prazo encerrado', async () => {
  const wrong = await joinRoute({ participants: [ATHLETE] }).route.POST(req({ cpf: '12345678901', email: 'outra@example.test', team: { independent: true } }));
  assert.equal(wrong.status, 404);
  const empty = await joinRoute({ participants: [ATHLETE] }).route.POST(req({ cpf: '12345678901', email: 'maria@example.test', team: {} }));
  assert.equal(empty.status, 400);
  const closed = await joinRoute({ participants: [ATHLETE], open: false }).route.POST(req({ cpf: '12345678901', email: 'maria@example.test', team: { independent: true } }));
  assert.equal(closed.status, 403);
});
