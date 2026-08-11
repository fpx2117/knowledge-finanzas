"use client";
import Link from "next/link";
import { useState, useTransition, useActionState } from "react";

import { suggestTransactionCategoryAction } from "../actions/suggest-category";
import { suggestMerchantAction } from "../actions/suggest-merchant";

type Option = { id: string; name: string; currencyCode?: string; type?: string };
type Action = (previous: unknown, formData: FormData) => Promise<{ ok: boolean; error?: { message: string; fieldErrors?: Record<string, string[]> } }>;

export function TransactionForm({ mode, accounts, categories, action }: { mode: "INCOME" | "EXPENSE"; accounts: Option[]; categories: Option[]; action: Action }) {
  const [state, formAction, pending] = useActionState(action, null);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [merchant, setMerchant] = useState("");
  const errors = state?.ok === false ? state.error?.fieldErrors ?? {} : {};
  const selectedAccount = accounts.find((account) => account.id === accountId);

  return <form className="transaction-form" action={formAction}>
    {state?.ok === false && <div className="form-alert" role="alert"><strong>{state.error?.message}</strong></div>}
    <div className="transaction-amount-field"><label htmlFor="transaction-amount">Monto</label><div className="amount-input-wrap"><span>{selectedAccount?.currencyCode ?? "ARS"}</span><input id="transaction-amount" name="amount" type="text" inputMode="decimal" placeholder="0.00" required aria-invalid={Boolean(errors.amount)} /></div>{errors.amount && <p className="field-error">{errors.amount[0]}</p>}</div>
    <div className="field-group"><label htmlFor="transaction-account">Cuenta</label><select id="transaction-account" name="accountId" value={accountId} onChange={(event) => setAccountId(event.target.value)} required><option value="" disabled>Seleccioná una cuenta</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.currencyCode}</option>)}</select>{accounts.length === 0 && <p className="field-error">Primero creá una cuenta activa.</p>}</div>
    <div className="field-group"><label htmlFor="transaction-category">Categoría <span className="optional-label">(opcional)</span></label><select id="transaction-category" name="categoryId" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">Sin categoría</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
      <CategorySuggestion mode={mode} description={description} merchant={merchant} categories={categories} onAccept={setCategoryId} />
    </div>
    <div className="field-group"><label htmlFor="transaction-description">Descripción</label><input id="transaction-description" name="description" type="text" required placeholder={mode === "EXPENSE" ? "Ej. Compra semanal" : "Ej. Cobro de trabajo"} value={description} onChange={(event) => setDescription(event.target.value)} aria-invalid={Boolean(errors.description)} />{errors.description && <p className="field-error">{errors.description[0]}</p>}</div>
    {mode === "EXPENSE" && <div className="field-group"><label htmlFor="transaction-merchant">Comercio <span className="optional-label">(opcional)</span></label><input id="transaction-merchant" name="merchant" type="text" value={merchant} onChange={(event) => setMerchant(event.target.value)} />
      <MerchantSuggestion description={description} merchant={merchant} onAccept={setMerchant} />
    </div>}
    <div className="field-group"><label htmlFor="transaction-occurred-at">Fecha</label><input id="transaction-occurred-at" name="occurredAt" type="date" defaultValue="2026-01-01" required aria-invalid={Boolean(errors.occurredAt)} />{errors.occurredAt && <p className="field-error">La fecha debe ser válida y no futura.</p>}</div>
    <div className="field-group"><label htmlFor="transaction-notes">Notas <span className="optional-label">(opcional)</span></label><textarea id="transaction-notes" name="notes" rows={3} /></div>
    <div className="form-actions"><Link className="secondary-button" href="/transactions">Cancelar</Link><button className="primary-button" type="submit" disabled={pending || accounts.length === 0}>{pending ? `Guardando ${mode === "EXPENSE" ? "gasto" : "ingreso"}...` : `Registrar ${mode === "EXPENSE" ? "gasto" : "ingreso"}`}</button></div>
  </form>;
}

// Explicit accept/change/ignore (docs task-037 scope) — never auto-applies. Accepting only sets
// the category select's value; it never touches amount, account, type or posted state.
function CategorySuggestion({ mode, description, merchant, categories, onAccept }: { mode: "INCOME" | "EXPENSE"; description: string; merchant: string; categories: Option[]; onAccept: (categoryId: string) => void }) {
  const [pending, startTransition] = useTransition();
  const [suggestion, setSuggestion] = useState<{ categoryId: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  function requestSuggestion() {
    setDismissed(false);
    setError(null);
    startTransition(async () => {
      const result = await suggestTransactionCategoryAction({ transactionType: mode, description, merchant: merchant || null });
      if (!result.ok) { setError(result.error.message); return; }
      if (result.categoryId === null) { setSuggestion(null); setError("No encontramos una sugerencia con suficiente confianza."); return; }
      const match = categories.find((category) => category.id === result.categoryId);
      setSuggestion(match ? { categoryId: match.id, name: match.name } : null);
    });
  }

  if (dismissed) return null;

  return <div className="ai-suggestion">
    {!suggestion && !error && <button type="button" className="text-button" onClick={requestSuggestion} disabled={pending || !description.trim()}>{pending ? "Sugiriendo..." : "Sugerir categoría con IA"}</button>}
    {error && <p className="field-help">{error}</p>}
    {suggestion && <div className="ai-suggestion-result">
      <span>Sugerencia IA: <strong>{suggestion.name}</strong></span>
      <button type="button" className="text-button" onClick={() => { onAccept(suggestion.categoryId); setSuggestion(null); setDismissed(true); }}>Usar categoría</button>
      <button type="button" className="text-button" onClick={() => { setSuggestion(null); setDismissed(true); }}>Ignorar</button>
    </div>}
  </div>;
}

// The raw merchant/description the user typed is never overwritten by this widget on its own —
// only an explicit "Usar sugerencia" click calls onAccept, which replaces the merchant field's
// value; the description field is never touched by merchant normalization.
function MerchantSuggestion({ description, merchant, onAccept }: { description: string; merchant: string; onAccept: (merchant: string) => void }) {
  const [pending, startTransition] = useTransition();
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  function requestSuggestion() {
    setDismissed(false);
    setError(null);
    startTransition(async () => {
      const result = await suggestMerchantAction({ description, rawMerchant: merchant || null });
      if (!result.ok) { setError(result.error.message); return; }
      if (result.normalizedMerchant === null) { setSuggestion(null); setError("No encontramos una sugerencia con suficiente confianza."); return; }
      setSuggestion(result.normalizedMerchant);
    });
  }

  if (dismissed) return null;

  return <div className="ai-suggestion">
    {!suggestion && !error && <button type="button" className="text-button" onClick={requestSuggestion} disabled={pending || !description.trim()}>{pending ? "Sugiriendo..." : "Sugerir comercio con IA"}</button>}
    {error && <p className="field-help">{error}</p>}
    {suggestion && <div className="ai-suggestion-result">
      <span>Sugerencia IA: <strong>{suggestion}</strong></span>
      <button type="button" className="text-button" onClick={() => { onAccept(suggestion); setSuggestion(null); setDismissed(true); }}>Usar sugerencia</button>
      <button type="button" className="text-button" onClick={() => { setSuggestion(null); setDismissed(true); }}>Ignorar</button>
    </div>}
  </div>;
}
