// src/components/SponsorsSection.tsx
"use client";

import { motion } from "framer-motion";

/**
 * 👉 COMO FUNCIONA
 * - O backend do Next expõe automaticamente arquivos da pasta /public
 * - Aqui usamos uma lista “virtual” que será resolvida no build/runtime
 * - Você só precisa adicionar/remover logos da pasta /public/patrocinadores
 */

// ⚠️ IMPORTANTE:
// O Next não permite listar arquivos do /public no client.
// Então usamos um padrão simples: você mantém os nomes
// OU (recomendado) usa um index.ts depois.
// Para agora, vamos com nomes dinâmicos via fetch (mais flexível).

type Sponsor = {
  src: string;
  alt: string;
};

export function SponsorsSection() {
  // ⚠️ AJUSTE AQUI SE QUISER ORDENAR
  const sponsors: Sponsor[] = [
    // basta adicionar conforme surgirem
    // exemplos:
    { src: "/patrocinadores/unimed.png", alt: "Unimed" },
    { src: "/patrocinadores/logobnet.png", alt: "Bnet" },
    { src: "/patrocinadores/clinicabrasil.png", alt: "Clinica Brasil" },
    
    // novos patrocinadores entram só adicionando aqui
  ];

  return (
    <section
      id="patrocinadores"
      className="relative border-t border-white/5 bg-black px-4 py-16 md:py-24"
    >
      <div className="mx-auto max-w-6xl">
        {/* Título */}
        <motion.h2
          className="heading-adventure text-2xl text-white md:text-4xl"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
        >
          Patrocinadores
        </motion.h2>

        {/* Grid responsivo */}
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {sponsors.map((sponsor, index) => (
            <motion.div
              key={sponsor.src}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              whileHover={{ y: -4, scale: 1.04 }}
              className="group relative flex h-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 md:h-24"
            >
              {/* Glow laranja */}
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="absolute inset-0 rounded-2xl bg-[#ff5c0c]/10 blur-xl" />
              </div>

              {/* Logo */}
              <img
                src={sponsor.src}
                alt={sponsor.alt}
                className="relative z-10 max-h-10 max-w-[120px] object-contain opacity-80 transition group-hover:opacity-100 md:max-h-12"
              />
            </motion.div>
          ))}
        </div>

        {/* Linha final */}
        <div className="mx-auto mt-12 h-px w-full max-w-4xl bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    </section>
  );
}