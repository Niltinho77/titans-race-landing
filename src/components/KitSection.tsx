"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { GlassWater, Gift, Hash, Medal, Shirt } from "lucide-react";

const ITEMS = [
  { icon: Medal, title: "Medalha finisher", detail: "Para quem cruzar a linha de chegada" },
  { icon: Shirt, title: "Camiseta oficial", detail: "Inscrições até 14/02" },
  { icon: Hash, title: "Número de peito", detail: "Sua identificação na prova" },
  { icon: Gift, title: "Itens dos patrocinadores", detail: "Brindes das marcas parceiras" },
  { icon: GlassWater, title: "Água e fruta", detail: "No pós-prova" },
];

export function KitSection() {
  return (
    <section id="kit" className="relative bg-[#050505] px-4 py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[1fr_1.1fr] md:gap-12">
        <motion.div
          className="relative aspect-[4/3] overflow-hidden rounded-3xl md:aspect-[4/5]"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Image
            src="/images/ed2/medalhas.webp"
            alt="Atletas mostrando a medalha finisher da 2ª edição"
            fill
            sizes="(max-width: 768px) 100vw, 45vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        </motion.div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-400">Kit do atleta</p>
          <h2 className="heading-adventure mt-2 text-4xl leading-none text-white md:text-6xl">
            O que você <span className="text-orange-500">leva pra casa</span>
          </h2>

          <ul className="mt-8 grid grid-cols-2 gap-3">
            {ITEMS.map(({ icon: Icon, title, detail }, index) => (
              <motion.li
                key={title}
                className={`rounded-2xl border border-white/10 bg-white/[0.03] p-4 ${index === 0 ? "col-span-2 flex items-center gap-4" : ""}`}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <span
                  className={`flex shrink-0 items-center justify-center rounded-full ${
                    index === 0 ? "h-14 w-14 bg-orange-500 text-black" : "mb-3 h-10 w-10 bg-orange-500/15 text-orange-400"
                  }`}
                >
                  <Icon className={index === 0 ? "h-7 w-7" : "h-5 w-5"} aria-hidden="true" />
                </span>
                <span className="block">
                  <span className={`block font-bold text-white ${index === 0 ? "text-lg" : "text-sm"}`}>{title}</span>
                  <span className="block text-xs text-zinc-400">{detail}</span>
                </span>
              </motion.li>
            ))}
          </ul>

          <p className="mt-4 text-xs text-zinc-500">
            No Lote Extra (a partir de 15/02) a inscrição não inclui camiseta.
          </p>
        </div>
      </div>
    </section>
  );
}
