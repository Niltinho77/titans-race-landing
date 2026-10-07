// One-off campaign authorized for the six contacts in the named preview.
// Production settings intentionally come from .env, never the sandbox overrides.
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { createHash, randomBytes } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { selectCandidates } from './select-candidates.mjs';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');
const env = parseEnv(await readFile('.env', 'utf8'));
const db = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });
const resend = new Resend(env.RESEND_API_KEY);
const CAMPAIGN = 'recovery-20260905-approved-six';
const DIRECTORY = '.tmp/recovery';
const PLAN = `${DIRECTORY}/${CAMPAIGN}.json`;
const SOURCE = `${DIRECTORY}/preview-2026-09-05T00-39-18-984Z.json`;
const siteUrl = 'https://www.titansrace.com.br';
const hash = (value) => createHash('sha256').update(value).digest('hex').slice(0, 32);
const escape = (value) => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const select = {
  id: true, modalityId: true, status: true, createdAt: true, updatedAt: true,
  paidAt: true, confirmationEmailSentAt: true, mpPaymentStatus: true,
  asaasPaymentStatus: true, pagbankPaymentStatus: true,
  participants: { select: { fullName: true, cpf: true, email: true, phone: true, bibNumber: true } },
};

async function revalidate(recipient) {
  const orders = await db.order.findMany({ select });
  const candidate = selectCandidates(orders).candidates.find(c => c.email === recipient.email && c.relatedOrderIds.includes(recipient.orderId));
  if (!candidate) return null;
  const related = orders.filter(o => candidate.relatedOrderIds.includes(o.id));
  // This campaign only covers the six expired Asaas checkouts already reviewed.
  // Gateway live access returned 401; do not widen eligibility to other statuses.
  if (!related.every(o => o.status === 'OVERDUE' && o.asaasPaymentStatus === 'EXPIRED')) return null;
  return candidate;
}

function buildMessage(recipient, couponCode, expiresAt) {
  const modality = { kids: 'Kids', competicao: 'Solo' }[recipient.modalityId];
  if (!modality) throw new Error('Modalidade fora da campanha autorizada.');
  const expiration = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }).format(new Date(expiresAt));
  const url = new URL('/checkout', siteUrl);
  url.search = new URLSearchParams({ modality: recipient.modalityId, utm_source: 'email', utm_medium: 'recovery', utm_campaign: CAMPAIGN }).toString();
  const subject = 'Ainda dá tempo: 5% OFF na sua inscrição | Titans Race';
  const text = `Olá!\n\nAinda dá tempo de viver a Titans Race II. Sua tentativa de inscrição na modalidade ${modality} não foi concluída, e preparamos um incentivo para você voltar:\n\n5% de desconto na inscrição\nCupom: ${couponCode}\nVálido até ${expiration} (horário de Brasília).\n\nCopie o código, acesse ${url} e informe o cupom no campo de desconto do checkout. Clique em Aplicar antes de finalizar.\n\nA prova acontece em 15 de novembro de 2026, no campo ao lado do Hotel Refazenda, em Alegrete/RS.\n\nDesconto válido para a modalidade ${modality}, limitado a uma utilização. Não cumulativo com outros cupons. Produtos extras e taxas não recebem o desconto de 5%.\n\nPrecisa de ajuda? Fale com a organização: https://wa.me/5555992234690\n\nVocê recebeu este contato por ter iniciado uma inscrição na Titans Race. Se não quiser receber novos lembretes, responda este e-mail com SAIR.\n\nCorra. Supere. Vença.\nEquipe Titans Race`;
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#090909;color:#f4f4f5;font-family:Arial,sans-serif">
<div style="display:none;max-height:0;overflow:hidden">Seu cupom de 5% para voltar à Titans Race. Válido por 72 horas.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#090909"><tr><td align="center" style="padding:28px 12px"><table role="presentation" width="560" cellspacing="0" cellpadding="0" style="width:100%;max-width:560px;background:#151515;border:1px solid #353535;border-radius:20px"><tr><td style="padding:32px 26px">
<p style="margin:0 0 24px;color:#f97316;font-size:14px;font-weight:bold;letter-spacing:3px">TITANS RACE II</p>
<h1 style="margin:0 0 18px;color:#ffffff;font-size:30px;line-height:1.15">Sua próxima superação<br>está te esperando.</h1>
<p style="font-size:15px;line-height:1.7;color:#d4d4d8">Olá! Sua tentativa de inscrição na modalidade <strong>${modality}</strong> não foi concluída. Ainda dá tempo de viver essa experiência, e preparamos um incentivo para você voltar.</p>
<div style="margin:24px 0;padding:22px;background:#24170e;border:1px solid #9a4b17;border-radius:14px;text-align:center"><p style="margin:0;color:#fb923c;font-size:38px;font-weight:bold">5% OFF</p><p style="margin:8px 0 16px;color:#fed7aa;font-size:14px">na sua inscrição</p><p style="margin:0;color:#ffffff;font-family:monospace;font-size:23px;font-weight:bold;letter-spacing:2px">${escape(couponCode)}</p><p style="margin:14px 0 0;color:#d4d4d8;font-size:12px">Válido até ${escape(expiration)} · horário de Brasília</p></div>
<p style="font-size:14px;line-height:1.7;color:#d4d4d8">Copie o código acima e informe no campo de cupom do checkout. Clique em <strong>Aplicar</strong> antes de finalizar.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" bgcolor="#f97316" style="border-radius:28px"><a href="${escape(url.href)}" style="display:block;padding:17px 18px;color:#090909;font-size:14px;font-weight:bold;text-decoration:none">VOLTAR À MINHA INSCRIÇÃO</a></td></tr></table>
<p style="margin-top:24px;font-size:14px;line-height:1.7;color:#f4f4f5"><strong>15 de novembro de 2026</strong><br>Campo ao lado do Hotel Refazenda · Alegrete/RS</p>
<p style="font-size:12px;line-height:1.7;color:#a1a1aa">Válido para a modalidade ${modality}, limitado a uma utilização. Não cumulativo com outros cupons. Produtos extras e taxas não recebem o desconto de 5%.</p>
<p style="font-size:13px;line-height:1.7;color:#d4d4d8">Precisa de ajuda? <a href="https://wa.me/5555992234690" style="color:#fb923c">Fale com a organização no WhatsApp.</a></p>
<p style="margin-top:26px;color:#f97316;font-weight:bold;letter-spacing:2px;font-size:12px">CORRA. SUPERE. VENÇA.</p>
<hr style="border:0;border-top:1px solid #353535;margin:24px 0"><p style="font-size:11px;line-height:1.7;color:#a1a1aa">Você recebeu este contato por ter iniciado uma inscrição na Titans Race. Se não quiser receber novos lembretes, responda este e-mail com SAIR.</p>
</td></tr></table></td></tr></table></body></html>`;
  return { from: env.RESEND_FROM, to: recipient.email, replyTo: 'contato@titansrace.com.br', subject, html, text };
}

async function prepare() {
  try { await readFile(PLAN); throw new Error('Plano já existe. Use o plano original para evitar duplicidade.'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const source = JSON.parse(await readFile(SOURCE, 'utf8'));
  if (source.candidates.length !== 6 || new Set(source.candidates.map(c => c.email)).size !== 6) throw new Error('A lista não corresponde aos seis contatos autorizados.');
  const preparedAt = new Date();
  const expiresAt = new Date(+preparedAt + 72 * 60 * 60 * 1000).toISOString();
  const recipients = [];
  for (const candidate of source.candidates) {
    if (!await revalidate(candidate)) { recipients.push({ ...candidate, excluded: true }); continue; }
    const couponCode = `VOLTE5-${randomBytes(4).toString('hex').toUpperCase()}`;
    recipients.push({ ...candidate, couponCode, jobId: `recovery_${hash(CAMPAIGN + ':' + candidate.email)}`, payload: buildMessage(candidate, couponCode, expiresAt) });
  }
  await writeFile(PLAN, JSON.stringify({ campaign: CAMPAIGN, preparedAt: preparedAt.toISOString(), expiresAt, source: SOURCE, recipients }, null, 2), { mode: 0o600, flag: 'wx' });
  const sample = recipients.find(r => !r.excluded);
  if (sample) await writeFile(`${DIRECTORY}/email-preview.html`, sample.payload.html, { mode: 0o600 });
  console.log(JSON.stringify({ mode:'prepared_only', eligible:recipients.filter(r=>!r.excluded).length, excluded:recipients.filter(r=>r.excluded).length, expiresAt, emailsSent:0 }));
}

async function send() {
  const plan = JSON.parse(await readFile(PLAN, 'utf8'));
  const source = JSON.parse(await readFile(SOURCE, 'utf8'));
  if (plan.campaign !== CAMPAIGN || plan.recipients.length !== 6) throw new Error('Plano inválido.');
  if (Date.now() - +new Date(plan.preparedAt) > 60 * 60 * 1000) throw new Error('Plano com mais de uma hora; revisar a validade antes do envio.');
  const receipts = [];
  for (const recipient of plan.recipients) {
    if (!source.candidates.some(c=>c.email===recipient.email&&c.orderId===recipient.orderId)) throw new Error('Destinatário fora da lista autorizada.');
    if (recipient.excluded) { receipts.push({ orderId:recipient.orderId, status:'excluded' }); continue; }
    if (JSON.stringify(recipient.payload)!==JSON.stringify(buildMessage(recipient,recipient.couponCode,plan.expiresAt))) throw new Error('Mensagem divergente do plano.');
    const existing = await db.analyticsEvent.findUnique({ where:{id:recipient.jobId} });
    if (existing) { receipts.push({ orderId:recipient.orderId,status:existing.eventName,providerId:existing.metadata?.providerId ?? null }); continue; }
    if (!await revalidate(recipient)) { receipts.push({ orderId:recipient.orderId,status:'excluded_after_revalidation' }); continue; }

    // A deterministic primary key is a durable claim. Repeated runs skip even
    // uncertain sends. Provider idempotency is a second layer, never the only one.
    await db.$transaction(async tx => {
      await tx.coupon.create({data:{code:recipient.couponCode,type:'PERCENT',amount:5,active:true,startsAt:new Date(plan.preparedAt),expiresAt:new Date(plan.expiresAt),maxUses:1,modalityId:recipient.modalityId}});
      await tx.analyticsEvent.create({data:{id:recipient.jobId,sessionId:CAMPAIGN,eventName:'recovery_email_prepared',path:'/checkout',metadata:{campaign:CAMPAIGN,sourceOrderId:recipient.orderId,recipientHash:hash(recipient.email),couponCode:recipient.couponCode,expiresAt:plan.expiresAt,paymentVerification:'database_revalidated_expired_checkout;live_asaas_401'}}});
    });
    const validationResponse = await fetch(`${siteUrl}/api/coupons/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: recipient.couponCode, modalityId: recipient.modalityId, subtotal: 10000, discountBase: 10000 }),
      signal: AbortSignal.timeout(20000),
    });
    const validation = await validationResponse.json().catch(() => null);
    if (!validationResponse.ok || validation?.code !== recipient.couponCode || validation?.discountAmount !== 500) {
      await db.$transaction([
        db.coupon.update({where:{code:recipient.couponCode},data:{active:false}}),
        db.analyticsEvent.update({where:{id:recipient.jobId},data:{eventName:'recovery_email_coupon_validation_failed'}}),
      ]);
      throw new Error('O site oficial não validou o cupom de 5%. Envio interrompido.');
    }
    // Check again after preparing the coupon, immediately before the external send.
    if (!await revalidate(recipient)) {
      await db.$transaction([
        db.coupon.update({where:{code:recipient.couponCode},data:{active:false}}),
        db.analyticsEvent.update({where:{id:recipient.jobId},data:{eventName:'recovery_email_suppressed'}}),
      ]);
      receipts.push({orderId:recipient.orderId,status:'suppressed_after_revalidation'}); continue;
    }
    await db.analyticsEvent.update({where:{id:recipient.jobId},data:{eventName:'recovery_email_sending'}});
    const { data, error } = await resend.emails.send(recipient.payload, { idempotencyKey: recipient.jobId });
    if (error || !data?.id) {
      await db.analyticsEvent.update({where:{id:recipient.jobId},data:{eventName:'recovery_email_uncertain'}});
      await writeFile(`${DIRECTORY}/send-receipts.json`,JSON.stringify(receipts,null,2),{mode:0o600});
      throw new Error(`Resend não confirmou o envio (${error?.name ?? 'sem id'}); interrompido sem repetir mensagens.`);
    }
    await db.analyticsEvent.update({where:{id:recipient.jobId},data:{eventName:'recovery_email_sent',metadata:{campaign:CAMPAIGN,sourceOrderId:recipient.orderId,recipientHash:hash(recipient.email),couponCode:recipient.couponCode,expiresAt:plan.expiresAt,providerId:data.id,sentAt:new Date().toISOString(),paymentVerification:'database_revalidated_expired_checkout;live_asaas_401'}}});
    receipts.push({orderId:recipient.orderId,status:'sent',providerId:data.id,couponCode:recipient.couponCode,expiresAt:plan.expiresAt});
    await writeFile(`${DIRECTORY}/send-receipts.json`,JSON.stringify(receipts,null,2),{mode:0o600});
    console.log(JSON.stringify({recipient:receipts.length,status:'accepted_by_resend'}));
    await delay(650);
  }
  await writeFile(`${DIRECTORY}/send-receipts.json`,JSON.stringify(receipts,null,2),{mode:0o600});
  console.log(JSON.stringify({completed:true,sent:receipts.filter(r=>r.status==='sent').length,skipped:receipts.filter(r=>r.status!=='sent').length}));
}

try {
  if (!env.DATABASE_URL || !env.RESEND_API_KEY || !env.RESEND_FROM) throw new Error('Configuração de produção incompleta.');
  if (process.argv.length!==3 || !['--prepare','--send'].includes(process.argv[2])) throw new Error('Use --prepare ou --send.');
  if (process.argv[2]==='--prepare') await prepare(); else await send();
} catch (error) {
  console.error(error instanceof Error ? error.message.replaceAll(env.DATABASE_URL ?? '__none__','[database]').replaceAll(env.RESEND_API_KEY ?? '__none__','[key]') : 'Falha na campanha.');
  process.exitCode=1;
} finally { await db.$disconnect(); }
