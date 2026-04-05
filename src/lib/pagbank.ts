// src/lib/pagbank.ts

const PAGBANK_API_BASE =
  process.env.PAGBANK_API_BASE || "https://sandbox.api.pagseguro.com";

const PAGBANK_ACCESS_TOKEN = process.env.PAGBANK_ACCESS_TOKEN;

if (!PAGBANK_ACCESS_TOKEN) {
  console.warn("PAGBANK_ACCESS_TOKEN não configurado.");
}

type CreateCheckoutParams = {
  orderId: string;
  amount: number; // centavos
  description: string;
  redirectUrl: string;
  notificationUrl: string;
};

type PagBankLink = {
  rel: string;
  href: string;
  method?: string;
};

type PagBankCheckoutResponse = {
  id: string;
  reference_id?: string;
  links?: PagBankLink[];
};

export async function createPagbankCheckout({
  orderId,
  amount,
  description,
  redirectUrl,
  notificationUrl,
}: CreateCheckoutParams) {
  if (!PAGBANK_ACCESS_TOKEN) {
    throw new Error("PAGBANK_ACCESS_TOKEN não configurado.");
  }

  const payload = {
    reference_id: orderId,
    expiration_date: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    redirect_url: redirectUrl,
    notification_urls: [notificationUrl],
    payment_notification_urls: [notificationUrl],

    items: [
      {
        reference_id: orderId,
        name: description,
        quantity: 1,
        unit_amount: amount,
      },
    ],

    payment_methods: [
      { type: "PIX" },
      { type: "CREDIT_CARD" },
    ],

    payment_methods_configs: [
      {
        type: "CREDIT_CARD",
        config_options: [
          {
            option: "INSTALLMENTS_LIMIT",
            value: "3",
          },
        ],
      },
    ],
  };

  const response = await fetch(`${PAGBANK_API_BASE}/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAGBANK_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const rawText = await response.text();

  let data: PagBankCheckoutResponse | Record<string, unknown>;
  try {
    data = JSON.parse(rawText);
  } catch {
    data = { raw: rawText };
  }

  if (!response.ok) {
    console.error("Erro PagBank /checkouts:", data);
    throw new Error("Erro ao criar checkout no PagBank.");
  }

  const checkout = data as PagBankCheckoutResponse;

  const payLink =
    checkout.links?.find((link) => link.rel === "PAY")?.href ||
    checkout.links?.find((link) => link.rel === "SELF")?.href ||
    null;

  if (!checkout.id || !payLink) {
    console.error("Resposta inválida do PagBank:", checkout);
    throw new Error("PagBank não retornou checkout válido.");
  }

  return {
    id: checkout.id,
    checkoutUrl: payLink,
    raw: checkout,
  };
}