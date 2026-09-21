# NextSprout — Payment Gateway Live Pricing (Merchant Cost Analysis)

> Document 2 of the planning set. Pricing captured **live on 2026-09-20** from each
> provider's official site. **We (NextSprout) are the MERCHANT — these fees are our
> cost.** The customer pays the sticker price; the gateway deducts its cut + 18% GST on
> that cut and settles the rest to our bank. Rates are promotional/standard published
> figures and are **not a negotiated quote**; confirm on signup.

---

## 1. Merchant vs customer — who pays

- **Customer pays:** the product price (e.g. ₹99). They do not see or pay the gateway fee.
- **Merchant (us) pays:** the Merchant Discount Rate (MDR) — a % of each transaction —
  **plus 18% GST on that fee**. Example: ₹99 subscription on a 2% card → ~₹1.98 fee +
  ₹0.36 GST ≈ **₹2.34 cost**, we net ≈ ₹96.66.
- **UPI / RuPay debit = 0% MDR** (Govt.-mandated). A ₹99 subscription collected over UPI
  nets us ≈ the full ₹99. **This is the single biggest lever on our margin**, because our
  price points are low (₹29–₹999).

Implication for a low-ticket ₹ business: **steer customers to UPI/UPI-AutoPay** and treat
card MDR as the exception, not the norm.

---

## 2. Live pricing captured 2026-09-20

### Razorpay — https://razorpay.com
- **Standard: 2%** per transaction (domestic).
- Promo: **0% platform fee for first 90 days** for new signups.
- No setup fee, no monthly fee (standard plan). "Start for Free."
- Custom pricing for volume > ₹5L/month.
- (Per-method detail page redirected at capture time; 2% standard confirmed on site.
  Historically UPI is at/near 0% and Subscriptions API is first-class — **verify at signup**.)

### Stripe (India) — https://stripe.com/in/pricing
- **2%** for Visa/Mastercard **cards issued in India**.
- **Domestic debit cards: 0.4% MDR, capped at ₹200.**
- **3%** for cards issued outside India; **+2%** if currency conversion needed.
- **3.5%** Amex international; **4.3%** for USD/other-currency presentment (+2% FX).
- **No setup fees, no monthly fees, no hidden fees.** 24×7 support, 100+ payment methods.
- Note: strongest for **international**; Indian **domestic recurring** is subject to RBI
  e-mandate rules — validate subscription fit for INR monthly plans.

### Cashfree — https://www.cashfree.com/payment-gateway-charges/
- **Promo: 1.95%** per transaction (festive offer, advertised "0% / 1.95%" for new
  merchants, sales up to ₹20L, running till 31-Mar-2027).
- "Sign Up for Free" — no setup fee.
- Next-day settlement; same-day/paperless onboarding.
- Payouts (refunds/disbursements) priced as flat per-txn (e.g. IMPS/UPI ₹6–₹15 by slab).
- All prices exclusive of bank charges + GST.

### Others (typical published ranges — not re-verified live 2026-09-20)
| Provider | Domestic MDR | International | Subscriptions | Best for |
|---|---|---|---|---|
| PayU | ~2% | ~3% | ✅ | Established India gateway |
| PayPal | ~3–4% + fixed | ~4%+ | ✅ | International only (expensive for INR) |
| Instamojo | ~2–5% by plan | — | Limited | Micro-sellers, simplest onboarding |
| Direct UPI / UPI-only | ~0% (zero-MDR) | ✗ | UPI AutoPay | Lowest cost, UPI-only, still needs backend |

---

## 3. Effective cost on OUR price points

Assuming card MDR ~2% + 18% GST on fee (≈ 2.36% all-in) vs UPI (~0%):

| Product | Price | Cost via card (~2.36%) | Net via card | Cost via UPI | Net via UPI |
|---|---:|---:|---:|---:|---:|
| Everyday English @ work (ebook) | ₹29 | ₹0.68 | ₹28.32 | ₹0 | ₹29 |
| English program (monthly) | ₹99 | ₹2.34 | ₹96.66 | ₹0 | ₹99 |
| Confident Reading (monthly) | ₹249 | ₹5.88 | ₹243.12 | ₹0 | ₹249 |
| Kids Computer Basics (one-time) | ₹999 | ₹23.58 | ₹975.42 | ₹0 | ₹999 |

Takeaway: on ₹29–₹99 items, **card fees eat 2.4% of every sale; UPI eats ~0%.** Design the
checkout to make **UPI the default**, with cards as a fallback.

---

## 4. "Free" vs "paid" — the honest framing

- **No real gateway is free per-transaction** for cards. "Free" = no setup/monthly fee
  (true for Razorpay, Stripe, Cashfree standard plans).
- **The only ~0% rail is UPI / RuPay debit** (regulated zero-MDR).
- "Paid/enterprise" plans add features (dedicated manager, discounts, early features) and
  are only worth it at higher volume.

---

## 5. Recommendation (decision deferred to Design Doc)

For a ₹-priced, India-based, **subscription** storefront with low ticket sizes:

1. **Razorpay** — best default: zero setup/monthly, near-zero UPI, first-class
   Subscriptions API + UPI AutoPay for the monthly programs. **Primary candidate.**
2. **Cashfree** — value alternative; slightly lower card MDR (1.95% promo).
3. **Stripe** — only if meaningful **international** sales are expected; watch RBI
   domestic-recurring constraints for INR monthly plans.

**Non-negotiable regardless of choice:** a backend that creates the order server-side,
verifies the paid amount + gateway signature, and handles subscription webhooks
(renewal / failure / cancellation). The gateway choice affects fees and subscription
ergonomics only — it does not remove the backend requirement.

---

## 6. Bank gateways & "free" options (Federal / ICICI / SBI / BillDesk) — added 2026-09-21

**Question raised:** are bank payment gateways (Federal, ICICI, SBI) or BillDesk *free* for
a small merchant? **Short answer: no — and they're usually a worse deal than a self-serve PSP.**

| Provider | Reality for a small merchant |
|---|---|
| **ICICI / SBI ePay / HDFC / Axis / Federal** (bank gateways) | Usually require a **business current account**; often charge **setup fees and/or annual maintenance (AMC)**; **older, less developer-friendly** APIs + slower onboarding; MDR **similar or higher** than PSPs. Worth it only at scale or with a specific bank deal. |
| **BillDesk** | Aggregator/enterprise-oriented; **heavy onboarding**, not self-serve for small sellers. Not free. |
| **PSPs** (Razorpay/Cashfree/PayU/PhonePe/Paytm/Instamojo) | **₹0 setup, ₹0 monthly**, self-serve onboarding, developer-friendly. Only per-transaction fee — and **UPI ≈ 0% MDR**. |

**Conclusion:** there is still **no free card gateway**. The genuinely near-free path is
unchanged — **UPI-first via a self-serve PSP** (Razorpay recommended). Bank gateways/BillDesk
add cost + friction for a small-scale merchant, so they are **not recommended** for launch.

**On "free": to run at ~₹0 fees, design UPI-first** (UPI/RuPay = regulated zero-MDR) and
treat cards as the paid fallback. That, not the provider brand, is what makes it "free".

---

## 7. What you need to SET UP a payment gateway (merchant onboarding checklist)

Whatever provider you choose, activation (moving from test to live) requires:

**A. Business & KYC documents**
- Business entity proof (sole proprietor / partnership / Pvt Ltd — sole prop can onboard
  most PSPs).
- **PAN** (business and/or owner).
- **Bank account** for settlement + a **cancelled cheque** / bank statement.
- Identity + address proof of owner/authorised signatory.
- **GSTIN** if registered (may be optional for small sellers — confirm per provider).

**B. Website requirements PSPs verify before activating you** (these are **release blockers**)
- Live site on **HTTPS**, reachable domain.
- **Privacy Policy**, **Terms & Conditions**, **Refund / Cancellation Policy**, **Contact Us**.
- Products + **pricing clearly listed**; business name matches the registered entity.
- (For subscriptions) clear billing terms + how to cancel.

**C. Technical setup**
- **Test/sandbox** account → **API key id + key secret** + **webhook secret**.
- A **server endpoint** to (1) create orders, (2) verify payment signature, (3) receive
  **webhooks** (must be always-reachable — see design doc §2.1 hosting note).
- **Signature verification** on callback + webhook; **idempotency** on webhook handling.
- Go-live: switch to **live keys**, store them in the secrets manager (design doc §14.4).

**D. Compliance / cost to remember**
- Use **hosted checkout** → card data never touches your server → stay at **PCI SAQ-A**.
- **18% GST** applies on the gateway fee (merchant cost).
- Know your **settlement cycle** (e.g. T+1/T+2) for cash-flow planning.
- Publish DPDP-aligned PII handling (design doc §7).

---

*Rates verified live 2026-09-20; bank-gateway + setup sections added 2026-09-21.
Re-verify all rates and onboarding requirements at implementation time.*
