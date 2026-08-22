"use client";

import { useState } from "react";

export default function SetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);

    try {
      if (password !== confirmPassword) {
        throw new Error("As senhas não conferem.");
      }

      const res = await fetch("/api/portal/password/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Não foi possível definir a senha.");
      window.location.href = data.redirectTo || "/portal/minhas-inscricoes";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível definir a senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-black/75 p-6 text-sm text-zinc-200">
      <p className="text-[11px] uppercase tracking-[0.25em] text-orange-300">
        Portal Titans Race
      </p>
      <h1 className="heading-adventure mt-2 text-3xl text-white">Definir senha</h1>

      <div className="mt-6 space-y-3">
        <Field label="Nova senha" value={password} onChange={setPassword} />
        <Field label="Confirmar senha" value={confirmPassword} onChange={setConfirmPassword} />
      </div>

      <p className="mt-3 text-xs text-zinc-500">Use pelo menos 8 caracteres.</p>

      {error && (
        <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={loading || password.length < 8}
        className="mt-6 w-full rounded-full bg-orange-500 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-black hover:bg-orange-400 disabled:opacity-60"
      >
        {loading ? "Salvando..." : "Salvar senha"}
      </button>
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
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-xs text-zinc-400">
      {label}
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-white/10 bg-black/70 px-3 py-3 text-sm text-zinc-100 outline-none focus:border-orange-500"
      />
    </label>
  );
}
