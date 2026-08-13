# AgriVision ERP — Project Outline

**System:** Enterprise Resource Planning system for an agricultural input (fertiliser, pesticide, seed) distribution company
**Team:** 3 members
**Document date:** 7 August 2026 (revised — see note below)
**Target submission:** early September 2026

> **Revision note.** This outline was revised on 7 August 2026 after the page implementations were
> read closely. Three assumptions in the first draft were wrong: the Batch screen is a bill of
> materials rather than a lot/expiry register, the License screen holds the company's own licences
> rather than dealers', and the Sales screens contain no order-entry form. The scope, the feature
> count and the implementation status in §6 were corrected accordingly. The full correction record
> is in UNIQUE-FEATURES.md §1.

---

## 1. Problem Statement

Agricultural input distributors in Bangladesh sell fertiliser, pesticide, seed and equipment through a
tiered network — head office → regional office → area → territory → dealer → farmer. Their operations
differ from ordinary trading businesses in four ways:

1. **Legal licensing.** Selling pesticide and fertiliser requires a government licence. Selling to a
   dealer whose licence has expired exposes both parties to legal penalty.
2. **Product de-registration.** Pesticide registrations are withdrawn and active ingredients banned
   from a stated date. Stock must stop moving forward while historic transactions remain valid — a
   distinction an Active/Inactive flag cannot express.
3. **Batch and expiry.** Agrochemicals carry manufacturing and expiry dates. A contaminated or
   expired batch must be traceable to every dealer that received it.
4. **Repacking.** Bulk stock (50 kg sacks, 200 L drums) is broken into retail packs, changing unit,
   cost and stock count.
5. **Seasonality.** Demand follows the crop calendar (Aman, Boro, Aush, Rabi), not the business
   calendar. Stock planned for the wrong month is dead capital.

Generic ERP packages (Tally, Odoo) and local products (saerp) handle general accounting and inventory
but do not model any of the five.

**What this submission addresses.** Characteristics 1 and 2 are implemented as enforcement rules at
the point of sale, together with a Bengali safety panel on the dealer invoice. Characteristic 4 is
partially present in the existing Repacking screen. Characteristic 3 is implemented only as an
expired-stock block if time allows; full batch traceability and recall are deferred. Characteristic 5
is deferred in full. The reasoning for each decision is in UNIQUE-FEATURES.md §5 and §10.

---

## 2. Module Inventory

18 modules, 93 screens.

| # | Module | Screens | Purpose |
|---|---|---|---|
| 1 | Dashboard | 1 | KPI summary and charts |
| 2 | Sales | 4 | Sales, Sales Return, Cancel Sales, Damage |
| 3 | Accounts | 13 | Customer/Supplier ledgers and opening balances, cash collection, supplier payment, commissions, expense, employee account, expense head, bank account |
| 4 | Inventory | 8 | Purchase, Purchase Return, Stock Report, Central Stock, Offers, Batch, Repacking, Product Demand |
| 5 | Reports | 40 | Sales, collection, due, accounts, expense, return, target and performance reports sliced by officer / customer / territory / area |
| 6 | License | 2 | Licence records and licence categories — **currently the company's own** licences (Trade, VAT, Import); to be extended to a dealer licence register |
| 7 | Product | 1 | Product master |
| 8 | Categories | 5 | Category, Brand, Unit, Product Type, Origin |
| 9 | HR Management | 4 | Daily Visit, Attendance, Daily Meter, Payroll |
| 10 | Customer | 1 | Dealer / customer master |
| 11 | Supplier | 1 | Supplier master |
| 12 | Admin | 1 | User accounts and page-level permission editor |
| 13 | Employee | 1 | Employee master |
| 14 | Employee Target | 1 | Sales target assignment |
| 15 | Mapping | 3 | Office, Region and Area mapping |
| 16 | SMS | 3 | Campaign, SMS send, SMS log |
| 17 | Delivery | 1 | Delivery Order, Challan, Return Delivery |
| 18 | Settings | 3 | VAT, Company Profile, Configuration |

**Note on the Batch screen.** Despite its name, the Batch screen is **not** a lot or expiry register.
It defines a bill of materials: a packaged product (Agri Zink 1 KG) is described by the input
materials it is made from (Agri Zink bulk 50 kg, packet, label) with unit ratios. It is the recipe
that the Repacking screen consumes. Manufacturing and expiry dates do not appear in it. Expiry
capture, where it is built at all, belongs to goods receipt on the Purchase screen — see
UNIQUE-FEATURES.md §1 and §5.

**Note on the Sales screens.** The four Sales screens are list and workflow views (Pending → Confirm
→ Delivered). **There is no order-entry form**; it is the first thing to be built, and it is where
the project's contribution lives. See UNIQUE-FEATURES.md §6.

---

## 3. Users of the System

Eight user types across two groups.

### Internal users (company staff)

---

#### 3.1 Super Admin — System Administrator

**Who:** The IT administrator or business owner. One or two accounts only.

**Primary function:** Keep the system running and control who can see what.

**Can do (full control):** every module; create, edit and deactivate user accounts; assign
page-level permissions; configure VAT, company profile and system settings; view every office's data.

**Cannot do:** nothing is restricted — this is the highest privilege level.

**Constraint:** All Super Admin actions are recorded in the audit trail. A Super Admin cannot delete
audit records.

---

#### 3.2 Managing Director — Head of Office

**Who:** Business owner or general manager. Views the whole business, does not do daily entry.

**Primary function:** Monitor performance, approve high-value decisions.

**Can do:** view every module and every report across all offices, regions and areas; approve credit
limit increases, large discounts and invoice cancellations; set annual and seasonal targets.

**Cannot do:** create users or change permissions (Super Admin only); edit posted accounting entries;
change VAT or system configuration.

**Constraint:** Read-and-approve role. Day-to-day data entry is left to operational staff so that
responsibility stays traceable.

---

#### 3.3 Area Manager

**Who:** Manages one geographic area containing several territories and the officers working them.

**Primary function:** Hit the area's sales and collection targets; supervise officers.

**Can do:** full access to sales, collection and customer records **within their own area**; approve
sales returns, cancellations and discounts up to a set limit; assign targets to territory officers;
approve dealer credit limits; view all area-scoped reports; approve daily visit and expense claims.

**Cannot do:** see data from other areas; purchase from suppliers; make supplier payments; edit
product prices; create users; access system settings.

**Constraint:** Every query is filtered by their assigned area. Discount approval above the configured
ceiling escalates to the Managing Director.

---

#### 3.4 Sales Officer — Territory Officer

**Who:** The field representative who visits dealers in one territory. The largest user group.

**Primary function:** Take orders, collect payment, report visits.

**Can do:** create sales orders for dealers in their own territory; record cash collection; log daily
visits and meter readings; view their own customers' ledgers and dues; view their own sales and
collection reports; view current stock (read-only); submit expense claims.

**Cannot do:** edit or delete a confirmed invoice (must request cancellation from the Area Manager);
see other officers' or other territories' data; change product prices or discounts beyond the
configured slab; access purchase, supplier payment or any accounting module; approve their own
expense claim.

**Constraint:** Territory-scoped. Sale is blocked if the dealer's credit limit is exceeded or — under
the proposed compliance features — if the dealer's licence for that product category has expired, or
if the product's registration has been withdrawn. An Area Manager may override a compliance block
with a written reason, which is recorded in the audit log.

---

#### 3.5 Accountant

**Who:** Head-office finance staff.

**Primary function:** Maintain the books — receivables, payables, expenses, bank.

**Can do:** full access to all Accounts screens; record supplier payments and expenses; maintain
customer and supplier opening balances; calculate and post commissions; reconcile bank accounts;
run every financial report; export data for the external auditor.

**Cannot do:** create sales orders; change stock quantities; edit master data for products or dealers;
create users; approve their own expense vouchers.

**Constraint:** Once an accounting period is closed, entries become read-only; corrections require a
reversing entry, not an edit.

---

#### 3.6 Storekeeper — Inventory Officer

**Who:** Warehouse staff at head office or a regional depot.

**Primary function:** Keep physical stock and system stock identical.

**Can do:** receive purchases against purchase orders, recording manufacturing and expiry dates at
receipt where that feature is built; record purchase returns; define batch recipes (the bill of
materials for a packaged product); perform repacking operations against those recipes; record damage
and wastage; run stock and central stock reports; raise product demand requisitions to head office.

**Cannot do:** create sales orders; see prices, margins or any financial report; make payments;
edit dealer records; approve their own damage entries above a set value.

**Constraint:** Stock movement always references a document (purchase, sale, transfer, repack,
damage). No free-hand stock adjustment.

---

#### 3.7 Delivery Man

**Who:** Driver or delivery staff. Smallest permission set.

**Primary function:** Move goods from depot to dealer and confirm receipt.

**Can do:** view delivery orders and challans **assigned to them**; update delivery status
(Pending → In Transit → Delivered); record return delivery with reason; capture the receiver's name.

**Cannot do:** see amounts, prices or any financial figure; see deliveries assigned to others; create
or edit an order; access any other module.

**Constraint:** Sees only today's and pending assignments. Cannot mark a delivery complete without
recording who received it.

---

### External users

---

#### 3.8 Dealer — Customer Portal *(Phase 2)*

**Who:** The retail shop owner buying from the distributor.

**Primary function:** Self-service — check their own account without phoning the officer.

**Can do:** view their own ledger, outstanding dues and invoice history; view current offers and
price list; place an indent/order request; upload their trade licence and pesticide licence document;
download their own statement.

**Cannot do:** see any other dealer's data; see company stock, cost or margin; confirm their own
order (an officer or Area Manager must approve); edit any posted transaction.

**Constraint:** Strictly scoped to one dealer ID. Read-only apart from order requests and document
upload.

---

## 4. Access Matrix

`C` create · `R` read · `U` update · `D` delete · `—` no access · `*` own records only

| Module | Super Admin | MD | Area Manager | Sales Officer | Accountant | Storekeeper | Delivery Man | Dealer |
|---|---|---|---|---|---|---|---|---|
| Dashboard | R | R | R* | R* | R | R | R* | R* |
| Sales | CRUD | R + approve | CRU* | CR* | R | — | — | C* (request) |
| Sales Return / Cancel | CRUD | approve | CRU* | C* (request) | R | — | — | — |
| Damage | CRUD | R | R* | — | R | CR | — | — |
| Purchase | CRUD | R | — | — | R | CR | — | — |
| Stock / Central Stock | CRUD | R | R* | R | R | CRU | — | — |
| Batch / Repacking | CRUD | R | — | — | — | CRU | — | — |
| Offers | CRUD | R | R | R | — | — | — | R |
| Product Demand | CRUD | R | CR* | R* | — | CR | — | — |
| Accounts (ledgers) | CRUD | R | R* | R* | CRUD | — | — | R* |
| Cash Collection | CRUD | R | RU* | CR* | CRUD | — | — | — |
| Supplier Payment | CRUD | R + approve | — | — | CRUD | — | — | — |
| Expense | CRUD | approve | CR* + approve* | C* | CRUD | C* | — | — |
| Bank Account | CRUD | R | — | — | CRUD | — | — | — |
| Reports | all | all | area-scoped | own territory | financial | stock only | — | own only |
| License | CRUD | R | RU* | R* | R | — | — | CU* (upload) |
| Product / Categories | CRUD | R | R | R | R | R | — | R |
| Customer (Dealer) | CRUD | R | CRU* | CR* | R | — | — | RU* |
| Supplier | CRUD | R | — | — | R | R | — | — |
| HR (Visit, Attendance) | CRUD | R | R* + approve | C* | R | C* | C* | — |
| Payroll | CRUD | R | — | — | R | — | — | — |
| Employee / Target | CRUD | CRU | RU* | R* | R | — | — | — |
| Mapping | CRUD | R | R* | R* | — | — | — | — |
| SMS | CRUD | R | C* | — | — | — | — | — |
| Delivery | CRUD | R | R* | R* | R | CRU | RU* | R* |
| Admin (Users) | CRUD | — | — | — | — | — | — | — |
| Settings | CRUD | R | — | — | R | — | — | — |

---

## 5. Core Business Flows

**Order to cash**

```
Dealer places order
  → Sales Officer enters it on the Sales Entry screen
      → rule check: credit limit, dealer licence validity,
        product registration status, stock expiry
      → blocked lines refused with reason, or overridden by
        an Area Manager with a written reason (logged)
  → Area Manager approves if discount exceeds slab
  → Stock reserved
  → Delivery Order raised
  → Challan issued, Delivery Man dispatched
  → Delivery confirmed by receiver
  → Invoice posted → receivable created in dealer ledger
  → Sales Officer collects cash → Accountant reconciles → ledger cleared
```

**Procure to stock**

```
Storekeeper raises Product Demand
  → Head office issues Purchase Order to Supplier
  → Goods received (manufacturing + expiry dates recorded, if that feature is built)
  → Stock increases
  → (optional) Repacking: bulk broken into retail packs against a batch recipe,
    yield and loss recorded
  → Supplier payable created → Accountant settles
```

---

## 6. Implementation Status

| Layer | Status |
|---|---|
| User interface — 93 list, report and master screens | Complete |
| Navigation and menu tree | Complete |
| Authentication (multi-user login) | Complete — browser storage, not a server |
| Page-level permission system + editor | Complete and enforced at route level |
| Reports (40 screens) | UI complete, sample data |
| **Sales order entry** | **Not implemented** — the Sales screens are lists and status workflows only; no form creates an order, and invoice line items are fabricated at display time |
| Data persistence | **Not implemented** — all data is sample data held in the page; refreshing clears it |
| Business rules (credit limit, dealer licence, product registration, expiry) | **Not implemented** |
| Batch / expiry data model | **Not present** — the Batch screen is a bill of materials, not a lot register (§2) |
| Audit trail | **Not implemented** |
| Password hashing / server-side authorisation | **Not implemented** |

**Interpretation.** The presentation layer is finished apart from one significant omission: there is
no way to create a sale. That omission is also the opportunity — the order-entry screen is where
every enforcement rule in UNIQUE-FEATURES.md is applied, so building it once carries the project's
contribution. The data and business-logic layers are the remaining work.

---

## 7. Scope Boundaries

**In scope for this submission**
- Web application, desktop and tablet browsers
- A sales order-entry screen with a pluggable rule-check interface
- Firestore-backed persistence for a **named subset** of collections — products, customers, sales,
  sales items, users, audit log. The remaining modules continue to display sample data, and the
  report states which is which
- Role-based access control with the eight roles above
- **Three** domain-specific features implemented end to end — dealer licence enforcement, banned
  product block, Bengali safety panel on the invoice (see UNIQUE-FEATURES.md §5)
- A fourth feature — expired-stock block and expiry dashboard — only if Weeks 1–3 close on schedule
- Bengali and English content where the user-facing text needs it

**Out of scope, stated deliberately**
- Native mobile application (the web UI is responsive instead)
- Offline synchronisation
- FEFO (first-expiry-first-out) allocation and one-click batch recall with dealer trace — these
  require lot identity on every stock movement, which the current data model does not carry
- Crop-calendar seasonal demand forecasting — rejected with reasons in UNIQUE-FEATURES.md §10
- GPS-verified field visits — rejected with reasons in UNIQUE-FEATURES.md §10
- Integration with government licence databases (manual entry instead)
- Payment gateway or mobile financial service integration
- Multi-company / multi-tenant operation
- The dealer portal (specified above, built only if time allows)

---

## 8. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Concurrent users | 50 |
| Page load | under 3 seconds on a 3G connection |
| Report generation | under 5 seconds for one year of data |
| Availability | 99% during business hours |
| Backup | automatic daily, 30-day retention |
| Password storage | hashed, never plain text |
| Session | automatic logout after 30 minutes idle |
| Audit | every create, update and delete recorded with user, timestamp and old value |
| Browsers | Chrome, Firefox, Edge — current and one previous version |

---

## 9. Technology

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React 19, React Router 7 | Component reuse across 93 similar screens |
| Charts | Recharts | Declarative, integrates with React |
| Backend / Database | Firebase Firestore | No server administration; real-time updates; suits a 3-person team on a one-month timeline |
| Authentication | Firebase Authentication | Password hashing and session handling provided |
| Authorisation | Firestore Security Rules + client route guard | Rules enforce on the server; the route guard shapes the UI |
| Hosting | Vercel | Automatic deployment on every push |

---

## 10. Diagrams Required for the Report

- [ ] Use case diagram — one per actor (8 actors)
- [ ] Entity relationship diagram
- [ ] Data flow diagram — context level and level 1
- [ ] Sequence diagram — order to cash
- [ ] Sequence diagram — licence validation blocking a sale
- [ ] Sequence diagram — compliance block overridden by an Area Manager, with the audit record
- [ ] Flowchart — the point-of-sale rule engine, showing all four checks in sequence
- [ ] System architecture diagram
- [ ] Module hierarchy chart
- [ ] Gantt chart
