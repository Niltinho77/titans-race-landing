import { getLotStatus } from "./lots";

export const REGISTRATION_CLOSED_MESSAGE = "Inscrições encerradas";
export const REGISTRATION_NOT_OPEN_MESSAGE = "As inscrições ainda não abriram.";

// As inscrições públicas ficam abertas apenas dentro da janela de algum lote (src/config/lots.ts).
export function publicRegistrationsAreClosed(now = Date.now()): boolean {
  return getLotStatus(now).phase !== "open";
}

export function registrationClosedMessage(now = Date.now()): string {
  return getLotStatus(now).phase === "upcoming"
    ? REGISTRATION_NOT_OPEN_MESSAGE
    : REGISTRATION_CLOSED_MESSAGE;
}

// Os checkouts antigos (Stripe, Mercado Pago e PagBank) não conhecem o calendário
// de lotes nem o desconto de veterano. Todo pedido público passa pelo Asaas.
export function legacyCheckoutIsClosed(): boolean {
  return true;
}
