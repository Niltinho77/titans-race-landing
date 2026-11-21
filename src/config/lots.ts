// Calendário de lotes da 3ª edição (14/03/2027).
// As datas usam o fuso de Brasília (UTC-3). `endsAt` é exclusivo: o lote vale até o instante anterior.
// Preços em centavos, por pessoa. Duplas = 2 pessoas, Quartetos = 4 pessoas.

import type { ModalityId } from "./checkout";

export type LotId =
  | "preVendaVeteranos"
  | "blackWeek"
  | "lote1"
  | "lote2"
  | "loteFinal"
  | "loteExtra";

export type Lot = {
  id: LotId;
  name: string;
  hook: string;
  periodLabel: string;
  lastDayLabel: string; // último dia de venda do lote
  startsAt: string;
  endsAt: string;
  adultPrice: number; // centavos por pessoa (Solo, Diversão, Duplas, Quartetos)
  kidsPrice: number; // centavos por criança
  veteransOnly: boolean; // só CPFs que correram a 1ª e a 2ª edição
  veteranDiscount: number; // centavos de desconto por veterano
  includesShirt: boolean; // false = sem camiseta e sem itens extras (camisas pedidas à fábrica em 15/02)
  shortName: string; // rótulo curto para o gráfico de preços
  unlisted?: boolean; // fora do gráfico de preços e não anunciado antes; aparece no site só enquanto está aberto
};

export const LOTS: Lot[] = [
  {
    id: "preVendaVeteranos",
    name: "Pré-venda Veteranos",
    hook: "Exclusiva para quem correu a 1ª e a 2ª edição",
    periodLabel: "25 e 26/11",
    lastDayLabel: "26/11",
    startsAt: "2026-11-25T00:00:00-03:00",
    endsAt: "2026-11-27T00:00:00-03:00",
    adultPrice: 12800,
    kidsPrice: 7500,
    veteransOnly: true,
    veteranDiscount: 0,
    includesShirt: true,
    shortName: "Pré-venda",
    unlisted: true,
  },
  {
    id: "blackWeek",
    name: "Black Week",
    hook: "Preço promocional até 02/12",
    periodLabel: "27/11 a 02/12",
    lastDayLabel: "02/12",
    startsAt: "2026-11-27T00:00:00-03:00",
    endsAt: "2026-12-03T00:00:00-03:00",
    adultPrice: 12800,
    kidsPrice: 7500,
    veteransOnly: false,
    veteranDiscount: 0,
    includesShirt: true,
    shortName: "Black Week",
  },
  {
    id: "lote1",
    name: "Lote 1",
    hook: "Presente de Natal",
    periodLabel: "03/12 a 31/12",
    lastDayLabel: "31/12",
    startsAt: "2026-12-03T00:00:00-03:00",
    endsAt: "2027-01-01T00:00:00-03:00",
    adultPrice: 14800,
    kidsPrice: 8000,
    veteransOnly: false,
    veteranDiscount: 1000,
    includesShirt: true,
    shortName: "Lote 1",
  },
  {
    id: "lote2",
    name: "Lote 2",
    hook: "Metas do ano novo",
    periodLabel: "01/01 a 31/01",
    lastDayLabel: "31/01",
    startsAt: "2027-01-01T00:00:00-03:00",
    endsAt: "2027-02-01T00:00:00-03:00",
    adultPrice: 16800,
    kidsPrice: 8500,
    veteransOnly: false,
    veteranDiscount: 1000,
    includesShirt: true,
    shortName: "Lote 2",
  },
  {
    id: "loteFinal",
    name: "Lote Final",
    hook: "Última chance com camiseta oficial",
    periodLabel: "01/02 a 14/02",
    lastDayLabel: "14/02",
    startsAt: "2027-02-01T00:00:00-03:00",
    endsAt: "2027-02-15T00:00:00-03:00",
    adultPrice: 18800,
    kidsPrice: 9000,
    veteransOnly: false,
    veteranDiscount: 1000,
    includesShirt: true,
    shortName: "Final",
  },
  {
    id: "loteExtra",
    name: "Lote Extra",
    hook: "Sem camiseta e sem itens extras",
    periodLabel: "15/02 a 07/03",
    lastDayLabel: "07/03",
    startsAt: "2027-02-15T00:00:00-03:00",
    endsAt: "2027-03-08T00:00:00-03:00",
    adultPrice: 18800,
    kidsPrice: 9000,
    veteransOnly: false,
    veteranDiscount: 0,
    includesShirt: false,
    shortName: "Extra",
  },
];

export const NO_SHIRT_LABEL = "Sem camiseta";

export type LotPhase = "upcoming" | "open" | "ended";

export type LotStatus = {
  phase: LotPhase;
  current: Lot | null;
  next: Lot | null;
};

export function getLotStatus(now = Date.now()): LotStatus {
  const current =
    LOTS.find((lot) => now >= Date.parse(lot.startsAt) && now < Date.parse(lot.endsAt)) ?? null;
  const next = LOTS.find((lot) => now < Date.parse(lot.startsAt)) ?? null;
  const phase: LotPhase = current ? "open" : next ? "upcoming" : "ended";
  return { phase, current, next };
}

// Lotes do gráfico de preços (a pré-venda dos veteranos fica fora).
export const PUBLIC_LOTS = LOTS.filter((lot) => !lot.unlisted);

// Visão pública: um lote não listado só aparece enquanto está aberto; antes disso o site
// anuncia o próximo lote listado (a pré-venda não é divulgada com antecedência).
export function getPublicLotStatus(now = Date.now()): LotStatus {
  const status = getLotStatus(now);
  const next = PUBLIC_LOTS.find((lot) => now < Date.parse(lot.startsAt)) ?? null;
  return { ...status, next };
}

// Primeiro dia do lote, ex.: "27/11".
export function getStartDayLabel(lot: Lot) {
  return lot.periodLabel.split(/ a | e /)[0];
}

export function getCurrentLot(now = Date.now()): Lot | null {
  return getLotStatus(now).current;
}

export function getLotById(id?: string | null): Lot | null {
  return LOTS.find((lot) => lot.id === id) ?? null;
}

// Lote usado para precificar convites e pedidos manuais fora da janela de venda.
export function getPricingLot(now = Date.now()): Lot {
  const status = getLotStatus(now);
  return status.current ?? status.next ?? LOTS[LOTS.length - 1];
}

export function getParticipantsPerTicket(modalityId: ModalityId | string) {
  if (modalityId === "duplas") return 2;
  if (modalityId === "equipes") return 4;
  return 1;
}

export function getPersonPrice(modalityId: ModalityId | string, lot: Lot) {
  return modalityId === "kids" ? lot.kidsPrice : lot.adultPrice;
}

// Preço de um ingresso (1 pessoa, 1 dupla ou 1 quarteto).
export function getTicketPrice(modalityId: ModalityId | string, lot: Lot) {
  return getPersonPrice(modalityId, lot) * getParticipantsPerTicket(modalityId);
}

// O desconto de veterano nunca passa do valor da própria inscrição da pessoa.
export function getVeteranDiscount(
  modalityId: ModalityId | string,
  lot: Lot,
  veteranCount: number,
) {
  const perPerson = Math.min(lot.veteranDiscount, getPersonPrice(modalityId, lot));
  return perPerson * Math.max(0, veteranCount);
}
