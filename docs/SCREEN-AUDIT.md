# AgriVision ERP — Screen Audit

**Date:** 13 August 2026 · **Last recounted:** 20 August 2026
**Companion to:** `PROJECT-OUTLINE.md`, `UNIQUE-FEATURES.md`
**Scope of audit:** everything under `src/`, every route in `App.js`, every leaf in `config/menu.js`

**The counts as they stand today:** ~~55 files under `src/`~~ **88 JavaScript files** (92 including
CSS and assets); ~~93 routes~~ **101 `path=` entries in `App.js`** — 99 screens plus `/login` and the
`/*` catch-all; ~~93 menu leaves~~ **97 leaves under 10 parents in `config/menu.js`**. Net +33 files:
35 added — `src/services/` (23), `src/rules/` (4), three shared components (`Notice`,
`LicenceBadge`, `SafetyPanel`) and five pages (`SalesEntry`, `ComplianceReport`, `AuditLog`,
`OpeningBalance`, `Commission`) — against `Inventory.js` and `Accounts.js` deleted. The percentages
below are recomputed against 97, not 93.

---

## 1. Why this audit exists

`PROJECT-OUTLINE.md` §6 records the user interface as *Complete*, with persistence and business
rules as the remaining work. Reading the page implementations closely shows that the presentation
layer is **not** complete in the sense that word implies:

- ~~**Roughly 25 screens offer no working way to enter data.** Fourteen of them render a full form
  whose Save button has no handler at all.~~ **The fourteen were resolved on 16 August** (§2.1), and
  Sales Entry was built on the 15th. About nine remain — see the recount at the end of §2.4.
- **38 of the 40 report screens render the same four rows of sales data.** Thirty-two of those are
  identical apart from the heading text — ~~41% of the 93 screens~~ **39% of the 97 leaves** in the
  menu. Still true; §7 decision 1 is the answer and has not been carried out.
- ~~**No screen is connected to any other.** Every page holds its own hardcoded `const` array; selling
  does not reduce stock, a return does not credit a ledger, and two disjoint sets of master data
  are in circulation.~~ **No longer true.** 24 of the 47 page files read Firestore; selling moves
  stock and the dealer's balance in one batch; products, customers and suppliers are each one set.
  What survives of this finding is narrower and named in §4: the three ledgers are not fed, Damage
  and Sales Return still do not move stock, and the employee lists are still three lists.

None of this contradicts the project's plan — it sharpens it. The order of work in
`INTERNAL-PLAN.md` §2 is still correct; this document identifies which gaps must be closed *before*
the Firestore schema is fixed and which can safely follow.

> **A note on the schedule.** `INTERNAL-PLAN.md` §6 sets the first cut-line at **13 August: "A sale
> can be created and survives a browser refresh."** That is today, and the condition is not met —
> `Sales.js:429` carries an "+ Add" button with no `onClick`, and nothing persists. By the team's own
> rule, feature work stops here and everyone moves to persistence. The priorities in §6 below assume
> exactly that.
>
> **Met 15 August**, two days late. `SalesEntry.js` sits behind that button; the order it wrote was
> read back from the database with its stock movement and the dealer's balance moved with it. The
> 20 August cut-line was cleared the same day, five days early.

---

## 2. Screens with a list but no way to enter data

### 2.1 Save button has no `onClick` — the form fills in, Save does nothing (14 screens)

In each case the form renders correctly, every field is bound to state, and the Save button is
styled as active. Pressing it has no effect whatsoever.

| File and line | Detail |
|---|---|
| ~~`src/pages/Purchase.js:210`~~ | ~~Add Purchase form is complete; Save is dead. `initialPurchases` is a module-level `const` (`Purchase.js:33`), not state~~ **Resolved 16 Aug** — `purchases` + `purchase_items`. Writes the stock movements and the payable in the same batch, and applies the Feature 2 check on the purchase path |
| ~~`src/pages/PurchaseReturn.js:105`~~ | ~~Save dead; the list is also read-only — `const [rows] = useState(...)` (`:116`)~~ **Resolved 16 Aug** — `purchase_returns`. The form had no product lines at all; it has them now, because otherwise there is nothing to take out of stock |
| ~~`src/pages/Batch.js:131`~~ | ~~Save dead; `batches` is a module-level `const` (`:8`)~~ **Resolved 16 Aug** — `boms`, under the honest name decision 2 gave it |
| ~~`src/pages/Repacking.js:185`~~ | ~~Save dead; `repackings` is a module-level `const` (`:21`)~~ **Resolved 16 Aug** — `repackings`. Consumes and produces in one batch |
| ~~`src/pages/Offers.js:189`~~ | ~~Save dead. Delete works, add does not~~ **Resolved 16 Aug** — `offers`. Delete now archives rather than dropping the row |
| ~~`src/pages/ProductDemand.js:159`~~ | ~~Save dead~~ **Resolved 16 Aug** — `product_demands`, lines per request (closes §4.3) |
| ~~`src/pages/BankAccount.js:50`~~ | ~~Save dead; `const [accounts] = useState(...)` (`:59`)~~ **Resolved 16 Aug** — `bank_accounts` |
| ~~`src/pages/ExpenseHead.js:30`~~ | ~~Save dead; `const [heads] = useState(...)` (`:40`)~~ **Resolved 16 Aug** — `expense_heads` |
| ~~`src/pages/Expense.js:89`~~ | ~~Save dead. Approve and delete work, add does not~~ **Resolved 16 Aug** — `expenses`, referencing the `expense_heads` built in group A. Approve and delete now survive a refresh; delete cancels rather than removing |
| ~~`src/pages/CustomerOpeningBalance.js:80`~~ | ~~Save dead; `const [records] = useState(...)` (`:89`)~~ **Resolved 16 Aug** — `opening_balances`, the customer mode of the same component the supplier screen uses |
| ~~`src/pages/SupplierOpeningBalance.js:76`~~ | ~~Save dead; `const [records] = useState(...)` (`:85`)~~ **Resolved 16 Aug** — `opening_balances`, and the entry moves the supplier's balance in the same batch |
| ~~`src/pages/SupplierPayment.js:141`~~ | ~~Add form's Save dead. Edit, approve and delete work~~ **Resolved 16 Aug** — `supplier_payments`. Edit, approve and delete worked on local state and were lost on refresh; all three go through the service layer now, and approve is what moves the payable |
| ~~`src/pages/CustomerCommission.js:301`~~ | ~~Add form's Save dead~~ **Resolved 16 Aug** — `commissions`, the customer mode of the same component the supplier screen uses |
| ~~`src/pages/SupplierCommission.js:189`~~ | ~~Add form's Save dead~~ **Resolved 16 Aug** — `commissions` |

**Effort:** ~0.25 d per screen → **3.5 person-days**
**Before or after Firestore:** **After — in the same pass as Firestore.** Wiring these to local
`setState` now means writing all fourteen handlers twice. Attach `db.add()` directly.

### 2.1.1 The order to do them in

**None of the fourteen can be done with the Tier 1 collections alone.** Tier 1 is
`products`, `customers`, `licences`, `sales`, `sale_items`, `stock_movements`, `users`
and `audit_log`. Every one of these screens needs somewhere to put its own records — a
purchase, an expense, an offer, a bill of materials — and none of those exist yet. That
includes `CustomerOpeningBalance`: adjusting `customers.balance` is a Tier 1 write, but
the screen lists individual entries with their own dates and notes, so the entries need
a collection of their own.

So the work is not "wire up a Save button". For each screen it is: define the collection
(most are already specified in `FIRESTORE-SCHEMA.md` §10), add a service module beside
`products.js`, point the page at it, then wire Save. **`Product.js` is the worked example
of exactly that sequence** — it was not one of these fourteen, but it made the same
journey from a hardcoded array to Firestore, and its shape is the one to copy.

Ordered by dependency and cost, cheapest and least entangled first:

| Group | Screens | Collection | Why here |
|---|---|---|---|
| **A** | ExpenseHead | `expense_heads` | One field. Do this first — it is the smallest possible run through the whole pattern |
| | BankAccount | `bank_accounts` | Four fields, no references |
| | Offers | `offers` | Self-contained |
| | ProductDemand | `product_demands` | Self-contained. Also fix the shared `demandItems` array (§4.3) while here |
| **B** | SupplierOpeningBalance · SupplierPayment · SupplierCommission | `opening_balances`, `supplier_payments`, `commissions` | **All three need `suppliers` first** — build that master before any of them, the same way `customers` works |
| **C** | CustomerOpeningBalance · CustomerCommission | `opening_balances`, `commissions` | Reference `customers`, which is already Tier 1 — so easier than group B |
| | Expense | `expenses` | Needs `expense_heads` from group A |
| **D** | Purchase · PurchaseReturn · Batch · Repacking | `purchases` + `purchase_items`, `purchase_returns`, `boms`, `repackings` | These write `stock_movements`. Most valuable — group D is what lets Stock Report drop its hardcoded strings — and most work. Leave until last |

Eleven of the fourteen already have their shape in `FIRESTORE-SCHEMA.md` §10. The three
that did not — `bank_accounts`, `purchase_returns` and `opening_balances` — were added
there on 16 August. Anything else new goes into §10 first, then into code.

### 2.2 A button exists, but no form is rendered

| File and line | Detail |
|---|---|
| `src/pages/HR.js:53`, `HR.js:76` | `showForm` state is declared and the button toggles it, but no `{showForm && ...}` block exists anywhere in the JSX; the form state itself is commented out at `:54`. **Pressing "+ New Entry" does literally nothing.** This affects **four screens**: Daily Visit, Attendance, Daily Meter, Payroll |
| `src/pages/Sales.js:429` | The "+ Add" button in the table header has no `onClick`. This is the missing sales order entry identified in `UNIQUE-FEATURES.md` §1 — the project's central gap |

**Effort:** four HR forms **0.5 d** · Sales Entry screen **3 d**
**Before or after Firestore:** Sales Entry — **P0, before or alongside.** HR — after.

### 2.3 The form saves, but it is the wrong entity's form

These three are the most misleading, because they appear to work. The new row is appended to state,
but every column renders blank — table columns come from `Object.keys(filtered[0])`, i.e. from the
shape of the *existing* rows, which the form does not produce.

| File and line | Detail |
|---|---|
| `src/pages/Mapping.js:40` with `:57` | Form produces `{name, manager, status}`; rows carry `officeName` / `regionName` / `areaName`, `region`, `area`, `address`, `totalArea`, `officer`. **All three Mapping screens** append blank rows |
| `src/pages/SMS.js:47` with `:64` | On the Campaign screen, "+ New Campaign" opens the **SMS** form (recipient / phone / message). Campaign rows key on title / target / totalSMS / sent → blank row |
| ~~`src/pages/License.js:35` with `:52`~~ | ~~On the Category screen, "+ New Category" opens the **License** form. Category rows key on description / totalLicense → blank row~~ **Resolved 19 August.** The Category route is now a **read-only** licence-type reference — `LICENCE_TYPE` and what each type authorises, with live counts off the register. It has no Add button, so no blank row can be appended. A licence type is a schema decision (it also moves `LICENCE_FOR_CATEGORY` and the sale rule), not a record somebody types in |

**Effort:** **0.75 person-days** for all three
**Before or after Firestore:** **Before.** These are symptoms of undecided entity shapes. Designing
Firestore collections without settling them migrates the confusion into the database.

### 2.4 Screens with no add path at all, by design

- `src/pages/CancelSales.js` — **the screen contains no action that cancels anything.** It is a
  read-only list with an invoice viewer. Still true; `cancelSale()` exists in `sales.js` and this
  screen does not call it. ~~Its tab badges read Confirm 47 and Delivered 21121 against seventeen
  rows~~ **badges resolved 19 August** — counted from the rows the table renders. Its seventeen
  sample invoice numbers were also the seed's own numbers, so the same invoice showed one dealer
  here and another on `/sales`; they were moved into a `0099xxx` range the counter cannot reach
- `src/pages/Employee.js:44-92` (Employee Target) — no form assigns a target; values are read from
  `initialEmployees[].target`
- StockReport, CentralStockReport, CustomerLedger, SupplierLedger, EmployeeAccount — correctly have
  no add path as reports. ~~**but nothing feeds them either**~~ **StockReport and
  CentralStockReport are fed as of 19 August** — both read `stock_movements` through the stock
  service, so a sale, a purchase or a repacking run moves them. The three ledgers still are not
  (see §4)
- The 40 Reports routes — correctly have no add path

~~**Total: 14 (dead Save) + 5 (no form) + 6 (wrong shape) ≈ 25 screens with no working data entry.**~~
**Now ≈ 9.** All fourteen dead Saves were resolved on 16 August; Sales Entry, the one that mattered,
was built on 15 August; and the License Category form was resolved on 19 August. What is left is the
four HR forms and the wrong-shaped Mapping and SMS Campaign forms.

---

## 3. Screens whose name does not match what they do

| # | File and line | Name suggests | Actually is |
|---|---|---|---|
| 1 | `src/pages/Batch.js:8-21` | Batch / lot register | A **bill of materials**. Fields are `no, product, pcode, date, items[{name, code, unit}]` — no lot number, manufacturing date or expiry date anywhere. Repacking consumes it as a recipe. Confirms `UNIQUE-FEATURES.md` §1 |
| 2 | ~~`src/pages/License.js:4-9`~~ | Dealer licence register | ~~The **company's own** licences — Trade, VAT, Import, issued by DNCC, NBR, MOC~~ **Resolved 19 August**, by decision 3 below. Both registers exist: `/license` (company) and `/license-dealer` (dealer), one component, one `licences` collection, separated by `scope`. The four hardcoded rows are gone, and with them the stored `status` that contradicted the Compliance Report |
| 3 | `src/pages/Inventory.js` (163 lines) | — | **Never imported anywhere.** No route in `App.js`. Contains a `'Batch'` key carrying `batchNo` (`:8-11`) — a remnant of an earlier design, now only a source of confusion |
| 4 | `src/pages/Accounts.js` (171 lines) | — | **Never imported anywhere.** Same dead code |
| 5 | `src/pages/Delivery.js:140-145` vs `:202` | Delivery Order | The form collects customer, area, date and items; the table shows only Order ID, Amount and Status. **Half of what is entered can never be seen.** The columns were dropped in the most recent commit; the form was not |
| 6 | `src/pages/Employee.js:59` | Employee Target achievement | `Math.floor(row.target * (0.7 + Math.random() * 0.4))` — **regenerated on every render.** Typing anywhere on the page makes the achievement figures and progress bars jump |
| 7 | ~~`src/pages/Sales.js:171`~~ | Tab badges Confirm = 47, Delivered = 21121 | Actual row counts were 12 and 22. **Resolved 17 August** — every badge is counted from the same `listSales()` result the table renders, so the two cannot disagree |
| 8 | 38 Reports routes | Purchase Report, Expense Report, Due Report … | All render the same sales table (see §5) |
| 9 | `src/pages/Sales.js:420`, `src/pages/Damage.js:73` | — | Typographical: "Invoise", "Damage qat" |

**Effort:** naming decisions (Batch → BOM, License → two modes) **0.5 d** · delete orphan files and
fix typos **0.25 d** · reconcile Delivery form and columns **0.25 d** · remove `Math.random()` **0.25 d**

**Before or after Firestore:** #1 and #2 — **before**, they are schema decisions. #3 and #4 —
**delete now**; 334 lines of unreachable code will otherwise mislead the migration. The rest — after.

---

## 4. Broken relationships between screens

One root cause: **every page owns a hardcoded `const` array and there is no shared store.**

### 4.1 Stock never moves

- ~~`src/pages/Sales.js:342` — `moveTo()` only changes a status; selling does not reduce stock~~
  **Resolved for new orders:** `createSale()` writes a `sale` movement in the same batch as the
  invoice. The old status workflow on `Sales.js` still only changes a status
- ~~`src/pages/StockReport.js:22-38` — stock values are hardcoded **strings** (`'917'`, `'7927'`,
  `'912/24\n38'`), not computed numbers~~ **Resolved 19 August.** `StockReport.js` calls `stockReport()` and
  `CentralStockReport.js` calls `centralStockReport()`. Both had been written in
  `src/services/stock.js` and neither had a caller. Verified against the emulator under the real
  rules: selling 100 of `AI-000730` at Head Office took the figure from 2,500 to 2,400 and put 100
  in the Sell column. The **Booked** column was dropped — nothing produces it and nothing can,
  because `createSale()` writes the stock movement when the invoice is raised, so there is no
  quantity that is ordered but not yet out of stock
- ~~`src/pages/Product.js:4` — a second, unrelated `stock` field on the product master~~
  **Resolved** — products carry no stock field; stock is the sum of `stock_movements`
- ~~Purchase, Repacking, Damage, SalesReturn and PurchaseReturn never touch stock either~~
  **Purchase, PurchaseReturn and Repacking resolved 16 August** — each writes its movements in the
  same batch as its own document, so receiving raises stock, returning lowers it, and a repacking
  run does both at once. **Damage and SalesReturn are still outstanding**; neither was one of the
  fourteen, and both are their own screens

### 4.2 Two disjoint worlds of master data

> **Products: RESOLVED, 15 August 2026.** `Product.js` no longer holds its own array —
> it reads the real catalogue through `listProducts()`, and `SalesEntry.js` reads the
> same one. The five `SKU-T100` products are gone. World 2 was kept and given the
> `category` field World 1 had, per decision D1 in `FIRESTORE-SCHEMA.md` §3; the seeded
> catalogue is 24 products under the `AI-000xxx` codes.
>
> **Customers: RESOLVED, 19 August 2026.** `Customer.js` reads `listCustomers()` — the 30
> dealers under `AIC-xxxxxx`, scoped by `actorScope()`, so an Area Manager and a Sales
> Officer each get their own and neither gets a permission error. The five-row array of
> `Mr. Rahim Uddin` and `ABC Agency` is gone, Delete is now a soft delete, and each row
> carries the dealer's licence status read from `licences` — read-only; no screen creates
> or edits a licence.
>
> **Employees are still split** — the three lists in `Employee.js`, `HR.js` and
> `EmployeeAccount.js` remain three lists. Same change, same pattern.

| | World 1 — the master pages | World 2 — ~15 transaction pages |
|---|---|---|
| Products | ~~`Urea Fertilizer`, `DAP`, `Imidacloprid` — 5 items, `SKU-T100`~~ **resolved — reads Firestore** | `Smartzeb 80 Wp`, `Agri Zink 1KG`, `Tetop 100 ml` — `AI-000xxx` |
| Customers | ~~`Mr. Rahim Uddin`, `ABC Agency` — 5 items (`Customer.js:3`)~~ **resolved — reads Firestore** | `M/s- Nijhum Traders [AIC-000791]` (`Sales.js:179`, `CustomerLedger.js:7`) |
| Employees | 5 people (`Employee.js:3`) | 4 in HR (`HR.js:10`), 10 in Employee Account (`EmployeeAccount.js:11`) — three different lists |

**Almost no dropdown reads from a master.** The order screen's product and dealer
selectors now do (`productOptions()`, `customerOptions()`), and so do both of the Offers
selectors and the new Product Demand line editor. Everywhere else the option list is
still a hardcoded string array: `Purchase.js:48-49`, `Batch.js:23-24`,
`CustomerOpeningBalance.js:35`, `Repacking.js:38`. ~~`Offers.js:80-81`~~ resolved 16 August.

### 4.3 Detail screens ignore the row that was clicked

- `src/pages/CustomerLedger.js:144` — **every customer opens the same ledger** (`ledgerRows`, `:38`).
  The footer totals (`:166-168`) come from `selected.debit/credit`, which do not sum the rows above
- ~~`src/pages/Repacking.js:72` — every repacking detail shows the same six Porbot items
  (`detailItems`, `:12`)~~ **Resolved 16 August.** What a run consumed is stored on the run and
  snapshotted, so editing the recipe later does not rewrite last month's production
- ~~`src/pages/ProductDemand.js:85` — every request detail shows the same sixteen items
  (`demandItems`, `:17`)~~ **Resolved 16 August.** Lines are entered on the form and stored on the
  request; the detail shows the ones actually asked for, with the stock figure as it stood that day
- ~~`src/pages/Purchase.js:89-95` — every purchase invoice shows one hardcoded line,
  "Agri Zink (packet) 1kg, 310"~~ **Resolved 16 August.** The invoice reads `purchase_items`
- ~~`src/pages/Sales.js:12` — `mockItems()` fabricates invoice lines by splitting the total 60/40;
  Due Balance is `grandTotal * 3.5` (`Sales.js:143`)~~ **Resolved 17 August.** The modal loads
  `getSaleWithItems(invoiceNo)` and prints the real lines, real totals and `sale.dueAmount`. The
  register behind it reads `listSales()` under `actorScope()`, so `confirmRows`, `deliveredRows` and
  `searchOnlyRows` are gone too, and the tab badges are counted from the rows the table is showing
  rather than being the constants of defect 7 in §2.3. This had to happen before Feature 3: a line
  invented at render time has no product behind it to carry safety data

### 4.4 Broken workflow chains

| Chain | What is broken |
|---|---|
| Sales → Cancel Sales | `CancelSales.js:14` holds a separate `CANCEL_ROWS` array. Cancelling in Sales never reaches it, and it has no cancel action of its own. Seven of eight status tabs always show "No data found" (`:234`) |
| Sales → Delivery | Invoices are `AINV-…`, delivery orders are `ADO-…` — unrelated universes. The challan's `doRef` is free text (`Delivery.js:159`) |
| Sales → Sales Return | Invoice number is free text (`SalesReturn.js:405`); a return restores no stock and credits no ledger |
| Stock → Damage | Product name is free text (`Damage.js:110`); damage reduces no stock |
| ~~Batch → Repacking~~ | ~~`Repacking.js:38` hardcodes three batch options; the twelve batches in `Batch.js` are not read~~ **Resolved 16 August.** The recipe selector reads `boms`, and a run consumes the recipe × the run size |
| SMS → SMS Log | Sending an SMS writes nothing to the log (`SMS.js:53`) |
| Categories → Product | Categories, brands, units and origins added in `Categories.js` still never appear in the Product form. Category, type and unit now come from the schema enumerations rather than free text, but brand and origin remain free-text — `categories`, `brands` and `origins` are Tier 2 and not migrated |
| Settings → Invoice | Saving Company Profile only sets a flag (`Settings.js:117`); the invoice header never changes. `COMPANY` is hardcoded in three places: `Sales.js:3`, `Purchase.js:12`, `CancelSales.js:3` |
| ~~Everything → Dashboard~~ | ~~`Dashboard.js:5-26` — every figure is a hardcoded string. The year and month selects (`:214-216`) filter nothing. The "More" and "View" buttons have no `onClick` (`:365`, `:380`)~~ **Resolved 19 August.** Nine tiles read Firestore, eight are blanked with the reason printed on the card, one (Approximate Profit) is blanked because no cost of goods is recorded. Both charts are grouped from `listSales()`, so the Year and Month selects filter. "View" opens its invoice on `/sales`; the five identical "More" buttons became one link to `/audit-log`. Removed: the fabricated scrolling notice, the "Account Balances" block (`bank_accounts` has no balance field) and the calendar's dead week/day/list switcher |

### 4.5 Filters present in the UI that do nothing

- ~~`src/pages/StockReport.js:54-60` — Brand, Category, Type and Office selects exist; the filter reads
  only `query`. The product rows carry no `brand` or `category` field, so these cannot be made to work
  without a schema change~~ **Resolved 19 August.** The schema change happened: `products` carries
  `category`, `type` and `brandId` (§4.1) and `stock_movements` carries `officeId` (§4.6), so all four
  filter now. **Office** re-runs the query — `stockReport({ officeId })` filters in Firestore, and no
  office selected sums every office; the other three narrow the rows already read, joined to the
  catalogue on the product code. Brand options come from the distinct `brandId` values in the
  catalogue rather than a second hardcoded list: `brands` was never migrated (§4.4), so the products
  are the only record of which brands exist — and `Rainbow`, `Canary` and `Sufola` were never among
  them
- `src/pages/Reports.js:99-101` — `fromDate` and `toDate` are never read; the Filter button has no
  `onClick` (`:136`). **The date filter is decorative on all 40 reports**
- ~~`src/pages/Sales.js:306-310` — date, status, discount and office are never applied; only `search` is~~
  **Resolved 17 August.** Date, office and discount all filter now; the status tabs are the status
  filter, so the redundant select was dropped rather than wired twice
- `src/pages/SalesReturn.js:316` — Go is `onClick={() => {}}`
- `src/pages/SupplierPurchase.js:147`, `src/pages/CashCollection.js:371` — Go has no `onClick`
- ~~`src/pages/StockReport.js:89` export~~ **removed 19 August** rather than left dead on screen;
  the print button beside it works. `src/pages/CustomerLedger.js:206` and
  `src/pages/SupplierLedger.js:80` print — still dead

**Effort:** unify master data and repoint every dropdown **2 d** · stock ledger **2.5 d** ·
customer ledger from real data **1.5 d** · connect Cancel Sales to Sales **1 d** · make detail screens
row-aware **1 d** · Dashboard from real data **1 d** · repair dead filters **1 d**

**Before or after Firestore:** unifying master data is **required before** — it *is* the schema. The
stock ledger and customer ledger belong **in the same pass**. Everything else can follow.

---

## 5. Shared components — how many screens are duplicates

### 5.1 `Reports.js` — 40 routes, one component

Counted from the `type` props at `App.js:116-155` against the keys in `Reports.js:4` and `:25`:

| | Count |
|---|---|
| Reports routes in total | **40** |
| Routes with their own table dataset | **2** — Top Customers, Date Wise Invoices |
| Routes falling back to the Sales table | **38** |
| …of which also render a bar chart | **6** — Officer / Territory / Area Wise Sales and Collection |
| **Routes identical apart from the `<h2>` text and icon** | **32** |

**The 32 identical routes:** Sales · Products Sales · Pending Products Sales · Officer Wise Product
Sales · Customer Wise Sales · Customer Wise Product Sales · Territory Wise Product Sales · Territory
Sales Summary · Area Wise Product Sales · Area Sales Summary · Collection · Customer Wise Collection ·
Due · Area Wise Due · Territory Wise Due · Due Invoices · Accounts · Accounts Statement · Expense ·
Head Wise Expense · Sales Return · Territory Wise Sales Return · Top Reports · Product Statement ·
Session Wise Target · Invoice Return Filter · Territory Performance · Territory Target & Achievement ·
Area Target & Achievement · Office Target & Achievement · Purchase · Product Demand

Each renders the same four rows — AINV-001, Mr. Rahim, ৳5,555 … total ৳35,808. Opening the Expense
Report shows that same list of sales invoices.

Two further details:

- The `'Sales Report'` key in `reportData` is **never requested by any route** — `App.js:116` passes
  `type="Sales"`. It survives only as the fallback at `Reports.js:95`
- Five keys in the `icons` map match no route (`Reports.js:72, 73, 83, 84, 85`), so those routes fall
  back to the default 📈

### 5.2 The other shared components

| Component | Routes | Content genuinely differs? | Verdict |
|---|---|---|---|
| `Categories.js` | 5 | Yes — per-type `COLUMNS` and data (`:7-78`), real edit modal | **Best-built screen in the app.** Use as the pattern for the others |
| `Settings.js` | 3 | Yes — three distinct sub-components | Sound |
| `HR.js` | 4 | Yes — four distinct datasets (`:4-24`) | Content fine, but **none of the four can add a record** |
| `Mapping.js` | 3 | Yes | One shared, wrong-shaped form for all three |
| `SMS.js` | 3 | Yes | Campaign screen opens the SMS form |
| `License.js` | ~~2~~ **3** | Yes | ~~Category screen opens the License form~~ **Resolved 19 August** — company, dealer and a read-only Category reference (decision 3) |
| `Employee.js` | 2 | Yes — separate render paths | Target uses `Math.random()` |
| `Sales.js` | 1 | — | The `type` prop is vestigial: the `icons` map holds four keys (`:356`) but `App.js` only ever passes `"Sales"`; the other three are separate files |

### 5.3 Count of effectively empty or duplicate screens

| | Count |
|---|---|
| Reports identical apart from the heading | 32 |
| Reports with the same table plus one chart | 6 |
| **Effectively duplicate screens** | **38** |
| Leaves in the menu | ~~93~~ **97** |
| **Share** | ~~41%~~ **39%** |
| Separately: orphan files (`Inventory.js`, `Accounts.js`) | ~~2 files, 334 lines~~ **deleted** |

**Effort:** building real datasets for all 40 → **~5.5 person-days**. Keeping 8 real reports and
removing the other 32 from the menu → **~1.5 person-days**.

**Before or after Firestore:** after; this does not depend on persistence. But
`UNIQUE-FEATURES.md` §9 applies directly — the report must state how many of the 40 are real.
Claiming 93 screens and being found to have 38 identical ones costs more than the limitation would.

---

## 6. Priorities — two and a half weeks

**Budget:** 12.5 working days × 3 people ≈ 37 person-days. With roughly 10 days going to the written
report and diagrams, **about 25 person-days of development remain.** The work below totals ~27 days,
so something must be cut; §6.4 says what.

### 6.1 P0 — nothing else matters until these are done (13–18 August)

| # | Task | Days |
|---|---|---|
| 1 | Firestore service layer — `products, customers, sales, sale_items, users, audit_log` | 3 |
| 2 | **Unify master data** — one product set, one customer set; every dropdown reads from it (remove the hardcoded arrays at `Purchase.js:48`, `Batch.js:23`, `Offers.js:80`, `Repacking.js:38`) | 2 |
| 3 | **Sales Entry screen** behind `Sales.js:429`, plus the `checkSaleRules()` interface | 3 |
| 4 | Fix the three wrong-shape forms (Mapping, SMS, License) | 0.75 |
| 5 | Delete `Inventory.js` and `Accounts.js` (334 lines of dead code) | 0.25 |

Task 2 *is* the Firestore schema — getting it wrong makes every later migration wrong. Task 4 is what
exposes the wrong shapes, so it belongs before the schema is written. Task 5 prevents the superseded
`batchNo` design in `Inventory.js` from re-entering the model.

**Exit test, 18 August:** create a sale on the new screen, refresh the browser, the sale is still there.
**Passed 15 August.** Tasks 1, 2, 3 and 5 are done; task 4 is two-thirds done — the License form was
fixed on 19 August, Mapping and SMS are still wrong-shaped.

### 6.2 P1 — same pass as Firestore, or the work is done twice (19–25 August)

| # | Task | Days |
|---|---|---|
| 6 | Wire the 14 dead Save buttons to Firestore writes | 3.5 |
| 7 | Stock ledger — sale, purchase, repack, damage and return all move stock | 2.5 |
| 8 | Feature 1 (dealer licence) and Feature 2 (banned product) as two rules on `checkSaleRules` | 4 |
| 9 | Customer ledger from real transactions (replacing the single shared `ledgerRows`) | 1.5 |
| 10 | The four missing HR forms | 0.5 |

**Exit test, 25 August:** a sale to a dealer with an expired licence is refused on screen; an override
is written to the audit log with its reason; after a sale, Stock Report shows the reduced quantity.
**All three passed by 19 August.** Task 6 done, task 8 done, task 7 done bar Damage and Sales Return.
Tasks 9 (the customer ledger from real transactions) and 10 (the four HR forms) are **not** done;
task 9 is the largest thing still outstanding in this section, because the ledger screens show
invented rows beside a master balance that is real, and the two disagree.

### 6.3 P2 — if time allows (26–30 August; hard freeze on the 30th)

| # | Task | Days |
|---|---|---|
| 11 | Feature 3 — Bengali safety panel on the invoice | 1.5 |
| 12 | Keep 8 real reports, remove the other 32 from the menu | 1.5 |
| 13 | Repair dead filters and buttons (Stock Report, Reports, Sales, Go / print / export) | 1 |
| 14 | Make the Repacking, Product Demand and Purchase detail screens row-aware | 1 |
| 15 | Remove `Math.random()` from Employee Target; reconcile Delivery form and columns; fix typos | 0.5 |

### 6.4 Cut outright

| Cut | Reason | Held? |
|---|---|---|
| Feature 4 (expired-stock block) | Already conditional in `INTERNAL-PLAN.md` §6; `Batch.js` provides no lot identity, and three days are not available | **Held.** Permanently dropped, and `UNIQUE-FEATURES.md` §5 now says so |
| ~~Dashboard from real data (1 d)~~ | ~~Hardcoded figures are not visible in a demonstration; spend the day on Feature 1~~ | **Reversed 19 August.** It was built after all, and it had to be: it carries Feature 1 part 3, the licence expiry panel, so the cut was costing a feature part rather than a day |
| Connecting Cancel Sales to Sales (1 d) | Not in the demonstration sequence | **Held.** `cancelSale()` exists in the service layer; the screen still does not call it |
| Real datasets for all 40 reports (5.5 d) | The most expensive item relative to visible benefit | **Held**, and decision 1 is the replacement |

---

## 7. Decisions taken

Recorded 13 August 2026.

1. **Reports** — keep **8 real reports**; the other 32 routes stay in the code but come out of the
   menu, and the written report lists them as future work. `Reports.js` itself is not deleted.
2. **Batch screen** — renamed **"Bill of Materials"**; the Firestore collection is `boms`. This
   removes the question "where is your batch tracking?" by answering it in the name.
3. **License screen** — one component with a `type` prop giving two modes, company licences and
   dealer licences, following the `Categories.js` pattern. Both read from a single `licences`
   collection distinguished by a `scope` field. This is the foundation of Feature 1.
   **Implemented 19 August.** `/license` → `type="Company"`, `/license-dealer` → `type="Dealer"`,
   and the old `/license-category` route became `type="Category"`, a read-only reference rather
   than a third register (§2.3 above). The two existing paths were kept, because a path here is a
   permission string in every seeded profile; `/license-dealer` is new and was added to the Area
   Manager's and the Accountant's seeded permissions, those being the two roles `firestore.rules`
   lets write a licence.

The resulting data model is specified in `FIRESTORE-SCHEMA.md`.

---

## 8. Progress against this audit

Updated 20 August 2026. Findings above are struck through where they no longer hold.

| Finding | State |
|---|---|
| §2.2 — no sales order entry (`Sales.js:429`) | **Resolved.** `SalesEntry.js`, reached from that button |
| §3 items 3, 4 — `Inventory.js`, `Accounts.js` orphaned | **Resolved.** Deleted, 334 lines |
| §4.1 — selling does not reduce stock | **RESOLVED, 19 August — both halves.** `createSale()` writes the movement in the same batch, and Stock Report and Central Stock read it back through `stockReport()` and `centralStockReport()` instead of rendering hardcoded strings |
| §4.2 — two worlds of *product* master data | **Resolved.** `Product.js` reads Firestore; the `SKU-T100` array is gone |
| §4.2 — two worlds of *customer* data | **Resolved 19 August.** `Customer.js` reads `listCustomers()` under `actorScope()`; the five-row array is gone, and each row shows the dealer's licence status |
| §4.2 — two worlds of *employee* data | Outstanding. Same change, same pattern |
| §2.1 — 14 dead Save buttons | **RESOLVED, 16 August — all 14.** A: ExpenseHead, BankAccount, Offers, ProductDemand. B: SupplierOpeningBalance, SupplierPayment, SupplierCommission, preceded by the `suppliers` master they all needed. C: CustomerOpeningBalance, CustomerCommission, Expense. D: Purchase, PurchaseReturn, Batch (as Bill of Materials), Repacking. Each was checked against the emulator one at a time: the row appears, it is still there after a browser refresh, and where a balance or a stock figure is involved it moved with it. `Product.js` is **not** one of the 14 — its Save already worked, it just wrote to local state; it is the pattern that was copied |
| §2.1.1 — every screen needs its own collection first | Confirmed by doing it. **Sixteen Tier 2 collections** were specified in `FIRESTORE-SCHEMA.md` §10 and then built: `expense_heads`, `bank_accounts`, `offers`, `product_demands`, `suppliers`, `opening_balances`, `supplier_payments`, `commissions`, `expenses`, `purchases`, `purchase_items`, `purchase_returns`, `boms`, `repackings`. Nothing was wired to local `setState` first, so no handler was written twice |
| §5.2 — one component, several routes | Extended. `OpeningBalance.js` and `Commission.js` each serve a customer route and a supplier route from a `party` prop, the way `Categories.js` serves five. Four page files became two components plus four one-line wrappers |
| §4.2 — two worlds of *supplier* data | **Resolved 16 August**, as a prerequisite of group B. `Supplier.js` reads `suppliers`; the three hardcoded name lists at `SupplierOpeningBalance.js:32`, `SupplierPayment.js:37` and `SupplierCommission.js` are gone and all three post against a real supplier code |
| §5 — 38 of 40 reports identical | Outstanding; decision 1 above stands |
| §4.4 — Dashboard is entirely hardcoded | **Resolved 19 August.** See the struck row in §4.4. It also carries Feature 1 part 3, the licence expiry panel `UNIQUE-FEATURES.md` §5 promised and no screen rendered |
| §2.3, §3 item 2, §7 decision 3 — the License screen | **Resolved 19 August**, all three together. Three routes off one component, reading `licences`; a create / edit / renew form, which did not exist anywhere in the app before — dealer licences existed only because the seed wrote them |
| §8 below — `Sales.js` offered writes a Sales Officer is refused | **Resolved 20 August.** Change Status, the next-status tick and the Cancel bin are gated on `SALE_UPDATE_ROLES`, and a read-only role gets a caption naming the missing authority rather than a `permission-denied` on the page. "+ Add" stays, gated on `hasAccess('/sales-entry')` — raising the order is the officer's own job |
| Not in the original audit — `Navbar.js` | **Resolved 20 August.** The "৳ 82,000 / Cash" chip is gone (nothing stores a cash position), five invented notifications and their unread badge are gone, and the office button reads `users/{uid}.officeId` through `officeLabel()` instead of showing everyone "Head Office". Its direct `getDoc` on `users/` went with them; `Profile.js` was then the last service-layer bypass, and the worse one, because it wrote — see the row below |
| Not in the original audit — `Profile.js` | **Resolved 21 August.** The last service-layer bypass: it called `doc`/`getDoc`/`setDoc` on `users` itself, so it wrote no audit entry, and its Role `<select>` offered Admin / Manager / Employee — three values not in `ROLE`, which a successful save would have written. It now reads `getMyProfile()` and writes `updateMyProfile()`, and no file in `src/pages/` imports `firebase/firestore`. The rules were widened to match, narrowly: `name` and `phone` on your own document, everything else still Super Admin only (`editingOwnProfile()`, schema §4.7). Before this it was a screen 11 of the 12 logins could open and never save from |
| Not in the original audit — the sale rule engine | **Three rules registered as of 20 August**, not two: `licenceRule`, `bannedRule`, `creditLimitRule`. `registeredRuleCount()` is on screen so an empty engine is visible rather than silent |
| §2.4 — `CancelSales` tab badges | **Resolved 19 August.** Counted from the rows rendered. The screen still has no cancel action; `cancelSale()` exists and nothing calls it |
| §3 item 6, §5.2 — `Employee.js:59` achievement is `Math.random()` | Outstanding, and now recorded in `UNIQUE-FEATURES.md` §4 as an `N` rather than a claimed capability |

### The Dashboard and the License screen, 19 August

Both were verified by signing in as each role with the emulator on the **REAL**
rules (`npm run emulator:rules real`), not the dev ones.

| Check | Result |
|---|---|
| Dashboard loads for Super Admin, Area Manager, Sales Officer | **All three, no `permission-denied` in the console and none in the network log.** Every query is gated on the caller's role first — `CAN_READ` in `Dashboard.js`, transcribed from `firestore.rules` |
| Dashboard panel vs Compliance Report, Super Admin | **Identical** — 23 licences, 16 dealers with none, 3 expired, 1 / 2 / 2, 18 in date |
| Dashboard panel vs Compliance Report, Area Manager | **Identical** — 21 licences, 8 with none, 3 expired, 1 / 1 / 1, 17 in date. Company-wide the same account would have read 23 and 16; the panel counts the caller's own dealers because `expirySummary()` now takes `holderIds`, which is what stops the two screens disagreeing |
| Dealer count | 30 on the Dashboard, 30 on Customer, 30 in the database. It said **2,074** before |
| Create a licence, as an **Area Manager** under the real rules | `AIC-000006` (M/S Bismillah Krishi Sheba, which held nothing) — Pesticide `PL-2026-1099`, DAE, expiring 2026-09-25. The dealer selector offered exactly the 21 dealers of `bogura-sadar`, and the type selector only the three dealer types |
| Where it appeared | Customer: `No licence` → `Pesticide · Expiring (60)`. Compliance Report: 21 → 22 licences, 8 → 7 with none, Within 60 1 → 2. Dashboard: the same 22 / 7 / 2. `licences` register: 23 → 24 rows |
| `audit_log` | `create` · `licences/wBbhsmUDq0SRbpqmF7iS` · Sadia Akter · Area Manager · 14:13:27 |
| Renew | Same record, `PL-2026-1099` → `PL-2027-1099`, `Expiring (60)` → `Active`, 36 → 401 days. The summary cards moved with it |

### The scoped-read audit, 19 August

`getSaleItems()` was the third instance of one bug: **a service function issues a
LIST for more documents than the caller's role may read, and Firestore refuses
the whole query rather than narrowing it.** Three instances meant there were
more, so every read in `src/services/` was audited against `firestore.rules`.

Only four collections can produce it. `customers`, `sales` and `sale_items` are
scoped on a FIELD (`myArea(resource.data.areaId)` / `mine(resource.data.officerId)`),
so `actorScope()` can put the rule's own clause on the query. `users` is scoped
on the **document ID**, which no `where()` clause can satisfy. Everything else —
`products`, `licences`, `stock_movements`, `audit_log` and the fourteen Tier 2
collections — is granted by role alone, so a whole-collection LIST is legal for
anyone granted read and illegal for everyone else, with no middle case.

| Read | Collection | Was it scoped? | Who it failed |
|---|---|---|---|
| `listCustomers`, `customerOptions` | customers | yes | — (fixed earlier) |
| **`listCustomersWithDue`** | customers | **no** | Area Manager, Sales Officer |
| **`listSales`** | sales | **only if the caller remembered** | Area Manager, Sales Officer |
| **`salesGroupedBy`, `statusCounts`, `listCancelledSales`** | sales | **no** — they call `listSales()` with no scope | Area Manager, Sales Officer |
| **`listDueSales`** | sales | **no** | Area Manager, Sales Officer |
| `getSaleItems`, `getSaleWithItems` | sale_items | fixed in the previous commit | Area Manager, Sales Officer |
| **`productSalesReport`** | sale_items | **no** — filtered on `territoryId`/`officerId`, never `areaId` | Area Manager |
| `overriddenLicenceValue`, `complianceReport` | 4 collections | yes | — |
| **`listUsers`, `listOfficers`** | users | **cannot be** | Area Manager, Sales Officer, Storekeeper |
| 33 other reads | products · licences · stock_movements · audit_log · Tier 2 | n/a — role-gated | correctly refused where not granted |

Six were fixed by folding `actorScope()` into the query and declaring the seven
composite indexes the new equality-plus-inequality shapes need. `listUsers()`
cannot be fixed that way and is documented instead: the constraint is on the
CALLER, and its two callers — `Admin.js` and `Expense.js` — are on the menus of
exactly the three roles the rule allows. `listOfficers()` has no caller, and the
screen it was written for is a Sales Officer's, who may not call it; that is
recorded on the function.

Three of the six were behind screens that do not exist yet (`Reports.js` is still
sample data), which is precisely why nobody had seen them. `cancelSale()` was
not: it calls `getSaleItems()`, so cancelling an invoice was refused for an Area
Manager — the role `PROJECT-OUTLINE.md` §3.4 makes responsible for cancellation.

**`npm run verify:rules` now runs this check.** It signs in as each of the six
seeded logins and calls all 49 reads under the real rules, asserting both
directions: a read the role may make must succeed, and one it may not must be
refused. `dev:reset` runs it between loading the real rules and putting the dev
ones back, so it happens without being remembered. It was validated three ways
before being believed — the `getSaleItems()` bug was re-introduced and the run
failed for exactly the two affected roles; the dev rules were loaded and the run
refused to proceed at all; and an entry was deleted from its `READS` table and
the coverage check named the export that had gone missing. What it does not
cover is printed at the end of every run.

One further bug came out of the same audit, of a different kind. **`listBannedProducts()`
returned all 24 products**, of which 2 are banned: it read
`filters: [['bannedFrom', '!=', null]]`, and `listDocs()` drops any filter whose
value is `null` — deliberately, so callers can pass optional arguments straight
through. The filter vanished and the query became "every product". It has no
caller, so nothing was displaying it, but it is Feature 2 point 4's register. It
filters in memory now.

~~Found and **not** fixed, because it is a write and this pass was reads:
`Sales.js` offers Change Status and Cancel to whoever opens it, but
`allow update` on `sales` is `isAdmin() || myArea(...)` — a Sales Officer is
refused.~~ **Fixed 20 August**, with exactly the treatment `SalesEntry.js` gives
the Override button: the three controls are gated on `SALE_UPDATE_ROLES` and the
absence is captioned. `SALE_UPDATE_ROLES` is the fourth list kept in step with
`firestore.rules` by hand, after `OVERRIDE_ROLES` and `LICENCE_WRITE_ROLES`, and
is deliberately separate from `OVERRIDE_ROLES` — waiving a blocking rule and
editing a saved invoice are not the same authority.

Found while doing it, and fixed — **not a Dashboard bug**:

- **`getSaleItems()` sent an unscoped LIST on `sale_items`**, so the invoice modal
  was dead for both scoped roles under the real rules: *"Could not load
  AINV-2026-07-0034303 (permission-denied)"* for the very Sales Officer who
  raised it. It surfaced because the Dashboard's "View" button now opens an
  invoice; the ℹ button on `/sales` had the same failure and nothing had opened
  it under the real rules. `sale_items` carries its own `officerId`/`areaId`
  (D2) precisely so it can be scoped — the same one-level-deeper trap already
  recorded in `overriddenLicenceValue()`. `lineNo` is now sorted in memory, so
  two equality filters need no composite index.

### Regression check on Features 1 and 2, 16 August

Fourteen screens were rewritten in one pass, several of them touching the
service layer the two features depend on. Both features were re-tested from a
**clean `npm run dev:reset`** afterwards. All four checks pass, and the ledger
invariants still hold with the two test orders in place.

| Check | Result |
|---|---|
| Dealer `AIC-000001` (pesticide licence lapsed 14 days ago) + a pesticide | **Blocked.** `LICENCE_EXPIRED`, naming the licence `PL-2026-1000` and its expiry date. Save disabled |
| Override path | Button present; **"Record override" stays disabled until a reason is typed**; Save enables only after the reason is recorded |
| Dealer with a valid licence + banned `AI-000905` | **Blocked.** `PRODUCT_BANNED`, with the withdrawal date and authority. **No Override button at all**, Save stays disabled — a legal prohibition is not a manager's to waive |
| The same banned line backdated to 15 May (before `bannedFrom`) | **Permitted**, saved as `AINV-2026-05-0034677`. The date-effective behaviour is intact |
| `audit_log` | `rule_override` row against `sales/AINV-2026-08-0034676`, carrying the user, their role, the reason, the timestamp, the rule code and the product |

Worth noting for the demonstration: the backdated order took an invoice number
in the **May** series, because the counter is keyed on the sale date's month.
That is correct, and an examiner may well ask about it.

Two things not in the original audit, found while doing the work and worth recording:

- **`firestore.rules` denied the seed script.** The production rules read the caller's
  profile from `users/{uid}`, which does not exist until Firebase Auth is connected, so
  they deny everything — the seed included. Handled by loading development rules into the
  emulator over its admin API rather than editing the real rules.
- **Every displayed date was a day early outside UTC.** `toISOString()` converts to UTC
  first, so at UTC+6 local midnight formats as the previous day. Comparisons were never
  affected, only display — but both features turn on a stated effective date, so it
  mattered. Fixed by `formatDate()` in `src/services/core.js`.

**The live risk remains access.** Everything above was verified against the local
emulator (`npm run dev:reset`). The real Firebase project is on one team member's
account, is still empty, and has never had the production rules deployed.
