import Link from "next/link";
import type { Prisma } from "@prisma/client";
import PortalHeader from "@/components/portal/PortalHeader";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/portalAuth";
import { BRAZIL_TIME_ZONE } from "@/lib/dateTime";
import { getModalityById } from "@/config/checkout";

export const dynamic = "force-dynamic";

type AnalyticsEvent = Prisma.AnalyticsEventGetPayload<object>;
type OrderWithParticipants = Prisma.OrderGetPayload<{ include: { participants: true } }>;

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: BRAZIL_TIME_ZONE,
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

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function channelLabel(source: string | null, campaign: string | null) {
  if (campaign === "panfleto_2026") return "QR do panfleto";
  if (source === "instagram") return "Instagram";
  if (source === "facebook") return "Facebook";
  if (source === "google") return "Google";
  return source || "Direto / não identificado";
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function minutesAgo(minutes: number) {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutes);
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

function countRevenueByChannel(orders: OrderWithParticipants[]) {
  const rows = new Map<string, { count: number; revenue: number }>();
  for (const order of orders) {
    const label = channelLabel(order.source, order.campaign);
    const current = rows.get(label) ?? { count: 0, revenue: 0 };
    current.count += 1;
    current.revenue += order.totalAmountWithFee ?? order.totalAmount ?? 0;
    rows.set(label, current);
  }
  return Array.from(rows.entries())
    .map(([label, value]) => ({ label, ...value }))
    .sort((a, b) => b.revenue - a.revenue);
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

  const [events30, events7, events24h, sponsorshipLeadCount, orders30] =
    await Promise.all([
      prisma.analyticsEvent.findMany({
        where: { createdAt: { gte: since30 } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.analyticsEvent.findMany({
        where: { createdAt: { gte: since7 } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.analyticsEvent.findMany({
        where: { createdAt: { gte: since24h } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.sponsorshipLead.count({ where: { createdAt: { gte: since30 } } }),
      prisma.order.findMany({
        where: { createdAt: { gte: since30 } },
        include: { participants: { orderBy: { id: "asc" } } },
        orderBy: { createdAt: "desc" },
      }),
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

  const uniqueEventSessions = (eventName: string) =>
    new Set(
      events30
        .filter((event) => event.eventName === eventName)
        .map((event) => event.sessionId),
    ).size;
  const checkoutStep1 = uniqueEventSessions("checkout_step_1");
  const checkoutStep2 = uniqueEventSessions("checkout_step_2");
  const checkoutStep3 = uniqueEventSessions("checkout_step_3");
  const checkoutSubmit = uniqueEventSessions("checkout_submit");
  const checkoutCreated = uniqueEventSessions("checkout_order_created");
  const checkoutAbandoned = Math.max(0, checkoutStep1 - checkoutCreated);
  const paidOrders = orders30.filter((order) => order.status === "PAID");
  const recoveryCutoff = minutesAgo(30);
  const recoverableOrders = orders30.filter((order) => {
    if (["FAILED", "OVERDUE", "CANCELED"].includes(order.status)) return true;
    return order.status === "PENDING" && order.createdAt <= recoveryCutoff;
  });
  const paidRevenue = paidOrders.reduce(
    (sum, order) => sum + (order.totalAmountWithFee ?? order.totalAmount ?? 0),
    0,
  );
  const paidAthletes = paidOrders.reduce(
    (sum, order) => sum + order.participants.length,
    0,
  );
  const identifiedOrders = orders30.filter(
    (order) => order.source || order.campaign || order.analyticsSessionId,
  );
  const channelRevenue = countRevenueByChannel(paidOrders);

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
  const flyerCreatedOrders = orders30.filter(
    (order) => order.campaign === "panfleto_2026",
  );
  const flyerPaidOrders = flyerCreatedOrders.filter((order) => order.status === "PAID");

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
              Visão comercial dos últimos 30 dias: interesse, pedidos, pagamentos e oportunidades de recuperação.
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

        <nav className="sticky top-3 z-20 -mx-1 overflow-x-auto rounded-2xl border border-white/10 bg-black/90 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="flex min-w-max gap-1">
            <QuickLink href="#vendas" label="Vendas" />
            <QuickLink href="#recuperacao" label={`Recuperação (${recoverableOrders.length})`} alert={recoverableOrders.length > 0} />
            <QuickLink href="#campanhas" label="Campanhas e QR" />
            <QuickLink href="#funil" label="Funil" />
            <QuickLink href="#audiencia" label="Audiência" />
            <QuickLink href="#diagnostico" label="Diagnóstico" />
          </div>
        </nav>

        <DashboardSection
          id="vendas"
          index="01"
          title="Vendas e receita"
          description="O que virou inscrição paga e dinheiro confirmado. Esta é a visão principal do negócio."
          tone="emerald"
        >
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <MetricCard title="Receita confirmada" value={formatCurrency(paidRevenue)} subtitle="Somente pagamentos confirmados" color="emerald" />
            <MetricCard title="Pedidos pagos" value={String(paidOrders.length)} subtitle={`${paidAthletes} atletas confirmados`} color="emerald" />
            <MetricCard title="Conversão em pagamento" value={percent(paidOrders.length, orders30.length)} subtitle={`${orders30.length} pedidos criados no período`} />
            <MetricCard title="Pedidos identificados" value={String(identifiedOrders.length)} subtitle={`${percent(identifiedOrders.length, orders30.length)} com origem ou sessão`} />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Panel title="Receita confirmada por origem">
              <RevenueRanking rows={channelRevenue} />
            </Panel>
            <Panel title="Outros resultados">
              <MetricCard title="Leads de patrocinadores" value={String(sponsorshipLeadCount)} subtitle="Formulários enviados nos últimos 30 dias" color="orange" />
            </Panel>
          </div>
        </DashboardSection>

        <DashboardSection
          id="recuperacao"
          index="02"
          title="Recuperação de inscrições"
          description="Pessoas que forneceram contato, mas ainda não tiveram pagamento confirmado. Priorize esta lista."
          tone="amber"
          badge={`${recoverableOrders.length} oportunidades`}
        >
          <RecoveryTable orders={recoverableOrders.slice(0, 30)} />
        </DashboardSection>

        <DashboardSection
          id="campanhas"
          index="03"
          title="Campanhas e QR Code"
          description="Desempenho das ações com origem identificada, separado do tráfego geral do site."
          tone="orange"
        >
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <MetricCard title="Leituras do QR" value={String(flyerScans.length)} subtitle="Aberturas do link do panfleto" color="orange" />
            <MetricCard title="Pessoas pelo QR" value={String(flyerVisitors)} subtitle="Visitantes únicos estimados" />
            <MetricCard title="Chegaram ao checkout" value={String(flyerCheckoutVisitors)} subtitle={`${percent(flyerCheckoutVisitors, flyerVisitors)} das pessoas do QR`} />
            <MetricCard title="Pagaram pelo QR" value={String(flyerPaidOrders.length)} subtitle={`${flyerCreatedOrders.length} pedidos criados`} color="emerald" />
          </div>
          <div className="mt-4 rounded-2xl border border-orange-500/15 bg-black/30 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-300/70">Link rastreado do panfleto</p>
            <p className="mt-1 break-all font-mono text-[11px] text-zinc-400">https://titansrace.com.br/?utm_source=panfleto&amp;utm_medium=qrcode&amp;utm_campaign=panfleto_2026</p>
          </div>
        </DashboardSection>

        <DashboardSection
          id="funil"
          index="04"
          title="Funil de inscrição"
          description="Onde as pessoas avançam ou desistem antes de gerar um pedido. Cada etapa conta uma vez por sessão."
          tone="blue"
        >
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <FunnelStep index="1" title="Abriu" value={checkoutStep1} subtitle="checkout" />
            <FunnelStep index="2" title="Preencheu" value={checkoutStep2} subtitle={`${percent(checkoutStep2, checkoutStep1)} avançaram`} />
            <FunnelStep index="3" title="Termos" value={checkoutStep3} subtitle={`${percent(checkoutStep3, checkoutStep1)} avançaram`} />
            <FunnelStep index="4" title="Tentou pagar" value={checkoutSubmit} subtitle="finalizações" />
            <FunnelStep index="5" title="Criou pedido" value={checkoutCreated} subtitle={`${checkoutAbandoned} desistências estimadas`} last />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Panel title="Interesse por modalidade">
              <Ranking rows={checkoutByModality} empty="Sem checkouts iniciados." />
            </Panel>
            <Panel title="Como interpretar">
              <div className="space-y-3 text-xs leading-relaxed text-zinc-400">
                <p><span className="font-semibold text-white">Funil:</span> mede intenção e avanço dentro do checkout.</p>
                <p><span className="font-semibold text-white">Pedidos:</span> surgem somente depois que os dados foram enviados.</p>
                <p><span className="font-semibold text-emerald-300">Venda:</span> só é contabilizada quando o gateway confirma o pagamento.</p>
              </div>
            </Panel>
          </div>
        </DashboardSection>

        <DashboardSection
          id="audiencia"
          index="05"
          title="Audiência e comportamento"
          description="Como o público navega pelo site. Estes números são estimativas de navegador, não vendas."
          tone="zinc"
        >
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <MetricCard title="Visitantes estimados" value={String(uniqueSessions30)} subtitle={`${uniqueSessions7} nos últimos 7 dias`} />
            <MetricCard title="Visitantes nas últimas 24h" value={String(uniqueSessions24h)} subtitle={`${events24h.length} interações registradas`} color="orange" />
            <MetricCard title="Páginas visualizadas" value={String(pageViews30.length)} subtitle={`${pageViews7.length} nos últimos 7 dias`} />
            <MetricCard title="Tempo médio" value={formatDuration(avgSeconds)} subtitle="Estimativa enviada pelo navegador" />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Panel title="Páginas mais acessadas"><Ranking rows={topPages} empty="Sem visualizações registradas." /></Panel>
            <Panel title="Cliques mais frequentes"><Ranking rows={topClicks} empty="Sem cliques registrados." /></Panel>
            <Panel title="Dispositivos"><Ranking rows={topDevices} empty="Sem dados de dispositivo." /></Panel>
          </div>
        </DashboardSection>

        <DashboardSection
          id="diagnostico"
          index="06"
          title="Diagnóstico técnico"
          description="Dados detalhados para conferência. Não são necessários para a rotina comercial diária."
          tone="zinc"
        >
          <details className="group rounded-2xl border border-white/10 bg-black/40">
            <summary className="cursor-pointer list-none px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-300">
              Ver os 25 eventos mais recentes
              <span className="ml-2 text-zinc-600 group-open:hidden">+</span>
              <span className="ml-2 hidden text-zinc-600 group-open:inline">−</span>
            </summary>
            <div className="border-t border-white/10 p-4">
              {recentEvents.length === 0 ? (
                <p className="text-sm text-zinc-500">Nenhum evento registrado ainda.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-xs text-zinc-300">
                    <thead className="border-b border-white/10 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                      <tr><th className="py-3 pr-3">Quando</th><th className="py-3 pr-3">Evento</th><th className="py-3 pr-3">Página</th><th className="py-3 pr-3">Dispositivo</th><th className="py-3 pr-3">Detalhe</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {recentEvents.map((event) => (
                        <tr key={event.id}>
                          <td className="py-3 pr-3 text-zinc-500">{formatDateTime(event.createdAt)}</td>
                          <td className="py-3 pr-3 text-zinc-100">{eventLabel(event.eventName)}</td>
                          <td className="py-3 pr-3">{event.path}</td>
                          <td className="py-3 pr-3">{event.device ?? "-"}</td>
                          <td className="py-3 pr-3">{metadataString(event, "label") || metadataString(event, "modalityName") || metadataString(event, "href") || (metadataNumber(event, "seconds") ? formatDuration(metadataNumber(event, "seconds")) : "-")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </details>
        </DashboardSection>
      </div>
    </main>
  );
}

function QuickLink({ href, label, alert = false }: { href: string; label: string; alert?: boolean }) {
  return (
    <a
      href={href}
      className={`rounded-xl px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition hover:bg-white/10 ${
        alert ? "bg-amber-500/15 text-amber-300" : "text-zinc-400 hover:text-white"
      }`}
    >
      {label}
    </a>
  );
}

function DashboardSection({
  id,
  index,
  title,
  description,
  tone,
  badge,
  children,
}: {
  id: string;
  index: string;
  title: string;
  description: string;
  tone: "emerald" | "amber" | "orange" | "blue" | "zinc";
  badge?: string;
  children: React.ReactNode;
}) {
  const toneClasses = {
    emerald: "border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.09] via-black/80 to-black/80",
    amber: "border-amber-500/30 bg-gradient-to-br from-amber-500/[0.10] via-black/80 to-black/80",
    orange: "border-orange-500/25 bg-gradient-to-br from-orange-500/[0.09] via-black/80 to-black/80",
    blue: "border-sky-500/25 bg-gradient-to-br from-sky-500/[0.08] via-black/80 to-black/80",
    zinc: "border-white/10 bg-gradient-to-br from-white/[0.04] via-black/80 to-black/80",
  };
  const accentClasses = {
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    orange: "text-orange-400",
    blue: "text-sky-400",
    zinc: "text-zinc-500",
  };

  return (
    <section id={id} className={`scroll-mt-24 rounded-[28px] border p-4 sm:p-6 ${toneClasses[tone]}`}>
      <header className="mb-5 flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span className={`font-mono text-xs font-bold ${accentClasses[tone]}`}>{index}</span>
          <div>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">{title}</h2>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-zinc-400 sm:text-sm">{description}</p>
          </div>
        </div>
        {badge && (
          <span className="w-fit rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-300">
            {badge}
          </span>
        )}
      </header>
      {children}
    </section>
  );
}

function FunnelStep({
  index,
  title,
  value,
  subtitle,
  last = false,
}: {
  index: string;
  title: string;
  value: number;
  subtitle: string;
  last?: boolean;
}) {
  return (
    <div className={`relative rounded-2xl border p-3 sm:p-4 ${last ? "col-span-2 border-emerald-500/30 bg-emerald-500/10 md:col-span-1" : "border-sky-500/20 bg-sky-500/[0.06]"}`}>
      <p className="font-mono text-[10px] text-sky-400/70">ETAPA {index}</p>
      <p className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs font-semibold text-zinc-200">{title}</p>
      <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">{subtitle}</p>
    </div>
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
    <div className={`min-w-0 rounded-2xl border p-3 text-xs text-zinc-300 sm:rounded-3xl sm:p-4 ${cls}`}>
      <p className="text-[9px] uppercase leading-relaxed tracking-[0.16em] text-zinc-500 sm:text-[11px] sm:tracking-[0.25em]">{title}</p>
      <p className="mt-2 break-words text-xl font-semibold leading-tight text-white sm:text-3xl">{value}</p>
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

function RevenueRanking({
  rows,
}: {
  rows: { label: string; count: number; revenue: number }[];
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-zinc-500">Nenhum pagamento confirmado no período.</p>;
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
          <div>
            <p className="text-sm font-semibold text-zinc-100">{row.label}</p>
            <p className="mt-1 text-[11px] text-zinc-500">{row.count} pagamentos</p>
          </div>
          <p className="font-mono text-sm text-emerald-300">{formatCurrency(row.revenue)}</p>
        </div>
      ))}
    </div>
  );
}

function RecoveryTable({ orders }: { orders: OrderWithParticipants[] }) {
  if (orders.length === 0) {
    return <p className="text-sm text-zinc-500">Nenhum pedido não pago com contato nos últimos 30 dias.</p>;
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {orders.map((order) => {
          const details = recoveryDetails(order);
          return (
            <article key={`mobile-${order.id}`} className="rounded-2xl border border-white/10 bg-black/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{details.participant?.fullName || "Sem nome"}</p>
                  <p className="mt-1 text-[10px] text-zinc-500">{formatDateTime(order.createdAt)} · {details.modalityName}</p>
                </div>
                <StatusPill label={details.statusLabel} className={details.statusClass} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-[11px]">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.14em] text-zinc-600">Valor</p>
                  <p className="mt-1 font-mono font-semibold text-zinc-100">{formatCurrency(order.totalAmountWithFee ?? order.totalAmount ?? 0)}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.14em] text-zinc-600">Origem</p>
                  <p className="mt-1 truncate text-zinc-300">{channelLabel(order.source, order.campaign)}</p>
                </div>
              </div>

              <div className="mt-3 text-[11px] text-zinc-400">
                <p>{details.participant?.phone || "Sem telefone"}</p>
                <p className="mt-1 truncate text-zinc-500">{details.participant?.email || "Sem e-mail"}</p>
              </div>

              {details.whatsappHref ? (
                <a href={details.whatsappHref} target="_blank" rel="noreferrer" className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-black active:bg-emerald-400">
                  Chamar no WhatsApp
                </a>
              ) : (
                <p className="mt-4 rounded-xl border border-white/10 px-4 py-3 text-center text-[11px] text-zinc-600">Sem telefone para contato</p>
              )}
            </article>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[980px] text-left text-xs text-zinc-300">
        <thead className="border-b border-white/10 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
          <tr>
            <th className="py-3 pr-3">Quando</th>
            <th className="py-3 pr-3">Pessoa</th>
            <th className="py-3 pr-3">Contato</th>
            <th className="py-3 pr-3">Modalidade</th>
            <th className="py-3 pr-3">Valor</th>
            <th className="py-3 pr-3">Situação</th>
            <th className="py-3 pr-3">Origem</th>
            <th className="py-3 text-right">Ação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {orders.map((order) => {
            const details = recoveryDetails(order);

            return (
              <tr key={order.id}>
                <td className="py-3 pr-3 text-zinc-500">{formatDateTime(order.createdAt)}</td>
                <td className="py-3 pr-3 font-semibold text-zinc-100">{details.participant?.fullName || "Sem nome"}</td>
                <td className="py-3 pr-3">
                  <p>{details.participant?.phone || "-"}</p>
                  <p className="mt-1 text-zinc-500">{details.participant?.email || "-"}</p>
                </td>
                <td className="py-3 pr-3">{details.modalityName}</td>
                <td className="py-3 pr-3 font-mono text-zinc-100">{formatCurrency(order.totalAmountWithFee ?? order.totalAmount ?? 0)}</td>
                <td className="py-3 pr-3"><StatusPill label={details.statusLabel} className={details.statusClass} /></td>
                <td className="py-3 pr-3">{channelLabel(order.source, order.campaign)}</td>
                <td className="py-3 text-right">
                  {details.whatsappHref ? (
                    <a
                      href={details.whatsappHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-full bg-emerald-500 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-black hover:bg-emerald-400"
                    >
                      Chamar no WhatsApp
                    </a>
                  ) : (
                    <span className="text-zinc-600">Sem telefone</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </>
  );
}

function recoveryDetails(order: OrderWithParticipants) {
  const participant = order.participants[0];
  const phone = participant?.phone.replace(/\D/g, "") ?? "";
  const whatsappPhone = phone.startsWith("55") ? phone : `55${phone}`;
  const paymentLink = order.asaasInvoiceUrl
    ? ` Você pode continuar por aqui: ${order.asaasInvoiceUrl}`
    : "";
  const message = `Olá, ${participant?.fullName?.split(" ")[0] || "atleta"}! Vi que sua inscrição na Titans Race ainda não foi concluída. Posso ajudar com o pagamento?${paymentLink}`;
  const labels: Record<string, string> = {
    PENDING: "Aguardando",
    FAILED: "Falhou",
    OVERDUE: "Vencido",
    CANCELED: "Cancelado",
  };

  return {
    participant,
    modalityName: getModalityById(order.modalityId)?.name ?? order.modalityId,
    statusLabel: labels[order.status] ?? order.status,
    statusClass: order.status === "PENDING"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
      : "border-red-500/30 bg-red-500/10 text-red-300",
    whatsappHref: phone
      ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`
      : null,
  };
}

function StatusPill({ label, className }: { label: string; className: string }) {
  return <span className={`inline-flex shrink-0 rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${className}`}>{label}</span>;
}
