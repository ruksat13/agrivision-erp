import React, { useState } from 'react';

const salesStatuses = [
    { key: 'Pending', count: null },
    { key: 'Confirm', count: 47 },
    { key: 'Processing', count: null },
    { key: 'Scanning', count: null },
    { key: 'Scanned', count: null },
    { key: 'Picked', count: null },
    { key: 'Shipped', count: null },
    { key: 'Delivered', count: 21121 },
];

const offices = ['All Office', 'Head Office', 'Jessore Office', 'Jamalpur Office'];

const initialData = [
    { id: 1, invoice: 'SAINV-2026-07-0034601', pay: 'Cash', name: 'M/s Kader Traders [SAC-000486]', phone: '01719669336', address: 'Bscic Industrial, Bogura', address2: 'Bulk, Office', date: '22-07-2026', amount: 44200.00, source: 'Admin' },
    { id: 2, invoice: 'SAINV-2026-07-0034596', pay: 'Cash', name: 'M/S Bhai Bhai Traders [SAC-000001]', phone: '01746604015', address: 'Mohasthan Bazar, Shibganj, Bogura', address2: 'Bogura Sadar, Bogura', date: '22-07-2026', amount: 8028.00, source: 'Admin' },
    { id: 3, invoice: 'SAINV-2026-07-0034593', pay: 'Cash', name: 'M/S Bhai Bhai Traders [SAC-000001]', phone: '01746604015', address: 'Mohasthan Bazar, Shibganj, Bogura', address2: 'Bogura Sadar, Bogura', date: '22-07-2026', amount: 47025.00, source: 'Admin' },
    { id: 4, invoice: 'SAINV-2026-07-0034548', pay: 'Cash', name: 'M/s- Sapla Traders [SAC-000480]', phone: '01712015450', address: 'Fotepur manda Naogaon', address2: 'Manda, Rajshahi', date: '21-07-2026', amount: 4014.00, source: 'App' },
    { id: 5, invoice: 'SAINV-2026-07-0034522', pay: 'Cash', name: 'M/s- Alif Traders [SAC-001799]', phone: '01747018954', address: 'Raymajhira Bazar, Bogura Sadar, Bogura', address2: 'Bogura Sadar, Bogura', date: '21-07-2026', amount: 1578.00, source: 'App' },
    { id: 6, invoice: 'SAINV-2026-07-0034490', pay: 'Credit', name: 'M/s All Amin Traders [SAC-001738]', phone: '01324199895', address: 'Aftab gong Bazar Nobab gong Dinajpur', address2: 'Birampur, Fulbari', date: '19-07-2026', amount: 0.00, source: 'Admin' },
    { id: 7, invoice: 'SAINV-2026-07-0034489', pay: 'Cash', name: 'M/s- Orin Traders [SAC-000393]', phone: '01731990014', address: 'Rampur Bazar, Ranishonkoil', address2: 'Ranishonkoil, Pirganj', date: '19-07-2026', amount: 39360.00, source: 'App' },
    { id: 8, invoice: 'SAINV-2026-07-0034488', pay: 'Credit', name: 'M/s- Orin Traders [SAC-000393]', phone: '01731990014', address: 'Rampur Bazar, Ranishonkoil', address2: 'Ranishonkoil, Pirganj', date: '19-07-2026', amount: 15456.00, source: 'App' },
    { id: 9, invoice: 'SAINV-2026-07-0034487', pay: 'Cash', name: 'M/s-Jahangir Traders [SAC-000404]', phone: '01712739045', address: 'Adhardighi Bazar, Baliadangi Thakurgaon', address2: 'Baliadangi, Panchagarh', date: '19-07-2026', amount: 6035.00, source: 'App' },
    { id: 10, invoice: 'SAINV-2026-07-0034486', pay: 'Credit', name: 'M/s- Jai Shri Traders [SAC-000946]', phone: '01773627813', address: 'Lahiri Hat Baliadangi Thakurgaon', address2: 'Baliadangi, Panchagarh', date: '19-07-2026', amount: 5280.00, source: 'App' },
];

const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

const inputStyle = {
    padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px',
};

function Badge({ text, color }) {
    return (
        <span style={{ background: color, color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', display: 'inline-block' }}>
            {text}
        </span>
    );
}

function ActionBtn({ bg, children, title }) {
    return (
        <button title={title} style={{ background: bg, color: 'white', border: 'none', borderRadius: '4px', width: '26px', height: '26px', cursor: 'pointer', fontSize: '12px', margin: '0 1px' }}>
            {children}
        </button>
    );
}

function Sales({ type = 'Sales' }) {
    const [data] = useState(initialData);
    const [activeStatus, setActiveStatus] = useState('Confirm');
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [discount, setDiscount] = useState('');
    const [office, setOffice] = useState('');
    const [date, setDate] = useState('');

    const filtered = data.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.invoice.toLowerCase().includes(search.toLowerCase())
    );

    const handleClear = () => {
        setSearch(''); setStatus(''); setDiscount(''); setOffice(''); setDate('');
    };

    const icons = { Sales: '🛒', 'Sales Return': '↩️', 'Cancel Sales': '❌', Damage: '⚠️' };

    return (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>

            {/* Header */}
            <div style={{ marginBottom: '16px' }}>
                <h2 style={{ color: '#0d6efd', margin: 0 }}>{icons[type] || '🛒'} {type}</h2>
                <p style={{ color: '#6c757d', fontSize: '13px', margin: '2px 0 0' }}>Detailed sales record</p>
            </div>

            {/* Status Tabs */}
            <div style={{ ...cardStyle, padding: 0, marginBottom: '16px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {salesStatuses.map((s, i) => {
                        const active = activeStatus === s.key;
                        return (
                            <div key={s.key}
                                onClick={() => setActiveStatus(s.key)}
                                style={{
                                    flex: '1 1 auto', minWidth: '110px', textAlign: 'center', cursor: 'pointer',
                                    padding: '14px 10px', fontSize: '13px', fontWeight: 'bold',
                                    color: 'white',
                                    background: active ? 'linear-gradient(135deg, #f5b544, #f0932b)' : '#243050',
                                    borderRight: i < salesStatuses.length - 1 ? '1px solid #1a2035' : 'none',
                                }}>
                                {s.key}
                                {s.count != null && (
                                    <span style={{ background: active ? '#dc3545' : '#0dcaf0', color: 'white', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', marginLeft: '6px' }}>
                                        {s.count}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Filter Bar */}
            <div style={{ ...cardStyle, marginBottom: '16px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                    <input placeholder="🔍 Search Key" value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, flex: '1 1 180px' }} />
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inputStyle, flex: '1 1 140px' }} />
                    <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inputStyle, flex: '1 1 140px' }}>
                        <option value="">Select Status</option>
                        {salesStatuses.map(s => <option key={s.key}>{s.key}</option>)}
                    </select>
                    <select value={discount} onChange={e => setDiscount(e.target.value)} style={{ ...inputStyle, flex: '1 1 140px' }}>
                        <option value="">Select Discount</option>
                        <option>Yes</option>
                    </select>
                    <select value={office} onChange={e => setOffice(e.target.value)} style={{ ...inputStyle, flex: '1 1 140px' }}>
                        <option value="">Select Office</option>
                        {offices.map(o => <option key={o}>{o}</option>)}
                    </select>
                    <button style={{ background: '#28a745', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>✓ Go</button>
                    <button onClick={handleClear} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>✕ Clear</button>
                </div>
            </div>

            {/* Table */}
            <div style={{ ...cardStyle, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '900px' }}>
                    <thead>
                        <tr style={{ background: '#1a2035', color: 'white' }}>
                            <th style={{ padding: '12px', textAlign: 'left' }}>No</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Invoise</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Address</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                            <th style={{ padding: '12px', textAlign: 'right' }}>Amount</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Source</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Change Status</th>
                            <th style={{ padding: '12px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                                Action <button style={{ background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer', marginLeft: '4px' }}>+ Add</button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((row, i) => (
                            <tr key={row.id} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                <td style={{ padding: '10px 12px' }}>{i + 1}</td>
                                <td style={{ padding: '10px 12px' }}>
                                    <div style={{ color: '#0d6efd', fontWeight: 'bold', marginBottom: '4px' }}>{row.invoice}</div>
                                    <Badge text={row.pay} color={row.pay === 'Cash' ? '#28a745' : '#0d6efd'} />
                                </td>
                                <td style={{ padding: '10px 12px' }}>
                                    <div style={{ fontWeight: 'bold', color: '#1a2035' }}>{row.name}</div>
                                    <div style={{ color: '#6c757d', fontSize: '12px' }}>{row.phone}</div>
                                </td>
                                <td style={{ padding: '10px 12px', color: '#495057' }}>
                                    <div>{row.address}</div>
                                    <div style={{ color: '#adb5bd', fontSize: '12px' }}>{row.address2}</div>
                                </td>
                                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{row.date}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 'bold' }}>{row.amount.toFixed(2)}</td>
                                <td style={{ padding: '10px 12px' }}>
                                    <Badge text={row.source} color={row.source === 'Admin' ? '#28a745' : '#0dcaf0'} />
                                </td>
                                <td style={{ padding: '10px 12px' }}>
                                    <select style={{ ...inputStyle, fontSize: '12px', padding: '6px 8px' }}>
                                        <option>Select status</option>
                                        {salesStatuses.map(s => <option key={s.key}>{s.key}</option>)}
                                    </select>
                                </td>
                                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                                    <ActionBtn bg="#0d6efd" title="Info">ℹ</ActionBtn>
                                    <ActionBtn bg="#f0932b" title="Edit">✎</ActionBtn>
                                    <ActionBtn bg="#dc3545" title="Delete">🗑</ActionBtn>
                                    <ActionBtn bg="#28a745" title="Confirm">✓</ActionBtn>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filtered.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#adb5bd', padding: '20px' }}>No data found</p>
                )}

                {/* Pagination */}
                <div style={{ display: 'flex', gap: '4px', marginTop: '16px' }}>
                    {['1', '2', '3', '›', 'Last »'].map((p, i) => (
                        <button key={i} style={{
                            padding: '6px 12px', fontSize: '13px', cursor: 'pointer',
                            border: '1px solid #dee2e6', borderRadius: '4px',
                            background: p === '1' ? '#0d6efd' : 'white',
                            color: p === '1' ? 'white' : '#495057',
                        }}>{p}</button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Sales;
