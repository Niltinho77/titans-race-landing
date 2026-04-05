"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const WORDS = ["CORRER", "SUPERAR", "VENCER", "SER UM TITAN"];

const TYPING_SPEED = 90;
const DELETING_SPEED = 55;
const PAUSE_FULL = 1100;

export default function Hero() {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const current = WORDS[index];

    if (!isDeleting && subIndex === current.length) {
      const timeout = setTimeout(() => setIsDeleting(true), PAUSE_FULL);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && subIndex === 0) {
      setIsDeleting(false);
      setIndex((prev) => (prev + 1) % WORDS.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (isDeleting ? -1 : 1));
    }, isDeleting ? DELETING_SPEED : TYPING_SPEED);

    return () => clearTimeout(timeout);
  }, [subIndex, isDeleting, index]);

  useEffect(() => {
    const interval = setInterval(() => setBlink((prev) => !prev), 450);
    return () => clearInterval(interval);
  }, []);

  const currentText = WORDS[index].substring(0, subIndex);

  return (
    <section
      id="inicio"
      className="relative flex min-h-[92vh] items-center overflow-hidden"
    >
      {/* Vídeo de fundo */}
      <video
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        src="/videos/1202.mov"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/95" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,92,12,0.20)_0,_transparent_55%)]" />

      {/* Conteúdo */}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-28 pb-14 md:pt-32 md:pb-16">
        <div className="flex flex-col gap-12 md:flex-row md:items-center">
          {/* Texto principal */}
          <div className="flex-1">
            <motion.p
              className="mb-3 text-[11px] uppercase tracking-[0.32em] text-slate-300"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              2ª edição • a volta dos titans
            </motion.p>

            <motion.h1
              className="heading-adventure text-4xl text-white sm:text-5xl md:text-7xl"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
            >
              TITANS RACE
            </motion.h1>

            {/* Slogan principal */}
            <motion.div
              className="mt-5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <p className="font-titan text-base uppercase tracking-[0.28em] text-orange-500 sm:text-xl md:text-2xl">
                CORRA • SUPERE • VENÇA
              </p>
            </motion.div>

            {/* Texto de impacto */}
            <motion.div
              className="mt-6 max-w-2xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
            >
              <p className="text-sm leading-relaxed text-slate-300 md:text-base">
                A primeira edição marcou o início. A segunda vem para provar que
                a Titans Race não é só uma corrida — é um chamado para quem tem
                coragem de sair da zona de conforto e decidir{" "}
                <span className="ml-1 font-titan text-lg uppercase tracking-[0.14em] text-orange-500 sm:text-2xl">
                  {currentText}
                </span>
                <span
                  className={`ml-1 inline-block h-[1.2em] w-[2px] bg-orange-500 ${
                    blink ? "opacity-100" : "opacity-0"
                  } transition-opacity`}
                />
              </p>
            </motion.div>

            {/* CTA */}
            <motion.div
              className="mt-8 flex flex-col gap-3 sm:flex-row"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
            >
              <a
                href="#inscricoes"
                className="inline-flex items-center justify-center rounded-full bg-orange-500 px-10 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-black shadow-[0_14px_40px_rgba(0,0,0,0.8)] transition hover:bg-orange-400 hover:-translate-y-[1px]"
              >
                Quero viver isso
              </a>

              <a
                href="/regulamento.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-white/30 px-10 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-white/90 transition hover:bg-white/5"
              >
                Ver regulamento
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="mt-8 grid max-w-xl grid-cols-3 gap-4 rounded-2xl border border-white/10 bg-black/60 px-5 py-4 text-[11px] text-slate-200 backdrop-blur-md"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div>
                <p className="text-slate-400">Edição</p>
                <p className="mt-1 text-sm font-semibold text-white">2ª edição</p>
              </div>
              <div>
                <p className="text-slate-400">Essência</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  força e superação
                </p>
              </div>
              <div>
                <p className="text-slate-400">Experiência</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  adrenalina real
                </p>
              </div>
            </motion.div>
          </div>

          {/* Card lateral */}
          <motion.div
            className="flex flex-1 justify-center md:justify-end"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-black/70 p-5 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.85)]">
              <p className="text-[11px] uppercase tracking-[0.22em] text-orange-400">
                mais que uma corrida
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-100">
                A Titans Race retorna maior, mais forte e ainda mais marcante.
                Uma experiência criada para desafiar o corpo, testar a mente e
                entregar ao atleta a sensação de conquista de verdade.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}