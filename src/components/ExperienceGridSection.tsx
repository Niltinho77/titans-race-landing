// src/components/ExperienceGridSection.tsx
"use client";

import { motion } from "framer-motion";

type Tile = {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  image: string;
  href?: string;
  className?: string;
};

const tilesBase: Tile[] = [
  {
    id: "kids",
    title: "KIDS",
    subtitle: "Os primeiros passos de um Titã.",
    location: "Abertura em breve",
    image: "/images/kids.jpg",
    href: "/checkout?modality=kids",
    className: "md:col-span-2 md:row-span-2",
  },
  {
    id: "duplas",
    title: "DUPLAS",
    subtitle: "Sozinho é difícil. Juntos é impossível parar.",
    location: "Abertura em breve",
    image: "/images/duplas.jpg",
    href: "/checkout?modality=duplas",
    className: "md:col-span-2 md:row-span-1",
  },
  {
    id: "competicao",
    title: "SOLO",
    subtitle: "Você contra você. Sem desculpas.",
    location: "Abertura em breve",
    image: "/images/competicao.jpg",
    href: "/checkout?modality=competicao",
    className: "md:col-span-1 md:row-span-2",
  },
  {
    id: "diversao",
    title: "DIVERSÃO",
    subtitle: "Lama, risada e histórias pra contar.",
    location: "Abertura em breve",
    image: "/images/diversao.jpg",
    href: "/checkout?modality=diversao",
    className: "md:col-span-1 md:row-span-2",
  },
  {
    id: "equipes",
    title: "QUARTETOS",
    subtitle: "4 pessoas. Um desafio. Uma conquista.",
    location: "Abertura em breve",
    image: "/images/equipes.jpg",
    href: "/checkout?modality=equipes",
  },
  {
    id: "contato",
    title: "ENTRAR EM CONTATO",
    subtitle: "Garanta prioridade na abertura",
    location: "WhatsApp Oficial",
    image: "/images/contato.jpg",
    href: "https://wa.me/5555992234690?text=Olá!%20Quero%20ser%20avisado%20quando%20abrirem%20as%20inscrições%20da%20Titans%20Race",
  },
];

export function ExperienceGridSection() {
  const ENABLED_TILES = ["kids"]; // 👈 escolhe qual liberar

const isTileEnabled = (tile: Tile) =>
  ENABLED_TILES.includes(tile.id) || tile.id === "contato";

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
          <span className="text-slate-500">
            prepare-se • inscrições em breve
          </span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-4 md:min-h-[100vh] md:grid-cols-4 md:grid-rows-3 md:grid-flow-dense">
          {tilesBase.map((tile, index) => {
            const enabled = isTileEnabled(tile);

            return (
              <motion.div
                key={tile.id}
                className={`
                  group relative flex min-h-[260px] overflow-hidden rounded-2xl
                  border border-slate-700/60 bg-black/60
                  shadow-[0_18px_50px_rgba(0,0,0,0.9)]
                  sm:min-h-[300px]
                  md:min-h-0 md:rounded-3xl
                  ${enabled ? "" : "cursor-not-allowed opacity-95"}
                  ${tile.className ?? ""}
                `}
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: index * 0.07 }}
                whileHover={
                  enabled
                    ? { scale: 1.02, y: -4, rotateX: 1, rotateY: -1 }
                    : undefined
                }
              >
                {/* Link apenas para contato */}
                {tile.href && enabled && (
                  <a
                    href={tile.href}
                    className="absolute inset-0 z-20"
                    aria-label={tile.title}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                )}

                {/* Overlay para modalidades ainda fechadas */}
                {!enabled && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:p-4">
                    <div className="w-full max-w-[92%] rounded-2xl border border-orange-500/25 bg-black/55 px-3 py-3 text-center sm:max-w-[420px] sm:px-5 sm:py-5 md:rounded-3xl">
                      <p className="text-[9px] uppercase tracking-[0.24em] text-orange-300/90 sm:text-[10px]">
                        status
                      </p>

                      <p className="mt-2 heading-adventure text-lg leading-tight text-white xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl">
                        INSCRIÇÕES EM BREVE
                      </p>

                      <p className="mx-auto mt-2 max-w-[28ch] text-[10px] leading-relaxed text-slate-200/90 sm:text-[11px] md:text-xs">
                        A próxima chance de viver a Titans Race começa em breve.
                      </p>
                    </div>
                  </div>
                )}

                {/* Glow */}
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute inset-[1px] rounded-2xl bg-gradient-to-br from-orange-500/45 via-transparent to-yellow-300/25 blur-[6px] md:rounded-3xl" />
                </div>

                {/* Imagem */}
                <div className="absolute inset-0">
                  <div
                    className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105 md:group-hover:scale-110"
                    style={{ backgroundImage: `url(${tile.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/20 transition-colors duration-300" />
                </div>

                {/* Conteúdo */}
                <div className="relative z-10 flex flex-1 flex-col justify-end p-4 sm:p-5 md:p-6">
                  <div className="max-w-[85%] sm:max-w-[80%] md:max-w-[75%]">
                    <p className="text-[9px] uppercase tracking-[0.22em] text-orange-400 drop-shadow sm:text-[10px] sm:tracking-[0.26em]">
                      {tile.subtitle}
                    </p>

                    <h3 className="mt-1 heading-adventure text-xl leading-none text-slate-50 drop-shadow sm:text-2xl md:text-3xl">
                      {tile.title}
                    </h3>

                    <p className="mt-2 text-[10px] leading-relaxed text-slate-200/90 sm:text-[11px] md:text-xs">
                      {tile.location}
                    </p>
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