"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function PendenteClient() {
  const sp = useSearchParams();

  const orderId = useMemo(() => {
    const byOrderId = sp.get("orderId");
    const byExternalRef = sp.get("external_reference");
    return byOrderId || byExternalRef || "";
  }, [sp]);

  const [status, setStatus] = useState<string>("PENDING");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    let alive = true;
    let tries = 0;
    const maxTries = 90;

    const tick = async () => {
      tries++;

      try {
        const res = await fetch(`/api/orders/${orderId}/status`, { cache: "no-store" });
        if (!res.ok) throw new Error("Falha ao consultar status do pedido.");
        const data = (await res.json()) as { status: string };

        if (!alive) return;

        setStatus(data.status);
        setError(null);

        if (data.status === "PAID") {
          window.location.href = `/checkout/sucesso?orderId=${orderId}`;
          return;
        }

        if (data.status === "FAILED") {
          window.location.href = `/checkout/falha?orderId=${orderId}`;
          return;
        }
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Erro ao consultar status.");
      }

      if (tries < maxTries) setTimeout(tick, 2000);
    };

    tick();
    return () => {
      alive = false;
    };
  }, [orderId]);

  return (
    <main className="min-h-screen bg-black pt-20 pb-24 px-4">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-black/70 p-6 text-sm text-zinc-200">
        <h1 className="heading-adventure text-2xl text-white md:text-3xl mb-3">
          Pagamento PIX — aguardando confirmação
        </h1>

        {!orderId ? (
          <p className="text-zinc-300">
            orderId não encontrado na URL. Volte e tente novamente.
          </p>
        ) : (
          <>
            <p className="text-zinc-300">
              Assim que o Mercado Pago confirmar o PIX, você será redirecionado automaticamente.
            </p>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/60 p-4">
              <p className="text-xs text-zinc-400">Pedido:</p>
              <p className="font-mono text-[11px] text-zinc-200">{orderId}</p>

              <p className="mt-3 text-xs text-zinc-400">Status atual:</p>
              <p className="font-semibold text-orange-300">
                {status === "PENDING" ? "Pendente" : status}
              </p>
            </div>

            {error && (
              <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-200">
                {error}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => window.location.reload()}
                className="rounded-full bg-orange-500 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black"
              >
                Atualizar agora
              </button>

              <Link
                href="/#inicio"
                className="rounded-full border border-white/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-100 hover:bg-white/5"
              >
                Voltar ao início
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
