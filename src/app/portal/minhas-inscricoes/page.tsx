import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { normalizeEmail, requirePortalUser } from "@/lib/portalAuth";
import PortalHeader from "@/components/portal/PortalHeader";
import EventCountdown from "@/components/portal/EventCountdown";
import PortalDocuments from "@/components/portal/PortalDocuments";
import { getModalityById } from "@/config/checkout";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function extrasLabel(extras: Array<{ type: string; size: string | null; quantity: number }>) {
  if (!extras.length) return "Nenhum";
  return extras
    .map((extra) => `${extra.type}${extra.size ? ` (${extra.size})` : ""} x${extra.quantity}`)
    .join(" | ");
}

export default async function MyRegistrationsPage() {
  const user = await requirePortalUser();
  const participants = await prisma.participant.findMany({
    where: {
      email: normalizeEmail(user.email),
      order: { status: "PAID" },
    },
    include: {
      order: true,
      extras: true,
    },
    orderBy: { fullName: "asc" },
  });

  const primaryName = participants[0]?.fullName ?? user.name ?? "Atleta Titans";

  return (
    <main className="min-h-screen bg-black text-zinc-200">
      <PortalHeader email={user.email} role={user.role} />

      <section className="relative isolate overflow-hidden border-b border-orange-500/20">
        <div
          className="absolute inset-0 -z-20 bg-cover bg-center opacity-45 sm:opacity-50"
          style={{ backgroundImage: "url('/images/pag_usuario1.png')" }}
        />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_15%,rgba(249,115,22,0.32),transparent_30%),linear-gradient(180deg,rgba(0,0,0,0.42)_0%,#000_92%)] sm:bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.28),transparent_32%),linear-gradient(90deg,#000_0%,rgba(0,0,0,0.88)_38%,rgba(0,0,0,0.62)_100%)]" />

        <div className="mx-auto grid min-h-[560px] max-w-6xl content-end gap-6 px-3 pb-8 pt-12 sm:px-4 sm:pb-10 md:min-h-[520px] md:grid-cols-[1.1fr_0.9fr] md:items-end md:gap-8 md:pb-14">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.3em] text-orange-300 sm:text-[11px] sm:tracking-[0.35em]">
              Portal do inscrito
            </p>
            <h1 className="heading-adventure mt-4 max-w-3xl text-[3.25rem] leading-[0.86] text-white sm:text-7xl md:text-8xl">
              Voc&ecirc; est&aacute; convocado
            </h1>
            <p className="mt-4 max-w-xl text-base font-semibold text-orange-200 sm:text-lg">
              {primaryName}
            </p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-300">
              Sua inscri&ccedil;&atilde;o est&aacute; confirmada. A arena Titans espera por voc&ecirc; em 15 de novembro.
            </p>
          </div>

          <div className="border border-orange-500/30 bg-black/78 p-4 shadow-[0_24px_90px_rgba(0,0,0,0.62)] sm:p-5">
            <p className="text-[10px] uppercase tracking-[0.25em] text-orange-300 sm:text-[11px]">
              Faltam
            </p>
            <h2 className="heading-adventure mt-1 text-3xl leading-none text-white sm:text-4xl">
              Para a largada
            </h2>
            <div className="mt-4">
              <EventCountdown />
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-3 py-8 sm:px-4 sm:py-10">
        <div
          className="pointer-events-none absolute right-4 top-6 hidden h-44 w-44 bg-contain bg-center bg-no-repeat opacity-20 md:block"
          style={{ backgroundImage: "url('/images/pag_usuario2.png')" }}
        />

        <div className="mb-5 flex flex-col gap-2 sm:mb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 sm:text-[11px]">
              &Aacute;rea do atleta
            </p>
            <h2 className="heading-adventure mt-2 text-3xl text-white sm:text-4xl">
              Minhas inscri&ccedil;&otilde;es
            </h2>
          </div>
          <p className="text-xs text-zinc-500">
            {participants.length} {participants.length === 1 ? "inscri&ccedil;&atilde;o encontrada" : "inscri&ccedil;&otilde;es encontradas"}
          </p>
        </div>

        <div className="mb-5">
          <PortalDocuments />
        </div>

        {participants.length === 0 ? (
          <div className="border border-white/10 bg-zinc-950 p-5 text-sm text-zinc-300 sm:p-6">
            Nenhuma inscri&ccedil;&atilde;o paga foi encontrada para este e-mail.
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            {participants.map((participant) => {
              const modality = getModalityById(participant.order.modalityId);

              return (
                <Link
                  key={participant.id}
                  href={`/portal/inscricao/${participant.id}`}
                  className="group relative overflow-hidden border border-white/10 bg-zinc-950 p-4 transition hover:border-orange-500/60 sm:p-5"
                >
                  <div className="absolute inset-y-0 right-0 w-20 bg-orange-500/10 opacity-60 sm:w-24 sm:opacity-0 sm:transition sm:group-hover:opacity-100" />
                  <div className="relative flex min-h-52 flex-col justify-between gap-5 sm:min-h-56">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="border border-orange-500/35 bg-orange-500/10 px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-orange-200 sm:px-3 sm:text-[10px] sm:tracking-[0.2em]">
                          {modality?.name ?? participant.order.modalityId}
                        </span>
                        <span className="border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-emerald-200 sm:px-3 sm:text-[10px] sm:tracking-[0.2em]">
                          Pago
                        </span>
                      </div>

                      <h3 className="mt-4 break-words text-xl font-semibold leading-tight text-white sm:text-2xl">
                        {participant.fullName}
                      </h3>
                    </div>

                    <div className="grid gap-2 text-xs text-zinc-400">
                      <p className="break-all">
                        Pedido: <span className="font-mono text-zinc-200">{participant.orderId}</span>
                      </p>
                      <p>
                        Inscri&ccedil;&atilde;o: <span className="text-zinc-200">{formatDate(participant.order.createdAt)}</span>
                      </p>
                      <p>
                        Camiseta: <span className="text-zinc-200">{participant.tshirtSize}</span>
                      </p>
                      <p>
                        Extras: <span className="text-zinc-200">{extrasLabel(participant.extras)}</span>
                      </p>
                    </div>

                    <span className="w-fit bg-orange-500 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-black transition group-hover:bg-orange-400 sm:text-[11px] sm:tracking-[0.18em]">
                      Abrir inscri&ccedil;&atilde;o
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
