import { createNotificationRepository, db } from "@know-finanzas/db";
import { getCurrentUser } from "@/lib/auth/require-current-user";

export const dynamic = "force-dynamic";

const notifications = createNotificationRepository(db);
const POLL_INTERVAL_MS = 4000;
const HEARTBEAT_EVERY_TICKS = 8; // ~32s, well under typical proxy idle timeouts

function sseEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// Best-effort realtime signal only: identity comes from the authenticated session (never a
// query-string userId), and every emitted event is scoped to that one user's own Postgres reads
// — there is no cross-user broadcast channel for this to leak into. No pub/sub infra exists
// (Redis is optional/unconfigured), so this polls Postgres — the same source of truth the
// notification center itself reads — rather than reacting to an in-process event bus that would
// miss writes from other processes/webhooks.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = user.id;
  const encoder = new TextEncoder();
  let lastUnreadCount = -1;
  let lastSeenNewestId: string | null = null;
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

        const unreadCount = await notifications.countUnreadForUser(userId);
        if (unreadCount !== lastUnreadCount) {
          lastUnreadCount = unreadCount;
          safeEnqueue(sseEvent("snapshot", { unreadCount }));
        }

        const recent = await notifications.listForUser(userId, { unreadOnly: true, limit: 5 });
        const newest = recent[0];
        if (newest && newest.id !== lastSeenNewestId) {
          const alreadySeen = lastSeenNewestId === null; // first tick: seed, don't toast history
          lastSeenNewestId = newest.id;
          // Push every new notification except LOW (those only bump the unread badge via
          // `snapshot`); the client decides whether to toast.
          if (!alreadySeen && newest.priority !== "LOW") {
            safeEnqueue(sseEvent("created", { id: newest.id, type: newest.type, category: newest.category, priority: newest.priority, metadata: newest.metadata, createdAt: newest.createdAt }));
          }
        }

        if (tick % HEARTBEAT_EVERY_TICKS === 0) safeEnqueue(": heartbeat\n\n");
      }

      safeEnqueue("retry: 3000\n\n");
      await poll();
      interval = setInterval(() => { poll().catch(() => {}); }, POLL_INTERVAL_MS);
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
