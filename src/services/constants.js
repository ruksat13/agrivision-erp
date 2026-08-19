// Enumerations and collection names from docs/FIRESTORE-SCHEMA.md.
// Everything that the schema calls an enumeration lives here, so a typo in a
// screen fails loudly at write time instead of quietly storing a bad value.

export const COL = {
    PRODUCTS: 'products',
    CUSTOMERS: 'customers',
    LICENCES: 'licences',
    SALES: 'sales',
    SALE_ITEMS: 'sale_items',
    STOCK_MOVEMENTS: 'stock_movements',
    USERS: 'users',
    AUDIT_LOG: 'audit_log',
    COUNTERS: 'counters',

    // Tier 2 (schema §10) — migrated while wiring the fourteen dead Save
    // buttons of SCREEN-AUDIT.md §2.1, in the order given by §2.1.1.
    EXPENSE_HEADS: 'expense_heads',
    BANK_ACCOUNTS: 'bank_accounts',
    OFFERS: 'offers',
    PRODUCT_DEMANDS: 'product_demands',
    SUPPLIERS: 'suppliers',
    OPENING_BALANCES: 'opening_balances',
    SUPPLIER_PAYMENTS: 'supplier_payments',
    COMMISSIONS: 'commissions',
    EXPENSES: 'expenses',
    PURCHASES: 'purchases',
    PURCHASE_ITEMS: 'purchase_items',
    PURCHASE_RETURNS: 'purchase_returns',
    BOMS: 'boms',
    REPACKINGS: 'repackings',
};

// ── products ──────────────────────────────────────────────────────────────
export const PRODUCT_CATEGORY = ['Pesticide', 'Fertilizer', 'Seed', 'PGR', 'Packaging', 'Gift'];
export const PRODUCT_TYPE = ['Finished', 'Raw Material', 'Carton', 'Label'];
export const UNIT = ['KG', 'GM', 'LTR', 'ML', 'PCS'];
export const WHO_CLASS = ['Ia', 'Ib', 'II', 'III', 'U'];
export const STATUS = ['Active', 'Inactive'];

// ── licences ──────────────────────────────────────────────────────────────
export const LICENCE_SCOPE = ['company', 'dealer'];
export const LICENCE_TYPE = ['Pesticide', 'Fertilizer', 'Seed', 'Trade', 'VAT', 'Import'];

// Which licence types belong to which scope. A dealer holds a government
// permission to TRADE a restricted category; the company's own Trade, VAT and
// Import papers are not something a dealer has, and offering all six on both
// forms is how a VAT registration ends up filed against a dealer where the
// Feature 1 rule will never look for it (LICENCE_FOR_CATEGORY maps categories
// onto the first three only).
export const LICENCE_TYPE_FOR_SCOPE = {
    dealer: ['Pesticide', 'Fertilizer', 'Seed'],
    company: ['Trade', 'VAT', 'Import'],
};

/**
 * Who may create or renew a licence.
 *
 * The same arrangement OVERRIDE_ROLES has below: this list is written TWICE on
 * purpose — here, so the License screen does not offer an Add button to a
 * Sales Officer whose save the server would refuse, and again in
 * firestore.rules (`match /licences`, create/update), which is the copy that
 * actually holds. Security Rules cannot import JavaScript, so the two are kept
 * in step by hand. Change both.
 *
 * A Sales Officer is absent because licence upkeep is not theirs — the same
 * reasoning that keeps /compliance-report off OFFICER_PERMISSIONS in
 * scripts/seed-data.mjs.
 */
export const LICENCE_WRITE_ROLES = ['Super Admin', 'Area Manager', 'Accountant'];

// Which licence type authorises which product category (schema §4.3).
// This is a rule, not data — it deliberately lives in code, not in Firestore.
export const LICENCE_FOR_CATEGORY = {
    Pesticide: 'Pesticide',
    PGR: 'Pesticide',
    Fertilizer: 'Fertilizer',
    Seed: 'Seed',
    Packaging: null,   // no licence required
    Gift: null,
};

// ── sales ─────────────────────────────────────────────────────────────────
export const SALE_STATUS = [
    'Pending', 'Confirm', 'Processing', 'Scanning', 'Scanned',
    'Picked', 'Shipped', 'Delivered', 'Cancelled',
];
// The forward workflow, excluding Cancelled — used by nextStatus()
export const SALE_FLOW = SALE_STATUS.filter(s => s !== 'Cancelled');
export const PAYMENT_TYPE = ['Cash', 'Credit'];
export const SALE_SOURCE = ['Admin', 'App'];

// ── stock ─────────────────────────────────────────────────────────────────
export const OFFICE = ['head', 'jessore', 'jamalpur'];

// The screens print the long form. Stored is always the short id, so renaming
// an office is a change here and nowhere else.
export const OFFICE_LABEL = {
    head: 'Head Office',
    jessore: 'Jessore Office',
    jamalpur: 'Jamalpur Office',
};
export const officeLabel = (id) => OFFICE_LABEL[id] || id || '';
export const officeOptions = () => OFFICE.map(id => ({ value: id, label: OFFICE_LABEL[id] }));
export const MOVEMENT_TYPE = [
    'opening', 'purchase', 'purchase_return', 'sale', 'sale_return',
    'repack_in', 'repack_out', 'damage', 'transfer_in', 'transfer_out',
];
// Movement types that must carry a negative qty (schema §4.6: qty is always signed)
export const OUTWARD_MOVEMENTS = ['sale', 'damage', 'repack_out', 'purchase_return', 'transfer_out'];

// ── offers (schema §10) ───────────────────────────────────────────────────
// Offers do not use STATUS. An offer has a publish state of its own, and the
// screen's Delete needs a resting place that is not "unpublished" — Archived is
// this collection's soft delete.
export const OFFER_STATUS = ['Publish', 'Unpublish', 'Archived'];
export const OFFER_TYPE = ['Instant Deal', 'Closing Deal'];
export const OFFER_BUY_TYPE = ['Product', 'Amount', 'Quantity'];
export const OFFER_MODULE = ['Product', 'Category', 'Brand'];

// ── product_demands (schema §10) ──────────────────────────────────────────
// An inter-office stock request. `Cancel` rather than `Cancelled` because that
// is the word already on the screen and in the sample rows.
export const DEMAND_STATUS = ['Pending', 'Approved', 'Received', 'Cancel'];

// ── parties, ledgers and commissions (schema §10) ─────────────────────────
// `opening_balances` and `commissions` each serve both a customer screen and a
// supplier screen, distinguished by `party` — decision D4's reasoning applied
// twice more.
export const PARTY = ['customer', 'supplier'];
export const ENTRY_TYPE = ['Debit', 'Credit'];
export const OPENING_STATUS = ['Approved', 'Cancel'];

// How a Debit/Credit moves the party's balance. A customer's balance is a
// receivable and a supplier's is a payable, so the same word moves them in
// opposite directions. Nothing outside signedDelta() in openingBalances.js
// should ever apply this by hand.
export const BALANCE_SIGN = {
    customer: { Debit: +1, Credit: -1 },
    supplier: { Debit: -1, Credit: +1 },
};

// Not PAYMENT_TYPE — a sale is Cash or Credit, but a payment to a supplier is
// made by some actual method.
export const PAY_METHOD = ['Cash', 'bKash', 'Nagad', 'Bank Transfer', 'Cheque', 'RTGS'];
export const PAYMENT_STATUS = ['Pending', 'Approved', 'Cancelled'];

// ── purchases, returns and repacking (schema §10) ─────────────────────────
// A purchase is either received or cancelled — there is no pending state,
// because saving one already moved the stock. A return is approved first,
// because the goods have to physically go back.
export const PURCHASE_STATUS = ['Stock Done', 'Cancelled'];
export const RETURN_STATUS = ['Pending', 'Approved', 'Cancelled'];
export const REPACK_STATUS = ['Pending', 'Done', 'Cancelled'];

// The Expense screen posts money out AND money in; the badge on each row says
// which, and Head Wise Expense nets them.
export const EXPENSE_TYPE = ['Expense', 'Income'];

export const COMMISSION_BASIS = ['Yearly', 'Purchase', 'Invoice', 'Product', 'Travel'];
export const COMMISSION_METHOD = ['Amount', 'Percentage'];
export const COMMISSION_STATUS = ['Pending', 'Approved', 'Cancelled'];

// ── users ─────────────────────────────────────────────────────────────────
export const ROLE = [
    'Super Admin', 'Managing Director', 'Area Manager', 'Sales Officer',
    'Accountant', 'Storekeeper', 'Delivery Man', 'Dealer',
];

/**
 * Who may waive a blocking sale rule (PROJECT-OUTLINE.md §3.4). A Sales Officer
 * raises the order and is the person the block is aimed at, so they are not on
 * this list — otherwise the control is advisory.
 *
 * This list is enforced TWICE on purpose: here, so the Override button is not
 * offered to an officer who cannot use it, and again in firestore.rules, which
 * refuses the rule_override audit entry outright. The rules copy is the real
 * control; a gate that exists only in the UI is not a control. Security Rules
 * cannot import JavaScript, so the two are kept in step by hand — the same
 * arrangement BALANCE_SIGN already has with scripts/verify.mjs.
 */
export const OVERRIDE_ROLES = ['Super Admin', 'Managing Director', 'Area Manager'];

/**
 * Who may change an invoice after it exists — advance its status, or cancel it.
 *
 * The third list kept in step by hand with firestore.rules, after
 * OVERRIDE_ROLES and LICENCE_WRITE_ROLES. The rule is the `sales` block:
 * `allow update: if isAdmin() || myArea(resource.data.areaId)`. An Area Manager
 * is restricted to their own area there and is not restricted here, because
 * listSales() is scoped — every row a manager can see is already one the rule
 * lets them update.
 *
 * A Sales Officer raises the order and cannot then move or cancel it:
 * PROJECT-OUTLINE.md §3.4 makes cancellation a request to their Area Manager.
 * Sales.js used to offer them the buttons anyway, and clicking one produced
 * "PERMISSION_DENIED: evaluation error at L169:24 for 'update'" on screen — the
 * §6 failure where a screen can only produce an error.
 *
 * The Accountant reads `sales` and cannot update one, so they are absent too.
 *
 * This happens to hold the same three roles as OVERRIDE_ROLES and is a
 * different decision — waiving a blocking rule and editing a saved invoice are
 * not the same authority. Kept separate so changing one does not silently
 * change the other.
 */
export const SALE_UPDATE_ROLES = ['Super Admin', 'Managing Director', 'Area Manager'];

// ── audit ─────────────────────────────────────────────────────────────────
export const AUDIT_ACTION = [
    'create', 'update', 'delete', 'login', 'logout', 'approve', 'rule_override', 'seed',
];

// ── rule codes (checkSaleRules) ───────────────────────────────────────────
export const RULE_CODE = {
    LICENCE_EXPIRED: 'LICENCE_EXPIRED',
    LICENCE_MISSING: 'LICENCE_MISSING',
    PRODUCT_BANNED: 'PRODUCT_BANNED',
    CREDIT_LIMIT_EXCEEDED: 'CREDIT_LIMIT_EXCEEDED',
};
