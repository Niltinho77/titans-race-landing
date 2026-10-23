import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/portalAuth";
import PortalHeader from "@/components/portal/PortalHeader";
import InviteManager from "./InviteManager";

export const dynamic = "force-dynamic";

export default async function InvitesPage() {
  const user = await requireAdminUser();
  const invites = await prisma.registrationInvite.findMany({ orderBy: { createdAt: "desc" }, take: 100,
    select: { id: true, label: true, modalityId: true, expiresAt: true, claimedAt: true, revokedAt: true, order: { select: { id: true, status: true } } },
  });
  return <main className="min-h-screen bg-black text-zinc-100">
    <PortalHeader email={user.email} role={user.role} />
    <div className="mx-auto max-w-5xl px-4 py-10"><h1 className="text-3xl font-bold">Convites de inscrição</h1>
      <p className="mb-8 mt-3 text-zinc-400">Cada convite permite um pedido: individual, dupla ou quarteto, conforme a modalidade.</p>
      <InviteManager invites={invites.map(i => ({ ...i, expiresAt: i.expiresAt.toISOString(), claimedAt: i.claimedAt?.toISOString() ?? null, revokedAt: i.revokedAt?.toISOString() ?? null }))} />
    </div>
  </main>;
}
