import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyProfile, updateMyProfile, officeLabel, formatDate } from '../services';
import { Notice, useFlash, useCollection } from '../components/Notice';

// My Profile, backed by Firestore through the service layer.
//
// This screen used to call doc/getDoc/setDoc on `users` itself — the last
// bypass of src/services (CLAUDE.md, "Where this codebase is inconsistent").
// Two things were wrong with it beyond the layering. It wrote with no audit
// entry, on the one collection that decides what everybody else may do. And it
// wrote `role` from a <select> holding Admin / Manager / Employee, three values
// that are not in ROLE at all — a successful save would have set a role no rule
// recognises, and every rule that asks for one denies.
//
// What replaced it, per the decision in docs/DECISIONS.md (Platform):
//
//   name, phone   editable by the person the document is about
//   everything else   Super Admin only, shown here read-only
//
// The editable half is enforced in firestore.rules on the `users` update path
// (`editingOwnProfile()`); this screen is the convenience half. The read-only
// fields are SHOWN rather than hidden because a profile that silently omits
// your role and your area is less use than one that prints them and says who
// may change them.

const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid #dee2e6', fontSize: '14px',
    boxSizing: 'border-box', outline: 'none',
};
const readOnlyStyle = {
    ...inputStyle, background: '#f1f3f5', color: '#6c757d', cursor: 'not-allowed',
};
const labelStyle = {
    fontSize: '13px', fontWeight: '600', color: '#555',
    marginBottom: '5px', display: 'block',
};

/** A field this user may not change. Printed, never posted. */
function Locked({ label, value }) {
    return (
        <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>
                {label}
                <span style={{ marginLeft: 8, fontWeight: '500', color: '#adb5bd', fontSize: '12px' }}>
                    🔒 Super Admin only
                </span>
            </label>
            <input style={readOnlyStyle} value={value ?? '—'} readOnly disabled tabIndex={-1} />
        </div>
    );
}

function Profile() {
    const { currentUser, refreshProfile } = useAuth();

    const load = useCallback(() => getMyProfile(), []);
    const { rows: profile, loading, error, reload } = useCollection(load, { what: 'your profile' });
    const { flash, say, busy, run } = useFlash();

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    // The form follows whatever the last load returned, so a failed save leaves
    // the boxes holding the stored values rather than the refused ones.
    useEffect(() => {
        if (loading || Array.isArray(profile)) return;
        setName(profile.name || '');
        setPhone(profile.phone || '');
    }, [profile, loading]);

    if (loading) return <div style={{ padding: '40px', color: '#555' }}>Loading…</div>;

    const p = Array.isArray(profile) ? {} : profile;
    const dirty = name !== (p.name || '') || phone !== (p.phone || '');
    const ready = Boolean(name.trim()) && dirty && !busy;

    const handleSave = () => run(async () => {
        await updateMyProfile({ name: name.trim(), phone: phone.trim() });
        say('ok', 'Saved. Your name and phone are updated.');
        // Both: the page's own copy, and the session the sidebar greeting and
        // the navbar chip read from. Without the second, the name you just
        // saved is on this form and nowhere else until a reload.
        await reload();
        await refreshProfile();
    });

    const permissions = p.permissions === 'all'
        ? 'all pages'
        : `${(p.permissions || []).length} page(s)`;

    return (
        <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ color: '#1a2035', margin: 0 }}>👤 My Profile</h2>
            </div>

            {error && <Notice tone="error">{error}</Notice>}
            {flash && <Notice tone={flash.tone}>{flash.text}</Notice>}

            <div style={{ maxWidth: '500px' }}>
                <div style={{ background: 'white', borderRadius: '12px', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    {/* Avatar */}
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: '#0d6efd', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '32px', fontWeight: '700', margin: '0 auto 10px',
                        }}>
                            {name ? name.charAt(0).toUpperCase() : '👤'}
                        </div>
                        <div style={{ fontSize: '13px', color: '#888' }}>{p.email || currentUser?.email}</div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Full Name <span style={{ color: '#dc3545' }}>*</span></label>
                        <input style={inputStyle} placeholder="Your full name" value={name}
                            onChange={e => setName(e.target.value)} />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={labelStyle}>Phone Number</label>
                        <input style={inputStyle} placeholder="01700-000000" value={phone}
                            onChange={e => setPhone(e.target.value)} />
                    </div>

                    <div style={{
                        borderTop: '1px solid #f0f0f0', paddingTop: '18px', marginBottom: '4px',
                        fontSize: '12px', color: '#6c757d', lineHeight: 1.6,
                    }}>
                        These decide what you may reach, so only a Super Admin may change
                        them — from <strong>Admin → User Permission</strong>. They are shown
                        here so you can check them, and read what the audit log records
                        against you.
                    </div>
                    <div style={{ marginTop: '14px' }}>
                        <Locked label="Email" value={p.email} />
                        <Locked label="Role" value={p.role} />
                        <Locked label="Page access" value={permissions} />
                        <Locked label="Office" value={p.officeId ? officeLabel(p.officeId) : null} />
                        <Locked label="Area" value={p.areaId} />
                        <Locked label="Territory" value={p.territoryId} />
                        <Locked label="Status" value={p.status} />
                    </div>

                    <button onClick={handleSave} disabled={!ready} style={{
                        width: '100%', padding: '12px', marginTop: '8px',
                        background: ready ? '#0d6efd' : '#adb5bd', color: 'white',
                        border: 'none', borderRadius: '8px',
                        fontSize: '15px', fontWeight: '700',
                        cursor: ready ? 'pointer' : 'not-allowed',
                    }}>
                        {busy ? 'Saving…' : '💾 Save Profile'}
                    </button>

                    {p.updatedAt && (
                        <div style={{ marginTop: '12px', fontSize: '12px', color: '#adb5bd', textAlign: 'center' }}>
                            Last changed {formatDate(p.updatedAt)}. Every change to this
                            profile is recorded in the audit log with its previous value.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Profile;
