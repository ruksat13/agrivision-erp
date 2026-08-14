# AgriVision ERP

Enterprise resource planning for an agricultural input (fertiliser, pesticide, seed)
distribution business in Bangladesh. React 19 + Firebase Firestore.

What makes it different from a general ERP is a rule engine at the point of sale:
it refuses a sale to a dealer whose government licence has lapsed, and refuses a
product whose registration has been withdrawn. See [`docs/UNIQUE-FEATURES.md`](docs/UNIQUE-FEATURES.md).

| Document | What is in it |
|---|---|
| [`docs/PROJECT-OUTLINE.md`](docs/PROJECT-OUTLINE.md) | Scope, users, access matrix, business flows |
| [`docs/UNIQUE-FEATURES.md`](docs/UNIQUE-FEATURES.md) | The features being claimed, and why |
| [`docs/FIRESTORE-SCHEMA.md`](docs/FIRESTORE-SCHEMA.md) | The data model — read this before writing a query |
| [`docs/SCREEN-AUDIT.md`](docs/SCREEN-AUDIT.md) | What each screen actually does today |
| [`src/services/README.md`](src/services/README.md) | **How to read and write data — read this before building a screen** |

---

## Getting started

```bash
npm install
```

### Working locally, with a database

The Firebase project lives on one team member's account. **You do not need access
to it to work on the app** — everything runs against the local emulator.

Two terminals.

**Terminal 1 — the database:**

```bash
npm run dev:reset
```

That single command starts the Firestore and Auth emulators, loads development
security rules, wipes whatever was there, seeds 240 documents and verifies them.
It takes about twenty seconds and then stays in the foreground.

**Terminal 2 — the app:**

```bash
npm run start:emulator
```

Opens on http://localhost:3000, pointed at the emulator. Log in with
`akib@agrivision.com` / `123456`.

> **The emulator keeps nothing on disk.** Close that first terminal, or restart
> your machine, and the data is gone. Run `npm run dev:reset` again — that is
> what it is for. Do not go looking for what broke.

### Working without a database

```bash
npm start
```

Runs against the real Firebase project. Unless you have been given access, every
read is refused and the screens that use the service layer show an empty state
with a notice saying so. That is deliberate — see
[`src/pages/SalesEntry.js`](src/pages/SalesEntry.js) for how a screen is expected
to behave when there is no data.

---

## Every script

| Command | What it does |
|---|---|
| `npm start` | Dev server against the real Firebase project |
| `npm run start:emulator` | Dev server against the local emulator |
| **`npm run dev:reset`** | **Emulator + dev rules + seed + verify, in one command** |
| `npm run dev:reset -- --no-seed` | Emulator and dev rules only, no data |
| `npm run dev:reset -- --keep` | Do not wipe first |
| `npm run emulators` | Just the emulators, nothing else |
| `npm run emulator:rules dev` | Load permissive rules into a running emulator |
| `npm run emulator:rules real` | Load the production rules into a running emulator |
| `npm run seed:emulator` | Wipe and re-seed a running emulator |
| `npm run seed` | Seed the **real** project (needs console access and dev rules) |
| `npm run verify:emulator` | Count documents and check the invariants |
| `npm run build` | Production build |
| `npm test` | Test runner |

---

## What the seed gives you

240 documents: 24 products, 30 dealers, 26 licences, 17 invoices with their lines,
12 users and opening stock across three offices. The dealers and invoices are
lifted from the sample arrays already in the pages, so the data looks real.

It is arranged so the two features can be demonstrated immediately:

| To show | Use |
|---|---|
| Licence block (Feature 1) | dealer `AIC-000001` — pesticide licence expired 15 days ago — plus any pesticide |
| A licence expiring soon | `AIC-000004` (4 days), `AIC-000005` (20 days) |
| A dealer with no licence at all | `AIC-000006` |
| Banned product block (Feature 2) | `AI-000905` or `AI-000906` — banned, and **not overridable** |
| A sale that passes cleanly | any dealer from `AIC-000007` onward with a fertiliser line |

Two things the seed does **not** invent, both explained at the top of
[`scripts/seed-data.mjs`](scripts/seed-data.mjs): product safety data is `null`
everywhere, and `bannedAuthority` is a placeholder pending a real DAE reference.

---

## Security rules

[`firestore.rules`](firestore.rules) holds the production rules.
**They are not deployable yet** — every rule reads the caller's profile from
`users/{uid}`, which does not exist until Firebase Auth is connected, so they
currently deny everything including the seed script. The file header explains
the sequence. That is why `dev:reset` swaps in permissive rules over the
emulator's admin API rather than editing the file.

To try the real rules against the emulator:

```bash
npm run emulator:rules real     # unauthenticated reads are now refused
npm run emulator:rules dev      # back to permissive
```

Deploying, once there is console access:

```bash
npx firebase deploy --only firestore:rules,firestore:indexes
```

---

## Layout

```
src/
  services/     Firestore layer — one file per collection. Screens import from here.
  rules/        The point-of-sale rule engine. Adding a rule is a file plus one line.
  pages/        Screens. SalesEntry.js is the one that creates a sale.
  config/       menu.js — the menu tree, and the source of the permission list
scripts/        Seeding, verification and the emulator harness
docs/           Specifications and the audit
```

Adding a rule to the sale engine — the whole change:

```js
// src/rules/myRule.js
export function myRule({ lines, saleDate }) { /* return blocks or [] */ }

// src/rules/checkSaleRules.js
import { myRule } from './myRule';
const RULES = [licenceRule, bannedRule, myRule];
```
