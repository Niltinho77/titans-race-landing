export function ObstaclesSection() {
  const obstacles = [
    "Muro de Escalada",
    "Rampa de Corda",
    "Lama dos Titãs",
    "Carga do Guerreiro",
    "Fogo & Fumaça",
  ];

  return (
    <section id="obstaculos" className="py-16 md:py-24 px-4 bg-black/70">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-giz text-3xl md:text-4xl mb-8">Obstáculos Oficiais</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {obstacles.map((name) => (
            <div
              key={name}
              className="border border-white/10 rounded-xl p-4 bg-gradient-to-br from-titans-primary/30 to-black/80"
            >
              <div className="h-32 mb-3 rounded-lg bg-[radial-gradient(circle_at_top,#6C2BD9_0,transparent_60%)] flex items-center justify-center text-xs text-titans-text/50">
                FOTO DO OBSTÁCULO
              </div>
              <h3 className="font-giz text-xl mb-1">{name}</h3>
              <p className="text-xs text-titans-text/70">
                Descrição breve do obstáculo, nível de dificuldade e o tipo de desafio
                que o atleta irá enfrentar.
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}