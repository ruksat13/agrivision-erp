// offers — schema §10
//
// A promotion: buy this, get that, between these dates, on these payment types.
// The buy and gift sides are maps rather than references because either side
// can be an amount or a quantity rather than a product ("get 10% off"), and a
// reference field that is null half the time is worse than a small map.
//
// The product name is denormalised onto both sides. That copy is a historical
// record in the sense of §2: an offer that ran in July should still print the
// product name it was written with, even if the product is renamed in August.

import { COL, OFFER_STATUS, OFFER_TYPE, OFFER_BUY_TYPE, OFFER_MODULE, PAYMENT_TYPE } from './constants';
import {
    createDoc, updateDoc_, getById, getByIdOrThrow, listDocs, nextSequence,
    requireFields, assertEnum, toTimestamp, toDate, ServiceError,
} from './core';

const EMPTY_SIDE = { type: null, productId: null, label: null, qty: null, extra: null };

/** Normalise one side of an offer into the stored map. */
function side(input = {}, { what }) {
    const type = input.type || 'Product';
    assertEnum(type, OFFER_BUY_TYPE, `${what}.type`);
    if (type === 'Product' && !input.productId) {
        throw new ServiceError('VALIDATION', `${what}: choose a product, or change the type to Amount or Quantity.`);
    }
    return {
        ...EMPTY_SIDE,
        type,
        productId: input.productId || null,
        label: input.label || null,
        qty: input.qty === '' || input.qty == null ? null : String(input.qty),
        extra: input.extra || null,
    };
}

// ── Reads ─────────────────────────────────────────────────────────────────

export const getOffer = (code) => getById(COL.OFFERS, code);
export const getOfferOrThrow = (code) => getByIdOrThrow(COL.OFFERS, code);

/**
 * listOffers({ status, offerType, paymentType, buyType, productId, search })
 *
 * `status` defaults to everything except Archived — an archived offer is the
 * soft-deleted one and should not come back on the register. Pass
 * `status: 'Archived'` to see them.
 */
export async function listOffers({ status, offerType, paymentType, buyType, productId, search } = {}) {
    const rows = await listDocs(COL.OFFERS, {
        filters: [['status', '==', status], ['offerType', '==', offerType]],
        order: ['code', 'desc'],
    });

    return rows.filter(o => {
        if (!status && o.status === 'Archived') return false;
        if (paymentType && !(o.paymentTypes || []).includes(paymentType)) return false;
        if (buyType && o.buy?.type !== buyType) return false;
        if (productId && o.buy?.productId !== productId && o.gift?.productId !== productId) return false;
        if (search) {
            const k = search.toLowerCase();
            const hay = `${o.name} ${o.code} ${o.buy?.label || ''} ${o.gift?.label || ''}`.toLowerCase();
            if (!hay.includes(k)) return false;
        }
        return true;
    });
}

/** Is this offer live on the given date? Status alone does not say so. */
export function isRunningOn(offer, onDate) {
    if (!offer || offer.status !== 'Publish') return false;
    const when = toDate(onDate) ?? new Date();
    const from = toDate(offer.startDate);
    const to = toDate(offer.endDate);
    if (from && when < from) return false;
    if (to && when > to) return false;
    return true;
}

/** The next offer code, e.g. AIOF-000293. */
export const nextOfferCode = async () => `AIOF-${await nextSequence('offers', { padTo: 6 })}`;

// ── Writes ────────────────────────────────────────────────────────────────

/**
 * createOffer({ name, buyModule, buy, gift, paymentTypes, offerType,
 *               startDate, endDate, status, noteBn })
 *
 * The code is generated unless you pass one.
 */
export async function createOffer(input) {
    requireFields(input, ['name', 'startDate', 'endDate'], 'createOffer');

    const paymentTypes = (input.paymentTypes || []).filter(Boolean);
    if (!paymentTypes.length) {
        throw new ServiceError('VALIDATION', 'An offer needs at least one payment type.');
    }
    paymentTypes.forEach(p => assertEnum(p, PAYMENT_TYPE, 'paymentTypes'));

    const buyModule = input.buyModule || 'Product';
    assertEnum(buyModule, OFFER_MODULE, 'buyModule');

    const offerType = input.offerType || 'Instant Deal';
    assertEnum(offerType, OFFER_TYPE, 'offerType');

    const status = input.status ?? 'Publish';
    assertEnum(status, OFFER_STATUS, 'status');

    const startDate = toTimestamp(input.startDate);
    const endDate = toTimestamp(input.endDate);
    if (endDate.toMillis() < startDate.toMillis()) {
        throw new ServiceError('VALIDATION', 'The offer ends before it starts.');
    }

    const code = input.code || await nextOfferCode();
    const data = {
        code,
        name: String(input.name).trim(),
        buyModule,
        buy: side(input.buy, { what: 'buy' }),
        gift: side(input.gift, { what: 'gift' }),
        paymentTypes,
        offerType,
        startDate,
        endDate,
        status,
        noteBn: input.noteBn?.trim() || null,
    };
    return createDoc(COL.OFFERS, data, { id: code });
}

export async function updateOffer(code, patch) {
    const clean = { ...patch };
    if (clean.status) assertEnum(clean.status, OFFER_STATUS, 'status');
    if (clean.offerType) assertEnum(clean.offerType, OFFER_TYPE, 'offerType');
    if (clean.buyModule) assertEnum(clean.buyModule, OFFER_MODULE, 'buyModule');
    if (clean.buy) clean.buy = side(clean.buy, { what: 'buy' });
    if (clean.gift) clean.gift = side(clean.gift, { what: 'gift' });
    if ('startDate' in clean) clean.startDate = toTimestamp(clean.startDate);
    if ('endDate' in clean) clean.endDate = toTimestamp(clean.endDate);
    if (clean.paymentTypes) clean.paymentTypes.forEach(p => assertEnum(p, PAYMENT_TYPE, 'paymentTypes'));
    // The code is the document ID; changing it would orphan the document.
    delete clean.code;
    return updateDoc_(COL.OFFERS, code, clean);
}

export const publishOffer = (code) => updateOffer(code, { status: 'Publish' });
export const unpublishOffer = (code) => updateOffer(code, { status: 'Unpublish' });

/**
 * The Delete button. Nothing is hard-deleted (§2) — an invoice that gave this
 * offer's gift must still be able to say which offer it was.
 */
export const archiveOffer = (code, reason) =>
    updateDoc_(COL.OFFERS, code, { status: 'Archived' }, { reason, action: 'delete' });

/** Kept out of the page so the "1 Kg / 10.00 %" badge has one definition. */
export const offerQtyLabel = (s) => (s?.qty ? String(s.qty) : '—');
