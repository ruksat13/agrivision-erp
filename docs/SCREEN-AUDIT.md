# AgriVision ERP — Screen Audit

**Date:** 13 August 2026 · **Companion to:** `PROJECT-OUTLINE.md`, `UNIQUE-FEATURES.md`
**Scope of audit:** all 55 files under `src/`, all 93 routes in `App.js`, all 93 menu leaves in `config/menu.js`

---

## 1. Why this audit exists

`PROJECT-OUTLINE.md` §6 records the user interface as *Complete*, with persistence and business
rules as the remaining work. Reading the page implementations closely shows that the presentation
layer is **not** complete in the sense that word implies:

- **Roughly 25 screens offer no working way to enter data.** Fourteen of them render a full form
  whose Save button has no handler at all.
- **38 of the 40 report screens render the same four rows of sales data.** Thirty-two of those are
  identical apart from the heading text — that is 41% of the 93 screens in the menu.
- **No screen is connected to any other.** Every page holds its own hardcoded `const` array; selling
  does not reduce stock, a return does not credit a ledger, and two disjoint sets of master data
  are in circulation.

None of this contradicts the project's plan — it sharpens it. The order of work in
`INTERNAL-PLAN.md` §2 is still correct; this document identifies which gaps must be closed *before*
the Firestore schema is fixed and which can safely follow.

> **A note on the schedule.** `INTERNAL-PLAN.md` §6 sets the first cut-line at **13 August: "A sale
> can be created and survives a browser refresh."** That is today, and the condition is not met —
> `Sales.js:429` carries an "+ Add" button with no `onClick`, and nothing persists. By the team's own
> rule, feature work stops here and everyone moves to persistence. The priorities in §6 below assume
> exactly that.

---

## 2. Screens with a list but no way to enter data

### 2.1 Save button has no `onClick` — the form fills in, Save does nothing (14 screens)

In each case the form renders correctly, every field is bound to state, and the Save button is
styled as active. Pressing it has no effect whatsoever.

| File and line | Detail |
|---|---|
| `src/pages/Purchase.js:210` | Add Purchase form is complete; Save is dead. `initialPurchases` is a module-level `const` (`Purchase.js:33`), not state |
| `src/pages/PurchaseReturn.js:105` | Save dead; the list is also read-only — `const [rows] = useState(...)` (`:116`) |
| `src/pages/Batch.js:131` | Save dead; `batches` is a module-level `const` (`:8`) |
| `src/pages/Repacking.js:185` | Save dead; `repackings` is a module-level `const` (`:21`) |
| `src/pages/Offers.js:189` | Save dead. Delete works, add does not |
| `src/pages/ProductDemand.js:159` | Save dead |
| `src/pages/BankAccount.js:50` | Save dead; `const [accounts] = useState(...)` (`:59`) |
| `src/pages/ExpenseHead.js:30` | Save dead; `const [heads] = useState(...)` (`:40`) |
| `src/pages/Expense.js:89` | Save dead. Approve and delete work, add does not |
| `src/pages/CustomerOpeningBalance.js:80` | Save dead; `const [records] = useState(...)` (`:89`) |
| `src/pages/SupplierOpeningBalance.js:76` | Save dead; `const [records] = useState(...)` (`:85`) |
| `src/pages/SupplierPayment.js:141` | Add form's Save dead. Edit, approve and delete work |
| `src/pages/CustomerCommission.js:301` | Add form's Save dead |
| `src/pages/SupplierCommission.js:189` | Add form's Save dead |

**Effort:** ~0.25 d per screen → **3.5 person-days**
**Before or after Firestore:** **After — in the same pass as Firestore.** Wiring these to local
`setState` now means writing all fourteen handlers twice. Attach `db.add()` directly.

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
| `src/pages/License.js:35` with `:52` | On the Category screen, "+ New Category" opens the **License** form. Category rows key on description / totalLicense → blank row |

**Effort:** **0.75 person-days** for all three
**Before or after Firestore:** **Before.** These are symptoms of undecided entity shapes. Designing
Firestore collections without settling them migrates the confusion into the database.

### 2.4 Screens with no add path at all, by design

- `src/pages/CancelSales.js` — **the screen contains no action that cancels anything.** It is a
  read-only list with an invoice viewer
- `src/pages/Employee.js:44-92` (Employee Target) — no form assigns a target; values are read from
  `initialEmployees[].target`
- StockReport, CentralStockReport, CustomerLedger, SupplierLedger, EmployeeAccount — correctly have
  no add path as reports, **but nothing feeds them either** (see §4)
- The 40 Reports routes — correctly have no add path

**Total: 14 (dead Save) + 5 (no form) + 6 (wrong shape) ≈ 25 screens with no working data entry.**

---

## 3. Screens whose name does not match what they do

| # | File and line | Name suggests | Actually is |
|---|---|---|---|
| 1 | `src/pages/Batch.js:8-21` | Batch / lot register | A **bill of materials**. Fields are `no, product, pcode, date, items[{name, code, unit}]` — no lot number, manufacturing date or expiry date anywhere. Repacking consumes it as a recipe. Confirms `UNIQUE-FEATURES.md` §1 |
| 2 | `src/pages/License.js:4-9` | Dealer licence register | The **company's own** licences — Trade, VAT, Import, issued by DNCC, NBR, MOC. Confirms `UNIQUE-FEATURES.md` §1 |
| 3 | `src/pages/Inventory.js` (163 lines) | — | **Never imported anywhere.** No route in `App.js`. Contains a `'Batch'` key carrying `batchNo` (`:8-11`) — a remnant of an earlier design, now only a source of confusion |
| 4 | `src/pages/Accounts.js` (171 lines) | — | **Never imported anywhere.** Same dead code |
| 5 | `src/pages/Delivery.js:140-145` vs `:202` | Delivery Order | The form collects customer, area, date and items; the table shows only Order ID, Amount and Status. **Half of what is entered can never be seen.** The columns were dropped in the most recent commit; the form was not |
| 6 | `src/pages/Employee.js:59` | Employee Target achievement | `Math.floor(row.target * (0.7 + Math.random() * 0.4))` — **regenerated on every render.** Typing anywhere on the page makes the achievement figures and progress bars jump |
| 7 | `src/pages/Sales.js:171` | Tab badges Confirm = 47, Delivered = 21121 | Actual row counts are 12 and 22. The header counts contradict the table |
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
- `src/pages/StockReport.js:22-38` — stock values are hardcoded **strings** (`'917'`, `'7927'`,
  `'912/24\n38'`), not computed numbers. `stockReport()` in `src/services/stock.js` computes the
  real figures from the ledger; the screen does not read it yet
- ~~`src/pages/Product.js:4` — a second, unrelated `stock` field on the product master~~
  **Resolved** — products carry no stock field; stock is the sum of `stock_movements`
- Purchase, Repacking, Damage, SalesReturn and PurchaseReturn never touch stock either

### 4.2 Two disjoint worlds of master data

> **Products: RESOLVED, 15 August 2026.** `Product.js` no longer holds its own array —
> it reads the real catalogue through `listProducts()`, and `SalesEntry.js` reads the
> same one. The five `SKU-T100` products are gone. World 2 was kept and given the
> `category` field World 1 had, per decision D1 in `FIRESTORE-SCHEMA.md` §3; the seeded
> catalogue is 24 products under the `AI-000xxx` codes.
>
> **Customers and employees are still split.** `Customer.js` continues to hold its own
> five-row array while the seeded `customers` collection holds 30 dealers under
> `AIC-xxxxxx`, and the three employee lists remain three lists. `Customer.js` needs the
> same treatment `Product.js` just had — it is the same change, and the pattern to copy
> is now in the tree.

| | World 1 — the master pages | World 2 — ~15 transaction pages |
|---|---|---|
| Products | ~~`Urea Fertilizer`, `DAP`, `Imidacloprid` — 5 items, `SKU-T100`~~ **resolved — reads Firestore** | `Smartzeb 80 Wp`, `Agri Zink 1KG`, `Tetop 100 ml` — `AI-000xxx` |
| Customers | `Mr. Rahim Uddin`, `ABC Agency` — 5 items (`Customer.js:3`) | `M/s- Nijhum Traders [AIC-000791]` (`Sales.js:179`, `CustomerLedger.js:7`) |
| Employees | 5 people (`Employee.js:3`) | 4 in HR (`HR.js:10`), 10 in Employee Account (`EmployeeAccount.js:11`) — three different lists |

**Almost no dropdown reads from a master.** The order screen's product and dealer
selectors now do (`productOptions()`, `customerOptions()`). Everywhere else the option
list is still a hardcoded string array: `Purchase.js:48-49`, `Batch.js:23-24`,
`Offers.js:80-81`, `CustomerOpeningBalance.js:35`, `Repacking.js:38`.

### 4.3 Detail screens ignore the row that was clicked

- `src/pages/CustomerLedger.js:144` — **every customer opens the same ledger** (`ledgerRows`, `:38`).
  The footer totals (`:166-168`) come from `selected.debit/credit`, which do not sum the rows above
- `src/pages/Repacking.js:72` — every repacking detail shows the same six Porbot items
  (`detailItems`, `:12`)
- `src/pages/ProductDemand.js:85` — every request detail shows the same sixteen items
  (`demandItems`, `:17`)
- `src/pages/Purchase.js:89-95` — every purchase invoice shows one hardcoded line,
  "Agri Zink (packet) 1kg, 310"
- `src/pages/Sales.js:12` — `mockItems()` fabricates invoice lines by splitting the total 60/40;
  Due Balance is `grandTotal * 3.5` (`Sales.js:143`)

### 4.4 Broken workflow chains

| Chain | What is broken |
|---|---|
| Sales → Cancel Sales | `CancelSales.js:14` holds a separate `CANCEL_ROWS` array. Cancelling in Sales never reaches it, and it has no cancel action of its own. Seven of eight status tabs always show "No data found" (`:234`) |
| Sales → Delivery | Invoices are `AINV-…`, delivery orders are `ADO-…` — unrelated universes. The challan's `doRef` is free text (`Delivery.js:159`) |
| Sales → Sales Return | Invoice number is free text (`SalesReturn.js:405`); a return restores no stock and credits no ledger |
| Stock → Damage | Product name is free text (`Damage.js:110`); damage reduces no stock |
| Batch → Repacking | `Repacking.js:38` hardcodes three batch options; the twelve batches in `Batch.js` are not read |
| SMS → SMS Log | Sending an SMS writes nothing to the log (`SMS.js:53`) |
| Categories → Product | Categories, brands, units and origins added in `Categories.js` still never appear in the Product form. Category, type and unit now come from the schema enumerations rather than free text, but brand and origin remain free-text — `categories`, `brands` and `origins` are Tier 2 and not migrated |
| Settings → Invoice | Saving Company Profile only sets a flag (`Settings.js:117`); the invoice header never changes. `COMPANY` is hardcoded in three places: `Sales.js:3`, `Purchase.js:12`, `CancelSales.js:3` |
| Everything → Dashboard | `Dashboard.js:5-26` — every figure is a hardcoded string. The year and month selects (`:214-216`) filter nothing. The "More" and "View" buttons have no `onClick` (`:365`, `:380`) |

### 4.5 Filters present in the UI that do nothing

- `src/pages/StockReport.js:54-60` — Brand, Category, Type and Office selects exist; the filter reads
  only `query`. The product rows carry no `brand` or `category` field, so these cannot be made to work
  without a schema change
- `src/pages/Reports.js:99-101` — `fromDate` and `toDate` are never read; the Filter button has no
  `onClick` (`:136`). **The date filter is decorative on all 40 reports**
- `src/pages/Sales.js:306-310` — date, status, discount and office are never applied; only `search` is
- `src/pages/SalesReturn.js:316` — Go is `onClick={() => {}}`
- `src/pages/SupplierPurchase.js:147`, `src/pages/CashCollection.js:371` — Go has no `onClick`
- `src/pages/StockReport.js:89` export, `src/pages/CustomerLedger.js:206` and
  `src/pages/SupplierLedger.js:80` print — all dead

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
| `License.js` | 2 | Yes | Category screen opens the License form |
| `Employee.js` | 2 | Yes — separate render paths | Target uses `Math.random()` |
| `Sales.js` | 1 | — | The `type` prop is vestigial: the `icons` map holds four keys (`:356`) but `App.js` only ever passes `"Sales"`; the other three are separate files |

### 5.3 Count of effectively empty or duplicate screens

| | Count |
|---|---|
| Reports identical apart from the heading | 32 |
| Reports with the same table plus one chart | 6 |
| **Effectively duplicate screens** | **38** |
| Screens in the menu | 93 |
| **Share** | **41%** |
| Separately: orphan files (`Inventory.js`, `Accounts.js`) | 2 files, 334 lines |

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

### 6.3 P2 — if time allows (26–30 August; hard freeze on the 30th)

| # | Task | Days |
|---|---|---|
| 11 | Feature 3 — Bengali safety panel on the invoice | 1.5 |
| 12 | Keep 8 real reports, remove the other 32 from the menu | 1.5 |
| 13 | Repair dead filters and buttons (Stock Report, Reports, Sales, Go / print / export) | 1 |
| 14 | Make the Repacking, Product Demand and Purchase detail screens row-aware | 1 |
| 15 | Remove `Math.random()` from Employee Target; reconcile Delivery form and columns; fix typos | 0.5 |

### 6.4 Cut outright

| Cut | Reason |
|---|---|
| Feature 4 (expired-stock block) | Already conditional in `INTERNAL-PLAN.md` §6; `Batch.js` provides no lot identity, and three days are not available |
| Dashboard from real data (1 d) | Hardcoded figures are not visible in a demonstration; spend the day on Feature 1 |
| Connecting Cancel Sales to Sales (1 d) | Not in the demonstration sequence |
| Real datasets for all 40 reports (5.5 d) | The most expensive item relative to visible benefit |

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

The resulting data model is specified in `FIRESTORE-SCHEMA.md`.

---

## 8. Progress against this audit

Updated 15 August 2026. Findings above are struck through where they no longer hold.

| Finding | State |
|---|---|
| §2.2 — no sales order entry (`Sales.js:429`) | **Resolved.** `SalesEntry.js`, reached from that button |
| §3 items 3, 4 — `Inventory.js`, `Accounts.js` orphaned | **Resolved.** Deleted, 334 lines |
| §4.1 — selling does not reduce stock | **Resolved for orders raised on the new screen.** `createSale()` writes the movement in the same batch. Stock Report still renders its hardcoded strings |
| §4.2 — two worlds of *product* master data | **Resolved.** `Product.js` reads Firestore; the `SKU-T100` array is gone |
| §4.2 — two worlds of *customer* and *employee* data | Outstanding. Same change, same pattern |
| §2.1 — 14 dead Save buttons | Outstanding. `Product.js` is the first of them wired up |
| §5 — 38 of 40 reports identical | Outstanding; decision 1 above stands |

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
