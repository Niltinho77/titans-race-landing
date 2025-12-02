"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const phrases = [
  "Supere seus limites.",
  "Entre para a elite.",
  "Enfrente os obstáculos.",
  "Titans Race está chegando.",
];

export default function Hero() {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const phrase = phrases[currentPhraseIndex];

    const typingSpeed = isDeleting ? 40 : 90;
    const pauseAtEnd = 1500;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        // digitando
        if (displayText.length < phrase.length) {
          setDisplayText(phrase.slice(0, displayText.length + 1));
        } else {
          // pausa antes de apagar
          setTimeout(() => setIsDeleting(true), pauseAtEnd);
        }
      } else {
        // apagando
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
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-titans-gradient"
    >
      {/* Overlay roxo escuro */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-titans-primary/70 to-black/95" />

      {/* Conteúdo */}
      <div className="relative z-10 max-w-5xl px-4 text-center">
        <motion.h1
          className="font-giz text-4xl sm:text-5xl md:text-6xl tracking-wide text-titans-text mb-6"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          TITANS RACE
        </motion.h1>

        <motion.p
          className="text-sm sm:text-base uppercase tracking-[0.25em] text-titans-accent mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          ALEGRETE · CORRIDA DE OBSTÁCULOS
        </motion.p>

        {/* Linha com animação de digitação */}
        <motion.div
          className="text-lg sm:text-2xl md:text-3xl font-semibold h-10 sm:h-12 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <span>{displayText}</span>
          <span className="ml-1 w-[2px] h-6 sm:h-7 bg-titans-accent animate-pulse" />
        </motion.div>

        {/* Botões */}
        <motion.div
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.7 }}
        >
          <a
            href="#inscricoes"
            className="px-8 py-3 rounded-full bg-titans-accent text-black font-semibold uppercase text-sm tracking-wide shadow-lg hover:scale-[1.02] hover:shadow-titans-accent/50 transition-transform"
          >
            Inscreva-se
          </a>

          <a
            href="#regulamento"
            className="px-8 py-3 rounded-full border border-titans-text/40 text-titans-text font-medium uppercase text-xs sm:text-sm tracking-wide hover:bg-white/5 transition-colors"
          >
            Ver regulamento
          </a>
        </motion.div>
      </div>

      {/* “ruído” escuro no fundo */}
      <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-soft-light bg-[radial-gradient(circle_at_0_0,rgba(255,255,255,0.2)_0,transparent_70%),radial-gradient(circle_at_100%_100%,rgba(255,255,255,0.15)_0,transparent_70%)]" />
    </section>
  );
}