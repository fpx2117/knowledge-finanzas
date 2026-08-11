import { z } from "zod";
import type { AnalyticsEventDefinition } from "./types";

const accountCreatedProperties = z.object({
  accountType: z.enum(["CASH", "BANK", "DIGITAL_WALLET", "SAVINGS"]),
  currencyCode: z.string().length(3),
}).strict();

// amountBucket only — never the raw amount (Security Requirement).
const transactionCreatedProperties = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amountBucket: z.enum(["LOW", "MEDIUM", "HIGH"]),
  currencyCode: z.string().length(3),
}).strict();

const userActivatedProperties = z.object({
  activationVersion: z.literal("v1"),
}).strict();

const dashboardViewedProperties = z.object({}).strict();
const cashflowViewedProperties = z.object({}).strict();

export const financeEvents: AnalyticsEventDefinition[] = [
  { name: "account_created", schema: accountCreatedProperties, critical: true, version: 1 },
  { name: "transaction_created", schema: transactionCreatedProperties, critical: true, version: 1 },
  { name: "user_activated", schema: userActivatedProperties, critical: true, version: 1 },
  { name: "dashboard_viewed", schema: dashboardViewedProperties, critical: false, version: 1 },
  { name: "cashflow_viewed", schema: cashflowViewedProperties, critical: false, version: 1 },
];
