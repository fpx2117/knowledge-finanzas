# Runbooks

Operational runbooks for TASK-041. Each one names an owner, the rollback path, and what remains
safe to do (or must never be done) to financial data while the incident is active. These are not
canonical spec documents (not part of `tasks/README.md`'s Traceability Matrix) — see
`docs/deployment-runbook.md` (TASK-039) for the general deploy/release process these assume.

- [`backup.md`](./backup.md) — backup/restore objectives (RPO/RTO), mechanisms, and monitoring.
- [`restore.md`](./restore.md) — the restore-and-validate drill: isolated restore, migration
  compatibility, financial integrity audit, promotion decision.
- [`disaster-recovery.md`](./disaster-recovery.md) — per-scenario playbook (Postgres/Redis/
  Mercado Pago/cache) plus the dated Drill Report log — a real, measured drill, not assumed
  backup configuration.
- [`monthly-pricing-review.md`](./monthly-pricing-review.md) — how to read business/unit-economics
  metrics and cost guardrail breaches; never a control plane over billing.
- [`failed-deploy.md`](./failed-deploy.md) — a deploy that doesn't come up healthy, or comes up
  broken.
- [`provider-outage.md`](./provider-outage.md) — Mercado Pago, OpenRouter, Resend, or Twilio is
  down or unreachable.
- [`webhook-incident.md`](./webhook-incident.md) — a webhook endpoint is failing, flooded, or
  receiving unverified/malicious traffic.
- [`worker-jobs.md`](./worker-jobs.md) — currently not applicable; no background worker exists yet
  in this codebase (see the file for when this changes).

**Owner (all runbooks, until a real on-call rotation exists):** whoever holds the Railway project
and database credentials — today, that's the person operating this repository directly. Update this
line once a real team/rotation exists.
