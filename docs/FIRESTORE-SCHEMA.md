# AgriVision ERP — Firestore Schema

**Date:** 13 August 2026 · **Status:** final for the September submission
**Companions:** `PROJECT-OUTLINE.md` (scope), `UNIQUE-FEATURES.md` (features), `SCREEN-AUDIT.md` (current state)

This document fixes the data model before any persistence code is written. It covers the eight
collections that go into Firestore for this submission, an outline of the collections that follow
later, and — importantly — **the fields required by the three proposed features are defined now**, so
that adding Feature 1, 2 or 3 later needs no migration.

---

## 1. Scope

`PROJECT-OUTLINE.md` §7 commits to Firestore persistence for **a named subset** of collections, with
the rest continuing to display sample data and the written report stating which is which. That
boundary is set here.

| Tier | Collections | State |
|---|---|---|
| **Tier 1** | `products`, `customers`, `licences`, `sales`, `sale_items`, `stock_movements`, `users`, `audit_log` | **In Firestore for this submission** |
| **Tier 2** | everything else (§10) | Sample data held in the page; schema sketched so the shape is known |

Tier 1 is one collection larger than the six named in `INTERNAL-PLAN.md` §2. The two additions are
deliberate: `licences` carries Feature 1, and `stock_movements` is what makes selling reduce stock —
the single most visible defect in `SCREEN-AUDIT.md` §4.1.

---

## 2. Conventions

| Convention | Rule |
|---|---|
| Collection names | lower_snake_case, plural |
| Field names | lowerCamelCase |
| Document IDs | a natural business key where one exists (`AI-000730`, `AIC-000791`, `AINV-2026-08-0034703`), otherwise Firestore auto-ID |
| Timestamps | Firestore `Timestamp`, never a formatted string. The UI formats on display |
| Money | `number`, in Taka, two decimal places. Never a string — `StockReport.js:22` currently stores `'1,10,000.00'`, which cannot be summed |
| Quantities | `number`. Pack notation ("912/24") is presentation, computed from `qty` and `cartonQty` |
| `required` | The write helper rejects the document if the field is missing. Firestore itself does not enforce this; Security Rules do for the fields marked ✔︎R |
| `null` vs absent | **A field that is defined but unknown is written as `null`, never omitted.** Feature 3 depends on this — see §4.1 |
| Enumerations | Stored as strings, with the allowed set listed here and mirrored in one constants file |
| Soft delete | Records are never hard-deleted. `status` changes, or `cancelledAt` is set |

**Denormalisation policy.** Firestore has no joins. Any field a list or report must display is
copied onto the document at write time. Copies are marked *(denorm)* below, together with the source
of truth. Two rules follow:

1. A denormalised copy is **never** edited directly — it is rewritten when the source changes.
2. Where the copy is a deliberate historical record (customer name on an old invoice), that is
   stated explicitly and the copy is **not** refreshed.

---

## 3. Decision log

Five decisions the rest of this document rests on.

### D1 — Master data: keep the `AI-000xxx` catalogue

`SCREEN-AUDIT.md` §4.2 records two disjoint worlds of master data. **World 2 is kept** — the
`AI-000xxx` / `AIC-xxxxxx` catalogue used by Sales, Stock Report, Central Stock, Batch, Repacking,
Damage, Purchase, Product Demand, Offers and Customer Ledger.

Reasons:

- World 2 carries bulk / packet / label / carton variants. **A bill of materials cannot be expressed
  in World 1 at all** — there is no way to write a recipe for "Urea Fertilizer".
- `AI-000xxx` is a real coding scheme; `SKU-T100` is placeholder.
- World 2 matches a pesticide and micronutrient business, which is the premise
  `UNIQUE-FEATURES.md` §5 uses to reject the subsidised-fertiliser quota feature.
- World 2 is used by roughly fifteen screens, World 1 by one.

**But one field is carried across.** `Product.js:4` has `category` with values Fertilizer /
Pesticide / Seeds, and `UNIQUE-FEATURES.md` §3 identifies it as half of Feature 1 ("Product
classification for a licence rule is therefore already present"). Every product in the kept
catalogue must be given a `category`. Without it Feature 1 has nothing to gate on.

**Work implied:** seed ~20 products and ~15 dealers under the World 2 names, each with a `category`.

### D2 — `sale_items` is a top-level collection, not a subcollection

- One of the eight reports kept is Products Sales, which queries at item level across sales. As a
  subcollection this needs a `collectionGroup` query plus a composite index; as a top-level
  collection it is an ordinary query.
- `INTERNAL-PLAN.md` §2 already names `sales_items`.
- Sales are never deleted — they are cancelled — so a subcollection's cascade behaviour buys nothing.
- `officerId`, `territoryId`, `areaId` and `saleDate` are denormalised onto each item so reports
  need no join.

### D3 — Cancelled sales are not a separate collection

`sales.status = 'Cancelled'` plus `cancelledAt` / `cancelledBy` / `cancelReason`. The Cancel Sales
screen queries `where('status', '==', 'Cancelled')`. The present separate array at
`CancelSales.js:14` is exactly why cancelling in Sales never appears there.

### D4 — One `licences` collection with a `scope` field

Company licences and dealer licences share every field. A single collection means the License
screen's two modes read from one place, and the dashboard's 60 / 30 / 7-day expiry panel is one query
covering both.

### D5 — Licence status is derived, never stored

Computed from `expiryDate` at read time. `License.js:5-8` currently hardcodes
`status: 'Active' | 'Expired'`, which is a defect — a licence that expires tomorrow still reads
"Active" forever. Storing a derived status guarantees it goes stale.

---

## 4. Tier 1 collections

Legend: **✔︎** required · **✔︎R** required and enforced by Security Rules · *(denorm)* denormalised copy

### 4.1 `products`

**Document ID:** the product code, e.g. `AI-000730`

| Field | Type | Req | Notes |
|---|---|---|---|
| `name` | string | ✔︎ | `Agri Zink 1KG` |
| `code` | string | ✔︎ | Same as the document ID; duplicated so it can be queried and ordered |
| `category` | string | ✔︎R | `Pesticide` \| `Fertilizer` \| `Seed` \| `PGR` \| `Packaging` \| `Gift` — **the field Feature 1 gates on** (D1) |
| `brandId` | string \| null | | → `brands` |
| `originId` | string \| null | | → `origins` |
| `unitId` | string | ✔︎ | `KG` \| `GM` \| `LTR` \| `ML` \| `PCS` |
| `packSize` | string | ✔︎ | `1 KG`, `100 Ml` — display form |
| `packQty` | number | ✔︎ | Numeric pack size, for stock arithmetic: `1`, `100` |
| `type` | string | ✔︎ | `Finished` \| `Raw Material` \| `Carton` \| `Label` — the Type filter at `StockReport.js:78` |
| `cartonQty` | number | ✔︎ | Pieces per carton. Central Stock's "Crtn, PCS" is derived from this |
| `mrp` | number | ✔︎ | Selling price |
| `buyPrice` | number | | Average cost; recomputed from `stock_movements` |
| `status` | string | ✔︎ | `Active` \| `Inactive` |
| `createdAt` / `updatedAt` | timestamp | ✔︎ | |

**Feature 2 — banned / de-registered product** (defined now, populated when the feature is built)

| Field | Type | Req | Notes |
|---|---|---|---|
| `bannedFrom` | timestamp \| null | ✔︎ | Sale and purchase are refused **on and after** this date. `null` = not banned |
| `bannedReason` | string \| null | ✔︎ | Shown on the block message |
| `bannedAuthority` | string \| null | ✔︎ | The issuing notification, e.g. "DAE notification 2026/14" |

> The date-effective behaviour is the whole point (`UNIQUE-FEATURES.md` §5). A sale dated **before**
> `bannedFrom` stays valid and still prints. The rule compares `sale.saleDate` against
> `product.bannedFrom` — never the current date — and the product stays selectable so the block is
> visible rather than hidden.

**Feature 3 — Bengali safety panel** (defined now)

| Field | Type | Req | Notes |
|---|---|---|---|
| `whoClass` | string \| null | ✔︎ | `Ia` \| `Ib` \| `II` \| `III` \| `U` — WHO hazard class. Drives the panel colour |
| `signalWordBn` | string \| null | ✔︎ | অতি বিষাক্ত \| বিষাক্ত \| সতর্কতা |
| `phiDays` | number \| null | ✔︎ | Pre-harvest interval, days |
| `reentryHours` | number \| null | ✔︎ | Re-entry period, hours |
| `firstAidBn` | string \| null | ✔︎ | First-aid note in Bengali |
| `dosageBn` | string \| null | ✔︎ | Dose per decimal / bigha |
| `approvedCropsBn` | array\<string\> \| null | ✔︎ | |

> **Why `null` and not an absent field.** Feature 3's third requirement is that a product with no
> safety data prints a visible *"safety data not recorded"* marker rather than silently printing
> nothing. That is only distinguishable from a bug if "unknown" is recorded explicitly. **Write
> `null`.** §9.3 depends on this.

**Feature 4 — expiry** (cut from this submission; the field is reserved so no migration is needed)

| Field | Type | Req | Notes |
|---|---|---|---|
| `requiresExpiry` | boolean | | Default `false`. Whether goods receipt must capture manufacturing and expiry dates |

---

### 4.2 `customers` (dealers)

**Document ID:** the dealer code, e.g. `AIC-000791`

| Field | Type | Req | Notes |
|---|---|---|---|
| `name` | string | ✔︎ | `M/s- Nijhum Traders` |
| `code` | string | ✔︎ | Same as the document ID |
| `phone` | string | ✔︎ | |
| `contactPerson` | string \| null | | |
| `email` | string \| null | | |
| `address` | string | ✔︎ | Shop address, printed on the invoice |
| `territoryId` | string | ✔︎ | → `territories` |
| `areaId` | string | ✔︎R | → `areas`. **Area Managers are scoped on this** |
| `officerId` | string | ✔︎R | → `users`. **Sales Officers are scoped on this** |
| `openingBalance` | number | ✔︎ | Default `0` |
| `balance` | number | ✔︎ | *(denorm)* Current receivable. Source of truth is the sum of ledger entries; recomputed on each sale and collection |
| `creditLimit` | number | ✔︎ | Default `0` = no limit. The credit-limit rule reads this |
| `status` | string | ✔︎ | `Active` \| `Inactive` |
| `createdAt` / `updatedAt` | timestamp | ✔︎ | |

Dealer licences are **not** embedded here — a dealer may hold several (pesticide, fertiliser, seed),
each with its own number and expiry. They live in `licences` with `scope: 'dealer'` (D4).

---

### 4.3 `licences`

**Document ID:** auto · **Carries Feature 1**

| Field | Type | Req | Notes |
|---|---|---|---|
| `scope` | string | ✔︎ | `company` \| `dealer` (D4) |
| `holderId` | string \| null | ✔︎ | `null` when `scope = 'company'`; the dealer code when `scope = 'dealer'` |
| `holderName` | string | ✔︎ | *(denorm from `customers.name`, or the company name)* |
| `licenceType` | string | ✔︎ | `Pesticide` \| `Fertilizer` \| `Seed` \| `Trade` \| `VAT` \| `Import` |
| `licenceNo` | string | ✔︎ | |
| `issuingAuthority` | string | ✔︎ | DAE, DNCC, NBR, MOC … |
| `issueDate` | timestamp | ✔︎ | |
| `expiryDate` | timestamp | ✔︎ | **The field the rule reads** |
| `documentUrl` | string \| null | | Firebase Storage path for the scanned licence |
| `note` | string \| null | | |
| `createdAt` / `updatedAt` | timestamp | ✔︎ | |

**No `status` field** (D5). Derived at read time:

```
expiryDate <  today            → Expired
expiryDate <= today + 7 days   → Expiring (7)
expiryDate <= today + 30 days  → Expiring (30)
expiryDate <= today + 60 days  → Expiring (60)
otherwise                      → Active
```

**Licence type → product category mapping.** This lives in one constants file in the code, **not** in
Firestore — it is a rule, not data, and putting it in the database invites someone to edit it into
inconsistency mid-demonstration.

| Licence type | Authorises `product.category` |
|---|---|
| `Pesticide` | `Pesticide`, `PGR` |
| `Fertilizer` | `Fertilizer` |
| `Seed` | `Seed` |
| *(none required)* | `Packaging`, `Gift` |

The Feature 1 rule reads: for each line, look up the licence type that authorises the product's
category; find the dealer's licence of that type; block if it is missing or expired **as at the sale
date**.

---

### 4.4 `sales`

**Document ID:** the invoice number, e.g. `AINV-2026-08-0034703`

| Field | Type | Req | Notes |
|---|---|---|---|
| `invoiceNo` | string | ✔︎ | Same as the document ID |
| `customerId` | string | ✔︎ | → `customers` |
| `customerName` | string | ✔︎ | *(denorm — **historical, never refreshed**)* |
| `customerPhone` | string | ✔︎ | *(denorm — historical)* |
| `customerAddress` | string | ✔︎ | *(denorm — historical)* |
| `officerId` | string | ✔︎R | → `users`. Sales Officers are scoped on this |
| `officerName` | string | ✔︎ | *(denorm)* |
| `territoryId` | string | ✔︎ | *(denorm from the customer)* — territory reports |
| `areaId` | string | ✔︎R | *(denorm)* — Area Managers are scoped on this |
| `officeId` | string | ✔︎ | `head` \| `jessore` \| `jamalpur` |
| `saleDate` | timestamp | ✔︎ | **Every date-effective rule compares against this, not `Date.now()`** |
| `dueDate` | timestamp \| null | | |
| `paymentType` | string | ✔︎ | `Cash` \| `Credit` |
| `subTotal` | number | ✔︎ | Sum of `sale_items.lineTotal` |
| `discount` | number | ✔︎ | Default `0` |
| `shipping` | number | ✔︎ | Default `0` |
| `vat` | number | ✔︎ | Default `0` |
| `grandTotal` | number | ✔︎ | `subTotal − discount + shipping + vat` |
| `paidAmount` | number | ✔︎ | Default `0` |
| `dueAmount` | number | ✔︎ | `grandTotal − paidAmount`. Replaces the fabricated `grandTotal * 3.5` at `Sales.js:143` |
| `status` | string | ✔︎ | `Pending` \| `Confirm` \| `Processing` \| `Scanning` \| `Scanned` \| `Picked` \| `Shipped` \| `Delivered` \| `Cancelled` |
| `source` | string | ✔︎ | `Admin` \| `App` |
| `cancelledAt` | timestamp \| null | | Set with `status = 'Cancelled'` (D3) |
| `cancelledBy` | string \| null | | → `users` |
| `cancelReason` | string \| null | | Required when cancelling |
| `ruleChecks` | array\<map\> | ✔︎ | See below. Empty array when nothing fired |
| `createdAt` / `createdBy` | timestamp / string | ✔︎ | |
| `updatedAt` | timestamp | ✔︎ | |

**`ruleChecks` — the evidence for Feature 1.** Whatever `checkSaleRules()` returned is stored on the
sale, including any override:

```js
ruleChecks: [
  {
    level: 'block',                  // 'block' | 'warn'
    code: 'LICENCE_EXPIRED',         // LICENCE_EXPIRED | LICENCE_MISSING |
                                     // PRODUCT_BANNED | CREDIT_LIMIT_EXCEEDED
    productId: 'AI-000730',
    message: 'Pesticide licence expired on 2026-07-31',
    overridable: true,
    overridden: true,
    overrideBy: 'uid_areamanager_01',
    overrideReason: 'Licence renewal receipt shown; original due next week',
    overrideAt: Timestamp
  }
]
```

> `INTERNAL-PLAN.md` §3 warns that an override which is not logged is not a control, and that an
> examiner is likely to ask to see the log immediately after seeing the override. Keeping the record
> **both** here and in `audit_log` means the answer is on the invoice itself — the override travels
> with the transaction it modified.

---

### 4.5 `sale_items`

**Document ID:** auto · **Top-level collection** (D2)

| Field | Type | Req | Notes |
|---|---|---|---|
| `saleId` | string | ✔︎ | → `sales` (the invoice number) |
| `invoiceNo` | string | ✔︎ | *(denorm)* |
| `lineNo` | number | ✔︎ | 1-based, for stable ordering |
| `productId` | string | ✔︎ | → `products` |
| `productName` | string | ✔︎ | *(denorm — **historical, never refreshed**)* |
| `productCode` | string | ✔︎ | *(denorm)* |
| `category` | string | ✔︎ | *(denorm)* — lets the compliance report group by category without a join |
| `unitId` / `packSize` | string | ✔︎ | *(denorm)* |
| `qty` | number | ✔︎ | Pieces |
| `cartonQty` | number | ✔︎ | *(denorm)* — reproduces "2 * 24 = 48" on the invoice |
| `unitPrice` | number | ✔︎ | Price at the moment of sale, not the current MRP |
| `discount` | number | ✔︎ | Default `0` |
| `lineTotal` | number | ✔︎ | `qty × unitPrice − discount` |
| `saleDate` | timestamp | ✔︎ | *(denorm)* — Products Sales Report filters on this |
| `officerId` / `territoryId` / `areaId` | string | ✔︎ | *(denorm)* — officer / territory / area product reports |
| `safetySnapshot` | map \| null | ✔︎ | See below |

**`safetySnapshot` — Feature 3's historical record.** A copy of the product's safety fields at the
moment of sale:

```js
safetySnapshot: {
  whoClass: 'II',
  signalWordBn: 'বিষাক্ত',
  phiDays: 14,
  reentryHours: 24,
  firstAidBn: '…',
  dosageBn: '…'
}
```

`null` means the product had no safety data. Reprinting an old invoice must show what was printed
originally, so this is **never refreshed** when the product record changes. Without it, correcting a
PHI value next month would silently rewrite last month's invoices.

---

### 4.6 `stock_movements`

**Document ID:** auto · **The only place stock is ever written**

| Field | Type | Req | Notes |
|---|---|---|---|
| `productId` | string | ✔︎ | → `products` |
| `productCode` / `productName` | string | ✔︎ | *(denorm)* |
| `officeId` | string | ✔︎ | `head` \| `jessore` \| `jamalpur` — the three offices in Central Stock |
| `type` | string | ✔︎ | `opening` \| `purchase` \| `purchase_return` \| `sale` \| `sale_return` \| `repack_in` \| `repack_out` \| `damage` \| `transfer_in` \| `transfer_out` |
| `qty` | number | ✔︎ | **Always signed.** `purchase` and `repack_in` positive; `sale`, `damage` and `repack_out` negative. Stock is then a plain sum, and the sign can never be applied twice |
| `unitCost` | number \| null | | For weighted-average cost |
| `refType` | string | ✔︎ | `sales` \| `purchases` \| `repackings` \| `damages` \| `sale_returns` … |
| `refId` | string | ✔︎ | The document ID in that collection. **Every movement references a document** — `PROJECT-OUTLINE.md` §3.6 requires it: no free-hand adjustment |
| `movedAt` | timestamp | ✔︎ | |
| `createdBy` | string | ✔︎ | → `users` |

**Feature 4 fields** (cut; reserved so no migration is needed): `lotNo` (string \| null),
`mfgDate` (timestamp \| null), `expiryDate` (timestamp \| null).

**Stock Report is computed from this collection**, replacing the hardcoded strings at
`StockReport.js:22-38`. At the demonstration's data volume a client-side sum per product is fast
enough. If it stops being fast enough, add a denormalised `stock_balances/{productId}_{officeId}`
document updated in the same batch — **do not** put a running total on `products`, because two
concurrent sales would then race.

---

### 4.7 `users`

**Document ID:** the Firebase Auth UID

| Field | Type | Req | Notes |
|---|---|---|---|
| `name` | string | ✔︎ | |
| `email` | string | ✔︎ | Matches the Auth record |
| `role` | string | ✔︎R | `Super Admin` \| `Managing Director` \| `Area Manager` \| `Sales Officer` \| `Accountant` \| `Storekeeper` \| `Delivery Man` \| `Dealer` — the eight actors in `PROJECT-OUTLINE.md` §3 |
| `permissions` | string \| array\<string\> | ✔︎ | `'all'`, or the list of menu paths. **Keep the present shape** — `ProtectedRoute.js` and the Admin permission editor both work against it |
| `officeId` | string \| null | | |
| `areaId` | string \| null | | Set for Area Managers; scopes every query |
| `territoryId` | string \| null | | Set for Sales Officers |
| `employeeId` | string \| null | | → `employees` |
| `customerId` | string \| null | | Set for the `Dealer` role (the Phase 2 portal) |
| `status` | string | ✔︎ | `Active` \| `Inactive` |
| `createdAt` / `updatedAt` | timestamp | ✔︎ | |

> **There is no `password` field.** Firebase Authentication holds credentials. `AuthContext.js:67`
> currently compares plaintext passwords out of `localStorage` under the key `av_users`; that path is
> removed, along with the `defaultUsers` array at `AuthContext.js:16`.
> `PROJECT-OUTLINE.md` §8 requires hashed storage.

---

### 4.8 `audit_log`

**Document ID:** auto · Append-only. Nobody, including Super Admin, may update or delete
(`PROJECT-OUTLINE.md` §3.1).

| Field | Type | Req | Notes |
|---|---|---|---|
| `at` | timestamp | ✔︎ | Server timestamp |
| `userId` | string | ✔︎ | |
| `userName` / `userRole` | string | ✔︎ | *(denorm — historical; the log must stay readable after a role change)* |
| `action` | string | ✔︎ | `create` \| `update` \| `delete` \| `login` \| `logout` \| `approve` \| **`rule_override`** |
| `collection` | string | ✔︎ | |
| `docId` | string | ✔︎ | |
| `before` | map \| null | ✔︎ | `null` on create. `PROJECT-OUTLINE.md` §8 requires the old value |
| `after` | map \| null | ✔︎ | `null` on delete |
| `reason` | string \| null | ✔︎ | **Required when `action = 'rule_override'`** — enforced in Security Rules |
| `userAgent` | string \| null | | |

---

## 5. Relationship map

```
users ──officerId──────────────┐
  │                            ▼
  │                        customers ──customerId──► sales ──saleId──► sale_items
  │                            │                       │                   │
  │                       holderId (scope='dealer')     │              productId
  │                            ▼                        │                   ▼
  └──────────────────────► licences                     │              products
                               ▲                        │                   ▲
                    (scope='company', holderId=null)     │                   │
                                                        └──refId──► stock_movements
                                                                            │
  audit_log ──collection + docId──► (any document)                    productId
```

| Relationship | Implementation | Why |
|---|---|---|
| customer → sales | reference (`sales.customerId`) + denormalised name/phone/address | The copies are a historical record; renaming a dealer must not rewrite old invoices |
| sale → items | **top-level `sale_items` with `saleId`** (D2) | Products Sales queries items across sales |
| customer → licences | reference (`licences.holderId`) | One dealer holds several licences; one query serves both the register and the dashboard panel |
| product → sale_items | reference + denormalised name/code/category + `safetySnapshot` | Reports avoid joins; the snapshot preserves what was printed |
| everything → stock | **`stock_movements` only** | One ledger, one sum. No screen writes a stock figure |
| sale → cancellation | `status` + `cancelledAt/By/Reason` (D3) | Not a separate collection |
| any write → audit | `audit_log.collection` + `docId` | Polymorphic; no reference type needed |

---

## 6. Composite indexes

Firestore creates single-field indexes automatically. These composites must be declared:

| Collection | Fields | Serves |
|---|---|---|
| `sales` | `officerId` ASC, `saleDate` DESC | Sales Officer's own list; Officer Wise Sales |
| `sales` | `areaId` ASC, `saleDate` DESC | Area Manager scoping; Area Wise Sales |
| `sales` | `status` ASC, `saleDate` DESC | The eight status tabs; Cancel Sales |
| `sales` | `customerId` ASC, `saleDate` DESC | Customer Wise Sales; the customer ledger |
| `sales` | `dueAmount` >, `saleDate` DESC | Due Report, Due Invoices |
| `sale_items` | `productId` ASC, `saleDate` DESC | Products Sales Report |
| `sale_items` | `saleId` ASC, `lineNo` ASC | Invoice line ordering |
| `sale_items` | `territoryId` ASC, `saleDate` DESC | Territory Wise Product Sales |
| `stock_movements` | `productId` ASC, `officeId` ASC, `movedAt` DESC | Stock Report, Central Stock |
| `licences` | `scope` ASC, `expiryDate` ASC | The dashboard expiry panel; the compliance report |
| `licences` | `holderId` ASC, `licenceType` ASC | **The Feature 1 lookup — the hot path** |
| `audit_log` | `action` ASC, `at` DESC | "Show me the overrides" during the demonstration |
| `audit_log` | `collection` ASC, `docId` ASC, `at` DESC | Per-record history |

---

## 7. Security Rules — outline

Rules enforce the access matrix in `PROJECT-OUTLINE.md` §4 on the server; the route guard only shapes
the UI. Full rules are written in Week 2; the shape is:

```
function user()      { return get(/databases/$(db)/documents/users/$(request.auth.uid)).data }
function role()      { return user().role }
function isAdmin()   { return role() in ['Super Admin', 'Managing Director'] }
function myArea(a)   { return role() == 'Area Manager' && user().areaId == a }
function mine(o)     { return role() == 'Sales Officer' && user().officerId == o }
```

| Collection | Read | Write |
|---|---|---|
| `products`, `categories`, … | any signed-in user | Super Admin only |
| `customers` | Admin, or `myArea(areaId)`, or `mine(officerId)` | same, minus Sales Officer delete |
| `licences` | any signed-in user (the sale rule needs it) | Super Admin, Area Manager, Accountant |
| `sales` | Admin, or `myArea`, or `mine` | create: Sales Officer for own territory · update: Area Manager and above · **delete: nobody** |
| `sale_items` | as the parent sale | written only in the same batch as the sale |
| `stock_movements` | Admin, Storekeeper, Accountant | **create only** — never update or delete |
| `users` | self, or Super Admin | Super Admin only |
| `audit_log` | Admin | **create only.** `reason` required when `action == 'rule_override'` |

Two invariants worth stating in the report: **`audit_log` and `stock_movements` are append-only** —
history and stock cannot be rewritten, only added to. That is what makes the audit trail an actual
control rather than a display.

---

## 8. The eight reports and the queries behind them

Per the decision in `SCREEN-AUDIT.md` §7, eight reports are built for real; the other 32 routes leave
the menu and are listed in the written report as future work.

| # | Report | Query |
|---|---|---|
| 1 | Sales | `sales` where `saleDate` in range, ordered `saleDate` DESC |
| 2 | Products Sales | `sale_items` where `saleDate` in range, grouped by `productId` |
| 3 | Officer Wise Sales | `sales` where `saleDate` in range, grouped by `officerId` |
| 4 | Customer Wise Sales | `sales` where `saleDate` in range, grouped by `customerId` |
| 5 | Collection | `collections` (Tier 2 — sample data until it is migrated; label it) |
| 6 | Due | `sales` where `dueAmount > 0`, grouped by `customerId` |
| 7 | Sales Return | `sale_returns` (Tier 2 — sample data; label it) |
| 8 | **Compliance** *(new)* | `licences` where `scope == 'dealer'` ordered by `expiryDate`, joined with sales made under an expired licence via `sales.ruleChecks` |

Report 8 is Feature 1's sixth deliverable in `UNIQUE-FEATURES.md` §5 and is the only genuinely new
report. Reports 5 and 7 read Tier 2 collections and **must be labelled as sample data on screen** —
`UNIQUE-FEATURES.md` §9 is explicit that examiners test the boundary, and that an undisclosed one
costs more than the limitation.

---

## 9. Seed data sourcing

Target: **20 products** (2 of them banned, 5 carrying safety data) and **15 dealers** (5 with licence
problems). This section separates what can be authored in-house from what needs an outside source.

### 9.1 What you can supply yourself — no external source needed

| Collection | Fields |
|---|---|
| `products` | `name`, `code`, `packSize`, `packQty`, `cartonQty`, `unitId`, `type`, `brandId`, `originId`, `mrp`, `buyPrice`, `status` |
| `products` | `category` — **printed on the packet**; a fertiliser sack and a pesticide bottle are not confusable |
| `customers` | `name`, `code`, `phone`, `address`, `territoryId`, `areaId`, `officerId`, `openingBalance`, `creditLimit`, `status` |
| `users`, `offices`, `regions`, `areas`, `territories`, `employees` | all fields |
| `sales`, `sale_items` | **copy from the existing code.** `Sales.js:179` (12 confirmed + 22 delivered invoices with real dealer names, addresses and amounts), `CustomerLedger.js:7` (30 dealers with debit/credit/balance), `CancelSales.js:15` (17 invoices *with real line items*), `Repacking.js:21`, `ProductDemand.js:17`. This is the fastest seed data available and it already looks convincing |
| `products` | `bannedFrom`, `bannedReason` — you choose the two products and the dates |

Only `bannedAuthority` in that last row needs an outside reference; see below.

### 9.2 What needs an external source

| Field | Why it cannot be authored | Recommended source |
|---|---|---|
| `whoClass` | An international classification keyed to the active ingredient. Guessing produces a claim that is checkable and wrong | **WHO Recommended Classification of Pesticides by Hazard** — published by WHO, free PDF, lists ingredients against classes Ia/Ib/II/III/U. `UNIQUE-FEATURES.md` §7 rates this "Confident — cite the WHO classification document directly; it is public" |
| `signalWordBn` | Derived from `whoClass`, but the Bengali wording must be the standard one, not a translation you invent | **The product label.** Mapping in practice: Ia/Ib → অতি বিষাক্ত · II → বিষাক্ত · III/U → সতর্কতা |
| `phiDays` | Varies by product **and crop** — the same ingredient has a different pre-harvest interval on rice and on vegetables | **The manufacturer's label or leaflet** is the authoritative source. Failing that, the Department of Agricultural Extension's approved pesticide list |
| `reentryHours` | Same | Label |
| `firstAidBn`, `dosageBn`, `approvedCropsBn` | Same | Label |
| `bannedAuthority` | A government notification number | **DAE / Plant Protection Wing** list of banned or withdrawn pesticides. `UNIQUE-FEATURES.md` §7 already flags "obtain one or two actual notifications to cite as examples" |

> **The cheapest route — about an hour.** Walk into any pesticide shop and **photograph the labels**
> of five or six products, with permission. A single label carries `whoClass`, the Bengali signal
> word, PHI, first aid and approved crops — **all five at once**, in the exact wording a Bangladeshi
> farmer sees. While you are there, photograph the dealer's licence
> (`UNIQUE-FEATURES.md` §7 and §12 both ask for this). One visit supplies the evidence base for
> Feature 1 *and* Feature 3, and turns a feature list into requirements grounded in evidence.

### 9.3 If no reliable source can be obtained — Feature 3 fallbacks

Best to worst.

**Option 1 — real data on five products, `null` on the rest.** ⭐ Recommended.

Feature 3's third requirement already is that missing safety data prints a visible marker. Fill five
products from five photographed labels; leave the other fifteen `null`. The invoice then shows both
outcomes: a complete Bengali panel, and *"নিরাপত্তা তথ্য সংরক্ষিত নেই"* where data is absent.

This is not a shortfall to apologise for. It demonstrates that the system does not quietly hide
incomplete data — which is a stronger statement than twenty products with plausible-looking numbers.
**Cost: one shop visit.**

**Option 2 — narrow the claim to a dosage and first-aid panel.**

Drop `whoClass` — it is the single hardest field to verify and the only one requiring the WHO
document. Keep the Bengali dose and first-aid note, both read directly off the label. Colour-code the
panel by `product.category` (pesticide red, fertiliser green) instead of by hazard class. The visual
impact on the invoice is nearly identical and the verification risk falls sharply.

**Option 3 — drop Feature 3 and put the time into Features 1 and 2.**

`UNIQUE-FEATURES.md` §5 already states the honest limit in its own words: Bangladesh's labelling
requirements attach to the **container**, not the invoice, so Feature 3 is *derived from* a labelling
regime rather than *required by* one. The central claim in §11 — that the system refuses to let an
unlawful sale happen — stands on Features 1 and 2 alone. Dropping Feature 3 frees 1.5 days for the
compliance report and rehearsal, and costs nothing that was promised.

> **What not to do: never invent safety data.** An incorrect pre-harvest interval or first-aid
> instruction is exactly the kind of thing an agricultural supervisor will recognise, and being
> caught turns the feature from a strength into a liability. The reasoning is identical to
> `UNIQUE-FEATURES.md` §7: *"Do not submit a citation taken from this document unchecked."*

---

## 10. Tier 2 — collections that follow later

Shape recorded so Tier 1 does not have to change when these are migrated. The rest continue to
display sample data for this submission, and the written report says so.

**A ✅ marks a collection that is now live** — a service module exists beside `products.js`, the
screen reads and writes it, and the row below is its full shape rather than a sketch. These were
migrated while wiring the fourteen dead Save buttons of `SCREEN-AUDIT.md` §2.1; the order is §2.1.1.

| Collection | Key fields | Replaces |
|---|---|---|
| **`suppliers`** ✅ | `code` ✔︎ (`AIS-000085`), `name` ✔︎, `phone` ✔︎, `address`, `area`, `email`, `contactPerson`, `openingBalance`, `balance`, `status`. **Document ID is the code**, as `customers` does. Built the same way as `customers` because §2.1.1 group B needs it before any of its three screens | `Supplier.js:3` |
| | **`balance` on a supplier is a payable and on a customer a receivable** — opposite directions, and the one thing to get right here. A supplier's balance goes **up** when we owe them more. `adjustSupplierBalance()` takes the signed delta and nothing else writes the field | |
| `purchases` | purchaseNo, supplierId, invoiceNo, purchaseDate, amount, status, officeId | `Purchase.js:33` |
| `purchase_items` | purchaseId, productId, qty, unitPrice, lineTotal, *(`lotNo`, `mfgDate`, `expiryDate` for Feature 4)* | `Purchase.js:89` (currently one hardcoded row) |
| `purchase_returns` | returnNo, purchaseId, supplierId, returnDate, reason, amount, status, note | `PurchaseReturn.js`. Writes `purchase_return` movements |
| **`boms`** | bomNo, productId, items[{productId, ratio}], effectiveFrom | `Batch.js:8` — **renamed from "Batch"**, see decision 2 in `SCREEN-AUDIT.md` §7 |
| `repackings` | repackNo, bomId, outputProductId, qty, cartonQty, status, note | `Repacking.js:21`. Writes `repack_in` / `repack_out` movements |
| **`offers`** ✅ | `code` ✔︎ (`AIOF-000292`, from the `offers` counter), `name` ✔︎, `buyModule` (`Product`\|`Category`\|`Brand`), `buy{type` (`Product`\|`Amount`\|`Quantity`)`, productId, label` *(denorm)*`, qty}`, `gift{type, productId, label` *(denorm)*`, qty, extra}`, `paymentTypes[]` ⊂ `Cash`,`Credit` (the UI's "Both" is both entries, not a third value), `offerType` (`Instant Deal`\|`Closing Deal`), `startDate`, `endDate`, `status`, `noteBn`. **Document ID is the code.** Two fields the original sketch missed and the screen needs: `offerType`, because the Bengali notes turn on it — an instant deal gives the gift at the till, a closing deal at offer close — and `buy.qty`/`gift.qty`, which the list renders but the form never collected | `Offers.js:14` |
| | `status` is `Publish` \| `Unpublish` \| `Archived`, **not** the usual `Active`/`Inactive`: an offer has a publish state of its own, and the screen's Delete button needs somewhere to put a withdrawn offer that is not "unpublished". `Archived` is this collection's soft delete (§2) | |
| `expenses` | headId, headName *(denorm)*, amount, date, receivedBy, status, note | `Expense.js` |
| **`expense_heads`** ✅ | `name` ✔︎, `status` (`Active`\|`Inactive`). Auto-ID — a head is renamed often enough that the name is not a safe document key, and `expenses.headId` must survive a rename. `expenses` carries `headName` as a denormalised copy for the list, refreshed from here | `ExpenseHead.js:6` |
| `collections` | mrn, customerId, officerId, amount, paymentType, collectedAt, status | `CashCollection.js` |
| **`supplier_payments`** ✅ | `supplierId` ✔︎, `supplierName`/`supplierCode` *(denorm)*, `amount` ✔︎, `payMethod` ✔︎ (`Cash`\|`bKash`\|`Nagad`\|`Bank Transfer`\|`Cheque`\|`RTGS` — **not** the two-value `PAYMENT_TYPE` that sales use), `payDate` ✔︎, `bankAccountId` + `bankAccountLabel` *(denorm)*, `bankName`, `txnId`, `status` (`Pending`\|`Approved`\|`Cancelled`), `note`. Auto-ID. **The supplier's balance moves on approval, not on entry** — an unapproved payment is a claim, and posting it would understate the payable | `SupplierPayment.js` |
| | The screen's "Account Expense" selector was a hardcoded list of the company's own bank accounts, so it is `bankAccountId` pointing at `bank_accounts`. If those `AIE-…` codes turn out to mean an expense account rather than a bank account, this is the field to change | |
| **`bank_accounts`** ✅ | `name` ✔︎, `number` ✔︎, `bank` ✔︎, `branch` ✔︎, `status` (`Active`\|`Inactive`). Auto-ID. `number` is unique and the service refuses a second account carrying it — an account number entered twice is a typo, and Supplier Payment picks the account by it | `BankAccount.js:6` |
| **`opening_balances`** ✅ | **`party`** ✔︎ (`customer` \| `supplier`), `partyId` ✔︎, `partyName`/`partyCode` *(denorm)*, `type` ✔︎ (`Debit`\|`Credit`), `amount` ✔︎, `date` ✔︎, `status` (`Approved`\|`Cancel`), `note`. Auto-ID | `CustomerOpeningBalance.js:11`, `SupplierOpeningBalance.js`. **One collection for both**, following D4 — the same reason `licences` uses `scope` rather than splitting in two. Posting an entry also moves the party's `balance` |
| | **What `type` does to the balance depends on `party`, and this is the easy thing to get backwards.** A customer balance is a receivable and a supplier balance is a payable, so a `Debit` raises a customer's and a `Credit` raises a supplier's. One function, `signedDelta()`, holds both cases and every caller goes through it. Cancelling an approved entry writes the reversal | |
| | Both screens' Add forms asked for a **payment type** — Cash / bKash / Nagad — which an opening balance does not have; the column the table renders is `Debit`/`Credit`. A saved row would have shown a blank Type badge, the §2.3 defect. The forms collect `type` now | |
| **`commissions`** ✅ | `code` ✔︎ (`AISC-008113` / `AICC-…`, from a counter per party), **`party`** ✔︎ (`customer`\|`supplier`), `partyId` ✔︎, `partyName`/`partyCode` *(denorm)*, `basis` ✔︎ (`Yearly`\|`Purchase`\|`Invoice`\|`Product`\|`Travel`), `method` ✔︎ (`Amount`\|`Percentage`), `percent` (when `method` is `Percentage`), `baseAmount` (what the percentage was taken of), `productId` + `productName` *(denorm)* (when `basis` is `Product`), `refs[]`, `amount` ✔︎, `date` ✔︎, `status` (`Pending`\|`Approved`\|`Cancelled`), `note`. Auto-ID | `CustomerCommission.js`, `SupplierCommission.js`. **One collection for both**, same reasoning as `opening_balances` |
| | The screens showed the type as a pair of badges — `Yearly`+`Amount`, `Purchase`+`Percentage` — from a single `types[]` array. Those are two independent choices, so they are two fields. `refs[]` holds the purchase or invoice numbers the commission was worked out from; it stays a **list of strings until `purchases` lands in §2.1.1 group D**, at which point it becomes a list of references | |
| `sale_returns` | returnNo, saleId, customerId, reason, amount, warehouseInDate, status | `SalesReturn.js`. Writes `sale_return` movements |
| `damages` | productId, qty, buyPrice, total, reason, officeId | `Damage.js:3`. Writes `damage` movements |
| `delivery_orders`, `delivery_challans`, `delivery_returns` | **must reference `sales.invoiceNo`**, not a separate `ADO-…` series | `Delivery.js:10` |
| **`product_demands`** ✅ | `requestNo` ✔︎ (`AIPR-000217`, from the `product_demands` counter), `fromOfficeId` ✔︎, `toOfficeId` ✔︎ (both from `OFFICE`, and they must differ), `expectedDate` ✔︎, `requestedAt`, `status` (`Pending`\|`Approved`\|`Received`\|`Cancel`), `note`, `items[{productId, name` *(denorm)*`, packSize` *(denorm)*`, cartonQty` *(denorm)*`, demandQty, stockAtRequest}]`. **Document ID is the request number.** `items` is an embedded array, not a subcollection: a request is read and printed whole, never queried line by line, and it is small. `stockAtRequest` is a snapshot of `getStockBalance(productId, fromOfficeId)` taken when the request was raised — the detail page prints what the stock *was*, which is the figure the request was justified by, and re-deriving it later would show a different number | `ProductDemand.js:36`. Items are per-request, closing §4.3 — the shared array at `:17` that made every request show the same sixteen lines is gone |
| `employees`, `hr_visits`, `hr_attendance`, `hr_payroll` | | `Employee.js:3`, `HR.js:4` |
| `offices`, `regions`, `areas`, `territories` | Replaces the three broken Mapping forms | `Mapping.js:3` |
| `categories`, `brands`, `units`, `origins`, `product_types` | Already correctly modelled in the UI | `Categories.js:7` |
| `settings` | Single document: company profile, VAT rates, configuration | `Settings.js`. **Removes the three hardcoded `COMPANY` constants** at `Sales.js:3`, `Purchase.js:12`, `CancelSales.js:3` |
| `sms_campaigns`, `sms_messages` | Sending must write a message row, which `SMS.js:53` does not | `SMS.js:3` |

---

## 11. Migration order

Each step is testable on its own; do not start the next until the previous passes.

| Step | Action | Passes when |
|---|---|---|
| 1 | Create the project, enable Firestore and Authentication, deploy open rules for development | The console shows the empty database |
| 2 | Write `src/services/db.js` — typed read/write helpers per collection, plus an `audit_log` write on every mutation | A document written from the helper appears in the console with an audit row |
| 3 | Seed `products` (20) and `customers` (15) per §9.1 | The Product and Customer screens read from Firestore, not from `initialProducts` |
| 4 | Repoint every dropdown at the master collections | No hardcoded option array remains in `Purchase.js`, `Batch.js`, `Offers.js`, `Repacking.js` |
| 5 | Move authentication to Firebase Auth; seed `users`; delete `defaultUsers` and the `av_users` path in `AuthContext.js` | Login works, no plaintext password exists anywhere |
| 6 | Build the Sales Entry screen; write `sales` + `sale_items` in one `writeBatch` | **The 13 August cut-line: create a sale, refresh, it is still there** |
| 7 | Write `stock_movements` from the sale; compute Stock Report from the ledger | Selling reduces the figure on Stock Report |
| 8 | Seed `licences` (15 dealers, 5 with problems); build `checkSaleRules()` with the licence and banned rules | A sale to an expired-licence dealer is refused on screen |
| 9 | Add the override path, writing `ruleChecks` **and** `audit_log` in the same batch | The override, its reason, the user and the timestamp are all visible in the log |
| 10 | Tighten Security Rules to §7 | A Sales Officer cannot read another territory's sales |
| 11 | Wire the 14 dead Save buttons (`SCREEN-AUDIT.md` §2.1) to `db.js` | Each one appends a visible row that survives a refresh |

Steps 1–6 are the P0 block in `SCREEN-AUDIT.md` §6.1 and carry the 13 August cut-line. Steps 7–9 are
P1 and carry the 20 August cut-line: if step 9 is not passing by then, `INTERNAL-PLAN.md` §6 says drop
Feature 4 permanently — which this schema has already assumed.
