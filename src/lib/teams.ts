import { prisma } from "@/lib/prisma";
import { normalizeTeamName, parseTeamChoice, type TeamChoice } from "@/lib/teamNames";

type TeamRow = { id: string; status: string; mergedIntoId: string | null };

// Segue fusões (duplicata -> equipe principal). Devolve null se a equipe não existe.
async function followMerges(id: string | null): Promise<string | null> {
  let currentId = id;
  for (let hop = 0; currentId && hop < 5; hop += 1) {
    const team: TeamRow | null = await prisma.team.findUnique({
      where: { id: currentId },
      select: { id: true, status: true, mergedIntoId: true },
    });
    if (!team) return null;
    if (team.status !== "MERGED" || !team.mergedIntoId) return team.id;
    currentId = team.mergedIntoId;
  }
  return null;
}

async function findOrCreateTeam(name: string, instagram: string): Promise<string | null> {
  const normalizedName = normalizeTeamName(name);
  const existing = await prisma.team.findUnique({ where: { normalizedName }, select: { id: true } });
  if (existing) return followMerges(existing.id);
  try {
    const created = await prisma.team.create({
      data: { name, normalizedName, instagram: instagram || null },
      select: { id: true },
    });
    return created.id;
  } catch (error) {
    // Duas inscrições criando a mesma equipe ao mesmo tempo: usa a que ficou.
    if ((error as { code?: string })?.code === "P2002") {
      const again = await prisma.team.findUnique({ where: { normalizedName }, select: { id: true } });
      return again ? followMerges(again.id) : null;
    }
    throw error;
  }
}

export async function resolveTeamChoice(choice: TeamChoice | null): Promise<string | null> {
  if (!choice) return null;
  if ("teamId" in choice) return followMerges(choice.teamId);
  if ("independent" in choice) {
    const team = await prisma.team.findFirst({ where: { isIndependent: true }, select: { id: true } });
    return team?.id ?? null;
  }
  return findOrCreateTeam(choice.newTeam.name, choice.newTeam.instagram);
}

// Equipe de cada participante da inscrição. Nunca bloqueia o pedido: em qualquer erro,
// o atleta fica sem equipe e escolhe depois em /minha-equipe.
// Sem escolha, quem usou o cupom de um grupo entra na equipe desse cupom.
export async function resolveParticipantTeams(
  choices: unknown[],
  couponCode: string | null,
): Promise<(string | null)[]> {
  try {
    const couponTeam = couponCode
      ? await prisma.team.findUnique({ where: { couponCode }, select: { id: true } })
      : null;
    const couponTeamId = couponTeam ? await followMerges(couponTeam.id) : null;
    const cache = new Map<string, string | null>();
    const result: (string | null)[] = [];
    for (const raw of choices) {
      const choice = parseTeamChoice(raw);
      if (!choice) {
        result.push(couponTeamId);
        continue;
      }
      const key = JSON.stringify(
        "newTeam" in choice ? normalizeTeamName(choice.newTeam.name) : choice,
      );
      if (!cache.has(key)) cache.set(key, await resolveTeamChoice(choice));
      result.push(cache.get(key) ?? couponTeamId);
    }
    return result;
  } catch (error) {
    console.error("Erro ao definir a equipe dos participantes:", error);
    return choices.map(() => null);
  }
}

export type TeamSuggestion = { id: string; name: string; city: string | null; logoUrl: string | null };

// Sugestões do campo de equipe (sem Independentes, que é uma opção fixa do formulário).
export async function searchTeams(query: string): Promise<TeamSuggestion[]> {
  const text = query.trim().slice(0, 60);
  const key = normalizeTeamName(text);
  if (key.length < 2) return [];
  return prisma.team.findMany({
    where: {
      status: { not: "MERGED" },
      isIndependent: false,
      OR: [{ normalizedName: { contains: key } }, { name: { contains: text, mode: "insensitive" } }],
    },
    select: { id: true, name: true, city: true, logoUrl: true },
    orderBy: { name: "asc" },
    take: 8,
  });
}
