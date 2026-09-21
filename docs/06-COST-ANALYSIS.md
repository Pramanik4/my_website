# NextSprout — Infrastructure & Cost Analysis

> Document 6 of the planning set. 3–4 candidate architectures for the Node + PostgreSQL +
> Razorpay storefront (independent hosting, not Azure), with estimated **fixed monthly
> infra cost** and **variable per-sale cost**. Figures are **published/list estimates as
> of 2026 and must be re-verified at signup** — they are for comparison, not a quote.
> FX assumption: **₹85 ≈ US$1** (approximate; verify).
> Date: 2026-09-21.

---

## 1. How to read this: fixed vs variable cost

Two very different cost buckets:

- **Fixed infra** — hosting, DB, auth, monitoring. Roughly constant per month regardless of
  sales. This is what the 4 architectures below differ on.
- **Variable per-sale** — payment gateway fees + shipping freight + transactional email.
  These scale with orders and are **largely the same across all architectures** (§2), so
  they're factored out and shown once.

**Excluded** (out of infra scope): product/content creation, the physical books' printing
cost, marketing/ads, and staff time. One-time **domain** (~₹1,000/yr for `.in`, ~$12/yr
`.com`) and **TLS** (free via host/Cloudflare) apply to all.

---

## 2. Variable per-sale costs (common to ALL architectures)

### 2.1 Payment gateway (Razorpay, UPI-first) — merchant fee
- **UPI / RuPay debit: ~0% MDR** (regulated zero-fee).
- **Cards/netbanking: ~2% + 18% GST on the fee ≈ 2.36% all-in.**
- No setup/monthly fee.

| Monthly orders | Avg ₹150, 70% UPI / 30% card | Avg ₹150, 100% card |
|---|---:|---:|
| 100 | ≈ ₹106/mo fee | ≈ ₹354/mo |
| 500 | ≈ ₹531/mo | ≈ ₹1,770/mo |
| 1,000 | ≈ ₹1,062/mo | ≈ ₹3,540/mo |

*Takeaway: UPI-first keeps fees near zero; card-heavy triples them. Design decision, not infra.*

### 2.2 Shipping (physical hardcopy) — via aggregator
- Aggregators (Shiprocket/Delhivery) typically **no/low monthly on entry plans**; you pay
  **per-shipment freight** (India Post/courier), ~₹30–₹90 per parcel by weight/zone.
- This is normally **recovered from the customer** (free-over-₹X, else charged), so it's
  broadly cost-neutral to margin — but cash-flows through you.
- COD (later) adds a small COD fee + remittance cycle.

### 2.3 Transactional email (receipts, tracking, password reset)
- Free tiers cover early volume: **Resend** (~3k/mo free), **Brevo** (~300/day free),
  **AWS SES** (~$0.10/1,000). Assume **₹0** until volume grows, then ~₹500–₹1,700/mo.

---

## 3. Architecture A — Near-zero / free-tier ("bootstrap")

**Stack:** SPA on **Cloudflare Pages** (free, commercial-OK) · API on **Cloudflare Workers**
(free 100k req/day, always-on) · **Neon** Postgres free · **Supabase Auth** free (or Lucia)
· secrets in **Infisical** free · monitoring **Sentry/Better Stack** free · Resend free.

| Item | Est. monthly |
|---|---:|
| Cloudflare Pages (SPA) | ₹0 |
| Cloudflare Workers (API) | ₹0 (free tier) |
| Neon Postgres (free) | ₹0 |
| Auth (Supabase free / Lucia) | ₹0 |
| Secrets (Infisical free) | ₹0 |
| Monitoring (free tiers) | ₹0 |
| **Fixed infra total** | **≈ ₹0/mo** |

- ✅ Cheapest; always-on API (Workers, unlike sleeping dynos) → webhooks reliable.
- ⚠️ **Workers ≠ full Node** (Web-standard runtime) — some libraries need adapting; NestJS
  needs a Workers-compatible setup or use **Hono** on Workers.
- ⚠️ Free DB limits (storage/compute autosuspend); no strong backup/DR guarantees → **must**
  add your own backup routine (risk O2).
- **Best for:** launch/MVP on a shoestring; migrate up if it grows.

---

## 4. Architecture B — Lean always-on VPS ("recommended small")

**Stack:** SPA on **Cloudflare Pages** (free) · API (NestJS, full Node) on a **small VPS**
(Hetzner CX22 / DigitalOcean / Lightsail) · **Neon** Postgres (free→Launch) · **Cloudflare**
proxy/WAF free · Supabase Auth or Lucia · Infisical free · Sentry free.

| Item | Est. monthly |
|---|---:|
| Cloudflare Pages (SPA) | ₹0 |
| VPS (Hetzner CX22 ~€4.5 / DO $6) | ≈ ₹450–₹550 |
| Neon Postgres (free, or Launch ~$19 later) | ₹0 (→ ₹1,600) |
| Cloudflare proxy/WAF | ₹0 |
| Auth / Secrets / Monitoring (free tiers) | ₹0 |
| Backups (VPS snapshot ~20%) | ≈ ₹100 |
| **Fixed infra total** | **≈ ₹550–₹650/mo** (→ ~₹2,200 with paid DB) |

- ✅ **Full Node/NestJS** (no runtime constraints), always-on, real control, cheap.
- ✅ Webhooks reliable; you own backups (snapshots).
- ⚠️ **You patch/manage the VPS** (OS updates, hardening) — a bit of ops.
- **Best for:** a real launch you want control over at low cost. **My default recommendation.**

---

## 5. Architecture C — Managed PaaS, low-ops ("hands-off")

**Stack:** SPA on **Netlify** (free/Pro) · API on **Render Starter** or **Railway** ·
**Supabase Pro** (Postgres + **Auth** + storage, managed backups) · Sentry · Resend.

| Item | Est. monthly |
|---|---:|
| Netlify (free, commercial-OK) | ₹0 (Pro ~₹1,600 if needed) |
| Render Starter web service (~$7) | ≈ ₹600 |
| Supabase Pro (~$25) — DB+Auth+backups | ≈ ₹2,100 |
| Monitoring/email (free→paid) | ₹0–₹500 |
| **Fixed infra total** | **≈ ₹2,700–₹4,800/mo** |

- ✅ Least ops: managed DB + **managed Auth** (less to build/secure) + automatic backups.
- ✅ Always-on (paid tier), webhooks reliable.
- ⚠️ Costs more; some vendor lock-in (Supabase Auth).
- **Best for:** you want to minimize what you operate and build, and accept ~₹3–5k/mo.

---

## 6. Architecture D — AWS ("scalable / future-proof")

**Stack:** SPA on **S3 + CloudFront** · API on **Lightsail** ($5–10) or **ECS Fargate** ·
**RDS PostgreSQL** (db.t4g.micro) · **Secrets Manager** · **SES** email · CloudWatch.

| Item | Est. monthly (post free-tier) |
|---|---:|
| S3 + CloudFront (SPA) | ≈ ₹150–₹400 |
| Compute (Lightsail $10 / Fargate more) | ≈ ₹850 (Lightsail) → ₹2,500+ (Fargate) |
| RDS Postgres (t4g.micro ~$15–25) | ≈ ₹1,300–₹2,100 |
| Secrets Manager (~$0.40/secret) | ≈ ₹150 |
| SES / CloudWatch | ≈ ₹100–₹400 |
| **Fixed infra total** | **≈ ₹2,500–₹5,500/mo** (Lightsail) · more with Fargate |

- ✅ Scales cleanly; **12-month free tier** softens year 1; enterprise-grade options.
- ⚠️ **Most ops/complexity**; free tier expires after 12 months → cost jumps; easy to
  overspend if misconfigured.
- **Best for:** if you expect real scale or want the AWS ecosystem long-term.

---

## 7. Side-by-side comparison

| | **A. Free-tier** | **B. VPS (rec.)** | **C. Managed PaaS** | **D. AWS** |
|---|---|---|---|---|
| Fixed infra /mo | **≈ ₹0** | ≈ ₹550–650 | ≈ ₹2,700–4,800 | ≈ ₹2,500–5,500 |
| Annual (fixed) | ≈ ₹0–1k | ≈ ₹7k–27k | ≈ ₹32k–58k | ≈ ₹30k–66k |
| Ops burden | Low | **Medium** | **Lowest** | Highest |
| Full Node/NestJS | ⚠️ (Workers) | ✅ | ✅ | ✅ |
| Webhook reliability | ✅ (Workers) | ✅ | ✅ | ✅ |
| Backups/DR | ⚠️ DIY | ✅ snapshots | ✅ managed | ✅ managed |
| Scales to high volume | ⚠️ limited | ✅ (resize) | ✅ | ✅✅ |
| Vendor lock-in | Low | Low | Medium | Medium-High |
| Best for | MVP/bootstrap | **Real launch, low cost** | Hands-off | Scale/ecosystem |

**All-in monthly at launch (fixed infra + ~200 orders, UPI-first, email free):**
- A ≈ **₹200** · B ≈ **₹750** · C ≈ **₹2,900** · D ≈ **₹2,700–5,700**
  (the ~₹200 variable = payment fees; shipping freight recovered from customers).

---

## 8. Optional add-ons (any architecture)

| Add-on | Est. monthly | Note |
|---|---:|---|
| Managed auth — Clerk | ₹0 up to ~10k MAU, then ~₹2,100+ | If not using Supabase Auth |
| Managed auth — Auth0 | Free small tier, then paid | Verify current MAU limits |
| Paid DB (Neon Launch / Supabase Pro) | ≈ ₹1,600–2,100 | When free tier outgrown |
| Error/APM (Sentry paid) | ≈ ₹2,200+ | Free tier fine early |
| Email at volume (Resend/SES paid) | ≈ ₹500–1,700 | After free tier |
| Shiprocket paid plan | plan-dependent | Entry plans often ₹0 monthly + per-shipment |

---

## 9. Recommendation

- **Launch on Architecture B (VPS + Cloudflare Pages + Neon)** — ~₹550–650/mo fixed, full
  Node/NestJS, always-on webhooks, you own backups; the best balance of cost, control, and
  reliability for a real paid shop.
- **If you want zero ops and zero build-your-own-auth:** Architecture C (Supabase Pro) at
  ~₹3–5k/mo.
- **Only go AWS (D)** if you expect real scale or want that ecosystem; skip for now.
- **Architecture A** is fine to *start* MVP/testing at ~₹0, but plan to move to B before
  serious traffic (Workers runtime + DIY backups are the trade-offs).

*All figures are 2026 list estimates in approx INR (₹85/US$1) and must be re-verified at
signup. Variable costs (payment/shipping/email) scale with sales and are common to all
architectures.*
