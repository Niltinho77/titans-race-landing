"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

type AnalyticsPayload = {
  eventName: string;
  path: string;
  title?: string;
  referrer?: string;
  userAgent?: string;
  device?: string;
  metadata?: Record<string, unknown>;
};

const SESSION_KEY = "titans_analytics_session";

function shouldTrackPath(path: string) {
  return !path.startsWith("/admin") && !path.startsWith("/portal");
}

function getSessionId() {
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const next =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem(SESSION_KEY, next);
  return next;
}

function getDevice() {
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

function sendEvent(payload: AnalyticsPayload, useBeacon = false) {
  const body = JSON.stringify({
    sessionId: getSessionId(),
    ...payload,
  });

  if (useBeacon && navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/analytics/events",
      new Blob([body], { type: "application/json" }),
    );
    return;
  }

  fetch("/api/analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: useBeacon,
  }).catch(() => null);
}

function elementLabel(element: HTMLElement) {
  const explicit = element.dataset.analyticsLabel;
  if (explicit) return explicit.trim().slice(0, 120);

  const text = element.innerText || element.getAttribute("aria-label") || "";
  return text.trim().replace(/\s+/g, " ").slice(0, 120);
}

function AnalyticsTrackerContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const startedAtRef = useRef<number>(Date.now());
  const currentPathRef = useRef<string>("");

  useEffect(() => {
    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    currentPathRef.current = path;
    startedAtRef.current = Date.now();

    if (!shouldTrackPath(pathname)) return;

    sendEvent({
      eventName: "page_view",
      path,
      title: document.title,
      referrer: document.referrer || undefined,
      userAgent: navigator.userAgent,
      device: getDevice(),
      metadata: {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      },
    });
  }, [pathname, searchParams]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const clickable = target.closest("a,button") as HTMLElement | null;
      if (!clickable) return;
      if (!shouldTrackPath(window.location.pathname)) return;

      const anchor = clickable instanceof HTMLAnchorElement ? clickable : clickable.closest("a");
      const href = anchor?.getAttribute("href") || undefined;

      sendEvent({
        eventName: "click",
        path: currentPathRef.current || window.location.pathname,
        title: document.title,
        userAgent: navigator.userAgent,
        device: getDevice(),
        metadata: {
          label: elementLabel(clickable),
          href,
          element: clickable.tagName.toLowerCase(),
          analyticsId: clickable.dataset.analyticsId,
        },
      });
    }

    function onCustomEvent(event: Event) {
      const custom = event as CustomEvent<{
        eventName?: string;
        metadata?: Record<string, unknown>;
      }>;

      if (!custom.detail?.eventName) return;
      if (!shouldTrackPath(window.location.pathname)) return;

      sendEvent({
        eventName: custom.detail.eventName,
        path: currentPathRef.current || window.location.pathname,
        title: document.title,
        userAgent: navigator.userAgent,
        device: getDevice(),
        metadata: custom.detail.metadata ?? {},
      });
    }

    function onVisibilityChange() {
      if (document.visibilityState !== "hidden") return;
      if (!shouldTrackPath(window.location.pathname)) return;
      const seconds = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));

      sendEvent(
        {
          eventName: "time_on_page",
          path: currentPathRef.current || window.location.pathname,
          title: document.title,
          userAgent: navigator.userAgent,
          device: getDevice(),
          metadata: { seconds },
        },
        true,
      );
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener("titans:analytics", onCustomEvent);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("titans:analytics", onCustomEvent);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return null;
}

export function AnalyticsTracker() {
  return (
    <Suspense fallback={null}>
      <AnalyticsTrackerContent />
    </Suspense>
  );
}
