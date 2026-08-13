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
export const MOVEMENT_TYPE = [
    'opening', 'purchase', 'purchase_return', 'sale', 'sale_return',
    'repack_in', 'repack_out', 'damage', 'transfer_in', 'transfer_out',
];
// Movement types that must carry a negative qty (schema §4.6: qty is always signed)
export const OUTWARD_MOVEMENTS = ['sale', 'damage', 'repack_out', 'purchase_return', 'transfer_out'];

// ── users ─────────────────────────────────────────────────────────────────
export const ROLE = [
    'Super Admin', 'Managing Director', 'Area Manager', 'Sales Officer',
    'Accountant', 'Storekeeper', 'Delivery Man', 'Dealer',
];

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
