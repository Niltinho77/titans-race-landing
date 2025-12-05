// src/components/Footer.tsx
"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black px-4 py-8 text-[12px] text-zinc-500">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        
        {/* Marca / Local */}
        <span className="text-center sm:text-left text-zinc-400">
          © {new Date().getFullYear()} Titans Race · Alegrete/RS  
        </span>

        {/* Navegação do Footer */}
        <div className="flex items-center gap-6 text-zinc-400">
          <Link
            href="/regulamento"
            className="transition-colors hover:text-[#F5E04E]"
          >
            Regulamento Oficial
          </Link>

          <span className="hidden sm:block text-zinc-600">|</span>

          <Link
            href="/politica-de-privacidade"
            className="transition-colors hover:text-[#F5E04E]"
          >
            Política de Privacidade
          </Link>
        </div>
      </div>

      {/* Linha inferior opcional */}
      <div className="mt-4 text-center text-[11px] text-zinc-600">
        Evento oficial Titans Race · Corrida com obstáculos · Superação e Aventura
      </div>
    </footer>
  );
}