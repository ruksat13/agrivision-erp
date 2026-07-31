import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { allPaths } from '../config/menu';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

const USERS_KEY = 'av_users';
const CURRENT_KEY = 'av_current';

// Default demo accounts (all password: 123456)
const defaultUsers = [
    {
        id: 1, name: 'Md. Ruksat Hasan Akib', email: 'akib@agrivision.com', password: '123456',
        role: 'Super Admin', status: 'Active', permissions: 'all',
    },
    {
        id: 2, name: 'Nazmul Islam', email: 'nazmul@agrivision.com', password: '123456',
        role: 'Admin', status: 'Active',
        permissions: ['/', '/sales', '/sales-return', '/cancel-sales', '/damage', '/customer', '/supplier'],
    },
    {
        id: 3, name: 'Sadia Akter', email: 'sadia@agrivision.com', password: '123456',
        role: 'Manager', status: 'Active',
        permissions: ['/', '/supplier-purchase', '/cash-collection', '/supplier-payment', '/customer-ledger', '/bank-account'],
    },
    {
        id: 4, name: 'Rahim Uddin', email: 'rahim@agrivision.com', password: '123456',
        role: 'Staff', status: 'Active',
        permissions: ['/', '/sales-report', '/collection-report', '/due-report'],
    },
    {
        id: 5, name: 'Karim Hossain', email: 'karim@agrivision.com', password: '123456',
        role: 'Staff', status: 'Active',
        permissions: ['/', '/purchase', '/batch', '/product-demand', '/product'],
    },
    {
        id: 6, name: 'Sadab Rahman', email: 'sadab@agrivision.com', password: '123456',
        role: 'Staff', status: 'Active',
        permissions: ['/', '/sales'],
    },
];

export function loadUsers() {
    try {
        const raw = localStorage.getItem(USERS_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
}

export function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    function login(email, password) {
        const users = loadUsers();
        const match = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password);
        if (match) {
            if (match.status === 'Inactive') {
                return Promise.reject(new Error('Account inactive'));
            }
            const user = { ...match };
            delete user.password;
            localStorage.setItem(CURRENT_KEY, JSON.stringify(user));
            setCurrentUser(user);
            return Promise.resolve(user);
        }
        // fallback to Firebase for legacy accounts
        return signInWithEmailAndPassword(auth, email, password).then((cred) => {
            const user = { name: cred.user.email.split('@')[0], email: cred.user.email, role: 'Super Admin', permissions: 'all' };
            localStorage.setItem(CURRENT_KEY, JSON.stringify(user));
            setCurrentUser(user);
            return user;
        });
    }

    function logout() {
        localStorage.removeItem(CURRENT_KEY);
        setCurrentUser(null);
        return signOut(auth).catch(() => { });
    }

    // whether the logged-in user can access a given route path
    function hasAccess(path) {
        if (!currentUser) return false;
        if (currentUser.permissions === 'all') return true;
        return (currentUser.permissions || []).includes(path);
    }

    // update a user's permissions (Admin action) and reflect if it's the current user
    function updateUserPermissions(userId, permissions) {
        const users = loadUsers();
        const updated = users.map(u => u.id === userId ? { ...u, permissions } : u);
        saveUsers(updated);
        if (currentUser && currentUser.id === userId) {
            const cu = { ...currentUser, permissions };
            localStorage.setItem(CURRENT_KEY, JSON.stringify(cu));
            setCurrentUser(cu);
        }
    }

    useEffect(() => {
        // restore local session first — but always re-sync permissions/role/status
        // from the av_users store (source of truth) so admin changes show after refresh
        try {
            const raw = localStorage.getItem(CURRENT_KEY);
            if (raw) {
                const saved = JSON.parse(raw);
                const users = loadUsers();
                const fresh = users.find(u => u.id === saved.id || (u.email && u.email === saved.email));
                let user = saved;
                if (fresh) {
                    user = { ...saved, name: fresh.name, role: fresh.role, status: fresh.status, permissions: fresh.permissions };
                    localStorage.setItem(CURRENT_KEY, JSON.stringify(user));
                }
                setCurrentUser(user);
                setLoading(false);
                return;
            }
        } catch (e) { /* ignore */ }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                const u = { name: user.email.split('@')[0], email: user.email, role: 'Super Admin', permissions: 'all' };
                setCurrentUser(u);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const value = { currentUser, login, logout, hasAccess, updateUserPermissions, allPaths };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
