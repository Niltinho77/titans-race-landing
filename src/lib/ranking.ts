import { prisma } from "@/lib/prisma";
import { CITIES, findCity } from "@/config/cities";
import { RANKING } from "@/config/ranking";

export type RankingTeam = {
  id: string;
  name: string;
  city: string | null;
  logoUrl: string | null;
  status: string;
  mergedIntoId: string | null;
  isIndependent: boolean;
};

export type RankingParticipant = {
  teamId: string | null;
  city: string | null;
  order: { status: string; asaasPaymentStatus: string | null; paidAt: Date | null; createdAt: Date };
};

export type RankingRow = {
  position: number;
  id: string;
  name: string;
  city: string | null;
  logoUrl: string | null;
  athletes: number;
  podium: boolean;
};

export type Ranking = {
  teams: RankingRow[];
  independents: { name: string; logoUrl: string | null; athletes: number } | null;
  cities: RankingRow[];
  updatedAt: string;
};

// Conta: pedido pago (site, pagamento por fora ou manual), menos cortesias, até o fechamento.
export function countsForRanking(order: RankingParticipant["order"]) {
  if (order.status !== "PAID" || order.asaasPaymentStatus === "COMPLIMENTARY") return false;
  const paidAt = order.paidAt ?? order.createdAt;
  return paidAt.getTime() < Date.parse(RANKING.closesAt);
}

// Mais atletas na frente. Empate: fica na frente quem chegou primeiro ao número
// (pagamento do último atleta mais antigo). Posições sempre distintas: o pódio tem 3.
function withPositions<T extends { athletes: number; reachedAt: number; name: string }>(items: T[]) {
  const sorted = [...items].sort(
    (a, b) => b.athletes - a.athletes || a.reachedAt - b.reachedAt || a.name.localeCompare(b.name, "pt-BR"),
  );
  return sorted.map((item, index) => {
    const row: Omit<T, "reachedAt"> & { reachedAt?: number } = { ...item };
    delete row.reachedAt;
    return { ...row, position: index + 1 };
  });
}

export function buildRanking(
  participants: RankingParticipant[],
  teams: RankingTeam[],
  now = new Date(),
): Ranking {
  const byId = new Map(teams.map((team) => [team.id, team]));
  const resolve = (id: string | null) => {
    let team = id ? byId.get(id) : undefined;
    for (let hop = 0; team && team.status === "MERGED" && team.mergedIntoId && hop < 5; hop += 1) {
      team = byId.get(team.mergedIntoId);
    }
    return team && team.status !== "MERGED" ? team : undefined;
  };

  const teamCounts = new Map<string, number>();
  const cityCounts = new Map<string, number>();
  const reached = new Map<string, number>(); // "team:id" / "city:id" -> quando chegou ao número atual
  const add = (counts: Map<string, number>, key: string, id: string, time: number) => {
    counts.set(id, (counts.get(id) ?? 0) + 1);
    reached.set(key, Math.max(reached.get(key) ?? 0, time));
  };
  for (const participant of participants) {
    if (!countsForRanking(participant.order)) continue;
    const time = (participant.order.paidAt ?? participant.order.createdAt).getTime();
    const team = resolve(participant.teamId);
    if (team) add(teamCounts, `team:${team.id}`, team.id, time);
    const city = findCity(participant.city);
    if (city) add(cityCounts, `city:${city.id}`, city.id, time);
  }

  const visible = (athletes: number) => athletes >= RANKING.minAthletes;
  const independentTeam = teams.find((team) => team.isIndependent && team.status !== "MERGED");
  const independentCount = independentTeam ? teamCounts.get(independentTeam.id) ?? 0 : 0;

  const teamRows = withPositions(
    Array.from(teamCounts, ([id, athletes]) => ({ team: byId.get(id)!, athletes }))
      .filter(({ team, athletes }) => !team.isIndependent && visible(athletes))
      .map(({ team, athletes }) => ({
        id: team.id,
        name: team.name,
        city: team.city,
        logoUrl: team.logoUrl,
        athletes,
        reachedAt: reached.get(`team:${team.id}`) ?? 0,
      })),
  ).map((row) => ({ ...row, podium: row.position <= RANKING.podium }));

  const cityRows = withPositions(
    Array.from(cityCounts, ([id, athletes]) => ({ city: CITIES.find((c) => c.id === id)!, athletes }))
      .filter(({ athletes }) => visible(athletes))
      .map(({ city, athletes }) => ({
        id: city.id,
        name: city.name,
        city: null,
        logoUrl: city.crest ?? null,
        athletes,
        reachedAt: reached.get(`city:${city.id}`) ?? 0,
      })),
  ).map((row) => ({ ...row, podium: false }));

  return {
    teams: teamRows,
    independents:
      independentTeam && visible(independentCount)
        ? { name: independentTeam.name, logoUrl: independentTeam.logoUrl, athletes: independentCount }
        : null,
    cities: cityRows,
    updatedAt: now.toISOString(),
  };
}

export async function getRanking(): Promise<Ranking> {
  const [participants, teams] = await Promise.all([
    prisma.participant.findMany({
      where: { order: { status: "PAID" } },
      select: {
        teamId: true,
        city: true,
        order: { select: { status: true, asaasPaymentStatus: true, paidAt: true, createdAt: true } },
      },
    }),
    prisma.team.findMany({
      select: { id: true, name: true, city: true, logoUrl: true, status: true, mergedIntoId: true, isIndependent: true },
    }),
  ]);
  return buildRanking(participants, teams);
}
