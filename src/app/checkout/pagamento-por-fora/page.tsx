import Link from "next/link";

export default function ExternalPaymentPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-24 text-white">
      <div className="mx-auto max-w-xl rounded-3xl border border-orange-500/30 p-7">
        <h1 className="heading-adventure text-3xl text-orange-400">Inscrição registrada</h1>
        <p className="mt-4">Seu pagamento será feito por fora, diretamente com a organização. A inscrição está registrada com pagamento pendente e não é uma cortesia.</p>
        <p className="mt-3 text-zinc-300">Entre em contato para combinar o pagamento e informar seu nome e modalidade.</p>
        <a className="mt-6 block rounded-full bg-orange-500 p-3 text-center font-semibold text-black" href="https://wa.me/5555992234690">Combinar pagamento pelo WhatsApp</a>
        <Link className="mt-4 block text-center text-zinc-300" href="/">Voltar ao início</Link>
      </div>
    </main>
  );
}
