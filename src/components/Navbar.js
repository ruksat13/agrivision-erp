import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { officeLabel } from '../services';

// The top bar, given the same treatment as the Dashboard tiles: keep the
// structure, remove the fiction.
//
//   REMOVED  the "৳ 82,000 / Cash" chip. Nothing in this system stores a cash
//            position. `bank_accounts` carries name, number, bank, branch and
//            status and no balance field (schema §10), and the collection that
//            would hold takings, `collections`, does not exist —
//            /cash-collection is still a sample-data screen. A navbar chip has
//            no room for a "not yet connected" caption, so it goes rather than
//            being blanked (CLAUDE.md §7).
//   BLANKED  the notification bell. There is no `notifications` collection and
//            no screen that writes one, but a bell is a real thing this app will
//            want, so the control stays and the panel says what is missing. The
//            badge count went with the list: "2 unread" of five invented
//            messages, one of which named "Mr. Rahim", a dealer who has never
//            been in the database.
//   WIRED    the office. users/{uid}.officeId is a real field, seeded as 'head'
//            for every account, and officeLabel() turns it into the long form.
//            It reads the signed-in user now instead of saying "Head Office" to
//            everyone. It is a label rather than a button: it never had an
//            onClick, and there is no office-switching feature behind it.
//
// The direct getDoc on users/ went too. CLAUDE.md lists this file and Profile.js
// as the two places that bypass the service layer; this half of it was dead
// code anyway, because AuthContext.shapeUser() always sets `name` before the
// session exists.

function Navbar({ onToggleSidebar }) {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const displayName = currentUser?.name || currentUser?.email?.split('@')[0] || 'User';
    const office = officeLabel(currentUser?.officeId);

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

                {/* The cash chip stood here — see the header of this file. */}

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
                        {/* The badge read "2" — two of five invented messages
                            marked unread. There is nothing to count, so there
                            is no badge. */}
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
                                🔔 Notifications
                            </div>
                            <div style={{ padding: '16px', fontSize: '12px', color: '#6c757d', fontStyle: 'italic', lineHeight: 1.6 }}>
                                — not yet connected. There is no <code>notifications</code> collection
                                and no screen that writes one, so this panel would have to invent what
                                it showed.
                                <div style={{ marginTop: 8, fontStyle: 'normal' }}>
                                    What is real today is on the{' '}
                                    <span
                                        onClick={() => { navigate('/'); setShowNotifications(false); }}
                                        style={{ color: '#0d6efd', cursor: 'pointer', fontWeight: 600 }}>
                                        Dashboard
                                    </span>{' '}
                                    — the dealer licence expiry panel, which counts licences that have
                                    lapsed or are about to.
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right — Head Office + User */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

                {/* The signed-in user's own office, from users/{uid}.officeId.
                    A label, not a button: it never had an onClick, and there is
                    no office-switching feature for one to call. */}
                <span
                    title={office ? `Your office — users/{uid}.officeId is "${currentUser?.officeId}"` : 'No office recorded on your profile'}
                    style={{
                        background: office ? '#0d6efd' : '#3a4664',
                        color: office ? 'white' : '#adb5bd',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                    }}>
                    🏢 {office || 'No office'}
                </span>

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