import { cn } from "@/lib/utils";

export type CashflowPoint = { date: string; label: string; balance: number };

const W = 640;
const H = 200;
const PAD = { top: 12, right: 16, bottom: 24, left: 8 };

function buildPath(points: Array<{ x: number; y: number }>): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

/**
 * Projected cash-flow line — visual-design-personal.md §15.1 / §2.4:
 * actual = solid line, projected = dashed line, muted area under the curve.
 * Dependency-free inline SVG (recharts renders blank in this Next/React setup).
 */
export function CashflowChart({
  points,
  /** Index of "today" — points before it are actual, from it on are projected. */
  todayIndex,
  className,
}: {
  points: CashflowPoint[];
  todayIndex: number;
  className?: string;
}) {
  if (points.length < 2) {
    return (
      <div className={cn("flex h-48 items-center justify-center rounded-lg bg-surface-secondary text-small text-muted-foreground", className)}>
        Sin datos suficientes para proyectar.
      </div>
    );
  }

  const values = points.map((p) => p.balance);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  // Pad the domain so a near-flat projection sits centered instead of glued to
  // an edge; only pull in the zero baseline when it's actually near the data.
  const pad = (rawMax - rawMin || Math.abs(rawMax) || 1) * 0.18;
  const min = Math.min(rawMin - pad, rawMax >= 0 && rawMin <= pad ? 0 : rawMin - pad);
  const max = rawMax + pad;
  const span = max - min || 1;
  const showZero = min <= 0 && max >= 0;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const coords = points.map((p, i) => ({
    x: PAD.left + (i / (points.length - 1)) * innerW,
    y: PAD.top + (1 - (p.balance - min) / span) * innerH,
  }));

  const clampedToday = Math.max(1, Math.min(points.length - 1, todayIndex));
  const actual = coords.slice(0, clampedToday + 1);
  const projected = coords.slice(clampedToday);
  const zeroY = PAD.top + (1 - (0 - min) / span) * innerH;
  const baseY = showZero ? zeroY : H - PAD.bottom;
  const todayX = coords[clampedToday].x;

  const areaPath =
    actual.length > 1
      ? `${buildPath(actual)} L${actual.at(-1)!.x.toFixed(1)},${baseY.toFixed(1)} L${actual[0].x.toFixed(1)},${baseY.toFixed(1)} Z`
      : "";

  const firstLabel = points[0].label;
  const todayLabel = points[clampedToday].label;
  const lastLabel = points.at(-1)!.label;

  return (
    <div className={cn("w-full", className)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Balance proyectado a fin de mes">
        {showZero ? <line x1={PAD.left} x2={W - PAD.right} y1={zeroY} y2={zeroY} stroke="var(--border)" strokeWidth="1" /> : null}
        {(() => {
          const projArea = `${buildPath(projected)} L${projected.at(-1)!.x.toFixed(1)},${baseY.toFixed(1)} L${projected[0].x.toFixed(1)},${baseY.toFixed(1)} Z`;
          return <path d={projArea} fill="var(--primary)" fillOpacity="0.06" />;
        })()}
        {actual.length > 1 ? <path d={areaPath} fill="var(--primary)" fillOpacity="0.1" /> : null}
        {actual.length > 1 ? (
          <path d={buildPath(actual)} fill="none" stroke="var(--chart-1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        ) : null}
        <path
          d={buildPath(projected)}
          fill="none"
          stroke="var(--chart-1)"
          strokeWidth="2.5"
          strokeDasharray="2 5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line x1={todayX} x2={todayX} y1={PAD.top} y2={H - PAD.bottom} stroke="var(--chart-1)" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx={todayX} cy={coords[clampedToday].y} r="3.5" fill="var(--chart-1)" />
        <circle cx={coords.at(-1)!.x} cy={coords.at(-1)!.y} r="3.5" fill="var(--chart-1)" />
        <text x={todayX} y={PAD.top + 2} textAnchor="middle" className="fill-[var(--chart-1)] text-[10px] font-medium">
          Hoy
        </text>
      </svg>
      <div className="mt-1 flex justify-between text-caption text-muted-foreground">
        <span>{firstLabel}</span>
        <span>{todayLabel}</span>
        <span>{lastLabel}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-caption text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-0.5 w-4 rounded-full bg-[var(--chart-1)]" /> Real
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-0.5 w-4 rounded-full border-t-2 border-dashed border-[var(--chart-1)]" /> Proyectado
        </span>
      </div>
    </div>
  );
}
