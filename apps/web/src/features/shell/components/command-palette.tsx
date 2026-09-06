"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpenIcon,
  CompassIcon,
  PlusIcon,
  ReceiptTextIcon,
  SearchIcon,
  SettingsIcon,
} from "lucide-react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { MoneyAmount } from "@/components/financial/money-amount";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { openQuickAdd } from "@/features/capture/components/quick-add-root";
import { searchEntitiesAction, type SearchResult } from "@/features/shell/actions/search-actions";

type Destination = { label: string; href: string; keywords?: string };

const EXTRA_DESTINATIONS: Destination[] = [
  { label: "Configuración", href: "/settings" },
  { label: "Perfil", href: "/settings/profile" },
  { label: "Preferencias", href: "/settings/preferences" },
  { label: "Categorías", href: "/settings/categories" },
  { label: "Reglas automáticas", href: "/settings/rules" },
  { label: "Importaciones", href: "/settings/imports" },
  { label: "Suscripción", href: "/settings/plan", keywords: "plan pago billing" },
  { label: "Centro de ayuda", href: "/help" },
  { label: "Resolver un problema", href: "/help/troubleshoot", keywords: "diagnóstico saldo" },
  { label: "Estado del servicio", href: "/help/status" },
];

function navDestinations(): Destination[] {
  const out: Destination[] = [];
  for (const item of NAV_ITEMS) {
    out.push({ label: item.label, href: item.href });
    for (const child of item.children ?? []) {
      out.push({ label: `${item.label} · ${child.label}`, href: child.href });
    }
  }
  return out;
}

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchFailed, setSearchFailed] = useState(false);
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allDestinations = useMemo(() => [...navDestinations(), ...EXTRA_DESTINATIONS], []);
  const q = query.trim().toLowerCase();
  const destinations =
    q.length === 0
      ? allDestinations
      : allDestinations.filter((d) => `${d.label} ${d.keywords ?? ""} ${d.href}`.toLowerCase().includes(q));
  const showRegistrar = q.length === 0 || "registrar un movimiento nuevo gasto ingreso".includes(q);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setSearchFailed(false);
    }
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      setSearchFailed(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const res = await searchEntitiesAction(query);
        if (res.ok) {
          setResults(res.results);
          setSearchFailed(false);
        } else {
          setResults([]);
          setSearchFailed(true);
        }
      });
    }, 220);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Paleta de comandos"
      description="Navegá o abrí una acción segura. La paleta nunca modifica tus datos."
    >
      {/* shouldFilter=false — we filter destinations ourselves and stream search results from the
          server; cmdk still drives keyboard navigation over whatever is rendered. */}
      <Command shouldFilter={false}>
      <CommandInput placeholder="Buscar páginas, movimientos o acciones…" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>Sin resultados.</CommandEmpty>

        {showRegistrar ? (
          <CommandGroup heading="Acciones">
            <CommandItem
              value="registrar-movimiento"
              onSelect={() => {
                onOpenChange(false);
                openQuickAdd();
              }}
            >
              <PlusIcon className="size-4 text-muted-foreground" /> Registrar un movimiento
            </CommandItem>
          </CommandGroup>
        ) : null}

        {destinations.length > 0 ? <CommandSeparator /> : null}

        <CommandGroup heading="Ir a">
          {destinations.map((dest) => (
            <CommandItem key={dest.href} value={`dest-${dest.href}`} onSelect={() => go(dest.href)}>
              {dest.href.startsWith("/settings") ? (
                <SettingsIcon className="size-4 text-muted-foreground" />
              ) : dest.href.startsWith("/help") ? (
                <BookOpenIcon className="size-4 text-muted-foreground" />
              ) : (
                <CompassIcon className="size-4 text-muted-foreground" />
              )}
              {dest.label}
            </CommandItem>
          ))}
        </CommandGroup>

        {query.trim().length >= 2 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Movimientos">
              {searchFailed ? (
                <div className="px-2 py-3 text-caption text-muted-foreground">
                  La búsqueda no está disponible ahora. Podés navegar a{" "}
                  <button type="button" className="font-medium text-brand hover:underline" onClick={() => go("/transactions")}>
                    Transacciones
                  </button>{" "}
                  y filtrar allí.
                </div>
              ) : results.length === 0 ? (
                <div className="px-2 py-3 text-caption text-muted-foreground">Sin movimientos que coincidan.</div>
              ) : (
                results.map((result) => (
                  <CommandItem key={result.id} value={`mov-${result.id}`} onSelect={() => go(result.href)}>
                    <ReceiptTextIcon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{result.label}</span>
                      <span className="text-caption text-muted-foreground">{result.sublabel}</span>
                    </span>
                    <MoneyAmount amount={result.amount} currency={result.currencyCode} variant="compact" className="shrink-0 text-caption" />
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </>
        ) : null}
      </CommandList>
      <div className="flex items-center gap-1.5 border-t border-border px-3 py-2 text-caption text-muted-foreground">
        <SearchIcon className="size-3" /> La paleta sólo navega e inicia flujos — nunca modifica tus datos.
      </div>
      </Command>
    </CommandDialog>
  );
}
