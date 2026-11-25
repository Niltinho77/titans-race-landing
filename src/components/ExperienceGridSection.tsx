// src/components/ExperienceGridSection.tsx
"use client";

import { usePublicLotStatus as useLotStatus } from "@/hooks/useRegistrationClosed";
import { getStartDayLabel, getTicketPrice } from "@/config/lots";

import { motion } from "framer-motion";
import { MODALITIES } from "@/config/checkout";

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
    subtitle: "Os primeiros passos de um Titan.",
    location: "",
    image: "/images/ed2/kids-mae-filho.webp",
    href: "/checkout?modality=kids",
    className: "md:col-span-2 md:row-span-2",
  },
  {
    id: "duplas",
    title: "DUPLAS",
    subtitle: "Sozinho é difícil. Juntos é impossível parar.",
    location: "",
    image: "/images/ed2/lama-dupla.webp",
    href: "/checkout?modality=duplas",
    className: "md:col-span-2 md:row-span-1",
  },
  {
    id: "competicao",
    title: "SOLO",
    subtitle: "Você contra você. Sem desculpas.",
    location: "",
    image: "/images/ed2/salto-muro.webp",
    href: "/checkout?modality=competicao",
    className: "md:col-span-1 md:row-span-2",
  },
  {
    id: "diversao",
    title: "DIVERSÃO",
    subtitle: "Lama, risada e histórias pra contar.",
    location: "",
    image: "/images/ed2/atleta-vibra.webp",
    href: "/checkout?modality=diversao",
    className: "md:col-span-1 md:row-span-2",
  },
  {
    id: "equipes",
    title: "QUARTETOS",
    subtitle: "4 pessoas. Um desafio. Uma conquista.",
    location: "",
    image: "/images/ed2/quarteto.webp",
    href: "/checkout?modality=equipes",
  },
  {
    id: "contato",
    title: "ENTRAR EM CONTATO",
    subtitle: "Tire suas dúvidas e venha participar",
    location: "WhatsApp Oficial",
    image: "/images/ed2/high-five.webp",
    href: "https://wa.me/5555992234690?text=Olá!%20Gostaria%20de%20mais%20informações",
  },
];

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function getPriceLabel(modalityId: string) {
  if (modalityId === "duplas") return "por dupla";
  if (modalityId === "equipes") return "por quarteto";
  if (modalityId === "kids") return "por criança";
  return "por participante";
}

export function ExperienceGridSection() {
  const { phase, current, next } = useLotStatus();
  const closed = phase !== "open";
  const priceLot = current ?? next;
  const ENABLED_TILES = ["kids", "duplas", "equipes", "competicao", "diversao"];

  const isTileEnabled = (tile: Tile) =>
    (!closed && ENABLED_TILES.includes(tile.id)) || tile.id === "contato";

  return (
    <section
      id="inscricoes"
      className="relative bg-[#050505] px-4 pb-10 pt-16 md:pb-16 md:pt-24"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 py-4 md:py-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-400">Modalidades</p>
            <h2 className="heading-adventure mt-2 text-4xl text-white md:text-6xl">Escolha seu desafio</h2>
          </div>
          <p role="status" className="text-sm text-zinc-400">
            {phase === "ended"
              ? "Inscrições encerradas"
              : phase === "upcoming" && next
              ? `Inscrições abrem em ${getStartDayLabel(next)} · ${next.name}`
              : current?.veteransOnly
              ? `${current.name} até ${current.lastDayLabel} · exclusiva para quem correu a 1ª ou a 2ª edição`
              : `${current?.name} até ${current?.lastDayLabel}${current && !current.includesShirt ? " · sem camiseta" : ""}`}
          </p>
        </div>


        <p className="-mt-1 text-xs text-zinc-500 md:hidden" aria-hidden="true">Deslize para o lado →</p>

        {/* Celular: cartões deslizantes (swipe). Desktop: mosaico. */}
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:min-h-[100vh] md:grid-flow-dense md:grid-cols-4 md:grid-rows-3 md:gap-4 md:overflow-visible md:px-0 md:pb-0">
          {tilesBase.map((tile, index) => {
            const enabled = isTileEnabled(tile);
            const modality = MODALITIES.find((item) => item.id === tile.id);

            return (
              <motion.div
                key={tile.id}
                className={`
                  group relative flex h-[440px] w-[78%] shrink-0 snap-start overflow-hidden rounded-3xl md:h-auto md:w-auto
                  border border-slate-700/60 bg-black/60
                  shadow-[0_18px_50px_rgba(0,0,0,0.9)]
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

                {/* Antes de abrir: selo discreto, sem cobrir a foto */}
                {!enabled && phase === "upcoming" && tile.id !== "contato" && (
                  <span className="absolute right-3 top-3 z-20 rounded-full border border-white/20 bg-black/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur">
                    em breve
                  </span>
                )}

                {/* Overlay para modalidades encerradas */}
                {!enabled && phase !== "upcoming" && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:p-4">
                    <div className="w-full max-w-[92%] rounded-2xl border border-orange-500/25 bg-black/55 px-3 py-3 text-center sm:max-w-[420px] sm:px-5 sm:py-5 md:rounded-3xl">
                      <p className="text-[9px] uppercase tracking-[0.24em] text-orange-300/90 sm:text-[10px]">
                        status
                      </p>

                      <p className="mt-2 heading-adventure text-lg leading-tight text-white xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl">
                        INSCRIÇÕES ENCERRADAS
                      </p>

                      <p className="mx-auto mt-2 max-w-[28ch] text-[10px] leading-relaxed text-slate-200/90 sm:text-[11px] md:text-xs">
                        As inscrições desta modalidade estão encerradas.
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

                    {modality && priceLot && phase !== "ended" && (
                      <p className="mt-3 flex flex-wrap items-baseline gap-x-2 text-white drop-shadow-lg">
                        <span className="text-lg font-black text-orange-400 sm:text-xl">
                          {formatCurrency(getTicketPrice(modality.id, priceLot))}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.14em] text-slate-200">
                          {getPriceLabel(modality.id)}
                        </span>
                        <span className="basis-full text-[10px] text-slate-300/80">+ taxa de serviço</span>
                      </p>
                    )}

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
