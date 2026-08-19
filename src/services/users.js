// users — schema §4.7
//
// There is no password field here. Firebase Authentication holds credentials;
// this collection holds the profile, role, permissions and the scoping fields
// that Security Rules read.
//
// `permissions` keeps the shape AuthContext and ProtectedRoute already use
// ('all', or an array of menu paths), so the permission editor in Admin.js
// continues to work unchanged.

import { COL, ROLE, STATUS } from './constants';
import {
    createDoc, updateDoc_, softDelete, getById, getByIdOrThrow, listDocs,
    requireFields, assertEnum, setActor, ServiceError,
} from './core';
import { logAuth } from './audit';

const NULLABLE_DEFAULTS = {
    officeId: null,
    areaId: null,
    territoryId: null,
    employeeId: null,
    customerId: null,     // set for the Dealer role (the Phase 2 portal)
};

// ── Reads ─────────────────────────────────────────────────────────────────

export const getUser = (uid) => getById(COL.USERS, uid);
export const getUserOrThrow = (uid) => getByIdOrThrow(COL.USERS, uid);

/**
 * The staff directory.
 *
 * **This one cannot be made safe with a where() clause, and that is the point.**
 * Every other row-scoped collection here is scoped on a FIELD — customers and
 * sales on `areaId`/`officerId` — so actorScope() can put the rule's own clause
 * on the query and Firestore allows the LIST. The `users` rule is
 *
 *     allow read: if isAdmin() || hasRole(['Accountant'])
 *                 || (signedIn() && request.auth.uid == uid)
 *
 * and that last clause is on the DOCUMENT ID, not on a field. A query cannot
 * prove up front that it only returns your own document, so an Area Manager, a
 * Sales Officer or a Storekeeper calling this is refused outright and no filter
 * this function could add would change that.
 *
 * So the constraint is on the CALLER: only a Super Admin, a Managing Director
 * or an Accountant may call it. Today that holds — Admin.js is on the two 'all'
 * menus and Expense.js is the Accountant's, which is the need the users read
 * grant was widened for in the first place (see the `users` block in
 * firestore.rules). scripts/verify-rules.mjs asserts both halves: that those
 * three succeed and that the other three are refused.
 *
 * To read one profile, use getUser(uid) — a GET, which the rule does satisfy.
 */
export const listUsers = ({ role, status, areaId } = {}) =>
    listDocs(COL.USERS, {
        filters: [['role', '==', role], ['status', '==', status], ['areaId', '==', areaId]],
        order: ['name', 'asc'],
    });

/**
 * Sales Officers, for the officer selector on the order screen.
 * Same caller restriction as listUsers() — and note that the screen this was
 * written for, SalesEntry.js, is reached by a Sales Officer, who may NOT call
 * it. It has no caller today; give it one only from an admin or Accountant
 * screen, or the selector will be an empty dropdown behind a console error.
 */
export const listOfficers = () => listUsers({ role: 'Sales Officer', status: 'Active' });

// ── Writes ────────────────────────────────────────────────────────────────

/**
 * Create the profile for an account that already exists in Firebase Auth.
 *   createUserProfile({ uid, name, email, role, permissions, areaId })
 *
 * Create the Auth account first (createUserWithEmailAndPassword), then call
 * this with the uid it returns. Passwords never pass through this layer.
 */
export async function createUserProfile(input) {
    requireFields(input, ['uid', 'name', 'email', 'role'], 'createUserProfile');
    assertEnum(input.role, ROLE, 'role');

    const data = {
        ...NULLABLE_DEFAULTS,
        ...input,
        permissions: input.permissions ?? [],
        status: input.status ?? 'Active',
    };
    delete data.uid;
    delete data.password;                 // defensive: never persist one
    assertEnum(data.status, STATUS, 'status');

    return createDoc(COL.USERS, data, { id: input.uid });
}

export async function updateUser(uid, patch) {
    if (patch.role) assertEnum(patch.role, ROLE, 'role');
    if (patch.status) assertEnum(patch.status, STATUS, 'status');
    const clean = { ...patch };
    delete clean.password;
    return updateDoc_(COL.USERS, uid, clean);
}

/**
 * Replace a user's page access. `permissions` is 'all' or an array of paths
 * from config/menu.js — the shape Admin.js already produces.
 */
export const updateUserPermissions = (uid, permissions, reason = null) =>
    updateDoc_(COL.USERS, uid, { permissions }, { reason });

export const deactivateUser = (uid, reason) => softDelete(COL.USERS, uid, { reason });

// ── Session ───────────────────────────────────────────────────────────────

/**
 * Call after Firebase Auth signs someone in: loads their profile, tells the
 * service layer who is acting, and records the login.
 *
 *   const cred = await signInWithEmailAndPassword(auth, email, password);
 *   const user = await startSession(cred.user.uid);
 */
export async function startSession(uid) {
    const user = await getUserOrThrow(uid);
    if (user.status !== 'Active') {
        throw new ServiceError('VALIDATION', 'This account is inactive.');
    }
    setActor({ id: uid, name: user.name, role: user.role });
    await logAuth('login', uid);
    return { id: uid, ...user };
}

export async function endSession(uid) {
    if (uid) await logAuth('logout', uid);
    setActor(null);
}

/** Does this user have access to a route path? Mirrors AuthContext.hasAccess. */
export const hasAccess = (user, path) =>
    !!user && (user.permissions === 'all' || (user.permissions || []).includes(path));
