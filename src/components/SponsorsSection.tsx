// src/components/SponsorsSection.tsx
"use client";

import { motion } from "framer-motion";

export function SponsorsSection() {
  const slots = Array.from({ length: 8 });

  return (
    <section
      id="patrocinadores"
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
          Patrocinadores & Apoio
        </motion.h2>

        {/* Subtexto */}
        <motion.p
          className="mt-4 max-w-2xl text-sm text-zinc-300 md:text-base"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Área visual para apresentação das cotas de patrocínio e empresas que
          participarão da Titans Race. A versão final exibirá logos oficiais.
        </motion.p>

        {/* Grade Premium */}
        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {slots.map((_, index) => (
            <motion.div
              key={index}
              className="group relative flex h-24 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#060606] via-[#0f0f0f] to-black shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              whileHover={{ scale: 1.03, y: -4 }}
            >
              {/* Glow suave (laranja, identidade do site) */}
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-[1.5px] rounded-2xl bg-gradient-to-br from-orange-500/40 via-transparent to-orange-200/25 blur-lg" />
              </div>

              {/* Fake logo minimalista */}
              <div className="relative z-10 flex flex-col items-center justify-center opacity-70 group-hover:opacity-100 transition">
                <div className="h-6 w-16 rounded-md border border-zinc-600/40 bg-zinc-800/40" />
                <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  Logo
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Linha discreta no final */}
        <div className="mx-auto mt-12 h-px w-full max-w-4xl bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    </section>
  );
}