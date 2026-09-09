import { getBlueQuote } from "@/features/fx/services/fx-service";
import type { CurrentUser } from "@/lib/auth/require-current-user";

import { createReportService } from "./report-service";

const service = createReportService();

export type ReportSearchParams = { period?: string; currency?: string; convert?: string };

/**
 * The shared load path for every `/reports/*` page that renders `getReport`: resolves the
 * eligible currencies, the active one, and — when `?convert=1` is set and the active currency
 * forms a convertible pair with another the user holds — the dólar-blue quote to fold the rest
 * in at. Keeps the page components down to layout.
 */
export async function loadReport(user: CurrentUser, params: ReportSearchParams) {
  const currencies = await service.listReportCurrencies(user.id, user.baseCurrency);
  const currency = params.currency && currencies.includes(params.currency) ? params.currency : user.baseCurrency;

  const otherPair = currency === "ARS" ? "USD" : currency === "USD" ? "ARS" : null;
  const canConvert = otherPair != null && currencies.includes(otherPair);

  let fxQuote: Parameters<typeof service.getReport>[0]["fxQuote"] = null;
  if (params.convert === "1" && canConvert) {
    const quote = await getBlueQuote();
    if (quote) fxQuote = { ...quote.fx, asOf: quote.asOf, stale: quote.stale };
  }

  const report = await service.getReport({
    userId: user.id,
    timezone: user.timezone,
    baseCurrency: user.baseCurrency,
    currency,
    period: params.period,
    convert: fxQuote != null,
    fxQuote,
  });

  return { currencies, report, canConvert, converting: report.conversion != null };
}
