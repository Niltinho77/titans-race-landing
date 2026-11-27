// Cidades do ranking. A cidade da inscrição é texto livre: aqui ela é reconhecida pelas
// variações comuns ("Sant'Ana do Livramento", "Santana do livramento RS", "Livramento").
// Cidade que não está na lista não entra na aba Cidades até ser incluída aqui.
// crest: brasão em /public/brasoes (sem brasão, o site usa um escudo com as iniciais).
// Brasões do Wikimedia Commons, todos em domínio público. O de Uruguaiana disponível lá é
// CC BY-SA (exige crédito na página), por isso a cidade usa o escudo de iniciais.

export type City = {
  id: string;
  name: string;
  aliases?: string[]; // formas extras, já normalizadas (minúsculas, sem acento)
  crest?: string;
};

export const CITIES: City[] = [
  { id: "alegrete", name: "Alegrete", crest: "/brasoes/alegrete.png" },
  { id: "uruguaiana", name: "Uruguaiana" },
  { id: "santana-do-livramento", name: "Santana do Livramento", aliases: ["livramento", "santana livramento", "sant ana do livramento"], crest: "/brasoes/santana-do-livramento.png" },
  { id: "itaqui", name: "Itaqui", crest: "/brasoes/itaqui.png" },
  { id: "sao-gabriel", name: "São Gabriel", crest: "/brasoes/sao-gabriel.png" },
  { id: "sao-borja", name: "São Borja", crest: "/brasoes/sao-borja.png" },
  { id: "rosario-do-sul", name: "Rosário do Sul", crest: "/brasoes/rosario-do-sul.png" },
  { id: "lavras-do-sul", name: "Lavras do Sul", crest: "/brasoes/lavras-do-sul.png" },
  { id: "dom-pedrito", name: "Dom Pedrito", crest: "/brasoes/dom-pedrito.png" },
  { id: "jaguari", name: "Jaguari", crest: "/brasoes/jaguari.png" },
  { id: "bage", name: "Bagé" },
  { id: "quarai", name: "Quaraí" },
  { id: "manoel-viana", name: "Manoel Viana" },
  { id: "santa-maria", name: "Santa Maria" },
  { id: "cacequi", name: "Cacequi" },
  { id: "santiago", name: "Santiago" },
  { id: "sao-francisco-de-assis", name: "São Francisco de Assis" },
  { id: "macambara", name: "Maçambará" },
  { id: "barra-do-quarai", name: "Barra do Quaraí" },
  { id: "cacapava-do-sul", name: "Caçapava do Sul" },
  { id: "sao-vicente-do-sul", name: "São Vicente do Sul" },
  { id: "porto-alegre", name: "Porto Alegre", aliases: ["poa"] },
];

export function normalizeCityText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’`´]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+(rs|rio grande do sul)$/, "")
    .trim();
}

const CITY_BY_KEY = new Map<string, City>();
for (const city of CITIES) {
  CITY_BY_KEY.set(normalizeCityText(city.name), city);
  for (const alias of city.aliases ?? []) CITY_BY_KEY.set(normalizeCityText(alias), city);
}

export function findCity(value: unknown): City | null {
  const key = normalizeCityText(value);
  return key ? CITY_BY_KEY.get(key) ?? null : null;
}
