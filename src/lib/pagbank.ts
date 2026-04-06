// src/lib/pagbank.ts
import crypto from "node:crypto";

const PAGBANK_API_BASE =
  process.env.PAGBANK_API_BASE || "https://sandbox.api.pagseguro.com";

const PAGBANK_ACCESS_TOKEN = process.env.PAGBANK_ACCESS_TOKEN;

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
  };

  const response = await fetch(`${PAGBANK_API_BASE}/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAGBANK_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-idempotency-key": crypto.randomUUID(),
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const rawText = await response.text();
  console.log("PagBank raw response:", rawText);

  let data: PagBankCheckoutResponse | any;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error(`Resposta inválida do PagBank: ${rawText}`);
  }

  if (!response.ok) {
    console.error("Erro PagBank /checkouts:", data);
    throw new Error(
      data?.error_messages?.map((e: any) => e.description).join(" | ") ||
        "Erro ao criar checkout no PagBank."
    );
  }

  const payLink =
    data?.links?.find((link: PagBankLink) => link.rel === "PAY")?.href || null;

  if (!data?.id || !payLink) {
    console.error("Resposta inválida PagBank:", data);
    throw new Error("PagBank não retornou link PAY.");
  }

  return {
    id: data.id,
    checkoutUrl: payLink,
    raw: data,
  };
}