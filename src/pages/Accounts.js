import React, { useState } from 'react';

const initialData = {
    'Supplier Purchase': [
        { id: 1, ref: 'PUR-001', supplier: 'ACI Limited', date: '2026-06-01', amount: 25000, status: 'Paid' },
        { id: 2, ref: 'PUR-002', supplier: 'Square Pharma', date: '2026-06-03', amount: 18000, status: 'Due' },
    ],
    'Cash Collection': [
        { id: 1, ref: 'COL-001', customer: 'Mr. Rahim', date: '2026-06-01', amount: 5000, status: 'Collected' },
        { id: 2, ref: 'COL-002', customer: 'Ms. Suma', date: '2026-06-02', amount: 12000, status: 'Collected' },
    ],
    'Supplier Payment': [
        { id: 1, ref: 'PAY-001', supplier: 'ACI Limited', date: '2026-06-01', amount: 10000, status: 'Paid' },
        { id: 2, ref: 'PAY-002', supplier: 'Square Pharma', date: '2026-06-03', amount: 8000, status: 'Pending' },
    ],
    'Expense': [
        { id: 1, ref: 'EXP-001', head: 'Stationery', date: '2026-06-01', amount: 450, status: 'Paid' },
        { id: 2, ref: 'EXP-002', head: 'Transport', date: '2026-06-02', amount: 1200, status: 'Paid' },
    ],
    'Bank Account': [
        { id: 1, ref: 'BANK-001', name: 'BRAC Bank', date: '2026-06-01', amount: 520000, status: 'Active' },
        { id: 2, ref: 'BANK-002', name: 'Dutch Bangla', date: '2026-06-01', amount: 150000, status: 'Active' },
    ],
};

const defaultData = [
    { id: 1, ref: 'REF-001', name: 'Entry 1', date: '2026-06-01', amount: 5000, status: 'Active' },
    { id: 2, ref: 'REF-002', name: 'Entry 2', date: '2026-06-02', amount: 8000, status: 'Active' },
];

const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

const icons = {
    'Supplier Purchase': '🏭',
    'Cash Collection': '💵',
    'Supplier Payment': '💸',
    'Customer Ledger': '📒',
    'Customer Opening Balance': '💰',
    'Supplier Ledger': '📗',
    'Supplier Opening Balance': '🏦',
    'Customer Commission': '🤝',
    'Supplier Commission': '🤝',
    'Expense': '🧾',
    'Employee Account': '👤',
    'Expense Head': '📌',
    'Bank Account': '🏦',
};

function Accounts({ type = 'Supplier Purchase' }) {
    const base = initialData[type] || defaultData;
    const [data, setData] = useState(base);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ ref: '', name: '', date: '', amount: '', status: 'Active' });

    const filtered = data.filter(d =>
        Object.values(d).some(v => v.toString().toLowerCase().includes(search.toLowerCase()))
    );

    const handleAdd = () => {
        if (!form.ref || !form.name || !form.date || !form.amount) return;
        setData([...data, { ...form, id: data.length + 1, amount: parseFloat(form.amount) }]);
        setForm({ ref: '', name: '', date: '', amount: '', status: 'Active' });
        setShowForm(false);
    };

    const handleDelete = (id) => {
        setData(data.filter(d => d.id !== id));
    };

    const keys = Object.keys(filtered[0] || {}).filter(k => k !== 'id');

    return (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#1a2035', margin: 0 }}>{icons[type] || '💰'} {type}</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{ backgroundColor: '#0d6efd', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
                >
                    + New Entry
                </button>
            </div>

            {showForm && (
                <div style={{ ...cardStyle, marginBottom: '20px', borderLeft: '4px solid #0d6efd' }}>
                    <h4 style={{ marginTop: 0, color: '#1a2035' }}>Add New {type}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        <input placeholder="Reference No" value={form.ref} onChange={e => setForm({ ...form, ref: e.target.value })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
                        <input placeholder="Name / Head" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
                        <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
                        <input placeholder="Amount" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }}>
                            <option>Active</option>
                            <option>Paid</option>
                            <option>Due</option>
                            <option>Pending</option>
                        </select>
                        <button onClick={handleAdd}
                            style={{ backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                            Save
                        </button>
                    </div>
                </div>
            )}

            <div style={cardStyle}>
                <div style={{ marginBottom: '16px' }}>
                    <input
                        placeholder="Search..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px', width: '300px' }}
                    />
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>#</th>
                            {keys.map(k => (
                                <th key={k} style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', textTransform: 'capitalize' }}>{k}</th>
                            ))}
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((row, i) => (
                            <tr key={row.id} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                <td style={{ padding: '10px 12px' }}>{i + 1}</td>
                                {keys.map(k => (
                                    <td key={k} style={{ padding: '10px 12px' }}>
                                        {k === 'amount' ? `৳ ${Number(row[k]).toLocaleString()}` :
                                            k === 'status' ? (
                                                <span style={{
                                                    backgroundColor: row[k] === 'Paid' || row[k] === 'Active' || row[k] === 'Collected' ? '#d4edda' : '#ffeeba',
                                                    color: row[k] === 'Paid' || row[k] === 'Active' || row[k] === 'Collected' ? '#155724' : '#856404',
                                                    padding: '3px 10px', borderRadius: '20px', fontSize: '12px'
                                                }}>{row[k]}</span>
                                            ) : row[k]}
                                    </td>
                                ))}
                                <td style={{ padding: '10px 12px' }}>
                                    <button onClick={() => handleDelete(row.id)}
                                        style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filtered.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#adb5bd', padding: '20px' }}>কোনো ডেটা পাওয়া যায়নি</p>
                )}
            </div>
        </div>
    );
}

export default Accounts;