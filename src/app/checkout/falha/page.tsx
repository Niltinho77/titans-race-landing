// src/app/checkout/falha/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { XCircle } from "lucide-react";
import { getModalityById } from "@/config/checkout";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ orderId?: string }>;

function formatCurrency(cents: number | null | undefined): string {
  const value = (cents ?? 0) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function statusLabel(status: string) {
  switch (status) {
    case "PAID":
      return "Pago";
    case "PENDING":
      return "Pendente";
    case "FAILED":
      return "Falhou / Cancelado";
    default:
      return status;
  }
}

export default async function FailurePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const orderId = params.orderId;

  if (!orderId) {
    return (
      <main className="min-h-screen bg-black pt-20 pb-24 px-4">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-black/70 p-6 text-sm text-zinc-200">
          <h1 className="heading-adventure text-2xl text-white md:text-3xl mb-3">
            Não foi possível identificar o pedido
          </h1>
          <p className="mb-4 text-zinc-300">
            O link de retorno do pagamento não trouxe o <span className="font-semibold">orderId</span>.
            Volte ao início e tente novamente.
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
            Não localizamos nenhuma inscrição com esse identificador. Se você realizou o
            pagamento, entre em contato com a organização com o comprovante.
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

  const modality = getModalityById(order.modalityId);
  const firstParticipant = order.participants[0];
  const total = formatCurrency(order.totalAmountWithFee ?? order.totalAmount);

  return (
    <main className="min-h-screen bg-black pt-20 pb-24 px-4">
      <div className="mx-auto max-w-3xl rounded-3xl border border-red-500/40 bg-black/70 p-6 text-sm text-zinc-200 shadow-[0_20px_60px_rgba(239,68,68,0.22)]">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-red-300">
            <XCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-red-400">
              Pagamento não concluído
            </p>
            <h1 className="heading-adventure text-2xl text-white md:text-3xl">
              Não foi possível finalizar seu pagamento
            </h1>
          </div>
        </div>

        <p className="mb-4 text-zinc-300">
          Seu pedido foi registrado, mas o Mercado Pago retornou como{" "}
          <span className="font-semibold">falha/cancelamento</span> ou houve algum erro no retorno.
          Se você já pagou (ex.: PIX), ignore esta tela e aguarde alguns minutos — o webhook pode
          atualizar o status automaticamente.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/60 p-4">
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              Detalhes do pedido
            </p>
            <p className="mt-2 text-xs text-zinc-400">
              Pedido:
              <br />
              <span className="font-mono text-[11px] text-zinc-200">
                {order.id}
              </span>
            </p>
            <p className="mt-2 text-xs text-zinc-400">
              Modalidade:
              <br />
              <span className="font-semibold text-zinc-100">
                {modality?.name ?? order.modalityId}
              </span>
            </p>
            <p className="mt-2 text-xs text-zinc-400">
              Status atual:
              <br />
              <span className="font-semibold text-red-300">
                {statusLabel(order.status)}
              </span>
            </p>
            <p className="mt-2 text-xs text-zinc-400">
              Total:
              <br />
              <span className="font-semibold text-white">{total}</span>
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/60 p-4">
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              Participante principal
            </p>
            {firstParticipant ? (
              <>
                <p className="mt-2 text-sm text-zinc-100">
                  {firstParticipant.fullName}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  CPF:{" "}
                  <span className="font-mono text-[11px]">
                    {firstParticipant.cpf}
                  </span>
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  E-mail: {firstParticipant.email}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  Telefone: {firstParticipant.phone}
                </p>
              </>
            ) : (
              <p className="mt-2 text-xs text-zinc-400">
                Dados de participante não encontrados.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/60 p-4 text-xs text-zinc-300">
          <p className="text-zinc-300">
            Se você tentou pagar por <span className="font-semibold">PIX</span>:
          </p>
          <ul className="mt-2 list-disc pl-5 text-zinc-400 space-y-1">
            <li>
              O PIX pode ficar como <span className="font-semibold">pending</span> no retorno
              do navegador, mesmo após pago.
            </li>
            <li>
              Aguarde alguns minutos e confira no painel de Admin se o status virou{" "}
              <span className="font-semibold">Pago</span>.
            </li>
            <li>
              Se estiver pago no Admin, sua vaga está garantida (e o e-mail pode levar alguns minutos).
            </li>
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={modality?.id ? `/checkout?modality=${modality.id}` : "/checkout"}
            className="rounded-full bg-orange-500 px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-black shadow-md transition hover:bg-orange-400"
          >
            Tentar novamente
          </Link>

          <Link
            href="/#inicio"
            className="rounded-full border border-white/20 px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-100 hover:bg-white/5"
          >
            Voltar para o início
          </Link>

          <Link
            href={`/checkout/sucesso?orderId=${order.id}`}
            className="rounded-full border border-emerald-500/30 px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200 hover:bg-emerald-500/10"
          >
            Ver status do pedido
          </Link>
        </div>
      </div>
    </main>
  );
}
