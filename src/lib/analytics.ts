export type AnalyticsEventName =
  | "app_open"
  | "report_started"
  | "gps_captured"
  | "photos_added"
  | "participants_completed"
  | "signatures_completed"
  | "pdf_generated"
  | "pdf_generation_failed";

type AnalyticsParams = {
  photo_count?: number;
  duration_seconds?: number;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function sanitizeParams(params: AnalyticsParams) {
  const safeParams: AnalyticsParams = {};

  if (typeof params.photo_count === "number" && Number.isFinite(params.photo_count)) {
    safeParams.photo_count = Math.max(0, Math.round(params.photo_count));
  }

  if (typeof params.duration_seconds === "number" && Number.isFinite(params.duration_seconds)) {
    safeParams.duration_seconds = Math.max(0, Math.round(params.duration_seconds * 10) / 10);
  }

  return safeParams;
}

export function trackEvent(eventName: AnalyticsEventName, params: AnalyticsParams = {}) {
  try {
    if (typeof window.gtag !== "function") {
      return;
    }

    window.gtag("event", eventName, {
      app_name: "e-izvestaj",
      app_type: "pwa",
      ...sanitizeParams(params)
    });
  } catch (error) {
    console.warn("Analytics event failed:", eventName, error);
  }
}

export function trackEventOnce(
  eventName: AnalyticsEventName,
  scopeKey: string,
  params: AnalyticsParams = {}
) {
  const storageKey = `analytics:${eventName}:${scopeKey}`;

  try {
    if (window.sessionStorage.getItem(storageKey)) {
      return;
    }
    window.sessionStorage.setItem(storageKey, "1");
  } catch {
    // Tracking still works when sessionStorage is unavailable.
  }

  trackEvent(eventName, params);
}
