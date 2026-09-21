# NextSprout — Security & Development Risk Register (Brainstorm)

> Document 5 of the planning set. A working list of where things can go wrong — security
> AND development/operational — for the Node + PostgreSQL + Razorpay + independent-hosting
> build. Purpose: brainstorm together, then fold agreed mitigations into the design doc,
> CI gates, and the pentest scope. Ratings are pre-mitigation.
> L = Likelihood, I = Impact (H/M/L). Date: 2026-09-21.

Legend: 🔴 must-fix before go-live · 🟠 fix during build · 🟡 monitor/hardening

---

## A. Payment & money integrity (the crown jewels)

| ID | Risk | L | I | Mitigation | Pri |
|---|---|---|---|---|---|
| P1 | **Amount/price tampering** — client sends a lower price | H | H | Prices server-only; verify local amount == PSP amount; ignore client prices | 🔴 |
| P2 | **Webhook forgery** — attacker POSTs a fake "payment success" | H | H | Verify Razorpay webhook signature; never trust unsigned callbacks | 🔴 |
| P3 | **Webhook replay** — resend a valid webhook to double-grant | M | H | Idempotency on `webhook_events.event_id` (unique); process once | 🔴 |
| P4 | **Entitlement abuse** — one payment → many product grants | M | H | One entitlement per verified payment; server-side grant only | 🔴 |
| P5 | **Missed webhook** (host cold-start/downtime) → paid but not granted | M | H | Always-on host (§2.1); rely on PSP retries + reconciliation job | 🔴 |
| P6 | **Subscription lifecycle drift** — renew/cancel/fail not reflected | M | H | Webhook-driven state as source of truth; nightly reconcile vs Razorpay | 🟠 |
| P7 | **Refund/RTO abuse** or double refund | M | M | Server-side refund rules, audit log, one-refund-per-order guard | 🟠 |
| P8 | **Coupon/discount abuse** (if added) | M | M | Server-side coupon validation, per-user limits, expiry | 🟡 |

## B. Authentication, sessions, access

| ID | Risk | L | I | Mitigation | Pri |
|---|---|---|---|---|---|
| AU1 | **Admin account takeover** | M | H | MFA mandatory for admin; strong hashing; lockout; IP allow-list optional | 🔴 |
| AU2 | **Broken object-level authz (IDOR)** — read others' orders by id | H | H | Object-level checks on every read/write; deny-by-default | 🔴 |
| AU3 | **Session theft via XSS** (token in localStorage) | M | H | httpOnly+Secure+SameSite cookies; CSP; no token in JS-readable store | 🔴 |
| AU4 | **CSRF** on state-changing routes | M | M | CSRF tokens / SameSite=strict; re-auth on sensitive actions | 🟠 |
| AU5 | **Credential stuffing / brute force** | H | M | Rate-limit + lockout/backoff; breached-password check; MFA | 🟠 |
| AU6 | **Session fixation / no rotation** | M | M | Regenerate session id on login; idle+absolute timeouts; revoke on logout | 🟠 |
| AU7 | **User enumeration** via login/reset responses | M | L | Generic messages; constant-time; same response for exists/not | 🟡 |
| AU8 | **Privilege escalation** — customer reaches admin API | M | H | RBAC server-side; separate admin routes; role checks not UI-only | 🔴 |

## C. Secrets & keys (no Key Vault)

| ID | Risk | L | I | Mitigation | Pri |
|---|---|---|---|---|---|
| S1 | **Secret committed to git** (API key/DB creds) | H | H | gitleaks in CI (blocking); `.env` git-ignored; secrets manager | 🔴 |
| S2 | **Razorpay key secret exposed to frontend** | M | H | Only public key id in SPA; secret + webhook secret server-only | 🔴 |
| S3 | **No key rotation** after a leak/staff change | M | M | Rotation policy + runbook; separate test/live keys per env | 🟠 |
| S4 | **Secrets in logs / error traces** | M | H | Log scrubbing; no PII/secrets in logs; error handler strips sensitive data | 🟠 |
| S5 | **Over-privileged DB/API credentials** | M | M | Least-privilege DB roles; scoped tokens; separate read/write where useful | 🟡 |

## D. Web application (OWASP)

| ID | Risk | L | I | Mitigation | Pri |
|---|---|---|---|---|---|
| W1 | **XSS** (stored/reflected) | M | H | Framework auto-escaping; CSP (nonce); sanitize any HTML; escape on render | 🔴 |
| W2 | **SQL/NoSQL injection** | L | H | ORM parameterized queries; no string SQL; Zod validation | 🟠 |
| W3 | **Mass assignment** on admin/customer CRUD | M | M | Explicit DTOs/allow-lists; never bind request body straight to model | 🟠 |
| W4 | **SSRF** (e.g. via image/URL fields, webhooks) | L | M | Allow-list outbound hosts; validate URLs; no fetch of user-supplied URLs | 🟡 |
| W5 | **Open redirect** (post-login/checkout return) | M | M | Allow-list redirect targets | 🟡 |
| W6 | **Missing security headers / clickjacking** | H | M | helmet: CSP, HSTS, frame-ancestors none, nosniff, referrer-policy | 🟠 |
| W7 | **CSV/formula injection** in admin exports | M | M | Prefix risky cells; sanitize exports | 🟡 |
| W8 | **File-upload abuse** (if book covers/uploads added) | M | M | Type/size validation, store outside webroot, AV scan, random names | 🟠 |

## E. Dependencies & supply chain

| ID | Risk | L | I | Mitigation | Pri |
|---|---|---|---|---|---|
| D1 | **Vulnerable npm dependency** | H | H | SCA (npm audit/Socket) in CI; Dependabot; pin + lockfile; review updates | 🔴 |
| D2 | **Malicious/typosquatted package** | M | H | Socket.dev/allow-list; review new deps; lockfile integrity | 🟠 |
| D3 | **Compromised build/CI** leaking secrets | L | H | Least-privilege CI tokens; protected branches; no secrets in logs | 🟠 |

## F. Data protection / privacy (DPDP)

| ID | Risk | L | I | Mitigation | Pri |
|---|---|---|---|---|---|
| PR1 | **PII leak** (customer list, addresses, phones) | M | H | Authz on all reads; encryption at rest/in transit; minimize; no PII in URLs | 🔴 |
| PR2 | **No privacy/refund/terms** → PSP won't activate + legal risk | H | H | Publish policies before go-live (also a gateway requirement) | 🔴 |
| PR3 | **Over-retention** of PII | M | M | Retention policy + deletion path; honor consent withdrawal | 🟠 |
| PR4 | **Marketing without consent** | M | M | Unbundled consent logged with timestamp; suppress on opt-out | 🟡 |

## G. Hosting / operations (independent, cost-sensitive)

| ID | Risk | L | I | Mitigation | Pri |
|---|---|---|---|---|---|
| O1 | **Free-tier sleeps/expires** → dropped webhooks, downtime | H | H | Always-on prod host; monitor uptime; PSP retry + reconcile (see P5) | 🔴 |
| O2 | **No backups / DR** → data loss | M | H | Automated Postgres backups + periodic restore test; PITR if available | 🔴 |
| O3 | **No monitoring/alerting** → silent failures | M | M | Uptime + error alerting (Sentry/Better Stack free); on-call runbook | 🟠 |
| O4 | **DDoS / bot abuse** | M | M | Cloudflare proxy/WAF; rate limits; bot mitigation on forms | 🟠 |
| O5 | **Vendor lock-in / provider shutdown** | L | M | `IShippingProvider` + auth/DB abstractions; portable Postgres | 🟡 |
| O6 | **TLS/cert misconfig** | L | M | Managed TLS (host/Cloudflare); HSTS; auto-renew | 🟡 |

## H. Development process / quality

| ID | Risk | L | I | Mitigation | Pri |
|---|---|---|---|---|---|
| DV1 | **Money math bugs** (float rounding, paise) | M | H | Store INR as integer paise; unit tests on all price/total logic | 🔴 |
| DV2 | **No tests / regressions** | H | M | Unit+integration+E2E in CI; coverage gate; test failure = block merge | 🟠 |
| DV3 | **Config drift dev vs prod** | M | M | 12-factor config; env parity; IaC where possible | 🟡 |
| DV4 | **Unreviewed code to main** | M | M | PR review required; protected `main`; CODEOWNERS | 🟠 |
| DV5 | **Accessibility regressions** (undo Doc 3 fixes) | M | M | axe-core in CI; Lighthouse thresholds | 🟡 |
| DV6 | **Migration errors** on live DB | M | H | Reviewed, reversible migrations; run in CI against a copy; backup first | 🟠 |

---

## Top brainstorm topics (let's decide these together)
1. **Managed auth vs custom** (Supabase/Clerk/Auth0 vs Lucia/Auth.js) — risk vs control trade-off (AU-block, S2).
2. **Always-on prod host choice** — the webhook-reliability decision (O1, P5).
3. **Backups/DR ownership** on a non-Azure host (O2) — who runs restores, how often tested.
4. **Guest checkout vs mandatory account** — affects AU/PR surface and conversion.
5. **COD later** — RTO/fraud/reconciliation risks when we add it (P7).
6. **How far to go on MFA** (admin-only vs also customers) (AU1/AU5).

*Living document — ratings + mitigations to be finalized during Phase 0 and mapped into
the CI gates and pentest scope.*
