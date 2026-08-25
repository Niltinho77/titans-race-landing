"use client";

import Link from "next/link";
import { useState } from "react";

export default function PortalHeader({
  email,
  role,
}: {
  email: string;
  role: "PARTICIPANT" | "ADMIN";
}) {
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await fetch("/api/portal/logout", { method: "POST" }).catch(() => null);
    window.location.href = "/portal/login";
  }

  return (
    <header className="border-b border-white/10 bg-black/90 px-3 py-3 sm:px-4 sm:py-4">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <Link
            href="/portal/minhas-inscricoes"
            className="heading-adventure text-2xl text-white"
          >
            Titans Race
          </Link>
          <p className="truncate text-[11px] text-zinc-500">{email}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Link
            href="/portal/minhas-inscricoes"
            className="border border-white/15 px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-100 hover:bg-white/5 sm:px-4 sm:text-[11px] sm:tracking-[0.18em]"
          >
            Minhas inscri&ccedil;&otilde;es
          </Link>
          {role === "ADMIN" && (
            <>
              <Link
                href="/portal/admin/inscricoes"
                className="border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-200 hover:bg-orange-500/15 sm:px-4 sm:text-[11px] sm:tracking-[0.18em]"
              >
                Admin
              </Link>
              <Link
                href="/admin/metricas"
                className="border border-white/15 px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-100 hover:bg-white/5 sm:px-4 sm:text-[11px] sm:tracking-[0.18em]"
              >
                Métricas
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={logout}
            disabled={loading}
            className="border border-white/15 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-100 hover:bg-white/5 disabled:opacity-60 sm:px-4 sm:text-[11px] sm:tracking-[0.18em]"
          >
            {loading ? "Saindo..." : "Sair"}
          </button>
        </div>
      </div>
    </header>
  );
}
