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
const ATTRIBUTION_KEY = "titans_analytics_attribution";

type Attribution = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
};

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

function getAttribution(searchParams?: URLSearchParams): Attribution {
  const incoming = searchParams
    ? {
        source: searchParams.get("utm_source")?.slice(0, 100) || undefined,
        medium: searchParams.get("utm_medium")?.slice(0, 100) || undefined,
        campaign: searchParams.get("utm_campaign")?.slice(0, 100) || undefined,
        content: searchParams.get("utm_content")?.slice(0, 100) || undefined,
      }
    : {};

  if (incoming.source || incoming.medium || incoming.campaign || incoming.content) {
    window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(incoming));
    return incoming;
  }

  try {
    return JSON.parse(window.localStorage.getItem(ATTRIBUTION_KEY) || "{}") as Attribution;
  } catch {
    return {};
  }
}

function sendEvent(payload: AnalyticsPayload, useBeacon = false) {
  const attribution = getAttribution();
  const body = JSON.stringify({
    sessionId: getSessionId(),
    ...payload,
    metadata: { ...attribution, ...payload.metadata },
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
  const startedAtRef = useRef<number>(0);
  const currentPathRef = useRef<string>("");

  useEffect(() => {
    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    currentPathRef.current = path;
    startedAtRef.current = Date.now();

    if (!shouldTrackPath(pathname)) return;

    getAttribution(new URLSearchParams(query));
    const isCampaignEntry = ["utm_source", "utm_medium", "utm_campaign", "utm_content"].some(
      (key) => searchParams.has(key),
    );

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
        campaignEntry: isCampaignEntry,
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
