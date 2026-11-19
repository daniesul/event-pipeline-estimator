// Google Analytics events (the gtag snippet lives in index.html).
// Parameters reuse the portfolio's custom dimensions: item_name, section_name.
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dsOutreach?: (name: string, params?: Record<string, string>) => void;
  }
}

export function track(name: string, params: Record<string, string> = {}): void {
  try {
    window.gtag?.('event', name, params);
    window.dsOutreach?.(name, params); // outreach alerts, public/outreach.js
  } catch {
    // Analytics must never break the app.
  }
}
