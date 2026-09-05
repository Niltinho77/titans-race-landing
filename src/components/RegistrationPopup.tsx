"use client";

import Image from "next/image";
import { ArrowUpRight, X } from "lucide-react";
import { useEffect, useRef } from "react";

const SESSION_KEY = "titans-registration-reminder-v1";

export function RegistrationPopup() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      // The reminder still works when browser storage is unavailable.
    }

    let previousFocus: HTMLElement | null = null;
    let previousOverflow: string | undefined;
    const restorePage = () => {
      if (previousOverflow !== undefined) {
        document.body.style.overflow = previousOverflow;
        previousOverflow = undefined;
        previousFocus?.focus({ preventScroll: true });
      }
    };

    const timer = window.setTimeout(() => {
      const registration = document.getElementById("inscricoes");
      const bounds = registration?.getBoundingClientRect();
      const choosingModality = bounds && bounds.top < window.innerHeight && bounds.bottom > 0;
      const interacting = document.activeElement?.closest("a, button, input, textarea, select, [contenteditable='true']");
      if (document.hidden || choosingModality || interacting || document.querySelector("dialog[open]")) return;

      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      try {
        sessionStorage.setItem(SESSION_KEY, "shown");
      } catch {
        // Storage is optional; closing never depends on it.
      }
    }, 7000);

    dialog.addEventListener("close", restorePage);
    return () => {
      window.clearTimeout(timer);
      dialog.removeEventListener("close", restorePage);
      dialog.close();
      restorePage();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="registration-popup-title"
      aria-describedby="registration-popup-description"
      className="registration-popup fixed m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[760px] overflow-y-auto rounded-3xl border border-white/15 bg-[#101010] p-0 text-white shadow-[0_32px_120px_rgba(0,0,0,0.7)]"
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
          event.currentTarget.close();
        }
      }}
    >
      <div className="relative grid sm:grid-cols-[0.9fr_1.1fr]">
        <button
          type="button"
          autoFocus
          aria-label="Fechar aviso de inscrições"
          onClick={() => dialogRef.current?.close()}
          className="absolute right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/65 text-white/80 backdrop-blur-md transition hover:bg-white/15 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div className="relative min-h-[210px] overflow-hidden sm:min-h-[460px]">
          <Image
            src="/images/competicao.jpg"
            alt="Atleta da Titans Race superando o obstáculo de pneus"
            fill
            sizes="(max-width: 639px) 100vw, 360px"
            className="object-cover object-[center_38%]"
          />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#101010] via-transparent to-black/10 sm:bg-gradient-to-r sm:from-transparent sm:via-transparent sm:to-[#101010]" />
          <p className="absolute bottom-6 left-6 hidden font-titan text-lg uppercase leading-relaxed text-white drop-shadow-lg sm:block">
            Corra. Supere.<br /><span className="text-orange-400">Vença.</span>
          </p>
        </div>

        <div className="relative flex flex-col justify-center px-7 pb-7 pt-2 sm:py-12 sm:pl-6 sm:pr-9">
          <p className="mb-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-orange-400">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" aria-hidden="true" />
            Inscrições abertas
          </p>
          <h2 id="registration-popup-title" className="heading-adventure text-[34px] leading-[1.12] sm:text-[42px]">
            AINDA DÁ<br />TEMPO DE<br /><span className="text-orange-500">SE INSCREVER.</span>
          </h2>
          <p id="registration-popup-description" className="mt-5 max-w-sm text-sm leading-relaxed text-zinc-300">
            A próxima superação pode ser a sua. Escolha sua modalidade e venha viver a Titans Race.
          </p>
          <a
            href="#inscricoes"
            onClick={() => dialogRef.current?.close()}
            className="mt-7 flex min-h-12 items-center justify-center gap-3 rounded-full bg-orange-500 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-black transition hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-400"
          >
            Quero me inscrever <ArrowUpRight size={18} aria-hidden="true" />
          </a>
          <button type="button" onClick={() => dialogRef.current?.close()} className="mt-2 min-h-11 rounded-full text-xs text-zinc-400 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400">
            Vou continuar explorando
          </button>
        </div>
      </div>
    </dialog>
  );
}
