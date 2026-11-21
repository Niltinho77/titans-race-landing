import { prisma } from "@/lib/prisma";
import type { ModalityId } from "@/config/checkout";
import {
  getParticipantsPerTicket,
  getPeopleDiscount,
  getTicketPrice,
  type Lot,
} from "@/config/lots";

export function onlyCpfDigits(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}

// Devolve, na mesma ordem, se cada CPF correu a 1ª e a 2ª edição.
export async function getVeteranFlags(cpfs: unknown[]): Promise<boolean[]> {
  const normalized = cpfs.map(onlyCpfDigits);
  const valid = Array.from(new Set(normalized.filter((cpf) => cpf.length === 11)));
  if (valid.length === 0) return normalized.map(() => false);

  const rows = await prisma.veteranAthlete.findMany({
    where: { cpf: { in: valid } },
    select: { cpf: true },
  });
  const veterans = new Set(rows.map((row) => row.cpf));
  return normalized.map((cpf) => veterans.has(cpf));
}

export type LotQuote = {
  lotId: Lot["id"];
  ticketsAmount: number; // bruto, sem desconto
  veteranFlags: boolean[];
  veteranCount: number;
  veteranDiscountAmount: number; // parte do desconto que vem do veterano
  groupDiscountAmount: number; // parte do desconto de grupo (10+ atletas)
  peopleDiscountAmount: number; // veterano + grupo
  allVeterans: boolean;
};

export async function quoteTickets(params: {
  modalityId: ModalityId;
  tickets: number;
  cpfs: unknown[];
  lot: Lot;
}): Promise<LotQuote> {
  const { modalityId, tickets, cpfs, lot } = params;
  const veteranFlags = await getVeteranFlags(cpfs);
  // Um CPF repetido no mesmo pedido conta uma vez só.
  const seen = new Set<string>();
  let veteranCount = 0;
  cpfs.forEach((cpf, index) => {
    const digits = onlyCpfDigits(cpf);
    if (veteranFlags[index] && !seen.has(digits)) {
      seen.add(digits);
      veteranCount += 1;
    }
  });

  const expected = tickets * getParticipantsPerTicket(modalityId);
  const discount = getPeopleDiscount(modalityId, lot, expected, veteranCount);
  return {
    lotId: lot.id,
    ticketsAmount: tickets * getTicketPrice(modalityId, lot),
    veteranFlags,
    veteranCount,
    veteranDiscountAmount: discount.veteran,
    groupDiscountAmount: discount.group,
    peopleDiscountAmount: discount.total,
    // Todos os participantes precisam ser veteranos distintos.
    allVeterans: cpfs.length === expected && veteranCount === expected,
  };
}
