import { MoneyAmount } from "@/components/financial/money-amount";

/**
 * KnowFinanzas.html `.accounts-totals` — the balance-by-currency strip that heads the
 * Cuentas screen. Currencies are always shown apart; no conversion is implied.
 */
export function AccountsTotals({
  totals,
  note = "Pesos y dólares se muestran por separado. No se aplica ninguna conversión.",
}: {
  totals: { currencyCode: string; total: string }[];
  note?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-sm)]">
      {totals.map((entry, i) => (
        <div key={entry.currencyCode} className={i < totals.length - 1 ? "border-border pr-8 sm:border-r" : "pr-8"}>
          <p className="mb-1 text-caption text-muted-foreground">Saldo total en {entry.currencyCode}</p>
          <MoneyAmount
            amount={entry.total}
            currency={entry.currencyCode}
            variant="compact"
            className="text-metric font-bold tracking-[-0.03em] text-foreground"
          />
        </div>
      ))}
      <p className="ml-auto max-w-[16rem] text-caption leading-relaxed text-muted-foreground">{note}</p>
    </div>
  );
}
