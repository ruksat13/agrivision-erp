# CLAUDE.md

AgriVision ERP — React 19 + Firebase Firestore, for an agricultural-input
(fertiliser, pesticide, seed) distribution business in Bangladesh. What makes it
more than CRUD is a rule engine at the point of sale: it refuses a sale to a
dealer whose government licence has lapsed, and a product whose registration has
been withdrawn.

This file is the short version. Longer:
[`src/services/README.md`](src/services/README.md) (how to read and write data —
read it before building a screen), [`docs/FIRESTORE-SCHEMA.md`](docs/FIRESTORE-SCHEMA.md)
(the data model and the D1–D5 decision log),
[`docs/SCREEN-AUDIT.md`](docs/SCREEN-AUDIT.md) (what each screen does today),
[`README.md`](README.md) (running it locally, the twelve logins).

---

## Project shape

| Where | What belongs there |
|---|---|
| `src/pages/` | One screen per file, default-exported. Presentation and local state only. |
| `src/services/` | The Firestore layer. One file per collection, plus `core.js` (plumbing), `constants.js` (every enumeration), `index.js` (re-exports everything — this is what screens import). |
| `src/rules/` | The point-of-sale rule engine. A rule is a plain function; adding one is a file plus one line in `RULES` in `checkSaleRules.js`. |
| `src/components/` | Shared UI: `Notice.js` (banner + the `useFlash`/`useCollection` hooks), `LicenceBadge.js`, `SafetyPanel.js`, `Sidebar.js`, `ProtectedRoute.js`. |
| `src/config/menu.js` | The menu tree, and the source of the permission path list. |
| `firestore.rules` | Production Security Rules — the real authority (§5). |
| `firestore.indexes.json` | Composite indexes. A new scoped or ordered query usually needs one. |
| `scripts/` | Seeding (`seed*.mjs`), verification (`verify.mjs`), the emulator harness (`dev-reset.mjs`, `emulator-rules.mjs`). |

---

## 1. Pages never touch Firestore

No screen imports `firebase/firestore`. No screen holds a hardcoded array
standing in for a collection.

```js
import { listCustomers, createSale, formatDate, ServiceError } from '../services';
```

Import from `../services`, never `../services/sales`. If the data you need has no
service function, **write the service function** — do not reach past the layer
"just this once". Every write through `createDoc`/`updateDoc_`/`softDelete`
carries its validation and its audit entry; a direct `setDoc` carries neither.

Screens do not write their own loading and error handling either — `useCollection`
and `useFlash` in [`Notice.js`](src/components/Notice.js) hold it.
[`ExpenseHead.js`](src/pages/ExpenseHead.js) is the whole pattern in 159 lines;
[`Customer.js`](src/pages/Customer.js) is the same pattern at full size.

Nothing is hard-deleted. `status` moves to `Inactive`, or to whatever this
collection calls its soft delete (`offers` uses `Archived`), so a report run next
month still resolves a reference made today.

---

## 2. Dates

- **Display:** `formatDate(value)` — [`core.js:154`](src/services/core.js:154).
  `YYYY-MM-DD` in the **local** timezone.
- **Storage:** `toTimestamp(value)` — [`core.js:127`](src/services/core.js:127).
  Stored as a Firestore `Timestamp`, never as a formatted string.
- **`toISOString()` is banned.** It converts to UTC first. At UTC+6 a date
  entered as 15 August is stored as local midnight and read back by
  `toISOString().slice(0, 10)` as the 14th.

That bug has been fixed three separate times — `c61bb3b` (dates displaying a day
early), `631f9d8` (`saleDate` seeded from UTC), `f3d54f2` (licence expiry seeded
through UTC) — and each time it came back somewhere else. Every date here is a
*business* date: the day a licence lapses, the day a withdrawal takes effect, the
day a sale was made. Between 00:00 and 06:00 local, the UTC form silently gates
an early-morning sale on yesterday's rules.

For the clock half of a timestamp use local getters to match (`timeOf()` in
`AuditLog.js`), so a row's date and time cannot land on opposite sides of
midnight. Two sample-data screens still call `toISOString()`
(`CashCollection.js:3`, `SupplierPurchase.js:37`) — not a precedent; fix them if
you migrate those screens.

---

## 3. Adding a collection — in this order

1. **Schema doc.** Add the shape to `docs/FIRESTORE-SCHEMA.md` §10: enumerations,
   which fields are denormalised (and whether the copy is refreshed or is a
   deliberate historical record), what its soft delete is called.
2. **Constants.** Collection name into `COL`, every enumeration into
   [`constants.js`](src/services/constants.js), so a typo fails loudly at write
   time instead of storing a bad value.
3. **Service module.** One file beside `products.js`, re-exported from
   `index.js`. `expenseHeads.js` is the smallest complete example.
4. **Rules block** in `firestore.rules`, derived from what the screen and the
   service actually do: which roles reach a screen that reads it (including
   screens that only read it to fill a selector), and which service functions
   write it — *and what else those functions touch in the same batch*. A grant is
   worthless if the batch also writes a collection the same role is refused.
5. **Indexes** for any new composite query.
6. **Page.** Only now.

**`firestore.rules` ends in a catch-all deny** ([line 462](firestore.rules:462)).
A collection with no `match` block is refused every read and every write. It will
look fine against the dev rules and be a dead screen the moment the real rules
load. Skipping step 4 is the likeliest way to ship a broken screen here.

---

## 4. audit_log

Append-only (schema §7). No update path, no delete path; Security Rules refuse
both, including to a Super Admin.

**You almost never write an entry yourself.** `createDoc`, `updateDoc_` and
`softDelete` each queue one in the same `writeBatch` as the change, so a document
cannot be saved without its entry. `updateDoc_` reads the document first so the
entry carries the `before` value.

Write one directly in three cases:

- **A hand-built batch** — call `queueAudit(batch, {...})`
  ([`core.js:246`](src/services/core.js:246)) on the *same* batch, before
  `commit()`. `createSale()` in [`sales.js`](src/services/sales.js) is the worked
  example: one batch holds the invoice, its lines, the stock movements, the
  dealer's balance and the audit entries, and commits whole or not at all.
- **A rule override** — `createSale({ ruleChecks })` writes it onto the sale *and*
  as a `rule_override` row in the same batch, so the two cannot disagree. Use
  `logRuleOverride()` only for a sale that already exists. An override with no
  written reason is refused in three places: the rule engine, the service layer,
  and `firestore.rules`.
- **Auth** — `logAuth('login'|'logout', uid)`. A page reload is not a login.

The action must be one of `AUDIT_ACTION` (`create`, `update`, `delete`, `login`,
`logout`, `approve`, `rule_override`, `seed`). Pick the one describing the
business event, not the Firestore operation — cancelling a product demand logs as
`delete`, not `update` (`35a17c3`).

---

## 5. Roles, permissions and scope

**The role vocabulary** is `ROLE` in
[`constants.js:138`](src/services/constants.js:138) — the only one; the old
Admin/Manager/Staff set is gone:

`Super Admin` · `Managing Director` · `Area Manager` · `Sales Officer` ·
`Accountant` · `Storekeeper` · `Delivery Man` · `Dealer`

The last two are in the vocabulary but have no seeded account and no grant in
`firestore.rules`; a user with either role can currently read nothing.

| | Holds | Enforced by |
|---|---|---|
| `users/{uid}.role` | what you *are* | `firestore.rules`, on the server. **This is the control.** |
| `users/{uid}.permissions` | which *pages* you may open — `'all'` or an array of paths from `config/menu.js` | `ProtectedRoute.js` / `Sidebar.js`, in the browser. **Shapes the UI only.** |

The profile's document ID is the Firebase Auth UID. Seeded permission sets are in
`scripts/seed-data.mjs` (`OFFICER_PERMISSIONS`, `STAFF`) — grant page access that
matches the authority the rules give that role, or you have built a screen that
can only show an error.

`OVERRIDE_ROLES` (constants.js) and `canOverrideRules()` (firestore.rules) are one
list written twice, because rules cannot import JavaScript. **Change both.** A
Sales Officer is deliberately absent: they raise the order, so letting them waive
their own block would make the control advisory.

### actorScope(), and the trap

`setActor({ id, name, role, areaId, territoryId })` is called once after login.
`actorScope()` ([`core.js:100`](src/services/core.js:100)) turns the actor into
the filters that caller's role must put on a query: `{ officerId }` for a Sales
Officer, `{ areaId }` for an Area Manager, `{}` for everyone else — their read
grant does not depend on the row, so an unscoped query is already legal and a
filter would hide records they are entitled to see.

**Security Rules are not filters.** A rule naming `resource.data` cannot be
satisfied by a whole-collection query: Firestore refuses the LIST outright rather
than narrowing it. An Area Manager asking for every dealer gets
`permission-denied` and an empty screen — *not* their own area. The query must
carry the same `where()` clause the rule tests.

So **any collection scoped by `myArea()` or `mine()` needs its service list
function to fold `actorScope()` into the query** — `listCustomers()` in
[`customers.js`](src/services/customers.js) is the worked example, and the
`customers` entries in `firestore.indexes.json` exist for those queries. Scoped
today: `customers`, `sales`, `sale_items`. None of the fourteen Tier 2
collections is row-scoped (they are company books), so a whole-collection LIST is
legal there for anyone granted read.

When a screen's figures are scoped, **say so on the screen** — "30 dealers" and
"5 dealers" mean different things and the reader should not have to work out
which they are seeing (`Customer.js`, `ComplianceReport.js`). On a compliance
total, understating exposure is the dangerous direction.

`actorScope()` reads `areaId` off the actor, so an actor recorded without one
leaves an Area Manager unable to list anything. `AuthContext.remember()` passes
the whole shaped profile, which is why the app works; `startSession()` in
`users.js` sets only `{ id, name, role }` and is not sufficient on its own.

---

## 6. Never invent data

This system prints regulatory claims on a dealer's invoice. Making one up is the
worst failure available here.

- **Safety data is never guessed.** WHO hazard class, signal word, pre-harvest
  interval, re-entry period, first-aid text, dosage, approved crops come off a
  container label or a manufacturer's leaflet and nowhere else. A product with
  nothing recorded prints a visible "safety data not recorded" marker
  (`MissingSafety` in `SafetyPanel.js`) — honest, and Feature 3's own third
  requirement. Empty beats plausible.
- **Provenance is mandatory and printed.** `setSafetyData()` refuses figures with
  no `safetySource`, and `SafetyPanel` prints that line on every invoice *even
  when it is unflattering*. The two seeded products carry
  `safetySource: PLACEHOLDER_SOURCE`, so a printed copy says on its face that its
  figures are demonstration data.
- **Placeholders are labelled twice**, in the code and on screen — see the banner
  above `SAFETY_DATA` in `scripts/seed-data.mjs`, and `bannedAuthority`, a stated
  placeholder pending a real DAE notification reference.
- **Do not invent** dealers, invoice numbers, licence numbers, brands or stock
  figures. Commit `be13770` removed brands from Stock Report that no product in
  the catalogue had ever come from.
- **A control that cannot be backed is removed, not left dead.** `StockReport.js`
  dropped its Booked column and its export button for exactly this reason.

---

## 7. Testing

```bash
npm run dev:reset
```

Both emulators, dev rules, wipe, 285 seeded documents, twelve logins, verified —
then `npm run start:emulator` in a second terminal. The emulator keeps nothing on
disk; re-run after every restart.

That leaves the emulator on the **dev** rules, which are wide open. They exist so
the seed can write and **they prove nothing about authorisation.** Before
claiming a screen works:

```bash
npm run emulator:rules real
```

Then sign in as each role that will use the screen and load it (`npm run
emulator:rules dev` goes back). Most failures this codebase has had — scoped
queries refused, a role granted a page it cannot read, a batch failing because one
collection in it was denied — are invisible under dev rules.

`npm run verify:emulator` counts documents and checks the invariants; its counts
only hold on a freshly seeded database.

**Report what you actually observed, with the numbers.** Not "the stock report
works" but "100 of AI-000730 sold at Head Office took Stock Report from 2,500 to
2,400 with 100 in the Sell column". If you did not run it under the real rules,
say so rather than implying you did. If a check failed, say so with the output.

---

## 8. Commits

```
[sadab] Stock Report and Customer read the database, and the dead filters work
```

Subject: `[sadab] ` then sentence case, present tense, no trailing full stop,
~60–90 characters. Say what changed **and what now works** — two clauses joined
by "and" is the house shape. No conventional-commit types.

Body: prose wrapped at ~78 characters, one section per screen or concern.
Explain *why*, and cite the doc section (`SCREEN-AUDIT §4.1`, `schema §2`) rather
than restating it. End with what was observed and under which rules:

```
Verified against the emulator under the REAL rules, not the dev ones:
  - <observation, with actual figures>
  - <observation for each role that matters>

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

Work happens on `main`. Do not commit, push or deploy unless asked.

---

## Where this codebase is inconsistent

Not settled patterns — say so rather than guessing:

- **Two screens bypass the service layer.**
  [`Profile.js:16`](src/pages/Profile.js:16) and
  [`Navbar.js:34`](src/components/Navbar.js:34) call `doc`/`getDoc`/`setDoc` on
  `users` directly. `Profile.js` also *writes* that way, so it produces no audit
  entry — and under the real rules only a Super Admin may update `users`, so it
  cannot work for anyone else. Do not copy either; use `users.js`.
- **`Notice` exists three times.** The shared one is `components/Notice.js`;
  `Product.js` and `SalesEntry.js` carry their own copies from before it was
  extracted. New screens import the shared one.
- **22 of the 47 files in `src/pages/` are migrated.** The rest still render
  module-level sample arrays — cash collection, delivery, HR, sale returns,
  damages, mapping, SMS, settings, categories/brands/units, and `License.js`,
  whose hardcoded rows even *store* a `status` that the migrated `licences`
  collection derives at read time (D5). `Categories.js` is worth copying as a
  screen structure — one component serving five tabs — but not as a data source.
- **Cancelled wording differs by collection**: `Cancelled` in most, `Cancel` in
  `DEMAND_STATUS` and `OPENING_STATUS`, `Archived` in `OFFER_STATUS`. Each is
  deliberate and documented in `constants.js`. Check the enum; do not assume.
- **Damage and Sales Return still do not move stock**, though the movement types
  (`damage`, `sale_return`) exist. `purchaseReturns.js` is the closest example.
- **`firestore.rules` is not deployable against a fresh project** until Auth
  accounts and their `users/` profiles exist — every rule reads the caller's
  profile. The file header explains the sequence.

---

## Building a screen from a screenshot

A screenshot specifies *layout*. It is not a data source.

**Copy from the screenshot:** column order and headings, the wording of labels
and buttons, which filters exist and where they sit, placement of actions, page
density, tabs and their names. Match it closely — the point is that the screen is
recognisable to someone who uses the real system.

**Take from this codebase instead — never transcribe from the image:**

| In the screenshot | Comes from |
|---|---|
| Any row of data — products, dealers, invoices, stock figures | The service layer, against seeded data. Never retype the visible rows. |
| Statuses, categories, units, offices, payment methods | The enumerations in `constants.js`. A value not in the enum is a schema decision — raise it, do not add a string. |
| Dates | `formatDate()`. Whatever the screenshot shows, storage is a `Timestamp`. |
| Money | `number`, two decimals; the `taka()` helper the migrated screens use (`৳ 1,234.00`). Never a formatted string in the document. |
| Office names | `officeLabel(id)` — the long form is presentation, the short id is stored. |
| Licence status, days remaining | Derived at read time by `licences.js` (D5). Never stored, never recomputed in a page. |
| Anything safety-related | Only real label data, or the "not recorded" marker (§6). |
| Who may press a button | The role, tested against the rules — not the screenshot's UI. |

**Then, before writing the page:**

1. Does every column have a field in `docs/FIRESTORE-SCHEMA.md`? If not, the
   schema entry comes first (§3).
2. Does the collection have a `match` block in `firestore.rules`? Without one the
   screen is dead at deploy time (§3).
3. Which roles reach this screen, and is the collection row-scoped? If it is, the
   service function needs `actorScope()` and the screen needs the scope banner
   (§5).
4. Which controls in the screenshot cannot be backed by anything this codebase
   produces? Wire them to a real query or leave them out. A select that filters
   nothing and a column that is always empty are the same defect, and this
   codebase has removed both before.
