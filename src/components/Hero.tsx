"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const phrases = [
  "Supere seus limites.",
  "Enfrente os obstáculos.",
  "Entre para a elite.",
  "Titans Race está chegando.",
];

export default function Hero() {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const phrase = phrases[currentPhraseIndex];
    const typingSpeed = isDeleting ? 40 : 90;
    const pauseAtEnd = 1400;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < phrase.length) {
          setDisplayText(phrase.slice(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), pauseAtEnd);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(phrase.slice(0, displayText.length - 1));
        } else {
          setIsDeleting(false);
          setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentPhraseIndex]);

  return (
    <section
      id="inicio"
      className="relative flex min-h-[100vh] items-center overflow-hidden bg-black pt-16"
    >
      {/* Imagem de fundo (troca a URL depois por uma foto real) */}
      <div
        className="absolute inset-0 bg-[url('/titans-hero.jpg')] bg-cover bg-center"
        aria-hidden="true"
      />
      {/* Overlays de cor */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-[#12041F]/90 to-black" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-[#361259]/60" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-12 md:flex-row md:items-center">
        {/* Texto */}
        <div className="flex-1">
          <motion.p
            className="mb-3 text-[11px] uppercase tracking-[0.3em] text-zinc-300"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            ALEGRETE · CORRIDA DE OBSTÁCULOS
          </motion.p>

          <motion.h1
            className="font-giz text-4xl leading-tight text-white sm:text-5xl md:text-6xl"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            TITANS RACE
          </motion.h1>

          <motion.p
            className="mt-4 max-w-xl text-sm text-zinc-200 md:text-base"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
          >
            Uma experiência imersiva inspirada em provas militares: lama, fogo,
            carga, equipe e superação real. A primeira edição em Alegrete está
            pronta para selecionar os verdadeiros Titãs.
          </motion.p>

          {/* linha digitando */}
          <motion.div
            className="mt-6 flex h-10 items-center text-lg font-semibold text-[#F5E04E] sm:text-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <span>{displayText}</span>
            <span className="ml-1 h-6 w-[2px] animate-pulse bg-[#F5E04E]" />
          </motion.div>

          {/* CTAs */}
          <motion.div
            className="mt-8 flex flex-col gap-3 sm:flex-row"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <a
              href="#inscricoes"
              className="inline-flex items-center justify-center rounded-full bg-[#F5E04E] px-9 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black shadow-lg shadow-[#F5E04E]/40 hover:translate-y-[1px] hover:bg-[#ffe765] transition"
            >
              Inscreva-se agora
            </a>
            <a
              href="#sobre"
              className="inline-flex items-center justify-center rounded-full border border-white/25 px-9 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-100 hover:bg-white/5 transition"
            >
              Conheça a experiência
            </a>
          </motion.div>

          {/* barra de stats em uma faixa, tipo Bravus */}
          <motion.div
            className="mt-8 rounded-full border border-white/15 bg-black/50 px-6 py-3 text-[11px] text-zinc-200 backdrop-blur"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            <div className="grid grid-cols-3 gap-4 text-center sm:text-left">
              <div>
                <p className="text-zinc-400">Distância</p>
                <p className="text-sm font-semibold text-white">+/- 6 KM</p>
              </div>
              <div>
                <p className="text-zinc-400">Obstáculos</p>
                <p className="text-sm font-semibold text-white">+ 15 DESAFIOS</p>
              </div>
              <div>
                <p className="text-zinc-400">Modalidade</p>
                <p className="text-sm font-semibold text-white">
                  EQUIPE & SOLO
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* bloco “vídeo” menor, só para dar equilíbrio visual */}
        <motion.div
          className="flex flex-1 items-end justify-center md:justify-end"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          <div className="relative h-56 w-full max-w-sm overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-[#361259] via-black to-black shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25)_0,_transparent_55%)] opacity-35" />
            <div className="relative z-10 flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur">
                <div className="ml-1 h-0 w-0 border-y-[8px] border-l-[14px] border-y-transparent border-l-white" />
              </div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-200">
                Vídeo oficial em breve
              </p>
              <p className="text-[11px] text-zinc-400">
                Espaço reservado para o vídeo conceito da Titans Race que será
                usado na apresentação final.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
