"use client";

import { useSyncExternalStore } from "react";
import { LOTS, getLotById, getLotStatus, getPublicLotStatus, type LotStatus } from "@/config/lots";

function nextBoundary(now: number) {
  const boundaries = LOTS.flatMap((lot) => [Date.parse(lot.startsAt), Date.parse(lot.endsAt)]);
  return boundaries.filter((time) => time > now).sort((a, b) => a - b)[0] ?? null;
}

function subscribe(notify: () => void) {
  const boundary = nextBoundary(Date.now());
  const timeout = boundary !== null
    ? window.setTimeout(notify, Math.min(boundary - Date.now() + 500, 2_147_483_647))
    : undefined;
  // Atualiza também abas que ficaram suspensas e relógios corrigidos pelo sistema.
  const interval = window.setInterval(notify, 30_000);
  window.addEventListener("focus", notify);
  document.addEventListener("visibilitychange", notify);
  return () => {
    window.clearTimeout(timeout);
    window.clearInterval(interval);
    window.removeEventListener("focus", notify);
    document.removeEventListener("visibilitychange", notify);
  };
}

// Snapshot como string para o React comparar valores estáveis.
function serialize(status: LotStatus) {
  return `${status.phase}|${status.current?.id ?? ""}|${status.next?.id ?? ""}`;
}
const snapshot = () => serialize(getLotStatus());
const publicSnapshot = () => serialize(getPublicLotStatus());

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
