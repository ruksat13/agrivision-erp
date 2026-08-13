// Shared plumbing for every service module: who is acting, how values are
// converted, how documents are validated, and how a mutation is paired with its
// audit_log entry.
//
// Screens should not need anything from this file except ServiceError and
// setActor(). Everything else is used by the collection modules.

import {
    doc, getDoc, getDocs, collection, query, where, orderBy, limit as fbLimit,
    writeBatch, runTransaction, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { COL, AUDIT_ACTION } from './constants';

// ── Errors ────────────────────────────────────────────────────────────────

/**
 * Every failure this layer raises is a ServiceError, so a screen can show
 * err.message directly and branch on err.code.
 *
 * Codes: NO_ACTOR · VALIDATION · NOT_FOUND · BAD_ENUM · CONFLICT
 */
export class ServiceError extends Error {
    constructor(code, message, details) {
        super(message);
        this.name = 'ServiceError';
        this.code = code;
        this.details = details;
    }
}

// ── Who is acting ─────────────────────────────────────────────────────────

let _actor = null;

/**
 * Record who is performing writes. Call once after login.
 *
 *   setActor({ id, name, role })
 *
 * Until AuthContext is moved to Firebase Auth this falls back to the existing
 * localStorage session ('av_current'), so the layer works today without any
 * change to AuthContext.js.
 */
export function setActor(user) {
    _actor = user ? { id: user.id ?? user.uid, name: user.name, role: user.role } : null;
}

export function getActor() {
    if (_actor) return _actor;
    try {
        const raw = localStorage.getItem('av_current');
        if (raw) {
            const u = JSON.parse(raw);
            return { id: String(u.id ?? u.uid ?? u.email), name: u.name, role: u.role };
        }
    } catch (e) { /* fall through */ }
    return null;
}

/** Mutations require an actor — an unattributed audit entry is not an audit entry. */
export function requireActor() {
    const a = getActor();
    if (!a) {
        throw new ServiceError(
            'NO_ACTOR',
            'No signed-in user. Call setActor(user) after login before writing.',
        );
    }
    return a;
}

// ── Value conversion ──────────────────────────────────────────────────────

/**
 * Accepts a Date, a Timestamp, 'YYYY-MM-DD' or 'DD-MM-YYYY' and returns a
 * Firestore Timestamp. Both string forms appear in the existing pages, so both
 * are handled rather than making every caller remember which.
 */
export function toTimestamp(value) {
    if (value === null || value === undefined || value === '') return null;
    if (value instanceof Timestamp) return value;
    if (value instanceof Date) return Timestamp.fromDate(value);

    if (typeof value === 'string') {
        const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
        if (iso) return Timestamp.fromDate(new Date(+iso[1], +iso[2] - 1, +iso[3]));

        const dmy = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
        if (dmy) return Timestamp.fromDate(new Date(+dmy[3], +dmy[2] - 1, +dmy[1]));

        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) return Timestamp.fromDate(parsed);
    }
    throw new ServiceError('VALIDATION', `Cannot read "${value}" as a date.`);
}

/** Timestamp → JS Date, tolerant of nulls and of values that are already Dates. */
export function toDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value.toDate === 'function') return value.toDate();
    return new Date(value);
}

/** Money and quantities are numbers, never strings. Rejects NaN early. */
export function toNumber(value, field = 'value') {
    if (value === null || value === undefined || value === '') return 0;
    const n = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
    if (Number.isNaN(n)) throw new ServiceError('VALIDATION', `${field} must be a number, got "${value}".`);
    return n;
}

/** Round to 2dp. Money arithmetic in JS drifts otherwise. */
export const money = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// ── Validation ────────────────────────────────────────────────────────────

/** Firestore rejects undefined. Nulls are kept — the schema requires them (§2). */
export function stripUndefined(obj) {
    const out = {};
    Object.entries(obj).forEach(([k, v]) => { if (v !== undefined) out[k] = v; });
    return out;
}

export function requireFields(data, fields, what) {
    const missing = fields.filter(f => data[f] === undefined || data[f] === null || data[f] === '');
    if (missing.length) {
        throw new ServiceError('VALIDATION', `${what}: missing required field(s): ${missing.join(', ')}`, { missing });
    }
}

export function assertEnum(value, allowed, field) {
    if (!allowed.includes(value)) {
        throw new ServiceError('BAD_ENUM', `${field} must be one of: ${allowed.join(', ')} — got "${value}".`, { field, value });
    }
}

// ── Reading ───────────────────────────────────────────────────────────────

export const snapToDoc = (snap) => (snap.exists() ? { id: snap.id, ...snap.data() } : null);
export const snapsToDocs = (qs) => qs.docs.map(d => ({ id: d.id, ...d.data() }));

export async function getById(collectionName, id) {
    if (!id) return null;
    return snapToDoc(await getDoc(doc(db, collectionName, id)));
}

export async function getByIdOrThrow(collectionName, id) {
    const found = await getById(collectionName, id);
    if (!found) throw new ServiceError('NOT_FOUND', `${collectionName}/${id} does not exist.`);
    return found;
}

/**
 * Generic list. Pass filters as an array of [field, op, value]; a filter whose
 * value is undefined or '' is skipped, so screens can hand their filter state
 * straight in without building the array conditionally.
 *
 *   listDocs('sales', {
 *     filters: [['officerId', '==', officerId], ['status', '==', status]],
 *     order: ['saleDate', 'desc'],
 *     limit: 50,
 *   })
 */
export async function listDocs(collectionName, { filters = [], order, limit } = {}) {
    const clauses = filters
        .filter(f => Array.isArray(f) && f[2] !== undefined && f[2] !== null && f[2] !== '')
        .map(([field, op, value]) => where(field, op, value));

    if (order) clauses.push(orderBy(order[0], order[1] || 'asc'));
    if (limit) clauses.push(fbLimit(limit));

    return snapsToDocs(await getDocs(query(collection(db, collectionName), ...clauses)));
}

// ── Writing, always with an audit entry ───────────────────────────────────

/**
 * Queue an audit_log entry onto an existing batch. Used by the helpers below
 * and by any module that builds a multi-document batch of its own (sales.js).
 */
export function queueAudit(batch, { action, collection: col, docId, before = null, after = null, reason = null }) {
    assertEnum(action, AUDIT_ACTION, 'audit action');
    const actor = requireActor();
    if (action === 'rule_override' && !reason) {
        // Stated in the schema and enforced in Security Rules; caught here too so
        // the failure is a clear message rather than a permission error.
        throw new ServiceError('VALIDATION', 'A rule override must carry a reason.');
    }
    batch.set(doc(collection(db, COL.AUDIT_LOG)), stripUndefined({
        at: serverTimestamp(),
        userId: actor.id,
        userName: actor.name ?? null,
        userRole: actor.role ?? null,
        action,
        collection: col,
        docId,
        before,
        after,
        reason,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    }));
}

/**
 * Create a document and its audit entry in one batch.
 * Pass `id` to choose the document ID (product code, dealer code, invoice no),
 * or omit it for an auto-ID.
 */
export async function createDoc(collectionName, data, { id } = {}) {
    requireActor();
    const ref = id ? doc(db, collectionName, id) : doc(collection(db, collectionName));

    if (id) {
        const existing = await getDoc(ref);
        if (existing.exists()) {
            throw new ServiceError('CONFLICT', `${collectionName}/${id} already exists.`);
        }
    }

    const payload = stripUndefined({ ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    const batch = writeBatch(db);
    batch.set(ref, payload);
    queueAudit(batch, { action: 'create', collection: collectionName, docId: ref.id, after: data });
    await batch.commit();

    return { id: ref.id, ...data };
}

/**
 * Update a document and its audit entry in one batch. Reads the document first
 * so the audit entry carries the old value, which PROJECT-OUTLINE.md §8 requires.
 */
export async function updateDoc_(collectionName, id, patch, { reason = null, action = 'update' } = {}) {
    requireActor();
    const before = await getByIdOrThrow(collectionName, id);

    const payload = stripUndefined({ ...patch, updatedAt: serverTimestamp() });
    const batch = writeBatch(db);
    batch.update(doc(db, collectionName, id), payload);
    queueAudit(batch, { action, collection: collectionName, docId: id, before, after: patch, reason });
    await batch.commit();

    return { ...before, ...patch };
}

/**
 * Soft delete: sets status to 'Inactive' and records a 'delete' audit entry.
 * Nothing in this system is hard-deleted (schema §2) — a report run next month
 * must still be able to resolve a reference made today.
 */
export async function softDelete(collectionName, id, { reason = null } = {}) {
    return updateDoc_(collectionName, id, { status: 'Inactive' }, { reason, action: 'delete' });
}

// ── Counters ──────────────────────────────────────────────────────────────

/**
 * Atomic sequence, used for invoice numbers. A transaction rather than a batch
 * because the next value depends on the current one — two officers saving at
 * the same moment must not receive the same invoice number.
 */
export async function nextSequence(counterName, { padTo = 7 } = {}) {
    const ref = doc(db, COL.COUNTERS, counterName);
    const next = await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        const value = (snap.exists() ? snap.data().value : 0) + 1;
        tx.set(ref, { value, updatedAt: serverTimestamp() }, { merge: true });
        return value;
    });
    return String(next).padStart(padTo, '0');
}

export { serverTimestamp, Timestamp };
