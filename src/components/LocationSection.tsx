// src/components/LocationSection.tsx
"use client";

import { motion } from "framer-motion";
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
          A Titans Race acontecerá em uma área campestre de Alegrete/RS,
          com terreno variado, setores de lama, desafios naturais, áreas
          abertas e pontos estratégicos para montagem de obstáculos.
        </motion.p>

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
        <div className="mt-14 grid gap-4 md:grid-cols-[1.3fr_1fr]">
          {/* IMAGEM PRINCIPAL */}
          <motion.div
            className="group relative h-80 overflow-hidden rounded-3xl border border-white/10 md:h-full"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <img
              src="/images/local-1.png"
              alt="Local da prova"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </motion.div>

          {/* MAPA EMBED */}
          <motion.div
            className="relative h-80 overflow-hidden rounded-3xl border border-white/10 shadow-xl md:h-full"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <iframe
              title="Mapa - Alegrete"
              className="h-full w-full grayscale-[0.6] contrast-[1.15] brightness-[0.85]"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3455.51!2d-55.79!3d-29.78!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x946f3abb81000001%3A0x123456789abcdef!2sAlegrete%20RS!5e0!3m2!1spt-BR!2sbr!4v0000000000"
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