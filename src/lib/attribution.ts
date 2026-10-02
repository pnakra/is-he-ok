export interface Attribution {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  referrerHost: string | null;
}

const STORAGE_KEY = "iho_attribution";
const CLEAN_RE = /^[a-z0-9 _.\-]+$/;

function clean(value: string | null): string | null {
  if (!value) return null;
  const v = value.trim().toLowerCase().slice(0, 100);
  return v && CLEAN_RE.test(v) ? v : null;
}

const EMPTY: Attribution = {
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  utmContent: null,
  referrerHost: null,
};

/**
 * First-touch per tab: captures UTM params, ad click-id presence (never the
 * id value), and the referrer hostname into sessionStorage. Browser-only,
 * fails silently.
 */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    if (window.sessionStorage.getItem(STORAGE_KEY)) return;

    const params = new URLSearchParams(window.location.search);

    let utmSource = clean(params.get("utm_source"));
    if (!utmSource) {
      if (params.has("ttclid")) utmSource = "tiktok";
      else if (params.has("rdt_cid")) utmSource = "reddit";
      else if (params.has("fbclid")) utmSource = "meta";
      else if (params.has("gclid")) utmSource = "google";
    }

    let referrerHost: string | null = null;
    const ref = document.referrer;
    if (ref) {
      try {
        const host = new URL(ref).hostname.toLowerCase().replace(/^www\./, "");
        if (host && host !== window.location.hostname.toLowerCase().replace(/^www\./, "")) {
          referrerHost = host.slice(0, 100);
        }
      } catch {
        // unparsable referrer — leave null
      }
    }

    const attribution: Attribution = {
      utmSource,
      utmMedium: clean(params.get("utm_medium")),
      utmCampaign: clean(params.get("utm_campaign")),
      utmContent: clean(params.get("utm_content")),
      referrerHost,
    };

    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // fail silently
  }
}

export function getAttribution(): Attribution {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<Attribution>;
    return {
      utmSource: typeof parsed.utmSource === "string" ? parsed.utmSource : null,
      utmMedium: typeof parsed.utmMedium === "string" ? parsed.utmMedium : null,
      utmCampaign: typeof parsed.utmCampaign === "string" ? parsed.utmCampaign : null,
      utmContent: typeof parsed.utmContent === "string" ? parsed.utmContent : null,
      referrerHost: typeof parsed.referrerHost === "string" ? parsed.referrerHost : null,
    };
  } catch {
    return { ...EMPTY };
  }
}
