// app/checkout/pendente/page.tsx
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function PendentePage() {
  return (
    <main className="min-h-screen bg-black pt-20 pb-24 px-4">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-black/70 p-6 text-sm text-zinc-200">
        <h1 className="heading-adventure text-2xl text-white md:text-3xl mb-3">
          Pagamento PIX em processamento
        </h1>

        <p className="text-zinc-300">
          Sua inscrição foi registrada e o pagamento via PIX pode levar alguns minutos para
          ser confirmado.
        </p>

        <p className="mt-3 text-zinc-300">
          Assim que o pagamento for confirmado, você receberá a confirmação no e-mail informado
          na inscrição.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/#inicio"
            className="rounded-full bg-orange-500 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black"
          >
            Voltar ao início
          </Link>

          <Link
            href="/checkout"
            className="rounded-full border border-white/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-100 hover:bg-white/5"
          >
            Fazer outra inscrição
          </Link>
        </div>

        <p className="mt-6 text-[11px] text-zinc-500">
          Dica: verifique também a caixa de spam/lixo eletrônico.
        </p>
      </div>
    </main>
  );
}
