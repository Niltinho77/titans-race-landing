import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { parseEnv } from "node:util";
import { buildAudience, parseParticipantCopy } from "./audience.mjs";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const { Resend } = require("resend");

const CAMPAIGN = "edition1-return-10-2026";
const COUPON_CODE = "VOLTETITANS10";
const COUPON_EXPIRES_AT = new Date("2026-11-15T02:59:59.000Z"); // 14/11 23:59:59 em Brasília
const BACKUP = "titans_backup.dump";
const DIRECTORY = ".tmp/edition1-campaign";
const PLAN = `${DIRECTORY}/${CAMPAIGN}.json`;
const PREVIEW = `${DIRECTORY}/email-preview.html`;
const SITE_URL = "https://www.titansrace.com.br";
const WHATSAPP_URL = "https://wa.me/5555992234690";
const SEND_DELAY_MS = 650;

function safeError(error, env) {
  let message = error instanceof Error ? error.message : "Falha desconhecida.";
  for (const secret of [env.DATABASE_URL, env.RESEND_API_KEY]) {
    if (secret) message = message.replaceAll(secret, "[secret]");
  }
  return message;
}

function hash(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
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

function loadFirstEdition() {
  const restored = spawnSync(findPgRestore(), ["--data-only", "--table=Participant", "--file=-", BACKUP], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  if (restored.status !== 0) throw new Error(`Não foi possível ler ${BACKUP}: ${restored.stderr.trim()}`);
  return parseParticipantCopy(restored.stdout);
}

const currentOrderSelect = {
  id: true,
  status: true,
  paidAt: true,
  confirmationEmailSentAt: true,
  mpPaymentStatus: true,
  asaasPaymentStatus: true,
  pagbankPaymentStatus: true,
  participants: { select: { fullName: true, cpf: true, email: true, phone: true, bibNumber: true } },
};

async function computeAudience(db) {
  const [firstEditionParticipants, currentOrders] = await Promise.all([
    Promise.resolve().then(loadFirstEdition),
    db.order.findMany({ select: currentOrderSelect }),
  ]);
  return buildAudience(firstEditionParticipants, currentOrders);
}

function checkoutUrl() {
  const url = new URL("/checkout", SITE_URL);
  url.search = new URLSearchParams({
    utm_source: "email",
    utm_medium: "returning_athletes",
    utm_campaign: CAMPAIGN,
  }).toString();
  return url.href;
}

function buildMessage(recipient) {
  const name = recipient.name.split(/\s+/)[0] || "Atleta";
  const expires = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(COUPON_EXPIRES_AT);
  const subject = "Você fez parte da primeira Titans Race — volte com 10% OFF";
  const text = `Olá, ${name}!\n\nVocê fez parte da primeira edição da Titans Race e queremos ver você novamente na largada. Para a Titans Race II, preparamos 10% de desconto na inscrição.\n\nCupom: ${COUPON_CODE}\nVálido até ${expires} (horário de Brasília).\n\nAcesse ${checkoutUrl()}, escolha sua modalidade e aplique o cupom antes de finalizar. O desconto vale para a inscrição e não se aplica a produtos extras ou taxas.\n\nA prova acontece em 15 de novembro de 2026, no campo ao lado do Hotel Refazenda, em Alegrete/RS.\n\nDúvidas: ${WHATSAPP_URL}\n\nSe não quiser receber novas mensagens promocionais, responda este e-mail com SAIR.\n\nCorra. Supere. Vença.\nEquipe Titans Race`;
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#090909;color:#f4f4f5;font-family:Arial,sans-serif">
<div style="display:none;max-height:0;overflow:hidden">Um presente para quem fez parte da primeira Titans Race: 10% OFF.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#090909"><tr><td align="center" style="padding:28px 12px"><table role="presentation" width="560" cellspacing="0" cellpadding="0" style="width:100%;max-width:560px;background:#151515;border:1px solid #353535;border-radius:20px"><tr><td style="padding:32px 26px">
<p style="margin:0 0 24px;color:#f97316;font-size:14px;font-weight:bold;letter-spacing:3px">TITANS RACE II</p>
<h1 style="margin:0 0 18px;color:#fff;font-size:30px;line-height:1.15">Quem é Titan uma vez,<br>é Titan para sempre.</h1>
<p style="font-size:15px;line-height:1.7;color:#d4d4d8">Olá, <strong>${escapeHtml(name)}</strong>! Você fez parte da primeira edição e queremos ver você novamente na largada. Preparamos uma condição especial para o seu retorno.</p>
<div style="margin:24px 0;padding:22px;background:#24170e;border:1px solid #9a4b17;border-radius:14px;text-align:center"><p style="margin:0;color:#fb923c;font-size:38px;font-weight:bold">10% OFF</p><p style="margin:8px 0 16px;color:#fed7aa;font-size:14px">na inscrição para a Titans Race II</p><p style="margin:0;color:#fff;font-family:monospace;font-size:23px;font-weight:bold;letter-spacing:2px">${COUPON_CODE}</p><p style="margin:14px 0 0;color:#d4d4d8;font-size:12px">Válido até ${escapeHtml(expires)} · horário de Brasília</p></div>
<p style="font-size:14px;line-height:1.7;color:#d4d4d8">Escolha sua modalidade e informe o código no campo de cupom antes de finalizar.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" bgcolor="#f97316" style="border-radius:28px"><a href="${escapeHtml(checkoutUrl())}" style="display:block;padding:17px 18px;color:#090909;font-size:14px;font-weight:bold;text-decoration:none">GARANTIR MINHA INSCRIÇÃO</a></td></tr></table>
<p style="margin-top:24px;font-size:14px;line-height:1.7;color:#f4f4f5"><strong>15 de novembro de 2026</strong><br>Campo ao lado do Hotel Refazenda · Alegrete/RS</p>
<p style="font-size:12px;line-height:1.7;color:#a1a1aa">Desconto aplicado à inscrição. Produtos extras e taxas não recebem desconto. Cupom sujeito ao limite de utilizações da campanha e não cumulativo com outros cupons.</p>
<p style="font-size:13px;line-height:1.7;color:#d4d4d8">Precisa de ajuda? <a href="${WHATSAPP_URL}" style="color:#fb923c">Fale com a organização no WhatsApp.</a></p>
<p style="margin-top:26px;color:#f97316;font-weight:bold;letter-spacing:2px;font-size:12px">CORRA. SUPERE. VENÇA.</p>
<hr style="border:0;border-top:1px solid #353535;margin:24px 0"><p style="font-size:11px;line-height:1.7;color:#a1a1aa">Você recebeu este contato por ter participado da primeira Titans Race. Se não quiser receber novas mensagens promocionais, responda este e-mail com SAIR.</p>
</td></tr></table></td></tr></table></body></html>`;
  return { subject, text, html };
}

async function savePlan(audience) {
  await mkdir(DIRECTORY, { recursive: true });
  const plan = {
    campaign: CAMPAIGN,
    couponCode: COUPON_CODE,
    couponExpiresAt: COUPON_EXPIRES_AT.toISOString(),
    preparedAt: new Date().toISOString(),
    summary: audience.summary,
    recipients: audience.recipients,
  };
  await writeFile(PLAN, JSON.stringify(plan, null, 2), { mode: 0o600 });
  await chmod(PLAN, 0o600);
  const sample = audience.recipients[0];
  if (sample) await writeFile(PREVIEW, buildMessage(sample).html, { mode: 0o600 });
  return plan;
}

async function prepare(db) {
  const audience = await computeAudience(db);
  if (audience.recipients.length === 0) throw new Error("Nenhum destinatário elegível encontrado.");
  const existing = await db.coupon.findUnique({ where: { code: COUPON_CODE } });
  if (existing && (existing.type !== "PERCENT" || existing.amount !== 10)) {
    throw new Error(`O código ${COUPON_CODE} já existe com outra regra; nada foi alterado.`);
  }

  const coupon = await db.coupon.upsert({
    where: { code: COUPON_CODE },
    create: {
      code: COUPON_CODE,
      type: "PERCENT",
      amount: 10,
      active: true,
      startsAt: new Date(),
      expiresAt: COUPON_EXPIRES_AT,
      maxUses: audience.recipients.length,
    },
    update: {
      active: true,
      expiresAt: COUPON_EXPIRES_AT,
      maxUses: Math.max(existing?.usedCount ?? 0, audience.recipients.length),
    },
    select: { code: true, amount: true, active: true, expiresAt: true, maxUses: true, usedCount: true },
  });
  const plan = await savePlan(audience);
  console.log(JSON.stringify({ mode: "prepared", emailsSent: 0, summary: plan.summary, coupon }, null, 2));
}

async function preview(db) {
  const audience = await computeAudience(db);
  const plan = await savePlan(audience);
  console.log(JSON.stringify({ mode: "preview", emailsSent: 0, summary: plan.summary, plan: PLAN, emailPreview: PREVIEW }, null, 2));
}

async function send(db, env) {
  const plan = JSON.parse(await readFile(PLAN, "utf8"));
  if (plan.campaign !== CAMPAIGN || plan.couponCode !== COUPON_CODE) throw new Error("Plano inválido.");
  if (COUPON_EXPIRES_AT.getTime() <= Date.now()) throw new Error("Cupom expirado; envio cancelado.");

  const currentAudience = await computeAudience(db);
  const currentlyEligible = new Map(currentAudience.recipients.map((recipient) => [recipient.email, recipient]));
  const coupon = await db.coupon.findUnique({ where: { code: COUPON_CODE } });
  if (!coupon || !coupon.active || coupon.type !== "PERCENT" || coupon.amount !== 10 ||
      (coupon.expiresAt && coupon.expiresAt.getTime() !== COUPON_EXPIRES_AT.getTime())) {
    throw new Error("Cupom ausente ou divergente; envio cancelado.");
  }
  const resend = new Resend(env.RESEND_API_KEY);
  const receipts = [];

  for (const planned of plan.recipients) {
    const recipient = currentlyEligible.get(planned.email);
    if (!recipient) {
      receipts.push({ recipientHash: hash(planned.email), status: "excluded_after_revalidation" });
      continue;
    }

    const jobId = `campaign_${hash(`${CAMPAIGN}:${recipient.email}`)}`;
    const existing = await db.analyticsEvent.findUnique({ where: { id: jobId } });
    if (existing) {
      receipts.push({ recipientHash: hash(recipient.email), status: existing.eventName });
      continue;
    }

    await db.analyticsEvent.create({
      data: {
        id: jobId,
        sessionId: CAMPAIGN,
        eventName: "edition1_return_email_sending",
        path: "/checkout",
        metadata: { campaign: CAMPAIGN, recipientHash: hash(recipient.email), couponCode: COUPON_CODE },
      },
    });
    const message = buildMessage(recipient);
    const { data, error } = await resend.emails.send({
      from: env.RESEND_FROM,
      to: recipient.email,
      replyTo: "contato@titansrace.com.br",
      ...message,
    }, { idempotencyKey: jobId });

    if (error || !data?.id) {
      await db.analyticsEvent.update({ where: { id: jobId }, data: { eventName: "edition1_return_email_uncertain" } });
      throw new Error(`O Resend não confirmou o envio (${error?.message ?? "sem ID"}). Interrompido sem repetir destinatários.`);
    }

    await db.analyticsEvent.update({
      where: { id: jobId },
      data: {
        eventName: "edition1_return_email_sent",
        metadata: {
          campaign: CAMPAIGN,
          recipientHash: hash(recipient.email),
          couponCode: COUPON_CODE,
          providerId: data.id,
          sentAt: new Date().toISOString(),
        },
      },
    });
    receipts.push({ recipientHash: hash(recipient.email), status: "sent", providerId: data.id });
    await writeFile(`${DIRECTORY}/send-receipts.json`, JSON.stringify(receipts, null, 2), { mode: 0o600 });
    console.log(JSON.stringify({ processed: receipts.length, status: "accepted_by_resend" }));
    await new Promise((resolve) => setTimeout(resolve, SEND_DELAY_MS));
  }

  console.log(JSON.stringify({
    completed: true,
    sent: receipts.filter((receipt) => receipt.status === "sent").length,
    skipped: receipts.filter((receipt) => receipt.status !== "sent").length,
  }, null, 2));
}

const mode = process.argv[2];
let env = {};
let db;
try {
  if (!["--preview", "--prepare", "--send"].includes(mode) || process.argv.length !== 3) {
    throw new Error("Use --preview, --prepare ou --send.");
  }
  env = parseEnv(await readFile(".env", "utf8"));
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL não configurada em .env.");
  if (mode === "--send" && (!env.RESEND_API_KEY || !env.RESEND_FROM)) {
    throw new Error("RESEND_API_KEY/RESEND_FROM não configurados em .env.");
  }
  db = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });
  if (mode === "--preview") await preview(db);
  if (mode === "--prepare") await prepare(db);
  if (mode === "--send") await send(db, env);
} catch (error) {
  console.error(safeError(error, env));
  process.exitCode = 1;
} finally {
  await db?.$disconnect();
}
