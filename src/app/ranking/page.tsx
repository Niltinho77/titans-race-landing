import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { NavBar } from "@/components/NavBar";
import { RankingTabs } from "@/components/ranking/RankingTabs";
import { EVENT } from "@/config/event";
import { RANKING } from "@/config/ranking";
import { getRanking, type Ranking } from "@/lib/ranking";

export const metadata: Metadata = {
  title: "Ranking de equipes | Titans Race",
  description:
    "Qual academia, box ou grupo leva mais atletas para a Titans Race? As 3 primeiras equipes ganham troféu e área reservada na arena.",
};

// Recalcula a cada 5 minutos.
export const revalidate = 300;

export default async function RankingPage() {
  let ranking: Ranking | null = null;
  try {
    ranking = await getRanking();
  } catch (error) {
    console.error("Erro ao montar o ranking:", error);
  }

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-black pb-16 pt-24 text-white">
        <div className="mx-auto max-w-3xl px-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-400">
            Titans Race · {EVENT.editionLabel} · {EVENT.shortDateLabel}
          </p>
          <h1 className="heading-adventure mt-2 text-4xl md:text-5xl">
            Ranking de <span className="text-orange-500">equipes</span>
          </h1>
          <p className="mt-3 text-sm text-zinc-300 md:text-base">
            Qual academia, box ou grupo leva mais Titans para a arena? As {RANKING.podium} primeiras equipes ganham{" "}
            <strong className="text-white">troféu e área reservada</strong> para montar a tenda no dia da prova.
          </p>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/#inscricoes"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-orange-500 px-6 text-xs font-bold uppercase tracking-[0.16em] text-black transition hover:bg-orange-400"
            >
              Inscreva-se
            </Link>
            <Link
              href="/minha-equipe"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 px-6 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:border-orange-500"
            >
              Já sou inscrito: escolher equipe
            </Link>
          </div>

          <div className="mt-8">
            {ranking ? (
              <RankingTabs ranking={ranking} />
            ) : (
              <p className="rounded-2xl border border-white/10 bg-zinc-950 p-6 text-center text-sm text-zinc-400">
                O ranking está sendo atualizado. Volte em alguns minutos.
              </p>
            )}
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
