"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

type Item =
  | { type: "photo"; src: string; alt: string; className: string }
  | { type: "video"; src: string; poster: string; className: string };

const ITEMS: Item[] = [
  { type: "photo", src: "/images/ed2/lama-splash.webp", alt: "Atleta atravessando a lama com respingos", className: "col-span-2 row-span-2" },
  { type: "video", src: "/videos/ed2-pneus.mp4", poster: "/videos/ed2-pneus-poster.jpg", className: "md:row-span-2" },
  { type: "photo", src: "/images/ed2/rede.webp", alt: "Atleta subindo a rede de cordas", className: "" },
  { type: "photo", src: "/images/ed2/high-five.webp", alt: "Atletas se cumprimentando na chegada", className: "" },
  { type: "photo", src: "/images/ed2/chegada.webp", alt: "Atleta comemorando de joelhos na chegada", className: "md:row-span-2" },
  { type: "photo", src: "/images/ed2/grade-dupla.webp", alt: "Dupla atravessando a grade de bambu na lama", className: "md:col-span-2" },
  { type: "video", src: "/videos/ed2-atleta.mp4", poster: "/videos/ed2-atleta-poster.jpg", className: "md:row-span-2" },
  { type: "photo", src: "/images/ed2/pneus-rastejo.webp", alt: "Atleta rastejando sob os pneus", className: "" },
  { type: "photo", src: "/images/ed2/kids-corrida.webp", alt: "Criança correndo ao lado do pai", className: "" },
];

// Vídeo que só baixa e toca quando aparece na tela.
function InViewVideo({ src, poster }: { src: string; poster: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!video.src) video.src = src;
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [src]);

  return (
    <video
      ref={ref}
      className="h-full w-full object-cover"
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
    />
  );
}

export function GallerySection() {
  return (
    <section id="galeria" className="relative bg-[#050505] px-4 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <motion.h2
            className="heading-adventure text-4xl leading-none text-white md:text-6xl"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Quem viveu,
            <br />
            <span className="text-orange-500">nunca esquece.</span>
          </motion.h2>

          <div className="flex gap-8">
            <div>
              <p className="heading-adventure text-4xl text-white md:text-5xl">+400</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Titans em 2 edições</p>
            </div>
            <div>
              <p className="heading-adventure text-4xl text-white md:text-5xl">97%</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">alcance orgânico</p>
            </div>
          </div>
        </div>

        <div className="mt-10 grid auto-rows-[150px] grid-cols-2 gap-2 md:auto-rows-[190px] md:grid-flow-dense md:grid-cols-4 md:gap-3">
          {ITEMS.map((item, index) => (
            <motion.div
              key={item.src}
              className={`relative overflow-hidden rounded-2xl bg-zinc-900 ${item.className}`}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: (index % 4) * 0.05 }}
            >
              {item.type === "photo" ? (
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
              ) : (
                <InViewVideo src={item.src} poster={item.poster} />
              )}
            </motion.div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Fotos e vídeos da 2ª edição · 15/11/2026 ·{" "}
          <a
            href="https://www.instagram.com/titansraceoficial"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-300 underline-offset-4 hover:text-orange-400 hover:underline"
          >
            @titansraceoficial
          </a>
        </p>
      </div>
    </section>
  );
}
