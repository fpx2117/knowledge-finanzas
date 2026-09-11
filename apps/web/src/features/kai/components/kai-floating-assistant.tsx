"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3Icon,
  BookOpenIcon,
  CalendarClockIcon,
  LightbulbIcon,
  MinusIcon,
  PaperclipIcon,
  SendHorizontalIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  KAI_QUICK_ACTIONS,
  resolveScreenContext,
  type KaiAction,
  type KaiFollowup,
  type KaiIntentId,
  type KaiResponse,
  type KaiVisualState,
} from "@know-finanzas/kai";

import { cn } from "@/lib/utils";
import { openQuickAdd } from "@/features/capture/components/quick-add-root";
import { quickVoidTransactionAction } from "@/features/capture/actions/quick-actions";
import type { KaiAccess } from "../lib/kai-points.instance";
import type { KaiProactiveMessage } from "@know-finanzas/kai";
import { getKaiAccessAction, sendKaiMessageAction } from "../actions/kai-actions";
import {
  dismissKaiProactiveAction,
  actKaiProactiveAction,
  getKaiProactiveMessageAction,
  muteKaiProactiveKindAction,
  snoozeKaiProactiveAction,
} from "../actions/kai-proactive-actions";
import {
  kaiAllocateToGoalAction,
  kaiCreateBudgetAction,
  kaiCreateGoalAction,
  kaiCreateTransactionAction,
  kaiCreateTransferAction,
  kaiEditTransactionCategoryAction,
  kaiPayObligationAction,
  kaiVoidTransactionAction,
} from "../actions/kai-create-actions";
import { MAX_KAI_MESSAGE_LENGTH } from "../lib/constants";
import { useDraggableFab } from "../lib/use-draggable-fab";
import { KaiAlertCard } from "./kai-alert-card";
import { KaiAvatar } from "./kai-avatar";
import { KaiResponseCard } from "./kai-response-card";

// El FAB de KAI se puede arrastrar (sobre todo en mobile, donde chocaba con la barra inferior).
// Default: por encima de la barra + safe-area.
const FAB_DEFAULT_POS = "bottom-[calc(5.5rem_+_env(safe-area-inset-bottom))] right-4 sm:bottom-6 sm:right-6";

// El FAB es la mascota en PNG (sin aro, sin fondo, sin el texto "KAI") — 100% fiel al mockup.
// Cada estado tiene su propio PNG con su color; el color no viene de un aro superpuesto.
const KAI_MASCOT_SRC: Record<KaiVisualState, string> = {
  NEUTRAL: "/brand/kai/kai-neutral.png",
  ANALYTICAL: "/brand/kai/kai-analytical.png",
  ALERT: "/brand/kai/kai-alert.png",
  POSITIVE: "/brand/kai/kai-positive.png",
};
const FAB_SIZE = 64;

type Entry =
  | { role: "user"; text: string }
  | { role: "assistant"; response: KaiResponse; intentId?: string; feedback?: "up" | "down" };

const STATE_META: Record<KaiVisualState, { label: string; dot: string }> = {
  NEUTRAL: { label: "En línea", dot: "bg-[var(--color-kai-positive)]" },
  ANALYTICAL: { label: "Analizando", dot: "bg-[var(--color-kai-analytical)]" },
  ALERT: { label: "Atención", dot: "bg-[var(--color-kai-alert)]" },
  POSITIVE: { label: "En línea", dot: "bg-[var(--color-kai-positive)]" },
};

const ACCENT_SEND: Record<KaiVisualState, string> = {
  NEUTRAL: "bg-[var(--color-kai-neutral)]",
  ANALYTICAL: "bg-[var(--color-kai-analytical)]",
  ALERT: "bg-[var(--color-kai-alert)]",
  POSITIVE: "bg-[var(--color-kai-neutral)]",
};

const QUICK_ACTION_ICON: Partial<Record<KaiIntentId, LucideIcon>> = {
  GET_TOP_EXPENSE_CATEGORIES: BarChart3Icon,
  GET_MONTH_EXPENSES: BarChart3Icon,
  GET_MONTH_SAVINGS: CalendarClockIcon,
  GET_AVAILABLE_MONEY: CalendarClockIcon,
  GET_BUDGET_STATUS: BarChart3Icon,
  GET_GOAL_PROGRESS: CalendarClockIcon,
  GET_UPCOMING_PAYMENTS: CalendarClockIcon,
  GET_SUBSCRIPTIONS: CalendarClockIcon,
  GET_INSIGHTS: LightbulbIcon,
  GET_CURRENT_BALANCE: BarChart3Icon,
  GET_NET_CASHFLOW: BarChart3Icon,
};

export function KaiFloatingAssistant({ initialAccess }: { initialAccess: KaiAccess }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [access, setAccess] = useState<KaiAccess>(initialAccess);
  const [banner, setBanner] = useState<string | null>(null);
  const [followups, setFollowups] = useState<KaiFollowup[]>([]);
  const [proactive, setProactive] = useState<KaiProactiveMessage | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const fab = useDraggableFab(FAB_SIZE);
  const screenContext = resolveScreenContext(pathname);
  const quickActions = KAI_QUICK_ACTIONS[screenContext];
  const lastAssistant = [...entries].reverse().find((e): e is Extract<Entry, { role: "assistant" }> => e.role === "assistant");
  const visualState: KaiVisualState = pending ? "ANALYTICAL" : lastAssistant?.response.state ?? "NEUTRAL";
  const stateMeta = STATE_META[visualState];

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    inputRef.current?.focus();
  }, [open, entries, pending]);

  useEffect(() => {
    if (!open) return;
    getKaiAccessAction().then(setAccess).catch(() => {});
  }, [open]);

  // Proactive message (spec §7). The server applies the priority queue + frequency cap
  // (spec §8/§9) and returns at most one; dismissal/snooze/mute state lives in `kai_notifications`.
  // Two delivery paths, both server-driven:
  //  - same-tab, instant: `kai:refresh-proactive` (WP-KAI-EVENT-TRIGGERS) forces a re-check right
  //    after a mutation that could trip a new alert.
  //  - any tab/device, near-real-time: an SSE subscription to `/api/kai/proactive/stream`
  //    (WP-KAI-PROACTIVE-DELIVERY) — server-side poll of the same throttled action, so a card
  //    triggered from another tab or device still reaches this one within ~15s, even backgrounded.
  useEffect(() => {
    let alive = true;
    const check = (force = false) => {
      getKaiProactiveMessageAction(force)
        .then((msg) => {
          if (alive && msg) setProactive(msg);
        })
        .catch(() => {});
    };
    check();
    const onRefresh = () => check(true);
    window.addEventListener("kai:refresh-proactive", onRefresh);

    const source = new EventSource("/api/kai/proactive/stream");
    source.addEventListener("kai-proactive", (event) => {
      try {
        const msg = JSON.parse((event as MessageEvent).data) as KaiProactiveMessage;
        if (alive) setProactive(msg);
      } catch {
        // malformed payload — ignore this tick
      }
    });

    return () => {
      alive = false;
      window.removeEventListener("kai:refresh-proactive", onRefresh);
      source.close();
    };
  }, []);

  const resolveProactive = useCallback(
    (action: (dedupKey: string) => Promise<void>) => {
      setProactive((current) => {
        if (current) void action(current.id).catch(() => {});
        return null;
      });
    },
    [],
  );

  // Global trigger — window event + the "J" shortcut (N = Quick Add, ⌘K = palette).
  useEffect(() => {
    const openHandler = () => setOpen(true);
    const keyHandler = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) {
        return;
      }
      if (event.key.toLowerCase() === "j") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("kai:open", openHandler);
    window.addEventListener("keydown", keyHandler);
    return () => {
      window.removeEventListener("kai:open", openHandler);
      window.removeEventListener("keydown", keyHandler);
    };
  }, []);

  const submit = useCallback(
    async (payload: { message?: string; quickActionIntentId?: string; label: string }) => {
      if (pending || access.exhausted) return;
      setEntries((current) => [...current, { role: "user", text: payload.label }]);
      setDraft("");
      setBanner(null);
      setFollowups([]);
      setPending(true);

      const history: Array<{ role: "user" | "assistant"; content: string }> = entries
        .map((entry) =>
          entry.role === "user"
            ? { role: "user" as const, content: entry.text }
            : { role: "assistant" as const, content: entry.response.body },
        )
        .slice(-10);

      // Even a deterministic answer resolves in a few ms — hold the "pensando" state a beat
      // so KAI reads as if it's working, not glitching.
      const startedAt = Date.now();
      const MIN_THINK_MS = 650;
      const lastIntentId = [...entries]
        .reverse()
        .find((e): e is Extract<Entry, { role: "assistant" }> => e.role === "assistant")?.intentId;
      const result = await sendKaiMessageAction({
        message: payload.message ?? "",
        history,
        pathname,
        quickActionIntentId: payload.quickActionIntentId,
        lastIntentId,
      });
      const wait = MIN_THINK_MS - (Date.now() - startedAt);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));

      setPending(false);
      if (result.access) setAccess(result.access);
      if (result.ok) {
        setEntries((current) => [...current, { role: "assistant", response: result.response, intentId: result.intentId }]);
        setFollowups(result.followups ?? []);
      } else {
        setBanner(result.error.message);
      }
    },
    [entries, pending, pathname, access.exhausted],
  );

  const createFromCard = useCallback(
    async (params: Record<string, string>) => {
      if (pending) return;
      setPending(true);
      setBanner(null);
      const result = await kaiCreateTransactionAction({
        type: params.type === "INCOME" ? "INCOME" : "EXPENSE",
        amount: params.amount ?? "",
        description: params.description ?? (params.type === "INCOME" ? "Ingreso" : "Gasto"),
        merchant: params.merchant,
        currencyHint: params.currencyHint === "USD" ? "USD" : undefined,
      });
      setPending(false);

      if (result.ok) {
        setEntries((current) => [
          ...current,
          {
            role: "assistant",
            response: {
              type: "KAI_CONFIRMATION",
              state: "POSITIVE",
              body: `Listo, registré el ${result.type === "INCOME" ? "ingreso" : "gasto"}.`,
              actions: [{ kind: "navigate", label: "Ver movimiento", route: "/transactions" }],
            },
          },
        ]);
        toast.success("Movimiento registrado", {
          description: "KAI lo creó por vos.",
          action: {
            label: "Deshacer",
            onClick: async () => {
              await quickVoidTransactionAction(result.transactionId);
              router.refresh();
            },
          },
        });
        router.refresh();
        // A new movement can trip a proactive rule (budget, category spike) — re-check now.
        window.dispatchEvent(new CustomEvent("kai:refresh-proactive"));
      } else {
        setBanner(result.error.message);
      }
    },
    [pending, router],
  );

  const doneMessage = useCallback((body: string, route: string, label: string) => {
    setEntries((current) => [
      ...current,
      { role: "assistant", response: { type: "KAI_CONFIRMATION", state: "POSITIVE", body, actions: [{ kind: "navigate", label, route }] } },
    ]);
    router.refresh();
    window.dispatchEvent(new CustomEvent("kai:refresh-proactive"));
  }, [router]);

  const allocateFromCard = useCallback(
    async (params: Record<string, string>) => {
      if (pending) return;
      setPending(true);
      setBanner(null);
      const result = await kaiAllocateToGoalAction({ goalId: params.goalId, amount: params.amount ?? "" });
      setPending(false);
      if (result.ok) {
        doneMessage(`Listo, aporté a tu meta ${params.goalName ?? ""}.`, "/goals", "Ver la meta");
        toast.success("Aporte registrado", { description: `KAI sumó a ${params.goalName ?? "tu meta"}.` });
      } else setBanner(result.error.message);
    },
    [pending, doneMessage],
  );

  const voidFromCard = useCallback(
    async (params: Record<string, string>) => {
      if (pending) return;
      setPending(true);
      setBanner(null);
      const result = await kaiVoidTransactionAction(params.transactionId);
      setPending(false);
      if (result.ok) {
        doneMessage("Listo, anulé el movimiento.", "/transactions", "Ver movimientos");
        toast.success("Movimiento anulado");
      } else setBanner(result.error ?? "No pude anular el movimiento.");
    },
    [pending, doneMessage],
  );

  const payFromCard = useCallback(
    async (params: Record<string, string>) => {
      if (pending) return;
      setPending(true);
      setBanner(null);
      const result = await kaiPayObligationAction({ debtId: params.debtId, amount: params.amount ?? "", currencyCode: params.currencyCode ?? "" });
      setPending(false);
      if (result.ok) {
        doneMessage(`Listo, pagué la cuota de ${params.debtName ?? ""}.`, "/obligations", "Ver obligaciones");
        toast.success("Pago registrado", { description: `KAI pagó ${params.debtName ?? "la cuota"}.` });
        window.dispatchEvent(new CustomEvent("kai:refresh-proactive"));
      } else setBanner(result.error.message);
    },
    [pending, doneMessage],
  );

  const transferFromCard = useCallback(
    async (params: Record<string, string>) => {
      if (pending) return;
      setPending(true);
      setBanner(null);
      const result = await kaiCreateTransferAction({ fromAccountId: params.fromAccountId, toAccountId: params.toAccountId, amount: params.amount ?? "" });
      setPending(false);
      if (result.ok) {
        doneMessage("Listo, hice la transferencia.", "/accounts", "Ver cuentas");
        toast.success("Transferencia registrada");
        window.dispatchEvent(new CustomEvent("kai:refresh-proactive"));
      } else setBanner(result.error.message);
    },
    [pending, doneMessage],
  );

  const editCategoryFromCard = useCallback(
    async (params: Record<string, string>) => {
      if (pending) return;
      setPending(true);
      setBanner(null);
      const result = await kaiEditTransactionCategoryAction({
        transactionId: params.transactionId,
        categoryId: params.categoryId,
        description: params.description ?? "",
      });
      setPending(false);
      if (result.ok) {
        doneMessage(`Listo, cambié la categoría a ${params.categoryName ?? ""}.`, "/transactions", "Ver movimientos");
        toast.success("Categoría actualizada");
      } else setBanner(result.error.message);
    },
    [pending, doneMessage],
  );

  const createGoalFromCard = useCallback(
    async (params: Record<string, string>) => {
      if (pending) return;
      setPending(true);
      setBanner(null);
      const result = await kaiCreateGoalAction({
        name: params.name ?? "",
        targetAmount: params.targetAmount ?? "",
        category: params.category ?? "OTHER",
        currencyCode: params.currencyCode ?? "",
      });
      setPending(false);
      if (result.ok) {
        doneMessage(`Listo, creé la meta ${params.name ?? ""}.`, "/goals", "Ver metas");
        toast.success("Meta creada");
      } else setBanner(result.error.message);
    },
    [pending, doneMessage],
  );

  const createBudgetFromCard = useCallback(
    async (params: Record<string, string>) => {
      if (pending) return;
      setPending(true);
      setBanner(null);
      const result = await kaiCreateBudgetAction({
        categoryId: params.categoryId,
        limitAmount: params.limitAmount ?? "",
        currencyCode: params.currencyCode ?? "",
      });
      setPending(false);
      if (result.ok) {
        doneMessage(`Listo, creé el presupuesto de ${params.categoryName ?? ""}.`, "/budgets", "Ver presupuestos");
        toast.success("Presupuesto creado");
      } else setBanner(result.error.message);
    },
    [pending, doneMessage],
  );

  const onAction = useCallback(
    (action: KaiAction) => {
      if (action.kind === "navigate" && action.route) {
        setOpen(false);
        router.push(action.route);
      } else if (action.kind === "open-quick-add") {
        setOpen(false);
        const p = action.params ?? {};
        openQuickAdd({
          type: p.type === "INCOME" ? "INCOME" : "EXPENSE",
          amount: p.amount ?? "",
          description: p.description ?? "",
          merchant: p.merchant ?? null,
          categoryId: null,
          accountId: null,
        });
      } else if (action.kind === "confirm-create" && action.params) {
        void createFromCard(action.params);
      } else if (action.kind === "confirm-goal-allocation" && action.params) {
        void allocateFromCard(action.params);
      } else if (action.kind === "confirm-void" && action.params) {
        void voidFromCard(action.params);
      } else if (action.kind === "confirm-pay-obligation" && action.params) {
        void payFromCard(action.params);
      } else if (action.kind === "confirm-transfer" && action.params) {
        void transferFromCard(action.params);
      } else if (action.kind === "confirm-edit-category" && action.params) {
        void editCategoryFromCard(action.params);
      } else if (action.kind === "confirm-create-goal" && action.params) {
        void createGoalFromCard(action.params);
      } else if (action.kind === "confirm-create-budget" && action.params) {
        void createBudgetFromCard(action.params);
      } else if (action.kind === "run-intent" && action.intentId) {
        void submit({ quickActionIntentId: action.intentId, label: action.label });
      }
    },
    [
      router,
      submit,
      createFromCard,
      allocateFromCard,
      voidFromCard,
      payFromCard,
      transferFromCard,
      editCategoryFromCard,
      createGoalFromCard,
      createBudgetFromCard,
    ],
  );

  const rateEntry = useCallback((index: number, feedback: "up" | "down") => {
    setEntries((current) =>
      current.map((entry, i) => (i === index && entry.role === "assistant" ? { ...entry, feedback } : entry)),
    );
  }, []);

  const canSend = !pending && !access.exhausted && draft.trim().length > 0;

  return (
    <>
      {!open && proactive ? (
        <div className="fixed bottom-[calc(6.5rem_+_env(safe-area-inset-bottom))] right-4 z-[var(--z-popover)] sm:bottom-24 sm:right-6">
          <KaiAlertCard
            message={proactive}
            onOpen={() => {
              setProactive(null);
              setOpen(true);
            }}
            onDismiss={() => resolveProactive(dismissKaiProactiveAction)}
            onSnooze={() => resolveProactive(snoozeKaiProactiveAction)}
            onMute={() => {
              const kind = proactive.kind;
              setProactive(null);
              void muteKaiProactiveKindAction(kind).catch(() => {});
            }}
            onNavigate={(route) => {
              resolveProactive(actKaiProactiveAction);
              router.push(route);
            }}
          />
        </div>
      ) : !open ? (
        <button
          type="button"
          {...fab.dragHandlers}
          onClick={() => {
            if (!fab.wasDragged()) setOpen(true);
          }}
          onPointerEnter={fab.wake}
          onFocus={fab.wake}
          style={fab.style}
          data-idle={fab.idle || undefined}
          aria-label="Abrir KAI, tu asistente — mantené presionado para moverlo"
          className={cn(
            "group fixed z-[var(--z-popover)] size-14 touch-none cursor-grab select-none rounded-full transition-[transform,opacity] duration-300 ease-out active:cursor-grabbing focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60 sm:size-16",
            !fab.isPositioned && FAB_DEFAULT_POS,
            // Idle: fade back and tuck ~40% past the nearest edge so it stops competing with
            // content. Hover / focus / tap wakes it (see `fab.wake`).
            fab.idle
              ? cn("opacity-45", fab.edge === "right" ? "translate-x-[40%]" : "-translate-x-[40%]")
              : "hover:scale-[1.06] active:scale-95",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny static brand asset, no next/image optimizer */}
          <img
            src={KAI_MASCOT_SRC[visualState]}
            alt=""
            draggable={false}
            className={cn(
              "pointer-events-none size-full object-contain transition-[filter] duration-300 [filter:drop-shadow(0_8px_16px_rgb(16_24_47_/_0.30))] group-data-[idle]:[filter:drop-shadow(0_4px_8px_rgb(16_24_47_/_0.18))]",
              pending && "animate-pulse",
            )}
          />
        </button>
      ) : null}

      <div
        role="dialog"
        aria-label="KAI, asistente financiero"
        inert={!open}
        className={cn(
          "fixed z-[var(--z-modal)] flex flex-col overflow-hidden bg-card shadow-[var(--shadow-floating)] transition-all duration-[var(--motion-duration-base)]",
          "inset-x-0 bottom-0 h-[86dvh] rounded-t-[var(--radius-xl)]",
          "sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[620px] sm:max-h-[calc(100dvh-6rem)] sm:w-[400px] sm:rounded-[var(--radius-xl)] sm:border sm:border-border",
          open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
        )}
      >
        {/* Header */}
        <header className="flex items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <KaiAvatar state={visualState} size={34} processing={pending} />
            <div className="flex flex-col leading-tight">
              <span className="text-small font-bold text-foreground">KAI</span>
              <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
                <span className={cn("size-1.5 rounded-full", stateMeta.dot)} aria-hidden />
                {pending ? "Analizando" : stateMeta.label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span
              className={cn(
                "mr-1 rounded-full px-2 py-0.5 text-caption tabular-nums",
                access.exhausted ? "bg-warning-soft text-[var(--warning)]" : "bg-secondary text-muted-foreground",
              )}
              title={access.unlimited ? "Consultas ilimitadas con PRO" : "Consultas de KAI este mes"}
            >
              {access.unlimited ? "∞" : `${access.remaining ?? 0}/${access.allowance ?? 0}`}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Minimizar"
              className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <MinusIcon className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        </header>

        {/* Conversation */}
        <div ref={listRef} className="flex flex-1 flex-col gap-3 overflow-y-auto bg-background/40 px-4 py-4">
          {entries.length === 0 ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <KaiAvatar state="POSITIVE" size={26} className="mt-0.5" />
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-secondary px-3 py-2 text-small text-foreground-secondary">
                  ¡Hola! Soy KAI. Respondo con tus datos al instante — cada consulta usa 1 punto, un análisis con IA usa 5.
                  {access.unlimited ? " Con tu plan son ilimitados." : ` Te quedan ${access.remaining ?? 0} este mes.`}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pl-8">
                {quickActions.map((qa) => {
                  const Icon = QUICK_ACTION_ICON[qa.intentId] ?? BookOpenIcon;
                  return (
                    <button
                      key={qa.intentId + qa.label}
                      type="button"
                      disabled={pending || access.exhausted}
                      onClick={() => submit({ quickActionIntentId: qa.intentId, label: qa.label })}
                      className="flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-2 text-left text-caption font-medium text-foreground-secondary transition-colors hover:border-brand-border hover:bg-brand-subtle/40 disabled:opacity-50"
                    >
                      <Icon className="size-3.5 shrink-0 text-[var(--color-kai-neutral)]" />
                      <span className="truncate">{qa.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            entries.map((entry, index) =>
              entry.role === "user" ? (
                <div
                  key={index}
                  className="max-w-[85%] self-end whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-[var(--color-kai-neutral)] px-3 py-2 text-small text-white"
                >
                  {entry.text}
                </div>
              ) : (
                <div key={index} className="kai-rise flex items-start gap-2">
                  <KaiAvatar state={entry.response.state} size={26} className="mt-0.5 shrink-0" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <KaiResponseCard response={entry.response} onAction={onAction} />
                    {entry.response.type === "KAI_TEXT" || entry.response.type === "KAI_INSIGHT" ? (
                      <div className="flex items-center gap-1 pl-1">
                        <button
                          type="button"
                          aria-label="Útil"
                          onClick={() => rateEntry(index, "up")}
                          className={cn(
                            "rounded p-0.5 transition-colors hover:text-foreground",
                            entry.feedback === "up" ? "text-[var(--color-kai-positive)]" : "text-muted-foreground",
                          )}
                        >
                          <ThumbsUpIcon className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="No útil"
                          onClick={() => rateEntry(index, "down")}
                          className={cn(
                            "rounded p-0.5 transition-colors hover:text-foreground",
                            entry.feedback === "down" ? "text-[var(--color-kai-alert)]" : "text-muted-foreground",
                          )}
                        >
                          <ThumbsDownIcon className="size-3.5" />
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ),
            )
          )}

          {pending ? (
            <div className="flex items-center gap-2 self-start">
              <KaiAvatar state="ANALYTICAL" size={26} processing className="mt-0.5 shrink-0" />
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-secondary px-3 py-2.5">
                <span className="kai-dot size-1.5 rounded-full bg-[var(--color-kai-analytical)]" style={{ animationDelay: "0ms" }} />
                <span className="kai-dot size-1.5 rounded-full bg-[var(--color-kai-analytical)]" style={{ animationDelay: "150ms" }} />
                <span className="kai-dot size-1.5 rounded-full bg-[var(--color-kai-analytical)]" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          ) : null}

          {!pending && followups.length > 0 && entries.length > 0 && entries[entries.length - 1].role === "assistant" ? (
            <div className="kai-rise flex flex-wrap gap-1.5 pl-8">
              {followups.map((f, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={access.exhausted}
                  onClick={() =>
                    f.message
                      ? submit({ message: f.message, label: f.label })
                      : submit({ quickActionIntentId: f.intentId, label: f.label })
                  }
                  className="rounded-full border border-brand-border bg-brand-subtle/50 px-2.5 py-1 text-caption font-medium text-brand transition-colors hover:bg-brand-subtle disabled:opacity-50"
                >
                  {f.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Alerts */}
        {access.exhausted ? (
          <div className="flex items-center justify-between gap-2 border-t border-border bg-warning-soft px-4 py-2 text-caption text-[var(--warning)]">
            <span>Llegaste al límite de KAI de este mes.</span>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/pricing");
              }}
              className="shrink-0 rounded-full bg-[var(--warning)] px-2.5 py-1 font-medium text-white hover:brightness-110"
            >
              Pasar a PRO
            </button>
          </div>
        ) : banner ? (
          <p role="alert" className="border-t border-border bg-warning-soft px-4 py-2 text-caption text-[var(--warning)]">
            {banner}
          </p>
        ) : null}

        {/* Input */}
        <form
          className="flex items-center gap-2 border-t border-border px-3 py-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSend) void submit({ message: draft.trim(), label: draft.trim() });
          }}
        >
          <div className="flex flex-1 items-center gap-1.5 rounded-full border border-input bg-background px-3 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
            <PaperclipIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <textarea
              ref={inputRef}
              value={draft}
              maxLength={MAX_KAI_MESSAGE_LENGTH}
              rows={1}
              disabled={access.exhausted}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  if (canSend) void submit({ message: draft.trim(), label: draft.trim() });
                }
              }}
              placeholder="Escribí tu consulta…"
              className="max-h-24 min-h-5 w-full resize-none bg-transparent text-small outline-none placeholder:text-muted-foreground disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            aria-label="Enviar"
            disabled={!canSend}
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full text-white transition-[filter,opacity] hover:brightness-110 disabled:opacity-40",
              ACCENT_SEND[visualState],
            )}
          >
            <SendHorizontalIcon className="size-4" />
          </button>
        </form>
      </div>
    </>
  );
}
