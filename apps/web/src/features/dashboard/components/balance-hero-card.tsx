import { ArrowDownRightIcon, ArrowUpRightIcon, WalletIcon } from "lucide-react";

import { MoneyAmount } from "@/components/financial/money-amount";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

/**
 * The dashboard's hero — the KnowFinanzas reference "Patrimonio disponible" panel: a deep-indigo
 * card with the total, a signed month-result pill, a spendable/committed/accounts sub-line, and a
 * motivational line on the right. The gradient is fixed (not the `--brand` token) so it stays a
 * strong brand panel in both light and dark themes.
 */
export function BalanceHeroCard({
  total,
  currency,
  spendable,
  committed,
  accountCount,
  monthResult,
  monthLabel,
}: {
  total: string;
  currency: string;
  spendable: string;
  committed: string;
  accountCount: number;
  monthResult: string;
  monthLabel: string;
}) {
  const result = Number(monthResult);
  const up = result > 0;
  const down = result < 0;
  const PillIcon = up ? ArrowUpRightIcon : down ? ArrowDownRightIcon : null;

  return (
    <section
      aria-label="Patrimonio disponible"
      style={{ background: "linear-gradient(150deg, #2440d8 0%, #1737c8 45%, #0f2596 100%)" }}
      className="relative isolate overflow-hidden rounded-xl px-4 py-5 text-white shadow-[0_12px_28px_-8px_rgb(16_43_166_/_0.55)] sm:px-7 sm:py-6"
    >
      <span aria-hidden className="pointer-events-none absolute -right-24 -bottom-36 -z-10 size-[305px] rounded-full border-[46px] border-white/[0.06]" />
      <span aria-hidden className="pointer-events-none absolute -right-28 -top-44 -z-10 h-[340px] w-[390px] rounded-full bg-white/[0.05]" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-caption font-medium text-white/80">
            <WalletIcon className="size-4" />
            Patrimonio disponible
            <Tooltip>
              <TooltipTrigger aria-label="Qué significa: Patrimonio disponible" className="text-white/60 hover:text-white">
                <InfoIcon className="size-3" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                Suma de los saldos de tus cuentas en {currency}. Abajo se desglosa en lo disponible para gastar y lo ya comprometido.
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 sm:mt-3">
            <MoneyAmount
              amount={total}
              currency={currency}
              variant="compact"
              className="text-[clamp(1.6rem,6vw,2.6rem)] font-bold leading-none tracking-[-0.04em] tabular-nums text-white"
            />
            {result !== 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-caption font-semibold tabular-nums text-white">
                {PillIcon ? <PillIcon className="size-3.5" /> : null}
                <MoneyAmount amount={String(Math.abs(result))} currency={currency} variant="compact" className="text-caption font-semibold text-white" />
                <span className="font-normal text-white/75"> en {monthLabel}</span>
              </span>
            ) : null}
          </div>

          <p className="mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-caption text-white/80 sm:mt-3">
            <span>
              Disponible <MoneyAmount amount={spendable} currency={currency} variant="compact" className="font-semibold text-white" />
            </span>
            <span aria-hidden className="text-white/40">·</span>
            <span>
              Comprometido <MoneyAmount amount={committed} currency={currency} variant="compact" className="font-semibold text-white" />
            </span>
            <span aria-hidden className="text-white/40">·</span>
            <span>
              {accountCount} {accountCount === 1 ? "cuenta" : "cuentas"}
            </span>
          </p>
        </div>

        <p className="hidden max-w-[12rem] shrink-0 text-caption leading-relaxed text-white/70 sm:block sm:text-right">
          Pequeñas decisiones hoy, grandes metas mañana.
        </p>
      </div>
    </section>
  );
}
