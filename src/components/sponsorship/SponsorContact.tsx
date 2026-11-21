import { Mail, MessageCircle } from "lucide-react";

const WHATSAPP =
  "https://wa.me/5555992234690?text=Ol%C3%A1!%20Tenho%20interesse%20em%20patrocinar%20a%20Titans%20Race.";

export function SponsorContact() {
  return (
    <main className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-black px-4 pb-20 pt-28">
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center opacity-35"
        style={{ backgroundImage: "url(/images/ed2/hero-muro.webp)" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black via-black/90 to-black/60" aria-hidden="true" />

      <div className="mx-auto w-full max-w-6xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-orange-400">Patrocínio</p>
        <h1 className="heading-adventure mt-3 max-w-3xl text-5xl leading-[0.9] text-white md:text-7xl">
          Sua marca na <span className="text-orange-500">arena dos Titans</span>
        </h1>
        <p className="mt-5 max-w-xl text-base text-zinc-300">
          Quer patrocinar a Titans Race? Fale com a gente e montamos juntos a melhor forma de
          colocar sua marca na prova.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-orange-500 px-8 text-xs font-bold uppercase tracking-[0.16em] text-black transition hover:bg-orange-400"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Falar no WhatsApp
          </a>
          <a
            href="mailto:contato@titansrace.com.br?subject=Patroc%C3%ADnio%20Titans%20Race"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/25 px-8 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            contato@titansrace.com.br
          </a>
        </div>
      </div>
    </main>
  );
}
