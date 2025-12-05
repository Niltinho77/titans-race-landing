// src/components/Hero.tsx
"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const WORDS = ["SUPERAR", "PERSISTIR", "RESISTIR", "SER UM TITÃ"];

const TYPING_SPEED = 90;
const DELETING_SPEED = 55;
const PAUSE_FULL = 1100;

export default function Hero() {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [blink, setBlink] = useState(true);

  // lógica do typewriter só para a PALAVRA final
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

  // cursor piscando
  useEffect(() => {
    const timeout = setInterval(() => setBlink((prev) => !prev), 450);
    return () => clearInterval(timeout);
  }, []);

  const currentText = WORDS[index].substring(0, subIndex);

  return (
    <section
      id="inicio"
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
    >
      {/* VÍDEO DE FUNDO */}
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(248,250,252,0.22)_0,_transparent_55%)]" />

      {/* Conteúdo */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16 md:flex-row md:items-center">
        {/* Bloco de texto principal */}
        <div className="flex-1">
          <motion.p
            className="mb-3 text-[11px] uppercase tracking-[0.3em] text-slate-300"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            CORRIDA DE OBSTÁCULOS
          </motion.p>

          <motion.h1
            className="heading-adventure text-4xl text-slate-50 sm:text-5xl md:text-6xl"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            TITANS RACE
          </motion.h1>

          {/* Frase de efeito + palavra animada */}
          <motion.div
            className="mt-6 space-y-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            {/* Frase de suporte */}
            <p className="max-w-xl text-xs md:text-sm text-slate-300">
              Uma prova com muita lama, desafios e superação. Aqui, cada
              obstáculo é um teste de resistência — você escolhe{" "}
              <span className="font-titan text-lg sm:text-2xl md:text-3xl uppercase text-orange-500 leading-none tracking-[0.12em]">
                  {currentText}
                </span>
                <span
                  className={`mt-[2px] inline-block h-[1em] sm:h-[1.2em] w-[2px] bg-orange-500 ${
                    blink ? "opacity-100" : "opacity-0"
                  } transition-opacity`}
                />
            </p>

            {/* Bloco com a palavra de impacto bem destacada */}
              

              
           
          </motion.div>

          {/* CTA */}
          <motion.div
            className="mt-8 flex flex-col gap-3 sm:flex-row"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
          >
            <a
              href="#inscricoes"
              className="inline-flex items-center justify-center rounded-full bg-orange-500 px-10 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-950 shadow-[0_14px_40px_rgba(0,0,0,0.75)] hover:bg-orange-400 hover:translate-y-[1px] transition"
            >
              Vou encarar
            </a>
            <a
              href="/docs/regulamento.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-slate-300/40 px-10 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-50/90 hover:bg-slate-50/5 transition"
            >
              Ver regulamento
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="mt-8 grid max-w-xl grid-cols-3 gap-4 rounded-2xl bg-black/55 px-5 py-4 text-[11px] text-slate-200 backdrop-blur-md border border-slate-700/60"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div>
              <p className="text-slate-400">Distância</p>
              <p className="mt-1 text-sm font-semibold text-slate-50">6 km</p>
            </div>
            <div>
              <p className="text-slate-400">Obstáculos</p>
              <p className="mt-1 text-sm font-semibold text-slate-50">
                +25 desafios
              </p>
            </div>
            <div>
              <p className="text-slate-400">Modalidade</p>
              <p className="mt-1 text-sm font-semibold text-slate-50">
                Solo & Duplas
              </p>
            </div>
          </motion.div>
        </div>

        {/* Mini-card lateral */}
        <motion.div
          className="mt-8 flex flex-1 items-end justify-center md:mt-0 md:justify-end"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
        >
          <div className="w-full max-w-sm rounded-3xl border border-slate-700/70 bg-black/70 p-4 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
            <p className="text-[11px] uppercase tracking-[0.22em] text-orange-400">
              edição de estreia
            </p>
            <p className="mt-2 text-sm text-slate-100">
              Vagas limitadas para a primeira edição da Titans Race em Alegrete.
              Uma experiência intensa, desafiadora e fora da rotina.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
