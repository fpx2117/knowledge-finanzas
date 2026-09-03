"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { UploadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, fieldControlClass } from "@/components/shared/form-field";
import { commitImportAction, previewImportAction, type CommitImportState } from "../actions/import-actions";
import type { ImportPreview } from "../services/import-service";

const initial: CommitImportState | null = null;

const TYPE_LABEL = { EXPENSE: "Gasto", INCOME: "Ingreso" } as const;

export function ImportWizard({ accounts }: { accounts: Array<{ id: string; name: string; currencyCode: string }> }) {
  const [text, setText] = useState("");
  const [filename, setFilename] = useState<string | null>(null);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [analyzing, startAnalyze] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const [state, commit, committing] = useActionState(commitImportAction, initial);

  function onFile(file: File) {
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setText(String(reader.result ?? ""));
      setPreview(null);
    };
    reader.readAsText(file);
  }

  const columnLabel = (i: number) => (preview?.ok ? preview.mapping.headers?.[i] ?? `Columna ${i + 1}` : "");

  if (state?.ok) {
    const r = state.result;
    return (
      <div className="rounded-lg border border-border p-4">
        <p className="text-body font-medium text-foreground">Importación completa</p>
        <ul className="mt-2 space-y-1 text-small text-muted-foreground">
          <li>{r.imported} movimientos importados</li>
          {r.skippedDuplicates > 0 ? <li>{r.skippedDuplicates} salteados por ser duplicados de movimientos existentes</li> : null}
          {r.unreadable > 0 ? <li>{r.unreadable} filas ilegibles ignoradas</li> : null}
          {r.failed > 0 ? <li>{r.failed} filas rechazadas (fecha fuera de rango u otro error)</li> : null}
        </ul>
        <Link href="/transactions" className="mt-3 inline-block text-small font-medium text-brand hover:underline">Ver movimientos →</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <Field label="Cuenta" htmlFor="import-account">
        <select id="import-account" className={fieldControlClass} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name} · {a.currencyCode}</option>
          ))}
        </select>
      </Field>

      <div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.tsv,.txt,text/csv,text/plain"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
        />
        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
          <UploadIcon className="size-4" /> Subir CSV
        </Button>
        {filename ? <span className="ml-3 text-caption text-muted-foreground">{filename}</span> : null}
      </div>

      <Field label="…o pegá el contenido" htmlFor="import-text">
        <textarea
          id="import-text"
          className={`${fieldControlClass} min-h-[140px] font-mono text-caption`}
          value={text}
          onChange={(e) => { setText(e.target.value); setPreview(null); }}
          placeholder={"Fecha;Descripción;Débito;Crédito\n01/09/2026;COMPRA CARREFOUR;15.400,00;"}
        />
      </Field>

      <div>
        <Button
          type="button"
          disabled={analyzing || !text.trim()}
          onClick={() => startAnalyze(async () => setPreview(await previewImportAction(text)))}
        >
          {analyzing ? "Analizando…" : "Analizar"}
        </Button>
      </div>

      {preview && !preview.ok ? (
        <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-small text-[var(--negative)]">{preview.error}</p>
      ) : null}

      {preview?.ok ? (
        <div className="flex flex-col gap-3">
          <div className="rounded-md bg-muted px-3 py-2.5 text-caption text-muted-foreground">
            <p>
              Detectamos: <strong>{columnLabel(preview.mapping.date)}</strong> = fecha ·{" "}
              <strong>{columnLabel(preview.mapping.description)}</strong> = descripción ·{" "}
              {preview.mapping.amount.kind === "single"
                ? <><strong>{columnLabel(preview.mapping.amount.column)}</strong> = importe</>
                : <><strong>{columnLabel(preview.mapping.amount.debit)}</strong> / <strong>{columnLabel(preview.mapping.amount.credit)}</strong> = débito / crédito</>}
              {" "}({Math.round(preview.mapping.confidence * 100)}% de confianza)
            </p>
            {preview.mapping.warnings.map((w) => <p key={w} className="mt-1 text-[var(--warning)]">{w}</p>)}
            <p className="mt-1">{preview.stats.readable} de {preview.stats.total} filas listas para importar{preview.stats.errors ? ` · ${preview.stats.errors} con problemas` : ""}.</p>
          </div>

          <div className="max-h-[320px] overflow-auto rounded-md border border-border">
            <table className="w-full text-caption">
              <thead className="sticky top-0 bg-card text-muted-foreground">
                <tr>
                  <th className="px-2 py-1.5 text-left font-medium">Fecha</th>
                  <th className="px-2 py-1.5 text-left font-medium">Descripción</th>
                  <th className="px-2 py-1.5 text-right font-medium">Importe</th>
                  <th className="px-2 py-1.5 text-left font-medium">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {preview.sample.map((row) => (
                  <tr key={row.index} className={row.error ? "bg-negative-soft/50" : "border-t border-border"}>
                    <td className="px-2 py-1.5">{row.occurredOn ?? "—"}</td>
                    <td className="px-2 py-1.5">{row.description}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{row.amount?.toLocaleString("es-AR") ?? "—"}</td>
                    <td className="px-2 py-1.5">{row.error ? <span className="text-[var(--negative)]">{row.error}</span> : row.type ? TYPE_LABEL[row.type] : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {state?.ok === false ? (
            <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-small text-[var(--negative)]">{state.error.message}</p>
          ) : null}

          <form action={commit}>
            <input type="hidden" name="accountId" value={accountId} />
            <input type="hidden" name="text" value={text} />
            {filename ? <input type="hidden" name="filename" value={filename} /> : null}
            <Button type="submit" disabled={committing || preview.stats.readable === 0}>
              {committing ? "Importando…" : `Importar ${preview.stats.readable} movimientos`}
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
