// src/components/SponsorsSection.tsx
export function SponsorsSection() {
  return (
    <section
      id="patrocinadores"
      className="border-t border-white/5 bg-black px-4 py-16 md:py-20"
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="font-giz text-3xl text-white md:text-4xl">
          Patrocinadores & Apoio
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-zinc-300 md:text-base">
          Nesta primeira versão da landing, os espaços abaixo servem como
          placeholders para as marcas que apoiarão a Titans Race. Ideal para
          apresentar possíveis cotas à Prefeitura e empresas.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex h-20 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-black to-black text-[10px] text-zinc-400"
            >
              LOGO PATROCINADOR
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
