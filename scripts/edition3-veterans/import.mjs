// Popula a tabela VeteranAthlete com os CPFs que correram a 1ª E a 2ª edição.
//
// 1ª edição: pedidos PAID do backup titans_backup.dump (lido com pg_restore, nada é restaurado no banco).
// 2ª edição: pedidos PAID do banco atual (DATABASE_URL em .env).
//
//   node scripts/edition3-veterans/import.mjs            # só mostra as contagens
//   node scripts/edition3-veterans/import.mjs --write    # grava no banco (idempotente)
//
// Rode ANTES do reset da edição: depois dele, os pedidos da 2ª edição saem do banco.
// O script não imprime CPF, nome nem contato.

import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { parseEnv } from "node:util";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");

const BACKUP = "titans_backup.dump";

export function normalizeCpf(value) {
  const cpf = String(value ?? "").replace(/\D/g, "");
  return cpf.length === 11 && !/^(\d)\1+$/.test(cpf) ? cpf : "";
}

function decodeCopyValue(value) {
  if (value === "\\N") return null;
  return value.replace(/\\([btnrfv\\])/g, (_, escaped) => ({
    b: "\b", t: "\t", n: "\n", r: "\r", f: "\f", v: "\v", "\\": "\\",
  })[escaped]);
}

export function parseCopy(sql, table) {
  const lines = String(sql).split(/\r?\n/);
  const start = lines.findIndex((line) => line.startsWith(`COPY public."${table}"`));
  if (start === -1) throw new Error(`Tabela public."${table}" não encontrada no backup.`);
  const header = lines[start].match(/\((.+)\) FROM stdin;$/);
  if (!header) throw new Error(`Cabeçalho COPY de ${table} inválido.`);
  const columns = header[1].split(",").map((column) => column.trim().replace(/^"|"$/g, ""));
  const rows = [];
  for (let index = start + 1; index < lines.length && lines[index] !== "\\."; index += 1) {
    if (!lines[index]) continue;
    const values = lines[index].split("\t").map(decodeCopyValue);
    if (values.length !== columns.length) {
      throw new Error(`Linha ${index + 1} de ${table} tem ${values.length} campos; esperado: ${columns.length}.`);
    }
    rows.push(Object.fromEntries(columns.map((column, position) => [column, values[position]])));
  }
  return rows;
}

function findPgRestore() {
  const candidates = [
    process.env.PG_RESTORE_BIN,
    "/opt/homebrew/opt/postgresql@17/bin/pg_restore",
    "pg_restore",
  ].filter(Boolean);
  for (const candidate of candidates) {
    const check = spawnSync(candidate, ["--version"], { encoding: "utf8" });
    if (check.status === 0) return candidate;
  }
  throw new Error("pg_restore 17+ não encontrado. Defina PG_RESTORE_BIN com o executável correto.");
}

function loadFirstEditionCpfs() {
  const restored = spawnSync(
    findPgRestore(),
    ["--data-only", "--table=Order", "--table=Participant", "--file=-", BACKUP],
    { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 },
  );
  if (restored.status !== 0) throw new Error(`Não foi possível ler ${BACKUP}: ${restored.stderr.trim()}`);
  const paidOrders = new Set(
    parseCopy(restored.stdout, "Order").filter((order) => order.status === "PAID").map((order) => order.id),
  );
  return new Set(
    parseCopy(restored.stdout, "Participant")
      .filter((participant) => paidOrders.has(participant.orderId))
      .map((participant) => normalizeCpf(participant.cpf))
      .filter(Boolean),
  );
}

async function loadSecondEditionCpfs(db) {
  const participants = await db.participant.findMany({
    where: { order: { status: "PAID" } },
    select: { cpf: true },
  });
  return new Set(participants.map((participant) => normalizeCpf(participant.cpf)).filter(Boolean));
}

const write = process.argv.includes("--write");
const env = parseEnv(await readFile(".env", "utf8"));
if (!env.DATABASE_URL) throw new Error("DATABASE_URL não configurada em .env.");
const db = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });

try {
  const first = loadFirstEditionCpfs();
  const second = await loadSecondEditionCpfs(db);
  const veterans = [...second].filter((cpf) => first.has(cpf));

  const summary = {
    firstEditionPaidCpfs: first.size,
    secondEditionPaidCpfs: second.size,
    ranBothEditions: veterans.length,
  };

  if (write) {
    const result = await db.veteranAthlete.createMany({
      data: veterans.map((cpf) => ({ cpf })),
      skipDuplicates: true,
    });
    summary.inserted = result.count;
    summary.totalInTable = await db.veteranAthlete.count();
  } else {
    summary.note = "Simulação. Use --write para gravar.";
  }
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await db.$disconnect();
}
