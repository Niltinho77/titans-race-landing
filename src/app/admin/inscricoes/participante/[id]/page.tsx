import { prisma } from "@/lib/prisma";
import Link from "next/link";
import EditParticipantForm from "./EditParticipantForm";
import { requireAdminUser } from "@/lib/portalAuth";
import PortalHeader from "@/components/portal/PortalHeader";

export const dynamic = "force-dynamic";

export default async function EditParticipantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdminUser();
  const { id } = await params; // ✅ DESENROLA params (Promise) antes de usar

  const participant = await prisma.participant.findUnique({
    where: { id },
    include: { extras: true, order: true },
  });

  if (!participant) {
    return (
      <main className="min-h-screen bg-black pb-24 text-zinc-200">
        <PortalHeader email={user.email} role={user.role} />
        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-white/10 bg-black/70 p-6">
          Participante não encontrado.
          <div className="mt-4">
            <Link className="text-orange-300 underline" href="/portal/admin/inscricoes">
              Voltar
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black pb-24 text-zinc-200">
      <PortalHeader email={user.email} role={user.role} />
      <div className="mx-auto max-w-3xl space-y-4 px-4 pt-10">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              Editar participante
            </p>
            <h1 className="text-2xl font-semibold text-white">
              {participant.fullName}
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              Pedido: <span className="font-mono">{participant.orderId}</span> ·{" "}
              Modalidade:{" "}
              <span className="font-mono">{participant.order.modalityId}</span>
            </p>
          </div>

          <Link
            href="/portal/admin/inscricoes"
            className="rounded-full border border-white/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-100 hover:bg-white/5"
          >
            Voltar
          </Link>
        </header>

        <div className="rounded-3xl border border-white/10 bg-black/70 p-5">
          <EditParticipantForm
            initial={{
              id: participant.id,
              orderId: participant.orderId,
              fullName: participant.fullName,
              cpf: participant.cpf,
              birthDate: participant.birthDate,
              phone: participant.phone,
              email: participant.email,
              city: participant.city ?? "",
              state: participant.state ?? "",
              tshirtSize: participant.tshirtSize,
              emergencyName: participant.emergencyName ?? "",
              emergencyPhone: participant.emergencyPhone ?? "",
              healthInfo: participant.healthInfo ?? "",
              bibNumber: participant.bibNumber ?? null,
              teamIndex: participant.teamIndex ?? null,
              extras: participant.extras.map((e) => ({
                id: e.id,
                type: e.type,
                size: e.size,
                quantity: e.quantity,
              })),
            }}
          />
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/70 p-5 text-xs text-zinc-400">
          Dica: para CPF/telefone, pode colar com pontos e traços que o sistema
          normaliza.
        </div>
      </div>
    </main>
  );
}
