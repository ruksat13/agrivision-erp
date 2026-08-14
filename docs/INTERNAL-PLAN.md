# 🔒 AgriVision ERP — Internal Planning

> ## ⚠️ DO NOT SUBMIT THIS FILE
>
> **This file is for the three team members only. It must not appear in the project report, the
> slide deck, the appendices, or any document shown to the supervisor or the examination board.
> Do not print it, do not export it to PDF, do not commit it to a branch that gets shared.**
>
> It contains effort estimates, task allocation and internal risk judgements. None of it belongs in
> an academic submission, and some of it — the cut-lines in §6, the honesty note in §5 — would read
> badly to an examiner.
>
> **Submit `UNIQUE-FEATURES.md` and `PROJECT-OUTLINE.md`. Never this one.**
>
> Consider adding `docs/INTERNAL-PLAN.md` to `.gitignore` if the repository will be shared or
> submitted.

**Date:** 7 August 2026 · **Team:** 3 members · **Companion to:** `UNIQUE-FEATURES.md`

This file was split out of `UNIQUE-FEATURES.md` on 7 August 2026 so that the submittable document
contains nothing that needs deleting before submission. Section references written as
"UNIQUE-FEATURES.md §n" point to that file; bare "§n" references point to this one.

---

## 1. How to read the estimates

Figures are in **person-days** and assume: the developer already knows React, is not simultaneously
writing report chapters that day, and hits no Firestore learning wall.

None of those will be reliably true. **Multiply anything on the critical path by 1.5 when deciding
whether to commit to it.** The week-by-week plan in UNIQUE-FEATURES.md §8 already has that buffer
built in; these raw numbers do not.

"Demo" is wall-clock seconds in front of the examiner, assuming the data is pre-seeded and the
sequence has been rehearsed. Add 10–15 seconds per feature if the demo starts from a cold login.

---

## 2. Foundation — must exist before any feature

Not a feature, not shown to the supervisor as a contribution, but everything below depends on it.

| Item | Effort | Owner |
|---|---|---|
| Firestore service layer (read/write helpers for 6 collections) | 3 d | **A** |
| Sales Entry screen — dealer selector, product lines, qty, price, save | 3 d | **B** |
| Rule interface — `checkSaleRules()` returning blocks + warnings | 0.5 d | **B** |
| Swap localStorage auth for Firebase Auth | 1 d | **A** |
| Seed data — 20 products, 15 dealers, 2 banned products, 5 licence problems | 1 d | **C** |

**Files**

| Action | File |
|---|---|
| new | `src/services/db.js` — Firestore CRUD helpers |
| new | `src/pages/SalesEntry.js` |
| new | `src/rules/checkSaleRules.js` |
| edit | `src/App.js` — add the route near the `/sales` route at `App.js:91` |
| edit | `src/config/menu.js` — add the entry under the `Sales` children block |
| edit | `src/context/AuthContext.js` — `login()` currently compares plaintext passwords from `av_users`; replace with Firebase Auth |
| — | `src/firebase.js` needs no change; it already exports `db` and `auth` |

**Design constraint that pays for itself.** `checkSaleRules(dealer, product, qty, date)` must return a
list, not a boolean:

```js
[{ level: 'block' | 'warn', code: 'LICENCE_EXPIRED', message: '…', overridable: true }]
```

Get this right on day one. Every feature below is then a new rule file plus one line in an array,
and three people can write rules in parallel without touching each other's code. Get it wrong — a
boolean, or the checks inlined into the screen — and Features 1, 2 and 4 each become a merge conflict.

---

## 3. Per-feature breakdown

### Feature 1 — Dealer licence enforcement

| | |
|---|---|
| **Effort** | 3 d total — fields 0.5, rule 0.5, licence register rebuild 1, dashboard panel 0.5, compliance report 1 (approx.) |
| **Demo** | ~15 s, no narration |
| **Owner** | **B** builds the rule and the register; **A** does the dashboard panel and the report query |

**Files**

- `src/pages/Customer.js` — add `licenceNo`, `licenceType`, `licenceExpiry`, `issuingAuthority` to the
  `initialCustomers` array at `Customer.js:4` and to the add form
- `src/pages/License.js` — currently the company's own licences (`License.js:5`); extend to a dealer
  register, or add a second mode alongside the existing `type` prop
- `src/rules/checkSaleRules.js` — the licence rule
- `src/pages/Dashboard.js` — the 60/30/7-day expiry panel
- new `src/pages/ComplianceReport.js`, plus a route in `src/App.js` and an entry in `src/config/menu.js`

**Watch out.** The override path is where marks are won and where the bug will be. An override that
is not written to the audit log is not a control, and an examiner may well ask to see the log
immediately after seeing the override. Build the log write in the same commit as the override button.

---

### Feature 2 — Banned / de-registered product block

| | |
|---|---|
| **Effort** | 1 d |
| **Demo** | ~10 s, no narration |
| **Owner** | **C** — see §5 |

**Files**

- `src/pages/Product.js` — add `bannedFrom`, `bannedReason` to `initialProducts` at `Product.js:4`
  and to the add form
- `src/rules/checkSaleRules.js` — second rule
- `src/pages/Purchase.js` — same check on the purchase path, so banned stock cannot be received either

**Watch out.** The date-effective behaviour is the whole point: a sale dated before `bannedFrom` must
still be valid and still print. Do not implement this by filtering the product out of the dropdown —
that hides the feature instead of demonstrating it. The product should be selectable and then
refused, visibly.

---

### Feature 3 — Bengali safety panel on the invoice

| | |
|---|---|
| **Effort** | 0.5 d code + 1 d authoring the safety data |
| **Demo** | ~10 s, no narration — the most visual of the four |
| **Owner** | **C** authors the data and the Bengali strings; **B** does the template change |

**Files**

- `src/pages/Product.js` — `whoClass`, `signalWordBn`, `phiDays`, `reentryHours`, `firstAidBn`
- `src/pages/Sales.js` — the print template inside `InvoiceModal` at `Sales.js:17`. There is already a
  styled callout (`.offer-section`, yellow) in the injected CSS; copy it, recolour by hazard class
- `src/pages/Delivery.js` — the challan print, if time allows (optional; the invoice alone demos fine)

**Watch out.** The print path opens a new window and writes a full HTML document with inline CSS.
Bengali text needs a font that survives that window — test the actual printed output early, not just
the on-screen modal. If the font fails, this is a 10-minute fix on day one and a panic on demo day.

---

### Feature 4 — Expired stock block + expiry dashboard *(conditional)*

| | |
|---|---|
| **Effort** | 3 d |
| **Demo** | ~20 s, no narration |
| **Owner** | **A**, and only after Features 1–3 are tested |

**Files**

- `src/pages/Purchase.js` — capture manufacturing and expiry date at goods receipt
- `src/pages/StockReport.js` — expiry columns and the 90-day view
- `src/rules/checkSaleRules.js` — third rule
- `src/pages/Dashboard.js` — expiry-value panel

**Watch out.** This is the only feature that touches the purchase and stock screens rather than just
sales, which is exactly why it is fourth. `Batch.js` will not help — it is a bill of materials
(UNIQUE-FEATURES.md §1) and has no lot identity to hang an expiry date on.

---

## 4. Summary table

| Feature | Effort | Demo | Narration | Primary owner |
|---|---|---|---|---|
| Foundation (screen + persistence) | 8.5 d | — | — | A + B |
| 1 — Licence enforcement | 3 d | 15 s | none | B (+ A) |
| 2 — Banned product | 1 d | 10 s | none | C |
| 3 — Safety panel | 1.5 d | 10 s | none | C + B |
| 4 — Expiry *(conditional)* | 3 d | 20 s | none | A |
| **Demo total (1–4)** | | **~55 s** | | |

Fifty-five seconds of demonstration for roughly 8.5 days of feature work, on top of 8.5 days of
foundation. That ratio is the point of the whole selection: the ideas rejected in UNIQUE-FEATURES.md
§10 cost more and demo worse.

---

## 5. Team allocation — and an honest problem with it

UNIQUE-FEATURES.md §8 assigns **A** the data layer, **B** the domain features, **C** documentation.
That split has a flaw worth naming now rather than discovering in Week 3:

**C writes no code, so C cannot cover for A or B if either falls behind — and C's own workload lands
almost entirely in Week 4, when everyone is already busy.** Meanwhile B is on the critical path for
three of four features and becomes the single point of failure.

The allocation in §2 and §3 corrects this deliberately:

- **Feature 2 is assigned to C**, not B. It is the smallest, most self-contained feature in the
  project — one field, one rule, one check on the purchase path. It is the right task for whoever is
  least confident in React, and it gets a third person into `checkSaleRules.js` early enough to
  understand it.
- **C also owns the safety data (Feature 3) and the seed data**, which are real blocking work, not
  filler. Feature 3's code is half a day; its data is longer, and if C has not authored it by the
  time B finishes the template, the feature has nothing to display.
- **C still owns the report** — but starting the legal verification (UNIQUE-FEATURES.md §7) in Week 1
  spreads that load instead of stacking it into Week 4.

**Cross-review rule:** nobody merges their own work. This is stated in UNIQUE-FEATURES.md §8 and is
worth enforcing for a practical reason beyond code quality — in the viva, any examiner may ask any
team member how any part works. A team where one person cannot explain the licence rule looks exactly
like a team where one person wrote everything.

---

## 6. Cut-lines — decide these now, not in Week 4

Agree these in advance, while nobody is panicking. Each line is a date and a decision.

| Date | If this is not true… | …then cut | Status |
|---|---|---|---|
| 13 Aug | A sale can be created and survives a browser refresh | Stop all feature work. Everyone on persistence. Nothing else matters | ✅ **MET 15 Aug** |
| 20 Aug | Feature 1 blocks a sale on screen, override logged | Drop Feature 4 permanently. Do not attempt it | ✅ **MET 15 Aug** |
| 27 Aug | Features 1–3 pass a clean run-through | Drop Feature 4. Spend Week 4 on the report and rehearsal | Feature 3 outstanding |
| **30 Aug** | — | **Hard freeze. No new feature code after this date, for any reason** | — |

**Progress note, 15 August.** The first two cut-lines are cleared, the second one
five days early.

- *13 Aug line.* Cleared on 15 August, two days late but cleared. `SalesEntry.js`
  creates an order through the service layer; it was saved as
  `AINV-2026-08-0034676`, read back from the database, and the stock movement and
  dealer balance both moved with it. Verified against the local emulator rather
  than the real project — see the access note below.
- *20 Aug line.* Cleared the same day. Feature 1 refuses a pesticide line for a
  dealer whose licence lapsed 15 days ago, an Area Manager override requires a
  written reason before the button enables, and the override lands both on
  `sales.ruleChecks` and as a `rule_override` row in `audit_log`. Feature 2 came
  with it and is deliberately **not** overridable.

**Feature 4 is dropped**, as this table always said it would be if the 20 Aug line
had slipped. It has not slipped — but the reasoning in `UNIQUE-FEATURES.md` §5
still holds independently: `Batch.js` is a bill of materials with no lot identity,
so expiry tracking is a data-model change across the whole application. The
`lotNo`, `mfgDate` and `expiryDate` fields are reserved in the schema so picking
it up later needs no migration.

**What is actually left before 30 Aug:** Feature 3 (the Bengali safety panel,
~1.5 d, and blocked on authoring the safety data — see `FIRESTORE-SCHEMA.md` §9.3),
Firebase Auth (step 5 of the migration order), and the deployment of the real
security rules (step 10).

> **Access risk, and it is the live one.** The Firebase project is on one team
> member's account and nobody else has console access, so the real database is
> still empty and the production rules have never been deployed. Everything above
> was verified against the local emulator, which `npm run dev:reset` brings up in
> one command. That is a genuine substitute for development, but **the rules and
> the seed have to be run against the real project before the demonstration**, and
> that cannot start until access is granted. Chase it now, not in Week 4.

**The rule behind the rule:** two features demonstrated flawlessly beat four demonstrated shakily.
An examiner remembers a crash far longer than a missing feature they were never told to expect.
Nothing in UNIQUE-FEATURES.md promises Feature 4 — it is written throughout as conditional, precisely
so that dropping it costs nothing.

---

## 7. Demo script — rehearse in this order

One continuous sequence, no screen changes between steps, roughly two minutes with narration.

1. Log in as a Sales Officer. *(pre-seeded, ~10 s)*
2. Start an order for a dealer whose pesticide licence expired yesterday. Add a pesticide.
   **→ blocked, reason on screen.** *(15 s)*
3. Change to a dealer with a valid licence. Add a product banned last month.
   **→ blocked, different reason.** *(10 s)*
4. Log in as an Area Manager. Override step 2 with a written reason. **→ sale proceeds.** *(15 s)*
5. Open the audit log. **→ the override, the reason, the user, the timestamp.** *(10 s)*
6. Print the invoice. **→ Bengali safety panel, colour-coded by hazard class.** *(10 s)*
7. Open the compliance report. **→ every dealer, licence status, days remaining.** *(15 s)*

Steps 4 and 5 are the strongest in the sequence and the easiest to forget under pressure — they
convert "the system says no" into "the system is a control with accountability", which is the actual
academic claim. **Rehearse the whole thing three times, timed, with one person watching the clock.**

Have a screen recording of this sequence saved before demo day. If the laptop, the network or
Firestore fails in the room, the recording is the difference between a bad ten minutes and a lost
grade.
