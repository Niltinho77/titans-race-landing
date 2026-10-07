const PAID_STATUSES = new Set([
  "PAID",
  "CONFIRMED",
  "RECEIVED",
  "APPROVED",
  "RECEIVED_IN_CASH",
  "CHECKOUT_PAID",
  "PAYMENT_CONFIRMED",
  "PAYMENT_RECEIVED",
  "COMPLIMENTARY",
  "EXTERNAL_PAID",
]);

export const normalizeEmail = (value) => String(value ?? "").trim().toLowerCase();

export function normalizeCpf(value) {
  const cpf = String(value ?? "").replace(/\D/g, "");
  return cpf.length === 11 && !/^(\d)\1+$/.test(cpf) ? cpf : "";
}

export function normalizePhone(value) {
  let phone = String(value ?? "").replace(/\D/g, "");
  if ((phone.length === 12 || phone.length === 13) && phone.startsWith("55")) {
    phone = phone.slice(2);
  }
  return (phone.length === 10 || phone.length === 11) && !/^(\d)\1+$/.test(phone)
    ? phone
    : "";
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

function identityKeys(person) {
  const keys = [];
  const cpf = normalizeCpf(person.cpf);
  const email = normalizeEmail(person.email);
  const phone = normalizePhone(person.phone);
  if (cpf) keys.push(`cpf:${cpf}`);
  if (isValidEmail(email)) keys.push(`email:${email}`);
  if (phone) keys.push(`phone:${phone}`);
  return keys;
}

function status(value) {
  return String(value ?? "").trim().toUpperCase();
}

export function hasRegistrationEvidence(order) {
  const statuses = [
    order.status,
    order.mpPaymentStatus,
    order.asaasPaymentStatus,
    order.pagbankPaymentStatus,
  ].map(status);

  return Boolean(order.paidAt || order.confirmationEmailSentAt) ||
    statuses.some((value) => PAID_STATUSES.has(value)) ||
    (order.participants ?? []).some((person) => person.bibNumber != null);
}

/**
 * The result deliberately contains no CPF or phone. Those identifiers are used
 * only in memory to make the comparison safer.
 */
export function buildAudience(firstEditionParticipants, currentOrders) {
  const registeredOrders = currentOrders.filter(hasRegistrationEvidence);
  const currentKeys = new Set(
    registeredOrders.flatMap((order) => (order.participants ?? []).flatMap(identityKeys)),
  );

  const currentParticipantCount = registeredOrders.reduce(
    (total, order) => total + (order.participants?.length ?? 0),
    0,
  );
  const recipientsByEmail = new Map();
  let matchedCurrentEdition = 0;
  let eligibleWithoutEmail = 0;
  let duplicateEmailSuppressed = 0;

  for (const person of firstEditionParticipants) {
    const keys = identityKeys(person);
    if (keys.some((key) => currentKeys.has(key))) {
      matchedCurrentEdition += 1;
      continue;
    }

    const email = normalizeEmail(person.email);
    if (!isValidEmail(email)) {
      eligibleWithoutEmail += 1;
      continue;
    }

    if (recipientsByEmail.has(email)) {
      duplicateEmailSuppressed += 1;
      continue;
    }

    recipientsByEmail.set(email, {
      email,
      name: String(person.fullName ?? "").trim() || "Atleta",
    });
  }

  return {
    recipients: [...recipientsByEmail.values()].sort((a, b) => a.email.localeCompare(b.email)),
    summary: {
      firstEditionRows: firstEditionParticipants.length,
      currentConfirmedOrders: registeredOrders.length,
      currentConfirmedParticipants: currentParticipantCount,
      matchedCurrentEdition,
      eligibleWithoutEmail,
      duplicateEmailSuppressed,
      eligibleRecipients: recipientsByEmail.size,
    },
  };
}

function decodeCopyValue(value) {
  if (value === "\\N") return null;
  return value.replace(/\\([btnrfv\\])/g, (_, escaped) => ({
    b: "\b",
    t: "\t",
    n: "\n",
    r: "\r",
    f: "\f",
    v: "\v",
    "\\": "\\",
  })[escaped]);
}

export function parseParticipantCopy(sql) {
  const lines = String(sql).split(/\r?\n/);
  const start = lines.findIndex((line) => line.startsWith('COPY public."Participant"'));
  if (start === -1) throw new Error('Tabela public."Participant" não encontrada no backup.');

  const header = lines[start].match(/\((.+)\) FROM stdin;$/);
  if (!header) throw new Error("Cabeçalho COPY de Participant inválido.");
  const columns = header[1].split(",").map((column) => column.trim().replace(/^"|"$/g, ""));
  const participants = [];

  for (let index = start + 1; index < lines.length && lines[index] !== "\\."; index += 1) {
    if (!lines[index]) continue;
    const values = lines[index].split("\t").map(decodeCopyValue);
    if (values.length !== columns.length) {
      throw new Error(`Linha ${index + 1} do backup tem ${values.length} campos; esperado: ${columns.length}.`);
    }
    participants.push(Object.fromEntries(columns.map((column, position) => [column, values[position]])));
  }

  if (participants.length === 0) throw new Error("O backup não contém participantes.");
  return participants;
}
