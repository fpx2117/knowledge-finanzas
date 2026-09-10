"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarIcon, ChevronDownIcon, ChevronRightIcon, RotateCwIcon, SlidersHorizontalIcon, WalletIcon } from "lucide-react";

import { FinanceIcon, type FinanceIconName } from "@/design-system/icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, fieldControlClass } from "@/components/shared/form-field";
import { KaiAvatar } from "@/features/kai/components/kai-avatar";
import { kaiToast } from "@/components/shared/kai-toast";
import { InferenceBadge, type InferenceOrigin } from "@/components/shared/inference-badge";
import { getTodayInTimezone } from "@/lib/date";
import { cn } from "@/lib/utils";
import { MerchantAutocomplete } from "./merchant-autocomplete";
import type { MerchantAutocompleteSuggestion } from "../lib/merchant-autocomplete";
import {
  getQuickAddContextAction,
  quickCreateTransactionAction,
  quickVoidTransactionAction,
  searchMerchantSuggestionsAction,
  type QuickAddContext,
  type QuickBudget,
  type QuickResult,
  type QuickTemplate,
  type RepeatPrefill,
} from "../actions/quick-actions";

type QuickType = "EXPENSE" | "INCOME";

const TYPES: Array<{ key: QuickType; label: string; hint: string; icon: FinanceIconName }> = [
  { key: "EXPENSE", label: "Gasto", hint: "Algo que pagaste", icon: "expense" },
  { key: "INCOME", label: "Ingreso", hint: "Plata que entró", icon: "income" },
];

const initial: QuickResult | null = null;
const emptyForm = { amount: "", description: "", accountId: "", categoryId: "", merchant: "", occurredAt: "" };

function money(value: string | number) {
  return `$${Number(value).toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
}

/** Live thousand-separator formatting while typing: "18500" → "18.500", "18500,5" → "18.500,5". */
function formatAmountInput(raw: string): string {
  const cleaned = raw.replace(/[^\d,]/g, "");
  const [intPart, ...rest] = cleaned.split(",");
  const decPart = rest.join("").slice(0, 2);
  const intFmt = intPart.replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  if (cleaned.includes(",")) return `${intFmt || "0"},${decPart}`;
  return intFmt;
}

/** "18.500,50" (display) → "18500.50" (what moneyInputSchema expects). */
function normalizeAmount(display: string): string {
  return display.replace(/\./g, "").replace(",", ".");
}

/** Compact "$12k" / "$1,2M" for tight chips. */
function moneyCompact(value: string | number) {
  const n = Math.abs(Number(value));
  if (n >= 1_000_000) return `$${(n / 1_000_000).toLocaleString("es-AR", { maximumFractionDigits: 1 })}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
}

const BUDGET_TONE = {
  NORMAL: { bar: "bg-[var(--success)]", value: "text-[var(--success)]" },
  NEAR_LIMIT: { bar: "bg-[var(--warning)]", value: "text-[var(--warning)]" },
  EXCEEDED: { bar: "bg-[var(--negative)]", value: "text-[var(--negative)]" },
} as const;

const LONG_DATE = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric" });

/** "Hoy, 10 de septiembre de 2026" / "10 de septiembre de 2026". */
function formatLongDateEs(ymd: string, today: string) {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-").map(Number);
  const text = LONG_DATE.format(new Date(y, m - 1, d)).replace(/(\d+) de (\w+) de (\d+)/, "$1 de $2 de $3");
  return ymd === today ? `Hoy, ${text}` : text.replace(/^\w/, (c) => c.toUpperCase());
}

/** The nested budget card inside "KAI sugiere" — mirrors `registroui.png`. */
function BudgetMiniCard({ budget, addAmount }: { budget: QuickBudget; addAmount: number }) {
  const tone = BUDGET_TONE[budget.status];
  const limit = Number(budget.limit);
  const spent = Number(budget.spent);
  const projected = spent + (Number.isFinite(addAmount) ? addAmount : 0);
  const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
  const projectedPct = limit > 0 ? Math.min(100, (projected / limit) * 100) : 0;
  const willExceed = projected > limit;

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-card p-2.5">
      <div className="flex items-center gap-2">
        <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-md bg-brand-subtle text-brand">
          <FinanceIcon name="category" size="sm" className="text-current" />
        </span>
        <span className="text-small font-semibold text-foreground">{budget.categoryName}</span>
        <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Presupuesto mensual</span>
      </div>
      <p className="text-caption text-muted-foreground">
        {addAmount > 0 ? (
          <>
            Con este gasto:{" "}
            <span className={cn("font-semibold", willExceed ? "text-[var(--negative)]" : "text-foreground")}>{money(projected)}</span> de{" "}
            {money(budget.limit)}
          </>
        ) : (
          <>
            Disponible: <span className={cn("font-semibold", tone.value)}>{money(budget.remaining)}</span> de {money(budget.limit)}
          </>
        )}
      </p>
      <div className="relative h-1.5 overflow-hidden rounded-full bg-border">
        <div className={cn("absolute inset-y-0 left-0 rounded-full", tone.bar)} style={{ width: `${pct}%` }} />
        {addAmount > 0 ? (
          <div
            className={cn("absolute inset-y-0 rounded-full opacity-45", willExceed ? "bg-[var(--negative)]" : tone.bar)}
            style={{ left: `${pct}%`, width: `${Math.max(0, projectedPct - pct)}%` }}
          />
        ) : null}
      </div>
    </div>
  );
}

export function QuickAdd({
  open,
  onOpenChange,
  prefill,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefill: RepeatPrefill | null;
}) {
  const router = useRouter();
  const [type, setType] = useState<QuickType>("EXPENSE");
  const [context, setContext] = useState<QuickAddContext | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantAutocompleteSuggestion | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [amountHints, setAmountHints] = useState<string[]>([]);
  // KAI's inline suggestion is dismissable per capture.
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
  const [redetecting, setRedetecting] = useState(false);
  const [categoryTrust, setCategoryTrust] = useState<"ask" | "auto_undo" | "silent" | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  // Idempotency key (spec 14 §38): one per movement intent — refreshed each time the dialog
  // opens and after a successful capture. A "registrar igual" retry of a duplicate warning
  // reuses it, so a timed-out first submit is never written twice.
  const [commandId, setCommandId] = useState(() => crypto.randomUUID());
  const [state, action, pending] = useActionState(quickCreateTransactionAction, initial);

  // The category-trust hint only makes sense while a merchant is resolved.
  useEffect(() => {
    if (!selectedMerchant) setCategoryTrust(null);
  }, [selectedMerchant]);

  // Editing the amount/date after a duplicate warning should re-arm the check.
  useEffect(() => {
    setAllowDuplicate(false);
  }, [form.amount, form.description, form.accountId]);

  const resetAll = (ctx: QuickAddContext | null) => {
    setForm({
      ...emptyForm,
      accountId: ctx?.accounts[0]?.id ?? "",
      occurredAt: ctx ? getTodayInTimezone(ctx.timezone) : "",
    });
    setTemplateId(null);
    setSelectedMerchant(null);
    setAllowDuplicate(false);
    setAmountHints([]);
    setShowDetail(false);
    setSuggestionDismissed(false);
  };

  useEffect(() => {
    if (open) setCommandId(crypto.randomUUID());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setLoadingContext(true);
    getQuickAddContextAction()
      .then((nextContext) => {
        setContext(nextContext);
        setForm((current) => ({
          ...current,
          accountId: current.accountId || nextContext.accounts[0]?.id || "",
        }));
      })
      .catch(() =>
        setContext({ accounts: [], categories: [], budgets: [], templates: [], timezone: "UTC", hasTwoAccounts: false, hasAccount: false }),
      )
      .finally(() => setLoadingContext(false));
  }, [open]);

  // §8.6 — default the date to "today" in the user's timezone once we know it, without
  // clobbering a date the user (or a prefill) already set.
  useEffect(() => {
    if (!open || !context) return;
    setForm((current) => (current.occurredAt ? current : { ...current, occurredAt: getTodayInTimezone(context.timezone) }));
  }, [open, context]);

  // Apply prefill (from "Registrar de nuevo") or reset, each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    if (prefill) {
      setType(prefill.type);
      setForm({
        amount: formatAmountInput(prefill.amount.replace(".", ",")),
        description: prefill.description,
        accountId: prefill.accountId ?? "",
        categoryId: prefill.categoryId ?? "",
        merchant: prefill.merchant ?? "",
        occurredAt: "", // filled with "today" by the effect above
      });
      setTemplateId(null);
      setSelectedMerchant(null);
      setAmountHints([]);
      setSuggestionDismissed(false);
      setShowDetail(Boolean(prefill.categoryId || prefill.merchant));
    } else {
      setForm(emptyForm);
      setTemplateId(null);
      setSelectedMerchant(null);
      setAmountHints([]);
      setSuggestionDismissed(false);
      setShowDetail(false);
      setType("EXPENSE");
    }
  }, [open, prefill]);

  useEffect(() => {
    if (!state?.ok) return;
    const noun = state.type === "INCOME" ? "el ingreso" : "el gasto";
    kaiToast(`Listo, registré ${noun}.`, {
      state: "POSITIVE",
      description: `${state.currencyCode} ${Number(state.amount).toLocaleString("es-AR")}`,
      action: {
        label: "Deshacer",
        onClick: async () => {
          await quickVoidTransactionAction(state.transactionId);
          router.refresh();
          kaiToast("Lo di de baja.", { state: "NEUTRAL", duration: 3500 });
        },
      },
    });
    resetAll(context);
    onOpenChange(false);
    router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Re-run the deterministic merchant→category match for whatever is typed in "¿En qué?".
  // No LLM: this hits the same DB-backed search the autocomplete uses.
  async function redetect() {
    const q = (form.merchant || form.description).trim();
    if (q.length < 2 || redetecting) return;
    setRedetecting(true);
    try {
      const [top] = await searchMerchantSuggestionsAction(q);
      if (top) {
        setSelectedMerchant(top);
        setCategoryTrust(top.categoryId ? "auto_undo" : null);
        setSuggestionDismissed(false);
        setForm((current) => ({ ...current, merchant: top.name, description: current.description || top.name }));
      }
    } finally {
      setRedetecting(false);
    }
  }

  function applyTemplate(t: QuickTemplate) {
    setType(t.type);
    setForm((f) => ({
      ...f,
      amount: "",
      description: t.description,
      accountId: t.accountId ?? f.accountId,
      categoryId: t.categoryId ?? "",
      merchant: t.merchantText ?? "",
    }));
    setTemplateId(t.id);
    setSelectedMerchant(null);
    setAmountHints(t.amountHints);
    setShowDetail(Boolean(t.categoryId || t.merchantText));
    requestAnimationFrame(() => document.getElementById("qa-amount")?.focus());
  }

  const errors = state?.ok === false && "error" in state ? state.error.fieldErrors ?? {} : {};
  const duplicateOf = state?.ok === false && "duplicateOf" in state ? state.duplicateOf : null;
  const selectedAccountCurrency = context?.accounts.find((a) => a.id === form.accountId)?.currencyCode ?? "";
  const categoryOptions = context?.categories.filter((c) => c.type === type) ?? [];
  const templatesForType = context?.templates.filter((t) => t.type === type) ?? [];
  // The category the expense will land on: an explicit pick wins, else the merchant's inferred one.
  const effectiveCategoryId = form.categoryId || selectedMerchant?.categoryId || "";
  // Only offer budgets that match the account's currency (budgets are single-currency).
  const budgets =
    type === "EXPENSE"
      ? (context?.budgets ?? []).filter((b) => !selectedAccountCurrency || b.currencyCode === selectedAccountCurrency)
      : [];
  const activeBudget = budgets.find((b) => b.categoryId === effectiveCategoryId) ?? null;
  const selectedCategoryName = categoryOptions.find((category) => category.id === form.categoryId)?.name;
  const suggestedCategoryName = selectedCategoryName
    ?? categoryOptions.find((category) => category.id === selectedMerchant?.categoryId)?.name;
  // Progressive trust (#13): an unestablished merchant→category pattern is phrased as a question.
  const categoryHint = suggestedCategoryName
    ? categoryTrust === "ask" && !selectedCategoryName
      ? `¿${suggestedCategoryName}?`
      : suggestedCategoryName
    : null;
  // spec 10 §7.8 — where a suggested (not user-picked) category came from.
  const categoryOrigin: InferenceOrigin | null =
    selectedCategoryName || !suggestedCategoryName
      ? null
      : categoryTrust === "ask"
        ? "review"
        : "history";

  // "KAI sugiere" — deterministic: the merchant→category match the user's own history produced.
  const kaiSuggestedCategoryId = selectedMerchant?.categoryId ?? "";
  const kaiSuggestedName = categoryOptions.find((c) => c.id === kaiSuggestedCategoryId)?.name ?? null;
  const kaiApplied = Boolean(form.categoryId) && form.categoryId === kaiSuggestedCategoryId;
  const kaiBudget = kaiSuggestedCategoryId
    ? budgets.find((b) => b.categoryId === kaiSuggestedCategoryId) ?? null
    : null;
  const showKai = type === "EXPENSE" && !suggestionDismissed && Boolean(kaiSuggestedName);
  const selectedAccount = context?.accounts.find((a) => a.id === form.accountId) ?? null;
  const addAmount = Number(normalizeAmount(String(form.amount))) || 0;
  // No podés gastar más de lo que hay en la cuenta.
  const overspending = type === "EXPENSE" && selectedAccount != null && addAmount > Number(selectedAccount.balance);
  const todayYmd = context ? getTodayInTimezone(context.timezone) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-3 overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar un movimiento</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Tipo de movimiento">
          {TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={type === t.key}
              onClick={() => {
                setType(t.key);
                if (t.key !== "EXPENSE") setSelectedMerchant(null);
              }}
              className={cn(
                "flex items-center gap-2.5 rounded-xl border px-3 py-3 text-left transition-colors",
                type === t.key
                  ? "border-brand-border bg-brand-subtle text-brand ring-1 ring-brand-border"
                  : "border-border text-foreground-secondary hover:bg-secondary",
              )}
            >
              <FinanceIcon name={t.icon} size="md" className="shrink-0" />
              <span className="flex flex-col leading-tight">
                <span className="text-small font-semibold">{t.label}</span>
                <span className="text-[11px] text-muted-foreground">{t.hint}</span>
              </span>
            </button>
          ))}
        </div>

        {/* §4.2 — importar vive en el mismo selector, bajo un separador. */}
        <div className="flex items-center gap-3">
          <span aria-hidden className="h-px flex-1 bg-border" />
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              router.push("/settings/imports");
            }}
            className="text-caption font-medium text-brand hover:underline"
          >
            Importar movimientos
          </button>
          <span aria-hidden className="h-px flex-1 bg-border" />
        </div>

        {(
          !context && loadingContext ? (
            <p className="py-6 text-center text-small text-muted-foreground">Cargando…</p>
          ) : !context?.hasAccount ? (
            <div className="flex flex-col items-start gap-2.5 rounded-md bg-warning-soft px-3 py-3 text-small text-[var(--warning)]">
              <span>Primero necesitás una cuenta.</span>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  router.push("/accounts/new");
                }}
              >
                Crear cuenta
              </Button>
            </div>
          ) : (
            <>
              {templatesForType.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {templatesForType.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => applyTemplate(t)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-caption font-medium transition-colors",
                        templateId === t.id
                          ? "border-brand-border bg-brand-subtle text-brand"
                          : "border-border text-foreground-secondary hover:bg-secondary",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              ) : null}

              <form ref={formRef} action={action} className="flex flex-col gap-3.5">
                <input type="hidden" name="type" value={type} />
                <input type="hidden" name="commandId" value={commandId} />
                {templateId ? <input type="hidden" name="templateId" value={templateId} /> : null}
                {allowDuplicate ? <input type="hidden" name="allowDuplicate" value="1" /> : null}

                {state?.ok === false && "error" in state && !state.error.fieldErrors ? (
                  <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-small text-[var(--negative)]">
                    {state.error.message}
                  </p>
                ) : null}

                {duplicateOf ? (
                  <div role="alert" className="rounded-md bg-warning-soft px-3 py-2.5 text-small text-[var(--warning)]">
                    <p className="font-medium">Puede que ya lo tengas registrado</p>
                    <p className="mt-0.5 text-caption">
                      {duplicateOf.description} · {duplicateOf.occurredOn} · {Number(duplicateOf.amount).toLocaleString("es-AR")}
                    </p>
                    <button
                      type="button"
                      className="mt-1.5 text-caption font-medium underline"
                      onClick={() => {
                        setAllowDuplicate(true);
                        requestAnimationFrame(() => formRef.current?.requestSubmit());
                      }}
                    >
                      Registrar igual
                    </button>
                  </div>
                ) : null}

                <Field label="Monto" htmlFor="qa-amount" error={errors.amount?.[0]}>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-muted-foreground">
                      $
                    </span>
                    {/* Visible: formateado con puntos de miles. Se envía normalizado por el hidden. */}
                    <input
                      id="qa-amount"
                      type="text"
                      inputMode="decimal"
                      required
                      autoFocus
                      value={form.amount}
                      onChange={(e) => setForm((f) => ({ ...f, amount: formatAmountInput(e.target.value) }))}
                      placeholder="0"
                      className={cn(fieldControlClass, "h-14 pl-9 text-2xl font-bold tabular-nums", selectedAccountCurrency && "pr-14")}
                    />
                    <input type="hidden" name="amount" value={normalizeAmount(form.amount)} required />
                    {/* §7.3 — la moneda es la de la cuenta seleccionada, no editable acá. */}
                    {selectedAccountCurrency ? (
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-caption font-semibold text-muted-foreground">
                        {selectedAccountCurrency}
                      </span>
                    ) : null}
                  </div>
                  {amountHints.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {amountHints.map((hint) => (
                        <button
                          key={hint}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, amount: formatAmountInput(hint) }))}
                          className="rounded-full border border-border px-2.5 py-0.5 text-caption tabular-nums text-foreground-secondary hover:bg-secondary"
                        >
                          {money(hint)}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </Field>

                <Field label={type === "EXPENSE" ? "¿En qué?" : "¿De qué?"} htmlFor="qa-desc" error={errors.description?.[0]}>
                  {type === "EXPENSE" ? (
                    <div className="relative">
                      <MerchantAutocomplete
                        id="qa-desc"
                        name="description"
                        value={form.description}
                        placeholder="Ej. Carrefour o supermercado"
                        required
                        maxLength={120}
                        inputClassName="pr-10"
                        categories={categoryOptions}
                        onChange={(description) => {
                          setForm((current) => ({
                            ...current,
                            description,
                            merchant: selectedMerchant ? "" : current.merchant,
                          }));
                          setSelectedMerchant(null);
                          setCategoryTrust(null);
                          setSuggestionDismissed(false);
                        }}
                        onSelect={(suggestion) => {
                          setSelectedMerchant(suggestion);
                          setCategoryTrust(suggestion.categoryId ? "auto_undo" : null);
                          setSuggestionDismissed(false);
                          setForm((current) => ({
                            ...current,
                            description: suggestion.name,
                            merchant: suggestion.name,
                          }));
                        }}
                      />
                      <button
                        type="button"
                        onClick={redetect}
                        disabled={redetecting || (form.merchant || form.description).trim().length < 2}
                        aria-label="Volver a detectar la categoría"
                        className="absolute right-2.5 top-2.5 grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
                      >
                        <RotateCwIcon className={cn("size-4", redetecting && "animate-spin")} />
                      </button>
                    </div>
                  ) : (
                    <input
                      id="qa-desc"
                      name="description"
                      type="text"
                      required
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Ej. Sueldo"
                      className={fieldControlClass}
                    />
                  )}
                </Field>

                {type === "EXPENSE" && selectedMerchant ? <input type="hidden" name="merchantId" value={selectedMerchant.id} /> : null}
                {!showDetail && form.categoryId ? <input type="hidden" name="categoryId" value={form.categoryId} /> : null}
                {!showDetail && form.merchant ? <input type="hidden" name="merchant" value={form.merchant} /> : null}

                {/* KAI sugiere — recomendación 100% determinística (match comercio→categoría del
                    historial del usuario, sin llamada a un LLM). Ver registroui.png. */}
                {showKai ? (
                  <div className="flex flex-col gap-2 rounded-xl border border-brand-border/60 bg-brand-subtle/60 p-3">
                    <div className="flex items-start gap-2.5">
                      <KaiAvatar state="POSITIVE" size={32} className="mt-0.5" />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-caption font-bold text-brand">KAI sugiere</span>
                        <p className="text-small text-foreground">
                          Parece un gasto de <span className="font-semibold">{kaiSuggestedName}</span>.
                        </p>
                        {kaiBudget ? (
                          <p className="text-caption text-muted-foreground">También encontré un presupuesto compatible.</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSuggestionDismissed(true)}
                        aria-label="Descartar la sugerencia de KAI"
                        className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-card hover:text-foreground"
                      >
                        <ChevronRightIcon className="size-4 rotate-45" />
                      </button>
                    </div>

                    {kaiBudget ? <BudgetMiniCard budget={kaiBudget} addAmount={addAmount} /> : null}

                    <div className="flex items-center gap-2">
                      {kaiApplied ? (
                        <span className="flex-1 text-caption font-semibold text-[var(--success)]">✓ Aplicado</span>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setForm((f) => ({ ...f, categoryId: kaiSuggestedCategoryId }));
                            setCategoryTrust(null);
                          }}
                        >
                          Aplicar
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setShowDetail(true);
                          requestAnimationFrame(() => document.getElementById("qa-cat")?.focus());
                        }}
                      >
                        Cambiar
                      </Button>
                    </div>
                  </div>
                ) : type === "EXPENSE" && !suggestionDismissed && budgets.length > 0 && !activeBudget ? (
                  /* Sin sugerencia todavía: chips para elegir presupuesto a mano. */
                  <div className="flex flex-col gap-2">
                    <span className="text-caption font-medium text-foreground-secondary">¿Va sobre un presupuesto?</span>
                    <div className="flex flex-wrap gap-1.5">
                      {budgets.map((b) => (
                        <button
                          key={b.categoryId}
                          type="button"
                          onClick={() => {
                            setForm((f) => ({ ...f, categoryId: b.categoryId }));
                            setCategoryTrust(null);
                          }}
                          className="rounded-full border border-border px-2.5 py-1 text-caption font-medium text-foreground-secondary transition-colors hover:border-brand-border hover:bg-brand-subtle hover:text-brand"
                        >
                          {b.categoryName}
                          <span className="ml-1 text-muted-foreground">· resta {moneyCompact(b.remaining)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : activeBudget && !showKai ? (
                  <BudgetMiniCard budget={activeBudget} addAmount={addAmount} />
                ) : null}

                <Field label="Cuenta" htmlFor="qa-account">
                  <div className="relative">
                    <div className="pointer-events-none flex h-14 items-center gap-3 rounded-lg border border-border bg-card px-3">
                      <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-subtle text-brand">
                        <WalletIcon className="size-4" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col leading-tight">
                        <span className="truncate text-small font-semibold text-foreground">
                          {selectedAccount?.name ?? "Elegí una cuenta"}
                        </span>
                        {selectedAccount ? (
                          <span className="text-caption text-muted-foreground">
                            Saldo: {money(selectedAccount.balance)} {selectedAccount.currencyCode}
                          </span>
                        ) : null}
                      </span>
                      <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
                    </div>
                    <select
                      id="qa-account"
                      name="accountId"
                      required
                      value={form.accountId}
                      onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
                      className="absolute inset-0 cursor-pointer opacity-0"
                      aria-label="Cuenta"
                    >
                      {context.accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} · {a.currencyCode}
                        </option>
                      ))}
                    </select>
                  </div>
                </Field>

                {/* §8.2 campo P0 · §8.6 hoy por defecto, pasado permitido, nunca futuro. */}
                <Field label="Fecha" htmlFor="qa-date" error={errors.occurredAt?.[0]}>
                  <div className="relative">
                    <div className="pointer-events-none flex h-14 items-center gap-3 rounded-lg border border-border bg-card px-3">
                      <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 text-small text-foreground">{formatLongDateEs(form.occurredAt, todayYmd)}</span>
                      <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
                    </div>
                    <input
                      id="qa-date"
                      name="occurredAt"
                      type="date"
                      required
                      max={todayYmd}
                      value={form.occurredAt}
                      onChange={(e) => setForm((f) => ({ ...f, occurredAt: e.target.value }))}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </div>
                </Field>

                <button
                  type="button"
                  onClick={() => setShowDetail((v) => !v)}
                  aria-expanded={showDetail}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-secondary"
                >
                  <SlidersHorizontalIcon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span className="text-small font-semibold text-foreground">Más opciones</span>
                    <span className="truncate text-caption text-muted-foreground">Categoría, presupuesto, nota, comprobante</span>
                  </span>
                  <ChevronDownIcon className={cn("size-4 shrink-0 text-muted-foreground transition-transform", showDetail && "rotate-180")} />
                </button>

                {showDetail ? (
                  <div className="flex flex-col gap-3.5 border-t border-border pt-3.5">
                    <Field label="Categoría" htmlFor="qa-cat" help="Si dejás vacío, la inferimos del comercio.">
                      <select
                        id="qa-cat"
                        name="categoryId"
                        value={form.categoryId}
                        onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                        className={fieldControlClass}
                      >
                        <option value="">Automática</option>
                        {categoryOptions.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      {categoryHint && categoryOrigin ? (
                        <p className="mt-1.5 flex items-center gap-2 text-caption text-muted-foreground">
                          <span>Sugerida: {categoryHint}</span>
                          <InferenceBadge origin={categoryOrigin} />
                        </p>
                      ) : null}
                    </Field>
                    {type === "EXPENSE" ? (
                      <Field label="Comercio" htmlFor="qa-merchant" help="Opcional. Escribí dos letras para buscar.">
                        <MerchantAutocomplete
                          id="qa-merchant"
                          name="merchant"
                          value={form.merchant}
                          placeholder="Ej. Carrefour"
                          categories={categoryOptions}
                          onChange={(merchant) => {
                            setSelectedMerchant(null);
                            setCategoryTrust(null);
                            setForm((current) => ({ ...current, merchant }));
                          }}
                          onSelect={(suggestion) => {
                            setSelectedMerchant(suggestion);
                            setCategoryTrust(suggestion.categoryId ? "auto_undo" : null);
                            setForm((current) => ({
                              ...current,
                              merchant: suggestion.name,
                              description: current.description || suggestion.name,
                            }));
                          }}
                        />
                      </Field>
                    ) : null}
                  </div>
                ) : null}

                {overspending ? (
                  <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-caption text-[var(--negative)]">
                    El gasto ({money(addAmount)}) es mayor al saldo de {selectedAccount!.name} ({money(selectedAccount!.balance)}{" "}
                    {selectedAccount!.currencyCode}).
                  </p>
                ) : null}

                <div className="mt-1 flex items-center gap-3">
                  <Button type="button" variant="outline" className="h-11" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={pending || overspending} className="h-11 flex-1">
                    {pending ? "Guardando…" : type === "EXPENSE" ? "Registrar gasto" : "Registrar ingreso"}
                  </Button>
                </div>
              </form>
            </>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
