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
| `firestore.rules` | Production Security Rules — where a control is actually enforced (§6). |
| `firestore.indexes.json` | Composite indexes. A new scoped or ordered query usually needs one. |
| `scripts/` | Seeding (`seed*.mjs`), verification (`verify.mjs`, `verify-rules.mjs`, `verify-writes.mjs`), the emulator harness (`dev-reset.mjs`, `emulator-rules.mjs`). |

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

**`firestore.rules` ends in a catch-all deny** ([line 541](firestore.rules:541)).
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

## 6. Where a control is enforced

**A rule that matters is enforced on the server, in `firestore.rules`.** The UI
gate is a convenience — it keeps a user from reaching for something they cannot
have. It is never the control, because it is not there for a caller who never
went through the screen.

Two failure modes, and this codebase has hit both:

- **Enforced only in the UI** — a hidden button is not a control.
- **Shown but refused by the server** — a screen that can only produce an error.

### The worked example: the sale-rule override

One decision, enforced in four places, and only one of them counts:

| Where | What it does |
|---|---|
| `SalesEntry.js` — `OVERRIDE_ROLES.includes(currentUser?.role)` | Hides the Override button and shows "Area Manager only" instead. Convenience. |
| `checkSaleRules.js` — `applyOverride()` | Refuses an override with no written reason, and any override of a rule marked `overridable: false`. |
| `sales.js` — `createSale()` | Refuses to persist a sale carrying a block nobody overrode, or an override with no reason. |
| `firestore.rules` — `audit_log` create, via `canOverrideRules()` | Refuses the `rule_override` entry unless `reason` is a non-empty string **and** the caller's role may override. **This is the control.** |

That is also why `OVERRIDE_ROLES` and `canOverrideRules()` are the same list
written twice (§5) — the copy in the rules is the one that holds.

### Never show a control the server will refuse

- **Page permissions must match the rules.** `OFFICER_PERMISSIONS` omits
  `/audit-log` because the rules grant a Sales Officer no read on `audit_log`;
  offering the page would open a screen that can only show an error. It omits
  `/compliance-report` for the adjacent reason — `licences` *is* readable by
  anyone signed in, but only a Super Admin, Area Manager or Accountant may write
  one, so an officer who cannot renew a licence has no use for the register.
  Match page access to the authority the role actually has, in both directions.
- **A grant has to cover the whole batch.** The `customers` block in
  `firestore.rules` records the case: the Managing Director held
  `permissions: 'all'` and `sales` create, but was in neither `customers` list,
  so a **credit** sale failed while a cash sale went through — `createSale()`
  moves `customers.balance` in the same batch as the invoice, and the batch fails
  whole.
- **Do not widen a rule ahead of the app.** `bank_accounts` deliberately
  withholds read from the Accountant while `/cash-collection` is still a
  sample-data screen that reads nothing.
- **Where the screen and the rules genuinely disagree, write it down** in the
  rules file rather than quietly refusing a button the screen still shows —
  `product_demands` lets the Storekeeper who raised a request approve it, and the
  comment says plainly that this is a weak control.

The access matrix in `PROJECT-OUTLINE.md` §4 is design intent. `firestore.rules`
is what runs, it is narrower in places, and each divergence is explained in its
own `match` block.

---

## 7. Never invent data

This system prints regulatory claims on a dealer's invoice. Making one up is the
worst failure available here.

- **Safety data is never guessed.** WHO hazard class, signal word, pre-harvest
  interval, re-entry period, first-aid text, dosage, approved crops come off a
  container label or a manufacturer's leaflet and nowhere else. A product with
  nothing recorded prints a visible "safety data not recorded" marker
  (`MissingSafety` in `SafetyPanel.js`) — honest, and Feature 3's own third
  requirement. Empty beats plausible.
- **Provenance is mandatory and printed**, and it is enforced in three places —
  the same shape as the override in §6, so only the last one counts.
  `Product.js` disables Save while any of the seven fields carries a value and
  the Source box is empty; `setSafetyData()` and `createProduct()` throw a
  `ServiceError` on the same condition; and **`firestore.rules` refuses the
  `products` write itself** (`safetyProvenanceHolds()`), which is what holds for
  a caller who never went through the screen. `SafetyPanel` then prints that
  line on every invoice *even when it is unflattering*. The two seeded products
  carry `safetySource: PLACEHOLDER_SOURCE`, so a printed copy says on its face
  that its figures are demonstration data.

  What counts as "carries a value" is the part to get right, and it is written
  twice for the same reason `OVERRIDE_ROLES` is: `phiDays: 0` and
  `reentryHours: 0` are figures a label states, so a falsy test lets the two
  most safety-critical numbers through unsourced, while `approvedCropsBn: []`
  are absences. `isRecorded()` in `products.js` and `safetyRecorded()` in the
  rules are the same predicate on either side of the boundary, and they agree on
  everything except a **blank string**, deliberately: the service calls it an
  absence and `storedValue()` normalises it to `null`, so nothing that goes
  through the service reaches the rules blank. The rules cannot rewrite a
  document, only refuse it, and `'   '` stored verbatim is data to
  `hasSafetyData()` and an absence to the source check at once — a panel of
  blanks under a blank source line. So they count it as a value and refuse.
  Change one, think about the other; `npm run verify:writes` holds both.
- **Placeholders are labelled twice**, in the code and on screen — see the banner
  above `SAFETY_DATA` in `scripts/seed-data.mjs`, and `bannedAuthority`, a stated
  placeholder pending a real DAE notification reference.
- **Do not invent** dealers, invoice numbers, licence numbers, brands or stock
  figures. Commit `be13770` removed brands from Stock Report that no product in
  the catalogue had ever come from.
- **A control that cannot be backed is removed, not left dead.** `StockReport.js`
  dropped its Booked column and its export button for exactly this reason.

---

## 8. The seed is the demo database

**`npm run dev:reset` must always produce a working system with no manual step.**
If a change leaves "and then run X by hand" behind, the change is not finished.
`dev-reset.mjs` exits non-zero and stops the emulator rather than leaving a
half-seeded database — commit `f76a626` is the case it was built for: 285
documents seeded, no Auth accounts, and nothing could log in until
`seed-auth.mjs` was run separately. A running emulator with a populated
Firestore and no logins looks exactly like a working machine until the login
screen refuses you.

**A master a screen selects from belongs in the seed.** An empty transactional
register is an empty register; an empty dropdown reads as a broken feature. That
is why `suppliers` (20) and `expense_heads` (24) are seeded and the other twelve
Tier 2 collections start empty on purpose.

Adding a collection to the seed is three edits:

1. The data in `scripts/seed-data.mjs` — plain data, no imports, so Node runs it
   with no build step.
2. A `seedX()` in `scripts/seed.mjs`, **and** the collection name in its
   `COLLECTIONS` array, which is also what `--wipe` clears. A collection missing
   from that array is never wiped and re-seeds on top of itself.
3. The expected count in `EXPECTED` in `scripts/verify.mjs`, or the run stops
   counting it.

`seed.mjs` cannot import `src/services` (ES modules inside a CRA tree), so the
document shapes are maintained by hand against `docs/FIRESTORE-SCHEMA.md`. Change
a shape there and change it here too.

Seeded data is demo data, not invented data (§7): everything comes from the
sample arrays already in the pages, and the two things the seed refuses to invent
are labelled in the code and print as placeholders on screen.

---

## 9. Testing

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

### Every read states its scope, and is checked under the real rules

**A new read is not done until `npm run verify:rules` passes.** `dev:reset` runs
it for you between loading the real rules and putting the dev ones back.

Six times now, one bug: a service function issues a LIST for more documents than
the caller's role may read, and Firestore **refuses the whole query rather than
narrowing it** (§5). `listCustomers()` showed an officer none of their own
dealers; `overriddenLicenceValue()` emptied the compliance report for an Area
Manager, then emptied it again one level lower because `sale_items` needed the
scope too; `getSaleItems()` killed the invoice modal — and `cancelSale()` with it
— for both scoped roles; `listDueSales()`, `listCustomersWithDue()` and
`productSalesReport()` were the same shape behind screens nobody had opened yet.
Every one was invisible under the dev rules, which is where development happens.

So, for any read you add or change:

1. **State the scope in the function's own comment**, in one of three forms —
   *scoped by `actorScope()`*, *unscoped because the collection is not row-scoped
   and these roles may read it*, or *the caller must be one of these roles,
   because no filter can make it legal*. `listUsers()` is the third case: its
   rule keys on the **document ID**, not on a field, so no `where()` clause can
   rescue it and the constraint has to sit on the caller.
2. **Add it to `READS` in `scripts/verify-rules.mjs`** with the roles
   `firestore.rules` allows. The script fails if an export that looks like a read
   is in neither `READS` nor `NOT_A_READ` — that check is the only thing standing
   between this list and a seventh instance.
3. **Run it.** It signs in as each seeded role and asserts *both* directions: a
   read the role is entitled to must succeed, and one it is not must be refused.
   The second half matters as much — a rule accidentally widened looks like a
   passing test otherwise.

The script refuses to run under the dev rules rather than reporting a green run
that means nothing. What it does **not** cover is printed at the end of every
run: writes and their batches, roles with no seeded account, composite indexes,
and whether a screen calls the function correctly. Read that list before treating
a pass as wider proof than it is.

### One write rule is checked, and only one

```bash
npm run verify:writes
```

`scripts/verify-writes.mjs` drives the `safetySource` provenance rule on
`products` — the service guard and `safetyProvenanceHolds()` — in both
directions. Unlike `verify:rules` it loads the real rules itself, re-seeds
afterwards to undo its own writes, and leaves the dev rules back, so it cannot
strand a half-mutated database. It is **not** wired into `dev:reset`; run it
when you touch that rule.

It is one rule's worth of cover, not a write harness, and it says so at the top
of the file and at the end of every run. Every other write is still unchecked.
If you add a write rule, this is the shape to copy — and read that header first,
because a denial and an evaluation error are indistinguishable from the message
this emulator returns, so assertions go on the outcome and never on the text.

**Report what you actually observed, with the numbers.** Not "the stock report
works" but "100 of AI-000730 sold at Head Office took Stock Report from 2,500 to
2,400 with 100 in the Sell column". If you did not run it under the real rules,
say so rather than implying you did. If a check failed, say so with the output.

### Stopping the emulator cleanly (Windows)

**Ctrl-C in the `dev:reset` window.** That script traps SIGINT and takes the
whole process tree down with `taskkill /T /F`, then waits for the ports to be
released.

Any other way of killing it orphans the emulator. On Windows `spawn(...,
{ shell: true })` puts a `cmd.exe` between Node and `npx`, and `npx` starts the
emulators. Firestore is a `java -jar cloud-firestore-emulator` child holding
8080 and 9150; Auth (9099), the UI (4000) and the hub (4400) are held by the
`firebase-tools` Node process. **The wrapper dying does not take the children
with it.** Closing the terminal, killing the wrapper from Task Manager, or a
crash leaves those ports held.

The symptom is the next run failing immediately with *"the emulator exited early"*
and *"Is another emulator already running, or is port 8080 taken?"*. Check before
concluding a change broke something:

```powershell
netstat -ano | findstr /R /C:":8080 " /C:":9099 " /C:":4000 " /C:":4400 "
```

Kill what it names, tree and all:

```powershell
taskkill /PID <pid> /T /F
```

Then re-run `npm run dev:reset`. The emulator keeps nothing on disk, so an
orphan costs only the ports — never try to reuse one, because its rules and its
data are whatever the dead run left behind.

**A session driven from a prompt cannot press Ctrl-C**, so for a non-interactive
run that same `netstat` then `taskkill /PID <pid> /T /F` is the supported
teardown rather than a workaround: it is what the SIGINT trap runs anyway, and
`/T` is what takes the Java and `firebase-tools` children with it. Finish by
re-running the `netstat` and confirming all four ports are free — an orphan is
invisible until the next run fails with *"Is another emulator already
running?"*, which reads exactly like a change having broken something.

---

## 10. Commits

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

## 11. Update `docs/HANDOVER.md` when you finish

[`docs/HANDOVER.md`](docs/HANDOVER.md) is one page saying where the project
stands right now: what works, what is still sample data, what is left to do, and
what is blocked on somebody outside this repository. It is what a fresh session
or a teammate reads first.

**Update it at the end of any substantial piece of work** — a screen migrated, a
feature part completed, a collection added, a class of bug fixed, anything that
changes an answer on that page. Not for a typo or a comment. Do it in the same
commit as the work, so the two cannot drift apart.

It holds **state**; this file holds **conventions**. Do not copy anything from
here into it. Keep it to one page: the moment it needs a table of contents it
has stopped being read, and a handover that is not read is worse than none,
because the next person believes it.

Check the numbers rather than carrying them forward. The counts on that page —
how many pages read Firestore, how many collections have a rules block, how many
reads `verify:rules` covers — are all one shell command away, and a figure that
was true a fortnight ago reads exactly like one that is true today.

---

## The two documents that are submitted work

[`docs/UNIQUE-FEATURES.md`](docs/UNIQUE-FEATURES.md) and
[`docs/PROJECT-OUTLINE.md`](docs/PROJECT-OUTLINE.md) are academic deliverables —
dated, revision-tracked, written for a supervisor and an examiner. **Do not edit
them unless asked.** They record what was believed and decided on a date, and
rewriting that to match today's code destroys the thing they are for. This does
not apply to `FIRESTORE-SCHEMA.md` or `SCREEN-AUDIT.md`, which are working
documents and are kept current (§3 step 1).

When code makes a claim in them stale, **say so and leave the file alone.**
`PROJECT-OUTLINE.md` §6 "Implementation Status" is already overtaken in five
rows — sales order entry, data persistence, business rules, the audit trail and
"authentication — browser storage, not a server" are all now built. That is known.
Report a *new* divergence you introduce; do not re-report these.

One part of `UNIQUE-FEATURES.md` is a standing requirement rather than history:
its §7 marks every legal citation **VERIFY**, meaning it must be checked against
the gazette or the DAE before it reaches the report — and it is the same section
that owes `bannedAuthority` a real notification reference. Treat those as open,
not as recorded fact.

---

## Where this codebase is inconsistent

Not settled patterns — say so rather than guessing:

- **One screen bypasses the service layer.**
  [`Profile.js:16`](src/pages/Profile.js:16) calls `doc`/`getDoc`/`setDoc` on
  `users` directly. It also *writes* that way, so it produces no audit entry —
  and under the real rules only a Super Admin may update `users`, so it cannot
  work for anyone else. Do not copy it; use `users.js`. (`Navbar.js` was the
  second; its read was removed on 19 August, and it was dead code as well as a
  bypass — `AuthContext.shapeUser()` always sets `name`.)
- **`Notice` exists three times.** The shared one is `components/Notice.js`;
  `Product.js` and `SalesEntry.js` carry their own copies from before it was
  extracted. New screens import the shared one.
- **Not every screen is migrated.** `docs/HANDOVER.md` carries the current count
  and the list; do not duplicate it here. `Categories.js` is worth copying as a
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
| Anything safety-related | Only real label data, or the "not recorded" marker (§7). |
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
