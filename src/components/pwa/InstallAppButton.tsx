"use client";

import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

// Botão "Instalar app": no Android/Chrome abre o instalador; no iPhone ensina a adicionar à tela inicial.
export function InstallAppButton({ className = "" }: { className?: string }) {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || (!promptEvent && !isIos)) return null;

  return (
    <div className={className}>
      <button
        type="button"
        onClick={async () => {
          if (promptEvent) {
            await promptEvent.prompt();
            await promptEvent.userChoice.catch(() => null);
            setPromptEvent(null);
          } else {
            setShowIosHint((value) => !value);
          }
        }}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Instalar app Titans Race
      </button>
      {showIosHint && (
        <p className="mt-2 flex items-center justify-center gap-1 text-center text-xs text-zinc-400">
          Toque em <Share className="h-3.5 w-3.5" aria-label="Compartilhar" /> e depois em “Adicionar à Tela de Início”.
        </p>
      )}
    </div>
  );
}
