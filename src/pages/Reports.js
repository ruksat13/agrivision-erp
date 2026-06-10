import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const reportData = {
    'Sales Report': [
        { id: 1, invoice: 'AINV-001', customer: 'Mr. Rahim', date: '2026-06-01', amount: 5555, officer: 'Karim', territory: 'Dhaka', area: 'Mirpur' },
        { id: 2, invoice: 'AINV-002', customer: 'Ms. Suma', date: '2026-06-02', amount: 17472, officer: 'Sadia', territory: 'Chittagong', area: 'Agrabad' },
        { id: 3, invoice: 'AINV-003', customer: 'ABC Agency', date: '2026-06-03', amount: 7031, officer: 'Karim', territory: 'Dhaka', area: 'Gulshan' },
        { id: 4, invoice: 'AINV-004', customer: 'XYZ Ltd.', date: '2026-06-04', amount: 5750, officer: 'Nazmul', territory: 'Sylhet', area: 'Zindabazar' },
    ],
    'Top Customers': [
        { id: 1, customer: 'Ms. Suma', totalPurchase: 87000, totalPaid: 70000, due: 17000 },
        { id: 2, customer: 'ABC Agency', totalPurchase: 65000, totalPaid: 65000, due: 0 },
        { id: 3, customer: 'Mr. Rahim', totalPurchase: 45000, totalPaid: 40000, due: 5000 },
        { id: 4, customer: 'XYZ Ltd.', totalPurchase: 38000, totalPaid: 38000, due: 0 },
    ],
    'Date Wise Invoices': [
        { id: 1, date: '2026-06-01', totalInvoices: 5, totalAmount: 25000, collected: 20000, due: 5000 },
        { id: 2, date: '2026-06-02', totalInvoices: 3, totalAmount: 18000, collected: 18000, due: 0 },
        { id: 3, date: '2026-06-03', totalInvoices: 7, totalAmount: 35000, collected: 28000, due: 7000 },
        { id: 4, date: '2026-06-04', totalInvoices: 4, totalAmount: 22000, collected: 22000, due: 0 },
    ],
};

const chartDataMap = {
    'Officer Wise Sales': [
        { name: 'Karim', Sales: 45000 },
        { name: 'Sadia', Sales: 38000 },
        { name: 'Nazmul', Sales: 52000 },
        { name: 'Rahim', Sales: 29000 },
    ],
    'Territory Wise Sales': [
        { name: 'Dhaka', Sales: 85000 },
        { name: 'Chittagong', Sales: 62000 },
        { name: 'Sylhet', Sales: 41000 },
        { name: 'Rajshahi', Sales: 33000 },
    ],
    'Area Wise Sales': [
        { name: 'Mirpur', Sales: 32000 },
        { name: 'Gulshan', Sales: 28000 },
        { name: 'Agrabad', Sales: 45000 },
        { name: 'Zindabazar', Sales: 38000 },
    ],
    'Officer Wise Collection': [
        { name: 'Karim', Collection: 40000 },
        { name: 'Sadia', Collection: 35000 },
        { name: 'Nazmul', Collection: 48000 },
        { name: 'Rahim', Collection: 25000 },
    ],
    'Territory Wise Collection': [
        { name: 'Dhaka', Collection: 75000 },
        { name: 'Chittagong', Collection: 55000 },
        { name: 'Sylhet', Collection: 38000 },
        { name: 'Rajshahi', Collection: 28000 },
    ],
    'Area Wise Collection': [
        { name: 'Mirpur', Collection: 28000 },
        { name: 'Gulshan', Collection: 24000 },
        { name: 'Agrabad', Collection: 40000 },
        { name: 'Zindabazar', Collection: 32000 },
    ],
};

const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

const icons = {
    'Sales Report': '📊',
    'Product Sales': '🌿',
    'Officer Wise Sales': '👨‍💼',
    'Customer Wise Sales': '🤝',
    'Territory Wise Sales': '🗺️',
    'Area Wise Sales': '📍',
    'Collection': '💵',
    'Officer Wise Collection': '👨‍💼',
    'Customer Wise Collection': '🤝',
    'Territory Wise Collection': '🗺️',
    'Area Wise Collection': '📍',
    'Due Report': '⚠️',
    'Expense Report': '🧾',
    'Sales Return Report': '↩️',
    'Top Customers': '🏆',
    'Date Wise Invoices': '📅',
};

function Reports({ type = 'Sales Report' }) {
    const [fromDate, setFromDate] = useState('2026-06-01');
    const [toDate, setToDate] = useState('2026-06-30');
    const [search, setSearch] = useState('');

    const tableData = reportData[type] || reportData['Sales Report'];
    const chartData = chartDataMap[type] || null;
    const chartKey = type.includes('Collection') ? 'Collection' : 'Sales';

    const filtered = tableData.filter(d =>
        Object.values(d).some(v => v.toString().toLowerCase().includes(search.toLowerCase()))
    );

    const keys = Object.keys(filtered[0] || {}).filter(k => k !== 'id');

    const total = filtered.reduce((sum, row) => sum + (row.amount || row.totalAmount || row.totalPurchase || 0), 0);

    return (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#1a2035', margin: 0 }}>{icons[type] || '📈'} {type}</h2>
                <button
                    onClick={() => window.print()}
                    style={{ backgroundColor: '#6f42c1', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
                >
                    🖨️ Print
                </button>
            </div>

            <div style={{ ...cardStyle, marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', alignItems: 'end' }}>
                    <div>
                        <label style={{ fontSize: '12px', color: '#6c757d', display: 'block', marginBottom: '4px' }}>From Date</label>
                        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px', width: '100%' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', color: '#6c757d', display: 'block', marginBottom: '4px' }}>To Date</label>
                        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px', width: '100%' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', color: '#6c757d', display: 'block', marginBottom: '4px' }}>Search</label>
                        <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px', width: '100%' }} />
                    </div>
                    <button
                        style={{ backgroundColor: '#0d6efd', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                        🔍 Filter
                    </button>
                </div>
            </div>

            {chartData && (
                <div style={{ ...cardStyle, marginBottom: '20px' }}>
                    <h4 style={{ marginTop: 0, color: '#1a2035' }}>📊 {type} Chart</h4>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey={chartKey} fill="#0d6efd" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '13px', color: '#6c757d' }}>Total Records: {filtered.length}</span>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#28a745' }}>
                        Total: ৳ {total.toLocaleString()}
                    </span>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>#</th>
                            {keys.map(k => (
                                <th key={k} style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', textTransform: 'capitalize' }}>{k}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((row, i) => (
                            <tr key={row.id} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                <td style={{ padding: '10px 12px' }}>{i + 1}</td>
                                {keys.map(k => (
                                    <td key={k} style={{ padding: '10px 12px' }}>
                                        {['amount', 'totalAmount', 'totalPurchase', 'totalPaid', 'collected', 'due'].includes(k)
                                            ? `৳ ${Number(row[k]).toLocaleString()}`
                                            : row[k]}
                                    </td>
                                ))}
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

export default Reports;