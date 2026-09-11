/**
 * A structured action KAI can attach to any response (spec §11 "Action Cards", §16
 * "Quick Actions"). The frontend decides how to render it; KAI never emits HTML or raw
 * links. `route` is always an internal app path.
 */
export type KaiActionKind =
  | "navigate"
  | "open-quick-add"
  | "run-intent"
  | "confirm-create"
  | "confirm-goal-allocation"
  | "confirm-void"
  | "confirm-pay-obligation"
  | "confirm-transfer"
  | "dismiss"
  | "remind-later";

export type KaiAction = {
  kind: KaiActionKind;
  label: string;
  /** For `navigate` — an internal route, optionally with a query string. */
  route?: string;
  /** For `run-intent` — the intent id to re-run (quick-action chips). */
  intentId?: string;
  /** Free-form params passed back to the action handler (e.g. quick-add prefill). */
  params?: Record<string, string>;
};
