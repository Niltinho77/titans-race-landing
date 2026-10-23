// null mantém as inscrições abertas sem encerramento automático.
// Para agendar um corte, use uma data ISO com o fuso de Brasília (UTC-3).
export const REGISTRATION_CLOSES_AT: string | null = "2026-10-23T00:00:00-03:00";
export const REGISTRATION_CLOSED_MESSAGE = "Inscrições encerradas";

export function registrationsAreClosed(now = Date.now()): boolean {
  return REGISTRATION_CLOSES_AT !== null && now >= Date.parse(REGISTRATION_CLOSES_AT);
}
