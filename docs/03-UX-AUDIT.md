# NextSprout — UX / Accessibility / SEO / Conversion Audit

> Document 3 of the planning set. Read-only, evidence-based audit of all 9 pages +
> `cart.js`, with `file:line` references. No files were modified.
> Correction to earlier notes: **6 of 9 pages lack a meta description, not 8** —
> `index.html`, `reading.html`, and `learning.html` have one. Missing on: `ebooks`,
> `kid-ebooks`, `adult-ebooks`, `english-speaking`, `computer`, `homework-support`.

Severity legend: 🔴 High · 🟠 Med · 🟡 Low · ✅ OK

---

## 1. Accessibility (WCAG 2.2 AA)

| ID | Sev | Finding | Evidence | Fix |
|---|---|---|---|---|
| A1 | 🔴 | **Program cards use `onclick` on non-interactive `<article>`** — not focusable, no keyboard activation, no role. Keyboard/SR users can't reach reading/english-speaking/learning/homework at all (also absent from nav). | `index.html:1877-1879` (all cards) | Make each card a real `<a href>`; avoid `role=link tabindex=0` unless necessary |
| A2 | 🔴 | **Checkout labels not associated with inputs** — bare `<label>` siblings, no `for`, don't wrap input. SR announces fields as unlabeled. | `cart.js:1103-1129` etc. | Add `for`/`id` pairs or wrap inputs |
| A3 | 🔴 | **No dialog semantics / focus trap** on cart drawer or checkout modal; focus never moved in/restored; **Esc doesn't close checkout** (global handler only closes drawer); `×` close has no `aria-label`. | `cart.js:769-803`, `984-1267`, `1043-1058`, `1468-1482` | `role=dialog` + `aria-modal`, focus trap, move/restore focus, wire Esc |
| A4 | 🟠 | **Cart count not announced** — no `aria-live`; duplicate add gives no confirmation. | `cart.js:385-437` | `aria-live=polite` / status region |
| A5 | 🔴 | **Validation via blocking `alert()`** — no inline errors, no `aria-invalid`/`aria-describedby`. | `cart.js:1329/1338/1349` | Inline errors tied via `aria-describedby`, focus first invalid |
| A6 | 🟠 | **Decorative SVGs/emoji not hidden from AT** (`💻`, `🛒 Cart`). No `<img>` anywhere so no alt debt. | `computer.html:594`, `computer.html:579`, `english-speaking.html:1418` | `aria-hidden=true` on decorative graphics |
| A7 | 🟠 | **No skip-to-content link** on any page. | all pages | Add skip link |
| A8 | 🟠 | **`<main>` landmark missing on 8 of 9 pages** (only index has it). | `index.html:1459`; others none | Wrap content in `<main>` |
| A9 | 🟡 | Focus-visible styling inconsistent; `reading`/`learning` use low-contrast yellow ring on cream. | `index.html:1358`, `reading.html:1738`, `learning.html:1514` | One consistent, high-contrast focus ring |
| A10 | 🟡 | No `prefers-reduced-motion` support (smooth scroll + transforms). | all pages | Add reduced-motion guard |
| A11 | 🟡 | Heading hierarchy flattened (product titles as `<h2>` alongside section `<h2>`); cart header varies h2/h3. | `kid-ebooks.html:1552`, `adult-ebooks.html:1842`, `english-speaking.html:2036` | Normalize heading levels |

## 2. Responsive / Mobile

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| R1 | 🔴 | **Nav vanishes on mobile with no hamburger** — `nav{display:none}` at ≤900/820px, `.nav-btn{display:none}` at ≤600/540px. Below breakpoint only logo + cart remain; mobile users can't reach any section/sub-page. **Biggest mobile defect.** | `index.html:1067`, `reading.html:1591` |
| R2 | ✅ | Viewport meta present on all pages. | — |
| R3 | 🟠 | Phone field hard-locked India-only (10 digits, no country code). Acceptable if India-only, else blocks legit customers. | `cart.js:1150-1151`, `1336` |
| R4 | 🟡 | Cart "Remove" is ~12px text with `padding:0` — under 44px touch target. | `cart.js:597-603` |
| R5 | ✅ | No overflowing fixed-width layouts; grids collapse to 1 col. | `computer.html:151` (reduced at ≤540px) |

## 3. SEO / Metadata

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| S1 | 🔴 | Meta description missing on 6 revenue pages. | ebooks, kid-ebooks, adult-ebooks, english-speaking, computer, homework-support |
| S2 | 🔴 | No Open Graph / Twitter Card tags anywhere — WhatsApp/social shares render blank. | all pages |
| S3 | 🟠 | No canonical, favicon, sitemap.xml, or robots.txt. | all pages |
| S4 | 🔴 | No Product/Offer JSON-LD structured data — a paid catalog with prices/billing is ideal for it; missed rich results. | all product pages |
| S5 | ✅ | Titles reasonable ("NextSprout — Learn. Grow. Become."). | `index.html:8` |
| S6 | 🟡 | `computer.html` off-system: no Poppins, uses Arial, different palette, no meta desc. | `computer.html:29` |

## 4. Conversion / Trust (paid, customer-facing shop)

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| CV1 | 🔴 | **Checkout dead-ends in placeholder `alert()`** shown to real customers ("Payment gateway will be connected…"). No payment, order, receipt, or confirmation; order only in `sessionStorage`. | `cart.js:1418-1430`, `1400` |
| CV2 | 🔴 | Zero trust signals — no testimonials, ratings, student counts, guarantees. | all pages |
| CV3 | 🔴 | No refund/terms/privacy/contact links; marketing-consent collected with no privacy policy to link — compliance gap for PII + payment. | `index.html:2456-2474`, `cart.js:1220-1223` |
| CV4 | 🟠 | No quantity control; duplicate add silently ignored. | `cart.js:289-297` |
| CV5 | 🟠 | Inconsistent CTA copy — "Buy E-book"/"Add to Cart"/"Buy This Program"/"Buy Now"/"Start Level 1"; checkout button splits "Proceed to Checkout" vs "Proceed to Payment". | `kid-ebooks:1602`, `learning:2335`, `ebooks:2138`, `index:2447` |
| CV6 | 🟡 | WhatsApp field requested but no click-to-chat offered anywhere (only `mailto:`). | checkout form |
| CV7 | ✅ | Monthly vs one-time split ("Pay today" / "Monthly ₹x/month") is a strength; label recurring items on cards + state first-charge date. | `cart.js:705-744` |

## 5. Consistency / Maintainability (UX impact)

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| M1 | 🔴 | **CSS fully duplicated inline across 9 files and already drifting** — cart overlay fades (opacity/visibility) on some pages, snaps (display none/block) on others. Same "shared" component behaves differently. | `index.html:1208-1217` vs `ebooks.html:978-998` |
| M2 | 🔴 | **3 catalog products have no buy button (dead inventory)** — unsellable. | `cart.js:45` (₹129), `:53` (₹149), `:61` (₹199) |
| M3 | 🔴 | **Broken internal nav map** — several pages link "E-books" to `index.html#ebooks`, but index has **no `id=ebooks`** (lands at top); others link to `ebooks.html`. reading/english/learning/homework never in any nav; reachable only via mouse-only card `onclick`. | `kid-ebooks:1330`, `adult-ebooks:1474`, vs `index.html:1418` |
| M4 | 🟡 | Cart-count hooks inconsistent (`data-cart-count` vs `id=cartCount`, some both). Works (cart.js supports both) but convention unsettled. | `index.html:1443-1444`, `computer.html:580` |

## 6. Content / Copy

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| CO1 | 🔴 | Placeholder microcopy exposed to customers; "This is only for testing." comment confirms it. | `cart.js:1429`, `1396` |
| CO2 | 🟠 | Thin reassurance line, no privacy link. | `cart.js:1255` |
| CO3 | 🟠 | `computer.html` off-brand (Arial, green palette, emoji hero). | `computer.html:29` |
| CO4 | ✅ | Locale consistent (₹/INR); hero value props clear and benefit-led. | — |

---

## Top 10 UX fixes (prioritized)

1. **Wire up (or honestly gate) checkout** — replace the `alert()` with a real payment step or "pay via link / callback" flow + order confirmation + receipt. *(trust + conversion killer)* — `cart.js:1418-1430`
2. **Add a mobile hamburger nav** on all pages — restore navigation below 900px. *(mobile users currently can't navigate)*
3. **Make program cards real `<a>` links** — fixes keyboard access AND unreachable sub-pages. `index.html:1877-2172`
4. **Fix the internal nav map** — one canonical E-books target, remove dead `#ebooks` anchor, surface reading/english/learning/homework in nav.
5. **Associate checkout labels + accessible inline errors** (replace `alert()`), add `autocomplete`. `cart.js:1103-1194`, `1327-1353`
6. **Dialog semantics + focus trap + Esc** for cart drawer and checkout modal; move/restore focus. `cart.js:769-841`, `984-1267`
7. **Add trust + policy content** — testimonials/ratings + footer Refund/Terms/Privacy links (required before collecting PII + consent).
8. **SEO pass** — meta descriptions on the 6 missing pages + Open Graph/Twitter + favicon + canonical + Product/Offer JSON-LD.
9. **Externalize CSS into one shared stylesheet** + standardize the cart component (overlay animation, count hook, checkout wording, buy verb). M1/M4/CV5
10. **Resolve the 3 orphaned products** + add duplicate-add feedback + `aria-live` on cart count. `cart.js:45-67`, `289-297`

**Quick wins:** `aria-hidden` on decorative SVGs/emoji, skip-to-content link, `<main>` on the 8 pages missing it, `prefers-reduced-motion` guard, consistent focus-visible styling.

*Document ends. No repository files were modified.*
