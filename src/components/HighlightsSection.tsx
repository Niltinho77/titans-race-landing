// src/components/HighlightsSection.tsx
export function HighlightsSection() {
  const blocks = [
    {
      title: "Circuito Titans",
      subtitle: "6K · 15 Obstáculos",
      text: "Formato principal da prova, equilibrando corrida e obstáculos intensos.",
    },
    {
      title: "Experiência Militar",
      subtitle: "Imersão total",
      text: "Briefing, comandos, ambientação e estilo inspirados em treinamentos reais.",
    },
    {
      title: "Categorias",
      subtitle: "Solo & Equipes",
      text: "Participe sozinho, com amigos ou com a turma inteira da academia/trabalho.",
    },
  ];

  return (
    <section
      id="destaques"
      className="bg-[#05010D] px-4 py-16 md:py-20 border-t border-white/5"
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="font-giz text-3xl text-white md:text-4xl">
          Como será a prova?
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-zinc-300 md:text-base">
          A Titans Race nasce para ser a referência em corrida de obstáculos da
          região, com um circuito pensado para ser desafiador, visualmente
          impactante e acessível para quem deseja sair da zona de conforto.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {blocks.map((b) => (
            <div
              key={b.title}
              className="flex flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-br from-[#361259] via-black to-black p-5 text-sm text-zinc-200 shadow-lg"
            >
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-[#F5E04E]">
                  {b.subtitle}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  {b.title}
                </h3>
                <p className="mt-2 text-xs text-zinc-300">{b.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
