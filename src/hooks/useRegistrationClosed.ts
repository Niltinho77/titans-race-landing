"use client";

import { useSyncExternalStore } from "react";
import { REGISTRATION_CLOSES_AT, registrationsAreClosed } from "@/config/registration";

function subscribe(notify: () => void) {
  const remaining = Date.parse(REGISTRATION_CLOSES_AT) - Date.now();
  const timeout = remaining > 0
    ? window.setTimeout(notify, Math.min(remaining, 2_147_483_647))
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

export function useRegistrationClosed() {
  return useSyncExternalStore(subscribe, registrationsAreClosed, () => false);
}
