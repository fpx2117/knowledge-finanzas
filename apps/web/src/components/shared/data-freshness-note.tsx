import Link from "next/link";

import { formatLongDate } from "@/lib/format";

// spec 01 §17 / spec 04 §9.9 / spec 08 §18 — el sistema no afirma "completo"; muestra hasta
// cuándo hay datos y, si hace mucho que no se registra nada, avisa que las cifras podrían estar
// incompletas (sin alarmismo). `todayISO` y `lastMovementDate` son YYYY-MM-DD en la zona del
// usuario.
const STALE_DAYS = 12;

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

export function DataFreshnessNote({
  lastMovementDate,
  todayISO,
  uncategorizedCount = 0,
}: {
  lastMovementDate: string | null;
  todayISO: string;
  uncategorizedCount?: number;
}) {
  if (!lastMovementDate) return null;
  const stale = daysBetween(lastMovementDate, todayISO) >= STALE_DAYS;

  if (stale) {
    return (
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md bg-warning-soft px-3 py-2 text-small text-[var(--warning)]">
        <span>Tus cifras podrían estar incompletas — el último movimiento es del {formatLongDate(lastMovementDate)}.</span>
        <Link href="/transactions/new" className="font-medium underline">
          Registrar un movimiento
        </Link>
      </p>
    );
  }

  return (
    <p className="text-caption text-muted-foreground">
      Datos hasta el {formatLongDate(lastMovementDate)}.
      {uncategorizedCount > 0 ? (
        <>
          {" "}
          <Link href="/transactions/pending" className="font-medium text-brand underline">
            {uncategorizedCount} movimiento{uncategorizedCount === 1 ? "" : "s"} sin categoría
          </Link>{" "}
          pueden afectar los totales.
        </>
      ) : null}
    </p>
  );
}
