// src/components/ExperienceGridSection.tsx
"use client";

import { motion } from "framer-motion";
import { tr } from "framer-motion/client";

type Tile = {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  image: string;
  href?: string;
  disabled?: boolean;
  className?: string;
};


  // =========================================================
  // COMO DEIXAR TODOS OS BOTÕES ATIVOS RAPIDAMENTE:
  // - Para abrir inscrições: coloque `disabled: false` e defina `href`
  // - Para fechar inscrições: coloque `disabled: true` e remova/ignore `href`
  // =========================================================
const tiles: Tile[] = [
  {
    id: "kids",
    title: "KIDS",
    subtitle: "Aventura em versão segura.",
    location: "Inscrições em breve",
    image: "/images/kids.png",
    disabled: true,
    //href: "/checkout?modality=kids",
    className: "md:col-span-2 md:row-span-2",
  },
  {
    id: "duplas",
    title: "DUPLAS",
    subtitle: "Um puxa o outro.",
    location: "Inscrições em breve",
    image: "/images/duplas.png",
    disabled: true,
    //href: "/checkout?modality=duplas",
    className: "md:col-span-2 md:row-span-1",
  },
  {
    id: "competicao",
    title: "COMPETIÇÃO",
    subtitle: "Para quem quer tempo.",
    location: "Inscrições em breve",
    image: "/images/competicao.png",
    disabled: true,
    //href: "/checkout?modality=competicao",
    className: "md:col-span-1 md:row-span-2",
  },
  {
    id: "diversao",
    title: "DIVERSÃO",
    subtitle: "Lama, risada e histórias.",
    location: "Inscrições em breve",
    image: "/images/diversao.png",
    disabled: true,
    //href: "/checkout?modality=diversao",
    className: "md:col-span-1 md:row-span-2",
  },
  {
    id: "equipes",
    title: "EQUIPES",
    subtitle: "4 pessoas. Um objetivo.",
    location: "Inscrições abertas",
    image: "/images/equipes.png",
    disabled: false,  
    href: "/checkout?modality=equipes",

  },
  {
    id: "contato",
    title: "ENTRAR EM CONTATO",
    subtitle: "Fale com a organização",
    location: "WhatsApp Oficial",
    image: "/images/contato.jpg",
    disabled: false,
    href: "https://wa.me/5555992234690?text=Olá!%20Tenho%20interesse%20na%20Titans%20Race",
  },
];

 

export function ExperienceGridSection() {
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
            clique em uma opção para saber mais
          </span>
        </div>

        {/* GRID */}
        <div className="grid min-h-[80vh] grid-cols-1 gap-4 md:min-h-[100vh] md:grid-cols-4 md:grid-rows-3 md:grid-flow-dense">
          {tiles.map((tile, index) => (
            <motion.div
              key={tile.id}
              className={`
                group relative flex overflow-hidden rounded-3xl
                border border-slate-700/60 bg-black/60
                shadow-[0_18px_50px_rgba(0,0,0,0.9)]
                ${tile.disabled ? "cursor-not-allowed opacity-80" : ""}
                ${tile.className ?? ""}
              `}
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.07 }}
              whileHover={
                tile.disabled
                  ? undefined
                  : {
                      scale: 1.03,
                      y: -6,
                      rotateX: 2,
                      rotateY: -2,
                    }
              }
            >
              {/* Link somente se estiver ativo */}
              {tile.href && !tile.disabled && (
                <a
                  href={tile.href}
                  className="absolute inset-0 z-20"
                  aria-label={tile.title}
                />
              )}

              {/* Overlay “Inscrições em breve” */}
              {tile.disabled && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                  <span className="rounded-full border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-orange-400">
                    Inscrições em breve
                  </span>
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
                  {tile.location}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
