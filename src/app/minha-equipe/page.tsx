import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { NavBar } from "@/components/NavBar";
import { JoinTeamForm } from "@/components/ranking/JoinTeamForm";
import { RANKING, teamChangeIsOpen } from "@/config/ranking";

export const metadata: Metadata = {
  title: "Escolha sua equipe | Titans Race",
  description: "Já se inscreveu na Titans Race? Escolha a equipe que você vai defender no ranking.",
};

export const dynamic = "force-dynamic";

export default function MinhaEquipePage() {
  const open = teamChangeIsOpen();
  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-black pb-16 pt-24 text-white">
        <div className="mx-auto max-w-xl px-4">
          <h1 className="heading-adventure text-4xl md:text-5xl">
            Escolha sua <span className="text-orange-500">equipe</span>
          </h1>
          <p className="mt-3 text-sm text-zinc-300">
            Já se inscreveu? Informe o CPF e o e-mail usados na inscrição e escolha a academia, box ou grupo que você vai
            defender no ranking. Dá para trocar até {RANKING.closesLabel}.
          </p>
          <div className="mt-6">
            {open ? (
              <JoinTeamForm />
            ) : (
              <p className="rounded-2xl border border-white/10 bg-zinc-950 p-6 text-sm text-zinc-300">
                A escolha de equipe encerrou em {RANKING.closesLabel}.
              </p>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
