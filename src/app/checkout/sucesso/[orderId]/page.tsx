// src/app/checkout/sucesso/[orderId]/page.tsx
import { prisma } from "@/lib/prisma";
import { EXTRAS, getModalityById } from "@/config/checkout";
import Link from "next/link";

type SuccessPageProps = {
  params: {
    orderId: string;
  };
};

function formatCurrency(cents: number | null | undefined) {
  const value = (cents ?? 0) / 100;
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export const dynamic = "force-dynamic";

export default async function SuccessPage({ params }: SuccessPageProps) {
  const { orderId } = params;

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
      <main className="min-h-screen bg-black pt-24 pb-24 px-4">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-500/40 bg-red-500/10 px-6 py-8 text-sm text-red-100">
          <h1 className="heading-adventure text-2xl text-red-200">
            Inscrição não encontrada
          </h1>
          <p className="mt-3 text-zinc-200">
            Não encontramos nenhuma inscrição com o identificador informado.
            Verifique o link ou entre em contato com a organização da prova.
          </p>

          <div className="mt-6">
            <Link
              href="/#inicio"
              className="inline-flex rounded-full border border-white/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-100 hover:bg-white/5"
            >
              Voltar para o início
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const modality = getModalityById(order.modalityId) ?? {
    name: order.modalityId,
    description: "",
    basePrice: 0,
    id: order.modalityId as any,
    ticketLabel: "ingressos",
  };

  // Caso ticketsAmount / extrasAmount não estejam preenchidos,
  // recalcula com base nos EXTRAS de config
  const extrasPriceMap = EXTRAS.reduce<Record<string, number>>((acc, e) => {
    acc[e.id] = e.price;
    return acc;
  }, {});

  const computedExtrasTotal =
    order.extrasAmount ??
    order.participants.reduce((total, p) => {
      const extraSum = p.extras.reduce((sub, ex) => {
        const price = extrasPriceMap[ex.type] ?? 0;
        const qty = ex.quantity > 0 ? ex.quantity : 1;
        return sub + price * qty;
      }, 0);
      return total + extraSum;
    }, 0);

  const computedTicketsTotal =
    order.ticketsAmount ?? (order.totalAmount ?? 0) - computedExtrasTotal;

  const totalAmount = order.totalAmount ?? computedTicketsTotal + computedExtrasTotal;

  const statusLabel =
    order.status === "PAID"
      ? "Pagamento confirmado"
      : order.status === "CANCELLED"
      ? "Pedido cancelado"
      : "Pendente de pagamento";

  const statusColor =
    order.status === "PAID"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
      : order.status === "CANCELLED"
      ? "bg-red-500/15 text-red-200 border-red-500/40"
      : "bg-orange-500/15 text-orange-200 border-orange-500/40";

  return (
    <main className="min-h-screen bg-black pt-24 pb-24 px-4">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-black/70 px-6 py-8 text-sm text-zinc-100 shadow-[0_20px_70px_rgba(0,0,0,0.9)]">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="heading-adventure text-2xl text-white md:text-3xl">
              Inscrição registrada
            </h1>
            <p className="mt-2 text-xs text-zinc-400">
              Número do pedido:{" "}
              <span className="font-mono text-zinc-200">{order.id}</span>
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 text-xs md:items-end">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 ${statusColor}`}
            >
              {statusLabel}
            </span>
            <p className="text-[11px] text-zinc-500">
              Criado em{" "}
              {new Date(order.createdAt).toLocaleString("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </p>
          </div>
        </div>

        {/* Resumo da modalidade */}
        <div className="mt-6 grid gap-4 md:grid-cols-[1.6fr_1fr]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">
              Modalidade
            </p>
            <p className="mt-1 text-lg font-semibold text-white">
              {modality.name}
            </p>
            <p className="mt-2 text-xs text-zinc-300">
              {modality.description || "Modalidade selecionada para este pedido."}
            </p>

            <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-zinc-300">
              <span className="rounded-full border border-white/15 bg-black/60 px-3 py-1">
                {order.tickets} {modality.ticketLabel}
              </span>
              <span className="rounded-full border border-white/15 bg-black/60 px-3 py-1">
                {order.participants.length} participante
                {order.participants.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Bloco de valores */}
          <div className="rounded-2xl border border-white/15 bg-black/70 p-4 text-xs">
            <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">
              Resumo financeiro
            </p>

            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-zinc-300">
                <span>Inscrições</span>
                <span className="font-mono">
                  {formatCurrency(computedTicketsTotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Extras</span>
                <span className="font-mono">
                  {formatCurrency(computedExtrasTotal)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 text-sm font-semibold text-white">
                <span>Total</span>
                <span className="font-mono">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-zinc-500">
              O pagamento ainda será processado. Você receberá as instruções
              oficiais pelo e-mail informado na inscrição.
            </p>
          </div>
        </div>

        {/* Participantes */}
        <div className="mt-8 border-t border-white/10 pt-5">
          <h2 className="heading-adventure text-lg text-white">
            Participantes
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Dados utilizados para kit, numeração de peito e comunicação do evento.
          </p>

          <div className="mt-4 space-y-4">
            {order.participants.map((p, index) => (
              <div
                key={p.id}
                className="rounded-2xl border border-white/10 bg-black/60 p-4 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-white">
                    {index + 1}. {p.fullName}
                  </p>
                  <p className="font-mono text-[11px] text-zinc-400">
                    CPF: {p.cpf}
                  </p>
                </div>

                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  <div className="text-[11px] text-zinc-300">
                    <span className="text-zinc-500">Nascimento:</span>{" "}
                    {p.birthDate}
                  </div>
                  <div className="text-[11px] text-zinc-300">
                    <span className="text-zinc-500">Cidade / UF:</span>{" "}
                    {p.city || "-"} {p.state ? `· ${p.state}` : ""}
                  </div>
                  <div className="text-[11px] text-zinc-300">
                    <span className="text-zinc-500">Camiseta:</span>{" "}
                    {p.tshirtSize}
                  </div>
                  <div className="text-[11px] text-zinc-300">
                    <span className="text-zinc-500">Contato:</span>{" "}
                    {p.phone} · {p.email}
                  </div>
                  {p.emergencyName && (
                    <div className="text-[11px] text-zinc-300">
                      <span className="text-zinc-500">Emergência:</span>{" "}
                      {p.emergencyName} ({p.emergencyPhone || "sem telefone"})
                    </div>
                  )}
                  {p.healthInfo && (
                    <div className="text-[11px] text-zinc-300">
                      <span className="text-zinc-500">Saúde:</span>{" "}
                      {p.healthInfo}
                    </div>
                  )}
                </div>

                {p.extras.length > 0 && (
                  <div className="mt-3 rounded-xl border border-white/10 bg-black/60 p-3">
                    <p className="text-[11px] font-semibold text-zinc-200">
                      Extras selecionados
                    </p>
                    <ul className="mt-1 space-y-1 text-[11px] text-zinc-300">
                      {p.extras.map((ex) => {
                        const config = EXTRAS.find((e) => e.id === ex.type);
                        return (
                          <li key={ex.id}>
                            • {config?.name ?? ex.type}
                            {ex.size ? ` · tam. ${ex.size}` : ""}
                            {ex.quantity > 1 ? ` · x${ex.quantity}` : ""}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Botões finais */}
        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-5 text-[11px] md:flex-row md:items-center md:justify-between">
          <p className="text-zinc-500">
            Guarde este número de pedido. Ele poderá ser solicitado na retirada
            do kit e em qualquer contato com a organização.
          </p>

          <div className="flex flex-wrap justify-end gap-3">
            <Link
              href="/#inicio"
              className="rounded-full border border-white/20 px-4 py-2 font-medium uppercase tracking-[0.18em] text-zinc-100 hover:bg-white/5"
            >
              Voltar para o início
            </Link>
            {/* Placeholder para futuro: comprovante / impressão / Stripe */}
            {/* <button ...>Baixar comprovante</button> */}
          </div>
        </div>
      </div>
    </main>
  );
}