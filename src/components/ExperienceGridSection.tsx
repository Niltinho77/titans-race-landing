// src/components/ExperienceGridSection.tsx
"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type Tile = {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  image: string;
  href?: string;
  className?: string;
};

// =========================================================
// CONFIG DE ABERTURA / BLOQUEIO (MANUAL)
// ---------------------------------------------------------
// 1) Abertura automática:
//    OPEN_AT_ISO define a data/hora que os botões serão liberados automaticamente.
// 2) Bloqueio manual (pra você controlar as 150 vagas):
//    Quando quiser FECHAR tudo (ex: esgotou o lote), troque:
//      MANUAL_BLOCK = false  ->  true
//    Isso bloqueia TODAS as modalidades, mesmo após o horário.
//    (O tile "contato" continua ativo.)
// =========================================================
const OPEN_AT_ISO = "2025-12-19T07:00:00-03:00";
const MANUAL_BLOCK = false; // <-- quando esgotar, mude para true

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    days,
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds),
  };
}

const tilesBase: Tile[] = [
  {
    id: "kids",
    title: "KIDS",
    subtitle: "Aventura em versão segura.",
    location: "Inscrições em breve",
    image: "/images/kids.png",
    href: "/checkout?modality=kids",
    className: "md:col-span-2 md:row-span-2",
  },
  {
    id: "duplas",
    title: "DUPLAS",
    subtitle: "Um puxa o outro.",
    location: "Inscrições em breve",
    image: "/images/duplas.png",
    href: "/checkout?modality=duplas",
    className: "md:col-span-2 md:row-span-1",
  },
  {
    id: "competicao",
    title: "COMPETIÇÃO",
    subtitle: "Para quem quer tempo.",
    location: "Inscrições em breve",
    image: "/images/competicao.png",
    href: "/checkout?modality=competicao",
    className: "md:col-span-1 md:row-span-2",
  },
  {
    id: "diversao",
    title: "DIVERSÃO",
    subtitle: "Lama, risada e histórias.",
    location: "Inscrições em breve",
    image: "/images/diversao.png",
    href: "/checkout?modality=diversao",
    className: "md:col-span-1 md:row-span-2",
  },
  {
    id: "equipes",
    title: "EQUIPES",
    subtitle: "4 pessoas. Um objetivo.",
    location: "Inscrições em breve",
    image: "/images/equipes.png",
    href: "/checkout?modality=equipes",
  },
  {
    id: "contato",
    title: "ENTRAR EM CONTATO",
    subtitle: "Fale com a organização",
    location: "WhatsApp Oficial",
    image: "/images/contato.jpg",
    href: "https://wa.me/5555992234690?text=Olá!%20Tenho%20interesse%20na%20Titans%20Race",
  },
];

export function ExperienceGridSection() {
  const openAt = useMemo(() => new Date(OPEN_AT_ISO), []);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 250);
    return () => clearInterval(t);
  }, []);

  const timeReached = now.getTime() >= openAt.getTime();
  const isOpen = timeReached && !MANUAL_BLOCK;

  const msLeft = openAt.getTime() - now.getTime();
  const cd = formatCountdown(msLeft);

  // Enquanto não abrir: somente "contato" fica ativo.
  // Depois de abrir: todas modalidades ficam ativas, EXCETO se MANUAL_BLOCK = true.
  const isTileEnabled = (tile: Tile) => {
    if (tile.id === "contato") return true;
    return isOpen;
  };

  // Texto do contador (remove "0d" quando days = 0)
  const countdownText =
    cd.days > 0
      ? `${cd.days}d ${cd.hours}:${cd.minutes}:${cd.seconds}`
      : `${cd.hours}:${cd.minutes}:${cd.seconds}`;

  return (
    <section
      id="inscricoes"
      className="relative bg-black px-4 py-10 md:px-0 md:py-0"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 py-4 md:py-10">
        {/* Header */}
        <div className="hidden items-center justify-between text-xs text-slate-300 md:flex">
          <span className="tracking-[0.28em] uppercase text-slate-400">
            modalidades & experiências
          </span>
          <span className="text-slate-500">clique em uma opção para saber mais</span>
        </div>

        {/* GRID */}
        <div className="grid min-h-[80vh] grid-cols-1 gap-4 md:min-h-[100vh] md:grid-cols-4 md:grid-rows-3 md:grid-flow-dense">
          {tilesBase.map((tile, index) => {
            const enabled = isTileEnabled(tile);

            return (
              <motion.div
                key={tile.id}
                className={`
                  group relative flex overflow-hidden rounded-3xl
                  border border-slate-700/60 bg-black/60
                  shadow-[0_18px_50px_rgba(0,0,0,0.9)]
                  ${enabled ? "" : "cursor-not-allowed opacity-90"}
                  ${tile.className ?? ""}
                `}
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.07 }}
                whileHover={
                  enabled
                    ? { scale: 1.03, y: -6, rotateX: 2, rotateY: -2 }
                    : undefined
                }
              >
                {/* Link somente se estiver ativo */}
                {tile.href && enabled && (
                  <a
                    href={tile.href}
                    className="absolute inset-0 z-20"
                    aria-label={tile.title}
                  />
                )}

                {/* Overlay com contador responsivo */}
                {!enabled && tile.id !== "contato" && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4">
                    <div className="w-full max-w-[520px] rounded-3xl border border-orange-500/25 bg-black/40 px-4 py-4 text-center sm:px-6 sm:py-5">
                      <p className="text-[10px] uppercase tracking-[0.28em] text-orange-300/90">
                        abre em
                      </p>

                      {/* Texto do contador adaptável */}
                      <p
                        className={`
                          mt-2 text-white heading-adventure
                          text-2xl sm:text-3xl md:text-4xl
                        `}
                      >
                        <span className="font-mono">{countdownText}</span>
                      </p>

                      <p className="mt-2 text-[11px] text-slate-200/90">
                        Abertura oficial: 19/12 às 07:00
                      </p>

                      {/* Dica visual se estiver bloqueado manualmente */}
                      {MANUAL_BLOCK && timeReached && (
                        <p className="mt-2 text-[11px] text-orange-200/90">
                          Inscrições temporariamente indisponíveis.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Glow */}
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute inset-[1px] rounded-3xl bg-gradient-to-br from-orange-500/45 via-transparent to-yellow-300/25 blur-[6px]" />
                </div>

                {/* Imagem */}
                <div className="absolute inset-0">
                  <div
                    className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundImage: `url(${tile.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/20 transition-colors duration-300" />
                </div>

                {/* Conteúdo */}
                <div className="relative z-10 flex flex-1 flex-col justify-end p-4 sm:p-5">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-orange-400 drop-shadow">
                    {tile.subtitle}
                  </p>
                  <h3 className="mt-1 heading-adventure text-2xl text-slate-50 drop-shadow sm:text-3xl">
                    {tile.title}
                  </h3>

                  <p className="mt-1 text-[11px] text-slate-200/90">
                    {tile.id === "contato"
                      ? tile.location
                      : isOpen
                      ? "Inscrições abertas"
                      : "Abertura oficial em breve"}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}