import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const menuItems = [
    { name: 'Dashboard', path: '/', icon: '📊' },
    {
        name: 'Sales', icon: '🛒', children: [
            { name: 'Sales', path: '/sales' },
            { name: 'Sales Return', path: '/sales-return' },
            { name: 'Cancel Sales', path: '/cancel-sales' },
            { name: 'Damage', path: '/damage' },
        ]
    },
    {
        name: 'Accounts', icon: '💰', children: [
            { name: 'Supplier Purchase', path: '/supplier-purchase' },
            { name: 'Cash Collection', path: '/cash-collection' },
            { name: 'Supplier Payment', path: '/supplier-payment' },
            { name: 'Customer Ledger', path: '/customer-ledger' },
            { name: 'Customer Opening Balance', path: '/customer-opening-balance' },
            { name: 'Supplier Ledger', path: '/supplier-ledger' },
            { name: 'Supplier Opening Balance', path: '/supplier-opening-balance' },
            { name: 'Customer Commission', path: '/customer-commission' },
            { name: 'Supplier Commission', path: '/supplier-commission' },
            { name: 'Expense', path: '/expense' },
            { name: 'Employee Account', path: '/employee-account' },
            { name: 'Expense Head', path: '/expense-head' },
            { name: 'Bank Account', path: '/bank-account' },
        ]
    },
    {
        name: 'Inventory', icon: '📦', children: [
            { name: 'Purchase', path: '/purchase' },
            { name: 'Batch', path: '/batch' },
            { name: 'Repacking', path: '/repacking' },
            { name: 'Product Demand', path: '/product-demand' },
        ]
    },
    {
        name: 'Reports', icon: '📈', children: [
            { name: 'Sales', path: '/reports-sales' },
            { name: 'Product Sales', path: '/reports-product-sales' },
            { name: 'Officer Wise Sales', path: '/officer-wise-sales' },
            { name: 'Customer Wise Sales', path: '/customer-wise-sales' },
            { name: 'Territory Wise Sales', path: '/territory-wise-sales' },
            { name: 'Area Wise Sales', path: '/area-wise-sales' },
            { name: 'Collection', path: '/reports-collection' },
            { name: 'Officer Wise Collection', path: '/officer-wise-collection' },
            { name: 'Customer Wise Collection', path: '/customer-wise-collection' },
            { name: 'Territory Wise Collection', path: '/territory-wise-collection' },
            { name: 'Area Wise Collection', path: '/area-wise-collection' },
            { name: 'Due', path: '/reports-due' },
            { name: 'Expense', path: '/reports-expense' },
            { name: 'Sales Return', path: '/reports-sales-return' },
            { name: 'Top Customers', path: '/top-customers' },
            { name: 'Date Wise Invoices', path: '/date-wise-invoices' },
        ]
    },
    {
        name: 'License', icon: '🪪', children: [
            { name: 'License', path: '/license' },
            { name: 'Category', path: '/license-category' },
        ]
    },
    { name: 'Product', path: '/product', icon: '🌿' },
    {
        name: 'HR Management', icon: '👥', children: [
            { name: 'Daily Visit', path: '/daily-visit' },
            { name: 'Attendance', path: '/attendance' },
            { name: 'Daily Meter', path: '/daily-meter' },
            { name: 'Payroll', path: '/payroll' },
        ]
    },
    { name: 'Customer', path: '/customer', icon: '🤝' },
    { name: 'Supplier', path: '/supplier', icon: '🏭' },
    { name: 'Admin', path: '/admin', icon: '🔑' },
    { name: 'Employee', path: '/employee', icon: '👤' },
    { name: 'Employee Target', path: '/employee-target', icon: '🎯' },
    {
        name: 'Mapping', icon: '🗺️', children: [
            { name: 'Office Mapping', path: '/office-mapping' },
            { name: 'Region Mapping', path: '/region-mapping' },
            { name: 'Area Mapping', path: '/area-mapping' },
        ]
    },
    {
        name: 'SMS', icon: '💬', children: [
            { name: 'Campaign', path: '/sms-campaign' },
            { name: 'SMS', path: '/sms' },
            { name: 'SMS Log', path: '/sms-log' },
        ]
    },
    {
        name: 'Categories', icon: '🏷️', children: [
            { name: 'Categories', path: '/categories' },
            { name: 'Brand', path: '/brand' },
            { name: 'Unit', path: '/unit' },
            { name: 'Product Type', path: '/product-type' },
            { name: 'Origin', path: '/origin' },
        ]
    },
    { name: 'Delivery', path: '/delivery', icon: '🚚' },
    {
        name: 'Settings', icon: '⚙️', children: [
            { name: 'Vat', path: '/vat' },
            { name: 'Company Profile', path: '/company-profile' },
            { name: 'Configuration', path: '/configuration' },
        ]
    },
];

function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [openMenus, setOpenMenus] = useState({});
    const { logout, currentUser } = useAuth();

    const toggleMenu = (name) => {
        setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
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
            position: 'fixed',
            top: 0,
            left: 0,
            overflowY: 'auto',
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
                {menuItems.map((item) => (
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