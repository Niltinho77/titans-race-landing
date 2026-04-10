// src/components/RegistrationSection.tsx
"use client";

import { motion } from "framer-motion";
import { Lock, AlarmClock, ArrowRight, Flame } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Lot = {
  id: string;
  name: string;
  image: string;
  imageAlt?: string;
};

const lots: Lot[] = [
  {
    id: "lotePromocional",
    name: "Lote Promocional",
    image: "/images/lote-promocional.jpg",
    imageAlt: "Lote Promocional – Titans Race",
  },
  {
    id: "lote2",
    name: "2º Lote",
    image: "/images/lote2.jpg",
    imageAlt: "2º Lote – Titans Race",
  },
  {
    id: "lote3",
    name: "3º Lote",
    image: "/images/lote3.jpg",
    imageAlt: "3º Lote – Titans Race",
  },
  {
    id: "loteFinal",
    name: "Lote Final",
    image: "/images/lote-final.jpg",
    imageAlt: "Lote Final – Titans Race",
  },
];

// ================= CONFIG RÁPIDA =================
// lote aberto agora
const CURRENT_OPEN_LOT_ID = "lotePromocional";

// próximo lote que vai abrir
const NEXT_LOT_NAME = "2º Lote";

// data/hora de abertura do próximo lote
const NEXT_LOT_OPENS_AT_ISO = "2026-05-01T23:59:59-03:00";

// CTA do lote aberto
const CTA_HREF = "#inscricoes";
// ================================================

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  return {
    days,
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds),
  };
}

function countdownCopy(days: number) {
  if (days <= 0) return "ABRINDO AGORA";
  if (days === 1) return "ÚLTIMO DIA";
  if (days <= 3) return "VIRADA DE LOTE";
  return "PRÓXIMO LOTE";
}

function getLotVisualState(lotId: string) {
  if (lotId === CURRENT_OPEN_LOT_ID) return "open";

  const order = ["lotePromocional", "lote2", "lote3", "loteFinal"];
  const currentIndex = order.indexOf(CURRENT_OPEN_LOT_ID);
  const lotIndex = order.indexOf(lotId);

  if (lotIndex < currentIndex) return "closed";
  return "upcoming";
}

export function RegistrationSection() {
  const opensAt = useMemo(() => new Date(NEXT_LOT_OPENS_AT_ISO), []);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const msLeft = opensAt.getTime() - now.getTime();
  const countdown = formatCountdown(msLeft);
  const hasOpened = msLeft <= 0;
  const countdownLabel = countdownCopy(countdown.days);

  return (
    <section
      id="lotes"
      className="relative border-t border-white/5 bg-black px-4 py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
        >
          <div className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.28em] text-orange-400">
              inscrições • 2ª edição
            </p>

            <h2 className="mt-3 heading-adventure text-3xl text-white md:text-5xl">
              O lote promocional está aberto
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-zinc-300 md:text-base">
              Este é o momento de garantir sua vaga com mais vantagem. O lote
              promocional já está liberado, e quando o próximo lote abrir, os
              valores mudam. Quem decide antes entra mais forte.
            </p>
          </div>

          <div className="w-full max-w-md rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-500/15 via-orange-500/10 to-transparent p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-black">
                <AlarmClock className="h-3.5 w-3.5" />
                {hasOpened ? "LOTE VIRANDO" : countdownLabel}
              </span>

              <span className="font-mono text-lg font-extrabold text-white">
                {countdown.days}d {countdown.hours}:{countdown.minutes}:
                {countdown.seconds}
              </span>
            </div>

            
          </div>
        </motion.div>

        

        {/* Cards dos lotes */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {lots.map((lot, index) => {
            const state = getLotVisualState(lot.id);
            const isOpen = state === "open";
            const isUpcoming = state === "upcoming";

            return (
              <motion.div
                key={lot.id}
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                className={`group relative overflow-hidden rounded-3xl border ${
                  isOpen
                    ? "border-orange-500/40 shadow-[0_18px_50px_rgba(249,115,22,0.14)]"
                    : "border-white/10"
                } bg-black`}
              >
                <div className="absolute inset-0">
                  <img
                    src={lot.image}
                    alt={lot.imageAlt}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    className={`absolute inset-0 ${
                      isOpen
                        ? "bg-gradient-to-t from-black/92 via-black/70 to-black/35"
                        : "bg-gradient-to-t from-black/95 via-black/80 to-black/55"
                    }`}
                  />
                </div>

                <div className="absolute inset-0 z-10 bg-black/35 backdrop-blur-[1px]" />

                <div className="relative z-20 flex min-h-[300px] flex-col justify-between p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                        isOpen
                          ? "bg-orange-500 text-black"
                          : isUpcoming
                          ? "border border-white/15 text-zinc-300"
                          : "border border-zinc-700 text-zinc-500"
                      }`}
                    >
                      {isOpen
                        ? "Aberto agora"
                        : isUpcoming
                        ? "Em breve"
                        : "Encerrado"}
                    </span>

                    <span
                      className={`text-[10px] uppercase tracking-[0.22em] ${
                        isOpen
                          ? "text-orange-300"
                          : isUpcoming
                          ? "text-zinc-400"
                          : "text-zinc-600"
                      }`}
                    >
                      {isOpen
                        ? "ativo"
                        : isUpcoming
                        ? "próximo"
                        : "fechado"}
                    </span>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.26em] text-orange-400">
                      Titans Race 2ª edição
                    </p>

                    <h3 className="mt-2 heading-adventure text-3xl text-white">
                      {lot.name}
                    </h3>

                    <div className="mt-6">
                      {isOpen ? (
                        <a
                          href={CTA_HREF}
                          className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-black transition hover:bg-orange-400"
                        >
                          inscreva-se agora
                          <ArrowRight className="h-4 w-4" />
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-zinc-300">
                          <Lock className="h-4 w-4" />
                          {isUpcoming ? "em breve" : "encerrado"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}