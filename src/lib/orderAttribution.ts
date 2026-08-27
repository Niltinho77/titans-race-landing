export type OrderAttributionInput = {
  sessionId?: unknown;
  source?: unknown;
  medium?: unknown;
  campaign?: unknown;
  content?: unknown;
  landingPage?: unknown;
};

function clean(value: unknown, maxLength = 120) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

export function cleanOrderAttribution(value: unknown) {
  const input =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as OrderAttributionInput)
      : {};

  return {
    analyticsSessionId: clean(input.sessionId, 120),
    source: clean(input.source),
    medium: clean(input.medium),
    campaign: clean(input.campaign),
    content: clean(input.content),
    landingPage: clean(input.landingPage, 500),
  };
}
