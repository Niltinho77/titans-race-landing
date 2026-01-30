"use client";

import { useEffect, useState } from "react";

type DrawStatus = "IDLE" | "FINISHED";
type DrawState = { status: DrawStatus; winnerFile: string | null; updatedAt: string | null };

type StateResp = {
  state: DrawState;
  images: string[];
  winnerUrl: string | null;
};

export default function SorteioAdmin() {
  const [data, setData] = useState<StateResp | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const key =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("key") || "" : "";

  async function fetchState() {
    const r = await fetch("/api/draw/state", { cache: "no-store" });
    const j = (await r.json()) as StateResp;
    setData(j);
  }

  useEffect(() => {
    fetchState().catch(() => {});
  }, []);

  async function start() {
    if (!key) return setMsg("❌ Falta a chave na URL: /sorteio/admin?key=SEU_SEGREDO");

    setBusy(true);
    setMsg("");
    try {
      const r = await fetch(`/api/draw/start?key=${encodeURIComponent(key)}`, { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Erro ao sortear");
      await fetchState();
      setMsg("✅ Sorteio finalizado. A página pública já vai fixar o vencedor.");
    } catch (e: any) {
      setMsg(`❌ ${e?.message || "Erro"}`);
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!key) return setMsg("❌ Falta a chave na URL: /sorteio/admin?key=SEU_SEGREDO");

    setBusy(true);
    setMsg("");
    try {
      const r = await fetch(`/api/draw/reset?key=${encodeURIComponent(key)}`, { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Erro ao resetar");
      await fetchState();
      setMsg("✅ Resetado. Agora troque as imagens em public/sorteio/semana/ e depois sorteie.");
    } catch (e: any) {
      setMsg(`❌ ${e?.message || "Erro"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0f14] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-xl font-bold">Admin do Sorteio</h1>
        <p className="mt-1 text-sm text-white/70">
          Acesso por chave na URL. Não compartilhe o link.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={start}
            disabled={busy}
            className="rounded-xl bg-yellow-400 px-4 py-2 font-bold text-black disabled:opacity-50"
          >
            {busy ? "Aguarde..." : "Sortear"}
          </button>

          <button
            onClick={reset}
            disabled={busy}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 font-bold disabled:opacity-50"
          >
            Reset semana
          </button>

          <a href="/sorteio" className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 font-bold">
            Abrir página pública
          </a>
        </div>

        {msg && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
            {msg}
          </div>
        )}

        {!data ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
            Carregando...
          </div>
        ) : (
          <>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
              <span className="font-semibold">Status:</span>{" "}
              <span className="text-white/80">{data.state.status}</span>
              {data.winnerUrl && <span className="ml-2 text-emerald-300">— vencedor definido ✅</span>}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {data.images.map((src) => (
                <div key={src} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  <img src={src} alt="Participante" className="aspect-[9/16] w-full object-cover" />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
