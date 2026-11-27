"use client";

import Link from "next/link";
import { useState } from "react";
import { TeamPicker, type TeamPickerValue } from "@/components/ranking/TeamPicker";

function formatCPF(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-orange-500";

// Quem já se inscreveu escolhe a equipe informando CPF + e-mail da inscrição.
export function JoinTeamForm() {
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [team, setTeam] = useState<TeamPickerValue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ firstName: string; teamName: string } | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (cpf.replace(/\D/g, "").length !== 11 || !email.includes("@")) {
      setError("Informe o CPF e o e-mail usados na inscrição.");
      return;
    }
    if (!team) {
      setError("Escolha a sua equipe.");
      return;
    }
    setSending(true);
    try {
      const response = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf, email, team: team.choice }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Não foi possível salvar agora.");
      setDone(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar agora.");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
        <p className="heading-adventure text-2xl text-white">Pronto, {done.firstName}!</p>
        <p className="mt-2 text-sm text-emerald-100">
          Você defende a <strong>{done.teamName}</strong> na Titans Race. Chame o seu pessoal para subir no ranking.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/ranking" className="rounded-full bg-orange-500 px-5 py-2 text-xs font-bold uppercase tracking-[0.16em] text-black">
            Ver o ranking
          </Link>
          <button
            type="button"
            onClick={() => {
              setDone(null);
              setTeam(null);
            }}
            className="rounded-full border border-white/20 px-5 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white"
          >
            Escolher para outro atleta
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-white/10 bg-zinc-950 p-5">
      <label className="flex flex-col gap-1 text-xs text-zinc-400">
        CPF da inscrição
        <input value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} inputMode="numeric" maxLength={14} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-zinc-400">
        E-mail da inscrição
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className={inputClass} />
      </label>
      <TeamPicker value={team} onChange={setTeam} />
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={sending}
        className="w-full rounded-full bg-orange-500 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-black disabled:opacity-60"
      >
        {sending ? "Salvando..." : "Salvar minha equipe"}
      </button>
    </form>
  );
}
