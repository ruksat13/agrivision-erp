# Handover — where this project stands

**Updated 20 August 2026.** State only. The conventions are in
[`CLAUDE.md`](../CLAUDE.md); how to run it is in [`README.md`](../README.md); the
reasoning behind the choices is in [`DECISIONS.md`](DECISIONS.md). Nothing here is
repeated from any of them — if you are about to undo something, read `DECISIONS.md`
first.

To get a working machine: `npm run dev:reset`, then `npm run start:emulator` in
a second terminal. That seeds 285 documents and twelve logins, checks every read
under the real rules, and leaves the emulator on the dev rules.

---

## What works

**All three features in `UNIQUE-FEATURES.md` are built end to end.**

- **Feature 1 — dealer licence compliance.** All six parts. The point-of-sale
  rule refuses a restricted product to a dealer whose licence has lapsed or is
  missing, an Area Manager may override with a written reason that lands in
  `audit_log`, and the register, the Dashboard expiry panel and the Compliance
  Report all read the same derived status. The last two were the outstanding
  parts and landed on 19 August; `License.js` now creates and renews licences,
  which nothing could do before.
- **Feature 2 — banned products.** Date-effective, on the sale path *and* the
  purchase path (`bannedPurchaseChecks`). Not overridable, by design.
- **Feature 3 — Bengali safety panel.** Prints on the invoice from a snapshot
  taken at the moment of sale, with a visible "not recorded" marker where there
  is no data. The two products that carry data carry **placeholder** data and say
  so in print — see *Blocked* below.

**`safetySource` is enforced on the server.** As of 20 August a product carrying
any of the seven Feature 3 fields with no source is refused by
`firestore.rules` (`safetyProvenanceHolds()`) as well as by `setSafetyData()`
and `createProduct()` — it used to be refused only by the Product page dialog,
which is `CLAUDE.md` §6's "enforced only in the UI" failure mode on the one
field §7 says matters most. `phiDays: 0` counts as a figure and demands a
source; `approvedCropsBn: []` and a blank string do not; clearing all seven with
a null source stays legal. Checked under the real rules across 21 write cases in
both directions, which is more than `verify:rules` can cover — see below.

**Credit limit, as a fourth thing the engine refuses.** `creditLimitRule` joined
`licenceRule` and `bannedRule` on 20 August — three rules registered now. It is a
**block**, because only a block gates the save and only a block writes a
`rule_override` row, and it is **overridable**, because a credit limit is the
company's own commercial threshold rather than a legal prohibition. It reads
`dueAmount`, not the grand total, so a cash sale settled in full is never
refused. Not claimed as a contribution — every ERP has one — but it is now
enforced rather than displayed.

**The spine.** Sales order entry, stock movements (sale, purchase, repack,
opening), the dealer and supplier ledgers' balances, invoice numbering from
atomic counters, and an append-only audit log that every write goes through.

**Numbers, as of this commit.** 24 of 47 files in `src/pages/` read Firestore
(4 of the rest are thin wrappers around wired components and 2 are auth
screens). 20 service modules. 23 collections have a `match` block in
`firestore.rules`. 23 composite indexes declared. 3 rules registered on the sale
engine. `npm run verify:rules` checks 49 reads against 6 seeded roles.

**The documentation was recounted on 20 August.** `SCREEN-AUDIT.md` carried its
original scope line — 55 files, 93 routes, 93 menu leaves — against a tree that is
now 88 JavaScript files, 101 route paths and 97 menu leaves; the duplicate-report
share falls from 41% to 39% on the larger denominator. Findings resolved since
19 August are struck through there: the `Sales.js` write gate, the `Navbar.js`
figures, the `CancelSales` badges, and the §6.4 decision to cut the Dashboard,
which was reversed because it carried Feature 1 part 3.

**`UNIQUE-FEATURES.md` was corrected on 20 August.** The one occasion `CLAUDE.md`
allows editing that file is a claim that has become false, and eleven had. Seven
understated the project: the §2 framing, the three "Costs us" findings, Feature
1's two unrendered parts, Feature 2's purchase path, and §9's count of live
modules (six, now 24). Four overstated it, which matters more — §4 marked the
ledgers and officer-wise achievement `Y`, Feature 3 claimed the challan as well
as the invoice, and Feature 4, never built, was headed "What is built". The
dated planning prose is untouched; only the false statements moved. Nothing else
in that file should be rewritten to match today's code.

---

## What is still sample data

Sixteen screens render a module-level array and write nowhere:

> `CancelSales` · `CashCollection` · `Categories` · `CustomerLedger` ·
> `Damage` · `Delivery` · `Employee` · `EmployeeAccount` · `HR` · `Mapping` ·
> `Reports` · `SMS` · `SalesReturn` · `Settings` · `SupplierLedger` ·
> `SupplierPurchase`

Two things follow that are easy to trip on:

- **The three ledgers are not fed.** `CustomerLedger`, `SupplierLedger` and
  `EmployeeAccount` show invented rows beside a `balance` on the master that is
  real. The two disagree.
- **Damage and Sales Return do not move stock**, though `damage` and
  `sale_return` movement types exist and `cancelSale()` already writes the
  latter. `purchaseReturns.js` is the closest working example.

---

## What is left to do

Roughly in the order it matters:

1. **`Profile.js` writes `users/` directly** (`:16`), so it produces no audit
   entry — and under the real rules only a Super Admin may update `users`, so it
   cannot work for anyone else. It is the last service-layer bypass; `Navbar.js`
   lost its read on 19 August.
2. **`scripts/verify-rules.mjs` covers reads only.** Writes and the batches
   behind them are unchecked, and a batch fails whole. The `products`
   provenance rule was verified by hand against the emulator because nothing in
   the harness could do it; the next write rule will need the same, or a
   `verify:writes` alongside it. Every run prints its own list of gaps — read it
   rather than trusting the green line.
3. **Damage and Sales Return should move stock**, per above.
4. **The 40 report routes.** `SCREEN-AUDIT.md` §7 decision 1 keeps 8 and takes
   the other 32 out of the menu. The menu still lists all 40, and 38 of them
   render the same sales table.
5. **The remaining sample-data screens**, cheapest first: `Categories`,
   `Settings`, `Mapping` — all masters other screens would select from.
6. **Two screens still call `toISOString()`** (`CashCollection.js:3`,
   `SupplierPurchase.js:37`). Banned everywhere else; fix them when those
   screens are migrated.
7. **`Notice` exists three times.** `Product.js` and `SalesEntry.js` carry
   copies from before it was extracted.

---

## Blocked on someone else

Nothing below can be closed from inside this repository.

- **The real Firebase project is on one team member's account.** It is still
  empty, `firestore.rules` has never been deployed to it, and neither have the
  23 composite indexes. Everything verified so far is against the local
  emulator, which serves any query regardless of index — **a missing index is
  the one production failure no check here can catch.** Getting access, and one
  deploy, is the single highest-value unblock.
- **`UNIQUE-FEATURES.md` §7 marks every legal citation `VERIFY`.** They must be
  checked against the gazette or the DAE before the report is submitted. This is
  a standing requirement, not history.
- **`bannedAuthority` on `AI-000905` and `AI-000906` is a stated placeholder**,
  pending a real DAE notification reference.
- **The safety data on `AI-000101` and `AI-000104` is placeholder data**, labelled
  as such in the code and printed as such on the invoice. It needs the real
  container labels photographed. Empty beats plausible — do not fill these in
  from memory or from a web search (`CLAUDE.md` §7).

---

*Keep this current.* `CLAUDE.md` §11 requires this file to be updated at the end
of any substantial piece of work. A handover that has gone stale is worse than
none, because it is believed.
