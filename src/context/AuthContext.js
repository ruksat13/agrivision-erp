import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
    getUser, startSession, endSession, setActor, hasAccess as profileHasAccess,
    updateUserPermissions as saveUserPermissions,
} from '../services';
import { allPaths } from '../config/menu';

// Sessions are Firebase Authentication. This file used to hold an array of
// demo accounts with their passwords in plain text and compare strings; that
// is gone, along with the second role vocabulary it carried (Admin / Manager /
// Staff). There is one role model now, the one in ROLE in
// src/services/constants.js, and firestore.rules reads it out of users/{uid}.
//
// Two halves, deliberately kept apart:
//
//   Firebase Auth   proves who you are           (credentials, never touched here)
//   users/{uid}     says what you are and may do (role, permissions, scoping)
//
// The document ID of the profile IS the Auth UID — see scripts/seed-auth.mjs
// for why that matters to the Security Rules.
//
// `permissions` keeps the shape it always had ('all', or an array of paths from
// config/menu.js), so Sidebar, ProtectedRoute and the Admin permission editor
// work exactly as before.

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

// SalesEntry.js reads the acting user from this key to attribute an override,
// and core.js falls back to it when setActor() has not been called. Keeping it
// in step with the signed-in user is what stops an audit entry being filed
// against whoever logged in last.
const CURRENT_KEY = 'av_current';

/** The profile as the screens consume it. `id` and `uid` are the same value. */
function shapeUser(uid, profile, fbUser) {
    return {
        id: uid,
        uid,
        name: profile.name,
        email: profile.email || fbUser?.email || '',
        role: profile.role,
        permissions: profile.permissions ?? [],
        status: profile.status,
        officeId: profile.officeId ?? null,
        areaId: profile.areaId ?? null,
        territoryId: profile.territoryId ?? null,
    };
}

function remember(user) {
    // The whole shaped profile, not just id/name/role: the service layer builds
    // a scoped query from `role` AND `areaId` (actorScope() in services/core.js),
    // so an Area Manager remembered without their area lists nothing at all.
    setActor(user);
    try {
        localStorage.setItem(CURRENT_KEY, JSON.stringify(user));
    } catch (e) { /* private browsing — setActor already has it */ }
}

function forget() {
    setActor(null);
    try {
        localStorage.removeItem(CURRENT_KEY);
    } catch (e) { /* nothing to clear */ }
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    /**
     * Sign in, then load the profile that says what this account may do.
     *
     * An account that authenticates but has no users/ document is refused and
     * signed straight back out. Leaving it signed in would produce a session
     * with no role, which every Security Rule denies — a confusing empty app
     * instead of a clear failure at the login screen.
     */
    const login = useCallback(async (email, password) => {
        const cred = await signInWithEmailAndPassword(auth, String(email).trim(), password);
        try {
            // startSession() loads the profile, refuses an Inactive account,
            // tells the service layer who is acting and records the login.
            const profile = await startSession(cred.user.uid);
            const user = shapeUser(cred.user.uid, profile, cred.user);
            remember(user);
            setCurrentUser(user);
            return user;
        } catch (err) {
            await signOut(auth).catch(() => { });
            forget();
            setCurrentUser(null);
            throw err;
        }
    }, []);

    const logout = useCallback(async () => {
        const uid = auth.currentUser?.uid;
        try {
            await endSession(uid);
        } catch (e) { /* the logout entry is best-effort; never block signing out */ }
        forget();
        setCurrentUser(null);
        await signOut(auth).catch(() => { });
    }, []);

    /** Unchanged contract: 'all', or the path must be in the permissions array. */
    const hasAccess = useCallback((path) => profileHasAccess(currentUser, path), [currentUser]);

    /**
     * Admin.js edits page access through here. Writes to users/{uid} — and
     * therefore into audit_log — and refreshes the session when a user edits
     * their own access, so the sidebar reflects it without a reload.
     */
    const updateUserPermissions = useCallback(async (uid, permissions) => {
        await saveUserPermissions(uid, permissions, 'Page access changed from the Admin screen');
        setCurrentUser(prev => {
            if (!prev || prev.id !== uid) return prev;
            const next = { ...prev, permissions };
            remember(next);
            return next;
        });
    }, []);

    /**
     * Re-read the signed-in user's own profile and put it back into the
     * session. /profile calls this after a self-edit, so the sidebar greeting
     * and the navbar chip follow the name that was just saved rather than
     * showing the old one until the next reload.
     *
     * A GET on users/{own uid}, which every signed-in role may make — the same
     * read getMyProfile() makes, and the reason the rule's third arm exists.
     */
    const refreshProfile = useCallback(async () => {
        const fbUser = auth.currentUser;
        if (!fbUser) return;
        const profile = await getUser(fbUser.uid);
        if (!profile) return;
        const user = shapeUser(fbUser.uid, profile, fbUser);
        remember(user);
        setCurrentUser(user);
    }, []);

    // Restores the session on reload, and clears it on sign-out. This does NOT
    // write a login audit entry — refreshing the page is not a login, and an
    // audit log that cannot tell the two apart is noise.
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            if (!fbUser) {
                forget();
                setCurrentUser(null);
                setLoading(false);
                return;
            }
            try {
                const profile = await getUser(fbUser.uid);
                if (!profile || profile.status !== 'Active') {
                    await signOut(auth).catch(() => { });
                    forget();
                    setCurrentUser(null);
                } else {
                    const user = shapeUser(fbUser.uid, profile, fbUser);
                    remember(user);
                    setCurrentUser(user);
                }
            } catch (err) {
                // The profile read failed (offline, or rules refused it). Do not
                // guess at a role — an unattributable session is worse than none.
                // eslint-disable-next-line no-console
                console.error('[auth] could not load the profile for', fbUser.uid, err);
                await signOut(auth).catch(() => { });
                forget();
                setCurrentUser(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const value = { currentUser, login, logout, hasAccess, updateUserPermissions, refreshProfile, allPaths };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
