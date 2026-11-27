// src/components/RegistrationSection.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shirt, Users } from "lucide-react";

import { usePublicLotStatus } from "@/hooks/useRegistrationClosed";
import { GROUP_DISCOUNT, PUBLIC_LOTS, type Lot, type LotId } from "@/config/lots";

const CHART_LABEL: Partial<Record<LotId, string>> = {
  blackWeek: "27 nov–2 dez",
  lote1: "3–31 dez",
  lote2: "janeiro",
  loteFinal: "1–14 fev",
  loteExtra: "15 fev–7 mar",
};

function formatPrice(cents: number) {
  return `R$${Math.round(cents / 100)}`;
}

function useCountdown(targetIso: string | null) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  if (!targetIso || now === null) return null;
  const diff = Math.max(0, Date.parse(targetIso) - now);
  return {
    d: Math.floor(diff / 86_400_000),
    h: Math.floor((diff % 86_400_000) / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1000),
  };
}

function countdownCopy(phase: string, current: Lot | null, next: Lot | null) {
  if (phase === "upcoming" && next) return { title: `${next.name} abre em`, target: next.startsAt };
  if (phase === "open" && current) {
    if (current.veteransOnly && next) return { title: `Pré-venda Veteranos aberta · ${next.name} abre em`, target: next.startsAt };
    if (current.id === "loteExtra") return { title: "Inscrições encerram em", target: current.endsAt };
    if (current.id === "loteFinal") return { title: "Camiseta garantida só por mais", target: current.endsAt };
    return { title: "O preço sobe em", target: current.endsAt };
  }
  return null;
}

export function RegistrationSection() {
  const { phase, current, next } = usePublicLotStatus();
  const copy = countdownCopy(phase, current, next);
  const time = useCountdown(copy?.target ?? null);

  const prices = PUBLIC_LOTS.map((lot) => lot.adultPrice);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const currentIndex = current ? PUBLIC_LOTS.findIndex((lot) => lot.id === current.id) : -1;
  const nextIndex = next ? PUBLIC_LOTS.findIndex((lot) => lot.id === next.id) : -1;
  const firstFuture = currentIndex >= 0 ? currentIndex + 1 : nextIndex >= 0 ? nextIndex : PUBLIC_LOTS.length;
  const kidsFrom = Math.min(...PUBLIC_LOTS.map((lot) => lot.kidsPrice));

  return (
    <section id="lotes" className="relative bg-black px-4 py-20 md:py-28">
      <div className="mx-auto max-w-5xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-400">Lotes</p>
        <h2 className="heading-adventure mt-2 text-4xl leading-none text-white md:text-6xl">
          Quanto antes, <span className="text-orange-500">menos você paga.</span>
        </h2>

        {/* Contagem regressiva */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-5 md:p-7">
          {copy ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">{copy.title}</p>
              <div className="mt-3 grid grid-cols-4 gap-2 md:max-w-xl md:gap-3">
                {(["d", "h", "m", "s"] as const).map((unit) => (
                  <div key={unit} className="rounded-2xl bg-white/[0.04] py-3 text-center">
                    <span className="heading-adventure block text-4xl tabular-nums text-white md:text-5xl">
                      {time ? String(time[unit]).padStart(2, "0") : "--"}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                      {{ d: "dias", h: "horas", m: "min", s: "seg" }[unit]}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="heading-adventure text-3xl text-orange-400">Inscrições encerradas</p>
          )}
        </div>

        {/* Escada de preços */}
        <div className="mt-6 rounded-3xl border border-white/10 bg-zinc-950 px-3 pb-4 pt-6 md:px-8 md:pt-10">
          <div className="flex h-[260px] items-end gap-2 md:h-[320px] md:gap-4" role="list" aria-label="Preço por pessoa em cada lote">
            {PUBLIC_LOTS.map((lot, index) => {
              const isCurrent = index === currentIndex;
              const isPast = index < firstFuture && !isCurrent;
              const height = 38 + ((lot.adultPrice - min) / Math.max(1, max - min)) * 62;

              return (
                <div key={lot.id} role="listitem" className="flex h-full flex-1 flex-col items-center justify-end">
                  {isCurrent && (
                    <span className="mb-2 whitespace-nowrap rounded-full bg-orange-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-black md:text-[10px]">
                      agora
                    </span>
                  )}
                  <motion.div
                    className={`relative flex w-full flex-col items-center justify-start rounded-t-2xl pt-3 ${
                      isCurrent
                        ? "bg-gradient-to-t from-orange-600 to-orange-400 shadow-[0_0_40px_rgba(249,115,22,0.35)]"
                        : isPast
                        ? "bg-zinc-900"
                        : lot.includesShirt
                        ? "bg-zinc-800"
                        : "bg-[repeating-linear-gradient(135deg,#27272a_0,#27272a_6px,#1f1f22_6px,#1f1f22_12px)]"
                    }`}
                    initial={{ height: "0%" }}
                    whileInView={{ height: `${height}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: index * 0.08, ease: "easeOut" }}
                  >
                    <span
                      className={`heading-adventure text-lg leading-none md:text-3xl ${
                        isCurrent ? "text-black" : isPast ? "text-zinc-600 line-through" : "text-white"
                      }`}
                    >
                      {formatPrice(lot.adultPrice)}
                    </span>
                    <span className={`mt-0.5 text-[8px] font-medium md:text-[10px] ${isCurrent ? "text-black/70" : "text-zinc-500"}`}>+ taxa</span>
                    {!lot.includesShirt && (
                      <span className="mt-2 flex flex-col items-center text-[9px] font-semibold uppercase leading-tight text-zinc-400 md:text-[10px]">
                        <Shirt className="h-4 w-4" aria-hidden="true" />
                        sem
                        <br />
                        camiseta
                      </span>
                    )}
                  </motion.div>
                  <p className={`mt-2 text-center text-[10px] font-bold uppercase leading-tight md:text-xs ${isCurrent ? "text-orange-400" : isPast ? "text-zinc-600" : "text-zinc-200"}`}>
                    {lot.shortName}
                  </p>
                  <p className="text-center text-[9px] leading-tight text-zinc-500 md:text-[11px]">{CHART_LABEL[lot.id]}</p>
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-zinc-500">
          Valor por pessoa + taxa de serviço · Kids a partir de {formatPrice(kidsFrom)} · Duplas e quartetos pagam por atleta
        </p>

        {/* Grupos e assessorias */}
        <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-emerald-500/25 bg-emerald-500/[0.07] p-5 sm:flex-row sm:items-center md:p-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-black">
            <Users className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <p className="heading-adventure text-2xl text-white md:text-3xl">
              Grupo ou assessoria? <span className="text-emerald-400">Condições especiais</span>
            </p>
            <p className="mt-1 text-sm text-zinc-300">
              Vai trazer {GROUP_DISCOUNT.minParticipants} atletas ou mais? Fale com a gente no WhatsApp e receba as condições especiais para o seu grupo.
            </p>
          </div>
          <a
            href="https://wa.me/5555992234690?text=Ol%C3%A1!%20Quero%20inscrever%20um%20grupo%20na%20Titans%20Race."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-400/50 px-5 text-xs font-bold uppercase tracking-[0.14em] text-emerald-300 transition hover:bg-emerald-500/10"
          >
            Falar sobre grupo
          </a>
        </div>
      </div>
    </section>
  );
}
