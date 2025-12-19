// src/components/RegistrationSection.tsx
"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Lot = {
  id: string;
  name: string;
  image: string;
  imageAlt?: string;
  note?: string;
};

const lots: Lot[] = [
  {
    id: "lotePromocional",
    name: "Lote Promocional",
    image: "/images/lote-promocional.png",
    imageAlt: "Lote promocional de lançamento – Titans Race",
    note: "Lote de lançamento com vagas limitadas.",
  },
  {
    id: "lote1",
    name: "1º Lote",
    image: "/images/lote1.png",
    imageAlt: "Atletas correndo na Titans Race – 1º Lote",
    note: "Disponível após o encerramento do lote promocional.",
  },
  {
    id: "lote2",
    name: "2º Lote",
    image: "/images/lote2.png",
    imageAlt: "Representação visual do 2º Lote",
    note: "Entra em vigor após encerramento do 1º lote.",
  },
  {
    id: "loteFinal",
    name: "Lote Final",
    image: "/images/lote-final.png",
    imageAlt: "Representação visual do Lote Final",
    note: "Última oportunidade de inscrição.",
  },
];

const PROMO_LIMIT = 150;

// ✅ Abertura: Sexta, 19/12 às 07:00 (America/Sao_Paulo)
// Dica: usar offset -03:00 deixa explícito o fuso
const OPEN_AT_ISO = "2025-12-19T07:00:00-03:00";

// Formata um “restante” simples (hh:mm:ss)
function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, "0");
  return { days, hours: pad(hours), minutes: pad(minutes), seconds: pad(seconds) };
}

export function RegistrationSection() {
  const loteAtivo = lots[0];

  const openAt = useMemo(() => new Date(OPEN_AT_ISO), []);
  const [now, setNow] = useState<Date>(() => new Date());

  // (Opcional) Se você tiver um endpoint real de vagas, dá pra trocar isso por dados do back-end.
  // Por enquanto, exibimos apenas o limite.
  const remainingSpots = PROMO_LIMIT;

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 250);
    return () => clearInterval(t);
  }, []);

  const isOpen = now.getTime() >= openAt.getTime();
  const msLeft = openAt.getTime() - now.getTime();
  const cd = formatCountdown(msLeft);

  // Ajuste para onde você quer levar o usuário quando abrir:
  // - Pode ser "/inscricao"
  // - Ou "#checkout"
  // - Ou "/checkout?lote=lotePromocional"
  const checkoutHref = "/checkout?lote=lotePromocional";

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
          A abertura oficial das inscrições será em{" "}
          <span className="font-semibold text-white">19/12 às 07:00</span>.
          O Lote Promocional tem{" "}
          <span className="font-semibold text-white">{PROMO_LIMIT} vagas</span>.
        </motion.p>

        {/* CTA */}
        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {isOpen ? (
            <a
              href={checkoutHref}
              className="inline-flex items-center rounded-full bg-orange-500 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black shadow-md transition hover:bg-orange-400"
              title="Ir para inscrição"
            >
              Inscreva-se agora
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-white/15 bg-black/40 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-300 opacity-80"
              title="Abertura em 19/12 às 07:00"
            >
              <Lock className="h-3.5 w-3.5" />
              Abre em {cd.days}d {cd.hours}:{cd.minutes}:{cd.seconds}
            </button>
          )}
        </motion.div>

        {/* GRID PRINCIPAL */}
        <div className="mt-14 grid gap-4 md:grid-cols-[1.3fr_1fr]">
          {/* CARD PRINCIPAL – LOTE PROMOCIONAL */}
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
                Lote de lançamento
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[10px] text-zinc-200 backdrop-blur-[1px]">
                <span className="font-semibold">{remainingSpots}</span>
                vagas
                {!isOpen && (
                  <>
                    <span className="opacity-60">•</span>
                    <Lock className="h-3.5 w-3.5 opacity-80" />
                    Em breve
                  </>
                )}
              </span>
            </div>

            <div className="relative z-10 mt-6">
              <p className="heading-adventure text-4xl text-white md:text-5xl">
                {loteAtivo.name}
              </p>

              <p className="mt-4 text-sm text-zinc-200">
                {isOpen ? (
                  <>
                    Inscrições <span className="font-semibold text-white">abertas</span>
                  </>
                ) : (
                  <>
                    Abre em{" "}
                    <span className="font-semibold text-white">
                      {cd.days}d {cd.hours}:{cd.minutes}:{cd.seconds}
                    </span>
                  </>
                )}
              </p>

              {loteAtivo.note && (
                <p className="mt-2 text-[11px] text-zinc-400">{loteAtivo.note}</p>
              )}

              {/* Botão dentro do card */}
              <div className="mt-6">
                {isOpen ? (
                  <a
                    href={checkoutHref}
                    className="inline-flex items-center rounded-full bg-orange-500 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black shadow-md transition hover:bg-orange-400"
                  >
                    Garantir vaga
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-white/15 bg-black/40 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-300 opacity-80"
                    title="Abertura em 19/12 às 07:00"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Inscrições em breve
                  </button>
                )}
              </div>
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
                  className="absolute inset-0 h-full w-full object-cover opacity-45 grayscale"
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

                  <p className="mt-3 text-xs text-zinc-300">Inscrições em breve</p>

                  {lot.note && (
                    <p className="mt-1 text-[11px] text-zinc-400">{lot.note}</p>
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