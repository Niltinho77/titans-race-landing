// src/components/RegistrationSection.tsx
"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Lock } from "lucide-react";

type LotStatus = "ativo" | "bloqueado";

type Lot = {
  id: string;
  name: string;
  status: LotStatus;
  price: string;
  image: string;
  imageAlt?: string;
  note?: string;
};

const lots: Lot[] = [
  {
    id: "lote1",
    name: "1º Lote",
    status: "ativo",
    price: "R$ 187",
    image: "/images/lote1.png",
    imageAlt: "Atletas correndo na Titans Race – 1º Lote",
    note: "Valor promocional de lançamento",
  },
  {
    id: "lote2",
    name: "2º Lote",
    status: "bloqueado",
    price: "R$ 220",
    image: "/images/lote2.png",
    imageAlt: "Representação visual do 2º Lote",
    note: "Entra em vigor após encerramento do 1º lote",
  },
  {
    id: "loteFinal",
    name: "Lote Final",
    status: "bloqueado",
    price: "R$ 250",
    image: "/images/lote-final.png",
    imageAlt: "Representação visual do Lote Final",
    note: "Última oportunidade de inscrição",
  },
];

const loteAtivo = lots[0];

export function RegistrationSection() {
  return (
    <section
      id="lotes"
      className="relative border-t border-white/5 bg-black px-4 py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl">
        {/* TÍTULO */}
        <motion.h2
          className="heading-adventure text-3xl text-white md:text-5xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Lotes de Inscrição
        </motion.h2>

        <motion.p
          className="mt-4 max-w-2xl text-sm text-zinc-300 md:text-base"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Os valores abaixo representam os lotes de inscrição da Titans Race.
          O valor final é calculado automaticamente no checkout, de acordo com
          o lote vigente no momento da inscrição, independente da modalidade
          escolhida.
        </motion.p>

        {/* CTA simples para iniciar inscrição */}
        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <a
            href="#experiencias"
            className="inline-flex items-center rounded-full bg-orange-500 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black shadow-md transition hover:bg-orange-400"
          >
            Iniciar inscrição
          </a>
        </motion.div>

        {/* GRID PRINCIPAL */}
        <div className="mt-14 grid gap-4 md:grid-cols-[1.3fr_1fr]">
          {/* CARD PRINCIPAL – LOTE ATIVO */}
          <motion.div
            className="group relative flex h-80 flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-black p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9)] md:h-full"
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.02, y: -4 }}
          >
            <img
              src={loteAtivo.image}
              alt={loteAtivo.imageAlt ?? loteAtivo.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60" />

            {/* Glow em hover */}
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="absolute inset-[1px] rounded-3xl bg-gradient-to-br from-orange-500/40 via-transparent to-orange-200/25 blur-xl" />
            </div>

            <div className="relative z-10 flex items-center justify-between text-[11px] text-zinc-200">
              <span className="text-[10px] uppercase tracking-[0.25em] text-zinc-300">
                Lote atual
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-orange-400/40 bg-orange-500/10 px-3 py-1 text-[10px] text-orange-200 backdrop-blur-sm">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Inscrições abertas
              </span>
            </div>

            <div className="relative z-10 mt-6">
              <p className="heading-adventure text-4xl text-white md:text-5xl">
                {loteAtivo.name}
              </p>
              <p className="mt-4 text-sm text-zinc-200">
                A partir de{" "}
                <span className="text-white font-semibold">
                  {loteAtivo.price}
                </span>
              </p>
              {loteAtivo.note && (
                <p className="mt-2 text-[11px] text-zinc-400">
                  {loteAtivo.note}
                </p>
              )}
            </div>
          </motion.div>

          {/* LOTES FUTUROS */}
          <motion.div
            className="flex h-80 flex-col gap-4 md:h-full"
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {lots.slice(1).map((lot, index) => (
              <motion.div
                key={lot.id}
                className="group relative flex flex-1 flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-black p-5 text-sm text-zinc-200"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.15 + index * 0.08 }}
              >
                <img
                  src={lot.image}
                  alt={lot.imageAlt ?? lot.name}
                  className="absolute inset-0 h-full w-full object-cover opacity-40 grayscale"
                />
                <div className="absolute inset-0 bg-black/60" />

                <div className="relative z-10 flex items-center justify-between text-[11px] text-zinc-300">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-zinc-400">
                    Próximo lote
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500">
                    <Lock className="h-3.5 w-3.5" />
                    Em breve
                  </span>
                </div>

                <div className="relative z-10 mt-4">
                  <p className="heading-adventure text-2xl text-white md:text-3xl">
                    {lot.name}
                  </p>
                  <p className="mt-3 text-xs text-zinc-300">
                    Previsto a partir de{" "}
                    <span className="text-zinc-100 font-medium">
                      {lot.price}
                    </span>
                  </p>
                  {lot.note && (
                    <p className="mt-1 text-[11px] text-zinc-400">
                      {lot.note}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}