export function RegistrationSection() {
  return (
    <section id="inscricoes" className="py-16 md:py-24 px-4 bg-gradient-to-b from-black/80 to-titans-primary/25">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-giz text-3xl md:text-4xl mb-8">Inscrições & Pagamento</h2>

        <div className="grid gap-6 sm:grid-cols-3">
          {["Lote 1", "Lote 2", "Lote Final"].map((lote, i) => (
            <div
              key={lote}
              className="rounded-2xl border border-white/10 bg-black/80 p-5 flex flex-col justify-between hover:border-titans-accent/70 transition-colors"
            >
              <div>
                <h3 className="font-giz text-xl mb-2">{lote}</h3>
                <p className="text-xs text-titans-text/60 mb-4">
                  Descrição rápida das condições do lote (data limite, benefícios, etc.).
                </p>
              </div>
              <button className="mt-2 w-full px-4 py-2 rounded-full bg-titans-accent text-black font-semibold text-xs uppercase tracking-wide shadow-lg">
                Comprar
              </button>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-titans-text/60 mt-4">
          * Área de pagamento será integrada posteriormente (Pix, cartão, etc.). Esta
          seção é apenas visual para apresentação.
        </p>
      </div>
    </section>
  );
}