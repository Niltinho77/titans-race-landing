"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function login() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Falha no login.");
      window.location.href = data.redirectTo || "/portal/minhas-inscricoes";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no login.");
    } finally {
      setLoading(false);
    }
  }

  async function requestPassword() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/portal/password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Não foi possível enviar o e-mail.");
      setMessage(data?.message || "Confira seu e-mail.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o e-mail.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-black/75 p-6 text-sm text-zinc-200 shadow-[0_20px_70px_rgba(249,115,22,0.12)]">
      <p className="text-[11px] uppercase tracking-[0.25em] text-orange-300">
        Portal Titans Race
      </p>
      <h1 className="heading-adventure mt-2 text-3xl text-white">Acesso do inscrito</h1>

      <div className="mt-6 space-y-3">
        <Field label="E-mail" value={email} onChange={setEmail} type="email" />
        <Field label="Senha" value={password} onChange={setPassword} type="password" />
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
          {message}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={login}
          disabled={loading}
          className="rounded-full bg-orange-500 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-black hover:bg-orange-400 disabled:opacity-60"
        >
          {loading ? "Aguarde..." : "Entrar"}
        </button>

        <button
          type="button"
          onClick={requestPassword}
          disabled={loading || !email.trim()}
          className="rounded-full border border-white/15 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-100 hover:bg-white/5 disabled:opacity-60"
        >
          Definir ou recuperar senha
        </button>

        <Link
          href="/#inicio"
          className="text-center text-[11px] uppercase tracking-[0.18em] text-zinc-500 hover:text-zinc-200"
        >
          Voltar ao site
        </Link>
      </div>
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
        className="mt-1 w-full rounded-xl border border-white/10 bg-black/70 px-3 py-3 text-sm text-zinc-100 outline-none focus:border-orange-500"
      />
    </label>
  );
}
