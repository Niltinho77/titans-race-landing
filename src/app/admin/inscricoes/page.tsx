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
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
    case "FAILED":
      return "border-red-500/40 bg-red-500/10 text-red-300";
    case "PENDING":
    default:
      return "border-yellow-500/40 bg-yellow-500/10 text-yellow-300";
  }
}

function modalityKind(modalityId: string) {
  if (modalityId === "equipes") return "equipes";
  if (modalityId === "duplas") return "duplas";
  return "solo";
}

function participantsPerGroup(modalityId: string) {
  if (modalityId === "equipes") return 4;
  if (modalityId === "duplas") return 2;
  return 1;
}

function sortParticipantsForDisplay(order: OrderWithParticipants) {
  const kind = modalityKind(order.modalityId);
  if (kind === "equipes" || kind === "duplas") {
    return [...order.participants].sort(
      (a, b) => (a.teamIndex ?? 0) - (b.teamIndex ?? 0)
    );
  }
  return order.participants;
}

function groupBibNumber(participants: OrderWithParticipants["participants"]) {
  const first = participants.find((p) => p.bibNumber != null);
  return first?.bibNumber ?? null;
}

function groupParticipantsByBib(
  participants: OrderWithParticipants["participants"],
  modalityId: string
) {
  const kind = modalityKind(modalityId);

  // solo: 1 por "grupo" (cada um tem bib próprio)
  if (kind === "solo") {
    return participants.map((p) => ({
      bibNumber: p.bibNumber ?? null,
      members: [p],
    }));
  }

  // duplas/equipes: em geral compartilham o mesmo bibNumber
  // porém, por segurança, agrupamos por bibNumber quando existir.
  const map = new Map<string, typeof participants>();

  for (const p of participants) {
    const key = String(p.bibNumber ?? "SEM_BIB");
    const arr = map.get(key) ?? [];
    arr.push(p);
    map.set(key, arr);
  }

  const grouped = Array.from(map.entries()).map(([key, members]) => ({
    bibNumber: key === "SEM_BIB" ? null : Number(key),
    members: members.sort((a, b) => (a.teamIndex ?? 0) - (b.teamIndex ?? 0)),
  }));

  // ordena por bibNumber quando houver
  grouped.sort((a, b) => (a.bibNumber ?? 0) - (b.bibNumber ?? 0));
  return grouped;
}

function extrasLabel(extras: { type: string; size: string | null; quantity: number }[]) {
  if (!extras || extras.length === 0) return "Sem extras";
  return extras
    .map((e) => `${e.type}${e.size ? ` (${e.size})` : ""} x${e.quantity}`)
    .join(" · ");
}

function pickMainParticipant(order: OrderWithParticipants) {
  // “contato principal” = primeiro participante (como você já usa)
  return order.participants[0] ?? null;
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

  // Segmentação por modalidade
  const groupedByModality = orders.reduce<Record<string, OrderWithParticipants[]>>((acc, o) => {
    acc[o.modalityId] = acc[o.modalityId] ?? [];
    acc[o.modalityId].push(o);
    return acc;
  }, {});

  // Ordena modalidades por volume (maior primeiro)
  const modalityEntries = Object.entries(groupedByModality).sort((a, b) => b[1].length - a[1].length);

  return (
    <main className="min-h-screen bg-black px-4 pb-24 pt-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* Header */}
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              Painel interno · Titans Race
            </p>
            <h1 className="heading-adventure text-3xl text-white md:text-4xl">
              Inscrições e kits
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Visualização operacional (operacional = para execução no credenciamento): pedidos, modalidades e kits por participante.
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

        {/* Top summary */}
        <section className="grid gap-4 md:grid-cols-4">
          <ResumoCard title="Total de pedidos" value={String(totalInscricoes)} subtitle="Todos os pedidos registrados" />
          <ResumoCard title="Pagos" value={String(pagos)} subtitle="Pagamento confirmado" color="emerald" />
          <ResumoCard title="Pendentes" value={String(pendentes)} subtitle="Aguardando confirmação" color="yellow" />
          <ResumoCard title="Falhos" value={String(falhos)} subtitle="Erro / cancelado" color="red" />
        </section>

        <section className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-black/70 p-4">
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              Receita confirmada
            </p>
            <p className="mt-2 text-2xl font-semibold text-emerald-300">
              {formatCurrency(totalArrecadado)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Soma apenas dos pedidos com status <span className="font-semibold">Pago</span>.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/70 p-4 text-xs text-zinc-300">
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              Operação
            </p>
            <p className="mt-2">
              Esta tela foi organizada por modalidade para o credenciamento separar rapidamente os kits e identificar grupos (duplas/equipes).
            </p>
          </div>
        </section>

        {/* Modalities */}
        {orders.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-black/70 p-6 text-sm text-zinc-300">
            Ainda não há pedidos registrados.
          </div>
        ) : (
          <section className="space-y-4">
            {modalityEntries.map(([modalityId, modalityOrders]) => {
              const modality = getModalityById(modalityId);
              const paidCount = modalityOrders.filter((o) => o.status === "PAID").length;
              const pendingCount = modalityOrders.filter((o) => o.status === "PENDING").length;
              const failedCount = modalityOrders.filter((o) => o.status === "FAILED").length;

              const paidTotal = modalityOrders
                .filter((o) => o.status === "PAID")
                .reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);

              const kind = modalityKind(modalityId);
              const perGroup = participantsPerGroup(modalityId);

              return (
                <details
                  key={modalityId}
                  open
                  className="rounded-3xl border border-white/10 bg-black/70"
                >
                  <summary className="cursor-pointer list-none px-5 py-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                          Modalidade
                        </p>
                        <h2 className="truncate text-lg font-semibold text-white">
                          {modality?.name ?? modalityId}
                        </h2>

                        <p className="mt-1 text-xs text-zinc-400">
                          {kind === "equipes"
                            ? `Equipe: ${perGroup} integrantes por inscrição`
                            : kind === "duplas"
                            ? `Dupla: ${perGroup} integrantes por inscrição`
                            : "Individual"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Pill label={`Pedidos: ${modalityOrders.length}`} tone="neutral" />
                        <Pill label={`Pagos: ${paidCount}`} tone="success" />
                        <Pill label={`Pendentes: ${pendingCount}`} tone="warning" />
                        <Pill label={`Falhos: ${failedCount}`} tone="danger" />
                        <Pill label={`Receita: ${formatCurrency(paidTotal)}`} tone="success" />
                      </div>
                    </div>
                  </summary>

                  <div className="border-t border-white/10 px-4 pb-5 pt-4 md:px-5">
                    <div className="grid gap-4">
                      {modalityOrders.map((order) => {
                        const createdAt = formatDate(order.createdAt);
                        const total = formatCurrency(order.totalAmount);
                        const main = pickMainParticipant(order);

                        const participantsSorted = sortParticipantsForDisplay(order);
                        const grouped = groupParticipantsByBib(participantsSorted, order.modalityId);
                        const groupNumber = groupBibNumber(participantsSorted);

                        return (
                          <div
                            key={order.id}
                            className="rounded-2xl border border-white/10 bg-black/50 p-4"
                          >
                            {/* Order header */}
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div className="min-w-0">
                                <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                                  Pedido
                                </p>
                                <p className="mt-1 font-mono text-[11px] text-zinc-200 break-all">
                                  {order.id}
                                </p>

                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <span
                                    className={`inline-flex rounded-full border px-2 py-1 text-[10px] ${statusClasses(order.status)}`}
                                  >
                                    {statusLabel(order.status)}
                                  </span>

                                  <span className="text-[11px] text-zinc-500">
                                    {createdAt}
                                  </span>

                                  <span className="text-[11px] text-zinc-500">
                                    Ingressos: <span className="text-zinc-200">{order.tickets}</span>
                                  </span>

                                  <span className="text-[11px] text-zinc-500">
                                    Total: <span className="font-semibold text-zinc-100">{total}</span>
                                  </span>

                                  {(kind === "equipes" || kind === "duplas") && (
                                    <span className="text-[11px] text-zinc-500">
                                      Nº do grupo: <span className="font-mono text-zinc-200">{groupNumber ?? "—"}</span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Main contact */}
                              <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-zinc-300 md:w-[340px]">
                                <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                                  Contato principal
                                </p>
                                {main ? (
                                  <>
                                    <p className="mt-2 text-sm font-semibold text-zinc-100">
                                      {main.fullName}
                                    </p>
                                    <p className="mt-1 text-[11px] text-zinc-400">
                                      E-mail: <span className="text-zinc-200">{main.email}</span>
                                    </p>
                                    <p className="mt-1 text-[11px] text-zinc-400">
                                      Telefone: <span className="text-zinc-200">{main.phone}</span>
                                    </p>
                                  </>
                                ) : (
                                  <p className="mt-2 text-[11px] text-zinc-400">
                                    Sem participante cadastrado.
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Kits */}
                            <div className="mt-4 grid gap-3">
                              {grouped.map((g, groupIdx) => {
                                const isGroup = kind === "equipes" || kind === "duplas";
                                const title = isGroup
                                  ? `${kind === "equipes" ? "Equipe" : "Dupla"} · Nº ${g.bibNumber ?? "—"}`
                                  : "Participante";

                                return (
                                  <div
                                    key={`${order.id}-g-${groupIdx}`}
                                    className="rounded-2xl border border-white/10 bg-black/40 p-3"
                                  >
                                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                      <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                                        {title}
                                      </p>

                                      {kind === "equipes" && (
                                        <p className="text-[11px] text-orange-200/80">
                                          Regra: equipe deve conter pelo menos 1 mulher (validação operacional).
                                        </p>
                                      )}
                                    </div>

                                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                                      {g.members.map((p) => {
                                        const memberLabel =
                                          isGroup && p.teamIndex != null
                                            ? `Integrante ${p.teamIndex}/${perGroup}`
                                            : null;

                                        return (
                                          <div
                                            key={p.id}
                                            className="rounded-xl border border-white/10 bg-black/60 p-3"
                                          >
                                            <div className="flex flex-col gap-1">
                                              <p className="text-sm font-semibold text-zinc-100">
                                                {p.fullName}
                                              </p>

                                              <div className="flex flex-wrap gap-2 text-[11px] text-zinc-400">
                                                {memberLabel && (
                                                  <span className="rounded-full border border-white/10 bg-black/50 px-2 py-0.5 text-zinc-200">
                                                    {memberLabel}
                                                  </span>
                                                )}
                                                <span>
                                                  CPF: <span className="font-mono text-zinc-200">{p.cpf}</span>
                                                </span>
                                                <span>
                                                  Camiseta: <span className="text-zinc-200">{p.tshirtSize}</span>
                                                </span>
                                                <span>
                                                  Nº: <span className="font-mono text-zinc-200">{p.bibNumber ?? "—"}</span>
                                                </span>
                                              </div>

                                              <div className="mt-2 rounded-lg border border-white/10 bg-black/50 p-2">
                                                <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                                                  Kit (camiseta + extras)
                                                </p>
                                                <p className="mt-1 text-[11px] text-zinc-200">
                                                  Camiseta: <span className="font-semibold">{p.tshirtSize}</span>
                                                </p>
                                                <p className="mt-1 text-[11px] text-zinc-300">
                                                  Extras: <span className="text-zinc-200">{extrasLabel(p.extras)}</span>
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </details>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

function Pill({
  label,
  tone,
}: {
  label: string;
  tone: "neutral" | "success" | "warning" | "danger";
}) {
  const cls =
    tone === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : tone === "warning"
      ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-200"
      : tone === "danger"
      ? "border-red-500/30 bg-red-500/10 text-red-200"
      : "border-white/10 bg-black/50 text-zinc-200";

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] ${cls}`}>
      {label}
    </span>
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
