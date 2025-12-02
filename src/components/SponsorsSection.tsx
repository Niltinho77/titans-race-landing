export function SponsorsSection() {
  return (
    <section id="patrocinadores" className="py-16 md:py-24 px-4 bg-black/80">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-giz text-3xl md:text-4xl mb-8">Patrocinadores</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-black/80 flex items-center justify-center text-[10px] text-titans-text/50"
            >
              LOGO PATROCINADOR
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}