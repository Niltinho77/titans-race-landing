// null mantém as inscrições abertas sem encerramento automático.
// Para agendar um corte, use uma data ISO com o fuso de Brasília (UTC-3).
export const REGISTRATION_CLOSES_AT: string | null = "2026-10-23T00:00:00-03:00";
export const REGISTRATION_CLOSED_MESSAGE = "Inscrições encerradas";

// Lote extra aberto após o encerramento: inscrição sem camiseta e sem extras (camisa, luva, meia).
// As vagas são só anunciadas; o controle é manual. Para encerrar, mude `active` para false.
export const EXTRA_LOT = {
  active: true,
  name: "Lote Extra",
  announcedSpots: 10,
  shirtLabel: "Sem camiseta",
};

export function registrationsAreClosed(now = Date.now()): boolean {
  return REGISTRATION_CLOSES_AT !== null && now >= Date.parse(REGISTRATION_CLOSES_AT);
}

// Usado pelo site e pelo checkout Asaas. Os gateways antigos seguem só a data.
export function publicRegistrationsAreClosed(now = Date.now()): boolean {
  return !EXTRA_LOT.active && registrationsAreClosed(now);
}
