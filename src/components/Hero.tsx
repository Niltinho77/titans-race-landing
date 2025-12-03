// src/components/Hero.tsx
"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
    >
      {/* VÍDEO DE FUNDO – troque o src quando tiver o vídeo oficial */}
      <video
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        src="/videos/1202.mov"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Overlays para escurecer e dar clima de aventura */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/95" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(248,250,252,0.22)_0,_transparent_55%)]" />

      {/* Conteúdo */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16 md:flex-row md:items-center">
        {/* Bloco de texto principal */}
        <div className="flex-1">
          <motion.p
            className="mb-3 text-[11px] uppercase tracking-[0.3em] text-slate-300"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            ALEGRETE · CORRIDA DE OBSTÁCULOS
          </motion.p>

          <motion.h1
            className="heading-adventure text-4xl text-slate-50 sm:text-5xl md:text-6xl"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            TITANS RACE
          </motion.h1>

          <motion.p
            className="mt-4 max-w-xl text-sm text-slate-200 md:text-base"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            Uma prova de obstáculos em clima de operação: lama, fogo, carga,
            cordas e trabalho em equipe. Nada de esteira, nada de ar-condicionado.
            É você, o terreno e a vontade de provar que merece o título de Titã.
          </motion.p>

          {/* CTA */}
          <motion.div
            className="mt-8 flex flex-col gap-3 sm:flex-row"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
          >
            <a
              href="#inscricoes"
              className="inline-flex items-center justify-center rounded-full bg-orange-500 px-10 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-950 shadow-[0_14px_40px_rgba(0,0,0,0.75)] hover:bg-orange-400 hover:translate-y-[1px] transition"
            >
              Quero encarar a prova
            </a>
            <a
              href="#regulamento"
              className="inline-flex items-center justify-center rounded-full border border-slate-300/40 px-10 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-50/90 hover:bg-slate-50/5 transition"
            >
              Ver regulamento
            </a>
          </motion.div>

          {/* Linha com stats (distância, obstáculos, modalidade) */}
          <motion.div
            className="mt-8 grid max-w-xl grid-cols-3 gap-4 rounded-2xl bg-black/55 px-5 py-4 text-[11px] text-slate-200 backdrop-blur-md border border-slate-700/60"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div>
              <p className="text-slate-400">Distância</p>
              <p className="mt-1 text-sm font-semibold text-slate-50">
                +/- 6 km
              </p>
            </div>
            <div>
              <p className="text-slate-400">Obstáculos</p>
              <p className="mt-1 text-sm font-semibold text-slate-50">
                +15 desafios
              </p>
            </div>
            <div>
              <p className="text-slate-400">Modalidade</p>
              <p className="mt-1 text-sm font-semibold text-slate-50">
                Solo & Equipes
              </p>
            </div>
          </motion.div>
        </div>

        {/* Bloco extra (mini-card) – opcional, mantém equilíbrio visual */}
        <motion.div
          className="mt-8 flex flex-1 items-end justify-center md:mt-0 md:justify-end"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
        >
          <div className="w-full max-w-sm rounded-3xl border border-slate-700/70 bg-black/70 p-4 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
            <p className="text-[11px] uppercase tracking-[0.22em] text-orange-400">
              edição de estreia
            </p>
            <p className="mt-2 text-sm text-slate-100">
              Vagas limitadas para a primeira Titans Race em Alegrete. Ideal para
              equipes de academias, unidades militares, empresas e grupos de
              amigos que querem uma experiência fora da rotina.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}