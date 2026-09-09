import { cn } from "@/lib/utils";

// spec 08 §7.7 — con múltiples monedas y sin conversión, el reporte se expresa en UNA moneda
// elegible (nunca combinada). Server component con `<a>` (carga completa) — ver
// [[nextjs-15-5-revalidatepath-hang]]. Sólo aparece con 2+ monedas.
//
// Además ofrece un toggle "Convertir a {moneda} ≈": cuando hay una cotización disponible
// (dólar blue) y cuentas en otra moneda, suma todo a la moneda activa de forma EXPLÍCITA y
// estimada (spec 00 §285). El aviso de estimación lo pone `ConversionNote`.
export function ReportCurrencyPicker({
  basePath,
  currencies,
  active,
  period,
  converting = false,
  canConvert = false,
}: {
  basePath: string;
  currencies: string[];
  active: string;
  period?: string;
  converting?: boolean;
  canConvert?: boolean;
}) {
  if (currencies.length < 2) return null;

  const href = (params: { currency?: string; convert?: boolean }) => {
    const search = new URLSearchParams();
    if (period) search.set("period", period);
    search.set("currency", params.currency ?? active);
    if (params.convert ?? converting) search.set("convert", "1");
    return `${basePath}?${search.toString()}`;
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Moneda del reporte">
        <span className="mr-1 text-caption text-muted-foreground">Moneda:</span>
        {currencies.map((code) => (
          <a
            key={code}
            href={href({ currency: code })}
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

      {(canConvert || converting) ? (
        <a
          href={href({ convert: !converting })}
          aria-current={converting ? "true" : undefined}
          className={cn(
            "rounded-full border px-3 py-1 text-caption font-medium transition-colors",
            converting
              ? "border-brand-border bg-brand-subtle text-brand"
              : "border-dashed border-border text-foreground-secondary hover:bg-secondary",
          )}
        >
          {converting ? `Convertido a ${active} ≈` : `Convertir a ${active} ≈`}
        </a>
      ) : null}
    </div>
  );
}
