// products — schema §4.1
//
// Carries the fields for Feature 2 (banned product) and Feature 3 (Bengali
// safety panel). Both sets are written as null when unknown, never omitted:
// Feature 3 prints a visible "safety data not recorded" marker, and that is
// only distinguishable from a bug if "unknown" was recorded on purpose.

import { COL, PRODUCT_CATEGORY, PRODUCT_TYPE, UNIT, WHO_CLASS, STATUS } from './constants';
import {
    createDoc, updateDoc_, softDelete, getById, getByIdOrThrow, listDocs,
    requireFields, assertEnum, toNumber, toTimestamp, toDate, money, ServiceError,
} from './core';

/** Fields defined by the schema but not yet known. Written as null (§2). */
const NULLABLE_DEFAULTS = {
    brandId: null,
    originId: null,
    buyPrice: null,
    // Feature 2
    bannedFrom: null,
    bannedReason: null,
    bannedAuthority: null,
    // Feature 3
    whoClass: null,
    signalWordBn: null,
    phiDays: null,
    reentryHours: null,
    firstAidBn: null,
    dosageBn: null,
    approvedCropsBn: null,
    safetySource: null,
    // Feature 4 (cut from this submission; field reserved so no migration is needed)
    requiresExpiry: false,
};

// ── Reads ─────────────────────────────────────────────────────────────────

export const getProduct = (code) => getById(COL.PRODUCTS, code);
export const getProductOrThrow = (code) => getByIdOrThrow(COL.PRODUCTS, code);

/**
 * listProducts({ category, type, status, search })
 *
 * `search` is applied in memory over name and code — Firestore has no
 * substring query, and at this catalogue size (a few hundred rows) filtering
 * client-side is both simpler and faster than maintaining a search index.
 */
export async function listProducts({ category, type, status = 'Active', search } = {}) {
    const rows = await listDocs(COL.PRODUCTS, {
        filters: [['category', '==', category], ['type', '==', type], ['status', '==', status]],
        order: ['name', 'asc'],
    });
    if (!search) return rows;
    const k = search.toLowerCase();
    return rows.filter(p => p.name.toLowerCase().includes(k) || p.code.toLowerCase().includes(k));
}

/** Options for a <select>. Use this instead of hardcoding a product array. */
export async function productOptions(filter = {}) {
    const rows = await listProducts(filter);
    return rows.map(p => ({ value: p.code, label: `${p.name} [${p.code}]`, product: p }));
}

// ── Writes ────────────────────────────────────────────────────────────────

/**
 * createProduct({ code, name, category, unitId, packSize, packQty, type,
 *                 cartonQty, mrp, ... })
 * The product code becomes the document ID.
 *
 * The Product page's form collects no safety figures, but this takes the whole
 * document, so a caller could pass them — and `firestore.rules` refuses a
 * product carrying figures with no source on create as well as on update.
 * assertSafetyProvenance() below keeps this path from reaching that refusal.
 */
export async function createProduct(input) {
    requireFields(input, ['code', 'name', 'category', 'unitId', 'packSize', 'type', 'mrp'], 'createProduct');
    assertEnum(input.category, PRODUCT_CATEGORY, 'category');
    assertEnum(input.type, PRODUCT_TYPE, 'type');
    assertEnum(input.unitId, UNIT, 'unitId');
    if (input.whoClass) assertEnum(input.whoClass, WHO_CLASS, 'whoClass');

    const data = {
        ...NULLABLE_DEFAULTS,
        ...input,
        code: input.code,
        packQty: toNumber(input.packQty ?? 1, 'packQty'),
        cartonQty: toNumber(input.cartonQty ?? 1, 'cartonQty'),
        mrp: money(toNumber(input.mrp, 'mrp')),
        buyPrice: input.buyPrice == null ? null : money(toNumber(input.buyPrice, 'buyPrice')),
        bannedFrom: toTimestamp(input.bannedFrom),
        status: input.status ?? 'Active',
    };
    assertEnum(data.status, STATUS, 'status');
    data.safetySource = cleanSource(data.safetySource);
    assertSafetyProvenance(data, 'createProduct');
    return createDoc(COL.PRODUCTS, data, { id: input.code });
}

export async function updateProduct(code, patch) {
    if (patch.category) assertEnum(patch.category, PRODUCT_CATEGORY, 'category');
    if (patch.type) assertEnum(patch.type, PRODUCT_TYPE, 'type');
    if (patch.status) assertEnum(patch.status, STATUS, 'status');
    if (patch.whoClass) assertEnum(patch.whoClass, WHO_CLASS, 'whoClass');

    const clean = { ...patch };
    if ('mrp' in clean) clean.mrp = money(toNumber(clean.mrp, 'mrp'));
    if ('bannedFrom' in clean) clean.bannedFrom = toTimestamp(clean.bannedFrom);
    return updateDoc_(COL.PRODUCTS, code, clean);
}

export const deactivateProduct = (code, reason) => softDelete(COL.PRODUCTS, code, { reason });

// ── Feature 2 — banned / de-registered products ───────────────────────────

/**
 * Mark a product as withdrawn from a stated date.
 *   banProduct('AI-000730', { from: '2026-07-01', reason: '…', authority: '…' })
 *
 * Note what this does NOT do: it does not deactivate the product. The product
 * stays selectable so that adding it to an order produces a visible refusal.
 * Hiding it from the dropdown would conceal the feature instead of showing it
 * (UNIQUE-FEATURES.md §5, Feature 2).
 */
export async function banProduct(code, { from, reason, authority }) {
    if (!from || !reason) {
        throw new ServiceError('VALIDATION', 'A ban needs an effective date and a reason.');
    }
    return updateProduct(code, {
        bannedFrom: toTimestamp(from),
        bannedReason: reason,
        bannedAuthority: authority ?? null,
    });
}

export const unbanProduct = (code) =>
    updateProduct(code, { bannedFrom: null, bannedReason: null, bannedAuthority: null });

/**
 * Is this product banned as at the given date?
 * Always pass the sale date, never today's — a sale dated before the ban stays
 * valid and must still print.
 */
export function isBannedOn(product, onDate) {
    const from = toDate(product?.bannedFrom);
    if (!from) return false;
    const when = toDate(onDate) ?? new Date();
    return when >= from;
}

/**
 * The register of withdrawn products — UNIQUE-FEATURES.md §5 Feature 2 point 4,
 * newest withdrawal first.
 *
 * It used to read `filters: [['bannedFrom', '!=', null]]`, and returned the
 * WHOLE catalogue: listDocs() drops any filter whose value is null, undefined
 * or '' — deliberately, so callers can pass optional arguments straight through
 * — and `null` here is the value being compared against, not an absent
 * argument. The filter was silently removed and the query became "every
 * product, ordered by bannedFrom". All 24 seeded products came back as banned,
 * of which 2 are. Caught by scripts/verify-rules.mjs printing row counts beside
 * every read: 24 where the answer had to be 2.
 *
 * Filtered in memory instead of restoring the inequality. `!=` against null is
 * awkward in Firestore, it would need its own index to combine with the sort,
 * and the catalogue is a few hundred rows — the same trade listProducts()
 * already makes for `search`.
 *
 * status: null so a product withdrawn AND deactivated still appears. The
 * register exists to say what may no longer be sold, and being deactivated as
 * well does not make that less true.
 */
export async function listBannedProducts() {
    const rows = await listProducts({ status: null });
    return rows
        .filter(p => p.bannedFrom)
        .sort((a, b) => (toDate(b.bannedFrom)?.getTime() ?? 0) - (toDate(a.bannedFrom)?.getTime() ?? 0));
}

// ── Feature 3 — Bengali safety panel ──────────────────────────────────────

/** The seven figures §4.1 groups under Feature 3. `safetySource` is not one of
 *  them — it is the provenance the seven require. */
const SAFETY_FIELDS = [
    'whoClass', 'signalWordBn', 'phiDays', 'reentryHours',
    'firstAidBn', 'dosageBn', 'approvedCropsBn',
];

/**
 * Does this field carry a recorded value?
 *
 * Deliberately not `Boolean(v)`. Two of the seven fail a truthiness test in
 * opposite directions:
 *
 *   phiDays: 0, reentryHours: 0  are *recorded figures* — "harvest the same
 *       day", "re-entry immediately" are things a label says, and they are the
 *       readings a reader most needs to be able to trust. A falsy test would
 *       let them through with no source.
 *   approvedCropsBn: []          is an *absence*. Nothing was recorded; an
 *       empty list must not drag a source requirement in behind it.
 *
 * A whitespace-only string is an absence too, on the same reasoning that
 * `safetySource` of "   " is not a source.
 */
const isRecorded = (v) => {
    if (v == null) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'string') return v.trim() !== '';
    return true;                              // numbers, 0 included
};

/**
 * The value as it should be STORED: whatever isRecorded() calls an absence is
 * written as `null`, per §4.1's "write null, do not omit". A blank string left
 * in the document would be an absence to this file and to `firestore.rules` but
 * a value to `hasSafetyData()`, which would print a panel of blanks under a
 * blank source line — the exact page this whole control exists to prevent.
 */
const storedValue = (v) => {
    if (!isRecorded(v)) return null;
    return typeof v === 'string' ? v.trim() : v;
};

/** The trimmed source, or null when there is not one. */
const cleanSource = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);

/**
 * No safety figure without a stated source (§9, CLAUDE.md §7).
 *
 * Called on both write paths that can put figures on a product, because this is
 * a control and not a form validation: `firestore.rules` refuses the same
 * document, so a caller that got past here would only reach a raw
 * permission-denied on screen. Clearing safety data — all seven absent, no
 * source — stays legal, and is the "empty beats plausible" path.
 */
function assertSafetyProvenance(data, where) {
    if (cleanSource(data.safetySource)) return;
    const carried = SAFETY_FIELDS.filter(f => isRecorded(data[f]));
    if (!carried.length) return;
    throw new ServiceError(
        'VALIDATION',
        `${where}: safety figures cannot be saved without a source. `
        + `Say where ${carried.join(', ')} came from — a photographed label, a `
        + `leaflet, or "PLACEHOLDER" if these are demonstration figures. `
        + `The invoice prints that line verbatim.`,
        { fields: carried },
    );
}

/**
 * setSafetyData('AI-000730', { whoClass, signalWordBn, phiDays, reentryHours,
 *                              firstAidBn, dosageBn, approvedCropsBn, safetySource })
 *
 * Every field is written on every call, `null` included — this replaces the
 * whole safety block rather than patching part of it, so a field cleared on the
 * form is cleared in the database. Callers must therefore pass the complete
 * set; the Product page's dialog collects all of them for that reason.
 *
 * `safetySource` says where the figures came from — a photographed label, a
 * leaflet, or a placeholder. It is not decoration. §9 of the schema doc is
 * entirely about where these fields come from, and the panel prints this line
 * whatever it says, so demonstration data cannot be mistaken on a printed page
 * for something read off a container. A call carrying any of the seven with no
 * source is refused here and again by `firestore.rules`; the second one is the
 * control (CLAUDE.md §6).
 *
 * An absence is normalised to `null` on the way in — a blank string and an
 * empty crop list are both "nothing recorded", and storing either as itself
 * would leave a document the panel treats as data and the source check treats
 * as empty.
 */
export async function setSafetyData(code, safety) {
    if (safety.whoClass) assertEnum(safety.whoClass, WHO_CLASS, 'whoClass');
    const block = {
        whoClass: storedValue(safety.whoClass),
        signalWordBn: storedValue(safety.signalWordBn),
        phiDays: safety.phiDays == null ? null : toNumber(safety.phiDays, 'phiDays'),
        reentryHours: safety.reentryHours == null ? null : toNumber(safety.reentryHours, 'reentryHours'),
        firstAidBn: storedValue(safety.firstAidBn),
        dosageBn: storedValue(safety.dosageBn),
        approvedCropsBn: storedValue(safety.approvedCropsBn),
        safetySource: cleanSource(safety.safetySource),
    };
    assertSafetyProvenance(block, 'setSafetyData');
    return updateProduct(code, block);
}

/**
 * The conventional Bengali signal word for a WHO class, as recorded in
 * FIRESTORE-SCHEMA.md §9.2. Offered as a suggestion on the Product page; the
 * stored value is whatever the author typed, because the wording that matters
 * is the one on the container.
 */
export const SIGNAL_WORD_BN = {
    Ia: 'অতি বিষাক্ত',
    Ib: 'অতি বিষাক্ত',
    II: 'বিষাক্ত',
    III: 'সতর্কতা',
    U: 'সতর্কতা',
};

/** True when the product carries enough safety data to print a panel. */
export const hasSafetyData = (p) => Boolean(p && (p.whoClass || p.dosageBn || p.firstAidBn));

/**
 * The subset copied onto each sale line at the moment of sale, so reprinting an
 * old invoice shows what was printed originally. Returns null when there is
 * nothing recorded — the invoice template renders its marker on null.
 */
export function safetySnapshot(product) {
    if (!hasSafetyData(product)) return null;
    return {
        whoClass: product.whoClass ?? null,
        signalWordBn: product.signalWordBn ?? null,
        phiDays: product.phiDays ?? null,
        reentryHours: product.reentryHours ?? null,
        firstAidBn: product.firstAidBn ?? null,
        dosageBn: product.dosageBn ?? null,
        approvedCropsBn: product.approvedCropsBn ?? null,
        safetySource: product.safetySource ?? null,
    };
}
