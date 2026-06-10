import React, { useState } from 'react';

const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

const inputStyle = { padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px', width: '100%', boxSizing: 'border-box' };
const labelStyle = { fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '5px', display: 'block' };

// ── VAT SETTINGS ──────────────────────────────────────────
function VatSettings() {
    const [vatList, setVatList] = useState([
        { id: 1, name: 'Standard VAT', rate: 15, type: 'Percentage', status: 'Active' },
        { id: 2, name: 'Reduced VAT', rate: 5, type: 'Percentage', status: 'Active' },
        { id: 3, name: 'Zero VAT', rate: 0, type: 'Percentage', status: 'Inactive' },
    ]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', rate: '', type: 'Percentage', status: 'Active' });

    const handleAdd = () => {
        if (!form.name || form.rate === '') return;
        setVatList([...vatList, { ...form, id: vatList.length + 1, rate: parseFloat(form.rate) }]);
        setForm({ name: '', rate: '', type: 'Percentage', status: 'Active' });
        setShowForm(false);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#1a2035', margin: 0 }}>🧾 VAT Settings</h2>
                <button onClick={() => setShowForm(!showForm)}
                    style={{ backgroundColor: '#0d6efd', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    + Add VAT
                </button>
            </div>

            {showForm && (
                <div style={{ ...cardStyle, marginBottom: '20px', borderLeft: '4px solid #0d6efd' }}>
                    <h4 style={{ marginTop: 0, color: '#1a2035' }}>Add New VAT</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        <input placeholder="VAT Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
                        <input placeholder="Rate (%)" type="number" value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} style={inputStyle} />
                        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inputStyle}>
                            <option>Percentage</option>
                            <option>Fixed</option>
                        </select>
                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inputStyle}>
                            <option>Active</option>
                            <option>Inactive</option>
                        </select>
                        <button onClick={handleAdd}
                            style={{ backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                            Save
                        </button>
                    </div>
                </div>
            )}

            <div style={cardStyle}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                            {['#', 'VAT Name', 'Rate', 'Type', 'Status', 'Action'].map(h => (
                                <th key={h} style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {vatList.map((row, i) => (
                            <tr key={row.id} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                <td style={{ padding: '10px 12px' }}>{i + 1}</td>
                                <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#1a2035' }}>{row.name}</td>
                                <td style={{ padding: '10px 12px', fontWeight: 'bold' }}>{row.rate}%</td>
                                <td style={{ padding: '10px 12px' }}>{row.type}</td>
                                <td style={{ padding: '10px 12px' }}>
                                    <span style={{
                                        backgroundColor: row.status === 'Active' ? '#d4edda' : '#f8d7da',
                                        color: row.status === 'Active' ? '#155724' : '#721c24',
                                        padding: '3px 10px', borderRadius: '20px', fontSize: '12px'
                                    }}>{row.status}</span>
                                </td>
                                <td style={{ padding: '10px 12px' }}>
                                    <button onClick={() => setVatList(vatList.filter(d => d.id !== row.id))}
                                        style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── COMPANY PROFILE ───────────────────────────────────────
function CompanyProfile() {
    const [profile, setProfile] = useState({
        companyName: 'Agrivision International',
        email: 'info@agrivision.com',
        phone: '01700-000000',
        address: 'Dhaka, Bangladesh',
        website: 'www.agrivision.com',
        tradeNo: 'TRADE-2026-001',
        vatNo: 'VAT-2026-001',
        binNo: 'BIN-2026-001',
        currency: 'BDT (৳)',
        fiscalYear: 'January - December',
        logo: '',
    });
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const field = (label, key, type = 'text', options = null) => (
        <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>{label}</label>
            {options ? (
                <select value={profile[key]} onChange={e => setProfile({ ...profile, [key]: e.target.value })} style={inputStyle}>
                    {options.map(o => <option key={o}>{o}</option>)}
                </select>
            ) : (
                <input type={type} value={profile[key]} onChange={e => setProfile({ ...profile, [key]: e.target.value })} style={inputStyle} />
            )}
        </div>
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#1a2035', margin: 0 }}>🏢 Company Profile</h2>
                {saved && (
                    <span style={{ backgroundColor: '#d4edda', color: '#155724', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>
                        ✅ Saved successfully!
                    </span>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Left */}
                <div style={cardStyle}>
                    <h4 style={{ margin: '0 0 16px', color: '#1a2035', borderBottom: '2px solid #f0f2f5', paddingBottom: '10px' }}>Basic Information</h4>
                    {field('Company Name', 'companyName')}
                    {field('Email Address', 'email', 'email')}
                    {field('Phone Number', 'phone')}
                    {field('Address', 'address')}
                    {field('Website', 'website')}
                </div>

                {/* Right */}
                <div style={cardStyle}>
                    <h4 style={{ margin: '0 0 16px', color: '#1a2035', borderBottom: '2px solid #f0f2f5', paddingBottom: '10px' }}>Business Information</h4>
                    {field('Trade License No', 'tradeNo')}
                    {field('VAT Registration No', 'vatNo')}
                    {field('BIN No', 'binNo')}
                    {field('Currency', 'currency', 'text', ['BDT (৳)', 'USD ($)', 'EUR (€)'])}
                    {field('Fiscal Year', 'fiscalYear', 'text', ['January - December', 'July - June', 'April - March'])}
                </div>
            </div>

            {/* Logo Upload */}
            <div style={{ ...cardStyle, marginTop: '20px' }}>
                <h4 style={{ margin: '0 0 16px', color: '#1a2035', borderBottom: '2px solid #f0f2f5', paddingBottom: '10px' }}>Company Logo</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: '80px', height: '80px', backgroundColor: '#f0f2f5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }}>
                        🌱
                    </div>
                    <div>
                        <input type="file" accept="image/*" style={{ fontSize: '13px' }} />
                        <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#888' }}>PNG, JPG max 2MB. Recommended: 200x200px</p>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button onClick={handleSave}
                    style={{ backgroundColor: '#0d6efd', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                    💾 Save Company Profile
                </button>
            </div>
        </div>
    );
}

// ── CONFIGURATION ─────────────────────────────────────────
function Configuration() {
    const [config, setConfig] = useState({
        invoicePrefix: 'AINV',
        orderPrefix: 'AOR',
        deliveryPrefix: 'ADO',
        autoInvoice: true,
        lowStockAlert: true,
        lowStockQty: 10,
        emailNotification: false,
        smsNotification: true,
        defaultPaymentTerm: '30 Days',
        timezone: 'Asia/Dhaka',
        dateFormat: 'DD-MM-YYYY',
        language: 'Bengali',
        theme: 'Light',
    });
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const toggle = (key) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f2f5' }}>
            <span style={{ fontSize: '13px', color: '#333' }}>{key === 'autoInvoice' ? 'Auto Invoice Number' : key === 'lowStockAlert' ? 'Low Stock Alert' : key === 'emailNotification' ? 'Email Notification' : 'SMS Notification'}</span>
            <div onClick={() => setConfig({ ...config, [key]: !config[key] })}
                style={{ width: '44px', height: '24px', borderRadius: '12px', backgroundColor: config[key] ? '#0d6efd' : '#dee2e6', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '3px', left: config[key] ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
        </div>
    );

    const selectField = (label, key, options) => (
        <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>{label}</label>
            <select value={config[key]} onChange={e => setConfig({ ...config, [key]: e.target.value })} style={inputStyle}>
                {options.map(o => <option key={o}>{o}</option>)}
            </select>
        </div>
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#1a2035', margin: 0 }}>⚙️ Configuration</h2>
                {saved && (
                    <span style={{ backgroundColor: '#d4edda', color: '#155724', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>
                        ✅ Saved successfully!
                    </span>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Prefix Settings */}
                <div style={cardStyle}>
                    <h4 style={{ margin: '0 0 16px', color: '#1a2035', borderBottom: '2px solid #f0f2f5', paddingBottom: '10px' }}>🔢 Prefix Settings</h4>
                    <div style={{ marginBottom: '14px' }}>
                        <label style={labelStyle}>Invoice Prefix</label>
                        <input value={config.invoicePrefix} onChange={e => setConfig({ ...config, invoicePrefix: e.target.value })} style={inputStyle} />
                    </div>
                    <div style={{ marginBottom: '14px' }}>
                        <label style={labelStyle}>Order Prefix</label>
                        <input value={config.orderPrefix} onChange={e => setConfig({ ...config, orderPrefix: e.target.value })} style={inputStyle} />
                    </div>
                    <div style={{ marginBottom: '14px' }}>
                        <label style={labelStyle}>Delivery Prefix</label>
                        <input value={config.deliveryPrefix} onChange={e => setConfig({ ...config, deliveryPrefix: e.target.value })} style={inputStyle} />
                    </div>
                    <div style={{ marginBottom: '14px' }}>
                        <label style={labelStyle}>Low Stock Qty Alert</label>
                        <input type="number" value={config.lowStockQty} onChange={e => setConfig({ ...config, lowStockQty: e.target.value })} style={inputStyle} />
                    </div>
                </div>

                {/* Notifications */}
                <div style={cardStyle}>
                    <h4 style={{ margin: '0 0 16px', color: '#1a2035', borderBottom: '2px solid #f0f2f5', paddingBottom: '10px' }}>🔔 Notifications & Toggle</h4>
                    {toggle('autoInvoice')}
                    {toggle('lowStockAlert')}
                    {toggle('emailNotification')}
                    {toggle('smsNotification')}
                </div>

                {/* General */}
                <div style={cardStyle}>
                    <h4 style={{ margin: '0 0 16px', color: '#1a2035', borderBottom: '2px solid #f0f2f5', paddingBottom: '10px' }}>🌐 General Settings</h4>
                    {selectField('Timezone', 'timezone', ['Asia/Dhaka', 'Asia/Kolkata', 'UTC', 'Asia/Dubai'])}
                    {selectField('Date Format', 'dateFormat', ['DD-MM-YYYY', 'MM-DD-YYYY', 'YYYY-MM-DD'])}
                    {selectField('Language', 'language', ['Bengali', 'English'])}
                    {selectField('Theme', 'theme', ['Light', 'Dark'])}
                </div>

                {/* Payment */}
                <div style={cardStyle}>
                    <h4 style={{ margin: '0 0 16px', color: '#1a2035', borderBottom: '2px solid #f0f2f5', paddingBottom: '10px' }}>💳 Payment Settings</h4>
                    {selectField('Default Payment Term', 'defaultPaymentTerm', ['Immediate', '7 Days', '15 Days', '30 Days', '60 Days'])}
                    <div style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '14px', marginTop: '10px' }}>
                        <p style={{ margin: 0, fontSize: '13px', color: '#555' }}>
                            <strong>Current Config Preview:</strong><br />
                            Invoice: <code>{config.invoicePrefix}-2026-06-001</code><br />
                            Date: <code>{new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}</code><br />
                            Currency: <code>৳ BDT</code>
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button onClick={handleSave}
                    style={{ backgroundColor: '#0d6efd', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                    💾 Save Configuration
                </button>
            </div>
        </div>
    );
}

// ── MAIN EXPORT ───────────────────────────────────────────
function Settings({ type = 'Company Profile' }) {
    return (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>
            {type === 'Vat' && <VatSettings />}
            {type === 'Company Profile' && <CompanyProfile />}
            {type === 'Configuration' && <Configuration />}
        </div>
    );
}

export default Settings;