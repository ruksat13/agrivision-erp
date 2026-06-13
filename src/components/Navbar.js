import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

function Navbar() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const fetchName = async () => {
            if (currentUser) {
                const docRef = doc(db, 'users', currentUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setUserName(docSnap.data().name || '');
                }
            }
        };
        fetchName();
    }, [currentUser]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const displayName = userName || currentUser?.email?.split('@')[0] || 'User';

    return (
        <div style={{
            height: '60px',
            backgroundColor: 'white',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
            {/* Left */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button style={{
                    background: '#0d6efd', color: 'white',
                    border: 'none', borderRadius: '8px',
                    padding: '7px 16px', fontSize: '13px',
                    fontWeight: '600', cursor: 'pointer'
                }}>
                    🏢 Head Office
                </button>
            </div>

            {/* Right */}
            <div style={{ position: 'relative' }}>
                <div
                    onClick={() => setShowDropdown(!showDropdown)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        cursor: 'pointer', padding: '6px 12px',
                        borderRadius: '8px', border: '1px solid #e2e8f0',
                        background: '#f8f9fa',
                    }}
                >
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: '#0d6efd', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '14px', fontWeight: '700',
                    }}>
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#1a2035' }}>
                        {displayName}
                    </span>
                    <span style={{ fontSize: '10px', color: '#888' }}>▼</span>
                </div>

                {/* Dropdown */}
                {showDropdown && (
                    <div style={{
                        position: 'absolute', right: 0, top: '48px',
                        background: 'white', borderRadius: '10px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        border: '1px solid #e2e8f0',
                        width: '180px', zIndex: 200,
                        overflow: 'hidden',
                    }}>
                        <div
                            onClick={() => { navigate('/profile'); setShowDropdown(false); }}
                            style={{
                                padding: '12px 16px', cursor: 'pointer',
                                fontSize: '13px', color: '#333',
                                borderBottom: '1px solid #f0f2f5',
                            }}
                            onMouseEnter={e => e.target.style.background = '#f8f9fa'}
                            onMouseLeave={e => e.target.style.background = 'white'}
                        >
                            ✏️ Edit Profile
                        </div>
                        <div
                            onClick={() => { navigate('/change-password'); setShowDropdown(false); }}
                            style={{
                                padding: '12px 16px', cursor: 'pointer',
                                fontSize: '13px', color: '#333',
                                borderBottom: '1px solid #f0f2f5',
                            }}
                            onMouseEnter={e => e.target.style.background = '#f8f9fa'}
                            onMouseLeave={e => e.target.style.background = 'white'}
                        >
                            🔒 Edit Password
                        </div>
                        <div
                            onClick={handleLogout}
                            style={{
                                padding: '12px 16px', cursor: 'pointer',
                                fontSize: '13px', color: '#dc3545',
                            }}
                            onMouseEnter={e => e.target.style.background = '#fff5f5'}
                            onMouseLeave={e => e.target.style.background = 'white'}
                        >
                            🚪 Log Out
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Navbar;