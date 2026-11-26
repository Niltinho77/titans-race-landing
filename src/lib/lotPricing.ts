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

// Devolve, na mesma ordem, se cada CPF correu a 1ª ou a 2ª edição (libera a pré-venda)
// e se correu as duas (ganha o desconto de veterano).
export async function getVeteranFlags(
  cpfs: unknown[],
): Promise<{ veteranFlags: boolean[]; discountFlags: boolean[] }> {
  const normalized = cpfs.map(onlyCpfDigits);
  const valid = Array.from(new Set(normalized.filter((cpf) => cpf.length === 11)));
  if (valid.length === 0) {
    const none = normalized.map(() => false);
    return { veteranFlags: none, discountFlags: none };
  }

  const rows = await prisma.veteranAthlete.findMany({
    where: { cpf: { in: valid } },
    select: { cpf: true, bothEditions: true },
  });
  const veterans = new Set(rows.map((row) => row.cpf));
  const bothEditions = new Set(rows.filter((row) => row.bothEditions).map((row) => row.cpf));
  return {
    veteranFlags: normalized.map((cpf) => veterans.has(cpf)),
    discountFlags: normalized.map((cpf) => bothEditions.has(cpf)),
  };
}

// Conta CPFs distintos marcados (um CPF repetido no mesmo pedido conta uma vez só).
function countDistinct(cpfs: unknown[], flags: boolean[]) {
  const seen = new Set<string>();
  cpfs.forEach((cpf, index) => {
    if (flags[index]) seen.add(onlyCpfDigits(cpf));
  });
  return seen.size;
}

export type LotQuote = {
  lotId: Lot["id"];
  ticketsAmount: number; // bruto, sem desconto
  veteranFlags: boolean[]; // correu a 1ª ou a 2ª edição
  discountFlags: boolean[]; // correu as duas: ganha o desconto
  veteranCount: number; // veteranos distintos com direito ao desconto
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
  const { veteranFlags, discountFlags } = await getVeteranFlags(cpfs);
  const veteranCount = countDistinct(cpfs, discountFlags);
  const accessCount = countDistinct(cpfs, veteranFlags);

  const expected = tickets * getParticipantsPerTicket(modalityId);
  const discount = getPeopleDiscount(modalityId, lot, expected, veteranCount);
  return {
    lotId: lot.id,
    ticketsAmount: tickets * getTicketPrice(modalityId, lot),
    veteranFlags,
    discountFlags,
    veteranCount,
    veteranDiscountAmount: discount.veteran,
    groupDiscountAmount: discount.group,
    peopleDiscountAmount: discount.total,
    // Pré-venda: todos os participantes precisam ser veteranos distintos (1ª ou 2ª edição).
    allVeterans: cpfs.length === expected && accessCount === expected,
  };
}
