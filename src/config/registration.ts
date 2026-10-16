// Horário de Brasília (UTC-3). O servidor aplica o corte sem depender de cron ou novo deploy.
export const REGISTRATION_CLOSES_AT = "2026-10-16T00:01:00-03:00";
export const REGISTRATION_CLOSED_MESSAGE = "Inscrições encerradas";

export function registrationsAreClosed(now = Date.now()): boolean {
  return now >= Date.parse(REGISTRATION_CLOSES_AT);
}
