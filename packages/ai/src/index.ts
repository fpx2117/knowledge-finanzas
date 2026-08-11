export { AIError, aiErrorCodes, isAIError, type AIErrorCode } from "./errors";
export type { AIProvider, GenerateStructuredInput, GenerateStructuredResult } from "./provider";

export { MODEL_ROLES, type ModelRole } from "./models/roles";
export { resolveModel, type ModelRegistryConfig } from "./models/registry";
export { getModelCapabilities, validateModelCompatibility, type ModelCapabilities, type ModelCapability } from "./models/capabilities";

export { buildJsonSchema } from "./structured/build-json-schema";
export { parseStructuredOutput } from "./structured/parse-structured-output";

export { createOpenRouterProvider } from "./providers/openrouter/provider";
export { createOpenRouterClient, type OpenRouterClientConfig } from "./providers/openrouter/client";
export { buildChatCompletionRequest, mapChatCompletionResponse } from "./providers/openrouter/mapper";
export type { OpenRouterChatCompletionRequest, OpenRouterChatCompletionResponse } from "./providers/openrouter/types";

export { noopTelemetryRecorder, type GenerationTelemetry, type TelemetryRecorder } from "./telemetry/types";

export {
  createAIExecutor,
  type EntitlementCheckPort,
  type UsageCommitPort,
  type UsageReleasePort,
  type UsageReservationPort,
} from "./execute-generation";

export { AI_CAPABILITIES, isAICapability, type AICapability } from "./credits/capabilities";
export { resolveCreditCost } from "./credits/credit-costs";
export { resolvePoolOrder, type AICreditPool, type AIProductAccessState } from "./credits/credit-policy";
export {
  createAICreditService,
  type AICreditGrantResult,
  type AICreditRepositoryPort,
  type AICreditReservationRecord,
  type AICreditService,
  type PoolBalances,
  type ReserveCreditsInput,
  type ReserveCreditsResult,
} from "./credits/credit-service";

export {
  createExecuteAICapability,
  type CapabilityEntitlementPort,
  type CapabilityUsageEvent,
  type CapabilityUsageTelemetry,
  type ExecuteAICapability,
  type ExecuteAICapabilityInput,
  type RateLimitPort,
  type ResolveAccessPort,
} from "./credits/execute-capability";

export { createGrantTrialCredits, type GrantTrialCreditsInput } from "./credits/grant-trial-credits";
export { createGrantProPeriodCredits, type ProPeriodGrantInput } from "./credits/grant-pro-period-credits";
export { createAdminAdjustCredits, type AdminAdjustCreditsRepository, type AdminAdjustCreditsResult } from "./credits/admin-adjust-credits";
export { createGetAIUsageSummary, type AIUsageSummary, type GetAIUsageSummaryInput } from "./credits/usage-summary";
export { createReconcileStaleReservations } from "./credits/reconcile-stale-reservations";

export {
  categorizeTransaction,
  DEFAULT_MIN_CONFIDENCE as CATEGORIZATION_DEFAULT_MIN_CONFIDENCE,
  TRANSACTION_CATEGORIZATION_PROMPT_VERSION,
  transactionCategorizationSchema,
  type CategoryCandidate,
  type RawTransactionCategorization,
  type TransactionCategorizationInput,
  type TransactionCategorySuggestion,
} from "./capabilities/transaction-categorization";

export { createInMemoryRateLimiter } from "./rate-limit/in-memory-rate-limiter";

export { createToolRegistry, type AnyToolDefinition, type ToolContext, type ToolDefinition, type ToolRegistry } from "./tools/registry";
export {
  FINANCE_TOOL_NAMES,
  noArgsSchema,
  liquidBalancesResultSchema,
  monthlySummaryResultSchema,
  debtSummaryResultSchema,
  upcomingObligationsResultSchema,
  budgetOverviewResultSchema,
  cashflowProjectionResultSchema,
  searchTransactionsArgsSchema,
  searchTransactionsResultSchema,
  type FinanceToolName,
} from "./tools/finance";

export { createContextBuilder, type BuiltContext, type ContextBuilder } from "./context/context-builder";

export {
  explainFinancialInsight,
  buildInsightPrompt,
  INSIGHT_CAPABILITY_TOOLS,
  INSIGHT_PROMPT_VERSION,
  financialInsightSchema,
  type ExplainFinancialInsightInput,
  type FinancialInsight,
  type InsightCapability,
} from "./capabilities/insights";

export {
  normalizeMerchant,
  DEFAULT_MIN_CONFIDENCE as MERCHANT_NORMALIZATION_DEFAULT_MIN_CONFIDENCE,
  MERCHANT_NORMALIZATION_PROMPT_VERSION,
  merchantNormalizationSchema,
  type MerchantNormalizationInput,
  type MerchantNormalizationSuggestion,
  type RawMerchantNormalization,
} from "./capabilities/merchant-normalization";
