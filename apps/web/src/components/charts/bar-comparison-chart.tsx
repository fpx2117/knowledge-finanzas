import { getCurrencyMetadata } from "@know-finanzas/finance";

import { cn } from "@/lib/utils";

export type BarComparisonRow = { label: string; income: number; expense: number };

const W = 680;
const H = 200;
const PAD = { top: 20, right: 8, bottom: 32, left: 8 };

function compact(value: number, currency: string): string {
  const digits = getCurrencyMetadata(currency).decimalPlaces;
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${Math.round(value / 1_000)}k`;
  return value.toFixed(digits > 0 ? 0 : 0);
}

/**
 * Grouped income-vs-expense bars over months — visual-design-personal.md §17.8
 * (monthly evolution). Income green / expense red is the product's semantic
 * money colour (§16); the pair is hard for red-green CVD, so identity is also
 * carried by fixed position (income left, expense right), the legend, and a
 * direct value label on every bar. Dependency-free inline SVG.
 */
export function BarComparisonChart({
  rows,
  currency,
  className,
}: {
  rows: BarComparisonRow[];
  currency: string;
  className?: string;
}) {
  const max = Math.max(1, ...rows.flatMap((row) => [row.income, row.expense]));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const baseY = PAD.top + innerH;

  const groupW = innerW / rows.length;
  const barW = Math.min(28, (groupW - 8) / 2 - 1);
  const gap = 2; // surface gap between the pair

  const scale = (value: number) => (value / max) * innerH;

  return (
    <figure className={cn("m-0 w-full", className)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block h-auto w-full max-w-2xl" role="img" aria-label="Ingresos y gastos por mes, últimos 6 meses">
        <line x1={PAD.left} x2={W - PAD.right} y1={baseY} y2={baseY} stroke="var(--border)" strokeWidth="1" />
        {rows.map((row, index) => {
          const cx = PAD.left + groupW * index + groupW / 2;
          const bars = [
            { key: "income", value: row.income, x: cx - barW - gap / 2, fill: "var(--success-vivid)", label: "Ingresos" },
            { key: "expense", value: row.expense, x: cx + gap / 2, fill: "var(--negative-vivid)", label: "Gastos" },
          ];
          return (
            <g key={row.label}>
              {bars.map((bar) => {
                const h = scale(bar.value);
                const y = baseY - h;
                return (
                  <g key={bar.key}>
                    {bar.value > 0 ? (
                      <>
                        <rect x={bar.x} y={y} width={barW} height={h} rx={4} fill={bar.fill}>
                          <title>{`${bar.label} · ${row.label}: ${currency} ${bar.value.toLocaleString("es-AR")}`}</title>
                        </rect>
                        {/* square off the bottom corners so the bar sits on the baseline */}
                        <rect x={bar.x} y={baseY - Math.min(h, 4)} width={barW} height={Math.min(h, 4)} fill={bar.fill} />
                        <text x={bar.x + barW / 2} y={y - 5} textAnchor="middle" className="fill-muted-foreground text-[10px] font-medium tabular-nums">
                          {compact(bar.value, currency)}
                        </text>
                      </>
                    ) : null}
                  </g>
                );
              })}
              <text x={cx} y={baseY + 20} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                {row.label}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-caption text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-[3px] bg-[var(--success-vivid)]" /> Ingresos
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-[3px] bg-[var(--negative-vivid)]" /> Gastos
        </span>
      </figcaption>
    </figure>
  );
}
