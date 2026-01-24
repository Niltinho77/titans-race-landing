// src/components/RegistrationSection.tsx
"use client";

import { motion } from "framer-motion";
import { Lock, CheckCircle2, AlarmClock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type LotStatus = "ACTIVE" | "CLOSED" | "LOCKED";

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
    note: "Obrigado a todos que garantiram no lançamento.",
    status: "CLOSED",
    badge: "Encerrado",
  },
  {
    id: "lote1",
    name: "1º Lote",
    image: "/images/lote1.png",
    imageAlt: "Atletas correndo na Titans Race – 1º Lote",
    note: "Inscrições abertas no 1º lote. Garanta sua vaga antes da virada.",
    status: "ACTIVE",
    badge: "Aberto",
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

const ACTIVE_LOT_ID: Lot["id"] = "lote1";

// ✅ 1º Lote aberto ATÉ 06/02 às 23:59:59 (America/Sao_Paulo)
const LOT_ENDS_AT_ISO = "2026-02-06T23:59:59-03:00";

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, "0");
  return { days, hours: pad(hours), minutes: pad(minutes), seconds: pad(seconds) };
}

// ✅ Mensagem dinâmica de escassez
function scarcityCopy(days: number) {
  if (days <= 0) return "ÚLTIMAS HORAS";
  if (days === 1) return "ÚLTIMO DIA";
  if (days <= 3) return "ACABANDO";
  return "TEMPO LIMITADO";
}

export function RegistrationSection() {
  const loteAtivo = lots.find((l) => l.id === ACTIVE_LOT_ID) ?? lots[1];

  const endsAt = useMemo(() => new Date(LOT_ENDS_AT_ISO), []);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 250);
    return () => clearInterval(t);
  }, []);

  const msLeft = endsAt.getTime() - now.getTime();
  const isActiveStillOpen = msLeft > 0;
  const cd = formatCountdown(msLeft);

  const checkoutHref = `/checkout?lote=${ACTIVE_LOT_ID}`;
  const scarcityLabel = scarcityCopy(cd.days);

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
          <span className="font-semibold text-white">encerrado</span>. Agora estamos no{" "}
          <span className="font-semibold text-white">1º Lote</span> — válido até{" "}
          <span className="font-semibold text-white">06/02</span>.
        </motion.p>

        {/* CTA + CONTADOR (MAIS VISÍVEL / ESCASSEZ) */}
        <motion.div
          className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {isActiveStillOpen ? (
            <a
              href={checkoutHref}
              className="inline-flex items-center justify-center rounded-full bg-orange-500 px-6 py-3 text-[12px] font-extrabold uppercase tracking-[0.18em] text-black shadow-[0_18px_45px_rgba(249,115,22,0.25)] transition hover:bg-orange-400"
              title="Ir para inscrição"
            >
              Inscreva-se no 1º lote
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-full border border-white/15 bg-black/40 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-zinc-300 opacity-80"
              title="Prazo do 1º lote encerrado"
            >
              <Lock className="h-4 w-4" />
              1º lote encerrado
            </button>
          )}

          {isActiveStillOpen && (
            <motion.div
              className="relative overflow-hidden rounded-2xl border border-orange-500/35 bg-gradient-to-r from-orange-500/20 via-orange-500/10 to-black/30 px-4 py-3 shadow-[0_22px_70px_rgba(249,115,22,0.18)]"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
            >
              {/* brilho pulsante */}
              <motion.div
                className="pointer-events-none absolute -inset-24 rounded-full bg-orange-500/25 blur-3xl"
                animate={{ opacity: [0.25, 0.55, 0.25] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />

              <div className="relative z-10 flex items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-black">
                  <AlarmClock className="h-3.5 w-3.5" />
                  {scarcityLabel}
                </span>

                <div className="flex flex-col leading-tight">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-100">
                    Tempo restante do 1º lote
                  </span>

                  <span className="mt-1 font-mono text-[20px] font-extrabold text-white md:text-[22px]">
                    {cd.days}d {cd.hours}:{cd.minutes}:{cd.seconds}
                  </span>

                 
                </div>
              </div>
            </motion.div>
          )}
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
                <span className="font-semibold">{isActiveStillOpen ? "Aberto" : "Encerrado"}</span>
              </span>
            </div>

            <div className="relative z-10 mt-6">
              <p className="heading-adventure text-4xl text-white md:text-5xl">
                {loteAtivo.name}
              </p>

              <p className="mt-4 text-sm text-zinc-200">
                {isActiveStillOpen ? (
                  <>
                    Inscrições <span className="font-semibold text-white">abertas</span> agora.
                    <br />
                    <span className="text-zinc-300">
                      Tempo restante:{" "}
                      <span className="font-semibold text-white">
                        {cd.days}d {cd.hours}:{cd.minutes}:{cd.seconds}
                      </span>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-white">Prazo encerrado.</span> Aguarde o lote
                    final.
                  </>
                )}
              </p>

              {loteAtivo.note && (
                <p className="mt-2 text-[11px] text-zinc-400">{loteAtivo.note}</p>
              )}

              <div className="mt-6">
                {isActiveStillOpen ? (
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
                    title="Prazo encerrado"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Lote encerrado
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* COLUNA DIREITA – PROMO (ENCERRADO) + LOTE FINAL (BLOQUEADO) */}
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

                      {isClosed && (
                        <p className="mt-3 text-[11px] text-zinc-500">
                          Agora as inscrições estão no{" "}
                          <span className="text-zinc-200">1º Lote</span>.
                        </p>
                      )}

                      {isLocked && (
                        <p className="mt-3 text-[11px] text-zinc-500">
                          Este será o <span className="text-zinc-200">Lote Final</span> após o prazo
                          do lote atual (06/02).
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
