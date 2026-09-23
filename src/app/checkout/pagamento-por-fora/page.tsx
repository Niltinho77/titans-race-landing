import Link from "next/link";

export default function ExternalPaymentPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-24 text-white">
      <div className="mx-auto max-w-xl rounded-3xl border border-orange-500/30 p-7">
        <h1 className="heading-adventure text-3xl text-orange-400">Inscrição registrada</h1>
        <p className="mt-4">
          Sua inscrição foi registrada. Entre em contato com a organização para realizar o pagamento.
        </p>
        <p className="mt-3 text-zinc-300">
          Após a confirmação do pagamento, sua vaga na Titans Race estará garantida.
        </p>
        <a className="mt-6 block rounded-full bg-orange-500 p-3 text-center font-semibold text-black" href="https://wa.me/5555992234690">Falar com a organização</a>
        <Link className="mt-4 block text-center text-zinc-300" href="/">Voltar ao início</Link>
      </div>
    </main>
  );
}
