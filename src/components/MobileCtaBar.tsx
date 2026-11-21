"use client";

import { useEffect, useState } from "react";
import { usePublicLotStatus } from "@/hooks/useRegistrationClosed";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(cents / 100);
}

// Barra fixa no rodapé do celular, como nos apps: preço do lote e botão de inscrição sempre à mão.
export function MobileCtaBar() {
  const { phase, current, next } = usePublicLotStatus();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (phase === "ended") return null;

  const lot = current ?? next;
  if (!lot) return null;
  const open = phase === "open";

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/90 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl transition-transform duration-300 md:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-orange-400">
            {open ? `${lot.name} · até ${lot.lastDayLabel}` : `${lot.name} · abre ${lot.periodLabel.split(/ a | e /)[0]}`}
          </p>
          <p className="heading-adventure text-2xl leading-none text-white">
            {formatCurrency(lot.adultPrice)}
            <span className="ml-1 font-sans text-[11px] font-normal tracking-normal text-zinc-400">+ taxa · por pessoa</span>
          </p>
        </div>
        <a
          href={open ? "#inscricoes" : "#lotes"}
          className="shrink-0 rounded-full bg-orange-500 px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-black active:scale-95"
        >
          {open ? "Inscrever" : "Ver lotes"}
        </a>
      </div>
    </div>
  );
}
