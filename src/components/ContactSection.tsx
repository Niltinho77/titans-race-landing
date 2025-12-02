export function ContactSection() {
  return (
    <section id="contato" className="py-16 md:py-20 px-4 bg-black/95">
      <div className="max-w-5xl mx-auto grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="font-giz text-3xl md:text-4xl mb-6">Contato & WhatsApp</h2>
          <p className="text-sm text-titans-text/80 mb-4">
            Fale diretamente com a organização da Titans Race para dúvidas, patrocínios
            e informações gerais.
          </p>
          <ul className="space-y-2 text-sm text-titans-text/80">
            <li>WhatsApp: <span className="text-titans-accent">(+55) (00) 00000-0000</span></li>
            <li>E-mail: contato@titansrace.com.br</li>
          </ul>
        </div>

        <div className="space-y-4 text-sm text-titans-text/70">
          <a
            href="https://wa.me/0000000000000"
            className="block w-full text-center px-4 py-3 rounded-full bg-emerald-500 text-black font-semibold uppercase text-xs tracking-wide shadow-lg"
          >
            Falar no WhatsApp
          </a>
          <a
            href="#"
            className="block w-full text-center px-4 py-3 rounded-full border border-titans-text/40 text-titans-text font-medium uppercase text-[11px] tracking-wide hover:bg-white/5"
          >
            Entrar no grupo oficial
          </a>
        </div>
      </div>
    </section>
  );
}