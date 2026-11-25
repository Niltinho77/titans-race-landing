export type ModalityId =
  | "kids"
  | "duplas"
  | "competicao"
  | "diversao"
  | "equipes";

// Os preços vêm do lote vigente: veja getTicketPrice em src/config/lots.ts.
export type Modality = {
  id: ModalityId;
  name: string;
  description: string;
  ticketLabel: string;
};

export const MODALITIES: Modality[] = [
  {
    id: "kids",
    name: "Kids",
    description:
      "Percurso adaptado para crianças, com obstáculos seguros e monitorados.",
    ticketLabel: "ingressos Kids",
  },
  {
    id: "duplas",
    name: "Duplas",
    description:
      "Inscrição para dupla. Cada ingresso de dupla equivale a 2 participantes correndo juntos.",
    ticketLabel: "ingressos de dupla",
  },
  {
    id: "equipes",
    name: "Quartetos",
    description:
      "Inscrição por equipe. Cada ingresso equivale a 4 participantes. Regra: a equipe deve conter pelo menos 1 mulher.",
    ticketLabel: "inscrições de equipe",
  },
  {
    id: "competicao",
    name: "Solo",
    description:
      "Prova cronometrada para quem quer tempo, performance e ranking.",
    ticketLabel: "ingressos Solo",
  },
  {
    id: "diversao",
    name: "Diversão",
    description:
      "Percurso com foco em experiência, lama, superação e boas histórias.",
    ticketLabel: "ingressos Diversão",
  },
];

export type ExtraType = "camisa" | "luva" | "meia";

export type ExtraConfig = {
  id: ExtraType;
  name: string;
  description: string;
  price: number; // centavos
  hasSize: boolean;
  sizes?: string[];
};

export const EXTRAS: ExtraConfig[] = [
  {
    id: "camisa",
    name: "Camisa oficial Titans",
    description: "Camisa técnica da prova para usar no dia e depois.",
    price: 5900, // R$ 59,00
    hasSize: true,
    sizes: ["PP", "P", "M", "G", "GG"],
  },
  {
    id: "luva",
    name: "Luva personalizada",
    description: "Proteção extra para os obstáculos mais desafiadores.",
    price: 3000, // R$ 30,00
    hasSize: true,
    sizes: ["P", "M", "G"],
  },
  {
    id: "meia",
    name: "Meias 3/4 de compressão",
    description: "Conforto, compressão e segurança em todo o percurso.",
    price: 5000, // R$ 50,00
    hasSize: true,
    sizes: ["P", "M", "G"],
  },
];

// taxa repassada ao cliente no checkout (pagamento à vista: PIX ou cartão 1x)
export const PAYMENT_FEE = {
  percent: 0.0399, // 3,99%
  fixed: 39, // R$ 0,39 em centavos
};

// Parcelamento no cartão pelo checkout do Asaas. O atleta escolhe em quantas
// vezes quer pagar e paga todo o custo extra do parcelamento: a taxa maior do
// cartão parcelado e a antecipação (receber tudo de uma vez em vez de mês a mês).
// Assim a organização recebe o mesmo que numa venda à vista.
// Confira as taxas do seu contrato no painel do Asaas (Menu do usuário > Taxas)
// e ajuste os valores abaixo se mudarem.
export const INSTALLMENTS = {
  maxCount: 6, // limite para não alongar o recebimento nem o custo de antecipação
  minInstallmentValue: 500, // o Asaas exige parcela mínima de R$ 5,00
  // Taxa do cartão parcelado por faixa: à vista + 0,5 p.p. em 2–6x e + 1 p.p. em
  // 7–12x, a mesma diferença da tabela do Asaas.
  feeTiers: [
    { upTo: 6, percent: 0.0449, fixed: 39 },
    { upTo: 12, percent: 0.0499, fixed: 39 },
  ],
  // Custo da antecipação no Asaas, por mês adiantado (1,25% = taxa pública).
  anticipationMonthlyRate: 0.0125,
};

// A parcela k cai ~32 dias depois do mês k; antecipar todas adianta, em média,
// (n + 1) / 2 meses mais os 2 dias de compensação.
function averageMonthsAnticipated(installments: number) {
  return (installments + 1) / 2 + 2 / 30;
}

export function getPaymentFee(installments = 1) {
  if (installments <= 1) return PAYMENT_FEE;
  const tier =
    INSTALLMENTS.feeTiers.find((item) => installments <= item.upTo) ??
    INSTALLMENTS.feeTiers[INSTALLMENTS.feeTiers.length - 1];
  const anticipation =
    INSTALLMENTS.anticipationMonthlyRate * averageMonthsAnticipated(installments);
  return { percent: tier.percent + anticipation, fixed: tier.fixed };
}

export function calculatePaymentFee(amountCents: number, installments = 1) {
  if (amountCents <= 0) {
    return { totalWithFee: 0, feeAmount: 0 };
  }

  const fee = getPaymentFee(installments);
  const totalWithFee = Math.round((amountCents + fee.fixed) / (1 - fee.percent));
  return { totalWithFee, feeAmount: totalWithFee - amountCents };
}

// Maior número de parcelas possível para este valor líquido (1 = só à vista).
export function getMaxInstallments(amountCents: number) {
  let max = 1;
  for (let count = 2; count <= INSTALLMENTS.maxCount; count++) {
    const { totalWithFee } = calculatePaymentFee(amountCents, count);
    if (totalWithFee / count >= INSTALLMENTS.minInstallmentValue) max = count;
  }
  return max;
}

export function getModalityById(id?: string | null): Modality | null {
  if (!id) return null;
  return MODALITIES.find((m) => m.id === id) ?? null;
}
