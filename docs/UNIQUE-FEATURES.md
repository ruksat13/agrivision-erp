# AgriVision ERP — Gap Analysis and Proposed Contribution

**Date:** 7 August 2026 · **Team:** 3 members · **Time remaining:** ~1 month
**Supersedes:** the 6 August 2026 version of this document (see §1)

---

## 1. Corrections to the Previous Version

The first draft of this document was written without reading the page implementations closely. Three
of its assumptions were wrong, and all three changed the effort estimates. They are recorded here
rather than quietly deleted, because the corrected reading is what the plan now rests on.

| Previous claim | What the code actually shows | Consequence |
|---|---|---|
| `Batch` is an empty shell for batch/expiry tracking | `Batch.js` is a **bill-of-materials / recipe** screen. A "batch product" (Agri Zink 1KG) is defined by its input materials (Agri Zink bulk 50 kg, packet 1 kg) with unit ratios. There is no manufacturing date, expiry date or lot number anywhere in it | Expiry tracking is a **new build**, not the filling-in of an existing shell. Effort was underestimated |
| `License` is an empty shell for dealer licences | `License.js` holds the **company's own** licences — Trade Licence, VAT Registration, Import Licence, issued by DNCC, NBR, MOC | A dealer licence register is a new concept, not a new field on an existing one |
| A sale can be blocked on the Sales screen | `Sales.js` is a **list with a status workflow** (Pending → Confirm → Delivered). There is no order-entry form. Sales rows carry no line items; the invoice modal fabricates them with `mockItems()` | **Every "block the sale" feature first requires a Sales Entry screen to be built.** This is the single largest hidden cost in the project |

The third correction is the important one, and §6 turns it from a problem into the plan's
organising idea.

**Also dropped from the previous version:** the crop-calendar demand forecast, which was ranked third
and is now recommended against outright. The reasoning is in §5.

---

## 2. Honest Starting Position

The current system reproduces the screen layout of an existing local product (saerp). Ninety-three
screens render, but every screen shows sample data held in the component, and no screen enforces a
rule that a general-purpose ERP does not already enforce. **As it stands the project has no
distinguishing feature.** A supervisor familiar with saerp will recognise the resemblance
immediately, so the gap is best acknowledged and closed rather than defended.

What the presentation layer does give the project is a domain vocabulary that generic ERPs lack —
territory hierarchy, repacking yield, inter-office demand requisition. The contribution proposed
below is narrower than "make all of that real": it is a small set of **enforcement rules at the point
of sale**, plus one document change, chosen because they are cheap to build, instant to demonstrate,
and defensible on grounds stronger than convenience.

---

## 3. What the Code Actually Contains

Findings that bear on the plan, with file references.

**Helps us**

- `Product.js:4` — the product master already carries `category` with values `Fertilizer`,
  `Pesticide`, `Seeds`. Product classification for a licence rule is therefore already present.
- `Customer.js:4` — the dealer master is thin (`name`, `phone`, `email`, `area`, `balance`,
  `status`). Thin is good: adding licence fields is trivial and breaks nothing.
- `Sales.js:17` — the invoice print template is real, self-contained, and already contains a styled
  callout box (`.offer-section`, yellow). A second box for safety information is a copy-and-recolour.
- `Repacking.js:13` — repacking already models input units, output units and totals, so yield
  accounting is closer to done than expected.
- `Recharts` is already a dependency; dashboards need no new library.

**Costs us**

- No data persistence anywhere. `firebase` is installed and `src/firebase.js` exists, but every page
  holds its data in `useState` with a hardcoded initial array. Refreshing the browser clears
  everything.
- No sales order entry (see §1).
- Authentication is browser-storage based, not Firebase Auth; passwords are not hashed.

---

## 4. Gap Analysis

`Y` present · `P` partial or requires heavy configuration · `N` absent

| Capability | Tally ERP | Odoo | saerp | **AgriVision (proposed)** |
|---|---|---|---|---|
| Sales, purchase, inventory, ledgers | Y | Y | Y | Y |
| Territory / area sales hierarchy | N | P | Y | Y |
| Officer-wise target and achievement | N | P | Y | Y |
| Credit limit enforcement | Y | Y | Y | Y |
| Role-based access control | Y | Y | Y | Y |
| Audit trail | Y | Y | P | Y |
| **Dealer licence register with expiry alerts** | N | N | N | **Y** |
| **Sale blocked when the dealer's licence has expired** | N | N | N | **Y** |
| **Sale blocked for a de-registered / banned product** | N | N | N | **Y** |
| **Bengali safety and dosage panel printed on the invoice** | N | N | N | **Y** |
| **Expired-stock sale block and expiry dashboard** | P | P | N | **Y** (if time allows) |

Note the middle block — credit limits, RBAC and audit trail are listed deliberately so that the
report does **not** claim them as contributions. They are table stakes. Only the lower block is
claimed.

Odoo can be made to do the lower block by writing a custom module. The claim is not that it is
impossible elsewhere; it is that no agri-input ERP ships it, and that the domain requires it.
State the claim that way and it will survive questioning.

---

## 5. Proposed Features, in Priority Order

Ranked by defensibility per unit of effort. Build 1 and 2. Add 3 — it is nearly free. Add 4 only if
Weeks 1–3 finish on schedule.

---

### Feature 1 — Dealer Licence Compliance Enforcement

**Build this first.**

**The problem.** Selling pesticide, and separately selling fertiliser, requires the buyer to hold a
valid government licence or dealer registration. Distributors track dealer licence expiry on paper
or not at all, and supplying a lapsed dealer exposes the distributor to penalty. No ERP checks this.

**What is built**

1. Dealer licence fields on the customer record: licence number, licence type (pesticide /
   fertiliser / seed), issuing authority, issue date, expiry date, scanned document reference.
2. A licence type authorises one or more product categories. `Product.category` already supplies the
   other half of the mapping.
3. Dashboard panel: licences expiring in 60 / 30 / 7 days, and those already expired.
4. **The enforcement rule:** on the Sales Entry screen, when a restricted product is added to an
   order for a dealer whose relevant licence has expired, the line is refused and the reason is
   stated on screen.
5. Override: an Area Manager may proceed with a written reason. The override, the reason and the user
   are recorded — an override that is not logged is not a control.
6. Compliance report: every dealer, licence status, days remaining, value sold under an expired
   licence.

**Why it is a contribution.** It converts a legal obligation into an automated control at the moment
the obligation applies. Generic ERPs model the counterparty as a ledger with a credit limit; none
model the counterparty as a licence holder whose licence gates a product category.

**Effort:** low, *once the Sales Entry screen exists*. Three fields on `Customer`, a mapping table,
and roughly 40 lines of check. The screen itself is the cost, and §6 explains why it must be built
anyway.

**Demonstration:** attempt a pesticide sale to a dealer whose licence expired yesterday. The sale is
refused on screen. Fifteen seconds, no explanation required.

**Legal basis:** see §7. **Risk:** low.

---

### Feature 2 — Banned and De-registered Product Block

**The problem.** Pesticide registrations are withdrawn and active ingredients are banned from a
stated date. Stock already in the channel must stop moving, but historic transactions remain valid.
An ERP that only has an Active/Inactive flag cannot express this: deactivating the product hides it
retrospectively and breaks old invoices.

**What is built**

1. `bannedFrom` date and `bannedReason` on the product record.
2. Sale and purchase of the product are refused on and after that date, with the reason and the
   authority shown.
3. Transactions dated before the ban remain readable and reportable, unaltered.
4. A short register of banned products with effective dates, printable.

**Why it is a contribution.** The date-effective distinction — banned going forward, valid
historically — is a regulatory concept, not an inventory concept. Generic ERPs have no vocabulary
for it.

**Effort:** very low. It is a second rule on the screen built for Feature 1 — roughly 20 lines. This
is the cheapest defensible feature in the project.

**Demonstration:** ten seconds. No explanation required.

**Legal basis:** see §7. **Risk:** low.

---

### Feature 3 — Bengali Safety and Dosage Panel on the Invoice

**The problem.** The dealer is the last person who speaks to the farmer, and dosage and safety advice
is passed on verbally or not at all. Misuse of agrochemicals in Bangladesh is a recognised
agricultural extension problem. The invoice is the one document that reliably reaches the dealer.

**What is built**

1. Safety fields on the product record: WHO hazard class (Ia / Ib / II / III / U), Bengali signal
   word (অতি বিষাক্ত / বিষাক্ত / সতর্কতা), pre-harvest interval in days, re-entry period, first-aid
   note, approved crops.
2. The invoice and challan print templates render these in Bengali in a bordered panel, colour-coded
   by hazard class, for every agrochemical line on the document.
3. Products with no safety data print a visible "safety data not recorded" marker rather than
   silently printing nothing.

**Why it is a contribution.** An ERP invoice is a financial document everywhere else. Making it also
carry regulated safety information is, as far as we can establish, not done by any commercial ERP.

**Effort:** very low — about half a day. The print template at `Sales.js:17` already has a styled
callout box to copy.

**Demonstration:** print an invoice; the panel is there. Ten seconds, no explanation. Visually the
most striking of the four.

**Honest limit on the justification — state this exactly as written in the defence.** Bangladesh's
pesticide labelling requirements apply to the **container label**, not to the invoice. This feature
is therefore *derived from* a labelling regime rather than *required by* it. It is a safety
improvement grounded in a real extension problem, not a legal obligation. Claiming otherwise will not
survive a supervisor who knows the rules, and the honest version is still a good feature.

**Risk:** low. The only real cost is authoring plausible safety data for the demo products.

---

### Feature 4 — Expired Stock Block and Expiry Dashboard *(only if ahead of schedule)*

**The problem.** Agrochemicals carry expiry dates. Selling expired product is both unlawful and
agronomically useless, and expiring stock is capital about to be written off.

**What is built**

1. Expiry date and manufacturing date captured at goods receipt on the Purchase screen.
2. Stock carries its expiry date through to the sale.
3. Sale of expired stock is refused — a third rule on the same screen.
4. Expiry dashboard: stock expiring within 90 days, valued, by depot.

**Why it is scoped down from the previous draft.** The earlier version proposed full FEFO
(first-expiry-first-out) allocation plus a one-click recall trace to every dealer holding a batch.
Both are good features and both are out of reach: they require every stock movement — purchase,
repack, sale, return, damage — to carry a lot identity, and `Batch.js` does not provide one (§1).
That is a data-model change across the whole application, in a month, by a team that has not yet
connected a database.

**Effort:** moderate — the only feature here that touches the purchase and stock screens rather than
just the sales screen.

**Demonstration:** twenty seconds, no explanation.

**Risk:** medium. Attempt only after 1–3 are demonstrably finished.

---

### Optional — Government Fertiliser Allocation Quota *(take only if the business case fits)*

**What it would be.** Subsidised fertilisers (urea, TSP, DAP, MOP) are distributed to dealers against
periodic allocations. Track each dealer's allocation and liftings; block or warn when the allocation
is exceeded; report allocation against lifting.

**Why it is tempting.** No ERP anywhere models a government allocation quota. It is the most
distinctly Bangladeshi idea available, and it demonstrates in twenty seconds.

**Why it is not recommended by default.** The sample data throughout this project — `Product.js:4`,
`Batch.js:9`, `Repacking.js:13` — describes a pesticide and micronutrient business, not a subsidised
fertiliser dealership. If the supervisor asks whether the modelled company actually distributes
subsidised fertiliser and the answer is no, the feature becomes a liability. **Adopt it only if the
business scenario genuinely includes subsidised fertiliser distribution.** If it does, it ranks
immediately after Feature 2.

---

## 6. The Organising Idea — One Screen, Four Rules

Because there is no sales order entry (§1), one must be built. It is required for a credible ERP
regardless of the contribution, and a supervisor will notice its absence.

Treat that necessity as the plan's centre. **Build the Sales Entry screen once, then hang every
enforcement rule on it.** After the screen exists, each additional rule costs 20–40 lines:

```
Select dealer   → licence validity check      → block  (Feature 1)
Add product     → banned-product check        → block  (Feature 2)
                → expired-stock check         → block  (Feature 4)
Print invoice   → Bengali safety panel        → render (Feature 3)
```

Three consequences worth stating in the report:

1. **The features share an architecture.** They are one thing — a rule engine at the point of sale —
   not four unrelated additions. That reads better academically than a list.
2. **The work parallelises.** One person builds the screen and the rule interface; the other two
   write rules and data behind it.
3. **The demonstration is one continuous sequence** of about forty-five seconds, not four separate
   setups. Rehearsed, this is the strongest two minutes of the defence.

---

## 7. Legal Basis — and What Must Be Verified

The strength of Features 1 and 2 rests on there being a real legal obligation. The report must cite
it correctly. Below is what we believe to be the position and how confident we are. **Every item
marked "VERIFY" must be checked against the official gazette, the Department of Agricultural
Extension, or the Ministry of Agriculture website before it goes into the report. Do not submit a
citation taken from this document unchecked.**

| Point | Confidence | Action required |
|---|---|---|
| Selling pesticide in Bangladesh requires a licence, and retailers/dealers must hold one | Reasonably confident in substance | **VERIFY** the current governing statute and its year |
| The governing law is the Pesticide Act 2018 (বালাইনাশক আইন, ২০১৮), succeeding the Pesticide Ordinance 1971 | Believed correct, not certain | **VERIFY** exact title, year, and whether later amendments apply |
| Pesticide Rules (1985, and later revisions) set out licensing and labelling detail | Believed correct | **VERIFY** which rules are currently in force, and their year |
| Licensing is administered through the Department of Agricultural Extension / Plant Protection Wing | Reasonably confident | **VERIFY** the current administering body and licence categories |
| Fertiliser dealers require registration under the Fertilizer (Management) Act 2006 (সার ব্যবস্থাপনা আইন, ২০০৬) | Believed correct | **VERIFY** title, year, and the registration requirement's scope |
| Registrations of specific pesticides are withdrawn / active ingredients banned by government notification, with effect from a stated date | Confident in substance | **VERIFY** by obtaining one or two actual notifications to cite as examples |
| The WHO Recommended Classification of Pesticides by Hazard uses classes Ia, Ib, II, III, U | Confident | Cite the WHO classification document directly; it is public |
| Labelling requirements (hazard marking, signal words) attach to the **container**, not the invoice | Confident | No verification needed — but see the honest limit stated in Feature 3 |

**No section or rule numbers appear anywhere in this document.** That is deliberate. A precise-looking
citation that turns out to be wrong does more damage in a viva than an honest "the licensing
requirement is established by the Pesticide Act; the specific section is cited in the report." Find
the numbers yourselves, from the source, and only then write them down.

**Cheapest way to close this gap:** one visit to a local pesticide or fertiliser dealer. Ask to see
their licence. Photograph it, with permission. A photograph of a real dealer licence in the report,
with its issuing authority and expiry date visible, is worth more than any number of citations — it
proves the problem exists outside the report.

---

## 8. One-Month Plan for Three People

Roles: **A — data layer · B — domain features · C — documentation and reporting.**
Everyone reviews the others' work; nobody is the only person who understands a part.

### Week 1 (7–13 Aug) — Persistence and the Sales Entry Screen

Nothing else can be built until data persists. This week is the critical path, and the plan is
already one week into the month.

- **A:** Firestore schema, written down as an ERD. **Do not migrate all 93 screens.** Migrate only
  `products`, `customers`, `sales`, `sales_items`, `users`, `audit_log`. Connect Firebase
  Authentication; remove the hardcoded passwords.
- **B:** Build the **Sales Entry screen** — dealer selector, product lines, quantity, price, save.
  Design the rule check as a single pluggable function (`checkSaleRules(dealer, product, qty)`
  returning a list of blocks and warnings) so Features 1, 2 and 4 are additions to one place, not
  three separate edits.
- **C:** Use case diagrams, ERD, DFDs from PROJECT-OUTLINE.md. Report skeleton. **Begin the legal
  verification in §7 this week** — it gates two features and depends on nobody's code.

**Week 1 exit test:** create a sale on the new screen, refresh the browser, the sale is still there.

### Week 2 (14–20 Aug) — Features 1 and 2

- **A:** Firestore Security Rules enforcing the access matrix server-side. Audit log written on every
  create, update and delete, including rule overrides.
- **B:** **Feature 1 in full** — licence fields, expiry dashboard panel, the blocking rule, the
  override with reason, the compliance report. Then **Feature 2** — it is a second rule on the same
  interface and should take under a day.
- **C:** Sequence diagrams, including one for licence validation blocking a sale. Report chapters
  1–3. Test data: 20 products, 15 dealers — 5 with licence problems, 2 banned products.

**Week 2 exit test:** a sale to an expired-licence dealer is refused on screen; a manager override is
recorded in the audit log with its reason.

### Week 3 (21–27 Aug) — Feature 3, then Feature 4 if clear

- **A:** Reports and dashboard read real data.
- **B:** **Feature 3** (half a day). Then **Feature 4** only if Features 1 and 2 are closed and
  tested — not merely "working on my machine".
- **C:** Report chapters 4–6. Screenshots. Test cases and results.

**Week 3 exit test:** an invoice prints with the Bengali safety panel for every agrochemical line.

### Week 4 (28 Aug – 3 Sep) — Consolidate

**Freeze new features on 30 August.** Nothing new after that date, Feature 4 included.

- **All three:** cross-test each other's modules. Fix by severity.
- **A:** Performance check, backup procedure, deployment notes.
- **B:** Defects only.
- **C:** Finish the report and slides. **Rehearse the demonstration three times**, timed.

**Week 4 exit test:** the full sequence — log in, create an order, blocked on licence, blocked on
banned product, override with reason, print invoice with safety panel — completed without a crash,
twice in a row, in under two minutes.

---

## 9. Scope Honesty in the Report

The report must state plainly which modules are backed by the database and which still display sample
data. Six live modules honestly labelled is a stronger submission than ninety-three modules implied
to work. Examiners test the boundary, and finding an undisclosed one costs more marks than the
limitation itself would have.

**Deferred, and to be listed as future work rather than claimed:**

- FEFO allocation and one-click batch recall with dealer trace — needs lot identity on every stock
  movement (§5, Feature 4)
- Crop-calendar seasonal demand forecast — see §10
- Offline-first field ordering — valuable for rural connectivity, far too large for one month
- GPS-verified field visits — see §10
- Dealer self-service portal — specified in PROJECT-OUTLINE.md §3.8, built later

---

## 10. Ideas Considered and Rejected

Recorded with reasons, because a supervisor may ask why an obvious idea was not taken, and "we
considered it and rejected it for these reasons" is a better answer than "we didn't think of it."

**Crop-calendar demand forecast — rejected.** Ranked third in the previous draft; recommended against
now. It fails on three counts. It cannot be demonstrated without explanation — the screen shows a
number, and the obvious question is where the number came from, which takes minutes to answer. It
requires a year of sales history that the team would have to fabricate, making it a forecast derived
from invented data and validated against the same invented data; an examiner may well say so. And its
justification is convenience, not obligation. It reads well on paper and performs badly in a viva.

**GPS-verified field visits — rejected.** Cheap to build with the browser geolocation API, but it
cannot be demonstrated in an examination room: the point of the feature is that the officer is
physically at the dealer's shop, and that cannot be shown from a seat. A feature that needs a
paragraph of explanation before it means anything is the opposite of what this project needs.

**Offline-first synchronisation — rejected.** Genuinely valuable in rural Bangladesh, and genuinely
out of reach for a team that has not yet connected a database.

**Not claimed as contributions, because every ERP has them:** credit limit enforcement, audit trail,
role-based access control, SMS notification, a dealer portal. All are worth having, and PROJECT-OUTLINE.md
already specifies several. None of them answers "what is unique about your ERP?", and offering one as
an answer invites the supervisor to say so.

---

## 11. Answering the Supervisor

One sentence, then the evidence:

> A general ERP records what was bought and sold. Ours refuses to let an unlawful sale happen — it
> blocks a sale to a dealer whose government licence has lapsed, blocks a product whose registration
> has been withdrawn, and prints the farmer's safety and dosage information in Bengali on the
> dealer's own invoice.

Then show the gap analysis table (§4), then demonstrate. Three features demonstrated end to end will
score better than eight described and half-built.

**If asked why the system resembles saerp** — answer directly: the screen layout was studied from an
existing product in order to understand what the domain requires, and the contribution is the
enforcement layer that no existing product provides. Studying an incumbent is ordinary practice. Put
it in the literature review rather than leaving it to be discovered.

**If asked whether Odoo could do this** — yes, by writing a custom module. Do not claim otherwise.
The claim is that no agri-input ERP ships it, that the domain requires it, and that this project
implements it.

---

## 12. The Cheapest Way to Strengthen the Report

**Interview two or three dealers or distributors.** One question: *what takes the most time, and what
goes wrong most often?* Two or three quoted answers turn a feature list into requirements grounded in
evidence, and move the project from "a student built an application" to "a student identified a
problem and addressed it". Combine the visit with photographing a real dealer licence (§7).

This is the highest-value hour available to the team and it costs no development time. If field
access is genuinely impossible, cite the licensing statutes and published agricultural extension
material instead — but try the visit first.
