# NextSprout — Repository Analysis (How This Repo Is Built)

> Document 1 of the planning set. Read-only analysis of the repo as cloned from
> `https://github.com/Pramanik4/my_website.git` on 2026-09-20.
> No code has been changed. Architecture/build decisions are intentionally deferred
> to the Design Doc.

---

## 1. Executive summary

NextSprout is a **customer-facing e-learning storefront** (an education brand selling
e-books and tutoring programs, priced in ₹ INR). It is built as a **100% static,
client-side website**: nine hand-written HTML pages plus one shared vanilla-JavaScript
file. There is **no backend, no database, no framework, no build tooling, and no
authentication**. "Checkout" collects a customer's contact details in the browser and
stops with an alert saying the payment gateway will be added later.

In one line: **it is a good-looking brochure + cart mock-up, not yet a working shop.**

---

## 2. Technology stack

| Layer | What's actually used |
|---|---|
| Markup | Hand-written HTML5, one file per page (9 pages) |
| Styling | Inline `<style>` block in **every** page (no shared stylesheet) + CSS custom properties (design tokens) |
| Fonts | Google Fonts "Poppins" via `<link>` (only external dependency) |
| Scripting | One shared **vanilla JS** file, `cart.js` — no framework, no libraries |
| State | Browser `localStorage` (cart) + `sessionStorage` (captured customer/order) |
| Backend | **None** |
| Database | **None** |
| Build / bundler | **None** (files are served/opened as-is) |
| Package manager | **None** (`no package.json`, no lockfile) |
| Tests / CI | **None** |

The entire app is client-side. Everything the code does happens inside the visitor's
own browser.

---

## 3. File-by-file map

| File | Lines | Role |
|---|---:|---|
| `index.html` | 2,484 | Homepage / brand landing page |
| `ebooks.html` | 2,171 | E-books hub (links to kid/adult e-book pages) |
| `kid-ebooks.html` | 1,989 | Kids e-books product page |
| `adult-ebooks.html` | 2,425 | Adult e-books product page |
| `english-speaking.html` | 2,094 | English-speaking programs (subscription) |
| `reading.html` | 2,520 | Reading programs (subscription) |
| `learning.html` | 2,822 | Maths / learning programs (subscription) |
| `computer.html` | 882 | Computer-skills programs |
| `homework-support.html` | 2,176 | Homework support services |
| `cart.js` | 1,522 | Shared cart + checkout logic used by all pages |
| `README.md` | 0 | Empty (just the title) |

Total ≈ 21,000 lines. The large per-page line counts are mostly **duplicated inline
CSS** (see §7).

---

## 4. How a page is structured

Every page follows the same hand-built template:

1. `<head>` — charset, viewport, `<title>`, Google Fonts preconnect + link, and a
   single large `<style>` block containing that page's entire CSS.
2. `<header>` — sticky nav bar with the logo and menu links, plus a cart button
   showing a live item count.
3. `<section>` blocks — hero, product/program cards, "why us" value sections, and a
   call-to-action section.
4. A **cart drawer** (`#cartDrawer` + `#cartOverlay`) that slides in from the side.
5. `<script src="cart.js"></script>` at the very bottom — the only script.

Product "Add to cart" buttons use inline handlers, e.g.
`onclick="addToCart('program-english-kids')"`. The product id passed here must match a
key in the `NEXTSPROUT_PRODUCTS` catalog inside `cart.js`.

---

## 5. The catalog and business model

Products are hardcoded as a JavaScript object in `cart.js` (`NEXTSPROUT_PRODUCTS`,
~line 39). There are **16 products** across two billing models:

- **`one-time`** — e-books and some one-off services (₹29–₹999). Paid once.
- **`monthly`** — tutoring programs (₹99–₹249/month). **Recurring subscriptions.**

This mixed model is important: the site already promises **subscriptions**, which means
any real implementation needs recurring billing + a way to track who is currently
active, not just one-off payments.

Each product record looks like:

```js
"program-english-kids": {
    id: "program-english-kids",
    name: "Everyday English For Kids",
    price: 99,
    type: "program",
    billing: "monthly"
}
```

### Catalog integrity issues found
- **3 products are defined but have no "buy" button anywhere** on the site:
  `ebook-reading-7day`, `ebook-learning-activities`, `ebook-speak-confidence`.
  They exist in the catalog but cannot be purchased (dead entries).
- Prices, names, and billing terms all live in **client-side code**, meaning the
  browser is the source of truth for money — see §8.

---

## 6. How the cart & "checkout" actually work

All logic is in `cart.js`. There is no server call anywhere in the flow.

1. **Add to cart** (`addToCart`) — looks up the product in the hardcoded catalog and
   pushes it into an array. Duplicates of the same product are silently ignored (no
   quantity concept). Saved to `localStorage` under key `nextsprout_cart`.
2. **Render** (`renderCart`) — draws the drawer, computes two subtotals: a **"Pay
   today"** total (one-time items) and a **"Monthly"** total (subscription items).
   Item names are HTML-escaped via an `escapeHtml()` helper (a good practice).
3. **Cross-tab sync** — a `storage` event listener keeps the cart count in sync if the
   user has multiple tabs open.
4. **Checkout** (`proceedToCheckout`) — builds a modal on the fly, shows the order
   summary, and collects **Full Name, WhatsApp/Mobile (10-digit), Email**, plus a
   marketing-consent checkbox.
5. **On submit** — validates the fields in the browser, saves the customer + order
   object to `sessionStorage`, `console.log`s it, and shows:
   *"Payment gateway will be connected in the next step."* — then closes.

**Nothing is ever sent anywhere. No payment occurs. No record is kept beyond the
current browser tab.** This is the crux of what the project needs next.

---

## 7. Code-quality observations

**Strengths**
- Coherent, professional visual design with a proper design-token system (CSS
  variables for colors/spacing).
- `cart.js` is well-commented and reasonably organized.
- Output encoding via `escapeHtml()` when rendering cart item names.
- No committed secrets, no `eval`, no `document.write`, no unsafe external scripts.

**Weaknesses**
- **Massive CSS duplication:** each page carries its own full copy of the site's CSS
  inside a `<style>` block. A single style change must be repeated across 9 files —
  this guarantees visual drift over time. There is no shared `.css` file.
- **Inconsistent DOM contracts:** some pages use the newer `data-cart-count` hook,
  others the legacy `id="cartCount"`; several use both. `cart.js` supports both for
  backward compatibility, which is a smell indicating the pages were built at
  different times without a shared component.
- **Broken / incomplete navigation:** most pages only link to `computer.html` (and
  sometimes `ebooks.html`). The homepage links to just `ebooks.html` and
  `computer.html`. Pages like `english-speaking.html`, `reading.html`,
  `learning.html`, and `homework-support.html` are effectively **unreachable** from the
  main navigation.
- **README is empty**; there is no contributor or setup documentation.

---

## 8. Why "add a payment gateway" is really "add a backend"

The current design cannot support payments, subscriptions, or "who paid" — and a
payment gateway *alone* will not fix it. Reasons:

1. **No server to receive money-related truth.** A gateway confirms a payment by
   calling back to *your server* (a webhook). A static site has no server to receive
   that callback, so you can never reliably know a payment succeeded.
2. **No database to answer "who paid / who is subscribed."** There is nowhere to store
   customers, orders, or subscription status (active / cancelled / payment-failed).
3. **Client-controlled pricing.** Totals are computed in the browser from hardcoded
   prices. Without server-side verification, a user can change the amount before
   paying. The server must recompute and verify every amount.
4. **Subscriptions need lifecycle handling.** Monthly programs require recurring
   billing, renewal webhooks, dunning (failed-payment retries), and cancellation — all
   inherently server-side.

**Therefore the next phase must introduce a small backend + database + admin view.**
The specific stack (which language/host, which gateway) is deliberately left to the
Design Doc after the payment-gateway comparison is reviewed.

---

## 9. What exists vs. what's needed (gap snapshot)

| Capability | Today | Needed for a real shop |
|---|---|---|
| Browse products | ✅ | ✅ |
| Cart | ✅ (localStorage) | ✅ (keep) |
| Collect customer details | ✅ (browser only) | Server-side, stored |
| Take a payment | ❌ | Payment gateway + server order verification |
| Subscriptions (monthly) | ❌ | Recurring billing + webhooks |
| Know who paid / subscribed | ❌ | Database + admin dashboard |
| Order confirmation / receipt | ❌ (just an alert) | Confirmation page + email |
| Accounts / login | ❌ | Optional (needed for "my subscription") |
| Security controls (headers, etc.) | ❌ | CSP/HSTS + full SSDLC |
| Tests / CI / SCA / SAST | ❌ | Full SSDLC pipeline |
| Legal (privacy, refund, terms) | ❌ | Required before taking money |

---

## 10. Git / repository state

- Only **2 commits**: `bc3eb69 Initial commit` and `84e771d Add files via upload`.
- No branches, tags, PRs, or review history.
- No `.gitignore`, no CI config, no issue templates.
- Empty `README.md`.

This means there is currently **no SSDLC scaffolding of any kind** — that is a
green-field opportunity to set it up correctly from the start.

---

## 11. What comes next (not decided here)

The following are **open decisions** to be resolved in later planning documents, once
you have reviewed the payment-gateway comparison:

1. **Payment provider** (fees comparison provided separately).
2. **Backend stack & hosting** (e.g., .NET+PostgreSQL vs Node vs serverless).
3. **Frontend approach** (harden the static site vs rebuild as a framework SPA).
4. **Security engagement** — locked to *Full*: threat model → SSDLC controls in CI →
   real DAST/pentest gate before go-live.

*Document ends. No repository files were modified in producing this analysis.*
