// src/components/ContactSection.tsx
export function ContactSection() {
  return (
    <section
      id="contato"
      className="border-t border-white/5 bg-[#05010D] px-4 py-16 md:py-20"
    >
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2">
        <div>
          <h2 className="font-giz text-3xl text-white md:text-4xl">
            Contato & WhatsApp
          </h2>
          <p className="mt-3 text-sm text-zinc-300 md:text-base">
            Canal direto com a organização da Titans Race para dúvidas,
            parcerias, patrocínios e informações sobre a prova.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-zinc-300">
            <li>WhatsApp: <span className="text-[#F5E04E]">(+55) (00) 00000-0000</span></li>
            <li>E-mail: contato@titansrace.com.br</li>
          </ul>
        </div>

        <div className="space-y-3 text-sm text-zinc-200">
          <a
            href="https://wa.me/0000000000000"
            className="block w-full rounded-full bg-emerald-500 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-black shadow-lg hover:bg-emerald-400 transition"
          >
            Falar no WhatsApp
          </a>
          <a
            href="#"
            className="block w-full rounded-full border border-white/20 px-4 py-3 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-100 hover:bg-white/5 transition"
          >
            Entrar no grupo oficial
          </a>
        </div>
      </div>
    </section>
  );
}
