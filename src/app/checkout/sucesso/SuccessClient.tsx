"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  XCircle,
  AlertTriangle,
  LoaderCircle,
} from "lucide-react";

type SuccessClientProps = {
  orderId: string;
  initialStatus: string;
  totalFormatted: string;
  participant: {
    fullName: string;
    cpf: string;
    email: string;
    phone: string;
  } | null;
};

type OrderStatusResponse = {
  status: string;
};

function getStatusMeta(status: string) {
  switch (status) {
    case "PAID":
      return {
        eyebrow: "Pagamento confirmado",
        title: "Titans Race – inscrição confirmada",
        description:
          "Pagamento aprovado com sucesso. Sua vaga está garantida e sua inscrição foi confirmada.",
        border:
          "border-emerald-500/40",
        bg:
          "bg-emerald-500/20",
        text:
          "text-emerald-300",
        shadow:
          "shadow-[0_20px_60px_rgba(16,185,129,0.25)]",
        statusText: "Pago",
        statusColor: "text-emerald-300",
        Icon: CheckCircle2,
      };

    case "PENDING":
      return {
        eyebrow: "Pagamento em análise",
        title: "Titans Race – aguardando confirmação",
        description:
          "Sua inscrição foi registrada. Estamos aguardando a confirmação do pagamento para garantir sua vaga.",
        border:
          "border-yellow-500/40",
        bg:
          "bg-yellow-500/20",
        text:
          "text-yellow-300",
        shadow:
          "shadow-[0_20px_60px_rgba(234,179,8,0.20)]",
        statusText: "Aguardando pagamento",
        statusColor: "text-yellow-300",
        Icon: Clock3,
      };

    case "OVERDUE":
      return {
        eyebrow: "Pagamento vencido",
        title: "Titans Race – pagamento vencido",
        description:
          "O prazo para pagamento expirou. Se precisar, você pode iniciar uma nova tentativa de inscrição.",
        border:
          "border-orange-500/40",
        bg:
          "bg-orange-500/20",
        text:
          "text-orange-300",
        shadow:
          "shadow-[0_20px_60px_rgba(249,115,22,0.20)]",
        statusText: "Vencido",
        statusColor: "text-orange-300",
        Icon: AlertTriangle,
      };

    case "FAILED":
    case "CANCELED":
    case "REFUNDED":
    case "PARTIALLY_REFUNDED":
      return {
        eyebrow: "Pagamento não concluído",
        title: "Titans Race – pagamento não confirmado",
        description:
          "Não foi possível confirmar o pagamento deste pedido. Você pode tentar novamente ou falar com a organização.",
        border:
          "border-red-500/40",
        bg:
          "bg-red-500/20",
        text:
          "text-red-300",
        shadow:
          "shadow-[0_20px_60px_rgba(239,68,68,0.20)]",
        statusText: status,
        statusColor: "text-red-300",
        Icon: XCircle,
      };

    default:
      return {
        eyebrow: "Status do pedido",
        title: "Titans Race – pedido registrado",
        description:
          "Seu pedido foi registrado. Estamos atualizando as informações do pagamento.",
        border:
          "border-white/10",
        bg:
          "bg-white/10",
        text:
          "text-zinc-200",
        shadow:
          "shadow-[0_20px_60px_rgba(255,255,255,0.06)]",
        statusText: status,
        statusColor: "text-zinc-200",
        Icon: Clock3,
      };
  }
}

export default function SuccessClient({
  orderId,
  initialStatus,
  totalFormatted,
  participant,
}: SuccessClientProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isChecking, setIsChecking] = useState(initialStatus !== "PAID");

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    async function checkStatus() {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
          cache: "no-store",
        });

        if (!res.ok) return;

        const data = (await res.json()) as OrderStatusResponse;

        if (cancelled) return;

        if (data?.status) {
          setStatus(data.status);

          if (data.status === "PAID") {
            setIsChecking(false);
            return;
          }

          if (
            ["FAILED", "CANCELED", "OVERDUE", "REFUNDED", "PARTIALLY_REFUNDED"].includes(
              data.status
            )
          ) {
            setIsChecking(false);
            return;
          }
        }

        attempts += 1;

        if (attempts >= 12) {
          setIsChecking(false);
          return;
        }

        setTimeout(checkStatus, 3000);
      } catch {
        attempts += 1;

        if (attempts >= 12) {
          setIsChecking(false);
          return;
        }

        setTimeout(checkStatus, 3000);
      }
    }

    if (initialStatus !== "PAID") {
      checkStatus();
    }

    return () => {
      cancelled = true;
    };
  }, [initialStatus, orderId]);

  const meta = useMemo(() => getStatusMeta(status), [status]);
  const Icon = meta.Icon;

  return (
    <main className="min-h-screen bg-black px-4 pb-24 pt-20">
      <div
        className={`mx-auto max-w-3xl rounded-3xl border bg-black/70 p-6 text-sm text-zinc-200 ${meta.border} ${meta.shadow}`}
      >
        <div className="mb-4 flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${meta.bg} ${meta.text}`}>
            <Icon className="h-6 w-6" />
          </div>

          <div>
            <p className={`text-[11px] uppercase tracking-[0.25em] ${meta.text}`}>
              {meta.eyebrow}
            </p>
            <h1 className="heading-adventure text-2xl text-white md:text-3xl">
              {meta.title}
            </h1>
          </div>
        </div>

        <p className="mb-4 text-zinc-300">{meta.description}</p>

        {isChecking && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-xs text-zinc-300">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Estamos verificando a confirmação do pagamento...
          </div>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/60 p-4">
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              Detalhes do pedido
            </p>
            <p className="mt-2 text-xs text-zinc-400">
              Número do pedido:
              <br />
              <span className="font-mono text-[11px] text-zinc-200">{orderId}</span>
            </p>
            <p className="mt-2 text-xs text-zinc-400">
              Status:
              <br />
              <span className={`font-semibold ${meta.statusColor}`}>{meta.statusText}</span>
            </p>
            <p className="mt-2 text-xs text-zinc-400">
              Total:
              <br />
              <span className="font-semibold text-white">{totalFormatted}</span>
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/60 p-4">
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              Participante principal
            </p>

            {participant ? (
              <>
                <p className="mt-2 text-sm text-zinc-100">{participant.fullName}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  CPF: <span className="font-mono text-[11px]">{participant.cpf}</span>
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  E-mail: {participant.email}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  Telefone: {participant.phone}
                </p>
              </>
            ) : (
              <p className="mt-2 text-xs text-zinc-400">Dados não encontrados.</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/#inicio"
            className="rounded-full border border-white/20 px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-100 hover:bg-white/5"
          >
            Voltar para o início
          </Link>

          {status !== "PAID" && (
            <Link
              href="/checkout"
              className="rounded-full bg-orange-500 px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-black hover:bg-orange-400"
            >
              Fazer nova tentativa
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}