"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SparklesIcon, ArrowRightIcon } from "lucide-react";

import { FinanceIcon, type FinanceIconName } from "@/design-system/icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, fieldControlClass } from "@/components/shared/form-field";
import { cn } from "@/lib/utils";
import { MerchantAutocomplete } from "./merchant-autocomplete";
import type { MerchantAutocompleteSuggestion } from "../lib/merchant-autocomplete";
import {
  getQuickAddContextAction,
  parseQuickTextAction,
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
const emptyForm = { amount: "", description: "", accountId: "", categoryId: "", merchant: "" };

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
  const [nlText, setNlText] = useState("");
  const [interpretation, setInterpretation] = useState<{
    text: string;
    ambiguities: string[];
    source: "DETERMINISTIC" | "AI";
  } | null>(null);
  const [parsing, startParse] = useTransition();
  const parsingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [allowDuplicate, setAllowDuplicate] = useState(false);
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
    setForm({ ...emptyForm, accountId: ctx?.accounts[0]?.id ?? "" });
    setTemplateId(null);
    setSelectedMerchant(null);
    setAllowDuplicate(false);
    setAmountHints([]);
    setNlText("");
    setInterpretation(null);
    setShowDetail(false);
  };

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
      });
      setTemplateId(null);
      setSelectedMerchant(null);
      setAmountHints([]);
      setShowDetail(Boolean(prefill.categoryId || prefill.merchant));
      setNlText("");
      setInterpretation(null);
    } else {
      setForm(emptyForm);
      setTemplateId(null);
      setSelectedMerchant(null);
      setAmountHints([]);
      setNlText("");
      setInterpretation(null);
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

  function runParse() {
    const text = nlText.trim();
    if (!text || parsingRef.current) return;
    parsingRef.current = true;
    const operationId = crypto.randomUUID();
    startParse(async () => {
      try {
        const parsed = await parseQuickTextAction(text, operationId);
        if (parsed.type === "TRANSFER") {
          setSelectedMerchant(null);
          setInterpretation({ text: parsed.interpretation, ambiguities: parsed.ambiguities, source: parsed.source });
          setType("TRANSFER");
          return;
        }
        setType(parsed.type);
        setTemplateId(null);
        setSelectedMerchant(parsed.merchantId && parsed.merchant ? {
          id: parsed.merchantId,
          name: parsed.merchant,
          categoryId: parsed.categoryId,
        } : null);
        setCategoryTrust(parsed.merchantId ? parsed.categoryAutomationLevel : null);
        setForm((f) => ({
          ...f,
          amount: parsed.amount ?? f.amount,
          description: parsed.description,
          merchant: parsed.type === "EXPENSE" ? parsed.merchant ?? "" : "",
          categoryId: parsed.merchantId ? "" : parsed.categoryId ?? "",
        }));
        if (parsed.merchant || parsed.categoryId) setShowDetail(true);
        setInterpretation({ text: parsed.interpretation, ambiguities: parsed.ambiguities, source: parsed.source });
      } finally {
        parsingRef.current = false;
      }
    });
  }

  const errors = state?.ok === false && "error" in state ? state.error.fieldErrors ?? {} : {};
  const duplicateOf = state?.ok === false && "duplicateOf" in state ? state.duplicateOf : null;
  const isTxn = type === "EXPENSE" || type === "INCOME";
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

              <div className="flex flex-col gap-1.5">
                <label htmlFor="qa-nl" className="text-caption font-medium text-muted-foreground">
                  Escribilo en una frase
                </label>
                <p className="text-caption text-muted-foreground">
                  Primero se procesa sin IA. Si hay dudas, la IA puede usar 1 crédito.
                </p>
                <div className="flex gap-2">
                  <input
                    id="qa-nl"
                    value={nlText}
                    maxLength={240}
                    onChange={(e) => setNlText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        runParse();
                      }
                    }}
                    placeholder={type === "INCOME" ? "cobré 250 mil de honorarios" : "gasté 14k en nafta con Galicia"}
                    className={fieldControlClass}
                  />
                  <Button type="button" variant="outline" size="icon" aria-label="Interpretar" disabled={parsing} onClick={runParse}>
                    {parsing ? <SparklesIcon className="size-4 animate-pulse" /> : <ArrowRightIcon className="size-4" />}
                  </Button>
                </div>
                {interpretation ? (
                  <div className="rounded-md bg-brand-subtle px-2.5 py-1.5 text-caption text-foreground-secondary">
                    <span className="flex items-center gap-1.5">
                      <SparklesIcon className="size-3.5 text-brand" />
                      {interpretation.source === "AI" ? "IA · " : null}
                      {interpretation.text}
                    </span>
                    {interpretation.ambiguities.map((a) => (
                      <span key={a} className="mt-0.5 block text-[var(--warning)]">
                        {a}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <form ref={formRef} action={action} className="flex flex-col gap-3.5">
                <input type="hidden" name="type" value={type} />
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
                    className={cn(fieldControlClass, "h-12 text-lg font-medium")}
                  />
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
                  {!showDetail && form.merchant ? (
                    <p className="mt-1 text-caption text-muted-foreground">
                      Comercio: {form.merchant}
                      {categoryHint ? ` · ${categoryHint}` : ""}
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
                router.push(type === "TRANSFER" ? "/transfers/new" : "/debts/new");
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
