# Known limitations — findings from the adversarial pass, 21 August 2026

**What this is.** One pass over the system as an examiner would meet it: signed in
as each of the twelve seeded logins, clicking whatever, in any order, under the
**real** Security Rules. It looks for what no other document covers. It is not a
survey — [`SCREEN-AUDIT.md`](SCREEN-AUDIT.md) already catalogues the dead buttons,
the sample-data screens and the duplicate reports, and nothing it records is
repeated here.

**Every finding below was reproduced against the emulator on the real rules**
(`npm run emulator:rules real`), with the seeded database, and is quoted with the
output actually observed. Invoice numbers, balances and audit rows in this
document are real ones from those runs.

---

### What this pass covered

- The sale rule engine under input nobody had tried: zero, negative and
  stock-exceeding quantities; a dealer holding no licence of any type; a product
  in a category no licence authorises; six blocking rules on one order; orders
  dated years forward and years back; a line added, removed and re-added; the
  dealer changed after the rules had run.
- The override path: the reason field, two overrides on one order, an override by
  a role that may not, and an override of a rule marked `overridable: false`.
- `createSale()`'s batch — what a refusal leaves behind, for five roles.
- Scope at the edges: a dealer moved between areas, a sale whose officer is not
  the dealer's officer, a report summing rows the caller cannot list.
- The invoice counter, from three directions.
- Feature 3 on the printed page: partial safety data, a mixed invoice, and a
  reprint after the product changed.
- `users/{uid}.phone` — absent-to-value, value-to-value and value-to-cleared, at
  the service layer and past it, for two non-admin roles.

### What it did not cover

- **Writes other than the ones named above.** `verify:writes` covers two rules;
  this pass added the sale batch, the override path, `counters` and `audit_log` by
  hand. Purchases, repackings, expenses, commissions, offers, opening balances and
  their batches were not driven at all.
- **Production.** Everything here is the emulator, which serves any query
  regardless of index. A missing composite index is still the one production
  failure nothing local can catch (`HANDOVER.md`, *Blocked*).
- **The sixteen sample-data screens**, beyond confirming that what is broken on
  them is already disclosed.
- **Concurrency.** Two officers saving at the same instant was reasoned about, not
  driven.
- **The two roles with no seeded account** — `Delivery Man` and `Dealer`. There is
  nothing to sign in as.

---

# FIX — the enforcement layer, and the printed page

These are what the project is scored on. Ordered by severity.

---

## FIX 1 — Nothing below the screen enforces the sale rules

**What it is.** `checkSaleRules()` runs in the browser and hands its verdict to
`createSale()` as an ordinary argument. `createSale()` refuses a *block it was
told about* ([`sales.js:172`](../src/services/sales.js:172)) — it never runs the
engine itself, and `firestore.rules` has no condition anywhere that reads a
product's `bannedFrom` or a dealer's licences. A caller who simply does not run
the engine is not refused by anything.

**Reproduce.** Signed in as the Area Manager, under the real rules:

```js
await createSale({
  customerId: 'AIC-000003',        // pesticide licence PL-2026-1002, expired 2026-06-22
  officeId: 'head', saleDate: '2026-08-21', paymentType: 'Credit',
  lines: [{ productId: 'AI-000905', qty: 10 }],   // registration withdrawn 2026-06-01
  ruleChecks: [],
});
```

**Observed.**

```
  checkSaleRules() returns 2 blocks: LICENCE_EXPIRED, PRODUCT_BANNED

  1a  createSale() with ruleChecks: [] (caller simply never ran the engine)
      -> SAVED  AINV-2026-08-0034676
  1b  createSale() with NO ruleChecks key at all
      -> SAVED  AINV-2026-08-0034677
  1c  createSale() handed the real blocks, unresolved
      -> REFUSED  ServiceError[VALIDATION] Sale refused: Pesticide licence PL-2026-1002 …
```

The same holds for the **Sales Officer**, the role the block is aimed at:

```
  5b  Sales Officer createSale() with ruleChecks: [] on the same blocked order
      -> SAVED  AINV-2026-08-0034683
```

**What an examiner sees.** Nothing, from the screen. This one is found by reading
`firestore.rules` and asking "where is the ban enforced?" — which is exactly the
question `CLAUDE.md` §6 and `DECISIONS.md` train an examiner to ask, because both
documents present the override as enforced in four places with the rules file as
the control. The rules file controls **who may record an override**. It does not
control **whether a blocked sale may be saved**. FIX 2 is the same hole reached
from the keyboard.

---

## FIX 2 — The order date is unbounded, and backdating turns every block off

**What it is.** `saleDate` is a bare `<input type="date">` with no `min` and no
`max` ([`SalesEntry.js`](../src/pages/SalesEntry.js)), and both Feature 1 and
Feature 2 compare against it rather than against today — correctly, and by
design (`DECISIONS.md`, *`bannedFrom` is a date, not a flag*). Nothing constrains
the operator's choice of date, and nothing records that the choice was made.

**Reproduce.** On `/sales-entry` as the Area Manager: pick **M/S Rabbi Traders
[AIC-000003]** (pesticide licence expired 2026-06-22), add 50 × **Farmguard 35ec
(endosulfan 35%) [AI-000905]** (registration withdrawn from 2026-06-01), then
change the Order date to `2021-08-21` and press Save.

**Observed.** Before changing the date:

```
Rule checks — 2 blocked
BLOCK LICENCE_EXPIRED   Pesticide licence PL-2026-1002 expired on 2026-06-22 …
BLOCK PRODUCT_BANNED    Farmguard 35ec (endosulfan 35%) 250 Ml — registration
                        withdrawn with effect from 2026-06-01. …
```

After changing the date, with nothing else touched:

```
{"orderDate":"2021-08-21","rules":"\nNo issues.\n","saveDisabled":false}
```

It saved, and what it wrote is:

```
sales/AINV-2021-08-0034679
  customerName  M/S Rabbi Traders
  grandTotal    14250
  ruleChecks:            (empty)
audit_log rows for AINV-2021-08-0034679: 1
  action=create user=AIU-000003 (Area Manager)
customers/AIC-000003: balance now 85623.42
```

**What an examiner sees.** ৳14,250 of a de-registered pesticide supplied to a
dealer with a lapsed licence, the dealer's balance moved, stock moved, and no
override, no reason and no `rule_override` row anywhere — because from the
system's point of view no rule was ever broken. Two keystrokes in the date box.

This is the most likely thing to be found at the showcase, and it defeats both
demonstrated features at once.

---

## FIX 3 — `PRODUCT_BANNED` can be overridden

**What it is.** `overridable: false` is honoured in exactly one place —
`applyOverride()` ([`checkSaleRules.js:117`](../src/rules/checkSaleRules.js:117)).
`createSale()` filters `ruleChecks` on `overridden` and on the presence of a
reason, and never looks at `overridable`
([`sales.js:180`](../src/services/sales.js:180)). `canOverrideRules()` in
`firestore.rules` tests the caller's **role** and the reason's **length**, and
never the rule **code**. So the one rule the project says nobody in the company
may waive is waivable by everybody who may waive anything.

**Reproduce.** As the Area Manager, hand `createSale()` a `PRODUCT_BANNED` result
with `overridden: true` and a reason, without going through `applyOverride()`.

**Observed.**

```
  applyOverride() on it, through the screen path:
      -> REFUSED: PRODUCT_BANNED cannot be overridden.

  2a  createSale() handed PRODUCT_BANNED marked overridden (bypassing applyOverride)
      -> SAVED  AINV-2026-08-0034678
      audit_log rule_override rows written: 2
         code=PRODUCT_BANNED product=AI-000905 reason="Stock already in the channel"
              by=AIU-000003 role=Area Manager
         code=LICENCE_EXPIRED product=AI-000905 reason="Stock already in the channel"
              by=AIU-000003 role=Area Manager
      sale.ruleChecks on the stored invoice:
              LICENCE_EXPIRED(overridden=true), PRODUCT_BANNED(overridden=true)
```

**What an examiner sees.** `audit_log` holding a `rule_override` row for
`PRODUCT_BANNED` — a written record of a company employee authorising a sale the
government has prohibited, which `DECISIONS.md` says outright would be "a false
claim of authority". The record is the evidence.

---

## FIX 4 — An override's written reason may be whitespace

**What it is.** Three layers check the reason and only the first one trims.
`applyOverride()` uses `!reason.trim()`. `createSale()` uses `if
(!r.overrideReason)` ([`sales.js:181`](../src/services/sales.js:181)) — a
truthiness test, and `'   '` is truthy. `firestore.rules` uses `reason is string
&& reason.size() > 0` ([line 370](../firestore.rules:370)) — no `.trim()`.

Twenty-eight lines earlier in the same file, `hasSafetySource()` answers the
identical "is blank a value?" question the other way, with
`s.trim().size() > 0`. The safety-source rule got the careful answer and the
override rule — the one `CLAUDE.md` §6 and `DECISIONS.md` both call *the control*
— got the loose one.

**Reproduce.** `createSale()` with `overrideReason: '   '`; and, separately, a raw
`addDoc` of a `rule_override` entry as the Area Manager.

**Observed.**

```
  applyOverride("   ") -> REFUSED: An override needs a written reason.

  3a  createSale() with overrideReason "   " (three spaces)
      -> SAVED  AINV-2026-08-0034679
      audit_log rule_override rows: 1, reason stored as "   "
  3b  createSale() with overrideReason "\n\t"
      -> SAVED  AINV-2026-08-0034680
      audit_log rule_override rows: 1, reason stored as "\n\t"
```

At the rules layer directly:

```
  ALLOWED  B6  Area Manager rule_override with reason "   " (three spaces)
  ALLOWED  B7  Area Manager rule_override with reason "."
  REFUSED  B8  Area Manager rule_override with reason "" (empty)
  REFUSED  B9  Area Manager rule_override with reason 12345 (a number)
```

**What an examiner sees.** The Audit Log screen showing an override with a blank
Reason column. "An override that is not recorded is not a control" is written in
three files; a blank reason is not a record.

---

## FIX 5 — An override survives the change it authorised, and the audit entry records the superseded figure

**What it is.** `SalesEntry.runRules()` re-runs the engine on every change and
then merges the previous state over the fresh result
([`SalesEntry.js:285`](../src/pages/SalesEntry.js:285)):

```js
const kept = prev.find(p => p.code === r.code && p.productId === r.productId && p.overridden);
return kept ? { ...r, ...kept } : r;      //  kept OVERWRITES r, message included
```

The match key is `code` + `productId`. It contains no quantity, no amount and no
dealer. `kept` is spread **after** `r`, so the *stale* message wins — and that
message is what `createSale()` writes onto the invoice and into `audit_log`
([`sales.js:293`](../src/services/sales.js:293)).

### 5a — the amount authorised

**Reproduce (driven through the browser).** As the Area Manager on
`/sales-entry`: **M/S A T Z R Traders [AIC-000002]**, credit limit ৳200,000,
balance ৳0. Add 1,100 × **Agri Zink 1KG** = ৳209,000. Override with a reason.
Then change the quantity in the line to 11,000.

**Observed on screen after the change:**

```
Rule checks — 1 overridden
OVERRIDDEN CREDIT_LIMIT_EXCEEDED
Credit limit ৳200,000 exceeded — balance would become ৳209,000.
Reason recorded: "Approved to 210,000 for August only — MD verbal, minuted"
…
Grand total  ৳ 2,090,000.00      Due  ৳ 2,090,000.00
saveDisabled: false
```

The engine's own fresh message for that order was *"balance would become
৳2,090,000"*. It was discarded by the merge. Saved, and this is the record:

```
sales/AINV-2026-08-0034677
  customerName  M/S A T Z R Traders     grandTotal 2090000     dueAmount 2090000
  ruleChecks:
     CREDIT_LIMIT_EXCEEDED overridden=true by=AIU-000003
        message : "Credit limit ৳200,000 exceeded — balance would become ৳209,000."
audit_log rows: 2
  action=rule_override user=AIU-000003 (Area Manager)
     after.message : "Credit limit ৳200,000 exceeded — balance would become ৳209,000."
customers/AIC-000002: creditLimit 200000, balance now 2090000
```

The manager authorised ৳209,000. The books carry ৳2,090,000 against a ৳200,000
limit. The only record of who agreed to it says ৳209,000.

### 5b — the dealer authorised

**Reproduce (driven through the browser).** Pick **M/S Bhai Bhai Traders
[AIC-000001]** (pesticide licence **PL-2026-1000**, expired 2026-08-07), add
10 × Blue Sundari, override with *"Bhai Bhai renewal receipt seen 20 Aug"*, then
change the dealer dropdown to **M/S Rabbi Traders [AIC-000003]** (a different
licence, **PL-2026-1002**, expired 2026-06-22).

**Observed.** The rule panel does not change at all:

```
dealerNow: "M/S Rabbi Traders [AIC-000003]"
OVERRIDDEN LICENCE_EXPIRED
Pesticide licence PL-2026-1000 expired on 2026-08-07 — Blue Sundari … cannot be supplied.
Reason recorded: "Bhai Bhai renewal receipt seen 20 Aug — DAE ref pending"
saveDisabled: false
```

Saved as `AINV-2026-08-0034678`, and the permanent record reads:

```
sales/AINV-2026-08-0034678
  customerName  M/S Rabbi Traders
audit_log  action=rule_override user=AIU-000003 (Area Manager)
     after.message : "Pesticide licence PL-2026-1000 expired on 2026-08-07 …"
     reason        : "Bhai Bhai renewal receipt seen 20 Aug — DAE ref pending"
```

**What an examiner sees.** A compliance record attributing ৳1,927.50 of
unlicensed supply to M/S Rabbi Traders under **another dealer's licence number**
and a reason naming that other dealer. Nobody ever authorised a sale to Rabbi
Traders.

**Clean, for contrast.** Removing a line and re-adding it *does* clear the
override — the removed result leaves state, so `prev` no longer holds it:

```
  C3  line removed  -> ruleResults length 0
      line re-added -> overridden = undefined, canSave = false
```

---

## FIX 6 — A duplicate invoice number is reachable, and it corrupts the printed invoice

**What it is.** Two independent paths, either of which lets `createSale()` land on
an invoice number that already exists. It then writes with `batch.set()`
([`sales.js:263`](../src/services/sales.js:263)), which **replaces** the sale
document, while `sale_items` are auto-ID and simply accumulate.

1. **`counters` is granted unconditional `write` to five roles**
   ([`firestore.rules:388`](../firestore.rules:388)) with no condition that the
   value may only increase. A Sales Officer can rewind `counters/sales`.
2. **`createSale()` accepts a caller-supplied `invoiceNo`**
   ([`sales.js:191`](../src/services/sales.js:191)) and does not check whether it
   exists — unlike `createDoc()`, which does
   ([`core.js:278`](../src/services/core.js:278)).

**Reproduce (path 1, end to end, on a freshly seeded database).**

**Observed.**

```
##### STEP 1 — a genuine invoice is raised #####
  raised as AINV-2026-08-0034676
     sales/…: M/S Islam Traders  grandTotal=960  dueAmount=960
     sale_items rows: 1  ->  AI-000006 x10 = 960
     stock_movements: 1  ->  sale -10
     dealer balance is now 960

##### STEP 2 — a Sales Officer rewinds the counter #####
  counters/sales = 34676; setting it back to 34675
  ALLOWED   (a Sales Officer did this; firestore.rules allows it)

##### STEP 3 — the next sale in the same month takes the same number #####
  the second sale was numbered AINV-2026-08-0034676  (same as the first? true)
  sales/AINV-2026-08-0034676 AFTER the collision:
     sales/…: M/S Shohan Traders  grandTotal=578.25  dueAmount=0
     sale_items rows: 2  ->  AI-000006 x10 = 960 | AI-000105 x3 = 578.25
     stock_movements: 2  ->  sale -3 | sale -10
     dealer AIC-000015 balance 960 -> 960   (its receivable now has no invoice behind it)

##### STEP 4 — what the invoice modal / print will show #####
  header says: M/S Shohan Traders, grand total ৳578.25
  lines printed underneath it:
     1  Porbot 2.5ec 50 Ml       x10  = 960
     1  Blue Sundari 72wp 100gm  x3   = 578.25
  the lines add up to ৳1538.25, the header says ৳578.25

  audit_log rows for AINV-2026-08-0034676: 2  (both 'create')
```

Path 2 produces the same corruption without touching the counter:

```
  6c  createSale() with an EXPLICIT invoiceNo equal to an existing invoice
      -> SAVED  AINV-2026-08-0034685
      AINV-2026-08-0034685 now has 2 line(s), grandTotal 288
      stock_movements referencing it: 2
```

**What an examiner sees.** One invoice number, a header for one dealer, two lines
beneath it belonging to two different dealers, both numbered "1", adding up to
almost three times the printed grand total — and a receivable on a third party's
ledger with nothing behind it.

**Clean, for contrast.** Backdating on its own cannot do this: the counter is
**global**, not per month. The `YYYY-MM` in the invoice number is taken from the
sale date and is decoration.

```
  6a  a normal sale today          -> AINV-2026-08-0034685
  6b  a sale BACKDATED to 2026-01-15 -> AINV-2026-01-0034686
```

---

## FIX 7 — Feature 3 prints "safety data not recorded" over data that is recorded

**What it is.** Three definitions of "recorded" in one feature, and the narrowest
one runs first.

| Where | Counts as recorded |
|---|---|
| `safetyRecorded()` / `isRecorded()` — the provenance rule | all **seven** fields, `0` included |
| `snapshotHasContent()` — the panel's own gate | six: adds `signalWordBn`, `phiDays`, `reentryHours` |
| `hasSafetyData()` ([`products.js:303`](../src/services/products.js:303)) | **three**: `whoClass`, `dosageBn`, `firstAidBn`, by truthiness |

`safetySnapshot()` returns `null` when `hasSafetyData()` is false, so anything the
three-field test misses never reaches the sale line at all, and the invoice prints
the missing-data marker.

**Reproduce.** Record safety data on a product using only fields outside those
three — which `firestore.rules` will insist has a source, and does.

**Observed.**

```
  signalWordBn + phiDays + reentryHours + approvedCropsBn (four of the seven)
      stored on the product:  signalWordBn, phiDays, reentryHours, approvedCropsBn
                              (source: "PROBE - label photograph")
      hasSafetyData()       = false
      safetySnapshot()      = null
      snapshotHasContent()  = false
      THE INVOICE PRINTS    -> "নিরাপত্তা তথ্য সংরক্ষিত নেই"  (safety data NOT recorded)

  only phiDays: 0 ("harvest the same day")
      hasSafetyData()       = false
      THE INVOICE PRINTS    -> "নিরাপত্তা তথ্য সংরক্ষিত নেই"  (safety data NOT recorded)

  only whoClass          -> the safety panel
  only dosageBn          -> the safety panel
```

`phiDays: 0` is the case `DECISIONS.md` singles out by name as one of "the two
readings a reader most needs to trust", and the reason `isRecorded()` and
`safetyRecorded()` were both written to avoid a truthiness test. `hasSafetyData()`
is a truthiness test, and it does not test `phiDays` at all.

**What an examiner sees.** A dealer's invoice stating in Bengali that no safety
data is recorded for a pesticide whose pre-harvest interval and re-entry period
*are* recorded, from a source the server refused to accept the figures without.
On the one feature the project says inventing data would be the worst available
failure, this is the mirror image: suppressing data that exists, and printing a
false negative claim in its place.

**Clean, for contrast.** The snapshot's historical behaviour is exactly as
designed. Changing a product's safety data after a sale does not rewrite the
invoice, and neither does clearing it:

```
  AI-000104 phiDays on the product record before: 14 -> after: 99
  the invoice line's snapshot still reads phiDays=14, source "PLACEHOLDER — …"
  AI-000104 cleared: hasSafetyData = false
  the reprint still prints the panel? true  (source "PLACEHOLDER — …")
```

---

## FIX 8 — The two seeded banned products are not refused on the day the ban takes effect

**What it is.** `isBannedOn()` is correct (`when >= from`). The seed is not.
[`scripts/seed.mjs:72`](../scripts/seed.mjs:72) is

```js
const ts = (v) => (v ? Timestamp.fromDate(new Date(v)) : null);
```

`new Date('2026-06-01')` is parsed as **UTC** midnight — the exact conversion
`CLAUDE.md` §2 bans and that has already been fixed three times. At UTC+6 that
stores 06:00 local, while `toTimestamp()` stores a sale dated the same day at
00:00 local. The sale is six hours short of its own ban.

**Observed.**

```
  AI-000905  stored Timestamp -> Mon Jun 01 2026 06:00:00 GMT+0600
  AI-000906  stored Timestamp -> Wed Jul 15 2026 06:00:00 GMT+0600

  2026-05-31 local midnight  (day before)                    isBannedOn = false
  2026-06-01 local midnight  (THE effective day)             isBannedOn = false   <—
  2026-06-01 05:59 local                                     isBannedOn = false
  2026-06-01 06:00 local                                     isBannedOn = true
  2026-06-02 local midnight                                  isBannedOn = true
```

The service path is correct, which is what pins the fault on the seed:

```
  AI-000452 banned via banProduct() -> stored Mon Jun 01 2026 00:00:00 GMT+0600
  2026-05-31 local midnight                    isBannedOn = false
  2026-06-01 local midnight (THE effective day) isBannedOn = true
```

`ts()` is also how every seeded licence `expiryDate`/`issueDate` and every seeded
`saleDate` was written, so the same six hours sit under all of them.

**What an examiner sees.** An examiner testing the boundary of a date-effective
ban — the single most obvious thing to test about a feature whose whole claim is
date-effectiveness — types the effective date and is not blocked. On the demo
database, for both demo products.

---

## FIX 9 — On its last day a licence reads "Expired" in the register and "permitted" at the point of sale

**What it is.** `daysToExpiry()` subtracts a stored instant from `asAt` and floors
the result. The register, the Dashboard panel and the Compliance Report pass
`asAt = new Date()` — the current clock time — while the sale rule is passed a
date. On the expiry day these land on opposite sides of the floor.

**Observed** for `PL-2026-1003` (M/S Zim Traders, expires 2026-08-26), evaluated
at 11:35 local on 26 August:

```
  licenceStatus()  register / dashboard / compliance   asAt = now
      daysToExpiry = -1   licenceStatus = Expired   sale rule -> LICENCE_EXPIRED BLOCKED

  licenceCheckFor() SalesEntry passes new Date("2026-08-26")
      daysToExpiry = 0    licenceStatus = Expiring (7)   sale rule -> PERMITTED

  licenceCheckFor() the saleDate actually STORED (local midnight)
      daysToExpiry = 0    licenceStatus = Expiring (7)   sale rule -> PERMITTED
```

The same subtraction shifts the whole scale by a day: a licence expiring
**tomorrow** reports `daysRemaining = 0`, and one expiring **today** reports
`-1`, so the "expiring within 7 days" band is really within eight.

```
  ##### E. A LICENCE EXPIRING TOMORROW, FOR CONTRAST #####
  licenceStatus() = Expiring (7)   daysRemaining = 0
```

**What an examiner sees.** On 26 August 2026 — five days after this pass — the
Compliance Report and the Dashboard will list M/S Zim Traders' pesticide licence
as **Expired**, and `/sales-entry` will sell them a pesticide with no block at
all. Feature 1's register and Feature 1's point-of-sale control contradicting each
other, on a seeded dealer, on a date inside the demonstration window. It is
reproducible today by creating any licence with today's date as its expiry.

---

## FIX 10 — `audit_log` accepts a forged role, a forged name, and an action outside the enumeration

**What it is.** The `audit_log` create rule pins `userId` to the caller
([`firestore.rules:367`](../firestore.rules:367)) and nothing else. `userRole`,
`userName` and `action` are whatever the caller sends. `AUDIT_ACTION` is enforced
only in `queueAudit()` ([`core.js:247`](../src/services/core.js:247)).

**Observed**, as the Sales Officer and then the Area Manager:

```
  ALLOWED  B1  an ordinary create entry claiming userRole "Super Admin"
  ALLOWED  B2  an entry claiming userName "Md. Ruksat Hasan Akib"
  REFUSED  B3  a rule_override entry (this officer may NOT override)
  REFUSED  B4  an entry attributed to somebody else (userId = AIU-000001)
  ALLOWED  B5  a login entry for a login that never happened
  ALLOWED  B10 Area Manager rule_override against a docId that does not exist
  ALLOWED  B12 Area Manager entry with action "not-in-the-enum"
```

**What an examiner sees.** The Audit Log screen renders `userName` and `userRole`,
so a row can display a name and a role that are not the author's. `userId` is
always truthful, which is what keeps this from being worse — but the screen shows
the two fields that are not.

**Clean, and it is the strongest control in the system.** Append-only holds
absolutely, for everybody:

```
  REFUSED  B13 update one of them                     (Area Manager)
  REFUSED  B14 delete one of them                     (Area Manager)
  REFUSED  B15 Super Admin update one of them
  REFUSED  B16 Super Admin delete one of them
```

---

## FIX 11 — The credit-limit rule blocks a cash sale that adds no exposure

**What it is.** `creditLimitCheck()` compares the **resulting balance** with the
limit ([`customers.js`](../src/services/customers.js)), not the amount the sale
adds. A dealer already over their limit is therefore refused every sale, including
a cash sale settled in full, which moves nothing.

`DECISIONS.md` states the opposite intent in as many words: gating on an amount
the sale does not touch "would refuse a sale that cannot breach the limit — a
false block, which teaches people to override reflexively and is worse than no
rule at all."

**Reproduce.** **M/s- Susmoy Traders [AIC-000046]** is seeded with a balance of
৳385,497.56 against a ৳200,000 limit. Sell them anything for cash.

**Observed.**

```
  6e  dealer already over limit, dueAmount 0 (a cash sale)
        [block] CREDIT_LIMIT_EXCEEDED
           "Credit limit ৳200,000 exceeded — balance would become ৳385,497.56."

  6d  NEGATIVE due against the same dealer
           "Credit limit ৳200,000 exceeded — balance would become ৳385,496.56."
```

**What an examiner sees.** A block whose message says the balance "would become"
exactly what it already is — and, on the negative case, would become *less* than
it is now. The arithmetic at the limit itself is exact, which is worth showing
beside it:

```
  6b  due EXACTLY equal to the headroom (bal 0, limit 200000, due 200000)  -> permitted
  6c  one paisa over (200000.01)                                           -> blocked
```

---

## FIX 12 — `updateMyProfile()` stores the string `"null"`

**What it is.** [`users.js:161-162`](../src/services/users.js:161) coerces before
it validates:

```js
if (patch.name  !== undefined) clean.name  = String(patch.name).trim();
if (patch.phone !== undefined) clean.phone = String(patch.phone).trim();
```

`String(null)` is `'null'` — four characters, non-empty, so the blank-name guard
two lines below passes it.

**Observed**, as the Area Manager under the real rules:

```
  ALLOWED  B6  updateMyProfile({phone:null})   stored phone = "null" (string)
  before: name = "Sadia Akter"
  after updateMyProfile({name:null}): name = "null" (string)
  the sidebar would greet them: "null"
```

`name` is denormalised onto every `audit_log` entry its owner writes, so once it
is `"null"` the log carries it from the next session onward.

`HANDOVER.md`'s *What is left to do* item 7 says of this path that
"`updateMyProfile()` refuses both". It refuses a blank string. It does not refuse
`null`; it converts it into a plausible-looking one. That sentence needs
correcting whether or not the code is changed.

**Severity.** The lowest of the twelve — it moves no role, permission or scope,
and it is not reachable from `/profile`, which always sends a string. It is here
because the bucket is defined by location and this is service-layer validation on
the collection that decides everyone's authority.

---

# DISCLOSE — for the report's limitations section

Real defects an examiner could hit, outside the enforcement layer, not covered by
any broader statement already made. Each carries the one sentence to use.

---

## DISCLOSE 1 — The Compliance Report's summary cards exclude the dealers with no licence at all

The table has two kinds of row: licences, and dealers holding nothing — the
second built deliberately, because `licences.js` says a dealer with no licence
"is the worst case in the whole feature, not an absence worth being quiet about".
The summary is then computed from the licence rows only
([`licences.js:384`](../src/services/licences.js:384)), so the worst cases are
counted in no card.

**Observed**, as each role, on a freshly seeded database:

```
  Super Admin        rows=39 (of which "No licence"=16)  summary.total=23
  Managing Director  rows=39 (of which "No licence"=16)  summary.total=23
  Area Manager       rows=28 (of which "No licence"=7)   summary.total=21
  Accountant         rows=39 (of which "No licence"=16)  summary.total=23
  Sales Officer      rows= 5 (of which "No licence"=2)   summary.total= 3
```

**What an examiner sees.** Cards reading "23 licences · 3 expired" above a table
of 39 rows, 16 of which are dealers with nothing on record. Counting the cards
against the table is the first thing anyone does with a summary.

> **For the report.** The Compliance Report's summary counts only dealers who hold
> a licence document, so the dealers holding none — the most exposed cases, and
> the ones the table lists first — are absent from the totals above it. The table
> is complete; the cards are not, and on a compliance figure understatement is the
> dangerous direction.

---

## DISCLOSE 2 — Value supplied under an overridden licence block disappears from the report that exists to show it

`overriddenLicenceValue()` scopes `sales` by the caller's `areaId`/`officerId`,
while `complianceReport()` restricts its rows to the dealers `listCustomers()`
returns *now*. The two disagree the moment a dealer's `areaId` changes, and they
disagree permanently for any sale an Area Manager raised on an officer's dealer.

**Observed.** ৳19,275 supplied to AIC-000019 under an overridden `LICENCE_MISSING`
block:

```
  BEFORE the move (dealer is in bogura-sadar):
    Super Admin       rows= 39  AIC-000019: No licence, value under override = 19275
    Area Manager      rows= 29  AIC-000019: No licence, value under override = 19275
    Sales Officer     rows=  5  AIC-000019: No licence, value under override = 0

  AFTER Super Admin moves AIC-000019 to area "dhaka":
    Super Admin       rows= 39  AIC-000019: No licence, value under override = 19275
    Area Manager      rows= 28  AIC-000019: ABSENT      report-wide override value = 0
    Sales Officer     rows=  5  AIC-000019: No licence, value under override = 0
```

The sale keeps `areaId: bogura-sadar` (a deliberate historical snapshot), so the
dhaka manager's scoped query will not find it either. The exposure is visible to
nobody below Super Admin. Note the Sales Officer reads **0** with no move at all,
because the sale was raised by their Area Manager.

> **For the report.** The value supplied under an overridden licence block is
> computed from the sales a caller's own scope can list, and a sale's area is
> recorded as it stood on the day of sale; moving a dealer between areas, or a
> manager raising an order on an officer's dealer, therefore removes that figure
> from every scoped view of the Compliance Report while leaving it in the
> company-wide one.

---

## DISCLOSE 3 — An order raised by an Area Manager is invisible to the dealer's own Sales Officer

`createSale()` stamps `officerId` from the actor, not from the dealer
([`sales.js:239`](../src/services/sales.js:239)). A manager's order for a dealer
belonging to an officer is therefore owned by the manager, and every officer-side
read is scoped on `officerId`.

**Observed.**

```
  3a  Area Manager raises an order for AIC-000019   -> AINV-2026-08-0034681
      stored officerId = AIU-000003   areaId = bogura-sadar
      customer's own officerId = AIO-000083

  the dealer's OWN officer lists 2 sales; is AINV-2026-08-0034681 among them? false
  officer opens the invoice modal for it                 REFUSED permission-denied
  officer's Due report rows: 2; includes it? false
```

The dealer's `balance` did move. The officer sees a receivable their own screens
cannot account for.

> **For the report.** A sale is owned by the user who raises it rather than by the
> dealer's assigned officer, so an order a manager enters on a dealer's behalf
> does not appear on that dealer's officer's sales list, Due report or invoice
> view, although it does move the dealer's balance, which the officer can see.

---

## DISCLOSE 4 — A refused sale consumes an invoice number, and backdated invoices break the series' order

`nextInvoiceNo()` is drawn at [`sales.js:191`](../src/services/sales.js:191),
before the per-line validation at line 199 and before the batch commits, so any
failure after that point leaves the counter advanced.

**Observed.**

```
  7a  createSale() with qty 0    -> REFUSED   counters/sales 34686 -> 34687  (CONSUMED)
  7b  createSale() with qty -5   -> REFUSED   counters/sales 34687 -> 34688  (CONSUMED)
  7c  a product that does not exist -> REFUSED   34688 -> 34688
  7d  no lines                      -> REFUSED   34688 -> 34688
  5a  a permission-denied batch  -> REFUSED   34681 -> 34682  (CONSUMED)
```

Because the counter is global while the `YYYY-MM` comes from the sale date, a
backdated invoice also takes a higher sequence in an earlier month:

```
  today      -> AINV-2026-08-0034685
  backdated  -> AINV-2026-01-0034686
```

> **For the report.** Invoice numbers are drawn from an atomic counter before the
> order is validated, so a rejected order still consumes one and the printed
> series contains gaps; and because the counter is company-wide while the year and
> month in the number come from the order date, a backdated invoice carries an
> earlier month with a later sequence.

---

## DISCLOSE 5 — Three different values mean "no phone number"

The seed writes `null`. `/profile` sends `phone.trim()`, so clearing the box
stores `''`. A caller past the service can leave the key absent altogether.
`products.js` has `storedValue()` to normalise exactly this; `updateMyProfile()`
has no equivalent.

**Observed.**

```
  seeded, all six roles                       phone = null  (null, key present: true)
  ALLOWED  B3  updateMyProfile({phone:""})    stored phone = ""   (string)
  ALLOWED  B4  updateMyProfile({phone:"   "}) stored phone = ""   (string)
  ALLOWED  C6  updateDoc({phone:deleteField()}) stored phone = undefined (key absent)
```

Nothing reads `phone`, and `Profile.js` renders `profile.phone || ''`, so all
three display identically today.

> **For the report.** Clearing a phone number through the profile screen stores an
> empty string where the schema specifies `null`, so the collection holds more
> than one representation of an absent value; nothing reads the field today, so
> the inconsistency is latent rather than visible.

---

# What was probed and found clean

A clean area is a finding, and these are the ones worth saying out loud at the
viva because each is a control the project claims.

- **Batch atomicity holds.** A sale batch refused at any member leaves nothing
  behind. Driven as the Sales Officer whose `rule_override` row the rules refuse:
  `sales/AINV-2026-08-0034680 exists? false`, `sale_items 0`,
  `stock_movements 0`, `audit_log rows 0`, dealer balance `98654 -> 98654`. The
  only residue is the consumed invoice number (DISCLOSE 4).
- **The Managing Director credit-sale case from `CLAUDE.md` §6 is fixed.** Cash
  and credit both save; `AIC-000015` balance moved `0 -> 96`.
- **`audit_log` is genuinely append-only**, including for a Super Admin — every
  update and delete refused (FIX 10, *Clean*).
- **The `users` self-edit rule holds in every escalation shape**, for both the
  Area Manager and the Sales Officer: `role`, `areaId`, `permissions` alongside a
  legitimate `phone` all refused; a `setDoc()` that would drop the other fields
  refused; another user's document refused. The value-to-value and
  value-to-cleared paths this pass was asked to exercise are allowed, which is the
  intent.
- **The override role gate holds at the server.** A Sales Officer reaching
  `createSale()` directly with an overridden block is refused
  (`permission-denied` on the `audit_log` row), and so is a raw `rule_override`
  entry. This is the one layer of the four-place control that behaves as
  documented.
- **A Sales Officer cannot sell to another officer's dealer** (refused at the
  customer read) **or name another officer** on a sale (refused at the sale
  create).
- **Removing and re-adding a line clears its override** (FIX 5, *Clean*).
- **The safety snapshot is stable across product changes**, including clearing
  (FIX 7, *Clean*).
- **`banProduct()` is date-correct** when the ban is set through the service; only
  the seed is wrong (FIX 8).
- **Categories needing no licence pass straight through.** A Gift line to a dealer
  holding no licence produced no result at all; a PGR line produced
  `LICENCE_MISSING` via `LICENCE_FOR_CATEGORY`.
- **A malformed rule context fails safe.** `licences: null` yields
  `LICENCE_MISSING`; an Invalid Date as `saleDate` yields `LICENCE_EXPIRED`; both
  block rather than pass.
- **Six blocking rules on one order all render**, sorted blocks-first, with the
  ban correctly marked `overridable: false` on screen.

---

# IGNORE — already covered by a broader disclosure

Listed only so it is on record that they were seen and deliberately not given a
line in the report. Each is subsumed by a statement already made elsewhere.

| Seen | Covered by |
|---|---|
| Dead Go buttons, dead print links, decorative date filters on all 40 reports, the three unfed ledgers, Damage and Sales Return not moving stock | `HANDOVER.md` — "sixteen screens render a module-level array and write nowhere"; `SCREEN-AUDIT.md` §4.4, §4.5 |
| A number, a map, an array, or a deleted key stored as `phone` or `name` by a caller past the service layer (all ALLOWED under the real rules) | `HANDOVER.md` *What is left to do* item 7 — "a self-edit is not type-checked on the server", stated at the end of every `verify:writes` run |
| A licence with no `expiryDate` is counted by `countByBand()` as expiring within 7 days (`{"expired":0,"within7":1,…}`) | Not reachable — `createLicence()` requires `expiryDate`, and no screen writes a null one |
| Seed-category products would require a licence but get no safety panel (`AGROCHEMICAL_CATEGORIES` excludes Seed) | Not reachable — the catalogue contains no Seed product |
| `CashCollection.js` and `SupplierPurchase.js` still call `toISOString()` | `CLAUDE.md` §2 and `HANDOVER.md` item 5, both by file and line |
| Missing composite indexes cannot be caught locally | `HANDOVER.md` *Blocked* — "the one production failure no check here can catch" |
| The Accountant and Storekeeper are refused `createSale()` entirely | Correct and intended — neither holds `/sales-entry`, and `firestore.rules` and the seeded permission lists agree |

---

*Produced by a single adversarial pass on 21 August 2026, against the seeded
emulator under the real rules. No code under `src/` and no rule in
`firestore.rules` was changed. The probe scripts written to produce the output
quoted above were deleted afterwards; every run is reproducible from the
reproduction steps given with each finding.*
