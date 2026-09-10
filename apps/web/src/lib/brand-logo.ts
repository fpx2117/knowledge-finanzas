// logo.dev brand-logo URLs. The publishable token ("pk_...") is safe in the browser — it lives in
// the <img src>. Set NEXT_PUBLIC_LOGO_DEV_TOKEN to enable; without it every helper returns null and
// the UI keeps its monogram / icon fallback.

const TOKEN = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;

export const brandLogosEnabled = Boolean(TOKEN);

type LogoOptions = {
  /** Rendered box size in CSS px; the URL asks logo.dev for 2× that. */
  size?: number;
  /** Pick a light- or dark-optimised mark. */
  theme?: "light" | "dark";
  format?: "png" | "jpg" | "webp";
};

/**
 * A logo.dev image URL for a company domain (e.g. "netflix.com"), or `null` when logos are
 * disabled or no domain is known. logo.dev serves its own generic fallback for unknown domains,
 * so pair this with an `onError` handler (see `BrandLogoImg`) for a graceful last resort.
 */
export function brandLogoUrl(domain: string | null | undefined, options: LogoOptions = {}): string | null {
  if (!TOKEN || !domain) return null;
  const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!clean || !clean.includes(".")) return null;
  const { size = 64, theme, format = "png" } = options;
  const params = new URLSearchParams({ token: TOKEN, size: String(size * 2), format });
  if (theme) params.set("theme", theme);
  return `https://img.logo.dev/${encodeURIComponent(clean)}?${params.toString()}`;
}
