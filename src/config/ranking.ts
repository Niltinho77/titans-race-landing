// Ranking de equipes e cidades da 3ª edição.
export const RANKING = {
  minAthletes: 4, // equipe/cidade aparece na tabela a partir de 4 atletas
  podium: 3, // as 3 primeiras equipes ganham troféu e área reservada para a tenda
  // Até 28/02: conta inscrições pagas até esse dia e a troca de equipe fica liberada.
  closesAt: "2027-03-01T00:00:00-03:00",
  closesLabel: "28/02",
};

export function teamChangeIsOpen(now = Date.now()) {
  return now < Date.parse(RANKING.closesAt);
}
