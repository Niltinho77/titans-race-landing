// src/components/RegistrationSection.tsx
"use client";

import { motion } from "framer-motion";
import { Lock, Flame } from "lucide-react";

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

const SOLD_OUT_LOT_IDS = ["lotePromocional", "lote2", "lote3"];
const OPEN_LOT_ID = "loteFinal";
const OPEN_LOT_NAME = "Último Lote";

function getLotVisualState(lotId: string) {
  if (SOLD_OUT_LOT_IDS.includes(lotId)) return "soldout";
  if (lotId === OPEN_LOT_ID) return "open";
  return "locked";
}

export function RegistrationSection() {
  return (
    <section
      id="lotes"
      className="relative border-t border-white/5 bg-black px-4 py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl">
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
              Último lote aberto
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-zinc-300 md:text-base">
              Os lotes anteriores encerraram. O{" "}
              <span className="font-semibold text-white">{OPEN_LOT_NAME}</span>{" "}
              está aberto. Esta é a última oportunidade de participar desta edição.
              Garanta sua inscrição antes do encerramento.
            </p>
          </div>

        </motion.div>

        

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {lots.map((lot, index) => {
            const state = getLotVisualState(lot.id);
            const isSoldOut = state === "soldout";
            const isOpen = state === "open";

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
                    : isSoldOut
                    ? "border-red-500/30"
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
                        isSoldOut
                          ? "bg-red-500 text-white"
                          : isOpen
                          ? "bg-orange-500 text-black"
                          : "border border-white/15 text-zinc-300"
                      }`}
                    >
                      {isSoldOut
                        ? "Esgotado"
                        : isOpen
                        ? "Aberto agora"
                        : "Bloqueado"}
                    </span>

                    <span
                      className={`text-[10px] uppercase tracking-[0.22em] ${
                        isSoldOut
                          ? "text-red-300"
                          : isOpen
                          ? "text-orange-300"
                          : "text-zinc-500"
                      }`}
                    >
                      {isSoldOut
                        ? "encerrado"
                        : isOpen
                        ? "aberto"
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
                      {isSoldOut ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-red-500/30 px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-red-200">
                          <Lock className="h-4 w-4" />
                          lote esgotado
                        </span>
                      ) : isOpen ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-orange-200">
                          <Flame className="h-4 w-4" />
                          inscrições abertas
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-zinc-300">
                          <Lock className="h-4 w-4" />
                          em breve
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
