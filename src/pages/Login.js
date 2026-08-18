import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Signing in fails for several different reasons and they are not the user's
// fault in the same way. This screen used to report all of them as
// "Email বা Password ভুল হয়েছে!", which is wrong three times out of four and
// costs ten minutes of retyping a password that was always correct — the
// emulator being down looked exactly like a typo.
//
// Three failures have to be told apart (and are, below):
//
//   1. the credentials really are wrong        → the user retypes
//   2. nothing is answering — emulator, network, Firestore
//                                              → the user starts the database
//   3. Auth accepted the account but users/{uid} is missing or Inactive
//                                              → the user calls an administrator
//
// Where the error comes from:
//   · Firebase Auth        err.code = 'auth/…'   (signInWithEmailAndPassword)
//   · Firestore            err.code = 'unavailable' | 'permission-denied' | …
//   · this codebase        ServiceError, thrown by startSession() in
//                          services/users.js — 'NOT_FOUND' when the profile
//                          document does not exist, 'VALIDATION' when it does
//                          but its status is not Active. Those are the only two
//                          it raises on the login path.
//
// The wording stays Bengali and stays plain enough to be read over a shoulder
// during the demonstration. The raw code goes underneath in small grey type: it
// is what a developer needs and it is not a sentence anyone has to read.

const LOGIN_ERRORS = {
    credentials: {
        tone: 'error',
        text: 'ইমেইল বা পাসওয়ার্ড ঠিক নয়।',
        hint: 'বানান দেখে আবার চেষ্টা করুন।',
    },
    unreachable: {
        tone: 'warn',
        text: 'সার্ভারের সঙ্গে সংযোগ করা যাচ্ছে না।',
        hint: 'পাসওয়ার্ড ভুল নয় — ডেটাবেস (emulator) চালু আছে কি না ও ইন্টারনেট সংযোগ দেখুন।',
    },
    noProfile: {
        tone: 'error',
        text: 'পরিচয় যাচাই হয়েছে, কিন্তু এই অ্যাকাউন্টের প্রোফাইল পাওয়া যায়নি।',
        hint: 'পাসওয়ার্ড ঠিক আছে। প্রশাসকের সঙ্গে যোগাযোগ করুন।',
    },
    inactive: {
        tone: 'error',
        text: 'এই অ্যাকাউন্টটি নিষ্ক্রিয় (Inactive) করা আছে।',
        hint: 'পাসওয়ার্ড ঠিক আছে। প্রশাসকের সঙ্গে যোগাযোগ করুন।',
    },
    denied: {
        tone: 'error',
        text: 'প্রোফাইল পড়ার অনুমতি পাওয়া যায়নি।',
        hint: 'পাসওয়ার্ড ঠিক আছে। Security Rules পরীক্ষা করুন।',
    },
    throttled: {
        tone: 'warn',
        text: 'অনেকবার ভুল চেষ্টা হয়েছে, অ্যাকাউন্টটি সাময়িকভাবে বন্ধ আছে।',
        hint: 'কিছুক্ষণ পরে আবার চেষ্টা করুন।',
    },
    incomplete: {
        tone: 'warn',
        text: 'ইমেইল ও পাসওয়ার্ড দুটোই লিখুন।',
        hint: null,
    },
    unknown: {
        tone: 'error',
        text: 'লগইন করা যায়নি।',
        hint: 'কারণ শনাক্ত করা যায়নি — নিচের কোডটি দেখে দায়িত্বপ্রাপ্ত ব্যক্তিকে জানান।',
    },
};

/** Which of the failures above is this? Exported so it can be tested directly. */
export function classifyLoginError(err) {
    const code = err?.code || '';

    // 3 — Auth said yes, the profile said no. ServiceError from startSession().
    if (code === 'NOT_FOUND') return 'noProfile';
    if (code === 'VALIDATION') return 'inactive';

    // 2 — nothing answered. 'auth/network-request-failed' is what the Auth
    // emulator being down looks like; 'unavailable' is Firestore being down
    // after Auth has already succeeded.
    if (code === 'auth/network-request-failed'
        || code === 'unavailable'
        || code === 'deadline-exceeded'
        || code === 'auth/timeout') return 'unreachable';

    // Rules refused the users/{uid} read — a different problem from all three,
    // and the one the production rules will produce if they are deployed before
    // the profile documents exist.
    if (code === 'permission-denied' || code === 'unauthenticated') return 'denied';

    if (code === 'auth/too-many-requests') return 'throttled';
    if (code === 'auth/user-disabled') return 'inactive';

    // 1 — the credentials. Recent SDKs collapse wrong-password and unknown-user
    // into 'auth/invalid-credential' to stop email enumeration, so all of these
    // land in one bucket on purpose.
    if (code.startsWith('auth/')) return 'credentials';

    return 'unknown';
}

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Asked first, so an empty form is not reported as a wrong password.
        if (!email.trim() || !password) {
            setError({ ...LOGIN_ERRORS.incomplete, code: null });
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            const kind = classifyLoginError(err);
            // Anything unclassified is a bug, not a user mistake — keep the
            // whole error where a developer can find it.
            if (kind === 'unknown') console.error('[login] unclassified failure', err);
            setError({ ...LOGIN_ERRORS[kind], code: err?.code || null });
        }
        setLoading(false);
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f0f2f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Segoe UI', Arial, sans-serif"
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '40px',
                width: '400px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '8px' }}>🌿</div>
                    <h2 style={{ color: '#1a2035', margin: '0 0 4px', fontSize: '22px', fontWeight: '800' }}>
                        Agrivision International
                    </h2>
                    <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>ERP Management System</p>
                </div>

                {/* Error. Amber where the account is fine and something else is
                    wrong — an unreachable server should not look like a rejection. */}
                {error && (
                    <div style={{
                        background: error.tone === 'warn' ? '#fff8e1' : '#f8d7da',
                        border: `1px solid ${error.tone === 'warn' ? '#ffc107' : '#f5c6cb'}`,
                        color: error.tone === 'warn' ? '#856404' : '#721c24',
                        padding: '10px 14px', borderRadius: '8px',
                        marginBottom: '16px', fontSize: '13px', lineHeight: 1.7,
                    }}>
                        <div style={{ fontWeight: 700 }}>
                            {error.tone === 'warn' ? '⚠️' : '⛔'} {error.text}
                        </div>
                        {error.hint && (
                            <div style={{ marginTop: '3px', fontSize: '12px', opacity: 0.9 }}>
                                {error.hint}
                            </div>
                        )}
                        {error.code && (
                            <div style={{
                                marginTop: '6px', fontSize: '11px', opacity: 0.7,
                                fontFamily: 'ui-monospace, Consolas, monospace',
                            }}>
                                {error.code}
                            </div>
                        )}
                    </div>
                )}

                {/* Form */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '5px', display: 'block' }}>
                        Email Address
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        style={{
                            width: '100%', padding: '10px 14px', borderRadius: '8px',
                            border: '1px solid #dee2e6', fontSize: '14px',
                            boxSizing: 'border-box', outline: 'none'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '5px', display: 'block' }}>
                        Password
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        style={{
                            width: '100%', padding: '10px 14px', borderRadius: '8px',
                            border: '1px solid #dee2e6', fontSize: '14px',
                            boxSizing: 'border-box', outline: 'none'
                        }}
                    />
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{
                        width: '100%', padding: '12px',
                        background: '#0d6efd', color: 'white',
                        border: 'none', borderRadius: '8px',
                        fontSize: '15px', fontWeight: '700',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    {loading ? 'Logging in...' : '🔐 Login'}
                </button>

                {/* Demo accounts quick-login */}
                <div style={{ marginTop: '22px', paddingTop: '16px', borderTop: '1px dashed #e2e6ea' }}>
                    <p style={{ fontSize: '12px', color: '#888', margin: '0 0 8px', fontWeight: '600' }}>Demo Accounts (password: 123456)</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {/* The three roles the demonstration script walks through, in the
                            order INTERNAL-PLAN.md §7 uses them. Roles are the ones in
                            ROLE — the same names firestore.rules reads from users/{uid}. */}
                        {[
                            { label: 'Md. Sales Officer — Sales Officer (raises the order)', email: 'officer10@agrivision.com' },
                            { label: 'Sadia Akter — Area Manager (may override a block)', email: 'sadia@agrivision.com' },
                            { label: 'Md. Ruksat Hasan Akib — Super Admin (all access)', email: 'akib@agrivision.com' },
                        ].map(d => (
                            <button key={d.email} type="button"
                                onClick={() => { setEmail(d.email); setPassword('123456'); }}
                                style={{ textAlign: 'left', padding: '8px 12px', background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', color: '#495057' }}>
                                <b>{d.label}</b><br /><span style={{ color: '#888' }}>{d.email}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <p style={{ textAlign: 'center', fontSize: '12px', color: '#aaa', marginTop: '20px', marginBottom: 0 }}>
                    © 2026 Agrivision International
                </p>
            </div>
        </div>
    );
}

export default Login;