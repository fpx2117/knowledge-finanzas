// Income green / expense red — the pair is legible here because position is fixed (income bar
// always left) and the legend labels each colour.
const INCOME = "var(--success-vivid)";
const EXPENSE = "var(--negative-vivid)";

type Week = { label: string; income: number; expense: number };

/**
 * "Flujo del mes" — grouped income/expense bars, one pair per week of the month. Server-rendered
 * inline SVG (no chart lib). The viewBox is deliberately small so the labels stay legible when the
 * card is squeezed to half-width on mobile; a max-width keeps it from ballooning on desktop.
 */
export function WeeklyFlowChart({ weeks, currency, expanded = false }: { weeks: Week[]; currency: string; expanded?: boolean }) {
  const max = Math.max(1, ...weeks.flatMap((w) => [w.income, w.expense]));
  const step = niceStep(max);
  const axisMax = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: Math.round(axisMax / step) + 1 }, (_, i) => i * step);

  const W = expanded ? 560 : 280;
  const H = expanded ? 300 : 190;
  const padL = expanded ? 48 : 30;
  const padB = expanded ? 34 : 26;
  const padT = expanded ? 10 : 6;
  const axisFont = expanded ? 12 : 8.5;
  const labelFont = expanded ? 13 : 9;
  const plotW = W - padL - 4;
  const plotH = H - padB - padT;
  const groupW = plotW / weeks.length;
  const barW = expanded ? Math.max(14, Math.min(34, groupW / 3.4)) : Math.max(7, Math.min(14, groupW / 3.4));

  const compact = new Intl.NumberFormat("es-AR", { notation: "compact", maximumFractionDigits: 0 });
  const full = new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 });

  return (
    <figure className="flex flex-col gap-3">
      <div className="flex items-center gap-4 text-caption text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: INCOME }} /> Ingresos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: EXPENSE }} /> Gastos
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={expanded ? "h-auto w-full" : "mx-auto h-auto w-full max-w-[380px]"}
        role="img"
        aria-label="Ingresos y gastos por semana"
      >
        {ticks.map((t) => {
          const y = padT + plotH - (t / axisMax) * plotH;
          return (
            <g key={t}>
              <line x1={padL} x2={W - 4} y1={y} y2={y} stroke="var(--border)" strokeDasharray="2 3" />
              <text x={padL - 6} y={y + 3.5} textAnchor="end" fontSize={axisFont} className="fill-[var(--muted-foreground)]">
                {compact.format(t)}
              </text>
            </g>
          );
        })}
        {weeks.map((week, i) => {
          const cx = padL + groupW * i + groupW / 2;
          const incomeH = (week.income / axisMax) * plotH;
          const expenseH = (week.expense / axisMax) * plotH;
          const baseY = padT + plotH;
          return (
            <g key={week.label}>
              <rect x={cx - barW - 1} y={baseY - incomeH} width={barW} height={incomeH} rx={2} fill={INCOME}>
                <title>{`${week.label}: ingresos ${full.format(week.income)}`}</title>
              </rect>
              <rect x={cx + 1} y={baseY - expenseH} width={barW} height={expenseH} rx={2} fill={EXPENSE}>
                <title>{`${week.label}: gastos ${full.format(week.expense)}`}</title>
              </rect>
              <text x={cx} y={H - padB + (expanded ? 20 : 13)} textAnchor="middle" fontSize={labelFont} className="fill-[var(--muted-foreground)]">
                {week.label}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

function niceStep(max: number): number {
  const rough = max / 4;
  const mag = 10 ** Math.floor(Math.log10(rough || 1));
  const norm = rough / mag;
  const nice = norm >= 5 ? 5 : norm >= 2 ? 2 : 1;
  return nice * mag;
}
