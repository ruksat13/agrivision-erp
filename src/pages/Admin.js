import React, { useState, useCallback } from 'react';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut, connectAuthEmulator } from 'firebase/auth';
import { menuItems, allPaths } from '../config/menu';
import { useAuth } from '../context/AuthContext';
import app, { usingEmulator } from '../firebase';
import { listUsers, createUserProfile, deactivateUser, ROLE } from '../services';
import { Notice, useFlash, useCollection } from '../components/Notice';

// User and access management, backed by Firestore.
//
// The user list used to live in localStorage with the passwords beside it.
// Credentials are Firebase Auth's now and never pass through this screen; what
// is edited here is the users/{uid} profile — role, status and the page
// permissions that Sidebar and ProtectedRoute read.

const card = { backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' };
const thS = { padding: '10px 12px', color: 'white', fontWeight: '600', fontSize: '13px', textAlign: 'left' };
const tdS = { padding: '9px 12px', fontSize: '13px', color: '#333', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' };

// Keyed by ROLE in src/services/constants.js — the vocabulary firestore.rules
// reads. The old Admin/Manager/Staff keys were a second, parallel role model
// that no rule and no audit entry ever recognised.
const roleColors = {
    'Super Admin': { bg: '#cff4fc', color: '#055160' },
    'Managing Director': { bg: '#e0cffc', color: '#3d0a91' },
    'Area Manager': { bg: '#fff3cd', color: '#856404' },
    'Sales Officer': { bg: '#d4edda', color: '#155724' },
    'Accountant': { bg: '#f8d7da', color: '#721c24' },
    'Storekeeper': { bg: '#cfe2ff', color: '#084298' },
    'Delivery Man': { bg: '#e2e3e5', color: '#383d41' },
    'Dealer': { bg: '#fde2e4', color: '#6a040f' },
};

/**
 * Create the Auth account for a new user on a SECOND Firebase app instance.
 *
 * createUserWithEmailAndPassword signs the new account in on whichever app it
 * is called against. Called on the main app it would silently replace the
 * administrator's own session with the account they just created. A throwaway
 * secondary app keeps that side effect off the real session.
 *
 * The UID is allocated by Auth here — unlike the seed, which sets it — so a
 * user added from this screen gets a generated ID. That is fine: rules look the
 * profile up at users/{request.auth.uid} either way.
 */
async function provisionAuthAccount({ email, password }) {
    const secondary = initializeApp(app.options, `provision-${Date.now()}`);
    const secondaryAuth = getAuth(secondary);
    if (usingEmulator) {
        connectAuthEmulator(secondaryAuth, 'http://127.0.0.1:9099', { disableWarnings: true });
    }
    try {
        const cred = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password);
        await signOut(secondaryAuth).catch(() => { });
        return cred.user.uid;
    } finally {
        await deleteApp(secondary).catch(() => { });
    }
}

// ---- Permission editor (opens when lock icon clicked) ----
function PermissionEditor({ user, onClose, onSave }) {
    const isAll = user.permissions === 'all';
    const [selected, setSelected] = useState(() => new Set(isAll ? allPaths : (user.permissions || [])));
    const [expanded, setExpanded] = useState({});

    const toggle = (path) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(path)) next.delete(path); else next.add(path);
            return next;
        });
    };

    const toggleGroup = (item, checked) => {
        setSelected(prev => {
            const next = new Set(prev);
            item.children.forEach(c => { if (checked) next.add(c.path); else next.delete(c.path); });
            return next;
        });
    };

    const groupState = (item) => {
        const kids = item.children.map(c => c.path);
        const on = kids.filter(p => selected.has(p)).length;
        if (on === 0) return 'none';
        if (on === kids.length) return 'all';
        return 'some';
    };

    const save = () => {
        onSave(Array.from(selected));
        onClose();
    };

    const checkbox = (checked, onChange, indeterminate) => (
        <span onClick={onChange} style={{
            width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
            border: `2px solid ${checked || indeterminate ? '#0d6efd' : '#adb5bd'}`,
            background: checked ? '#0d6efd' : indeterminate ? '#9ec5fe' : 'white',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '12px', cursor: 'pointer',
        }}>{checked ? '✓' : indeterminate ? '–' : ''}</span>
    );

    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '30px', overflowY: 'auto' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '10px', width: '760px', maxWidth: '96vw' }}>
                {/* header */}
                <div style={{ background: 'linear-gradient(135deg,#17c1cf,#0dcaf0)', color: 'white', padding: '16px 22px', borderRadius: '10px 10px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '17px', fontWeight: '800' }}>{user.name}</div>
                        <div style={{ fontSize: '12px', opacity: 0.9 }}>{user.email} — Set page access</div>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.15)', border: 'none', color: 'white', fontSize: '16px', cursor: 'pointer', padding: '4px 12px', borderRadius: '6px' }}>✕</button>
                </div>

                {isAll && (
                    <div style={{ background: '#fff3cd', color: '#856404', padding: '10px 22px', fontSize: '12px' }}>
                        ⚠️ This user is a <b>Super Admin</b> — has access to everything. Changes here will convert them to custom access.
                    </div>
                )}

                {/* body */}
                <div style={{ padding: '18px 22px', maxHeight: '60vh', overflowY: 'auto' }}>
                    {menuItems.map(item => {
                        if (!item.children) {
                            const checked = selected.has(item.path);
                            return (
                                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderBottom: '1px solid #f4f4f4' }}>
                                    {checkbox(checked, () => toggle(item.path))}
                                    <span style={{ fontWeight: '600', fontSize: '13px', color: '#1a2035' }}>{item.icon} {item.name}</span>
                                </div>
                            );
                        }
                        const gs = groupState(item);
                        const isOpen = expanded[item.name];
                        return (
                            <div key={item.name} style={{ borderBottom: '1px solid #f4f4f4' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0' }}>
                                    {checkbox(gs === 'all', () => toggleGroup(item, gs !== 'all'), gs === 'some')}
                                    <span style={{ fontWeight: '700', fontSize: '13px', color: '#1a2035', flex: 1 }}>{item.icon} {item.name}</span>
                                    <span onClick={() => setExpanded(p => ({ ...p, [item.name]: !p[item.name] }))}
                                        style={{ cursor: 'pointer', color: '#6c757d', fontSize: '12px', userSelect: 'none' }}>
                                        {isOpen ? '▲ hide' : `▼ ${item.children.length} pages`}
                                    </span>
                                </div>
                                {isOpen && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px 16px', padding: '4px 0 12px 28px' }}>
                                        {item.children.map(c => {
                                            const checked = selected.has(c.path);
                                            return (
                                                <div key={c.path} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {checkbox(checked, () => toggle(c.path))}
                                                    <span style={{ fontSize: '12px', color: '#495057' }}>{c.name}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* footer */}
                <div style={{ padding: '14px 22px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#6c757d' }}>{selected.size} / {allPaths.length} pages granted</span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={onClose} style={{ padding: '8px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                        <button onClick={save} style={{ padding: '8px 24px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Save Access</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AddUserForm({ onClose, onAdd, busy }) {
    const [form, setForm] = useState({ name: '', email: '', password: '123456', role: 'Sales Officer', status: 'Active' });
    const inp = { width: '100%', padding: '9px 12px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' };
    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '10px', width: '480px', maxWidth: '95vw', padding: '24px' }}>
                <h4 style={{ margin: '0 0 18px', color: '#1a2035' }}>Add New User</h4>
                {[['Full Name', 'name'], ['Email', 'email'], ['Password', 'password']].map(([label, key]) => (
                    <div key={key} style={{ marginBottom: '14px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '5px' }}>{label}</label>
                        <input value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} style={inp} />
                    </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '5px' }}>Role</label>
                        <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} style={inp}>
                            {ROLE.map(r => <option key={r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '5px' }}>Status</label>
                        <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} style={inp}>
                            <option>Active</option><option>Inactive</option>
                        </select>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ padding: '8px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                    <button disabled={busy} onClick={() => { if (form.name && form.email) onAdd(form); }} style={{ padding: '8px 24px', background: busy ? '#adb5bd' : '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: busy ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600' }}>{busy ? 'Creating…' : 'Save'}</button>
                </div>
            </div>
        </div>
    );
}

function Admin() {
    const { updateUserPermissions, currentUser } = useAuth();
    const [search, setSearch] = useState('');
    const [permUser, setPermUser] = useState(null);
    const [showAdd, setShowAdd] = useState(false);

    // status: null so deactivated accounts stay listed — an account referenced
    // by an old audit entry must still be findable here.
    const load = useCallback(() => listUsers({ status: null }), []);
    const { rows: users, loading, error, reload } = useCollection(load, { what: 'users' });
    const { flash, say, busy, run } = useFlash();

    const handleSavePerms = (uid, paths) => run(async () => {
        await updateUserPermissions(uid, paths);
        say('ok', `Page access updated (${paths.length} pages).`);
        await reload();
    });

    const handleAdd = (form) => run(async () => {
        // Auth account first: without a UID there is nothing to hang the
        // profile on, and a profile with no login is a row nobody can use.
        const uid = await provisionAuthAccount(form);
        await createUserProfile({
            uid,
            name: form.name.trim(),
            email: form.email.trim(),
            role: form.role,
            status: form.status,
            permissions: ['/'],
        });
        say('ok', `${form.name} can now sign in. Set their page access with the 🔒 button.`);
        setShowAdd(false);
        await reload();
    });

    const handleDeactivate = (u) => {
        if (u.id === currentUser?.id) { alert('You cannot deactivate your own account.'); return; }
        if (!window.confirm(`Deactivate ${u.name}? They keep their history and stop being able to sign in.`)) return;
        run(async () => {
            await deactivateUser(u.id, 'Deactivated from the Admin screen');
            say('ok', `${u.name} deactivated.`);
            await reload();
        });
    };

    const permLabel = (u) => u.permissions === 'all' ? 'All pages' : `${(u.permissions || []).length} pages`;

    const filtered = users.filter(u =>
        (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.role || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={card}>
            {permUser && <PermissionEditor user={permUser} onClose={() => setPermUser(null)} onSave={(paths) => handleSavePerms(permUser.id, paths)} />}
            {showAdd && <AddUserForm busy={busy} onClose={() => setShowAdd(false)} onAdd={handleAdd} />}

            <div style={{ padding: '0 20px', paddingTop: (loading || error || flash) ? 14 : 0 }}>
                {loading && <Notice tone="info">Loading users…</Notice>}
                {error && <Notice tone="warn">{error}</Notice>}
                {flash && <Notice tone={flash.tone}>{flash.text}</Notice>}
            </div>

            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <span style={{ fontWeight: '700', fontSize: '14px', color: '#333' }}>🔑 Admin — User & Access Management</span>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input placeholder="🔍 Search user..." value={search} onChange={e => setSearch(e.target.value)}
                        style={{ padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', width: '200px' }} />
                    <button onClick={() => setShowAdd(true)} style={{ padding: '7px 16px', background: '#0d6efd', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>+ New User</button>
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#1a2035' }}>
                            <th style={{ ...thS, width: '40px', textAlign: 'center' }}>#</th>
                            <th style={thS}>Name</th>
                            <th style={thS}>Email (login)</th>
                            <th style={thS}>Role</th>
                            <th style={thS}>Access</th>
                            <th style={thS}>Status</th>
                            <th style={{ ...thS, textAlign: 'right' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((u, i) => (
                            <tr key={u.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                <td style={{ ...tdS, textAlign: 'center' }}>{i + 1}</td>
                                <td style={{ ...tdS, fontWeight: '600', color: '#1a2035' }}>{u.name}</td>
                                <td style={{ ...tdS, color: '#0d6efd' }}>{u.email}</td>
                                <td style={tdS}>
                                    <span style={{ background: roleColors[u.role]?.bg, color: roleColors[u.role]?.color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{u.role}</span>
                                </td>
                                <td style={{ ...tdS, fontSize: '12px', color: '#495057' }}>{permLabel(u)}</td>
                                <td style={tdS}>
                                    <span style={{ background: u.status === 'Active' ? '#d4edda' : '#f8d7da', color: u.status === 'Active' ? '#155724' : '#721c24', padding: '3px 10px', borderRadius: '20px', fontSize: '12px' }}>{u.status}</span>
                                </td>
                                <td style={{ ...tdS, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                    <button title="Set Access" disabled={busy} onClick={() => setPermUser(u)} style={{ padding: '5px 10px', background: '#0dcaf0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', marginRight: '4px' }}>🔒</button>
                                    {u.status === 'Active' && (
                                        <button title="Deactivate" disabled={busy} onClick={() => handleDeactivate(u)} style={{ padding: '5px 10px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>✕</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr><td colSpan={7} style={{ ...tdS, textAlign: 'center', padding: '30px', color: '#adb5bd' }}>No user found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{ padding: '14px 20px', fontSize: '12px', color: '#6c757d', borderTop: '1px solid #f0f0f0', lineHeight: 1.6 }}>
                💡 Click 🔒 on any user to grant or revoke page access. Roles come from the
                access matrix in PROJECT-OUTLINE.md §4 and are what Security Rules read —
                changing a role changes what that account can do on the server, not just
                what it can see. Passwords are held by Firebase Authentication and cannot
                be read or set from this screen; the seeded accounts use <b>123456</b>.
                Nothing is deleted here — ✕ deactivates, so the audit trail stays resolvable.
            </div>
        </div>
    );
}

export default Admin;
