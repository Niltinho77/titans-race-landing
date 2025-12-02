// src/components/LocationSection.tsx
export function LocationSection() {
  return (
    <section
      id="local"
      className="border-t border-white/5 bg-black px-4 py-16 md:py-20"
    >
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.2fr_1fr]">
        <div>
          <h2 className="font-giz text-3xl text-white md:text-4xl">
            Local & Estrutura
          </h2>
          <p className="mt-4 text-sm text-zinc-200 md:text-base">
            A prova será realizada em área campestre em Alegrete/RS, com terreno
            variado, trechos de lama, subida, descida e pontos estratégicos para
            montagem de obstáculos, público e estrutura de apoio.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-zinc-300">
            <li>• Estacionamento</li>
            <li>• Ambulância e equipe de saúde</li>
            <li>• Pontos de hidratação</li>
            <li>• Área de aquecimento e pós-prova</li>
          </ul>
        </div>

        <div className="h-64 rounded-2xl border border-white/10 bg-gradient-to-br from-[#361259] via-black to-black text-[11px] text-zinc-200 flex items-center justify-center">
          MAPA / GOOGLE MAPS (placeholder)
        </div>
      </div>
    </section>
  );
}
