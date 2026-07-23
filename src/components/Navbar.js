import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

function Navbar({ onToggleSidebar }) {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [userName, setUserName] = useState('');

    const notifications = [
        { id: 1, text: 'Invoice AINV-001 payment due', time: '10 mins ago', unread: true },
        { id: 2, text: 'New order received from Mr. Rahim', time: '1 hr ago', unread: true },
        { id: 3, text: 'Supplier payment pending', time: '3 hrs ago', unread: false },
        { id: 4, text: 'Monthly report ready', time: '1 day ago', unread: false },
        { id: 5, text: 'Employee salary due', time: '2 days ago', unread: false },
    ];

    const unreadCount = notifications.filter(n => n.unread).length;

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
            backgroundColor: '#1a2035',
            borderBottom: '1px solid #2d3a5a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}>

            {/* Left — Hamburger + Cash */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

                {/* Hamburger Toggle */}
                <button
                    onClick={onToggleSidebar}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        fontSize: '20px',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        lineHeight: 1,
                    }}>
                    ☰
                </button>

                {/* Cash Display */}
                <div style={{
                    backgroundColor: '#0d6efd',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    lineHeight: 1.2,
                }}>
                    <span style={{ fontSize: '11px', color: '#cfe2ff', fontWeight: '600' }}>৳ 82,000</span>
                    <span style={{ fontSize: '9px', color: '#90b4f5' }}>Cash</span>
                </div>

                {/* Notification Bell */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => { setShowNotifications(!showNotifications); setShowDropdown(false); }}
                        style={{
                            background: '#dc3545',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: 'white',
                            fontSize: '13px',
                            fontWeight: '600',
                            position: 'relative',
                        }}>
                        🔔
                        <span style={{
                            backgroundColor: 'white',
                            color: '#dc3545',
                            borderRadius: '10px',
                            padding: '1px 5px',
                            fontSize: '10px',
                            fontWeight: '700',
                        }}>{unreadCount}</span>
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div style={{
                            position: 'absolute',
                            left: 0,
                            top: '44px',
                            background: 'white',
                            borderRadius: '10px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                            border: '1px solid #e2e8f0',
                            width: '300px',
                            zIndex: 200,
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid #f0f2f5',
                                backgroundColor: '#f8f9fa',
                                fontWeight: '600',
                                fontSize: '13px',
                                color: '#1a2035',
                            }}>
                                🔔 Notifications ({unreadCount} unread)
                            </div>
                            {notifications.map(n => (
                                <div key={n.id} style={{
                                    padding: '10px 16px',
                                    borderBottom: '1px solid #f0f2f5',
                                    backgroundColor: n.unread ? '#f0f7ff' : 'white',
                                    cursor: 'pointer',
                                }}>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#333', fontWeight: n.unread ? '600' : '400' }}>{n.text}</p>
                                    <p style={{ margin: 0, fontSize: '11px', color: '#adb5bd', marginTop: '2px' }}>{n.time}</p>
                                </div>
                            ))}
                            <div style={{
                                padding: '10px 16px',
                                textAlign: 'center',
                                fontSize: '12px',
                                color: '#0d6efd',
                                cursor: 'pointer',
                                fontWeight: '600',
                            }}>
                                View All Notifications
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right — Head Office + User */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

                {/* Head Office Button */}
                <button style={{
                    background: '#0d6efd',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                }}>
                    🏢 Head Office
                </button>

                {/* User Dropdown */}
                <div style={{ position: 'relative' }}>
                    <div
                        onClick={() => { setShowDropdown(!showDropdown); setShowNotifications(false); }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            padding: '5px 10px',
                            borderRadius: '8px',
                            border: '1px solid #2d3a5a',
                            background: '#243050',
                        }}>
                        <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: '#0d6efd',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: '700',
                        }}>
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'white' }}>
                            {displayName}
                        </span>
                        <span style={{ fontSize: '10px', color: '#adb5bd' }}>▼</span>
                    </div>

                    {/* User Dropdown Menu */}
                    {showDropdown && (
                        <div style={{
                            position: 'absolute',
                            right: 0,
                            top: '44px',
                            background: 'white',
                            borderRadius: '10px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                            border: '1px solid #e2e8f0',
                            width: '180px',
                            zIndex: 200,
                            overflow: 'hidden',
                        }}>
                            <div
                                onClick={() => { navigate('/profile'); setShowDropdown(false); }}
                                style={{ padding: '12px 16px', cursor: 'pointer', fontSize: '13px', color: '#333', borderBottom: '1px solid #f0f2f5' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                ✏️ Edit Profile
                            </div>
                            <div
                                onClick={() => { navigate('/change-password'); setShowDropdown(false); }}
                                style={{ padding: '12px 16px', cursor: 'pointer', fontSize: '13px', color: '#333', borderBottom: '1px solid #f0f2f5' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                🔒 Edit Password
                            </div>
                            <div
                                onClick={handleLogout}
                                style={{ padding: '12px 16px', cursor: 'pointer', fontSize: '13px', color: '#dc3545' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                🚪 Log Out
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Navbar;