# Decisions — why this project is shaped as it is

**Updated 20 August 2026.** Reasoning only. What the system *is* today is in
[`HANDOVER.md`](HANDOVER.md); how to work on it is in [`CLAUDE.md`](../CLAUDE.md); the data model and
its own D1–D5 log are in [`FIRESTORE-SCHEMA.md`](FIRESTORE-SCHEMA.md).

Read this before proposing to change any of it. Most of these look arbitrary from the code alone, and
several were paid for twice.

Some of the reasoning below is drawn from `docs/INTERNAL-PLAN.md`, which is **untracked and
gitignored** (`6325ece`) because it carries effort estimates and task allocation that do not belong in
an academic submission. It is still on disk in a working checkout; a fresh clone will not have it, and
what mattered from it has been restated here rather than left behind a citation.

---

## The rule engine

### The engine returns a list, not a boolean

`checkSaleRules()` returns `RuleResult[]` — `{ level, code, productId, message, overridable }` —
because a boolean cannot say *which line* was refused, *why*, or *whether anyone may proceed anyway*.
A blocked sale that cannot name the product and quote the licence number is not a control; it is an
error message.

Rejected: a boolean, and checks inlined in `SalesEntry.js`. Both make every new rule a merge conflict
in the same file. As a list, a rule is one new file plus one line in `RULES`, which is how three
people wrote rules in parallel (`INTERNAL-PLAN.md` §2 called this "the design constraint that pays
for itself", on day one, and it did).

### `bannedFrom` is a date, not a flag

A withdrawn registration takes effect on a stated date. Stock already in the channel must stop moving
forward while historic transactions stay valid — a distinction `status: Active | Inactive` cannot
express, because deactivating the product hides it retrospectively and breaks invoices already
printed. Every comparison is against the **sale date**, never today.

Rejected: filtering banned products out of the dropdown. That hides the feature instead of
demonstrating it — the product must be selectable and then visibly refused (`INTERNAL-PLAN.md` §3).

A ban dated in the future is a real and distinguishable state, which is the other half of why the
field is a date: `Product.js` badges it amber *BAN FROM* rather than red *BANNED*.

### Each rule's overridability, and why they differ

This is the clearest worked example in the project, so it gets the room. Four rule codes, three
answers, and the difference is *who owns the decision* — not how serious it is.

| Code | Level | Overridable | Because |
|---|---|---|---|
| `LICENCE_EXPIRED` | block | **yes** | A lapsed licence is an **administrative failure**. The dealer's entitlement is not in question; their paperwork is. Somebody inside the company can take responsibility for supplying while it is renewed, and be named for it. |
| `LICENCE_MISSING` | block | **yes** | Same authority, weaker evidence — nothing is on record at all. Kept overridable rather than promoted to absolute, because "we have not entered it yet" and "they do not hold one" are indistinguishable from inside this system, and refusing outright would punish a data-entry gap as if it were a legal one. |
| `PRODUCT_BANNED` | block | **no** | A **legal prohibition**. The authority is the government, not the company, so there is nobody inside the company who could authorise it. An override button here would be a false claim of authority. |
| `CREDIT_LIMIT_EXCEEDED` | block | **yes** | A **commercial threshold the company set over its own money**. Neither of the above: not an error to correct, not a prohibition to obey, but a risk to accept. The company set it and the company can lift it. |

Two things the table is deliberately not:

- **Not a severity ordering.** The ban is unoverridable because of *whose* decision it is, not because
  it matters most. A credit limit can cost more money than a lapsed licence and is still waivable.
- **Not "warn where it is soft".** Every one of the four is a `block`. Only a block gates the save,
  and only a block writes a `rule_override` row — `createSale()` filters `ruleChecks` on
  `overridden`. A warning posts the invoice, moves the balance, and records nobody's name against the
  decision. If a rule is worth having, it is worth stopping the save to get a decision; if it is not
  worth stopping the save, it is not worth having.

The contrast is visible on screen — the licence block carries an Override button, the ban does not —
and it is the sharpest thing in the demonstration.

### The override is gated in four places; one of them is the control

| Where | What it does |
|---|---|
| `SalesEntry.js` — `OVERRIDE_ROLES.includes(role)` | Hides the button, shows "Area Manager only". **Convenience.** |
| `checkSaleRules.js` — `applyOverride()` | Refuses an override with no written reason, and any override of `overridable: false`. **Convenience.** |
| `sales.js` — `createSale()` | Refuses to persist a sale carrying an unresolved block, or an override with no reason. **Convenience.** |
| `firestore.rules` — `audit_log` create, via `canOverrideRules()` | Refuses the `rule_override` entry unless `reason` is a non-empty string **and** the caller's role may override. **This is the control.** |

The first three are not there to enforce; they are there so nobody reaches for something the server
will refuse. The rules file is the only one that runs for a caller who never went through the screen.
That is also why `OVERRIDE_ROLES` and `canOverrideRules()` are one list written twice — Security Rules
cannot import JavaScript — and why changing one without the other is a real bug in either direction.

A Sales Officer is deliberately absent from `OVERRIDE_ROLES`: they raise the order, so letting them
waive their own block would make the control advisory. Same reasoning gives `SALE_UPDATE_ROLES` its
own existence rather than reusing `OVERRIDE_ROLES` — waiving a blocking rule and editing a saved
invoice are not the same authority, and one should not move because the other did.

### The credit limit reads `dueAmount`, not `grandTotal`

The dealer's balance moves by the **unpaid** part of the invoice (`sales.js:277`). A cash sale
settled in full adds no exposure, so gating it on the grand total would refuse a sale that cannot
breach the limit — a false block, which teaches people to override reflexively and is worse than no
rule at all. Observed: the same 198,000 order blocks on credit and passes on cash.

### Feature 4 (expired stock) was dropped

`Batch.js` is a bill of materials, not a lot register — no lot number, manufacturing date or expiry
date anywhere in it. Expiry tracking therefore requires lot identity on *every* stock movement:
purchase, repack, sale, return, damage. That is a data-model change across the whole application, and
it was never affordable.

It was dropped on the reasoning, not on the schedule — `INTERNAL-PLAN.md` §6 made it conditional on a
cut-line that was in fact cleared five days early, and it is still dropped. `lotNo`, `mfgDate` and
`expiryDate` are reserved in the schema so picking it up later needs no migration.

---

## Scope

### 32 report screens stay as sample data, on purpose

`Reports.js` serves 40 routes. Two have their own dataset; 38 fall back to the same sales table, and
32 of those differ only in the `<h2>` and the icon. Building real datasets for all 40 was costed at
5.5 person-days — the most expensive item in the project against the least visible benefit, and it
would have bought a Purchase Report that is a sales table with a different heading.

The decision (§7 decision 1 of `SCREEN-AUDIT.md`) is to keep **8 real reports**, take the other 32 out
of the menu, and list them as future work. `Reports.js` is not deleted.

Rejected: leaving all 40 in the menu and hoping. `UNIQUE-FEATURES.md` §9 is the reason —
**claiming 93 screens and being found to have 38 identical ones costs more than the limitation would.**
Examiners test the boundary. Note that taking them out of the menu has not actually been done yet;
the decision stands and the work is outstanding.

### Placeholder safety data is labelled, not filled in

WHO hazard class, signal word, pre-harvest interval, first-aid text and dosage come off a container
label or a manufacturer's leaflet and nowhere else. This system prints regulatory claims on a
dealer's invoice; inventing one is the worst failure available here.

So: provenance is mandatory and printed. `SafetyPanel` prints the `safetySource` line on every
invoice **even when it is unflattering**. The two seeded products carry
`safetySource: PLACEHOLDER_SOURCE`, so a printed invoice states on its own face that its figures are
demonstration data. The other twenty-two carry nothing and print
*"নিরাপত্তা তথ্য সংরক্ষিত নেই"* — which is Feature 3's own third requirement, and the stronger
demonstration.

Rejected: authoring plausible-looking figures for the demo. **Empty beats plausible.** The same rule
killed the Booked column on Stock Report, the brands in `be13770` that no product had ever come from,
and the Navbar's "৳ 82,000 / Cash" chip — nothing in this system stores a cash position. A control
that cannot be backed is removed, not left dead.

> **Known gap, and it fails this project's own test.** The "no figures without a source" requirement
> is enforced **only in the Product page dialog** — `Product.js:181`, `ready = !anything ||
> f.safetySource.trim()`. `setSafetyData()` writes `safetySource: safety.safetySource ?? null` with
> no guard, and `firestore.rules` says nothing about it. By the standard in `CLAUDE.md` §6 that is a
> UI gate, not a control: a caller who does not go through the screen can write safety figures with
> no provenance, and the invoice will print them under a blank source line. `CLAUDE.md` §7 currently
> states that `setSafetyData()` refuses them, which is not what the code does.

---

## Platform

### Firebase rather than a conventional backend

Three people, one month, and roughly ten of those days going to the written report. A conventional
stack means writing and hosting an API, a database, session handling and password hashing before the
first business rule exists. Firestore plus Firebase Auth removes all four, and Security Rules give
something a hand-rolled Express app would not have had time for: **authorisation enforced on the
server, per document, testable role by role**.

The cost is real and is accepted knowingly: **Security Rules are not filters.** A rule naming
`resource.data` cannot be satisfied by a whole-collection query — Firestore refuses the LIST outright
rather than narrowing it — so every scoped read has to carry the rule's own `where()` clause. That is
the recurring bug below, and it is the price of this choice.

Rejected: a conventional backend on timeline grounds; and deferring authorisation to "later", which
would have meant the access matrix in `PROJECT-OUTLINE.md` §4 existing only as a diagram.

### Auth UIDs are staff codes, not random

Every account is created with `localId` set to the user's own code (`AIO-000010`, `AIU-000003`), which
is also the `users/` document ID. Not cosmetic:

- `firestore.rules` reads the caller's profile at `users/{request.auth.uid}`. A random UID misses that
  lookup and **every rule that asks for a role denies**.
- `customers.officerId`, `sales.officerId` and `sale_items.officerId` hold officer codes, and `mine()`
  compares them against `request.auth.uid`. Random UIDs break Sales Officer scoping silently — the
  rows simply vanish, with no error to follow.

The cost: creating an account with a chosen UID is an admin operation. The emulator accepts
`Authorization: Bearer owner`; a real project needs a service-account key, which this repository
deliberately does not carry, so `seed-auth.mjs` stops and says so rather than half-working.

### The demonstration runs on the emulator

The real Firebase project is on one team member's account, is still empty, and has never had
`firestore.rules` or the 23 composite indexes deployed. Rather than let that block everything,
`npm run dev:reset` brings up both emulators, loads dev rules, wipes, seeds 285 documents and twelve
logins, checks every read under the **real** rules, and puts the dev rules back — one command, no
manual step.

That is a genuine substitute for development and an honest one for the demonstration, with one gap
that must be stated rather than papered over: **the emulator serves any query regardless of index**,
so a missing entry in `firestore.indexes.json` passes locally and fails in production. It is the one
production failure nothing here can catch, and getting console access is still the highest-value
unblock in the project.

A second consequence, worth knowing before it wastes an hour: `firestore.rules` cannot be deployed
against a fresh project at all, because every rule reads the caller's profile from `users/{uid}` and
those documents do not exist until Auth accounts do. The file header records the sequence.

---

## What has already gone wrong

Three failure modes, each found more than once. The conventions in `CLAUDE.md` exist because of these,
not in the abstract.

### `toISOString()` and UTC+6

`toISOString()` converts to UTC first. At UTC+6 a date entered as 15 August is stored as local
midnight and read back as the 14th. Every date here is a *business* date — the day a licence lapses,
the day a withdrawal takes effect, the day a sale was made — and between 00:00 and 06:00 local the UTC
form silently gates an early-morning sale on yesterday's rules.

Fixed three times in different places (`c61bb3b`, `631f9d8`, `f3d54f2`) before being banned outright.
`formatDate()` for display, `toTimestamp()` for storage, local getters for the clock half so a row's
date and time cannot land on opposite sides of midnight. Two sample-data screens still call it and are
named in `CLAUDE.md` §2 as exceptions, not precedent.

### The unscoped LIST

A service function issues a LIST for more documents than the caller's role may read, and Firestore
refuses the **whole query** rather than narrowing it. Six instances: `listCustomers()` showed an
officer none of their own dealers; `overriddenLicenceValue()` emptied the compliance report for an
Area Manager, then emptied it again one level lower when `sale_items` needed the scope too;
`getSaleItems()` killed the invoice modal and `cancelSale()` with it; `listDueSales()`,
`listCustomersWithDue()` and `productSalesReport()` were the same shape behind screens nobody had
opened.

Every one was invisible under the dev rules, which is where development happens. So the answer is not
care — it is `scripts/verify-rules.mjs`, which signs in as each seeded role, calls all 49 reads under
the real rules, and asserts **both** directions: a read the role may make must succeed, and one it may
not must be refused. It refuses to run under the dev rules rather than report a green line that means
nothing, and it fails when a new read is added and not listed. Three of the six were behind screens
that do not exist yet, which is exactly why nobody had seen them.

### The half-seeded emulator, and the orphaned one

`f76a626`: 285 documents seeded, no Auth accounts, and nothing could log in until a second script was
run by hand. A running emulator with a populated Firestore and no logins looks exactly like a working
machine until the login screen refuses you. `dev:reset` now exits non-zero and stops the emulator
rather than leaving that state — **"and then run X by hand" means the change is not finished.**

The mirror image on Windows: `spawn(..., { shell: true })` puts a `cmd.exe` between Node and `npx`,
and the wrapper dying does not take the Java and `firebase-tools` children with it. Closing the
terminal or killing the wrapper from Task Manager orphans ports 8080, 9099, 4000 and 4400, and the
next run fails with *"Is another emulator already running?"* — which reads exactly like a change
having broken something. Ctrl-C in the `dev:reset` window is the supported exit; it traps SIGINT and
takes the tree down with `taskkill /T /F`.
