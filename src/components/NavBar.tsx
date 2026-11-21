"use client";

import { usePublicLotStatus as useLotStatus } from "@/hooks/useRegistrationClosed";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";

type NavItem = {
  href: string;
  label: string;
};

export function NavBar() {
  const { phase } = useLotStatus();
  const ctaLabel = phase === "open" ? "Inscreva-se" : phase === "upcoming" ? "Ver lotes" : "Inscrições encerradas";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const onHome = pathname === "/";
  const H = (hash: string) => (onHome ? hash : `/${hash}`);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links: NavItem[] = [
    { href: H("#inscricoes"), label: "Modalidades" },
    { href: H("#lotes"), label: "Lotes" },
    { href: H("#galeria"), label: "2ª edição" },
    { href: H("#local"), label: "Local" },
    { href: H("#contato"), label: "Contato" },
    { href: "/patrocinadores", label: "Patrocine" },
    { href: "/portal/login", label: "Portal do atleta" },
  ];

  const ctaHref = H(phase === "open" ? "#inscricoes" : "#lotes");
  const close = () => setOpen(false);

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 pt-[env(safe-area-inset-top)] transition-colors duration-300 ${
        scrolled || open || !onHome
          ? "border-b border-white/5 bg-black/85 backdrop-blur-xl"
          : "bg-gradient-to-b from-black/70 to-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href={H("#inicio")} className="flex items-center gap-2" onClick={close}>
          <span className="heading-adventure text-xl text-white md:text-2xl">
            TITANS <span className="text-orange-500">RACE</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Principal">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-[11px] font-medium uppercase tracking-[0.18em] transition-colors hover:text-orange-400 ${
                pathname === link.href ? "text-orange-400" : "text-zinc-300"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={ctaHref}
            onClick={close}
            className="hidden rounded-full bg-orange-500 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-black transition hover:bg-orange-400 sm:inline-flex"
          >
            {ctaLabel}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-zinc-100 transition hover:bg-white/10 lg:hidden"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/10 bg-black lg:hidden"
            aria-label="Menu"
          >
            <div className="mx-auto flex max-w-6xl flex-col px-4 py-3">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className="border-b border-white/5 px-1 py-4 text-sm font-medium uppercase tracking-[0.14em] text-zinc-100 last:border-0 hover:text-orange-400"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={ctaHref}
                onClick={close}
                className="mt-3 rounded-full bg-orange-500 px-4 py-3.5 text-center text-xs font-bold uppercase tracking-[0.16em] text-black"
              >
                {ctaLabel}
              </Link>
              <InstallAppButton className="mt-3" />
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
