import React, { useState } from 'react';

const initialData = {
    'Purchase': [
        { id: 1, ref: 'INV-001', product: 'Fertilizer A', supplier: 'ACI Limited', date: '2026-06-01', quantity: 100, amount: 25000, status: 'Received' },
        { id: 2, ref: 'INV-002', product: 'Pesticide B', supplier: 'Square Pharma', date: '2026-06-03', quantity: 50, amount: 18000, status: 'Pending' },
    ],
    'Batch': [
        { id: 1, ref: 'BAT-001', product: 'Fertilizer A', batchNo: 'B-2026-01', date: '2026-06-01', quantity: 100, status: 'Active' },
        { id: 2, ref: 'BAT-002', product: 'Pesticide B', batchNo: 'B-2026-02', date: '2026-06-03', quantity: 50, status: 'Active' },
    ],
    'Repacking': [
        { id: 1, ref: 'REP-001', product: 'Fertilizer A', fromSize: '50kg', toSize: '10kg', date: '2026-06-01', quantity: 10, status: 'Done' },
        { id: 2, ref: 'REP-002', product: 'Pesticide B', fromSize: '1L', toSize: '250ml', date: '2026-06-03', quantity: 20, status: 'Pending' },
    ],
    'Product Demand': [
        { id: 1, ref: 'DEM-001', product: 'Fertilizer A', requestedBy: 'Rahim', date: '2026-06-01', quantity: 30, status: 'Approved' },
        { id: 2, ref: 'DEM-002', product: 'Pesticide B', requestedBy: 'Karim', date: '2026-06-03', quantity: 15, status: 'Pending' },
    ],
};

const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

const icons = {
    'Purchase': '🛍️',
    'Batch': '📦',
    'Repacking': '🔄',
    'Product Demand': '📋',
};

const statusColors = {
    'Received': { bg: '#d4edda', color: '#155724' },
    'Active': { bg: '#d4edda', color: '#155724' },
    'Done': { bg: '#d4edda', color: '#155724' },
    'Approved': { bg: '#d4edda', color: '#155724' },
    'Pending': { bg: '#ffeeba', color: '#856404' },
};

function Inventory({ type = 'Purchase' }) {
    const [data, setData] = useState(initialData[type] || []);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ ref: '', product: '', date: '', quantity: '', amount: '', status: 'Pending' });

    const filtered = data.filter(d =>
        Object.values(d).some(v => v.toString().toLowerCase().includes(search.toLowerCase()))
    );

    const handleAdd = () => {
        if (!form.ref || !form.product || !form.date || !form.quantity) return;
        setData([...data, { ...form, id: data.length + 1, quantity: parseInt(form.quantity), amount: parseFloat(form.amount || 0) }]);
        setForm({ ref: '', product: '', date: '', quantity: '', amount: '', status: 'Pending' });
        setShowForm(false);
    };

    const handleDelete = (id) => {
        setData(data.filter(d => d.id !== id));
    };

    const keys = Object.keys(filtered[0] || {}).filter(k => k !== 'id');

    return (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#1a2035', margin: 0 }}>{icons[type] || '📦'} {type}</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{ backgroundColor: '#0d6efd', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
                >
                    + New {type}
                </button>
            </div>

            {showForm && (
                <div style={{ ...cardStyle, marginBottom: '20px', borderLeft: '4px solid #0d6efd' }}>
                    <h4 style={{ marginTop: 0, color: '#1a2035' }}>Add New {type}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        <input placeholder="Reference No" value={form.ref} onChange={e => setForm({ ...form, ref: e.target.value })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
                        <input placeholder="Product Name" value={form.product} onChange={e => setForm({ ...form, product: e.target.value })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
                        <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
                        <input placeholder="Quantity" type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
                        <input placeholder="Amount (optional)" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }}>
                            <option>Pending</option>
                            <option>Received</option>
                            <option>Active</option>
                            <option>Done</option>
                            <option>Approved</option>
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
                                                    backgroundColor: statusColors[row[k]]?.bg || '#f8f9fa',
                                                    color: statusColors[row[k]]?.color || '#495057',
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
                    <p style={{ textAlign: 'center', color: '#adb5bd', padding: '20px' }}>No data found</p>
                )}
            </div>
        </div>
    );
}

export default Inventory;