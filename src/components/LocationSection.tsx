export function LocationSection() {
  return (
    <section id="local" className="py-16 md:py-24 px-4 bg-gradient-to-b from-black/60 to-titans-primary/20">
      <div className="max-w-5xl mx-auto grid gap-8 md:grid-cols-[1.3fr_1fr] items-start">
        <div>
          <h2 className="font-giz text-3xl md:text-4xl mb-6">Local & Estrutura</h2>
          <p className="text-sm md:text-base text-titans-text/80 mb-4">
            A Titans Race será realizada em área campestre em Alegrete/RS, com terreno
            variado, trechos de lama, obstáculos naturais e estrutura adequada para
            atletas e público.
          </p>
          <ul className="space-y-2 text-sm text-titans-text/70">
            <li>• Estacionamento no local</li>
            <li>• Pontos de hidratação durante o percurso</li>
            <li>• Equipe de saúde e ambulância de prontidão</li>
            <li>• Área de concentração, pórtico de largada e chegada</li>
          </ul>
        </div>

        <div className="rounded-xl overflow-hidden border border-white/10 bg-black/70 h-64">
          {/* aqui depois você embute o mapa real */}
          <div className="w-full h-full flex items-center justify-center text-xs text-titans-text/50">
            MAPA / GOOGLE MAPS (placeholder)
          </div>
        </div>
      </div>
    </section>
  );
}