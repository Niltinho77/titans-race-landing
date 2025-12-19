// src/config/checkout.ts

// src/config/checkout.ts

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
    basePrice: 8000, // R$ 80,00
    ticketLabel: "ingressos Kids",
  },
  {
    id: "duplas",
    name: "Duplas",
    description:
      "Inscrição para dupla. Cada ingresso de dupla equivale a 2 participantes correndo juntos.",
    basePrice: 34000, // R$ 340,00 (dupla)
    ticketLabel: "ingressos de dupla",
  },

  // ✅ NOVA MODALIDADE
  {
    id: "equipes",
    name: "Equipes",
    description:
      "Inscrição por equipe. Cada ingresso equivale a 4 participantes. Regra: a equipe deve conter pelo menos 1 mulher.",
    basePrice: 66000, // R$ 660,00 (equipe)
    ticketLabel: "inscrições de equipe",
  },

  {
    id: "competicao",
    name: "Competição",
    description:
      "Prova cronometrada para quem quer tempo, performance e ranking.",
    basePrice: 17500, // R$ 175,00
    ticketLabel: "ingressos Competição",
  },
  {
    id: "diversao",
    name: "Diversão",
    description:
      "Percurso com foco em experiência, lama, superação e boas histórias.",
    basePrice: 16500, // R$ 165,00
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
    price: 5900, 
    hasSize: true,
    sizes: ["PP", "P", "M", "G", "GG"],
  },
  {
    id: "luva",
    name: "Luva personalizada",
    description: "Proteção extra para os obstáculos mais desafiadores.",
    price: 3000, 
    hasSize: true,
    sizes: ["P", "M", "G"],
  },
  {
    id: "meia",
    name: "Meia personalizada",
    description: "Conforto e segurança em todo o percurso.",
    price: 2500,
    hasSize: true,
    sizes: ["P", "M", "G"],
  },
];

export function getModalityById(id?: string | null): Modality | null {
  if (!id) return null;
  return MODALITIES.find((m) => m.id === id) ?? null;
}