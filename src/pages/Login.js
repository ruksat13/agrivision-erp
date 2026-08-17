import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError('Email বা Password ভুল হয়েছে!');
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

                {/* Error */}
                {error && (
                    <div style={{
                        background: '#f8d7da', color: '#721c24',
                        padding: '10px 14px', borderRadius: '8px',
                        marginBottom: '16px', fontSize: '13px'
                    }}>
                        ⚠️ {error}
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