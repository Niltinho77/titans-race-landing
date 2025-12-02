// src/components/RegistrationSection.tsx
export function RegistrationSection() {
  const lots = [
    { name: "Lote 1", desc: "Condição especial de lançamento.", highlight: "Melhor custo-benefício" },
    { name: "Lote 2", desc: "Valor intermediário, sujeito à disponibilidade.", highlight: "Ideal para indecisos" },
    { name: "Lote Final", desc: "Última chance para garantir sua vaga.", highlight: "Sujeito a limite técnico" },
  ];

  return (
    <section
      id="inscricoes"
      className="border-t border-white/5 bg-[#05010D] px-4 py-16 md:py-20"
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="font-giz text-3xl text-white md:text-4xl">
          Inscrições & Pagamento
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-zinc-300 md:text-base">
          Nesta primeira fase, a área abaixo é apenas visual para apresentação à
          Prefeitura. Posteriormente, será integrada a um sistema de pagamento
          online (Pix, cartão, etc.).
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {lots.map((lot) => (
            <div
              key={lot.name}
              className="flex flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 via-black to-black p-5 text-sm text-zinc-200"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[#F5E04E]">
                  {lot.name}
                </p>
                <p className="mt-2 text-xs text-zinc-300">{lot.desc}</p>
                <p className="mt-3 text-[11px] text-zinc-400">{lot.highlight}</p>
              </div>
              <button className="mt-4 rounded-full bg-[#F5E04E] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black shadow-md hover:bg-[#ffe765] transition">
                Comprar (visual)
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
