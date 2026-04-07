// app/checkout/sucesso/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import SuccessClient from "./SuccessClient";

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
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;

  if (!orderId) {
    return (
      <main className="min-h-screen bg-black px-4 pb-24 pt-20">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-black/70 p-6 text-sm text-zinc-200">
          <h1 className="heading-adventure mb-3 text-2xl text-white md:text-3xl">
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
      <main className="min-h-screen bg-black px-4 pb-24 pt-20">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-black/70 p-6 text-sm text-zinc-200">
          <h1 className="heading-adventure mb-3 text-2xl text-white md:text-3xl">
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

  return (
    <SuccessClient
      orderId={order.id}
      initialStatus={order.status}
      totalFormatted={formatCurrency(order.totalAmountWithFee ?? order.totalAmount)}
      participant={
        order.participants[0]
          ? {
              fullName: order.participants[0].fullName,
              cpf: order.participants[0].cpf,
              email: order.participants[0].email,
              phone: order.participants[0].phone,
            }
          : null
      }
    />
  );
}