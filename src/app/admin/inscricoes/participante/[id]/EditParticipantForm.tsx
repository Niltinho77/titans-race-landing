"use client";

import { useMemo, useState } from "react";

type ExtraRow = { id: string; type: string; size: string | null; quantity: number };

const EXTRA_TYPES = [
  { value: "camisa", label: "Camisa" },
  { value: "luva", label: "Luva" },
  { value: "meia", label: "Meia" },
] as const;

const EXTRA_SIZES = ["PP", "P", "M", "G", "GG"] as const;

export default function EditParticipantForm({
  initial,
}: {
  initial: {
    id: string;
    orderId: string;
    fullName: string;
    cpf: string;
    birthDate: string;
    phone: string;
    email: string;
    city: string;
    state: string;
    tshirtSize: string;
    emergencyName: string;
    emergencyPhone: string;
    healthInfo: string;
    bibNumber: number | null;
    teamIndex: number | null;
    extras: ExtraRow[];
  };
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // ✅ Novo: estado do "Adicionar extra"
  const [newExtra, setNewExtra] = useState<{
    type: string;
    size: string;
    quantity: number;
  }>({ type: "camisa", size: "M", quantity: 1 });

  const normalized = useMemo(() => {
    const onlyDigits = (v: string) => (v ?? "").replace(/\D/g, "");
    return {
      ...form,
      cpf: onlyDigits(form.cpf).slice(0, 11),
      phone: onlyDigits(form.phone).slice(0, 11),
      emergencyPhone: onlyDigits(form.emergencyPhone).slice(0, 11),
      state: (form.state ?? "").toUpperCase().slice(0, 2),
      email: (form.email ?? "").trim().toLowerCase(),
    };
  }, [form]);

  async function save() {
    setSaving(true);
    setMsg(null);
    setErr(null);

    try {
      const res = await fetch(`/api/admin/participants/${initial.id}`, {
        // ⚠️ Seu endpoint precisa aceitar PATCH. Se estiver dando 405,
        // confirme que o route.ts exporta PATCH e não POST.
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          cpf: form.cpf,
          birthDate: form.birthDate,
          phone: form.phone,
          email: form.email,
          city: form.city,
          state: form.state,
          tshirtSize: form.tshirtSize,
          emergencyName: form.emergencyName,
          emergencyPhone: form.emergencyPhone,
          healthInfo: form.healthInfo,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Falha ao salvar.");

      setMsg("Salvo com sucesso.");
    } catch (e: any) {
      setErr(e?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function removeExtra(extraId: string) {
    setSaving(true);
    setMsg(null);
    setErr(null);

    try {
      const res = await fetch(`/api/admin/participant-extras/${extraId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Falha ao remover extra.");

      setForm((prev) => ({
        ...prev,
        extras: prev.extras.filter((e) => e.id !== extraId),
      }));
      setMsg("Extra removido.");
    } catch (e: any) {
      setErr(e?.message || "Erro ao remover.");
    } finally {
      setSaving(false);
    }
  }

  // ✅ Novo: Adicionar extra (não “trocar”)
  async function addExtra() {
    setSaving(true);
    setMsg(null);
    setErr(null);

    try {
      const payload = {
        type: (newExtra.type || "").trim(),
        size: (newExtra.size || "").trim() || null,
        quantity: Math.max(1, Math.round(Number(newExtra.quantity || 1))),
      };

      if (!payload.type) {
        throw new Error("Selecione o tipo do extra.");
      }

      const res = await fetch(`/api/admin/participants/${initial.id}/extras`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Falha ao adicionar extra.");

      // backend devolve extras atualizados
      setForm((prev) => ({ ...prev, extras: data.extras ?? prev.extras }));
      setMsg("Extra adicionado ✅");
      setNewExtra((p) => ({ ...p, quantity: 1 }));
    } catch (e: any) {
      setErr(e?.message || "Erro no extra.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Nome" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} />
        <Field label="CPF" value={form.cpf} onChange={(v) => setForm({ ...form, cpf: v })} />
        <Field label="Nascimento (dd/mm/aaaa)" value={form.birthDate} onChange={(v) => setForm({ ...form, birthDate: v })} />
        <Field label="Telefone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <Field label="E-mail" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <Field label="Cidade" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
        <Field label="UF" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
        <Field label="Camiseta" value={form.tshirtSize} onChange={(v) => setForm({ ...form, tshirtSize: v })} />
        <Field label="Emergência (nome)" value={form.emergencyName} onChange={(v) => setForm({ ...form, emergencyName: v })} />
        <Field label="Emergência (fone)" value={form.emergencyPhone} onChange={(v) => setForm({ ...form, emergencyPhone: v })} />
      </div>

      <div>
        <label className="text-xs text-zinc-400">Saúde (opcional)</label>
        <textarea
          value={form.healthInfo}
          onChange={(e) => setForm({ ...form, healthInfo: e.target.value })}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-orange-500"
          rows={3}
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/60 p-4">
        <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">Extras</p>

        {/* ✅ Novo: Adicionar extra */}
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="text-xs text-zinc-400">Tipo</label>
            <select
              value={newExtra.type}
              onChange={(e) => setNewExtra((p) => ({ ...p, type: e.target.value }))}
              disabled={saving}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-orange-500"
            >
              {EXTRA_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-zinc-400">Tamanho</label>
            <select
              value={newExtra.size}
              onChange={(e) => setNewExtra((p) => ({ ...p, size: e.target.value }))}
              disabled={saving}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-orange-500"
            >
              {EXTRA_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-zinc-400">Quantidade</label>
            <input
              type="number"
              min={1}
              value={newExtra.quantity}
              onChange={(e) =>
                setNewExtra((p) => ({
                  ...p,
                  quantity: Math.max(1, Math.round(Number(e.target.value || 1))),
                }))
              }
              disabled={saving}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={addExtra}
            disabled={saving}
            className="rounded-full border border-white/10 bg-orange-500 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black hover:bg-orange-400 disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Adicionar extra"}
          </button>

          <p className="text-[11px] text-zinc-500">
            Dica: adicionar soma no mesmo tipo (se já existir).
          </p>
        </div>

        {/* lista */}
        <div className="mt-4 space-y-2">
          {form.extras.length === 0 ? (
            <p className="text-xs text-zinc-400">Sem extras.</p>
          ) : (
            form.extras.map((e) => (
              <div
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/40 p-3 text-xs"
              >
                <div className="text-zinc-200">
                  {e.type} {e.size ? `(${e.size})` : ""} x{e.quantity}
                </div>
                <button
                  type="button"
                  onClick={() => removeExtra(e.id)}
                  disabled={saving}
                  className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-200 hover:bg-red-500/15 disabled:opacity-60"
                >
                  Remover
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {msg && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
          {msg}
        </div>
      )}
      {err && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
          {err}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-full bg-orange-500 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>

        <div className="text-[11px] text-zinc-500">
          Normalizado: CPF {normalized.cpf} · Fone {normalized.phone}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1 text-xs">
      <label className="text-zinc-400">{label}</label>
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-orange-500"
      />
    </div>
  );
}