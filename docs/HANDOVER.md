# Handover — where this project stands

**Updated 21 August 2026.** State only. The conventions are in
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
source; `approvedCropsBn: []` does not; clearing all seven with a null source
stays legal. A **blank string** is an absence to the service, which normalises
it to `null`, and a value to the rules, which cannot normalise and so refuse it
— stored verbatim it would be data to `hasSafetyData()` and an absence to the
source check at once, which prints a panel of blanks under a blank source line.
`npm run verify:writes` holds those cases and switches the rules and re-seeds
around itself.

**`/profile` works, for everybody, and writes through the service layer.** As
of 21 August a signed-in user may change their own `name` and `phone`, and
nothing else on their `users/` document — `role`, `permissions`, `areaId`,
`territoryId`, `status`, `email` and the rest are still Super Admin only. That
reverses `FIRESTORE-SCHEMA.md` §7's flat "users: Super Admin only"; §7 and §4.7
now say so and `DECISIONS.md` records why. Before this the screen called
`doc`/`getDoc`/`setDoc` on `users` itself — the **last service-layer bypass**,
which meant no audit entry on the collection that decides everyone's authority,
and a Save button eleven of the twelve logins could press and never succeed
with. No file in `src/pages/` imports `firebase/firestore` now. The control is
`editingOwnProfile()` in `firestore.rules`, and it compares against
`resource.data`, so an unchanged field sent alongside a changed `role` does not
make the write legal and a `setDoc()` dropping the other nine fields is refused
too.

**Credit limit, as a fourth thing the engine refuses.** `creditLimitRule` joined
`licenceRule` and `bannedRule` on 20 August — three rules registered now. It is a
**block**, because only a block gates the save and only a block writes a
`rule_override` row, and it is **overridable**, because a credit limit is the
company's own commercial threshold rather than a legal prohibition. It reads
`dueAmount`, not the grand total, so a cash sale settled in full is never
refused. Not claimed as a contribution — every ERP has one — but it is now
enforced rather than displayed.

**Every business date is stored at local midnight, and a licence's last day
means the same thing to both halves of Feature 1.** Two date defects from the
21 August adversarial pass are closed (`KNOWN-LIMITATIONS.md`, FIX 8 and FIX 9,
struck through there).

`scripts/seed.mjs` was writing dates through `new Date('2026-06-01')`, which
parses as UTC midnight and at UTC+6 stored 06:00 local — six hours after the
local midnight `toTimestamp()` stores for a sale dated the same day. Both
seeded banned products were therefore **not refused on the day their ban took
effect**, which is the first boundary anyone tests against Feature 2. Its `ts()`
now parses field by field into local midnight, matching `toTimestamp()`, and the
two are commented as maintained in parallel — the script cannot import
`src/services` (§8), so the conversion exists twice for the reason
`OVERRIDE_ROLES` does. `banProduct()` and `isBannedOn()` were already correct and
are untouched.

`daysToExpiry()` subtracted a stored instant from `asAt` and floored it. The
register, the Dashboard panel and the Compliance Report pass a clock time; the
sale rule is passed a date. On a licence's expiry day those landed on opposite
sides of the floor — the register said **Expired** while `/sales-entry`
**permitted** the sale — and the same skew shifted the whole scale, so
"expiring within 7 days" was really within eight. Both sides are now normalised
to local midnight inside that one function, which D5 makes the only place it
could be fixed.

The band counts did not move (3 expired, 1 / 2 / 2, 18 beyond 60 days for a
Super Admin; 3 and 1 / 1 / 1 with 17 for the Area Manager, and the Dashboard
panel and Compliance Report still agree exactly). Each licence's `daysRemaining`
gained a day and now matches the offset the seed intended: `AIC-000001` reads
**-14**, the fortnight its seed comment always claimed, not -15.
`SCREEN-AUDIT.md` §8 and `README.md` are corrected. `verify.mjs` carried its own
copies of both defects in its reporting helpers — it printed the ban as "from
2026-05-31" — and they are fixed and commented as parallel to the app's.

**A new seed invariant guards it.** `verify.mjs` invariant 8 asserts that every
seeded ban, licence and sale timestamp is stored at **local midnight** — 71 of
them on the current seed. The UTC conversion has now been fixed four times in
this repository (`c61bb3b`, `631f9d8`, `f3d54f2`, and this); that assertion is
the first thing that would catch a fifth.

**The spine.** Sales order entry, stock movements (sale, purchase, repack,
opening), the dealer and supplier ledgers' balances, invoice numbering from
atomic counters, and an append-only audit log that every write goes through.

**Numbers, as of this commit**, recounted rather than carried forward. 25 of 47
files in `src/pages/` read Firestore (4 of the rest are thin wrappers around
wired components and 2 are auth screens), and none of the 47 imports
`firebase/firestore`. 20 service modules. 23 collections have a `match` block in
`firestore.rules`. 23 composite indexes declared. 3 rules registered on the sale
engine. `npm run verify:rules` checks 50 reads against 6 seeded roles;
`npm run verify:writes` checks 87 cases across 2 write rules;
`npm run verify:emulator` checks 12 invariants and 12 demonstration facts over
285 documents.

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

1. **Two write rules are checked, and no others.** `verify:writes` covers the
   safety-provenance rule on `products` and the self-edit rule on `users`; every
   other write and the batches behind them are unchecked, and a batch fails
   whole. The sale batch — five collections in one commit — is the one worth
   doing next.
2. **Damage and Sales Return should move stock**, per above.
3. **The 40 report routes.** `SCREEN-AUDIT.md` §7 decision 1 keeps 8 and takes
   the other 32 out of the menu. The menu still lists all 40, and 38 of them
   render the same sales table.
4. **The remaining sample-data screens**, cheapest first: `Categories`,
   `Settings`, `Mapping` — all masters other screens would select from.
5. **Two screens still call `toISOString()`** (`CashCollection.js:3`,
   `SupplierPurchase.js:37`). Banned everywhere else; fix them when those
   screens are migrated.
6. **`Notice` exists three times.** `Product.js` and `SalesEntry.js` carry
   copies from before it was extracted.
7. **A self-edit is not type-checked on the server.** `editingOwnProfile()`
   constrains which fields may differ and says nothing about their values, so a
   caller past the service layer can store a number or a blank string as their
   `name`. `updateMyProfile()` refuses both. Deliberate — a type test in the
   rules is the evaluation error that predicate is written to avoid — and it
   moves no role, permission or scope. Stated at the end of every
   `verify:writes` run.

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
