"use client";

import { useState } from "react";

type ParticipantFormState = {
  phone: string;
  city: string;
  state: string;
  tshirtSize: string;
  emergencyName: string;
  emergencyPhone: string;
  healthInfo: string;
};

type TransferState = {
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
  termsAccepted: boolean;
};

const TSHIRT_SIZES = [
  "Camiseta PP",
  "Camiseta P",
  "Camiseta M",
  "Camiseta G",
  "Camiseta GG",
  "Baby Look - PP",
  "Baby Look - P",
  "Baby Look - M",
  "Baby Look - G",
  "Baby Look - GG",
  "Infantil 8",
  "Infantil 10",
  "Infantil 12",
  "Infantil 14",
];

export default function ParticipantPortalForm({
  participantId,
  initial,
  changesOpen,
}: {
  participantId: string;
  initial: ParticipantFormState;
  changesOpen: boolean;
}) {
  const [form, setForm] = useState(initial);
  const [transfer, setTransfer] = useState<TransferState>({
    fullName: "",
    cpf: "",
    birthDate: "",
    phone: "",
    email: "",
    city: "",
    state: "",
    tshirtSize: initial.tshirtSize,
    emergencyName: "",
    emergencyPhone: "",
    healthInfo: "",
    termsAccepted: false,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch(`/api/portal/participants/${participantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Falha ao salvar.");
      setMessage("Dados atualizados com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function transferRegistration() {
    const confirmed = window.confirm(
      "Confirmar transferência? Seus dados serão substituídos pelos dados do novo participante."
    );
    if (!confirmed) return;

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch(`/api/portal/participants/${participantId}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transfer),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Falha na transferência.");
      setMessage("Inscrição transferida. O novo participante receberá um e-mail para definir a senha.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na transferência.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {!changesOpen && (
        <div className="border border-yellow-500/30 bg-yellow-500/10 p-4 text-xs text-yellow-100">
          O prazo para alterações pelo portal foi encerrado.
        </div>
      )}

      <section className="border border-white/10 bg-zinc-950 p-4 sm:p-5">
        <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500 sm:text-[11px] sm:tracking-[0.25em]">
          Dados editáveis
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Telefone / WhatsApp" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="Cidade" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
          <Field label="UF" value={form.state} onChange={(v) => setForm({ ...form, state: v.toUpperCase().slice(0, 2) })} />
          <Select label="Tamanho da camiseta" value={form.tshirtSize} onChange={(v) => setForm({ ...form, tshirtSize: v })} />
          <Field label="Contato de emergência" value={form.emergencyName} onChange={(v) => setForm({ ...form, emergencyName: v })} />
          <Field label="Telefone do contato" value={form.emergencyPhone} onChange={(v) => setForm({ ...form, emergencyPhone: v })} />
        </div>

        <label className="mt-3 block text-xs text-zinc-400">
          Condição de saúde relevante
          <textarea
            value={form.healthInfo}
            onChange={(event) => setForm({ ...form, healthInfo: event.target.value })}
            rows={3}
            className="mt-1 w-full border border-white/10 bg-black/60 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-orange-500"
          />
        </label>

        <button
          type="button"
          onClick={save}
          disabled={saving || !changesOpen}
          className="mt-5 w-full bg-orange-500 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-black hover:bg-orange-400 disabled:opacity-60 sm:w-auto sm:px-5 sm:text-xs sm:tracking-[0.18em]"
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </section>

      <section className="border border-white/10 bg-zinc-950 p-4 sm:p-5">
        <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500 sm:text-[11px] sm:tracking-[0.25em]">
          Transferência de inscrição
        </p>
        <p className="mt-2 text-xs text-zinc-400">
          A transferência mantém pedido, modalidade, pagamento e extras. Os dados do participante atual serão substituídos.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Nome completo" value={transfer.fullName} onChange={(v) => setTransfer({ ...transfer, fullName: v })} />
          <Field label="CPF" value={transfer.cpf} onChange={(v) => setTransfer({ ...transfer, cpf: v })} />
          <Field label="Data de nascimento" value={transfer.birthDate} onChange={(v) => setTransfer({ ...transfer, birthDate: v })} />
          <Field label="Telefone / WhatsApp" value={transfer.phone} onChange={(v) => setTransfer({ ...transfer, phone: v })} />
          <Field label="E-mail" value={transfer.email} onChange={(v) => setTransfer({ ...transfer, email: v })} type="email" />
          <Field label="Cidade" value={transfer.city} onChange={(v) => setTransfer({ ...transfer, city: v })} />
          <Field label="UF" value={transfer.state} onChange={(v) => setTransfer({ ...transfer, state: v.toUpperCase().slice(0, 2) })} />
          <Select label="Tamanho da camiseta" value={transfer.tshirtSize} onChange={(v) => setTransfer({ ...transfer, tshirtSize: v })} />
          <Field label="Contato de emergência" value={transfer.emergencyName} onChange={(v) => setTransfer({ ...transfer, emergencyName: v })} />
          <Field label="Telefone do contato" value={transfer.emergencyPhone} onChange={(v) => setTransfer({ ...transfer, emergencyPhone: v })} />
        </div>

        <label className="mt-3 block text-xs text-zinc-400">
          Condição de saúde relevante
          <textarea
            value={transfer.healthInfo}
            onChange={(event) => setTransfer({ ...transfer, healthInfo: event.target.value })}
            rows={3}
            className="mt-1 w-full border border-white/10 bg-black/60 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-orange-500"
          />
        </label>

        <label className="mt-4 flex items-start gap-2 text-xs text-zinc-300">
          <input
            type="checkbox"
            checked={transfer.termsAccepted}
            onChange={(event) => setTransfer({ ...transfer, termsAccepted: event.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border-white/20 bg-black"
          />
          <span>
            O novo participante declara estar ciente e de acordo com o regulamento e termo de responsabilidade da Titans Race.
          </span>
        </label>

        <button
          type="button"
          onClick={transferRegistration}
          disabled={saving || !changesOpen}
          className="mt-5 w-full border border-red-500/40 bg-red-500/10 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-100 hover:bg-red-500/15 disabled:opacity-60 sm:w-auto sm:px-5 sm:text-xs sm:tracking-[0.18em]"
        >
          Transferir inscrição
        </button>
      </section>

      {message && (
        <div className="border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-200">
          {message}
        </div>
      )}
      {error && (
        <div className="border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-200">
          {error}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-xs text-zinc-400">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full border border-white/10 bg-black/60 px-3 py-3 text-sm text-zinc-100 outline-none focus:border-orange-500 sm:py-2 sm:text-xs"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-xs text-zinc-400">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full border border-white/10 bg-black/60 px-3 py-3 text-sm text-zinc-100 outline-none focus:border-orange-500 sm:py-2 sm:text-xs"
      >
        {TSHIRT_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </label>
  );
}
