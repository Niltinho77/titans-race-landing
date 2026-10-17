"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MODALITIES, getModalityById } from "@/config/checkout";

type Invite = { id: string; label: string; modalityId: string; expiresAt: string; claimedAt: string | null; revokedAt: string | null; order: { id: string; status: string } | null };
const field = "w-full rounded-lg border border-white/20 bg-zinc-900 p-3 text-white";

export default function InviteManager({ invites }: { invites: Invite[] }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [modalityId, setModalityId] = useState("competicao");
  const [validHours, setValidHours] = useState(24);
  const [link, setLink] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function create(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage(""); setLink("");
    try {
      const response = await fetch("/api/admin/registration-invites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label, modalityId, validHours }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível criar o convite.");
      setLink(window.location.origin + data.path); setLabel(""); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Falha ao criar convite."); }
    finally { setBusy(false); }
  }

  async function revoke(id: string) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/registration-invites", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Este convite já foi utilizado ou cancelado.");
      setLink(""); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Falha ao cancelar convite."); }
    finally { setBusy(false); }
  }

  return <div className="space-y-8">
    <form onSubmit={create} className="space-y-4 rounded-xl border border-white/15 p-5">
      <label className="block">Identificação para seu controle<input className={field} value={label} onChange={e => setLabel(e.target.value)} required maxLength={120} placeholder="Ex.: Quarteto da Ana" /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>Modalidade<select className={field} value={modalityId} onChange={e => setModalityId(e.target.value)}>{MODALITIES.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
        <label>Validade em horas<input className={field} type="number" min={1} max={168} required value={validHours} onChange={e => setValidHours(Number(e.target.value))} /></label>
      </div>
      <p className="text-sm text-zinc-400">Uma inscrição por link. Sem vínculo com CPF: quem utilizar primeiro ficará com o convite. O pagamento usa os preços e condições atuais do checkout.</p>
      <button disabled={busy} className="rounded-lg bg-orange-500 px-5 py-3 font-bold text-black disabled:opacity-50">{busy ? "Aguarde..." : "Gerar convite"}</button>
    </form>
    {link && <div className="space-y-3 rounded-xl border border-orange-500/40 p-5">
      <p>Copie este link agora e envie ao atleta. Ele aparece somente nesta criação.</p>
      <input aria-label="Link do convite" className={field} readOnly value={link} onFocus={e => e.target.select()} />
      <button className="rounded border border-white/30 px-4 py-2" onClick={async () => { try { await navigator.clipboard.writeText(link); setMessage("Link copiado."); } catch { setMessage("Selecione e copie o link no campo acima."); } }}>Copiar link</button>
    </div>}
    {message && <p role="status" className="text-orange-200">{message}</p>}
    <div className="space-y-3"><h2 className="text-xl font-semibold">Últimos convites</h2>
      {!invites.length && <p className="text-zinc-400">Nenhum convite criado.</p>}
      {invites.map(i => {
        const expired = new Date(i.expiresAt).getTime() <= Date.now();
        const status = i.revokedAt ? "Cancelado" : i.order?.status === "PAID" ? "Pago" : i.claimedAt ? "Utilizado" : expired ? "Expirado" : "Disponível";
        return <article key={i.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/15 p-4">
          <div><p className="font-semibold">{i.label} · {getModalityById(i.modalityId)?.name}</p>
            <p className="text-sm text-zinc-400">{status} · Validade: {new Date(i.expiresAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (Brasília)</p>
            {i.order && <p className="break-all text-xs text-zinc-500">Pedido {i.order.id} · {i.order.status}</p>}
          </div>
          {!i.claimedAt && !i.revokedAt && !expired && <button disabled={busy} onClick={() => revoke(i.id)} className="rounded border border-red-400/40 px-4 py-2 text-red-200 disabled:opacity-50">Cancelar convite</button>}
        </article>;
      })}
      <p className="text-sm text-zinc-500">Um convite utilizado não é liberado novamente, mesmo se o pagamento falhar ou expirar. Confira a cobrança antes de emitir um novo convite.</p>
    </div>
  </div>;
}
