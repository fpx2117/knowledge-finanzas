"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { FinanceIcon, type FinanceIconName } from "@/design-system/icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, fieldControlClass } from "@/components/shared/form-field";
import { InferenceBadge, type InferenceOrigin } from "@/components/shared/inference-badge";
import { getTodayInTimezone } from "@/lib/date";
import { cn } from "@/lib/utils";
import { MerchantAutocomplete } from "./merchant-autocomplete";
import type { MerchantAutocompleteSuggestion } from "../lib/merchant-autocomplete";
import {
  getQuickAddContextAction,
  quickCreateTransactionAction,
  quickVoidTransactionAction,
  type QuickAddContext,
  type QuickResult,
  type QuickTemplate,
  type RepeatPrefill,
} from "../actions/quick-actions";

type QuickType = "EXPENSE" | "INCOME" | "TRANSFER" | "OBLIGATION";

const TYPES: Array<{ key: QuickType; label: string; icon: FinanceIconName }> = [
  { key: "EXPENSE", label: "Gasto", icon: "expense" },
  { key: "INCOME", label: "Ingreso", icon: "income" },
  { key: "TRANSFER", label: "Transferencia", icon: "transfer" },
  { key: "OBLIGATION", label: "Obligación", icon: "obligations" },
];

const initial: QuickResult | null = null;
const emptyForm = { amount: "", description: "", accountId: "", categoryId: "", merchant: "", occurredAt: "" };

function money(value: string) {
  return `$${Number(value).toLocaleString("es-AR")}`;
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
      .catch(() => setContext({ accounts: [], categories: [], templates: [], timezone: "UTC", hasTwoAccounts: false, hasAccount: false }))
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
        amount: prefill.amount,
        description: prefill.description,
        accountId: prefill.accountId ?? "",
        categoryId: prefill.categoryId ?? "",
        merchant: prefill.merchant ?? "",
        occurredAt: "", // filled with "today" by the effect above
      });
      setTemplateId(null);
      setSelectedMerchant(null);
      setAmountHints([]);
      setShowDetail(Boolean(prefill.categoryId || prefill.merchant));
    } else {
      setForm(emptyForm);
      setTemplateId(null);
      setSelectedMerchant(null);
      setAmountHints([]);
      setShowDetail(false);
      setType("EXPENSE");
    }
  }, [open, prefill]);

  useEffect(() => {
    if (!state?.ok) return;
    const verb = state.type === "INCOME" ? "Ingreso" : "Gasto";
    toast.success(`${verb} registrado`, {
      description: `${state.currencyCode} ${Number(state.amount).toLocaleString("es-AR")}`,
      action: {
        label: "Deshacer",
        onClick: async () => {
          await quickVoidTransactionAction(state.transactionId);
          router.refresh();
          toast("Movimiento deshecho");
        },
      },
    });
    resetAll(context);
    onOpenChange(false);
    router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

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
  const isTxn = type === "EXPENSE" || type === "INCOME";
  const selectedAccountCurrency = context?.accounts.find((a) => a.id === form.accountId)?.currencyCode ?? "";
  const categoryOptions = context?.categories.filter((c) => c.type === type) ?? [];
  const templatesForType = context?.templates.filter((t) => t.type === type) ?? [];
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿Qué querés registrar?</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-1.5" role="tablist" aria-label="Tipo de movimiento">
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
                "flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-caption font-medium transition-colors",
                type === t.key
                  ? "border-brand-border bg-brand-subtle text-brand"
                  : "border-border text-foreground-secondary hover:bg-secondary",
              )}
            >
              <FinanceIcon name={t.icon} size="md" />
              {t.label}
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

        {isTxn ? (
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
                    <input
                      id="qa-amount"
                      name="amount"
                      type="text"
                      inputMode="decimal"
                      required
                      autoFocus
                      value={form.amount}
                      onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                      placeholder="0.00"
                      className={cn(fieldControlClass, "h-12 text-lg font-medium", selectedAccountCurrency && "pr-16")}
                    />
                    {/* §7.3 — la moneda es la de la cuenta seleccionada, no editable acá. */}
                    {selectedAccountCurrency ? (
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-caption font-medium text-muted-foreground">
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
                          onClick={() => setForm((f) => ({ ...f, amount: hint }))}
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
                    <MerchantAutocomplete
                      id="qa-desc"
                      name="description"
                      value={form.description}
                      placeholder="Ej. Carrefour o supermercado"
                      required
                      maxLength={120}
                      categories={categoryOptions}
                      onChange={(description) => {
                        setForm((current) => ({
                          ...current,
                          description,
                          merchant: selectedMerchant ? "" : current.merchant,
                        }));
                        setSelectedMerchant(null);
                        setCategoryTrust(null);
                      }}
                      onSelect={(suggestion) => {
                        setSelectedMerchant(suggestion);
                        setCategoryTrust(suggestion.categoryId ? "auto_undo" : null);
                        setForm((current) => ({
                          ...current,
                          description: suggestion.name,
                          merchant: suggestion.name,
                        }));
                      }}
                    />
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
                  {!showDetail && (form.merchant || categoryHint) ? (
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption text-muted-foreground">
                      {form.merchant ? <span>Comercio: {form.merchant}</span> : null}
                      {categoryHint ? <span>Categoría: {categoryHint}</span> : null}
                      {categoryOrigin ? <InferenceBadge origin={categoryOrigin} /> : null}
                    </p>
                  ) : null}
                </Field>

                {type === "EXPENSE" && selectedMerchant ? <input type="hidden" name="merchantId" value={selectedMerchant.id} /> : null}
                {!showDetail && form.categoryId ? <input type="hidden" name="categoryId" value={form.categoryId} /> : null}
                {!showDetail && form.merchant ? <input type="hidden" name="merchant" value={form.merchant} /> : null}

                <Field label="Cuenta" htmlFor="qa-account">
                  <select
                    id="qa-account"
                    name="accountId"
                    required
                    value={form.accountId}
                    onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
                    className={fieldControlClass}
                  >
                    {context.accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} · {a.currencyCode}
                      </option>
                    ))}
                  </select>
                </Field>

                {/* §8.2 campo P0 · §8.6 hoy por defecto, pasado permitido, nunca futuro. */}
                <Field label="Fecha" htmlFor="qa-date" error={errors.occurredAt?.[0]}>
                  <input
                    id="qa-date"
                    name="occurredAt"
                    type="date"
                    required
                    max={getTodayInTimezone(context.timezone)}
                    value={form.occurredAt}
                    onChange={(e) => setForm((f) => ({ ...f, occurredAt: e.target.value }))}
                    className={fieldControlClass}
                  />
                </Field>

                <button
                  type="button"
                  onClick={() => setShowDetail((v) => !v)}
                  className="self-start text-caption font-medium text-brand hover:underline"
                >
                  {showDetail ? "Menos detalle" : "Más detalle"}
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

                <Button type="submit" disabled={pending} className="mt-1 h-11">
                  {pending ? "Guardando…" : type === "EXPENSE" ? "Registrar gasto" : "Registrar ingreso"}
                </Button>
              </form>
            </>
          )
        ) : (
          <div className="flex flex-col gap-3 py-2">
            <p className="text-small text-muted-foreground">
              {type === "TRANSFER"
                ? "Mover dinero entre tus cuentas. No cuenta como ingreso ni como gasto."
                : "Cargar una deuda o compra en cuotas, con su calendario de pagos."}
            </p>
            <Button
              type="button"
              className="h-11"
              onClick={() => {
                onOpenChange(false);
                router.push(type === "TRANSFER" ? "/transactions/transfers/new" : "/obligations/new");
              }}
            >
              {type === "TRANSFER" ? "Nueva transferencia" : "Nueva obligación"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
