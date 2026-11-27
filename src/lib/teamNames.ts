// Regras de texto das equipes. Sem banco: usado no servidor e no navegador.

// Escolha de equipe enviada pelo formulário (inscrição ou /minha-equipe).
export type TeamChoice =
  | { teamId: string }
  | { independent: true }
  | { newTeam: { name: string; instagram: string } };

export const TEAM_NAME_MAX = 60;

function stripAccents(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Chave de duplicata: "MP Fit", "MPFit" e "mp-fit" viram "mpfit".
export function normalizeTeamName(value: unknown) {
  return stripAccents(String(value ?? "")).toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Nome como será exibido: espaços simples, sem bordas, até 60 caracteres.
export function cleanTeamName(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, TEAM_NAME_MAX);
}

// "@mpfit", "instagram.com/mpfit/" ou "MPFit" viram "mpfit".
export function normalizeInstagram(value: unknown) {
  const handle = String(value ?? "")
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@+/, "")
    .split(/[/?#\s]/)[0]
    .toLowerCase();
  return /^[a-z0-9._]{1,30}$/.test(handle) ? handle : "";
}

// Lê a escolha enviada pelo navegador; qualquer coisa fora do formato vira null.
export function parseTeamChoice(value: unknown): TeamChoice | null {
  if (!value || typeof value !== "object") return null;
  const choice = value as Record<string, unknown>;
  if (typeof choice.teamId === "string" && /^[a-z0-9]{10,40}$/.test(choice.teamId)) {
    return { teamId: choice.teamId };
  }
  if (choice.independent === true) return { independent: true };
  const newTeam = choice.newTeam as Record<string, unknown> | undefined;
  if (newTeam && typeof newTeam === "object") {
    const name = cleanTeamName(newTeam.name);
    if (normalizeTeamName(name).length < 2) return null;
    return { newTeam: { name, instagram: normalizeInstagram(newTeam.instagram) } };
  }
  return null;
}

const SMALL_WORDS = new Set(["de", "da", "do", "das", "dos", "e", "the", "team"]);

// Iniciais do escudo provisório: "Evolution Gym" -> "EG", "Bora Correr SG" -> "BC".
export function teamInitials(name: string) {
  const words = stripAccents(name)
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter((word) => word && !SMALL_WORDS.has(word.toLowerCase()));
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2);
  return words[0][0] + words[1][0];
}

const CREST_COLORS = [
  "#f97316", "#ef4444", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#8b5cf6", "#ec4899", "#64748b", "#a16207",
];

// Cor fixa por nome (a mesma equipe sempre tem a mesma cor).
export function teamColor(name: string) {
  let hash = 0;
  for (const char of normalizeTeamName(name)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return CREST_COLORS[hash % CREST_COLORS.length];
}
