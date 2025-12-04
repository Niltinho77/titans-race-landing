// src/config/checkout.ts

export type ModalityId = "kids" | "duplas" | "competicao" | "diversao";

export type Modality = {
  id: ModalityId;
  name: string;
  description: string;
  basePrice: number; // em centavos - pra Stripe depois
  ticketLabel: string; // texto que aparece no "ingressos"
};

export const MODALITIES: Modality[] = [
  {
    id: "kids",
    name: "Kids",
    description:
      "Percurso adaptado para crianças, com obstáculos seguros e monitorados.",
    basePrice: 0,
    ticketLabel: "ingressos Kids",
  },
  {
    id: "duplas",
    name: "Duplas",
    description:
      "Inscrição para dupla. Cada ingresso de dupla equivale a 2 participantes correndo juntos.",
    basePrice: 0,
    ticketLabel: "ingressos de dupla",
  },
  {
    id: "competicao",
    name: "Competição",
    description:
      "Prova cronometrada para quem quer tempo, performance e ranking.",
    basePrice: 0,
    ticketLabel: "ingressos Competição",
  },
  {
    id: "diversao",
    name: "Diversão",
    description:
      "Percurso com foco em experiência, lama, superação e boas histórias.",
    basePrice: 0,
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
    price: 0,
    hasSize: true,
    sizes: ["PP", "P", "M", "G", "GG"],
  },
  {
    id: "luva",
    name: "Luva de grip",
    description: "Proteção extra para os obstáculos mais desafiadores.",
    price: 0,
    hasSize: true,
    sizes: ["P", "M", "G"],
  },
  {
    id: "meia",
    name: "Meia performance",
    description: "Conforto e segurança em todo o percurso.",
    price: 0,
    hasSize: true,
    sizes: ["P", "M", "G"],
  },
];

export function getModalityById(id?: string | null): Modality | null {
  if (!id) return null;
  return MODALITIES.find((m) => m.id === id) ?? null;
}