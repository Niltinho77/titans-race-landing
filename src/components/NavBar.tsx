"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  kind: "hash" | "page";
};

export function NavBar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const onHome = pathname === "/";

  const links: NavItem[] = useMemo(() => {
    const H = (hash: string) => (onHome ? hash : `/${hash}`);

    return [
      { href: "/sorteio", label: "Liga Titans", kind: "page" },
      { href: H("#inscricoes"), label: "Modalidades", kind: "hash" },
      { href: H("#local"), label: "Local", kind: "hash" },
      { href: H("#inscricoes"), label: "Inscri&ccedil;&otilde;es", kind: "hash" },
      { href: "/portal/login", label: "Portal", kind: "page" },
      { href: "/patrocinadores", label: "Seja um patrocinador", kind: "page" },
      { href: H("#contato"), label: "Contato", kind: "hash" },
    ];
  }, [onHome]);

  const ctaHref = onHome ? "#inscricoes" : "/#inscricoes";
  const toggle = () => setOpen((prev) => !prev);
  const close = () => setOpen(false);
  const isActivePage = (href: string) => pathname === href;

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link
            href={onHome ? "#inicio" : "/#inicio"}
            className="flex items-center gap-3"
            onClick={close}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/60 shadow-[0_0_12px_rgba(0,0,0,0.6)]">
              <span className="text-xs font-semibold tracking-wide text-zinc-200">TR</span>
            </div>

            <span className="heading-adventure text-lg text-white drop-shadow md:text-xl">
              TITANS RACE
            </span>
          </Link>
        </motion.div>

        <nav className="hidden items-center gap-5 text-xs font-medium text-zinc-300 md:flex">
          {links.map((link) => {
            const active = link.kind === "page" && isActivePage(link.href);

            if (link.kind === "page") {
              return (
                <motion.div key={link.href} whileHover={{ scale: 1.05 }}>
                  <Link
                    href={link.href}
                    onClick={close}
                    className={[
                      "relative text-[10px] uppercase tracking-[0.2em] transition-colors",
                      active ? "text-orange-400" : "hover:text-orange-400",
                    ].join(" ")}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                </motion.div>
              );
            }

            return (
              <motion.a
                key={link.href}
                href={link.href}
                onClick={close}
                className="relative text-[10px] uppercase tracking-[0.2em] transition-colors hover:text-orange-400"
                whileHover={{ scale: 1.05 }}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            );
          })}
        </nav>

        <motion.a
          href={ctaHref}
          onClick={close}
          className="hidden items-center rounded-full bg-orange-500 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black shadow-md transition hover:bg-orange-400 active:scale-95 md:flex"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          Inscreva-se
        </motion.a>

        <button
          type="button"
          onClick={toggle}
          className="inline-flex items-center justify-center rounded-full border border-white/15 bg-black/60 p-2 text-zinc-200 shadow-md transition hover:bg-black/80 md:hidden"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

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
              {links.map((link) => {
                const active = link.kind === "page" && isActivePage(link.href);

                if (link.kind === "page") {
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={close}
                      className={[
                        "rounded-xl px-3 py-3 text-[11px] font-medium uppercase tracking-[0.18em] transition",
                        active ? "bg-white/10 text-orange-300" : "text-zinc-100 hover:bg-white/5",
                      ].join(" ")}
                      dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                  );
                }

                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={close}
                    className="rounded-xl px-3 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-100 transition hover:bg-white/5"
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                );
              })}

              <a
                href={ctaHref}
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
