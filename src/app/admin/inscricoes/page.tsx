// src/app/admin/inscricoes/page.tsx
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { getModalityById } from "@/config/checkout";

export const dynamic = "force-dynamic";

type OrderWithParticipants = Prisma.OrderGetPayload<{
  include: { participants: { include: { extras: true } } };
}>;

function formatCurrency(cents: number | null | undefined): string {
  const value = (cents ?? 0) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusLabel(status: string) {
  switch (status) {
    case "PAID":
      return "Pago";
    case "PENDING":
      return "Pendente";
    case "FAILED":
      return "Falhou";
    default:
      return status;
  }
}

function statusClasses(status: string) {
  switch (status) {
    case "PAID":
      return "bg-emerald-500/10 text-emerald-300 border-emerald-500/40";
    case "FAILED":
      return "bg-red-500/10 text-red-300 border-red-500/40";
    case "PENDING":
    default:
      return "bg-yellow-500/10 text-yellow-300 border-yellow-500/40";
  }
}

function modalityKind(modalityId: string) {
  if (modalityId === "equipes") return "equipes";
  if (modalityId === "duplas") return "duplas";
  return "solo";
}

function sortParticipantsForDisplay(order: OrderWithParticipants) {
  const kind = modalityKind(order.modalityId);

  // Para equipes e duplas, queremos respeitar teamIndex (1..4 / 1..2)
  if (kind === "equipes" || kind === "duplas") {
    return [...order.participants].sort(
      (a, b) => (a.teamIndex ?? 0) - (b.teamIndex ?? 0)
    );
  }

  // Para solo: manter como veio (normalmente já está ok)
  return order.participants;
}

function groupBibNumber(participants: OrderWithParticipants["participants"]) {
  // Para duplas/equipes, todos devem compartilhar o mesmo bibNumber.
  // Pegamos o primeiro que existir.
  const first = participants.find((p) => p.bibNumber != null);
  return first?.bibNumber ?? null;
}

export default async function AdminInscricoesPage() {
  const orders: OrderWithParticipants[] = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { participants: { include: { extras: true } } },
  });

  const totalInscricoes = orders.length;
  const pagos = orders.filter((o) => o.status === "PAID").length;
  const pendentes = orders.filter((o) => o.status === "PENDING").length;
  const falhos = orders.filter((o) => o.status === "FAILED").length;

  const totalArrecadado = orders
    .filter((o) => o.status === "PAID")
    .reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);

  return (
    <main className="min-h-screen bg-black px-4 pb-24 pt-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* Cabeçalho */}
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              Painel interno · Titans Race
            </p>
            <h1 className="heading-adventure text-3xl text-white md:text-4xl">
              Inscrições do evento
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Visão geral das inscrições, pagamentos e extras contratados.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/#inicio"
              className="rounded-full border border-white/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-100 hover:bg-white/5"
            >
              Voltar para o site
            </Link>

            <a
              href="/api/admin/export-inscricoes"
              className="rounded-full bg-orange-500 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black shadow-md transition hover:bg-orange-400"
            >
              Baixar CSV
            </a>
          </div>
        </header>

        {/* Cards de resumo */}
        <section className="grid gap-4 md:grid-cols-4">
          <ResumoCard
            title="Total de inscrições"
            value={totalInscricoes.toString()}
            subtitle="Todos os pedidos registrados"
          />
          <ResumoCard
            title="Pagos"
            value={pagos.toString()}
            subtitle="Pedidos com pagamento confirmado"
            color="emerald"
          />
          <ResumoCard
            title="Pendentes"
            value={pendentes.toString()}
            subtitle="Aguardando pagamento"
            color="yellow"
          />
          <ResumoCard
            title="Falhos / cancelados"
            value={falhos.toString()}
            subtitle="Pagamentos com erro ou cancelados"
            color="red"
          />
        </section>

        {/* Receita */}
        <section className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-black/70 p-4">
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              Receita confirmada
            </p>
            <p className="mt-2 text-2xl font-semibold text-emerald-300">
              {formatCurrency(totalArrecadado)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Soma apenas dos pedidos com status{" "}
              <span className="font-semibold">Pago</span>.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/70 p-4 text-xs text-zinc-300">
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              Dica operacional
            </p>
            <p className="mt-2">
              Use o botão <span className="font-semibold">Baixar CSV</span> para
              gerar uma planilha com todos os inscritos, incluindo extras, e
              entregue para a equipe de credenciamento no dia da prova.
            </p>
          </div>
        </section>

        {/* Lista de pedidos */}
        <section className="mt-2 rounded-3xl border border-white/10 bg-black/70 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-100">
              Pedidos detalhados
            </h2>
            <p className="text-[11px] text-zinc-500">
              Listando {orders.length} pedidos
            </p>
          </div>

          {orders.length === 0 ? (
            <p className="text-sm text-zinc-400">Ainda não há inscrições registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs text-zinc-300">
                <thead className="border-b border-white/10 text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                  <tr>
                    <th className="px-3 py-2">Pedido</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Modalidade</th>
                    <th className="px-3 py-2">Ingressos</th>
                    <th className="px-3 py-2">Total</th>
                    <th className="px-3 py-2">Data</th>
                    <th className="px-3 py-2">Participantes & extras</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => {
                    const total = formatCurrency(order.totalAmount);
                    const createdAt = formatDate(order.createdAt);
                    const modality = getModalityById(order.modalityId);

                    const kind = modalityKind(order.modalityId);
                    const participantsSorted = sortParticipantsForDisplay(order);

                    const groupNumber = groupBibNumber(participantsSorted);

                    const groupTitle =
                      kind === "equipes"
                        ? `Equipe #${groupNumber ?? "—"}`
                        : kind === "duplas"
                        ? `Dupla #${groupNumber ?? "—"}`
                        : null;

                    const groupHint =
                      kind === "equipes"
                        ? "Aviso: esta modalidade exige pelo menos 1 mulher na equipe."
                        : kind === "duplas"
                        ? "Dupla: os 2 atletas correm vinculados ao mesmo número."
                        : null;

                    return (
                      <tr
                        key={order.id}
                        className="border-b border-white/5 align-top last:border-0"
                      >
                        <td className="px-3 py-3">
                          <p className="font-mono text-[11px] text-zinc-200">
                            {order.id}
                          </p>
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2 py-1 text-[10px] ${statusClasses(
                              order.status
                            )}`}
                          >
                            {statusLabel(order.status)}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <p className="text-xs font-semibold text-zinc-100">
                            {modality?.name ?? order.modalityId}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            {order.modalityId}
                          </p>
                        </td>

                        <td className="px-3 py-3">
                          <p className="text-xs text-zinc-200">{order.tickets}</p>
                        </td>

                        <td className="px-3 py-3">
                          <p className="text-xs font-semibold text-zinc-100">
                            {total}
                          </p>
                        </td>

                        <td className="px-3 py-3">
                          <p className="text-[11px] text-zinc-400">{createdAt}</p>
                        </td>

                        <td className="px-3 py-3">
                          <div className="space-y-2">
                            {(kind === "equipes" || kind === "duplas") && (
                              <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-2 text-[11px] text-orange-200">
                                <p className="font-semibold">
                                  {groupTitle} · {participantsSorted.length}{" "}
                                  {kind === "equipes" ? "integrantes" : "atletas"}
                                </p>
                                {groupHint && (
                                  <p className="text-orange-200/80">{groupHint}</p>
                                )}
                              </div>
                            )}

                            {participantsSorted.map((p) => (
                              <div
                                key={p.id}
                                className="rounded-xl border border-white/10 bg-black/40 p-2"
                              >
                                <p className="text-xs font-semibold text-zinc-100">
                                  {p.fullName}
                                </p>

                                {/* ✅ Número do atleta / do grupo */}
                                <p className="text-[11px] text-zinc-400">
                                  Nº:{" "}
                                  <span className="font-mono">
                                    {p.bibNumber ?? "—"}
                                  </span>
                                  {(kind === "equipes" || kind === "duplas") &&
                                    p.teamIndex != null && (
                                      <span className="ml-2">
                                        · Integrante {p.teamIndex}
                                      </span>
                                    )}
                                </p>

                                <p className="text-[11px] text-zinc-400">
                                  CPF: <span className="font-mono">{p.cpf}</span>
                                </p>
                                <p className="text-[11px] text-zinc-400">
                                  E-mail: {p.email}
                                </p>
                                <p className="text-[11px] text-zinc-400">
                                  Telefone: {p.phone}
                                </p>

                                {p.extras.length > 0 ? (
                                  <p className="mt-1 text-[11px] text-zinc-300">
                                    Extras:{" "}
                                    {p.extras
                                      .map(
                                        (e) =>
                                          `${e.type}${
                                            e.size ? ` (${e.size})` : ""
                                          } x${e.quantity}`
                                      )
                                      .join(" · ")}
                                  </p>
                                ) : (
                                  <p className="mt-1 text-[11px] text-zinc-500">
                                    Sem extras
                                  </p>
                                )}
                              </div>
                            ))}

                            {order.participants.length === 0 && (
                              <p className="text-[11px] text-zinc-500">
                                Nenhum participante cadastrado.
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ResumoCard({
  title,
  value,
  subtitle,
  color = "default",
}: {
  title: string;
  value: string;
  subtitle?: string;
  color?: "default" | "emerald" | "yellow" | "red";
}) {
  const colorClasses =
    color === "emerald"
      ? "border-emerald-500/40 bg-emerald-500/5"
      : color === "yellow"
      ? "border-yellow-500/40 bg-yellow-500/5"
      : color === "red"
      ? "border-red-500/40 bg-red-500/5"
      : "border-white/10 bg-black/70";

  return (
    <div className={`rounded-3xl border p-4 text-xs text-zinc-300 ${colorClasses}`}>
      <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
        {title}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {subtitle && <p className="mt-1 text-[11px] text-zinc-500">{subtitle}</p>}
    </div>
  );
}
