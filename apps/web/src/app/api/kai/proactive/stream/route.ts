import { getCurrentUser } from "@/lib/auth/require-current-user";
import { getKaiProactiveMessageAction } from "@/features/kai/actions/kai-proactive-actions";

export const dynamic = "force-dynamic";

const POLL_INTERVAL_MS = 15_000;
const HEARTBEAT_EVERY_TICKS = 8; // ~2min, well under typical proxy idle timeouts

function sseEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * WP-KAI-PROACTIVE-DELIVERY (spec §7): push the current proactive card to every open tab/device
 * for this user, not just the one where a mutation just happened. Like `/api/notifications/stream`,
 * this is a best-effort per-connection poll of the same source of truth the action itself reads —
 * `getKaiProactiveMessageAction` already throttles the actual evaluation to once per 90s per user
 * (`kai-proactive-actions.ts`), so polling it every 15s here is cheap: most ticks return the
 * cached result. No pub/sub infra exists, so a mutation in one tab still takes up to ~15s to reach
 * another tab/device — the same-tab case stays instant via the `kai:refresh-proactive` window
 * event + a direct `force:true` call, unaffected by this endpoint.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let lastSentId: string | null = null;
  let tick = 0;
  let closed = false;
  let interval: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      function safeEnqueue(chunk: string) {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
          if (interval) clearInterval(interval);
        }
      }

      async function poll() {
        if (closed) return;
        tick += 1;

        try {
          const message = await getKaiProactiveMessageAction();
          if (message && message.id !== lastSentId) {
            lastSentId = message.id;
            safeEnqueue(sseEvent("kai-proactive", message));
          }
        } catch {
          // best-effort — a failed evaluation this tick just means no update, try again next poll
        }

        if (tick % HEARTBEAT_EVERY_TICKS === 0) safeEnqueue(": heartbeat\n\n");
      }

      safeEnqueue("retry: 5000\n\n");
      await poll();
      interval = setInterval(() => {
        poll().catch(() => {});
      }, POLL_INTERVAL_MS);
    },

    cancel() {
      closed = true;
      if (interval) clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
