"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRightIcon } from "lucide-react";

import { convertAmount, type FxQuote } from "@know-finanzas/finance";
import { MoneyAmount } from "@/components/financial/money-amount";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Direction-aware, per the user's own framing: si tenés dólares, valen la COMPRA; si querés
// dólares, los pagás a la VENTA. `convertAmount` already encodes that from the quote.
export function CurrencyConverter({
  quote,
  asOf,
  stale,
}: {
  quote: FxQuote;
  asOf: string;
  stale: boolean;
}) {
  const [amount, setAmount] = useState("");
  const [from, setFrom] = useState<string>(quote.base); // "USD" → "ARS" by default

  const to = from === quote.base ? quote.quote : quote.base;

  const result = useMemo(() => {
    const normalized = amount.replace(/\./g, "").replace(",", ".").trim();
    if (!normalized || Number.isNaN(Number(normalized)) || Number(normalized) <= 0) return null;
    try {
      return convertAmount(normalized, from, to, quote);
    } catch {
      return null;
    }
  }, [amount, from, to, quote]);

  const rateLabel = from === quote.base ? `compra $${fmt(quote.bid)}` : `venta $${fmt(quote.ask)}`;
  const when = new Date(asOf).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex max-w-md flex-col gap-4">
      <div className="flex items-end gap-2">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-caption text-muted-foreground">Monto en {from}</span>
          <input
            inputMode="decimal"
            autoFocus
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-body tabular-nums outline-none focus:border-brand"
          />
        </label>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Invertir monedas"
          onClick={() => setFrom(to)}
          className="mb-0.5"
        >
          <ArrowLeftRightIcon className="size-4" />
        </Button>
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-caption text-muted-foreground">Equivale a {to} ≈</span>
          <div className={cn("rounded-md border border-dashed border-border px-3 py-2 text-body tabular-nums", !result && "text-muted-foreground")}>
            {result ? <MoneyAmount amount={result} currency={to} /> : "—"}
          </div>
        </div>
      </div>

      <p className="text-caption text-muted-foreground">
        Estimado al dólar blue ({rateLabel}), actualizado {when}
        {stale ? " — no pudimos refrescar la cotización, puede estar desactualizada" : ""}.
      </p>
    </div>
  );
}

function fmt(value: string) {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Number(value));
}
