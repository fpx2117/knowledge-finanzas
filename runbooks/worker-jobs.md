# Runbook: Worker Jobs

**Status: not applicable yet.** No background worker process exists in this codebase — every
scheduled/recurring/reminder/reconciliation concern currently runs synchronously inside a request
(e.g. `notifyUser` evaluating rules inline, `GetReconciliationQueue` querying live at request time)
rather than via a queue or cron worker. `TASK-039`'s own notes and `docs/18-production-readiness.md`
§4 both frame worker deployment as a follow-up "only when recurring/reminder/reconciliation jobs
require it."

## When this changes

Once a real worker exists (a separate Railway service running scheduled jobs against Redis/a queue),
this runbook needs:

- **Owner** of the worker service and its queue.
- **Detection**: how a stuck/crashed worker is surfaced (queue depth alert, missed-schedule alert).
- **Immediate actions**: how to safely pause/drain the queue without losing or double-processing
  jobs.
- **Rollback**: worker-specific — likely the same "redeploy the previous image" pattern as
  `runbooks/failed-deploy.md`, plus whatever in-flight-job handling the queue technology requires.
- **Safe-write behavior**: whether jobs are idempotent (they should be, by the same discipline
  every other write path in this codebase already follows), and what happens to a job that was
  mid-execution when the worker was interrupted.

Until then, there is nothing to operate here.
