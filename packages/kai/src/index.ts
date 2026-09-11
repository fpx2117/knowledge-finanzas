// Domain
export type { KaiVisualState } from "./domain/kai-visual-state";
export { KAI_VISUAL_STATES } from "./domain/kai-visual-state";
export type { KaiAction, KaiActionKind } from "./domain/kai-action";
export type {
  KaiResponse,
  KaiResponseType,
  KaiResponseBase,
  KaiMetricValue,
  KaiTextResponse,
  KaiMetricResponse,
  KaiComparisonResponse,
  KaiInsightResponse,
  KaiAlertResponse,
  KaiNavigationResponse,
  KaiActionResponse,
  KaiChartResponse,
  KaiChartData,
  KaiTableResponse,
  KaiTableData,
  KaiConfirmationResponse,
  KaiErrorResponse,
  KaiEmptyStateResponse,
} from "./domain/kai-response";
export type {
  KaiIntentId,
  KaiResolvedIntent,
  KaiIntentMatchStrategy,
  UnresolvedIntent,
} from "./domain/kai-intent";
export { UNRESOLVED_INTENT, INTENT_CONFIDENCE_THRESHOLD } from "./domain/kai-intent";
export type { KaiResolutionSource, KaiInteractionAudit } from "./domain/kai-interaction";
export { deterministicAudit, KAI_POINT_WEIGHTS } from "./domain/kai-interaction";
export type { KaiScreenContext } from "./domain/kai-context";
export { KAI_CONTEXT_REGISTRY, resolveScreenContext } from "./domain/kai-context";

// Resolver
export { normalizeText, resolveDateRange, previousMonthRange, shiftRangeBack } from "./resolver/normalize";
export type { KaiDateRange, KaiDateRangeKind } from "./resolver/normalize";
export { resolveIntent, isConfident } from "./resolver/intent-resolver";
export { parseWriteIntent, parseAmount } from "./resolver/parse-write";
export type { KaiWriteIntent } from "./resolver/parse-write";
export { KAI_INTENT_ALIASES, KAI_INTENT_KEYWORDS } from "./resolver/aliases";

// Registry
export { resolveStatic, KAI_SCREEN_HELP } from "./registry/static-registry";
export { KAI_QUICK_ACTIONS } from "./registry/quick-actions";
export type { KaiQuickAction } from "./registry/quick-actions";
export { resolveFollowups } from "./registry/followups";
export type { KaiFollowup } from "./registry/followups";

// Handlers + ports
export { KAI_HANDLERS } from "./handlers";
export type {
  KaiDataPorts,
  MoneyByCurrency,
  KaiDateRangeInput,
  KaiMonthlyResult,
  KaiRecentExpense,
  KaiUpcomingObligation,
  KaiSubscription,
  KaiBudgetStatus,
  KaiGoalProgress,
  KaiCategoryExpenses,
  KaiTopInsight,
} from "./handlers/ports";
export type { KaiHandler, KaiHandlerContext, KaiHandlerResult } from "./handlers/types";

// Templates
export { formatMoney, formatMoneyList, formatPercent, formatDayMonth } from "./templates/format";

// Proactive
export { buildProactiveCandidates } from "./proactive/build-proactive-message";
export type { ProactiveInput } from "./proactive/build-proactive-message";
export { selectProactive, DEFAULT_KAI_FREQUENCY_CAP } from "./proactive/select-proactive";
export type { KaiDeliveryState, KaiFrequencyCap, SelectProactiveResult } from "./proactive/select-proactive";
export type { KaiProactiveMessage, KaiProactiveAction, KaiProactiveKind } from "./domain/kai-proactive";

// Orchestrator
export { resolveKaiInteraction } from "./orchestrator/resolve-kai-interaction";
export type {
  ResolveKaiInteractionInput,
  ResolveKaiInteractionResult,
  KaiLlmFallback,
  KaiLlmFallbackArgs,
  KaiHistoryTurn,
} from "./orchestrator/resolve-kai-interaction";
