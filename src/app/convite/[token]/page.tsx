import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { hashInviteToken, isInviteToken } from "@/lib/registrationInvites";
import { getModalityById } from "@/config/checkout";
import { CheckoutScreen } from "@/components/checkout/CheckoutScreen";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Inscrição por convite | Titans Race", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = isInviteToken(token) ? await prisma.registrationInvite.findUnique({
    where: { tokenHash: hashInviteToken(token) }, include: { order: { select: { status: true, asaasInvoiceUrl: true } } },
  }) : null;
  const modality = invite ? getModalityById(invite.modalityId) : null;
  const valid = invite && !invite.revokedAt && invite.expiresAt > new Date() && modality;
  return <main className="min-h-screen bg-black px-4 pb-24 pt-28 text-zinc-100"><div className="mx-auto max-w-4xl">
    <h1 className="mb-4 text-3xl font-bold">Inscrição por convite</h1>
    {!valid ? <p>Este convite é inválido, expirou ou foi cancelado. Fale com a organização.</p>
      : invite.claimedAt ? <div className="space-y-4">
        <p>{invite.order?.status === "PAID" ? "A inscrição deste convite já foi confirmada." : "Este convite já foi utilizado para uma inscrição."}</p>
        {invite.order?.status === "PENDING" && invite.order.asaasInvoiceUrl
          ? <a className="inline-block rounded bg-orange-500 px-5 py-3 font-bold text-black" href={invite.order.asaasInvoiceUrl}>Continuar pagamento da inscrição</a>
          : <p>Para dúvidas ou problemas com o pagamento, fale com a organização.</p>}
      </div> : <>
        <p className="mb-6 text-zinc-400">Convite para uma inscrição em {modality.name}. Válido até {invite.expiresAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (Brasília). Após iniciar o pagamento, este link permite apenas continuar a mesma inscrição.</p>
        <CheckoutScreen initialModality={modality} inviteToken={token} />
      </>}
  </div></main>;
}
