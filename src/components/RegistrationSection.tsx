// src/components/RegistrationSection.tsx
"use client";

import { motion } from "framer-motion";
import { Lock, AlarmClock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type LotStatus = "ACTIVE" | "CLOSED";

type Lot = {
  id: string;
  name: string;
  image: string;
  imageAlt?: string;
  note?: string;
  status: LotStatus;
  badge?: string;
};

const lots: Lot[] = [
  {
    id: "lotePromocional",
    name: "Lote Promocional",
    image: "/images/lote2.png",
    imageAlt: "Lote promocional de lançamento – Titans Race",
    note: "Encerrado no lançamento.",
    status: "CLOSED",
    badge: "Encerrado",
  },
  {
    id: "lote1",
    name: "1º Lote",
    image: "/images/lote1.png",
    imageAlt: "1º Lote – Titans Race",
    note: "Inscrições encerradas.",
    status: "CLOSED",
    badge: "Encerrado",
  },
  {
    id: "loteFinal",
    name: "Lote Final",
    image: "/images/lote-final.png",
    imageAlt: "Lote Final – Últimas vagas Titans Race",
    note: "Última oportunidade de inscrição.",
    status: "ACTIVE",
    badge: "Último lote",
  },
];

const ACTIVE_LOT_ID: Lot["id"] = "loteFinal";
const LOT_ENDS_AT_ISO = "2026-03-06T23:59:59-03:00";
const TOTAL_VAGAS = 200;

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, "0");
  return { days, hours: pad(hours), minutes: pad(minutes), seconds: pad(seconds) };
}

function scarcityCopy(days: number) {
  if (days <= 0) return "ENCERRANDO";
  if (days === 1) return "ÚLTIMO DIA";
  if (days <= 3) return "ÚLTIMAS VAGAS";
  return "LOTE FINAL";
}

export function RegistrationSection() {
  const loteAtivo = lots.find((l) => l.id === ACTIVE_LOT_ID)!;

  const endsAt = useMemo(() => new Date(LOT_ENDS_AT_ISO), []);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const msLeft = endsAt.getTime() - now.getTime();
  const isOpen = msLeft > 0;
  const cd = formatCountdown(msLeft);
  const scarcityLabel = scarcityCopy(cd.days);

  const checkoutHref = `/checkout?lote=${ACTIVE_LOT_ID}`;

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
        >
          Último Lote de Inscrições
        </motion.h2>

        <motion.p
          className="mt-4 max-w-2xl text-sm text-zinc-300 md:text-base"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          As inscrições estão no{" "}
          <span className="font-semibold text-white">Lote Final</span>, com{" "}
          <span className="font-semibold text-white">{TOTAL_VAGAS} vagas totais</span>.
          <br />
          Após o encerramento, as inscrições serão definitivamente fechadas.
        </motion.p>

        {/* CTA + CONTADOR */}
        {isOpen && (
          <motion.div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <a
              href={checkoutHref}
              className="inline-flex items-center justify-center rounded-full bg-orange-500 px-6 py-3 text-[12px] font-extrabold uppercase tracking-[0.18em] text-black shadow-[0_18px_45px_rgba(249,115,22,0.25)] transition hover:bg-orange-400"
            >
              Garantir vaga no lote final
            </a>

            <div className="relative overflow-hidden rounded-2xl border border-orange-500/35 bg-gradient-to-r from-orange-500/20 via-orange-500/10 to-black/30 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-black">
                  <AlarmClock className="h-3.5 w-3.5" />
                  {scarcityLabel}
                </span>

                <span className="font-mono text-[18px] font-extrabold text-white">
                  {cd.days}d {cd.hours}:{cd.minutes}:{cd.seconds}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* CARD PRINCIPAL */}
        <div className="mt-14">
          <motion.div
            className="relative flex h-96 flex-col justify-between overflow-hidden rounded-3xl border border-orange-500/30 bg-black p-6"
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <img
              src={loteAtivo.image}
              alt={loteAtivo.imageAlt}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/65" />

            <div className="relative z-10 flex items-center justify-between text-[11px] text-zinc-200">
              <span className="uppercase tracking-[0.25em] text-orange-400">
                Lote Final
              </span>

              <span className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-bold text-black">
                {TOTAL_VAGAS} vagas totais
              </span>
            </div>

            <div className="relative z-10 mt-10">
              <p className="heading-adventure text-5xl text-white">
                {loteAtivo.name}
              </p>

              <p className="mt-4 max-w-md text-sm text-zinc-200">
                Esta é a <strong>última oportunidade</strong> para participar da
                Titans Race. As vagas são limitadas e não haverá reabertura.
              </p>

              <div className="mt-8">
                {isOpen ? (
                  <a
                    href={checkoutHref}
                    className="inline-flex items-center rounded-full bg-orange-500 px-6 py-3 text-[12px] font-extrabold uppercase tracking-[0.18em] text-black hover:bg-orange-400"
                  >
                    Inscrever-se agora
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-[12px] text-zinc-400">
                    <Lock className="h-4 w-4" />
                    Inscrições encerradas
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}