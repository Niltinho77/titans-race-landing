export default function RegulamentoPage() {
  return (
    <main className="min-h-screen bg-titans-bg text-titans-text px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-giz text-3xl md:text-4xl mb-4">Regulamento Oficial</h1>
        <p className="text-sm text-titans-text/70 mb-4">
          Esta página apresenta a estrutura visual do regulamento da Titans Race. O texto
          completo será inserido após aprovação do projeto pela Prefeitura de Alegrete.
        </p>
        <div className="border border-white/10 rounded-xl p-4 text-xs text-titans-text/60">
          <p>
            [Aqui você poderá colar o regulamento em PDF, texto ou link externo.
            Por enquanto, mantenha como placeholder para o prefeito visualizar o layout.]
          </p>
        </div>
      </div>
    </main>
  );
}