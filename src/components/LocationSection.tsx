// src/components/LocationSection.tsx
"use client";

import { motion } from "framer-motion";
import { EVENT } from "@/config/event";
import { MapPin, Building2, Flame, Droplets } from "lucide-react";

export function LocationSection() {
  return (
    <section
      id="local"
      className="relative border-t border-white/5 bg-black px-4 py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl">
        {/* Título */}
        <motion.h2
          className="heading-adventure text-3xl text-white md:text-5xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Local & Estrutura
        </motion.h2>

        <motion.p
          className="mt-4 max-w-2xl text-sm text-zinc-300 md:text-base"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          A Titans Race acontecerá no <strong className="font-semibold text-white">campo ao lado do Hotel Refazenda</strong>,
          em {EVENT.city}. Um espaço ao ar livre com terreno variado, lama e
          obstáculos para viver cada desafio da prova.
        </motion.p>

        <div className="mt-6 flex flex-col items-start gap-3">
          <a
            href={EVENT.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-orange-500/40 bg-orange-500/10 px-5 py-3 text-xs font-semibold text-orange-300 transition hover:bg-orange-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-400"
          >
            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
            Encontrar Hotel Refazenda no mapa
          </a>
          <p className="max-w-xl text-xs leading-relaxed text-zinc-400">
            Use o hotel como ponto de referência para chegar. A prova será no campo ao lado.
          </p>
        </div>

        {/* FEATURES */}
        <motion.div
          className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Feature icon={<Building2 className="h-5 w-5 text-orange-400" />} label="Estacionamento" />
          <Feature icon={<Droplets className="h-5 w-5 text-orange-400" />} label="Hidratação" />
          <Feature icon={<Flame className="h-5 w-5 text-orange-400" />} label="Área pós-prova" />
          <Feature icon={<MapPin className="h-5 w-5 text-orange-400" />} label="Ambulância no local" />
        </motion.div>

        {/* GRID DE MÍDIA */}
        <div className="mt-10 grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
          {/* IMAGEM PRINCIPAL */}
          <motion.div
            className="relative flex h-60 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-black p-5 md:h-72"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <img
              src="/images/pag_usuario2.png"
              alt="Titans Race II — Corra, Supere, Vença"
              className="h-full w-full max-w-[240px] object-contain"
            />
          </motion.div>

          {/* MAPA EMBED */}
          <motion.div
            className="relative h-72 overflow-hidden rounded-3xl border border-white/10 shadow-xl"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <iframe
              title="Mapa do Hotel Refazenda, referência para o campo da Titans Race em Alegrete/RS"
              className="h-full w-full grayscale-[0.6] contrast-[1.15] brightness-[0.85]"
              src={EVENT.mapsEmbedUrl}
              allowFullScreen
              loading="lazy"
            ></iframe>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-xs text-zinc-200 backdrop-blur-sm hover:bg-white/5 transition">
      {icon}
      <span>{label}</span>
    </div>
  );
}
