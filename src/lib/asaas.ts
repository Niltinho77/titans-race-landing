// src/lib/asaas.ts

type AsaasCreateCheckoutItem = {
  name: string;
  description?: string;
  quantity: number;
  value: number; // em reais, ex: 145.9
};

type AsaasCustomerData = {
  name: string;
  email?: string;
  cpfCnpj?: string;
  mobilePhone?: string;
};

type AsaasCreateCheckoutInput = {
  externalReference: string;
  items: AsaasCreateCheckoutItem[];
  customerData?: AsaasCustomerData;
  successUrl: string;
  cancelUrl: string;
  expiredUrl: string;
  minutesToExpire?: number;
};

type AsaasCheckoutResponse = {
  id?: string;
  link?: string;
  url?: string;
  checkoutUrl?: string;
  [key: string]: unknown;
};

function getAsaasApiBaseUrl() {
  const baseUrl = process.env.ASAAS_API_BASE_URL?.trim();

  if (!baseUrl) {
    throw new Error(
      "ASAAS_API_BASE_URL não definido. Ex.: https://api.asaas.com/v3 ou sandbox correspondente."
    );
  }

  return baseUrl.replace(/\/+$/, "");
}

function getAsaasApiKey() {
  const apiKey = process.env.ASAAS_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("ASAAS_API_KEY não definida.");
  }

  return apiKey;
}

function toMoney(cents: number) {
  return Number((cents / 100).toFixed(2));
}

export function onlyDigits(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

export function normalizeCpfCnpj(value: string | null | undefined) {
  return onlyDigits(value);
}

export function normalizePhone(value: string | null | undefined) {
  return onlyDigits(value);
}

export function centsToAsaasValue(cents: number) {
  return toMoney(cents);
}

export async function createAsaasCheckout(input: AsaasCreateCheckoutInput) {
  const apiBaseUrl = getAsaasApiBaseUrl();
  const apiKey = getAsaasApiKey();

  const body: Record<string, unknown> = {
  billingTypes: ["PIX", "CREDIT_CARD"],
  chargeTypes: ["DETACHED"],
  minutesToExpire: input.minutesToExpire ?? 60,
  externalReference: input.externalReference,
  callback: {
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
    expiredUrl: input.expiredUrl,
    autoRedirect: true,
  },
  items: input.items,
};

if (input.customerData) {
  body.customerData = input.customerData;
}

  const response = await fetch(`${apiBaseUrl}/checkouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = (await response.json().catch(() => null)) as
    | AsaasCheckoutResponse
    | { errors?: Array<{ code?: string; description?: string }> }
    | null;

  if (!response.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "errors" in data &&
      Array.isArray(data.errors) &&
      data.errors.length > 0
        ? data.errors.map((e) => e.description || e.code).filter(Boolean).join(" | ")
        : "Erro ao criar checkout no Asaas.";

    throw new Error(message);
  }

  const checkoutId =
    (data && typeof data === "object" && "id" in data && typeof data.id === "string"
      ? data.id
      : null) ?? null;

  const checkoutUrl =
    (data && typeof data === "object" && "link" in data && typeof data.link === "string"
      ? data.link
      : null) ||
    (data && typeof data === "object" && "url" in data && typeof data.url === "string"
      ? data.url
      : null) ||
    (data &&
    typeof data === "object" &&
    "checkoutUrl" in data &&
    typeof data.checkoutUrl === "string"
      ? data.checkoutUrl
      : null) ||
    null;

  if (!checkoutId) {
    throw new Error("O Asaas não retornou o id do checkout.");
  }

  return {
    raw: data,
    checkoutId,
    checkoutUrl,
  };
}