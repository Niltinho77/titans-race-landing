import Link from "next/link";
import { notFound } from "next/navigation";
import PortalHeader from "@/components/portal/PortalHeader";
import EventCountdown from "@/components/portal/EventCountdown";
import PortalDocuments from "@/components/portal/PortalDocuments";
import { getModalityById } from "@/config/checkout";
import { prisma } from "@/lib/prisma";
import { BRAZIL_TIME_ZONE } from "@/lib/dateTime";
import {
  changesAreOpen,
  normalizeEmail,
  requirePortalUser,
} from "@/lib/portalAuth";
import ParticipantPortalForm from "./ParticipantPortalForm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

function extrasLabel(extras: Array<{ type: string; size: string | null; quantity: number }>) {
  if (!extras.length) return "Nenhum";
  return extras
    .map((extra) => `${extra.type}${extra.size ? ` (${extra.size})` : ""} x${extra.quantity}`)
    .join(" | ");
}

export default async function ParticipantPortalPage({ params }: PageProps) {
  const user = await requirePortalUser();
  const { id } = await params;

  const participant = await prisma.participant.findFirst({
    where: {
      id,
      order: { status: "PAID" },
      ...(user.role === "ADMIN" ? {} : { email: normalizeEmail(user.email) }),
    },
    include: {
      order: true,
      extras: true,
      changeLogs: {
        orderBy: { createdAt: "desc" },
        take: 8,
      },
    },
  });

  if (!participant) notFound();

  const modality = getModalityById(participant.order.modalityId);

  return (
    <main className="min-h-screen bg-black text-zinc-200">
      <PortalHeader email={user.email} role={user.role} />

      <section className="relative isolate overflow-hidden border-b border-orange-500/20">
        <div
          className="absolute inset-0 -z-20 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url('/images/pag_usuario2.png')" }}
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.44)_0%,#000_92%)] sm:bg-[linear-gradient(90deg,#000_0%,rgba(0,0,0,0.9)_48%,rgba(0,0,0,0.62)_100%)]" />

        <div className="mx-auto grid max-w-6xl gap-6 px-3 py-8 sm:px-4 sm:py-10 md:grid-cols-[1fr_360px] md:gap-8">
          <div className="min-w-0">
            <Link
              href="/portal/minhas-inscricoes"
              className="text-[10px] uppercase tracking-[0.16em] text-zinc-500 hover:text-zinc-200 sm:text-[11px] sm:tracking-[0.18em]"
            >
              Voltar
            </Link>

            <div className="mt-7 sm:mt-8">
              <p className="text-[10px] uppercase tracking-[0.25em] text-orange-300 sm:text-[11px]">
                {modality?.name ?? participant.order.modalityId}
              </p>
              <h1 className="heading-adventure mt-3 break-words text-[3.1rem] leading-[0.88] text-white sm:text-7xl md:text-8xl">
                Voc&ecirc; est&aacute; convocado
              </h1>
              <p className="mt-4 text-base font-semibold text-orange-200 sm:text-lg">
                {participant.fullName}
              </p>
            </div>
          </div>

          <div className="border border-orange-500/30 bg-black/78 p-4 sm:p-5">
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

      <section className="mx-auto max-w-5xl px-3 py-6 sm:px-4 sm:py-8">
        <div className="grid gap-3 border border-white/10 bg-zinc-950 p-4 text-xs text-zinc-400 sm:p-5 md:grid-cols-2">
          <p className="break-all">
            Pedido: <span className="font-mono text-zinc-200">{participant.orderId}</span>
          </p>
          <p>
            Status: <span className="text-emerald-300">Pago</span>
          </p>
          <p>
            CPF: <span className="font-mono text-zinc-200">{participant.cpf}</span>
          </p>
          <p className="break-all">
            E-mail: <span className="text-zinc-200">{participant.email}</span>
          </p>
          <p>
            N&uacute;mero: <span className="font-mono text-zinc-200">{participant.bibNumber ?? "a definir"}</span>
          </p>
          <p>
            Integrante: <span className="text-zinc-200">{participant.teamIndex ?? "individual"}</span>
          </p>
          <p className="md:col-span-2">
            Extras: <span className="text-zinc-100">{extrasLabel(participant.extras)}</span>
          </p>
        </div>

        <div className="mt-5">
          <PortalDocuments />
        </div>

        <div className="mt-5">
          <ParticipantPortalForm
            participantId={participant.id}
            changesOpen={changesAreOpen()}
            initial={{
              phone: participant.phone,
              city: participant.city ?? "",
              state: participant.state ?? "",
              tshirtSize: participant.tshirtSize,
              emergencyName: participant.emergencyName ?? "",
              emergencyPhone: participant.emergencyPhone ?? "",
              healthInfo: participant.healthInfo ?? "",
            }}
          />
        </div>

        {participant.changeLogs.length > 0 && (
          <section className="mt-5 border border-white/10 bg-zinc-950 p-4 sm:p-5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500 sm:text-[11px] sm:tracking-[0.25em]">
              Hist&oacute;rico recente
            </p>
            <div className="mt-3 space-y-2 text-xs text-zinc-400">
              {participant.changeLogs.map((log) => (
                <p key={log.id}>
                  {new Intl.DateTimeFormat("pt-BR", {
                    timeZone: BRAZIL_TIME_ZONE,
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(log.createdAt)}{" "}
                  <span className="text-zinc-200">{log.action}</span>
                </p>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
