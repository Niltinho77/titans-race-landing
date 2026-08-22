"use client";

import { useEffect, useMemo, useState } from "react";

const TARGET = new Date("2026-11-15T00:00:00-03:00").getTime();

function getRemaining() {
  const diff = Math.max(0, TARGET - Date.now());
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1_000);

  return { days, hours, minutes, seconds };
}

export default function EventCountdown() {
  const [remaining, setRemaining] = useState(getRemaining);

  useEffect(() => {
    const interval = window.setInterval(() => setRemaining(getRemaining()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const items = useMemo(
    () => [
      { label: "dias", value: remaining.days },
      { label: "horas", value: remaining.hours },
      { label: "min", value: remaining.minutes },
      { label: "seg", value: remaining.seconds },
    ],
    [remaining]
  );

  return (
    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="border border-orange-500/35 bg-black/70 px-1.5 py-2 text-center shadow-[0_0_28px_rgba(249,115,22,0.12)] sm:px-3 sm:py-3"
        >
          <p className="font-mono text-lg font-semibold text-white sm:text-2xl md:text-3xl">
            {String(item.value).padStart(2, "0")}
          </p>
          <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-orange-200 sm:text-[10px] sm:tracking-[0.18em]">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}
