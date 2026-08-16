# `src/services` — the Firestore layer

Every screen reads and writes through this layer. No screen calls `firebase/firestore`
directly, and no screen holds a hardcoded data array.

The data model this implements is in [`docs/FIRESTORE-SCHEMA.md`](../../docs/FIRESTORE-SCHEMA.md).
If you need to know what a field means, that is the document — this one is about
how to call the functions.

---

## The one rule

**Import from `../services`, never from `../services/sales`.**

```js
import { listSales, createSale, ServiceError } from '../services';
```

`index.js` re-exports everything. If a function moves between files later, only
`index.js` changes and your screen keeps working.

---

## Files

| File | What is in it |
|---|---|
| `index.js` | Re-exports everything. **This is what you import.** |
| `constants.js` | Every enumeration — statuses, roles, categories, offices |
| `core.js` | Plumbing: who is acting, date/number conversion, the audit wrapper |
| `products.js` | Product master · Feature 2 (banned) · Feature 3 (safety fields) |
| `customers.js` | Dealer master, balances, credit limit check |
| `licences.js` | Company **and** dealer licences · **Feature 1 lives here** |
| `sales.js` | Sales and sale lines, the status workflow, cancellation, reports |
| `stock.js` | Stock movements, Stock Report, Central Stock |
| `users.js` | Profiles, roles, permissions, session |
| `audit.js` | Reading the audit log; overrides |

One file per collection rather than a single `db.js`, so that three people can
work on three features without editing the same file.

---

## Before anything else: `setActor`

Every write records who made it. Tell the layer who is signed in, once, after login:

```js
import { setActor } from '../services';

setActor({ id: user.id, name: user.name, role: user.role });
```

If you forget, writes throw `ServiceError` with `code: 'NO_ACTOR'` and a message
saying so. **While AuthContext is still on localStorage it falls back to the
existing `av_current` session automatically**, so in practice things work today
without you doing anything. Once Firebase Auth is in, use `startSession(uid)`
from `users.js`, which loads the profile, calls `setActor` and logs the login.

---

## Reading

Every list function takes one options object, and **any option you leave out or
pass as `''` is ignored**. So you can hand your filter state straight in without
building the query conditionally:

```js
const [filters, setFilters] = useState({ status: '', officerId: '' });

const rows = await listSales(filters);   // '' values are skipped
```

```js
// Products
const products = await listProducts();                            // all active
const pesticides = await listProducts({ category: 'Pesticide' });
const found = await listProducts({ search: 'zink' });             // name or code

// For a <select> — use this instead of a hardcoded array
const options = await productOptions({ category: 'Pesticide' });
// → [{ value: 'AI-000730', label: 'Agri Zink 1KG [AI-000730]', product }]

// Dealers
const dealers = await listCustomers({ areaId: user.areaId });
const owing = await listCustomersWithDue();

// Sales
const sales = await listSales({ status: 'Confirm', from: '2026-08-01', to: '2026-08-31' });
const invoice = await getSaleWithItems('AINV-2026-08-0034703');   // sale + its lines
const cancelled = await listCancelledSales();                     // the Cancel Sales screen
const counts = await statusCounts();                              // { Pending: 4, Confirm: 47, … }
```

Dates come back as JavaScript `Date`, not Firestore `Timestamp` — format them
however the screen wants.

---

## Writing

Every write records an `audit_log` entry **in the same batch**. You do not write
one yourself; it is not possible to save a change without its audit entry.

```js
await createProduct({
    code: 'AI-000731', name: 'Agri Zink 500 Gm', category: 'Fertilizer',
    unitId: 'GM', packSize: '500 Gm', packQty: 500, type: 'Finished',
    cartonQty: 20, mrp: 110,
});

await updateProduct('AI-000731', { mrp: 120 });

await createCustomer({
    code: 'AIC-002100', name: 'M/s- New Traders', phone: '01711000000',
    address: 'Bazar Road, Bogura', territoryId: 'bogura-sadar',
    areaId: 'bogura', officerId: 'AIO-000083', creditLimit: 200000,
});
```

**Nothing is ever hard-deleted.** `deactivateProduct(code, reason)` sets the
status to `Inactive`; a report run next month must still resolve a reference
made today.

---

## Creating a sale

This is the important one. `createSale` writes the invoice, its lines, the stock
movements and the dealer's balance in **one batch** — so a sale can never exist
without its stock effect.

```js
import { createSale, getDealerLicences, licenceCheckFor,
         isBannedOn, getProduct, creditLimitCheck } from '../services';

// 1 — run the rules
const dealerLicences = await getDealerLicences(customer.code);
const ruleChecks = [];

for (const line of lines) {
    const product = await getProduct(line.productId);

    const licence = licenceCheckFor(dealerLicences, product, saleDate);   // Feature 1
    if (licence) ruleChecks.push(licence);

    if (isBannedOn(product, saleDate)) {                                  // Feature 2
        ruleChecks.push({
            level: 'block', code: 'PRODUCT_BANNED', productId: product.code,
            message: `${product.name}: ${product.bannedReason}`, overridable: false,
        });
    }
}

// 2 — show the blocks on screen. If an Area Manager overrides one, set
//     overridden and overrideReason on that entry:
//        rule.overridden = true;
//        rule.overrideReason = 'Renewal receipt seen';

// 3 — save
const sale = await createSale({
    customerId: customer.code,
    officeId: 'head',
    saleDate,
    paymentType: 'Credit',
    lines: [{ productId: 'AI-000730', qty: 48, unitPrice: 102 }],
    ruleChecks,
});
```

`createSale` **refuses** to save if any `ruleChecks` entry is a `block` that was
not overridden, and refuses an override with no `overrideReason`. The rule engine
decides; this function only declines to persist a decision that was ignored.

Overrides are written twice on purpose — onto `sale.ruleChecks` and as a
`rule_override` row in `audit_log` — so "show me the overrides" is one query and
the override travels with the invoice it changed.

Invoice numbers are generated for you from an atomic counter (`AINV-2026-08-0034703`).
Pass `invoiceNo` only if you have a reason to choose it.

---

## The rest of the sale lifecycle

```js
await advanceSale(invoiceNo);                       // Pending → Confirm → …
await updateSaleStatus(invoiceNo, 'Shipped');
await recordPayment(invoiceNo, 5000);               // updates the dealer balance too
await cancelSale(invoiceNo, 'Dealer refused delivery');
```

`cancelSale` puts the stock back, reverses the balance and records who and why.
It does not delete the invoice — the Cancel Sales screen reads
`status === 'Cancelled'`. A reason is required.

---

## Stock

No screen writes a stock figure. It records a movement, and stock is the sum of
movements.

```js
await recordMovement({
    product, officeId: 'head', type: 'damage', qty: 12,
    refType: 'damages', refId: 'DMG-001',
});

const rows = await stockReport({ officeId: 'head' });   // the Stock Report table
const central = await centralStockReport();             // one row per product, column per office
const qty = await getStockBalance('AI-000730', 'head');
```

**Pass `qty` as a positive number always.** The direction comes from `type` —
`sale`, `damage`, `repack_out`, `purchase_return` and `transfer_out` are stored
negative. That way the sign can never be applied twice.

---

## Licences (Feature 1)

One collection holds both the company's own licences and dealers', separated by
`scope`. The License screen's two modes are two calls:

```js
const company = await listLicences({ scope: 'company' });
const dealers = await listLicences({ scope: 'dealer' });
```

Rows come back with `status` and `daysRemaining` already worked out.
**Status is never stored** — it is computed from `expiryDate`, so it cannot go
stale the way the hardcoded one in the current `License.js` does.

```js
const summary = await expirySummary();   // { expired, within7, within30, within60, active }
const soon = await listExpiring({ withinDays: 60 });   // the dashboard panel
const report = await complianceReport();               // worst first
```

The rule itself:

```js
const problem = licenceCheckFor(dealerLicences, product, saleDate);
// → null, or { level, code, productId, message, overridable }
```

Pass the **sale date**, not today's. A sale backdated to before the licence
lapsed is lawful, and comparing against today would wrongly refuse it. Which
licence type covers which product category is in `LICENCE_FOR_CATEGORY` in
`constants.js`.

---

## Errors

Everything this layer throws is a `ServiceError` with a `code`:

```js
try {
    await createSale(input);
} catch (err) {
    if (err instanceof ServiceError) {
        setMessage(err.message);        // safe to show the user
        if (err.code === 'VALIDATION') highlight(err.details);
    } else {
        throw err;                      // a real bug — let it surface
    }
}
```

| code | means |
|---|---|
| `NO_ACTOR` | `setActor()` was never called |
| `VALIDATION` | a required field is missing, or a rule block was not resolved |
| `BAD_ENUM` | a status/category/role value is not one of the allowed set |
| `NOT_FOUND` | the referenced document does not exist |
| `CONFLICT` | the ID is taken, or the record is in a state that forbids the change |

---

## Seeding

```bash
node scripts/seed.mjs --dry     # show what would be written
node scripts/seed.mjs           # write it
node scripts/seed.mjs --wipe    # clear the collections first, then write
```

Writes 240 documents: 24 products, 30 dealers, 12 users, 26 licences, 17 invoices
with their lines, and opening stock in three offices. The invoices and dealers
are lifted from `CancelSales.js` and `CustomerLedger.js`, which are the only
sample arrays in the codebase carrying real line items.

Set up for the demonstration: **3 dealers with an expired pesticide licence, 2
expiring within a month, 1 with none at all, and 2 banned products.**

Two things the seed deliberately does not invent, both explained at the top of
`scripts/seed-data.mjs`:

- **Safety data is `null` on every product.** Making up pre-harvest intervals or
  first-aid text would put unverifiable safety claims in front of an examiner.
  Photograph five product labels and fill in `SAFETY_TEMPLATE`. Until then the
  invoice prints its "safety data not recorded" marker — which is Feature 3's
  own third requirement, so nothing is broken in the meantime.
- **`bannedAuthority` is a placeholder.** Replace it with a real DAE
  notification reference before submission.

---

## Tier 2

These are being migrated as the fourteen dead Save buttons of `SCREEN-AUDIT.md`
§2.1 are wired up, in the order §2.1.1 gives. Live so far:

| File | Screen | Notes |
|---|---|---|
| `expenseHeads.js` | Expense Head | The smallest module here. **Read this one first** if you are migrating another |
| `bankAccounts.js` | Bank Account | Refuses a second account with the same number |
| `offers.js` | Offers | `status` is `Publish`/`Unpublish`/`Archived`, not the usual pair. Delete archives |
| `productDemands.js` | Product Demand | Lines live on the document. `stockAtRequest` is a snapshot, not a live figure |
| `suppliers.js` | Supplier | The mirror of `customers.js`. **`balance` is a payable, not a receivable** |
| `openingBalances.js` | Customer / Supplier Opening Balance | One collection, two parties. `signedDelta()` is the only place Debit/Credit becomes a sign |
| `supplierPayments.js` | Supplier Payment | The payable moves on **approve**, not on save |
| `commissions.js` | Customer / Supplier Commission | One collection, two parties. Awarding a commission does **not** move a balance |

Two conventions worth copying:

- **Screens do not write their own loading and error handling.** `useCollection`
  and `useFlash` in `src/components/Notice.js` hold it — see `ExpenseHead.js`,
  which is the whole pattern in 180 lines.
- **A soft delete is whatever this collection's `status` calls it.** `offers`
  needed a third value because "deleted" and "unpublished" are different things.
  Say so in `FIRESTORE-SCHEMA.md` §10 before writing the code.
- **A document that moves a balance writes both in one `writeBatch`.** An
  opening balance that exists without its balance movement, or the reverse, is
  worse than neither. `createOpeningBalance()` and `approveSupplierPayment()`
  are the two worked examples; `createSale()` was the first.
- **Two screens that differ only by a noun are one component with a prop.**
  `OpeningBalance.js` and `Commission.js` each serve a customer screen and a
  supplier screen, the way `Categories.js` serves five.

Still on sample data: purchases, BOMs, repacking, expenses, collections,
delivery, HR — listed in `FIRESTORE-SCHEMA.md` §10. Add a module here when you
migrate one; the pattern to copy is `products.js`, and `Categories.js` is the
screen pattern to copy.
