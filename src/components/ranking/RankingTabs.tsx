"use client";

import { useState } from "react";
import { TeamCrest } from "@/components/ranking/TeamCrest";
import type { Ranking, RankingRow } from "@/lib/ranking";

type Tab = "equipes" | "cidades";

function Table({ rows, kind }: { rows: RankingRow[]; kind: Tab }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
      <div className="grid grid-cols-[2.5rem_1fr_4.5rem] items-center border-b border-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 md:grid-cols-[3rem_1fr_6rem] md:px-4">
        <span>#</span>
        <span>{kind === "equipes" ? "Equipe" : "Cidade"}</span>
        <span className="text-right">Atletas</span>
      </div>
      <ol>
        {rows.map((row) => (
          <li
            key={row.id}
            className={`grid grid-cols-[2.5rem_1fr_4.5rem] items-center border-b border-white/5 px-3 py-2.5 last:border-b-0 md:grid-cols-[3rem_1fr_6rem] md:px-4 ${
              row.podium ? "border-l-4 border-l-orange-500 bg-orange-500/[0.06]" : "border-l-4 border-l-transparent"
            }`}
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold ${
                row.podium ? "bg-orange-500 text-black" : "bg-zinc-800 text-zinc-200"
              }`}
            >
              {row.position}
            </span>
            <span className="flex min-w-0 items-center gap-3">
              <TeamCrest name={row.name} logoUrl={row.logoUrl} size={36} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-white md:text-base">{row.name}</span>
                {row.city && <span className="block truncate text-[11px] text-zinc-500">{row.city}</span>}
              </span>
            </span>
            <span className="heading-adventure text-right text-xl text-white md:text-2xl">{row.athletes}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Empty({ kind }: { kind: Tab }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-zinc-950 p-6 text-center text-sm text-zinc-400">
      {kind === "equipes" ? "Nenhuma equipe no ranking ainda." : "Nenhuma cidade no ranking ainda."}
    </div>
  );
}

export function RankingTabs({ ranking }: { ranking: Ranking }) {
  const [tab, setTab] = useState<Tab>("equipes");
  const rows = tab === "equipes" ? ranking.teams : ranking.cities;

  return (
    <div>
      <div role="tablist" className="mb-4 inline-flex rounded-full border border-white/10 bg-zinc-950 p-1">
        {(["equipes", "cidades"] as const).map((value) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
              tab === value ? "bg-orange-500 text-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            {value === "equipes" ? "Equipes" : "Cidades"}
          </button>
        ))}
      </div>

      {rows.length > 0 ? <Table rows={rows} kind={tab} /> : <Empty kind={tab} />}

      {tab === "equipes" && ranking.independents && (
        <div className="mt-6">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Fora da disputa</p>
          <div className="grid grid-cols-[2.5rem_1fr_4.5rem] items-center rounded-2xl border border-white/10 bg-zinc-950 px-3 py-2.5 md:grid-cols-[3rem_1fr_6rem] md:px-4">
            <span className="text-sm text-zinc-600">–</span>
            <span className="flex min-w-0 items-center gap-3">
              <TeamCrest name={ranking.independents.name} logoUrl={ranking.independents.logoUrl} size={36} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-white md:text-base">{ranking.independents.name}</span>
              </span>
            </span>
            <span className="heading-adventure text-right text-xl text-zinc-300 md:text-2xl">{ranking.independents.athletes}</span>
          </div>
        </div>
      )}
    </div>
  );
}
