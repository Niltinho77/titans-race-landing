import Link from "next/link";
import type { Prisma } from "@prisma/client";
import PortalHeader from "@/components/portal/PortalHeader";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/portalAuth";

export const dynamic = "force-dynamic";

type AnalyticsEvent = Prisma.AnalyticsEventGetPayload<object>;

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0s";
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes <= 0) return `${rest}s`;
  return `${minutes}m ${rest}s`;
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function countBy<T>(items: T[], keyFn: (item: T) => string) {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function metadataRecord(event: AnalyticsEvent) {
  if (!event.metadata || typeof event.metadata !== "object" || Array.isArray(event.metadata)) {
    return {} as Record<string, unknown>;
  }
  return event.metadata as Record<string, unknown>;
}

function metadataString(event: AnalyticsEvent, key: string) {
  const value = metadataRecord(event)[key];
  return typeof value === "string" ? value : "";
}

function metadataNumber(event: AnalyticsEvent, key: string) {
  const value = metadataRecord(event)[key];
  return typeof value === "number" ? value : 0;
}

function eventLabel(eventName: string) {
  const labels: Record<string, string> = {
    page_view: "Visualização de página",
    click: "Clique",
    time_on_page: "Tempo na página",
    checkout_view: "Checkout aberto",
    checkout_step_1: "Checkout etapa 1",
    checkout_step_2: "Checkout etapa 2",
    checkout_step_3: "Checkout etapa 3",
    checkout_submit: "Tentou finalizar inscrição",
    checkout_order_created: "Pedido criado",
    checkout_error: "Erro no checkout",
  };

  return labels[eventName] ?? eventName;
}

function percent(value: number, total: number) {
  if (total <= 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

export default async function AdminMetricasPage() {
  const user = await requireAdminUser();
  const since30 = daysAgo(30);
  const since7 = daysAgo(7);
  const since24h = daysAgo(1);

  const [events30, events7, events24h, sponsorshipLeadCount, paidOrders, totalOrders] =
    await Promise.all([
      prisma.analyticsEvent.findMany({
        where: { createdAt: { gte: since30 } },
        orderBy: { createdAt: "desc" },
        take: 5000,
      }),
      prisma.analyticsEvent.findMany({
        where: { createdAt: { gte: since7 } },
        orderBy: { createdAt: "desc" },
        take: 3000,
      }),
      prisma.analyticsEvent.findMany({
        where: { createdAt: { gte: since24h } },
        orderBy: { createdAt: "desc" },
        take: 1500,
      }),
      prisma.sponsorshipLead.count({ where: { createdAt: { gte: since30 } } }),
      prisma.order.count({ where: { status: "PAID", createdAt: { gte: since30 } } }),
      prisma.order.count({ where: { createdAt: { gte: since30 } } }),
    ]);

  const pageViews30 = events30.filter((event) => event.eventName === "page_view");
  const pageViews7 = events7.filter((event) => event.eventName === "page_view");
  const clicks30 = events30.filter((event) => event.eventName === "click");
  const timeEvents = events30.filter((event) => event.eventName === "time_on_page");

  const uniqueSessions30 = new Set(events30.map((event) => event.sessionId)).size;
  const uniqueSessions7 = new Set(events7.map((event) => event.sessionId)).size;
  const uniqueSessions24h = new Set(events24h.map((event) => event.sessionId)).size;

  const totalSeconds = timeEvents.reduce((sum, event) => sum + metadataNumber(event, "seconds"), 0);
  const avgSeconds = timeEvents.length > 0 ? Math.round(totalSeconds / timeEvents.length) : 0;

  const checkoutStep1 = events30.filter((event) => event.eventName === "checkout_step_1").length;
  const checkoutStep2 = events30.filter((event) => event.eventName === "checkout_step_2").length;
  const checkoutStep3 = events30.filter((event) => event.eventName === "checkout_step_3").length;
  const checkoutSubmit = events30.filter((event) => event.eventName === "checkout_submit").length;
  const checkoutCreated = events30.filter((event) => event.eventName === "checkout_order_created").length;
  const checkoutAbandoned = Math.max(0, checkoutStep1 - checkoutCreated);

  const flyerCampaignEvents = events30.filter(
    (event) => metadataString(event, "campaign") === "panfleto_2026",
  );
  const flyerPageViews = flyerCampaignEvents.filter((event) => event.eventName === "page_view");
  const flyerScans = flyerPageViews.filter(
    (event) => metadataRecord(event).campaignEntry === true,
  );
  const flyerVisitors = new Set(flyerCampaignEvents.map((event) => event.sessionId)).size;
  const flyerCheckoutVisitors = new Set(
    flyerCampaignEvents
      .filter((event) => event.eventName === "checkout_view" || event.eventName === "checkout_step_1")
      .map((event) => event.sessionId),
  ).size;
  const flyerOrders = flyerCampaignEvents.filter(
    (event) => event.eventName === "checkout_order_created",
  ).length;

  const topPages = countBy(pageViews30, (event) => event.path.split("?")[0]).slice(0, 8);
  const topDevices = countBy(pageViews30, (event) => event.device ?? "desconhecido").slice(0, 4);
  const topClicks = countBy(clicks30, (event) => {
    const label = metadataString(event, "label") || metadataString(event, "href") || "Clique sem texto";
    return label;
  }).slice(0, 10);
  const checkoutByModality = countBy(
    events30.filter((event) => event.eventName === "checkout_view"),
    (event) => metadataString(event, "modalityName") || metadataString(event, "modalityId") || "Sem modalidade",
  ).slice(0, 8);

  const recentEvents = events30.slice(0, 25);

  return (
    <main className="min-h-screen bg-black pb-24">
      <PortalHeader email={user.email} role={user.role} />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pt-10">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              Painel interno · Titans Race
            </p>
            <h1 className="heading-adventure text-3xl text-white md:text-4xl">
              Métricas do site
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Acessos, cliques, tempo na página e funil inicial de inscrição.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/inscricoes"
              className="rounded-full border border-white/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-100 hover:bg-white/5"
            >
              Inscrições
            </Link>
            <Link
              href="/"
              className="rounded-full border border-white/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-100 hover:bg-white/5"
            >
              Ver site
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Visitantes 30 dias" value={String(uniqueSessions30)} subtitle={`${uniqueSessions7} nos últimos 7 dias`} />
          <MetricCard title="Últimas 24h" value={String(uniqueSessions24h)} subtitle={`${events24h.length} eventos registrados`} color="orange" />
          <MetricCard title="Visualizações" value={String(pageViews30.length)} subtitle={`${pageViews7.length} nos últimos 7 dias`} />
          <MetricCard title="Tempo médio" value={formatDuration(avgSeconds)} subtitle="Média por página, quando o navegador envia o evento" />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Checkout iniciado" value={String(checkoutStep1)} subtitle="Entrou na etapa de modalidade/ingressos" color="orange" />
          <MetricCard title="Dados preenchidos" value={String(checkoutStep2)} subtitle={`${percent(checkoutStep2, checkoutStep1)} dos inícios chegaram aqui`} />
          <MetricCard title="Chegou nos termos" value={String(checkoutStep3)} subtitle={`${percent(checkoutStep3, checkoutStep1)} dos inícios chegaram aqui`} />
          <MetricCard title="Pedidos criados" value={String(checkoutCreated)} subtitle={`${checkoutAbandoned} abandonos aproximados`} color="emerald" />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard title="Tentativas de finalizar" value={String(checkoutSubmit)} subtitle="Cliques em finalizar inscrição" />
          <MetricCard title="Pedidos pagos" value={String(paidOrders)} subtitle={`${totalOrders} pedidos totais nos últimos 30 dias`} color="emerald" />
          <MetricCard title="Leads patrocinadores" value={String(sponsorshipLeadCount)} subtitle="Formulários de patrocínio enviados" color="orange" />
        </section>

        <Panel title="QR Code do panfleto · últimos 30 dias">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Acessos pelo QR"
              value={String(flyerScans.length)}
              subtitle="Leituras que abriram o link do panfleto"
              color="orange"
            />
            <MetricCard
              title="Pessoas pelo QR"
              value={String(flyerVisitors)}
              subtitle="Visitantes únicos atribuídos ao panfleto"
            />
            <MetricCard
              title="Foram ao checkout"
              value={String(flyerCheckoutVisitors)}
              subtitle={`${percent(flyerCheckoutVisitors, flyerVisitors)} das pessoas do QR`}
            />
            <MetricCard
              title="Pedidos pelo QR"
              value={String(flyerOrders)}
              subtitle={`${percent(flyerOrders, flyerVisitors)} de conversão em pedido`}
              color="emerald"
            />
          </div>
          <p className="mt-4 break-all text-[11px] text-zinc-500">
            Link rastreado: https://titansrace.com.br/?utm_source=panfleto&amp;utm_medium=qrcode&amp;utm_campaign=panfleto_2026
          </p>
        </Panel>

        <section className="grid gap-4 lg:grid-cols-2">
          <Panel title="Páginas mais acessadas">
            <Ranking rows={topPages} empty="Sem visualizações registradas." />
          </Panel>

          <Panel title="Cliques mais frequentes">
            <Ranking rows={topClicks} empty="Sem cliques registrados." />
          </Panel>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Panel title="Checkout por modalidade">
            <Ranking rows={checkoutByModality} empty="Sem checkouts iniciados." />
          </Panel>

          <Panel title="Dispositivos">
            <Ranking rows={topDevices} empty="Sem dados de dispositivo." />
          </Panel>
        </section>

        <Panel title="Eventos recentes">
          {recentEvents.length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhum evento registrado ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs text-zinc-300">
                <thead className="border-b border-white/10 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  <tr>
                    <th className="py-3 pr-3">Quando</th>
                    <th className="py-3 pr-3">Evento</th>
                    <th className="py-3 pr-3">Página</th>
                    <th className="py-3 pr-3">Dispositivo</th>
                    <th className="py-3 pr-3">Detalhe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentEvents.map((event) => (
                    <tr key={event.id}>
                      <td className="py-3 pr-3 text-zinc-500">{formatDateTime(event.createdAt)}</td>
                      <td className="py-3 pr-3 text-zinc-100">{eventLabel(event.eventName)}</td>
                      <td className="py-3 pr-3">{event.path}</td>
                      <td className="py-3 pr-3">{event.device ?? "-"}</td>
                      <td className="py-3 pr-3">
                        {metadataString(event, "label") ||
                          metadataString(event, "modalityName") ||
                          metadataString(event, "href") ||
                          (metadataNumber(event, "seconds")
                            ? formatDuration(metadataNumber(event, "seconds"))
                            : "-")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </main>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  color = "default",
}: {
  title: string;
  value: string;
  subtitle: string;
  color?: "default" | "orange" | "emerald";
}) {
  const cls =
    color === "orange"
      ? "border-orange-500/35 bg-orange-500/10"
      : color === "emerald"
        ? "border-emerald-500/35 bg-emerald-500/10"
        : "border-white/10 bg-black/70";

  return (
    <div className={`rounded-3xl border p-4 text-xs text-zinc-300 ${cls}`}>
      <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-[11px] text-zinc-500">{subtitle}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-black/70 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-300">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Ranking({
  rows,
  empty,
}: {
  rows: { label: string; count: number }[];
  empty: string;
}) {
  if (rows.length === 0) return <p className="text-sm text-zinc-500">{empty}</p>;
  const max = rows[0]?.count ?? 1;

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="flex items-center justify-between gap-4 text-xs">
            <span className="truncate text-zinc-200">{row.label}</span>
            <span className="font-mono text-zinc-500">{row.count}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-orange-500"
              style={{ width: `${Math.max(6, Math.round((row.count / max) * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
