"use client";

import { useSyncExternalStore } from "react";
import { LOTS, getLotById, getLotStatus, getPublicLotStatus, type LotId, type LotStatus } from "@/config/lots";

// Lotes que já completaram as vagas, consultados no servidor (vale para todos os componentes).
let soldOut: LotId[] = [];
let lastFetch = 0;
let fetching = false;
const listeners = new Set<() => void>();
const SOLD_OUT_REFRESH_MS = 60_000;

function refreshSoldOut() {
  if (fetching || Date.now() - lastFetch < SOLD_OUT_REFRESH_MS) return;
  if (!LOTS.some((lot) => lot.capacity !== undefined && Date.now() < Date.parse(lot.endsAt))) return;
  fetching = true;
  fetch("/api/lots/status", { cache: "no-store" })
    .then((response) => (response.ok ? response.json() : null))
    .then((data: { soldOut?: unknown } | null) => {
      if (!data || !Array.isArray(data.soldOut)) return;
      const ids = data.soldOut.filter((id): id is LotId => typeof id === "string" && getLotById(id) !== null);
      lastFetch = Date.now();
      if (ids.join(",") === soldOut.join(",")) return;
      soldOut = ids;
      listeners.forEach((notify) => notify());
    })
    .catch(() => {})
    .finally(() => {
      fetching = false;
    });
}

function nextBoundary(now: number) {
  const boundaries = LOTS.flatMap((lot) => [Date.parse(lot.startsAt), Date.parse(lot.endsAt)]);
  return boundaries.filter((time) => time > now).sort((a, b) => a - b)[0] ?? null;
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  refreshSoldOut();
  const boundary = nextBoundary(Date.now());
  const timeout = boundary !== null
    ? window.setTimeout(notify, Math.min(boundary - Date.now() + 500, 2_147_483_647))
    : undefined;
  // Atualiza também abas que ficaram suspensas e relógios corrigidos pelo sistema.
  const tick = () => {
    refreshSoldOut();
    notify();
  };
  const interval = window.setInterval(tick, 30_000);
  window.addEventListener("focus", tick);
  document.addEventListener("visibilitychange", tick);
  return () => {
    listeners.delete(notify);
    window.removeEventListener("focus", tick);
    document.removeEventListener("visibilitychange", tick);
    window.clearTimeout(timeout);
    window.clearInterval(interval);
  };
}

// Snapshot como string para o React comparar valores estáveis.
function serialize(status: LotStatus) {
  return `${status.phase}|${status.current?.id ?? ""}|${status.next?.id ?? ""}`;
}
const snapshot = () => serialize(getLotStatus(Date.now(), soldOut));
const publicSnapshot = () => serialize(getPublicLotStatus(Date.now(), soldOut));

function parse(value: string): LotStatus {
  const [phase, current, next] = value.split("|");
  return {
    phase: phase as LotStatus["phase"],
    current: getLotById(current),
    next: getLotById(next),
  };
}

export function useLotStatus(): LotStatus {
  return parse(useSyncExternalStore(subscribe, snapshot, snapshot));
}

// Para o site público: esconde a pré-venda dos veteranos.
export function usePublicLotStatus(): LotStatus {
  return parse(useSyncExternalStore(subscribe, publicSnapshot, publicSnapshot));
}

export function useRegistrationClosed() {
  return useLotStatus().phase !== "open";
}
