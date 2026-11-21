"use client";

import { usePublicLotStatus as useLotStatus } from "@/hooks/useRegistrationClosed";

import { motion } from "framer-motion";
import { ArrowDown, CalendarDays, MapPin } from "lucide-react";
import { EVENT } from "@/config/event";
import { AutoplayVideo } from "@/components/AutoplayVideo";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(cents / 100);
}

export default function Hero() {
  const { phase, current, next } = useLotStatus();

  const status =
    phase === "open" && current?.veteransOnly
      ? `${current.name} · exclusiva até ${current.lastDayLabel}`
      : phase === "open" && current
      ? `${current.name} · ${formatCurrency(current.adultPrice)} até ${current.lastDayLabel}`
      : phase === "upcoming" && next
      ? `${next.name} · ${next.periodLabel}`
      : "Inscrições encerradas";

  const primary =
    phase === "open"
      ? { href: "#inscricoes", label: "Garantir minha vaga" }
      : { href: "#lotes", label: phase === "upcoming" ? "Ver lotes e preços" : "Ver informações" };

  return (
    <section id="inicio" className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-black md:items-center">
      {/* Fundo do desktop: foto da 2ª edição (não é baixada no celular) */}
      <div
        className="absolute inset-0 -z-20 hidden bg-cover bg-center md:block"
        style={{ backgroundImage: "url(/images/ed2/hero-muro.webp)" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-black via-black/85 to-black/40 md:block" aria-hidden="true" />

      <div className="mx-auto w-full max-w-6xl px-4 pb-14 pt-28 md:grid md:grid-cols-[1fr_auto] md:items-center md:gap-12 md:pb-20">
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-orange-400">
            {EVENT.editionLabel} · corrida de obstáculos
          </p>

          <h1 className="heading-adventure mt-4 text-[4.5rem] leading-[0.85] text-white sm:text-8xl md:text-[8.5rem]">
            TITANS
            <br />
            RACE
          </h1>

          <p className="mt-5 font-titan text-lg uppercase tracking-[0.2em] text-orange-500 md:text-2xl">
            Corra • Supere • Vença
          </p>

          <div className="mt-6 flex flex-col gap-2 text-sm text-zinc-200 sm:flex-row sm:gap-6 md:text-base">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-orange-400" aria-hidden="true" />
              <time dateTime={EVENT.date}>{EVENT.dateLabel}</time>
            </span>
            <a href="#local" className="inline-flex items-center gap-2 hover:text-orange-300">
              <MapPin className="h-4 w-4 text-orange-400" aria-hidden="true" />
              {EVENT.city}
            </a>
          </div>

          <p
            role="status"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-orange-500/40 bg-black/60 px-4 py-2 text-xs font-semibold text-orange-200 backdrop-blur"
          >
            <span className="h-2 w-2 rounded-full bg-orange-500" aria-hidden="true" />
            {status}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={primary.href}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-orange-500 px-8 text-xs font-bold uppercase tracking-[0.18em] text-black transition hover:bg-orange-400"
            >
              {primary.label}
            </a>
            <a
              href="/regulamento.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 px-8 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/10"
            >
              Regulamento
            </a>
          </div>
        </motion.div>

        {/* Vídeo: fundo de tela cheia no celular, "reel" ao lado no desktop */}
        {/* Sem animação de entrada: o Safari só dá autoplay em vídeo visível desde o carregamento. */}
        <div
          className="absolute inset-0 -z-10 md:relative md:inset-auto md:z-0 md:aspect-[9/16] md:w-[300px] md:overflow-hidden md:rounded-[28px] md:border md:border-white/15 md:shadow-[0_30px_90px_rgba(0,0,0,0.8)] lg:w-[340px]"
        >
          <AutoplayVideo
            className="h-full w-full object-cover"
            src="/videos/ed2-muro.mp4"
            poster="/videos/ed2-muro-poster.jpg"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30 md:from-black/50 md:via-transparent md:to-transparent" />
          <p className="absolute bottom-4 left-4 hidden text-[10px] font-semibold uppercase tracking-[0.24em] text-white/80 md:block">
            2ª edição · nov/2026
          </p>
        </div>
      </div>

      <a
        href="#inscricoes"
        aria-label="Rolar para as modalidades"
        className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 text-white/50 transition hover:text-white md:block"
      >
        <ArrowDown className="h-5 w-5 animate-bounce" />
      </a>
    </section>
  );
}
