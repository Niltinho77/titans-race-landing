export type ModalityId =
  | "kids"
  | "duplas"
  | "competicao"
  | "diversao"
  | "equipes";

export type Modality = {
  id: ModalityId;
  name: string;
  description: string;
  basePrice: number; // em centavos
  ticketLabel: string;
};

export const MODALITIES: Modality[] = [
  {
    id: "kids",
    name: "Kids",
    description:
      "Percurso adaptado para crianças, com obstáculos seguros e monitorados.",
    basePrice: 7000, // R$ 70,00
    ticketLabel: "ingressos Kids",
  },
  {
    id: "duplas",
    name: "Duplas",
    description:
      "Inscrição para dupla. Cada ingresso de dupla equivale a 2 participantes correndo juntos.",
    basePrice: 29000, // R$ 290,00 por dupla
    ticketLabel: "ingressos de dupla",
  },
  {
    id: "equipes",
    name: "Quartetos",
    description:
      "Inscrição por equipe. Cada ingresso equivale a 4 participantes. Regra: a equipe deve conter pelo menos 1 mulher.",
    basePrice: 58000, // R$ 580,00 por equipe
    ticketLabel: "inscrições de equipe",
  },
  {
    id: "competicao",
    name: "Solo",
    description:
      "Prova cronometrada para quem quer tempo, performance e ranking.",
    basePrice: 14500, // R$ 145,00
    ticketLabel: "ingressos Solo",
  },
  {
    id: "diversao",
    name: "Diversão",
    description:
      "Percurso com foco em experiência, lama, superação e boas histórias.",
    basePrice: 14500, // R$ 145,00
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

// taxa repassada ao cliente no checkout
export const PAYMENT_FEE = {
  percent: 0.0399, // 3,99%
  fixed: 39, // R$ 0,39 em centavos
};

export function getModalityById(id?: string | null): Modality | null {
  if (!id) return null;
  return MODALITIES.find((m) => m.id === id) ?? null;
}