// src/lib/mercadopago.ts
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

const accessToken = process.env.MP_ACCESS_TOKEN;

if (!accessToken) {
  console.warn("MP_ACCESS_TOKEN não configurado. Mercado Pago não vai funcionar.");
}

export const mpClient = accessToken
  ? new MercadoPagoConfig({ accessToken })
  : null;

export const mpPreference = mpClient ? new Preference(mpClient) : null;
export const mpPayment = mpClient ? new Payment(mpClient) : null;
