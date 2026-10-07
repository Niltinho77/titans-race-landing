// Read-only selection. A candidate is a review suggestion, never permission to send.
export const normalizeEmail = (value) => String(value ?? "").trim().toLowerCase();
const digits = (value) => String(value ?? "").replace(/\D/g, "");
const status = (value) => String(value ?? "").trim().toUpperCase();
const HOUR = 60 * 60 * 1000;

function identityKeys(order) {
  const keys = [];
  for (const person of order.participants ?? []) {
    const email = normalizeEmail(person.email);
    const cpf = digits(person.cpf);
    let phone = digits(person.phone);
    if (phone.length >= 12 && phone.startsWith("55")) phone = phone.slice(2);
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) keys.push(`email:${email}`);
    if (cpf.length === 11 && !/^(\d)\1+$/.test(cpf)) keys.push(`cpf:${cpf}`);
    if ([10, 11].includes(phone.length) && !/^(\d)\1+$/.test(phone)) keys.push(`phone:${phone}`);
  }
  return [...new Set(keys)];
}

function statuses(order) {
  return [order.status, order.mpPaymentStatus, order.asaasPaymentStatus, order.pagbankPaymentStatus].map(status).filter(Boolean);
}

function hasPaymentEvidence(order) {
  return Boolean(order.paidAt || order.confirmationEmailSentAt) || statuses(order).some((value) =>
    ["PAID", "CONFIRMED", "RECEIVED", "APPROVED", "RECEIVED_IN_CASH", "CHECKOUT_PAID", "PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"].includes(value),
  ) || (order.participants ?? []).some((person) => person.bibNumber != null);
}

function activityTime(order) {
  return Math.max(new Date(order.createdAt).getTime(), new Date(order.updatedAt ?? order.createdAt).getTime());
}

export function selectCandidates(orders, { now = new Date(), waitHours = 24, lookbackDays = 30 } = {}) {
  if (!Number.isFinite(waitHours) || waitHours < 24 || !Number.isFinite(lookbackDays) || lookbackDays < 1 || !Number.isFinite(+now)) {
    throw new Error("Use espera de pelo menos 24 horas e janela positiva de dias.");
  }
  // Connected components catch retries that change email but retain CPF/phone,
  // including a chain through another attempt or a member of a paid team.
  const parent = orders.map((_, i) => i);
  const root = (i) => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const owner = new Map();
  orders.forEach((order, i) => {
    for (const key of identityKeys(order)) {
      if (owner.has(key)) parent[root(i)] = root(owner.get(key));
      else owner.set(key, i);
    }
  });
  const groups = new Map();
  orders.forEach((order, i) => {
    const key = root(i);
    groups.set(key, [...(groups.get(key) ?? []), order]);
  });

  const candidates = [];
  const review = [];
  const excluded = [];
  for (const group of groups.values()) {
    group.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt) || a.id.localeCompare(b.id));
    const latest = group[0];
    const record = { orderId: latest.id, relatedOrderIds: group.map((order) => order.id), modalityId: latest.modalityId };
    const skip = (reason) => excluded.push({ ...record, reason });
    if (group.some(hasPaymentEvidence)) { skip("pagamento_ou_inscricao_confirmada"); continue; }
    if (group.some((order) => statuses(order).some((value) => /REFUND|CHARGEBACK|CHARGED_BACK/.test(value)))) {
      skip("estorno_ou_contestacao"); continue;
    }
    const latestActivity = Math.max(...group.map(activityTime));
    if (!Number.isFinite(latestActivity)) { skip("data_invalida"); continue; }
    if (+now - latestActivity < waitHours * HOUR) { skip("tentativa_ou_atualizacao_recente"); continue; }
    if (+now - +new Date(latest.createdAt) > lookbackDays * 24 * HOUR) { skip("fora_da_janela"); continue; }
    if (group.some((order) => statuses(order).some((value) => ["AUTHORIZED", "IN_PROCESS", "IN_ANALYSIS", "AWAITING_RISK_ANALYSIS", "PAYMENT_AUTHORIZED", "PAYMENT_AWAITING_RISK_ANALYSIS"].includes(value)))) {
      skip("pagamento_em_analise_ou_autorizado"); continue;
    }
    const emails = [...new Set((latest.participants ?? []).map((person) => normalizeEmail(person.email)))];
    if (emails.length !== 1 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emails[0])) {
      review.push({ ...record, reason: "contato_do_comprador_ambiguo_ou_invalido" }); continue;
    }
    const candidate = { ...record, email: emails[0], name: latest.participants[0].fullName, lastActivityAt: new Date(latestActivity).toISOString() };
    // Pending charges can still be paid. Never label them abandoned without
    // checking the provider and its expiration; the database alone cannot tell.
    if (group.some((order) => !["FAILED", "CANCELED", "CANCELLED", "EXPIRED", "OVERDUE"].includes(status(order.status)))) {
      review.push({ ...candidate, reason: "conferir_pagamentos_pendentes_no_gateway" }); continue;
    }
    candidates.push({ ...candidate, reason: "tentativas_encerradas_sem_pagamento_registrado" });
  }
  return { candidates, review, excluded };
}
