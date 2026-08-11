// activation:v1 (task's Scope): 1 account + 5 transactions + dashboard AND cashflow viewed,
// all within the first 7 days after signup. Versioned deliberately — a future activation:v2
// definition would live alongside this one, never silently redefine what "v1" meant for users
// already evaluated against it (so historical activation counts stay comparable).
export const ACTIVATION_V1_WINDOW_DAYS = 7;
export const ACTIVATION_V1_MIN_ACCOUNTS = 1;
export const ACTIVATION_V1_MIN_TRANSACTIONS = 5;

export type ActivationV1Input = {
  accountCount: number;
  transactionCount: number;
  dashboardViewed: boolean;
  cashflowViewed: boolean;
  signupAt: Date;
  now: Date;
};

export function evaluateActivationV1(input: ActivationV1Input): boolean {
  const windowMs = ACTIVATION_V1_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const withinWindow = input.now.getTime() - input.signupAt.getTime() <= windowMs;
  if (!withinWindow) return false;

  return (
    input.accountCount >= ACTIVATION_V1_MIN_ACCOUNTS &&
    input.transactionCount >= ACTIVATION_V1_MIN_TRANSACTIONS &&
    input.dashboardViewed &&
    input.cashflowViewed
  );
}
