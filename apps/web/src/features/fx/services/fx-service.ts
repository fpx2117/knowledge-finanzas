import { z } from "zod";

import { fxRateRepository, type FxRate } from "@know-finanzas/db";
import type { FxQuote } from "@know-finanzas/finance";

// The only pair we quote today: dolarapi's "dólar blue", USD priced in ARS.
const SOURCE = "DOLAR_BLUE" as const;
const BASE = "USD";
const QUOTE = "ARS";
const ENDPOINT = "https://dolarapi.com/v1/dolares/blue";
const PROVIDER_TIMEOUT_MS = 5_000;

/** Past this age we try to refresh on the next read; a failed refresh still serves the old value. */
export const BLUE_QUOTE_STALE_AFTER_MS = 6 * 60 * 60 * 1000;

const dolarApiSchema = z.object({
  compra: z.number().positive(),
  venta: z.number().positive(),
  fechaActualizacion: z.string().min(1),
});

export type BlueQuote = {
  /** Ready to hand to `convertAmount` from @know-finanzas/finance. */
  fx: FxQuote;
  /** compra / venta as decimal strings, for display. */
  bid: string;
  ask: string;
  /** The provider's own "last updated" moment. */
  asOf: string;
  /** When we last pulled it. */
  fetchedAt: string;
  /** True when the provider was unreachable and this is the last value we had. */
  stale: boolean;
};

function toQuote(row: FxRate, stale: boolean): BlueQuote {
  return {
    fx: { base: row.base, quote: row.quote, bid: row.bid, ask: row.ask },
    bid: row.bid,
    ask: row.ask,
    asOf: row.asOf.toISOString(),
    fetchedAt: row.fetchedAt.toISOString(),
    stale,
  };
}

async function fetchFromProvider(): Promise<{ bid: string; ask: string; asOf: Date }> {
  const response = await fetch(ENDPOINT, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`dolarapi responded ${response.status}`);
  }
  const data = dolarApiSchema.parse(await response.json());
  const asOf = new Date(data.fechaActualizacion);
  if (Number.isNaN(asOf.getTime())) {
    throw new Error(`dolarapi returned an unparseable fechaActualizacion: ${data.fechaActualizacion}`);
  }
  return { bid: String(data.compra), ask: String(data.venta), asOf };
}

/**
 * The current dólar-blue quote for USD→ARS conversions.
 *
 * Reads the cached row; if it's missing or older than {@link BLUE_QUOTE_STALE_AFTER_MS} it pulls
 * a fresh one from dolarapi and stores it. If that pull fails it falls back to the last stored
 * value with `stale: true`, and only returns `null` when there is nothing cached at all — the
 * caller must then hide every conversion affordance, never invent a rate.
 */
export async function getBlueQuote(now: Date = new Date()): Promise<BlueQuote | null> {
  const latest = await fxRateRepository.getLatest(SOURCE, BASE, QUOTE);

  if (latest && now.getTime() - latest.fetchedAt.getTime() < BLUE_QUOTE_STALE_AFTER_MS) {
    return toQuote(latest, false);
  }

  try {
    const fresh = await fetchFromProvider();
    const row = await fxRateRepository.record(
      { source: SOURCE, base: BASE, quote: QUOTE, bid: fresh.bid, ask: fresh.ask, asOf: fresh.asOf },
      { touch: true },
    );
    return toQuote(row, false);
  } catch {
    return latest ? toQuote(latest, true) : null;
  }
}

/**
 * Forces a refresh from the provider and stores it. Used by the scheduled route so the quote is
 * pre-warmed and users never pay the fetch latency. Throws on provider failure — the caller
 * (the cron route) turns that into a 502 so the scheduler's logs show it.
 */
export async function refreshBlueQuote(): Promise<BlueQuote> {
  const fresh = await fetchFromProvider();
  const row = await fxRateRepository.record(
    { source: SOURCE, base: BASE, quote: QUOTE, bid: fresh.bid, ask: fresh.ask, asOf: fresh.asOf },
    { touch: true },
  );
  return toQuote(row, false);
}
