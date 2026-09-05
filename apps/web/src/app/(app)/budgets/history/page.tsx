import Link from "next/link";

import { budgetRepository, categoryRepository, createBudgetQueries, db } from "@know-finanzas/db";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ProgressBar } from "@/components/shared/progress-bar";
import { StatusChip } from "@/components/shared/status-chip";
import { MoneyAmount } from "@/components/financial/money-amount";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { todayInTimezone } from "@know-finanzas/finance";
import { createBudgetService, type BudgetOverviewItem } from "@/features/budgets/services/budget-service";
import { cn } from "@/lib/utils";

const service = createBudgetService({
  budgets: budgetRepository,
  categories: categoryRepository,
  budgetQueries: createBudgetQueries(db),
});

const STATUS_META: Record<BudgetOverviewItem["status"], { label: string; tone: "positive" | "warning" | "negative"; bar: "normal" | "warning" | "exceeded" }> = {
  NORMAL: { label: "En control", tone: "positive", bar: "normal" },
  NEAR_LIMIT: { label: "Al límite", tone: "warning", bar: "warning" },
  EXCEEDED: { label: "Excedido", tone: "negative", bar: "exceeded" },
};
const HEAD = "text-caption font-semibold uppercase tracking-wider text-muted-foreground";
const MONTH_LABEL = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" });

function monthsBack(year: number, month: number, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const total = year * 12 + (month - 1) - i;
    return { year: Math.floor(total / 12), month: (total % 12) + 1 };
  });
}

// WP-ROUTES-SUBVIEWS: presupuestos no son filas por mes — son un límite estándar por categoría —
// así que "Historial" recalcula el consumo real contra meses pasados (?month=YYYY-MM), nunca lee
// una foto guardada.
export default async function BudgetsHistoryPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await requireCurrentUser();
  const today = todayInTimezone(new Date(), user.timezone);
  const [currentYear, currentMonth] = today.split("-").map(Number);
  const options = monthsBack(currentYear, currentMonth, 6);

  const requested = (await searchParams).month;
  const [reqYear, reqMonth] = requested?.match(/^\d{4}-\d{2}$/) ? requested.split("-").map(Number) : [options[1].year, options[1].month];
  const selected = options.find((o) => o.year === reqYear && o.month === reqMonth) ?? options[1];

  const budgets = await service.getBudgetOverviewForMonth(user, selected.year, selected.month);
  const totalLimit = budgets.reduce((s, b) => s + Number(b.limit), 0);
  const totalSpent = budgets.reduce((s, b) => s + Number(b.spent), 0);
  const currency = budgets[0]?.currencyCode;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Presupuestos / Historial" description="Cómo te fue con tu presupuesto en meses anteriores." />

      <nav aria-label="Elegir mes" className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = o.year === selected.year && o.month === selected.month;
          const label = MONTH_LABEL.format(new Date(Date.UTC(o.year, o.month - 1, 1)));
          return (
            <Link
              key={`${o.year}-${o.month}`}
              href={`/budgets/history?month=${o.year}-${String(o.month).padStart(2, "0")}`}
              className={cn(
                "rounded-full border px-3 py-1.5 text-small capitalize transition-colors",
                active ? "border-brand bg-brand-subtle font-medium text-brand" : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <SectionCard title="Resumen del mes" eyebrow={currency}>
        {budgets.length === 0 ? (
          <EmptyState title="Sin datos para este mes" description="No había presupuestos activos o movimientos en el período elegido." />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-caption text-muted-foreground">Presupuestado</p>
              <MoneyAmount amount={String(totalLimit)} currency={currency} variant="compact" className="text-metric font-medium text-foreground" />
            </div>
            <div>
              <p className="text-caption text-muted-foreground">Gastado</p>
              <MoneyAmount amount={String(totalSpent)} currency={currency} variant="compact" className="text-metric font-medium text-foreground" />
            </div>
            <div>
              <p className="text-caption text-muted-foreground">Diferencia</p>
              <MoneyAmount amount={String(totalLimit - totalSpent)} currency={currency} variant="compact" className="text-metric font-medium text-foreground" />
            </div>
          </div>
        )}
      </SectionCard>

      {budgets.length > 0 ? (
        <SectionCard title="Por categoría" contentClassName="gap-0">
          <div className="-mx-5 overflow-x-auto sm:-mx-6">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={`pl-5 sm:pl-6 ${HEAD}`}>Categoría</TableHead>
                  <TableHead className={`hidden text-right sm:table-cell ${HEAD}`}>Límite</TableHead>
                  <TableHead className={`text-right ${HEAD}`}>Gastado</TableHead>
                  <TableHead className={`hidden w-40 md:table-cell ${HEAD}`}>Progreso</TableHead>
                  <TableHead className={`pr-5 sm:pr-6 ${HEAD}`}>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets.map((budget) => {
                  const meta = STATUS_META[budget.status];
                  const usage = Number(budget.usagePercent);
                  return (
                    <TableRow key={budget.budgetId} className="h-[52px]">
                      <TableCell className="pl-5 sm:pl-6 text-small font-medium text-foreground">{budget.categoryName}</TableCell>
                      <TableCell className="hidden text-right sm:table-cell">
                        <MoneyAmount amount={budget.limit} currency={budget.currencyCode} variant="compact" className="text-small text-muted-foreground" />
                      </TableCell>
                      <TableCell className="text-right">
                        <MoneyAmount amount={budget.spent} currency={budget.currencyCode} variant="compact" className="text-small font-medium" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <ProgressBar value={usage} state={meta.bar} className="w-24" aria-label={`${Math.round(usage)}% usado`} />
                          <span className="text-caption tabular-nums text-muted-foreground">{Math.round(usage)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="pr-5 sm:pr-6">
                        <StatusChip tone={meta.tone}>{meta.label}</StatusChip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
