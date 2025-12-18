// app/checkout/sucesso/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

function formatCurrency(cents: number | null | undefined): string {
  const value = (cents ?? 0) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { orderId?: string };
}) {
  const orderId = searchParams?.orderId;

  if (!orderId) {
    return (
      <main className="min-h-screen bg-black pt-20 pb-24 px-4">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-black/70 p-6 text-sm text-zinc-200">
          <h1 className="heading-adventure text-2xl text-white md:text-3xl mb-3">
            Pedido não encontrado
          </h1>
          <p className="mb-4 text-zinc-300">
            Não recebemos o identificador do pedido. Verifique o link de confirmação
            ou volte para a página inicial.
          </p>
          <Link
            href="/#inicio"
            className="inline-flex items-center rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-100 hover:bg-white/5"
          >
            Voltar para o início
          </Link>
        </div>
      </main>
    );
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { participants: true },
  });

  if (!order) {
    return (
      <main className="min-h-screen bg-black pt-20 pb-24 px-4">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-black/70 p-6 text-sm text-zinc-200">
          <h1 className="heading-adventure text-2xl text-white md:text-3xl mb-3">
            Pedido não encontrado
          </h1>
          <p className="mb-4 text-zinc-300">
            Não localizamos nenhuma inscrição com o identificador informado.
            Se o pagamento foi concluído, entre em contato com a organização.
          </p>
          <Link
            href="/#inicio"
            className="inline-flex items-center rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-100 hover:bg-white/5"
          >
            Voltar para o início
          </Link>
        </div>
      </main>
    );
  }

  const totalFormatted = formatCurrency(order.totalAmount);
  const firstParticipant = order.participants[0];

  return (
    <main className="min-h-screen bg-black pt-20 pb-24 px-4">
      <div className="mx-auto max-w-3xl rounded-3xl border border-emerald-500/40 bg-black/70 p-6 text-sm text-zinc-200 shadow-[0_20px_60px_rgba(16,185,129,0.25)]">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-emerald-400">
              Inscrição confirmada
            </p>
            <h1 className="heading-adventure text-2xl text-white md:text-3xl">
              Titans Race – inscrição registrada
            </h1>
          </div>
        </div>

        <p className="mb-4 text-zinc-300">
          Sua inscrição foi registrada com sucesso. Assim que o pagamento for
          confirmado, sua vaga estará garantida.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/60 p-4">
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              Detalhes do pedido
            </p>
            <p className="mt-2 text-xs text-zinc-400">
              Número do pedido:
              <br />
              <span className="font-mono text-[11px] text-zinc-200">{order.id}</span>
            </p>
            <p className="mt-2 text-xs text-zinc-400">
              Status:
              <br />
              <span className="font-semibold text-emerald-300">{order.status}</span>
            </p>
            <p className="mt-2 text-xs text-zinc-400">
              Total:
              <br />
              <span className="font-semibold text-white">{totalFormatted}</span>
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/60 p-4">
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              Participante principal
            </p>
            {firstParticipant ? (
              <>
                <p className="mt-2 text-sm text-zinc-100">{firstParticipant.fullName}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  CPF: <span className="font-mono text-[11px]">{firstParticipant.cpf}</span>
                </p>
                <p className="mt-1 text-xs text-zinc-400">E-mail: {firstParticipant.email}</p>
                <p className="mt-1 text-xs text-zinc-400">Telefone: {firstParticipant.phone}</p>
              </>
            ) : (
              <p className="mt-2 text-xs text-zinc-400">Dados não encontrados.</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/#inicio"
            className="rounded-full border border-white/20 px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-100 hover:bg-white/5"
          >
            Voltar para o início
          </Link>
        </div>
      </div>
    </main>
  );
}
