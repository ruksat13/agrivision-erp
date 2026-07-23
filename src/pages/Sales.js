import React, { useState } from 'react';

const initialData = [
    { id: 1, invoice: 'AINV-2026-06-001', customer: 'Mr. Rahim', date: '2026-06-01', amount: 5555, status: 'Paid' },
    { id: 2, invoice: 'AINV-2026-06-002', customer: 'Ms. Suma', date: '2026-06-02', amount: 17472, status: 'Due' },
    { id: 3, invoice: 'AINV-2026-06-003', customer: 'Mr. Karim', date: '2026-06-03', amount: 7031, status: 'Paid' },
    { id: 4, invoice: 'AINV-2026-06-004', customer: 'ABC Agency', date: '2026-06-04', amount: 7031, status: 'Due' },
    { id: 5, invoice: 'AINV-2026-06-005', customer: 'XYZ Ltd.', date: '2026-06-05', amount: 5750, status: 'Paid' },
];

const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

function Sales({ type = 'Sales' }) {
    const [data, setData] = useState(initialData);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ invoice: '', customer: '', date: '', amount: '', status: 'Paid' });

    const filtered = data.filter(d =>
        d.customer.toLowerCase().includes(search.toLowerCase()) ||
        d.invoice.toLowerCase().includes(search.toLowerCase())
    );

    const handleAdd = () => {
        if (!form.invoice || !form.customer || !form.date || !form.amount) return;
        setData([...data, { ...form, id: data.length + 1, amount: parseFloat(form.amount) }]);
        setForm({ invoice: '', customer: '', date: '', amount: '', status: 'Paid' });
        setShowForm(false);
    };

    const handleDelete = (id) => {
        setData(data.filter(d => d.id !== id));
    };

    const icons = { Sales: '🛒', 'Sales Return': '↩️', 'Cancel Sales': '❌', Damage: '⚠️' };

    return (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#1a2035', margin: 0 }}>{icons[type] || '🛒'} {type}</h2>
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
                        <input placeholder="Invoice No" value={form.invoice} onChange={e => setForm({ ...form, invoice: e.target.value })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
                        <input placeholder="Customer Name" value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
                        <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
                        <input placeholder="Amount" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }}>
                            <option>Paid</option>
                            <option>Due</option>
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
                        placeholder="Search by customer or invoice..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px', width: '300px' }}
                    />
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>#</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Invoice</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Customer</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Date</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Amount</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Status</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((row, i) => (
                            <tr key={row.id} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                <td style={{ padding: '10px 12px' }}>{i + 1}</td>
                                <td style={{ padding: '10px 12px', color: '#0d6efd', fontWeight: 'bold' }}>{row.invoice}</td>
                                <td style={{ padding: '10px 12px' }}>{row.customer}</td>
                                <td style={{ padding: '10px 12px' }}>{row.date}</td>
                                <td style={{ padding: '10px 12px', fontWeight: 'bold' }}>৳ {row.amount.toLocaleString()}</td>
                                <td style={{ padding: '10px 12px' }}>
                                    <span style={{
                                        backgroundColor: row.status === 'Paid' ? '#d4edda' : '#ffeeba',
                                        color: row.status === 'Paid' ? '#155724' : '#856404',
                                        padding: '3px 10px', borderRadius: '20px', fontSize: '12px'
                                    }}>
                                        {row.status}
                                    </span>
                                </td>
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

export default Sales;