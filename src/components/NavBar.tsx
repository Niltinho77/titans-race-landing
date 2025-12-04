// src/components/NavBar.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const links = [
  { href: "#inscricoes", label: "Modalidades" },
  { href: "#local", label: "Local" },
  { href: "#inscricoes", label: "Inscrições" },
  { href: "#patrocinadores", label: "Patrocinadores" },
  { href: "#contato", label: "Contato" },
];

export function NavBar() {
  const [open, setOpen] = useState(false);

  const toggle = () => setOpen((prev) => !prev);
  const close = () => setOpen(false);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* LOGO */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link href="#inicio" className="flex items-center gap-3" onClick={close}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/60 shadow-[0_0_12px_rgba(0,0,0,0.6)]">
              <span className="font-semibold text-xs tracking-wide text-zinc-200">
                TR
              </span>
            </div>

            <span className="heading-adventure text-lg text-white drop-shadow md:text-xl">
              TITANS RACE
            </span>
          </Link>
        </motion.div>

        {/* LINKS DESKTOP */}
        <nav className="hidden items-center gap-6 text-xs font-medium text-zinc-300 md:flex">
          {links.map((link) => (
            <motion.a
              key={link.href}
              href={link.href}
              className="relative uppercase tracking-[0.22em] text-[10px] transition-colors hover:text-orange-400"
              whileHover={{ scale: 1.05 }}
            >
              {link.label}
            </motion.a>
          ))}
        </nav>

        {/* CTA DESKTOP */}
        <motion.a
          href="#inscricoes"
          className="hidden items-center rounded-full bg-orange-500 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black shadow-md transition hover:bg-orange-400 active:scale-95 md:flex"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          Inscreva-se
        </motion.a>

        {/* BOTÃO MOBILE (MENU) */}
        <button
          type="button"
          onClick={toggle}
          className="inline-flex items-center justify-center rounded-full border border-white/15 bg-black/60 p-2 text-zinc-200 shadow-md transition hover:bg-black/80 md:hidden"
          aria-label="Abrir menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* MENU MOBILE */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/10 bg-black/95 md:hidden"
          >
            <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className="rounded-xl px-3 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-100 transition hover:bg-white/5"
                >
                  {link.label}
                </a>
              ))}

              <a
                href="#inscricoes"
                onClick={close}
                className="mt-2 w-full rounded-full bg-orange-500 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-black shadow-md transition hover:bg-orange-400"
              >
                Inscreva-se
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}