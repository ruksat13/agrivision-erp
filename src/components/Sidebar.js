import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { menuItems } from '../config/menu';

function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [openMenus, setOpenMenus] = useState({});
    const { logout, currentUser } = useAuth();

    // filter menu by the logged-in user's permissions
    const canAccess = (path) => {
        if (!currentUser || currentUser.permissions === 'all') return true;
        return (currentUser.permissions || []).includes(path);
    };

    const visibleMenu = menuItems
        .map(item => {
            if (item.children) {
                const kids = item.children.filter(c => canAccess(c.path));
                return kids.length ? { ...item, children: kids } : null;
            }
            return canAccess(item.path) ? item : null;
        })
        .filter(Boolean);

    const toggleMenu = (name) => {
        setOpenMenus(prev => {
            const isOpen = prev[name];
            // Accordion: close all, open only the clicked one (unless it was already open)
            return isOpen ? {} : { [name]: true };
        });
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div style={{
            width: '250px',
            height: '100vh',
            backgroundColor: '#1a2035',
            overflowY: 'auto',
            overflowX: 'hidden',
            color: 'white',
            fontFamily: 'Arial, sans-serif',
            display: 'flex',
            flexDirection: 'column',
        }}>
            {/* Logo */}
            <div style={{
                padding: '20px',
                backgroundColor: '#0d6efd',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: 'bold',
                borderBottom: '1px solid #2d3a5a',
            }}>
                🌿 Agrivision International
            </div>

            {/* User Info
            {currentUser && (
                <div
                    onClick={() => navigate('/profile')}
                    style={{
                        padding: '12px 16px',
                        backgroundColor: '#111827',
                        borderBottom: '1px solid #2d3a5a',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                    }}
                >
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: '#0d6efd', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '16px', fontWeight: '700', flexShrink: 0,
                    }}>
                        {currentUser.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: '600' }}>
                            {currentUser.displayName || currentUser.email.split('@')[0]}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {currentUser.email}
                        </div>
                    </div>
                </div>
            )} */}

            {/* Menu */}
            <ul style={{ listStyle: 'none', padding: '10px 0', margin: 0, flex: 1 }}>
                {visibleMenu.map((item) => (
                    <li key={item.name}>
                        <div
                            onClick={() => item.children ? toggleMenu(item.name) : navigate(item.path)}
                            style={{
                                padding: '10px 20px',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                backgroundColor: location.pathname === item.path ? '#0d6efd' : 'transparent',
                                fontSize: '13px',
                                borderLeft: location.pathname === item.path ? '3px solid #4dabf7' : '3px solid transparent',
                            }}
                        >
                            <span>{item.icon} {item.name}</span>
                            {item.children && <span>{openMenus[item.name] ? '▲' : '▼'}</span>}
                        </div>

                        {item.children && openMenus[item.name] && (
                            <ul style={{ listStyle: 'none', padding: '0', margin: 0, backgroundColor: '#111827' }}>
                                {item.children.map(child => (
                                    <li
                                        key={child.path}
                                        onClick={() => navigate(child.path)}
                                        style={{
                                            padding: '8px 20px 8px 40px',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            color: location.pathname === child.path ? '#4dabf7' : '#adb5bd',
                                            borderLeft: location.pathname === child.path ? '3px solid #4dabf7' : '3px solid transparent',
                                        }}
                                    >
                                        → {child.name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>
                ))}
            </ul>

            {/* Footer + Logout */}
            <div style={{
                padding: '12px 16px',
                backgroundColor: '#111827',
                borderTop: '1px solid #2d3a5a',
            }}>
                <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', marginBottom: '8px' }}>
                    © 2026 Agrivision International
                </div>
                <button
                    onClick={handleLogout}
                    style={{
                        width: '100%',
                        padding: '8px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                    }}
                >
                    🚪 Logout
                </button>
            </div>
        </div>
    );
}

export default Sidebar;