import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { selectCandidates } from "./select-candidates.mjs";

const require = createRequire(import.meta.url);
require("@next/env").loadEnvConfig(process.cwd());
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

try {
  if (process.argv.length > 2) throw new Error("Este comando é apenas uma prévia e não aceita argumentos de envio.");
  // All orders must participate in exclusion, even payments outside the window.
  // Do not fetch health details, birth dates or other unnecessary fields.
  const orders = await prisma.order.findMany({
    select: {
      id: true, modalityId: true, status: true, createdAt: true, updatedAt: true,
      paidAt: true, confirmationEmailSentAt: true,
      mpPaymentStatus: true, asaasPaymentStatus: true, pagbankPaymentStatus: true,
      participants: { select: { fullName: true, cpf: true, email: true, phone: true, bibNumber: true } },
    },
  });
  const now = new Date();
  const result = selectCandidates(orders, { now });
  const report = { generatedAt: now.toISOString(), mode: "preview_only", waitHours: 24, lookbackDays: 30, ...result };
  const directory = resolve(".tmp/recovery");
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const filename = resolve(directory, `preview-${now.toISOString().replace(/[:.]/g, "-")}.json`);
  await writeFile(filename, JSON.stringify(report, null, 2), { mode: 0o600, flag: "wx" });
  console.log(JSON.stringify({ ordersAnalyzed: orders.length, candidates: result.candidates.length, manualReview: result.review.length, excludedGroups: result.excluded.length, report: filename, emailsSent: 0 }, null, 2));
} catch (error) {
  // Avoid logging connection strings or records from provider errors.
  console.error("Não foi possível gerar a prévia. Confira o acesso ao banco e a configuração local. Nenhum e-mail foi enviado.");
  if (error instanceof Error && error.message.startsWith("Este comando")) console.error(error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
