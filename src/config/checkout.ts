// src/config/checkout.ts

export type ModalityId = "kids" | "duplas" | "competicao" | "diversao";

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
    basePrice: 12000, // R$ 120,00
    ticketLabel: "ingressos Kids",
  },
  {
    id: "duplas",
    name: "Duplas",
    description:
      "Inscrição para dupla. Cada ingresso de dupla equivale a 2 participantes correndo juntos.",
    basePrice: 26000, // R$ 260,00 (dupla)
    ticketLabel: "ingressos de dupla",
  },
  {
    id: "competicao",
    name: "Competição",
    description:
      "Prova cronometrada para quem quer tempo, performance e ranking.",
    basePrice: 19, // R$ 190,00
    ticketLabel: "ingressos Competição",
  },
  {
    id: "diversao",
    name: "Diversão",
    description:
      "Percurso com foco em experiência, lama, superação e boas histórias.",
    basePrice: 17000, // R$ 170,00
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
    name: "Luva de grip",
    description: "Proteção extra para os obstáculos mais desafiadores.",
    price: 2500, // R$ 25,00
    hasSize: true,
    sizes: ["P", "M", "G"],
  },
  {
    id: "meia",
    name: "Meia performance",
    description: "Conforto e segurança em todo o percurso.",
    price: 2000, // R$ 20,00
    hasSize: true,
    sizes: ["P", "M", "G"],
  },
];

export function getModalityById(id?: string | null): Modality | null {
  if (!id) return null;
  return MODALITIES.find((m) => m.id === id) ?? null;
}