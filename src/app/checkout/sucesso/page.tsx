// src/app/checkout/sucesso/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";

type SuccessPageProps = {
  searchParams?: {
    orderId?: string;
  };
};

function formatCurrency(cents: number | null | undefined) {
  if (!cents) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const orderId = searchParams?.orderId;

  if (!orderId) {
    return (
      <main className="min-h-screen bg-black px-4 pt-24 pb-16">
        <div className="mx-auto max-w-3xl text-center text-zinc-100">
          <h1 className="heading-adventure text-3xl md:text-4xl mb-4">
            Pedido não encontrado
          </h1>
          <p className="text-sm text-zinc-400 mb-6">
            Não recebemos o identificador do pedido. Verifique o link de
            confirmação ou volte para a página inicial.
          </p>
          <Link
            href="/#inicio"
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-100 hover:bg-white/5"
          >
            Voltar para o início
          </Link>
        </div>
      </main>
    );
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      participants: {
        include: {
          extras: true,
        },
      },
    },
  });

  if (!order) {
    return (
      <main className="min-h-screen bg-black px-4 pt-24 pb-16">
        <div className="mx-auto max-w-3xl text-center text-zinc-100">
          <h1 className="heading-adventure text-3xl md:text-4xl mb-4">
            Pedido não encontrado
          </h1>
          <p className="text-sm text-zinc-400 mb-6">
            Não conseguimos localizar sua inscrição. Caso o pagamento tenha sido
            realizado, entre em contato com a organização informando este código:
          </p>
          <p className="font-mono text-xs text-zinc-300 mb-6 break-all">
            {orderId}
          </p>
          <Link
            href="/#inicio"
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-100 hover:bg-white/5"
          >
            Voltar para o início
          </Link>
        </div>
      </main>
    );
  }

  const totalLabel = formatCurrency(order.totalAmount ?? 0);

  return (
    <main className="min-h-screen bg-black px-4 pt-24 pb-16">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-black/70 p-6 md:p-8 text-zinc-100">
        <h1 className="heading-adventure text-3xl md:text-4xl text-emerald-300">
          Inscrição confirmada!
        </h1>

        <p className="mt-3 text-sm text-zinc-300">
          Seu pedido foi registrado com sucesso. Em breve você receberá um
          e-mail com os detalhes da Titans Race.
        </p>

        <div className="mt-6 grid gap-4 text-xs md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/60 p-4">
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              Detalhes do pedido
            </p>
            <p className="mt-2 text-sm">
              Código do pedido:
              <br />
              <span className="font-mono text-[11px] text-zinc-200 break-all">
                {order.id}
              </span>
            </p>
            <p className="mt-3 text-sm">
              Valor total:
              <br />
              <span className="text-lg font-semibold text-emerald-300">
                {totalLabel}
              </span>
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/60 p-4">
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              Participantes
            </p>
            <ul className="mt-2 space-y-2 text-xs">
              {order.participants.map((p) => (
                <li key={p.id} className="border-b border-white/5 pb-2 last:border-b-0">
                  <p className="font-semibold text-zinc-100">{p.fullName}</p>
                  <p className="text-zinc-400">
                    CPF: {p.cpf} · Camiseta: {p.tshirtSize}
                  </p>
                  {p.extras.length > 0 && (
                    <p className="mt-1 text-[11px] text-zinc-400">
                      Extras:{" "}
                      {p.extras
                        .map((e) =>
                          e.size
                            ? `${e.type} (${e.size}) x${e.quantity}`
                            : `${e.type} x${e.quantity}`
                        )
                        .join(", ")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-4 text-[11px] md:flex-row md:items-center md:justify-between">
          <p className="text-zinc-400">
            Guarde o código do pedido. Em caso de dúvidas, apresente este código
            para a organização da prova.
          </p>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/#inicio"
              className="rounded-full border border-white/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-100 hover:bg-white/5"
            >
              Voltar para o início
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}