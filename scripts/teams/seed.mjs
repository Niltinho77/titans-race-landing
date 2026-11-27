// Cria as equipes iniciais do ranking e coloca nelas quem já se inscreveu pelos cupons de grupo.
//
//   node scripts/teams/seed.mjs            # só mostra o que faria
//   node scripts/teams/seed.mjs --write    # grava no banco (idempotente)
//
// Não mexe em quem já tem equipe. Não imprime CPF, nome nem contato.

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");

const write = process.argv.includes("--write");

const key = (name) => name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

const TEAMS = [
  { name: "Independentes", isIndependent: true, logoUrl: "/pwa/icon-192.png" },
  { name: "Bora Correr SG", city: "São Gabriel", couponCode: "BORACORRERSG" },
  { name: "Evolution Gym", city: "Santana do Livramento", couponCode: "EVOLUTIONGYM" },
  // Dois atletas escreveram o nome da assessoria no campo cidade.
  { name: "LS Assessoria", cityTypedAsTeam: "LS Assessoria" },
];

const prisma = new PrismaClient();
try {
  for (const team of TEAMS) {
    const { cityTypedAsTeam, ...data } = team;
    const normalizedName = key(team.name);
    let row = await prisma.team.findUnique({ where: { normalizedName } });
    if (!row) {
      console.log(`${write ? "Criando" : "Criaria"} equipe: ${team.name}`);
      if (write) row = await prisma.team.create({ data: { ...data, normalizedName, status: "APPROVED" } });
    } else {
      console.log(`Equipe já existe: ${team.name}`);
    }

    const where = {
      teamId: null,
      order: { status: { in: ["PAID", "PENDING"] } },
      ...(team.couponCode ? { order: { status: { in: ["PAID", "PENDING"] }, couponCode: team.couponCode } } : {}),
      ...(cityTypedAsTeam ? { city: { equals: cityTypedAsTeam, mode: "insensitive" } } : {}),
    };
    if (!team.couponCode && !cityTypedAsTeam) continue;
    const count = await prisma.participant.count({ where });
    console.log(`  atletas sem equipe para colocar em ${team.name}: ${count}`);
    if (write && row && count > 0) {
      const updated = await prisma.participant.updateMany({ where, data: { teamId: row.id, teamJoinedAt: new Date() } });
      console.log(`  colocados: ${updated.count}`);
    }
  }
  if (!write) console.log("\nNada foi gravado. Rode com --write para gravar.");
} finally {
  await prisma.$disconnect();
}
