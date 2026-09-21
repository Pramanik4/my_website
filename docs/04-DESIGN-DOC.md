# NextSprout — Formal Design Document

> Document 4 of the planning set. This is the build blueprint. It consolidates the repo
> analysis (Doc 1), live gateway pricing (Doc 2), and the UX audit (Doc 3) into a single
> approved-architecture plan, an SSDLC + security program, a threat model, a pentest
> plan, and a phased roadmap with per-phase Definition of Done.
>
> Status: **DRAFT for review.** No implementation has started. Nothing in the existing
> repo has been modified.
> Date: 2026-09-20 · Owner: Ananthakrishnan A.

---

## 0. Locked decisions (from planning)

| Decision | Choice | Rationale |
|---|---|---|
| Payment gateway | **Razorpay, UPI-first** (Cashfree as fallback provider) | Best subscription + UPI-AutoPay API; UPI ~0% fee suits low-ticket ₹ pricing; cards as fallback. Bank gateways (ICICI/SBI/Federal/BillDesk) rejected — setup/AMC fees + heavier onboarding, worse for small merchants (Doc 2 §6) |
| Backend | **Node.js (NestJS recommended; Fastify/Express ok) + PostgreSQL** via Prisma/Drizzle + Zod validation | User choice; NestJS gives structure + RBAC guards + DI (discipline for a payments app) |
| Hosting | **Independent, not Azure.** Prod: **always-on** host (Cloudflare Workers / cheap VPS / Render-Railway paid) + **Neon** Postgres + SPA on **Cloudflare Pages / Netlify** | Cost-sensitive + must keep an always-reachable webhook endpoint. **Avoid Vercel Hobby (non-commercial) and sleeping free dynos.** See §2.1 |
| Frontend | **SPA rebuild — Angular** (React/Vue acceptable; pick one) | Fixes the 9× CSS duplication + UX/a11y/SEO defects at the root |
| Auth | **Self-managed** (no Entra): managed provider (Supabase Auth / Clerk / Auth0 free tier) **or** vetted library (Lucia/Auth.js/Passport) — never hand-rolled crypto. Customer accounts + custom **admin/CRM** portal, RBAC | User dropped Azure/Entra; §14 |
| Secrets | **Secrets manager** (Infisical/Doppler free, or host env-store) — no Key Vault | No Azure; §14.4 |
| Security scope | **Full: threat model → SSDLC in CI → DAST/pentest gate before go-live** | Per standing requirement (Secure SDLC + OWASP ASVS L2) |

---

## 1. Goals & non-goals

### Goals
1. Take **real payments** for one-time products and **recurring subscriptions**, with
   server-verified amounts and gateway signature verification.
2. Give the business a definitive answer to **"who paid / who is subscribed"** via a
   secure admin dashboard (active / cancelled / payment-failed).
3. Rebuild the customer-facing site as a maintainable Angular SPA that fixes the UX,
   accessibility, SEO, and navigation defects from Doc 3.
4. Stand up a **full SSDLC** (source control discipline, CI, SAST/SCA/secret-scanning,
   tests, DAST/pentest gate) from day one.
5. Be **legally shippable**: privacy/refund/terms, PII handling under India's DPDP Act.

### Non-goals (this phase)
- Multi-currency / international expansion (design leaves room; not built now).
- A full LMS / content-delivery platform for the e-books/programs (delivery can start
  as emailed links / simple gated downloads).
- Mobile native apps.

---

## 2. Target architecture

```
   Customer (browser)          Independent hosting (not Azure)
  ┌───────────────┐        ┌──────────────────────────────────────────┐
  │ SPA           │─HTTPS─▶ │  ┌──────────────┐     ┌────────────────┐ │
  │ (Cloudflare   │        │  │ Node API     │────▶│ PostgreSQL      │ │
  │  Pages/Netlify)│◀──────┼──│ (NestJS;     │     │ (Neon serverless)│ │
  └───────┬───────┘        │  │  always-on)  │◀────│                 │ │
          │                │  └──────┬───────┘     └────────────────┘ │
          │ Razorpay       │         │  ▲                              │
          │ Checkout JS    │         │  │ webhook (signed)             │
          │                │         ▼  │                              │
          │                │  ┌──────────────┐  ┌────────────────────┐│
          └────────────────┼─▶│  Razorpay    │  │ Secrets mgr        ││
             (redirect/     │  │  (PSP)       │  │ (Infisical/Doppler)││
              embedded)     │  └──────────────┘  │ Logs (host/APM)    ││
                            │                     └────────────────────┘│
                            └──────────────────────────────────────────┘
   Admin/Owner ── self-managed auth + MFA ──▶ Admin/CRM area ──▶ API (role-gated)
```

**Key principle: the browser never decides money.** The SPA sends *product IDs + quantities*;
the API looks up authoritative prices, creates the Razorpay order server-side, and later
verifies the payment signature and the webhook signature before granting entitlement.

### Components
- **SPA** (Angular; React/Vue ok) — customer storefront + admin/CRM area (lazy-loaded,
  role-gated). Static host with CDN (Cloudflare Pages / Netlify — commercial-OK free tiers).
- **Node API** (NestJS recommended) — catalog, cart validation, order creation, payment
  verification, subscription lifecycle, entitlements, auth, admin/CRM. Stateless.
- **PostgreSQL** (Neon serverless, or Supabase) — system of record (schema §4).
- **Razorpay** — Orders API (one-time) + Subscriptions API / UPI AutoPay (recurring).
- **Secrets manager** (Infisical/Doppler free, or host encrypted env store) — Razorpay keys,
  webhook secret, DB creds, session/JWT signing keys. §14.4.
- **Logging/APM** — structured logs + audit trail + alerting via host or a free APM
  (e.g. Better Stack / Sentry free tier). No PII/secrets in logs.

### 2.1 Hosting options (independent) — trade-offs
| Platform | Role | Watch out for |
|---|---|---|
| **Neon** | Postgres | Generous free serverless PG — recommended DB |
| **Supabase** | Postgres + built-in Auth | Free tier pauses on inactivity; Auth can replace custom auth |
| **Cloudflare** Pages+Workers | SPA + API | Always-on free, generous; Workers ≠ full Node (some rewrite) |
| **Render / Railway / Fly** | Node API | Free tiers **sleep**/expire → risky for webhooks; use paid (~$7/mo) |
| **VPS** (Hetzner/DO) | Node API | ~$4–6/mo always-on; you patch/manage it |
| **Vercel/Netlify** | SPA + functions | **Vercel Hobby is non-commercial**; Netlify/CF Pages OK for commercial |
| **AWS free / Oracle always-free** | Full control | AWS free = 12 months only; Oracle always-free VM = most ops |

**Recommended prod combo:** SPA on **Cloudflare Pages/Netlify** + Node API on an
**always-on** host (Cloudflare Workers / cheap VPS / paid Render) + **Neon** Postgres.
Rationale: webhooks need an always-reachable endpoint — sleeping free dynos can drop them.

---

## 3. Payment & subscription flows

### 3.1 One-time purchase (e-books, one-off services)
1. SPA → `POST /api/orders` with `{items:[{productId, qty}]}` (no prices).
2. API validates products against DB, computes authoritative total, creates a Razorpay
   **Order** for that amount, persists a local `orders` row `status=created`.
3. SPA opens Razorpay Checkout (UPI-first). Customer pays.
4. On success, SPA → `POST /api/orders/{id}/verify` with Razorpay payment id + signature.
5. API **verifies the signature** (HMAC over `order_id|payment_id` with the key secret).
   On match → `status=paid`, grant entitlement, send receipt email.
6. **Authoritative confirmation is the webhook** (`payment.captured`) — API verifies the
   webhook signature and reconciles even if the browser never returned.

### 3.2 Subscription (monthly programs) — UPI AutoPay / Razorpay Subscriptions
1. SPA → `POST /api/subscriptions` with `{planId}`.
2. API maps plan → Razorpay Plan, creates a Razorpay **Subscription** (mandate), persists
   `subscriptions` row `status=created`.
3. Customer authorizes the mandate (UPI AutoPay preferred → ~0 fee).
4. Webhooks drive the lifecycle and are the **source of truth**:
   - `subscription.activated` → `status=active`, grant access.
   - `subscription.charged` → record invoice, extend period.
   - `payment.failed` / `subscription.pending` → `status=past_due`, start dunning.
   - `subscription.cancelled` / `completed` → revoke access at period end.
5. "Who is subscribed" = query `subscriptions WHERE status='active'`.

### 3.3 Anti-tampering rules (non-negotiable)
- Prices only ever read from DB server-side; client-sent prices are ignored.
- Every Razorpay callback + webhook signature is verified before any state change.
- Idempotency keys on order creation + webhook handling (webhooks retry).
- Amount on the local order must equal amount confirmed by Razorpay or it's rejected + alerted.

---

## 4. Data model (PostgreSQL)

```
products        (id, sku, name, description, type, billing['one_time'|'monthly'],
                 price_inr, active, created_at)           -- catalog is server-authoritative
plans           (id, product_id FK, razorpay_plan_id, interval, amount_inr, active)
customers       (id, name, email, phone_e164, marketing_consent, consent_at,
                 created_at)                               -- PII (see §7)
orders          (id, customer_id FK, status['created'|'paid'|'failed'|'refunded'],
                 amount_inr, razorpay_order_id, razorpay_payment_id, created_at, paid_at)
order_items     (id, order_id FK, product_id FK, qty, unit_price_inr)  -- price snapshot
subscriptions   (id, customer_id FK, plan_id FK, razorpay_subscription_id,
                 status['created'|'active'|'past_due'|'cancelled'|'completed'],
                 current_period_end, created_at, cancelled_at)
invoices        (id, subscription_id FK, razorpay_invoice_id, amount_inr, status, paid_at)
entitlements    (id, customer_id FK, product_id FK, source['order'|'subscription'],
                 active, granted_at, revoked_at)          -- what the customer may access
webhook_events  (id, provider, event_id UNIQUE, type, payload_hash, received_at,
                 processed_at)                             -- idempotency + audit
audit_log       (id, actor, action, entity, entity_id, at, detail)  -- admin actions
```

Notes: money stored as INR integer (paise-safe) — never floats. `webhook_events.event_id`
UNIQUE gives idempotency. `order_items` snapshots the price at purchase time.

---

## 5. Admin — "who paid / who is subscribed"

Role-gated (self-managed auth + MFA; roles: `Admin`, `Support`, `ReadOnly` — §14) area of the SPA:
- **Orders** — searchable/filterable (date, status, product, amount); export CSV.
- **Subscriptions** — active / past-due / cancelled; MRR snapshot; upcoming renewals;
  failed-payment (dunning) queue.
- **Customers** — profile, purchase + subscription history, consent status.
- **Reconciliation** — local records vs Razorpay settlement; flag mismatches.
- Every admin mutation writes to `audit_log`. No hard deletes of financial records
  (soft-delete / status only), consistent with your GRC audit-trail pattern.

---

## 6. Frontend rebuild (Angular) — resolves Doc 3 findings

- **One design system** (component library + single theme = tokens already in the CSS):
  kills the 9× CSS duplication (M1) and the cart-behavior drift.
- **Routing** replaces hand-linked pages → fixes broken nav map (M3); all program pages
  reachable; real `<a routerLink>` (fixes A1 keyboard access).
- **Responsive nav with hamburger** (R1) as a shared header component.
- **Accessible cart/checkout**: `role=dialog` + focus trap + Esc (A3), associated labels +
  inline errors replacing `alert()` (A2/A5), `aria-live` cart count (A4), `autocomplete`.
- **Checkout** integrates Razorpay (UPI-first) + real **order confirmation page + email
  receipt** (fixes CV1/CO1 placeholder alert).
- **Trust + legal**: testimonials section + footer Refund/Terms/Privacy (CV2/CV3).
- **SEO**: per-route meta + Open Graph/Twitter, canonical, favicon, sitemap/robots, and
  **Product/Offer JSON-LD** (S1–S4). Use Angular SSR/prerender so product pages are
  crawlable.
- **Catalog integrity**: the 3 orphaned products (M2) either get pages or are retired;
  catalog comes from the API, not hardcoded JS.
- **i18n-ready phone** (R3): default India, but E.164-capable.

---

## 7. Data protection & compliance (India DPDP Act + good practice)

- **PII inventory:** name, email, phone, marketing consent, purchase history.
- **Lawful basis & consent:** explicit, unbundled marketing consent (already a checkbox —
  keep, but log `consent_at`); transactional processing for order fulfilment.
- **Data minimization:** collect only what's needed to fulfil + contact.
- **Retention policy:** define + enforce (e.g., financial records per tax law; marketing
  data until consent withdrawn).
- **Rights:** access / correction / erasure request path.
- **Publish before go-live:** Privacy Policy, Refund/Cancellation Policy, Terms — these
  are *release blockers* (you're taking money + PII).
- **Card data:** never touches our servers — Razorpay Checkout handles it (keeps us out
  of heavy PCI-DSS scope; SAQ-A level).

---

## 8. SSDLC program (Full)

Aligned to your standing rule: **Secure SDLC + OWASP ASVS L2 + software best practices,
per-increment Definition of Done.**

### 8.1 Source control & branching
- Trunk-based with short-lived feature branches; **PR review required**; protected `main`.
- Conventional commits; **no AI attribution** on commits/PRs (your standing rule).
- `.gitignore`, `.editorconfig`, CODEOWNERS, populated README + `/docs`.

### 8.2 CI pipeline (gates on every PR)
1. **Build** (API + SPA) + unit tests (fail < threshold coverage).
2. **SAST** — CodeQL / SonarQube for TypeScript/JavaScript (API + SPA).
3. **SCA** — dependency scan (Dependabot + `npm audit` / Socket.dev) + license check.
4. **Secret scanning** — gitleaks / GitHub secret scanning (blocks secrets in repo).
5. **Lint/format** — ESLint + Prettier across API + SPA; type-check (`tsc --noEmit`).
6. **IaC scan** (if IaC used) + container scan (if containerized).
7. **DAST** — OWASP ZAP baseline against a deployed staging build (nightly / pre-release).

### 8.3 Security requirements (ASVS L2 highlights)
- Server-side authz on every endpoint; deny-by-default; admin endpoints role-checked (§14).
- Input validation (Zod) + output encoding; parameterized queries via ORM (Prisma/Drizzle)
  — no string-concatenated SQL; guard against **mass-assignment** (explicit DTOs/allow-lists).
- **Security headers** (helmet): CSP (nonce-based), HSTS, X-Content-Type-Options,
  Referrer-Policy, frame-ancestors 'none'.
- **CORS** locked to the SPA origin only; no wildcard.
- Secrets only in the secrets manager / host env store; **none in code/config/repo** (§14.4).
- TLS everywhere; **httpOnly + Secure + SameSite=strict session cookies** (prefer server-side
  sessions over JWT-in-localStorage to avoid XSS token theft).
- **CSRF** protection on state-changing routes (double-submit token / SameSite).
- Rate limiting + anti-automation + **account lockout** on order/subscription/auth endpoints.
- Full audit logging of security-relevant + admin events; **no PII/secrets in logs**.
- Webhook + payment signature verification + idempotency (see §3.3).

### 8.4 Testing strategy
- **Unit** (domain/price/entitlement logic — the money math especially).
- **Integration** (API + DB, Razorpay in test mode).
- **E2E** (Playwright: purchase + subscription happy paths + failure paths).
- **Accessibility tests** (axe-core in CI) to hold the Doc 3 fixes.
- **Contract tests** for webhook payloads.

---

## 9. Threat model (STRIDE, abridged)

| Threat | Example | Mitigation |
|---|---|---|
| **Spoofing** | Forged webhook / fake payment success | Verify Razorpay signature on callback + webhook; server confirms with PSP |
| **Tampering** | Client changes price/amount | Prices server-only; verify amount == PSP amount; ignore client prices |
| **Repudiation** | "I didn't authorize / I did pay" | `audit_log`, `webhook_events`, immutable invoices, reconciliation |
| **Information disclosure** | PII/customer list leak | Authz on all reads, least-privilege DB, encryption at rest/in transit, no PII in logs/URLs |
| **Denial of service** | Order/webhook flooding | Rate limiting, idempotency, Cloudflare WAF/proxy, autoscale |
| **Elevation of privilege** | Customer hits admin APIs | RBAC (self-managed), deny-by-default, server-side role checks, separate admin routes + MFA |
| **Business-logic abuse** | Reuse one payment for many entitlements; coupon abuse | Idempotency keys, one entitlement per verified payment, server-side coupon rules |

Expanded into the **Security & Development Risk Register (Doc 5)**; a formal STRIDE
threat model (`07-THREAT-MODEL.md`) to be produced during Phase 0.

---

## 10. Penetration test plan (go-live gate)

A real pentest is only possible once the app + payment flow run (Doc 3 noted the current
static site has no server to test). Plan:
- **When:** against a production-like **staging** build, after feature-complete, **before
  go-live**; re-test after fixes.
- **Scope:** SPA, API (authz, IDOR, injection, business logic), payment + subscription
  flows (tampering, replay, webhook forgery), auth (login/session/MFA/reset), admin/CRM
  area, security headers/config, secrets handling, dependency/known-CVE check.
- **Method:** authenticated + unauthenticated; OWASP WSTG + ASVS L2 checklist; automated
  (ZAP/Burp) + manual business-logic testing (the payment/entitlement abuse cases are the
  crown jewels).
- **Deliverable:** findings report (severity, evidence, remediation) → fixes → verification
  re-test → sign-off. **High/Critical = release blockers.**

---

## 11. Phased roadmap (with Definition of Done per phase)

**Phase 0 — Foundations (setup)**
Repo hygiene, CI skeleton with SAST/SCA/secret-scan, hosting + secrets-manager setup, threat
model doc, legal-copy drafting kicked off.
*DoD:* CI green on empty app; no secrets in repo; threat model reviewed.

**Phase 1 — Payments MVP (one-time) + admin visibility**
Node API (catalog, orders, verify, webhooks), PostgreSQL schema, Razorpay one-time
(UPI-first), minimal admin "who paid". Angular storefront shell for the purchasable pages.
*DoD:* A real ₹ one-time purchase works end-to-end in test mode; amount verified
server-side; webhook reconciled; order visible in admin; unit+integration+E2E pass; ASVS
L2 checks pass; security headers live.

**Phase 2 — Subscriptions + accounts**
Razorpay Subscriptions / UPI AutoPay, lifecycle webhooks, dunning, entitlements,
customer accounts + "my subscription" (cancel), full admin subscriptions view.
*DoD:* Monthly plan activates, renews, fails-and-recovers, and cancels correctly; "who is
subscribed" accurate; access granted/revoked on lifecycle.

**Phase 3 — Full UX/SEO rebuild completion**
All Doc 3 fixes landed (a11y via axe in CI, mobile nav, nav map, trust/legal content,
SEO/JSON-LD, catalog integrity), confirmation + receipt emails polished.
*DoD:* axe-core clean; Lighthouse a11y/SEO thresholds met; all pages reachable + mobile-nav
working; legal pages published.

**Phase 4 — Security hardening + pentest gate + go-live**
DAST in pipeline, external/independent pentest, remediation, re-test, sign-off, monitoring
+ alerting, runbook.
*DoD:* No open High/Critical findings; DAST clean; monitoring + on-call runbook in place;
go-live checklist signed.

---

## 13. Fulfillment & shipping — physical hardcopy (added 2026-09-20)

Requirement update: NextSprout now also sells **physical hardcopy books**, shipped across
India. Stage 1 = **India Post**; then other Indian couriers; Stage 2 = **international**.
This adds a physical-fulfillment dimension to the platform.

### 13.1 Three fulfillment types + product variants
Each e-book title is sold as **two variants** — a `digital` download **and** a `hardcopy`
(shipped) version — so the catalog needs a **variant layer** (one product → many SKUs,
each with its own price + fulfillment type). An order line references a *variant*, which
carries a `fulfillment_type`:
- `digital` — e-book download: instant entitlement + link.
- `service` — tutoring subscription: access grant (§3.2).
- `physical` — hardcopy book: **ship + track + deliver** (this section).

A cart may mix all three; only lines with a `physical` variant trigger address + shipping.

### 13.2 Carrier strategy — multi-carrier + per-zone routing rules
**Requirement:** enable **different couriers per customer zone/region** and pick the right
one per requirement — not a single hardcoded carrier.

**Decision:** an **aggregator backbone** (recommended: **Shiprocket**; Delhivery a strong
alternative) behind a thin **`IShippingProvider` abstraction**, PLUS a **configurable
courier-routing layer** owned by us. Rationale:
- India Post's direct API is restricted/limited (bulk-customer only, thin docs, no clean
  tracking webhooks); direct-only is brittle and single-carrier.
- An aggregator reaches **India Post *and*** Delhivery/DTDC/Blue Dart/Ecom/Xpressbees via
  **one integration**, with label/AWB, pickup, **tracking webhooks**, pincode
  serviceability, rate calc, NDR/RTO handling, COD, and a branded tracking page — i.e. it
  *supplies the pool of couriers* we route across.
- A **direct carrier** can still be added later through the same `IShippingProvider`
  abstraction for a specific region that needs it — vendor-swappable by design.

**Courier-routing rules engine (admin-configurable):**
- Define **shipping zones** by pincode range / state / region (e.g. metro, rural, NE/remote).
- Per zone, **enable the allowed couriers** and set a **selection strategy**:
  `preferred` → `cheapest` → `fastest` → ordered `fallback`.
- At checkout: check **serviceability** for the address → apply the zone's rules → auto-pick
  the eligible courier (with **manual override in admin**).
- Maps to the roadmap with **no code change** between stages: Stage 1 = enable **India Post**
  in the rules; next = enable more Indian couriers per zone; Stage 2 = cross-border
  (e.g. Shiprocket X) as new zones/couriers.

### 13.3 Physical order flow
1. Cart with a physical item → checkout **requires shipping address + pincode**.
2. **Serviceability + rate check** via aggregator (deliverable? COD available? shipping cost).
3. Payment (prepaid UPI-first) per §3.1; amount includes shipping.
4. On `paid` → create **shipment** (generate AWB/label via aggregator), status `packed`.
5. Pickup scheduled → `shipped`; **tracking webhooks** update `in_transit` →
   `out_for_delivery` → `delivered`, persisted as `tracking_events`.
6. Customer sees a **tracking page** + gets SMS/WhatsApp/email updates.
7. Exceptions: `NDR` (retry via aggregator), `RTO/returned`, lost/damaged → refund/reship.

### 13.4 Data-model additions (extends §4)
```
product_variants(id, product_id FK, sku, fulfillment_type['digital'|'service'|'physical'],
                 price_inr, active,
                 weight_grams, length_cm, width_cm, height_cm, hsn_code)  -- dims only if physical
addresses       (id, customer_id FK, line1, line2, city, state, pincode, country='IN',
                 phone_e164, is_default)
shipping_zones  (id, name, match_type['pincode_range'|'state'|'region'], match_value,
                 priority)                                   -- e.g. NE/remote, metro, rural
courier_rules   (id, zone_id FK, courier_code, enabled, strategy['preferred'|'cheapest'
                 |'fastest'|'fallback'], rank)               -- which couriers per zone + order
shipments       (id, order_id FK, provider, courier_code, awb_no, courier_name,
                 status['pending'|'packed'|'shipped'|'in_transit'|'out_for_delivery'
                        |'delivered'|'ndr'|'rto'|'returned'|'lost'],
                 shipping_cost_inr, cod BOOLEAN, label_url, tracking_url,
                 shipped_at, delivered_at)
tracking_events (id, shipment_id FK, status, location, event_at, raw_payload)
-- order_items now references product_variants (not products directly)
-- orders gains:  shipping_address_id FK, shipping_cost_inr, payment_mode['prepaid'|'cod']
```
`shipments`/`tracking_events` idempotent on provider event id (webhooks retry, like §3.3).

### 13.5 Decisions (physical)
- **COD:** ✅ **RESOLVED — launch prepaid-only (UPI-first).** Add COD later with
  serviceability-gated COD + partial-prepaid to limit RTO/fraud.
- **Shipping charges:** ✅ **RESOLVED — free over ₹X, else flat/zone rate** (rate pulled
  live per selected courier). *Still to confirm: the threshold ₹X and the flat fallback.*
- **Couriers:** ✅ **RESOLVED — multi-carrier via aggregator + per-zone routing rules**
  (§13.2). *Still to confirm: aggregator = Shiprocket (default) vs Delhivery, and the
  initial zone→courier map (Stage 1 defaults to India Post everywhere).*
- **Catalog:** ✅ **RESOLVED — e-books sold as both digital + hardcopy variants** (§13.1).
- **GST/HSN:** printed books are often GST-exempt but shipping/handling may be taxable —
  invoice model supports per-line HSN + tax; **confirm treatment with your accountant.**
- **Returns policy** for damaged/lost/undelivered parcels (drives refund/reship flow).
- **Packaging weights/dimensions** per hardcopy variant (needed for rate calc).

### 13.6 Roadmap impact
- **Phase 1** stays prepaid one-time payments + admin, but the **checkout gains address
  capture** and orders record a fulfillment type (physical lines allowed, shipment created
  manually/CSV at first if needed).
- **New Phase 2.5 — Shipping integration:** `IShippingProvider` + Shiprocket (India Post),
  serviceability, rates, AWB/label, tracking webhooks, tracking page + notifications,
  NDR/RTO. *DoD:* a real hardcopy order ships via India Post, tracking updates flow end to
  end, customer sees status, admin sees shipment + reconciliation.
- **Later:** enable additional Indian couriers (config only); then **Stage 2 international**
  (cross-border carrier + multi-currency + customs fields).

---

## 12. Open items to confirm before Phase 0

**Resolved:** Audience (Stage 1 India → Stage 2 intl, §13.6) · Catalog = e-books as
digital+hardcopy variants (§13.1) · COD = prepaid-only at launch · Shipping = free-over-₹X
else zone rate · Couriers = aggregator + per-zone routing rules (§13.2).

Still to confirm:
1. **Content delivery (digital/service):** e-book download (email link / gated download) +
   how tutoring access is granted. Needed for entitlements design.
2. **Free-shipping threshold ₹X** + flat fallback rate.
3. **Aggregator:** Shiprocket (default) vs Delhivery + initial **zone→courier map**
   (Stage 1 defaults to India Post everywhere).
4. **GST/HSN treatment** for printed books + shipping (confirm with accountant).
5. **Returns policy** (damaged/lost parcels) + **refund/cancellation policy** terms.
6. **Weights/dimensions** per hardcopy variant (for rate calc).
7. **Brand assets** for the Angular rebuild (logo, final palette — reuse existing tokens).
8. **Razorpay account** ownership + KYC (business entity, bank account) — external dependency.
9. Confirm **Cashfree-as-fallback** is wanted, or Razorpay-only to start.

---

## 14. Authentication, sessions, secrets & API security (self-managed — no Azure/Entra)

Requirement: secure **customer** auth + a custom **admin/CRM** portal, with proper key,
password, session and API-key management done by us. Guiding rule: **never hand-roll
crypto** — use a managed provider or a vetted library.

### 14.1 Auth approach (pick one at Phase 0)
- **Option A — Managed (lowest risk):** Supabase Auth / Clerk / Auth0 (free tiers). They
  handle hashing, sessions, MFA, email verification, breach checks. Fastest + safest.
- **Option B — Custom (full control of admin/CRM):** build on **Lucia / Auth.js / Passport**.
  Chosen if we want the admin/CRM fully in-house. Requirements below apply either way.

### 14.2 Passwords & accounts
- Hash with **Argon2id** (or bcrypt cost ≥ 12); never store plaintext/reversible.
- **Email verification** on signup; secure **password reset** (single-use, expiring,
  hashed token; no user-enumeration in responses).
- Bren-password check (HaveIBeenPwned k-anonymity) + strength policy.
- Login **rate-limiting + account lockout / backoff**; generic error messages.

### 14.3 Sessions & MFA
- **Server-side sessions** with **httpOnly + Secure + SameSite=strict** cookies (preferred
  over JWT-in-localStorage → immune to XSS token theft). If JWT used: short-lived access +
  rotating refresh tokens, server-side revocation list.
- **MFA (TOTP) mandatory for all admin/staff**; optional for customers.
- Idle + absolute session timeouts; invalidate sessions on password change / logout;
  bind session to minimal device signals; regenerate id on login (no fixation).

### 14.4 Secrets & API-key management
- **All secrets in a secrets manager** (Infisical/Doppler free, or host encrypted env
  store) — **never in the repo** (gitleaks blocks in CI); `.env` git-ignored.
- **Razorpay key secret + webhook secret are server-only.** Frontend gets **only** the
  public key id. Same for shipping-aggregator keys.
- **Rotation policy** for all keys + session/JWT signing keys; document rotation runbook.
- App-level **encryption for sensitive DB fields** (if any beyond hashed passwords).
- Separate **test vs live** keys per environment; least-privilege API tokens.
- Any first-party API keys we issue: hashed at rest, scoped, revocable, shown once.

### 14.5 API security
- **Deny-by-default authz** on every route; RBAC (customer/admin/support/read-only);
  **object-level checks** to stop IDOR (a customer can only read *their* orders).
- **Zod** input validation on every endpoint; explicit DTOs (no mass-assignment).
- **CORS** locked to the SPA origin; **helmet** security headers; **CSRF** tokens on
  state-changing routes; rate limits per IP + per account.
- **No secrets/PII in logs or URLs**; structured audit logging of admin actions.
- Webhook endpoints: verify signature, enforce idempotency, allow-list source if possible.

### 14.6 Admin / CRM portal
- Separate route + separate session scope; **MFA required**; IP allow-list optional.
- CRUD for catalog (add/edit book, variants, price), orders, subscriptions, shipments,
  courier-routing rules, customers; every mutation → `audit_log`; **no hard deletes** of
  financial records (soft-delete/status only).
- Least-privilege roles; `ReadOnly` for support/analytics; dangerous actions confirmed +
  logged.

---

*Draft ends. This document supersedes ad-hoc notes; changes tracked via PR to `/docs`.
No application code has been written yet — implementation begins only on approval of this
plan.*
