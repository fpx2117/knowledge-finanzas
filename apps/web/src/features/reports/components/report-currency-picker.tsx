import { cn } from "@/lib/utils";

// spec 08 §7.7 — con múltiples monedas y sin conversión, el reporte se expresa en UNA moneda
// elegible (nunca combinada). Server component con `<a>` (carga completa) — ver
// [[nextjs-15-5-revalidatepath-hang]]. Sólo aparece con 2+ monedas.
export function ReportCurrencyPicker({
  basePath,
  currencies,
  active,
  period,
}: {
  basePath: string;
  currencies: string[];
  active: string;
  period?: string;
}) {
  if (currencies.length < 2) return null;
  const href = (code: string) => {
    const params = new URLSearchParams();
    if (period) params.set("period", period);
    params.set("currency", code);
    return `${basePath}?${params.toString()}`;
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Moneda del reporte">
      <span className="mr-1 text-caption text-muted-foreground">Moneda:</span>
      {currencies.map((code) => (
        <a
          key={code}
          href={href(code)}
          aria-current={code === active ? "true" : undefined}
          className={cn(
            "rounded-full border px-3 py-1 text-caption font-medium transition-colors",
            code === active
              ? "border-brand-border bg-brand-subtle text-brand"
              : "border-border text-foreground-secondary hover:bg-secondary",
          )}
        >
          {code}
        </a>
      ))}
    </div>
  );
}
