// src/components/RegistrationSection.tsx
"use client";

import { motion } from "framer-motion";
import { Lock, CheckCircle2 } from "lucide-react";

type LotStatus = "ACTIVE" | "CLOSED" | "LOCKED";

type Lot = {
  id: string;
  name: string;
  image: string;
  imageAlt?: string;
  note?: string;
  status: LotStatus;
  badge?: string; // ex: "Aberto", "Encerrado", "Em breve"
};

const lots: Lot[] = [
  {
    id: "lotePromocional",
    name: "Lote Promocional",
    image: "/images/lote-promocional.png",
    imageAlt: "Lote promocional de lançamento – Titans Race",
    note: "Encerrado. Obrigado a todos que garantiram no lançamento.",
    status: "CLOSED",
    badge: "Encerrado",
  },
  {
    id: "lote1",
    name: "1º Lote",
    image: "/images/lote1.png",
    imageAlt: "Atletas correndo na Titans Race – 1º Lote",
    note: "Inscrições abertas no 1º lote. Garanta sua vaga agora.",
    status: "ACTIVE",
    badge: "Aberto",
  },
  {
    id: "lote2",
    name: "2º Lote",
    image: "/images/lote2.png",
    imageAlt: "Representação visual do 2º Lote",
    note: "Entra em vigor após encerramento do 1º lote.",
    status: "LOCKED",
    badge: "Em breve",
  },
  {
    id: "loteFinal",
    name: "Lote Final",
    image: "/images/lote-final.png",
    imageAlt: "Representação visual do Lote Final",
    note: "Última oportunidade de inscrição.",
    status: "LOCKED",
    badge: "Em breve",
  },
];

// ✅ Agora o lote ativo é o 1º Lote
const ACTIVE_LOT_ID: Lot["id"] = "lote1";

// Ajuste para onde você quer levar o usuário:
// - Pode ser "/inscricao"
// - Ou "#checkout"
// - Ou "/checkout?lote=lote1"
const checkoutHref = `/checkout?lote=${ACTIVE_LOT_ID}`;

export function RegistrationSection() {
  const loteAtivo = lots.find((l) => l.id === ACTIVE_LOT_ID) ?? lots[1];

  return (
    <section
      id="lotes"
      className="relative border-t border-white/5 bg-black px-4 py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl">
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
          O <span className="font-semibold text-white">Lote Promocional</span> foi{" "}
          <span className="font-semibold text-white">encerrado</span>.
          Agora estamos no{" "}
          <span className="font-semibold text-white">1º Lote</span> — inscrições
          abertas.
        </motion.p>

        {/* CTA */}
        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <a
            href={checkoutHref}
            className="inline-flex items-center rounded-full bg-orange-500 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black shadow-md transition hover:bg-orange-400"
            title="Ir para inscrição"
          >
            Inscreva-se no 1º lote
          </a>
        </motion.div>

        {/* GRID PRINCIPAL */}
        <div className="mt-14 grid gap-4 md:grid-cols-[1.3fr_1fr]">
          {/* CARD PRINCIPAL – 1º LOTE (ATIVO) */}
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
              <div className="absolute inset-[1px] rounded-3xl bg-gradient-to-br from-orange-500/35 via-transparent to-orange-200/20 blur-xl" />
            </div>

            <div className="relative z-10 flex items-center justify-between text-[11px] text-zinc-200">
              <span className="text-[10px] uppercase tracking-[0.25em] text-zinc-300">
                Lote atual
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[10px] text-zinc-200 backdrop-blur-[1px]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="font-semibold">Aberto</span>
              </span>
            </div>

            <div className="relative z-10 mt-6">
              <p className="heading-adventure text-4xl text-white md:text-5xl">
                {loteAtivo.name}
              </p>

              <p className="mt-4 text-sm text-zinc-200">
                Inscrições <span className="font-semibold text-white">abertas</span>{" "}
                agora.
              </p>

              {loteAtivo.note && (
                <p className="mt-2 text-[11px] text-zinc-400">{loteAtivo.note}</p>
              )}

              {/* Botão dentro do card */}
              <div className="mt-6">
                <a
                  href={checkoutHref}
                  className="inline-flex items-center rounded-full bg-orange-500 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black shadow-md transition hover:bg-orange-400"
                >
                  Garantir vaga
                </a>
              </div>
            </div>
          </motion.div>

          {/* COLUNA DIREITA – LOTE PROMOCIONAL (ENCERRADO) + PRÓXIMOS (BLOQUEADOS) */}
          <motion.div
            className="flex h-80 flex-col gap-4 md:h-full"
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {lots
              .filter((l) => l.id !== ACTIVE_LOT_ID)
              .map((lot, index) => {
                const isClosed = lot.status === "CLOSED";
                const isLocked = lot.status === "LOCKED";

                return (
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
                      className="absolute inset-0 h-full w-full object-cover opacity-45 grayscale"
                    />
                    <div className="absolute inset-0 bg-black/65" />

                    <div className="relative z-10 flex items-center justify-between text-[11px] text-zinc-300">
                      <span className="text-[10px] uppercase tracking-[0.25em] text-zinc-400">
                        {isClosed ? "Lote anterior" : "Próximo lote"}
                      </span>

                      {isClosed ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400">
                          <Lock className="h-3.5 w-3.5" />
                          Encerrado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500">
                          <Lock className="h-3.5 w-3.5" />
                          Em breve
                        </span>
                      )}
                    </div>

                    <div className="relative z-10 mt-4">
                      <p className="heading-adventure text-2xl text-white md:text-3xl">
                        {lot.name}
                      </p>

                      <p className="mt-3 text-xs text-zinc-300">
                        {isClosed ? "Este lote já encerrou." : "Inscrições em breve."}
                      </p>

                      {lot.note && (
                        <p className="mt-1 text-[11px] text-zinc-400">{lot.note}</p>
                      )}

                      {/* Pequeno detalhe visual para diferenciar fechado x bloqueado */}
                      {isClosed && (
                        <p className="mt-3 text-[11px] text-zinc-500">
                          Você ainda pode garantir no <span className="text-zinc-200">1º Lote</span>.
                        </p>
                      )}

                      {isLocked && (
                        <p className="mt-3 text-[11px] text-zinc-500">
                          Fique ligado: este lote abre após o encerramento do lote atual.
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
