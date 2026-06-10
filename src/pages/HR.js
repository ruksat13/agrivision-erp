import React, { useState } from 'react';

const initialData = {
    'Daily Visit': [
        { id: 1, officer: 'Karim', customer: 'Mr. Rahim', date: '2026-06-01', location: 'Mirpur', purpose: 'Sales Call', status: 'Completed' },
        { id: 2, officer: 'Sadia', customer: 'ABC Agency', date: '2026-06-02', location: 'Gulshan', purpose: 'Follow Up', status: 'Completed' },
        { id: 3, officer: 'Nazmul', customer: 'XYZ Ltd.', date: '2026-06-03', location: 'Agrabad', purpose: 'New Order', status: 'Pending' },
    ],
    'Attendance': [
        { id: 1, employee: 'Karim Ahmed', date: '2026-06-01', inTime: '09:00', outTime: '18:00', status: 'Present' },
        { id: 2, employee: 'Sadia Islam', date: '2026-06-01', inTime: '09:15', outTime: '18:00', status: 'Present' },
        { id: 3, employee: 'Nazmul Hasan', date: '2026-06-01', inTime: '-', outTime: '-', status: 'Absent' },
        { id: 4, employee: 'Rahim Uddin', date: '2026-06-01', inTime: '09:30', outTime: '18:00', status: 'Late' },
    ],
    'Daily Meter': [
        { id: 1, officer: 'Karim', date: '2026-06-01', target: 50000, achieved: 45000, collection: 40000, visit: 8 },
        { id: 2, officer: 'Sadia', date: '2026-06-01', target: 50000, achieved: 52000, collection: 48000, visit: 10 },
        { id: 3, officer: 'Nazmul', date: '2026-06-01', target: 50000, achieved: 38000, collection: 35000, visit: 7 },
    ],
    'Payroll': [
        { id: 1, employee: 'Karim Ahmed', month: 'June 2026', basicSalary: 25000, bonus: 2000, deduction: 500, netSalary: 26500, status: 'Paid' },
        { id: 2, employee: 'Sadia Islam', month: 'June 2026', basicSalary: 22000, bonus: 1500, deduction: 0, netSalary: 23500, status: 'Paid' },
        { id: 3, employee: 'Nazmul Hasan', month: 'June 2026', basicSalary: 20000, bonus: 1000, deduction: 1000, netSalary: 20000, status: 'Pending' },
    ],
};

const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

const icons = {
    'Daily Visit': '🗺️',
    'Attendance': '📋',
    'Daily Meter': '📊',
    'Payroll': '💰',
};

const statusColors = {
    'Completed': { bg: '#d4edda', color: '#155724' },
    'Present': { bg: '#d4edda', color: '#155724' },
    'Paid': { bg: '#d4edda', color: '#155724' },
    'Pending': { bg: '#ffeeba', color: '#856404' },
    'Absent': { bg: '#f8d7da', color: '#721c24' },
    'Late': { bg: '#fff3cd', color: '#856404' },
};

function HR({ type = 'Daily Visit' }) {
    const [data, setData] = useState(initialData[type] || []);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', date: '', status: 'Pending' });

    const filtered = data.filter(d =>
        Object.values(d).some(v => v.toString().toLowerCase().includes(search.toLowerCase()))
    );

    const handleDelete = (id) => {
        setData(data.filter(d => d.id !== id));
    };

    const keys = Object.keys(filtered[0] || {}).filter(k => k !== 'id');

    const amountKeys = ['target', 'achieved', 'collection', 'basicSalary', 'bonus', 'deduction', 'netSalary'];

    return (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#1a2035', margin: 0 }}>{icons[type] || '👥'} {type}</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="date" defaultValue="2026-06-01"
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
                    <button
                        onClick={() => setShowForm(!showForm)}
                        style={{ backgroundColor: '#0d6efd', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                        + New Entry
                    </button>
                </div>
            </div>

            {type === 'Attendance' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
                    {['Present', 'Absent', 'Late'].map(s => (
                        <div key={s} style={{ ...cardStyle, textAlign: 'center', borderTop: `4px solid ${s === 'Present' ? '#28a745' : s === 'Absent' ? '#dc3545' : '#fd7e14'}` }}>
                            <p style={{ color: '#6c757d', fontSize: '13px', margin: '0 0 8px' }}>{s}</p>
                            <p style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: s === 'Present' ? '#28a745' : s === 'Absent' ? '#dc3545' : '#fd7e14' }}>
                                {data.filter(d => d.status === s).length}
                            </p>
                        </div>
                    ))}
                    <div style={{ ...cardStyle, textAlign: 'center', borderTop: '4px solid #0d6efd' }}>
                        <p style={{ color: '#6c757d', fontSize: '13px', margin: '0 0 8px' }}>Total</p>
                        <p style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#0d6efd' }}>{data.length}</p>
                    </div>
                </div>
            )}

            {type === 'Daily Meter' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                    <div style={{ ...cardStyle, textAlign: 'center', borderTop: '4px solid #0d6efd' }}>
                        <p style={{ color: '#6c757d', fontSize: '13px', margin: '0 0 8px' }}>Total Target</p>
                        <p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#0d6efd' }}>৳ {data.reduce((s, d) => s + d.target, 0).toLocaleString()}</p>
                    </div>
                    <div style={{ ...cardStyle, textAlign: 'center', borderTop: '4px solid #28a745' }}>
                        <p style={{ color: '#6c757d', fontSize: '13px', margin: '0 0 8px' }}>Total Achieved</p>
                        <p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#28a745' }}>৳ {data.reduce((s, d) => s + d.achieved, 0).toLocaleString()}</p>
                    </div>
                    <div style={{ ...cardStyle, textAlign: 'center', borderTop: '4px solid #fd7e14' }}>
                        <p style={{ color: '#6c757d', fontSize: '13px', margin: '0 0 8px' }}>Total Collection</p>
                        <p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#fd7e14' }}>৳ {data.reduce((s, d) => s + d.collection, 0).toLocaleString()}</p>
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
                                        {amountKeys.includes(k) ? `৳ ${Number(row[k]).toLocaleString()}` :
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
                    <p style={{ textAlign: 'center', color: '#adb5bd', padding: '20px' }}>কোনো ডেটা পাওয়া যায়নি</p>
                )}
            </div>
        </div>
    );
}

export default HR;