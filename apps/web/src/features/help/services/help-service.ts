import { createHelpDiagnosticQueries, db, type Database } from "@know-finanzas/db";
import { Money } from "@know-finanzas/finance";

export type DiagnosticFinding = {
  key: string;
  title: string;
  detail: string;
  cta?: { label: string; href: string };
};

export type ChecklistItem = { key: string; label: string; done: boolean; href: string };

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long" }).format(date);
}

export function createHelpService(database: Database = db, now: () => Date = () => new Date()) {
  const diagnostics = createHelpDiagnosticQueries(database);

  return {
    // spec 12 §11 — read-only. Detects common causes of a mismatched balance; never corrects.
    async diagnoseBalance(user: { id: string; timezone: string }): Promise<DiagnosticFinding[]> {
      const nowDate = now();
      const recentSince = new Date(nowDate.getTime() - 90 * 86_400_000);
      const s = await diagnostics.balanceSignals(user.id, { now: nowDate, recentSince });
      const out: DiagnosticFinding[] = [];

      if (s.uncategorizedCount > 0) {
        out.push({
          key: "uncategorized",
          title: `${s.uncategorizedCount} ${s.uncategorizedCount === 1 ? "movimiento pendiente" : "movimientos pendientes"} de revisión`,
          detail: "Un movimiento sin categoría no cambia tu saldo, pero puede hacer más difícil cuadrar tus reportes.",
          cta: { label: "Ver pendientes", href: "/transactions/pending" },
        });
      }
      for (const batch of s.importExceptions) {
        const pending = Number(batch.skipped) + Number(batch.failed);
        out.push({
          key: `import-${batch.id}`,
          title: `Una importación tiene ${pending} ${pending === 1 ? "fila" : "filas"} sin procesar`,
          detail: `El archivo "${batch.filename}" del ${formatDate(batch.createdAt)} tuvo filas salteadas o con error. Puede que falten movimientos.`,
          cta: { label: "Ver importaciones", href: "/settings/imports" },
        });
      }
      for (const adj of s.adjustments) {
        const sign = adj.type === "ADJUSTMENT_OUT" ? "-" : "+";
        out.push({
          key: `adjustment-${adj.id}`,
          title: `Hay un ajuste de saldo de ${sign}${new Intl.NumberFormat("es-AR", { style: "currency", currency: adj.currencyCode, maximumFractionDigits: 0 }).format(Number(Money.fromString(adj.amount, adj.currencyCode).toString()))}`,
          detail: `Registrado el ${formatDate(adj.occurredAt)}. Un ajuste corrige el saldo directamente y puede explicar una diferencia.`,
          cta: { label: "Ver movimiento", href: `/transactions/${adj.id}` },
        });
      }
      if (s.futureDatedCount > 0) {
        out.push({
          key: "future-dated",
          title: `${s.futureDatedCount} ${s.futureDatedCount === 1 ? "movimiento tiene" : "movimientos tienen"} fecha futura`,
          detail: "Un movimiento con fecha posterior a hoy ya afecta el saldo. Si comparás contra el banco, todavía no aparece allí.",
          cta: { label: "Ver movimientos", href: "/transactions" },
        });
      }
      if (s.recentVoidedCount > 0) {
        out.push({
          key: "voided",
          title: `${s.recentVoidedCount} ${s.recentVoidedCount === 1 ? "movimiento anulado" : "movimientos anulados"} en los últimos 90 días`,
          detail: "Un movimiento anulado deja de contar en el saldo. Si lo esperabas en el total, esa puede ser la diferencia.",
          cta: { label: "Ver movimientos", href: "/transactions" },
        });
      }
      if (s.currencyCount > 1) {
        out.push({
          key: "multi-currency",
          title: "Tenés cuentas en más de una moneda",
          detail: "El saldo total no combina monedas. Cada moneda se muestra por separado — revisá que estés comparando la misma.",
          cta: { label: "Ver cuentas", href: "/accounts" },
        });
      }

      return out;
    },

    async gettingStartedChecklist(user: { id: string; timezone: string }): Promise<ChecklistItem[]> {
      const state = await diagnostics.gettingStartedState(user.id);
      return [
        { key: "account", label: "Crear una cuenta financiera", done: state.accountCount > 0, href: "/accounts/new" },
        { key: "movements", label: "Registrar 5 movimientos", done: state.movementCount >= 5, href: "/transactions/new" },
        { key: "categorize", label: "Revisar y categorizar tus gastos", done: state.categorizedExpenseCount > 0, href: "/transactions/pending" },
        { key: "obligation", label: "Crear una obligación", done: state.debtCount > 0, href: "/obligations/new" },
        { key: "cashflow", label: "Ver tu flujo de caja", done: state.movementCount >= 5, href: "/reports/cash-flow" },
        { key: "budget", label: "Crear un presupuesto", done: state.budgetCount > 0, href: "/budgets/new" },
        { key: "goal", label: "Crear una meta", done: state.goalCount > 0, href: "/goals/new" },
      ];
    },
  };
}
