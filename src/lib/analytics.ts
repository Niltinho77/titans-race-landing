type AnalyticsMetadata = Record<string, string | number | boolean | null | undefined>;

export function trackAnalyticsEvent(
  eventName: string,
  metadata: AnalyticsMetadata = {},
) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("titans:analytics", {
      detail: { eventName, metadata },
    }),
  );
}
