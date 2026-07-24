import React, { useState } from 'react';

const SUPPLIERS = [
    'Pyramid Printing Pack [AI-000058]',
    'Digital Poly Pack [AI-000008]',
    'M F Fashion [AI-000063]',
    'Unique Coding Solution L, t d [AI-000086]',
    'Mitali Offset Press and Computer [AI-000004]',
    'M/S C P C Trading [AI-000074]',
    'AR Khan and CO. [AI-000015]',
    'Rubel Chemical [AI-000035]',
    'Hasan Polymer Industries [AI-000002]',
];

const INITIAL_ROWS = [
    { id: 140, code: 'AINP-000140', supplier: 'Pyramid Printing Pack [AI-000058]', desc: 'Smart Ziolite CyLinder 10 kg 7 ps', amount: 86205, date: '10-03-2026', status: 'Pending' },
    { id: 139, code: 'AINP-000139', supplier: 'Digital Poly Pack [AI-000008]', desc: 'প্রিন্টেড কস্টেপ 1000 পিচ প্রতি পিচ 330 টাকা মোট টাকা 3,30,000', amount: 330000, date: '07-07-2026', status: 'Pending' },
    { id: 138, code: 'AINP-000138', supplier: 'M F Fashion [AI-000063]', desc: 'টি শার্ট 202 পিচ প্রো টি শার্ট 203 টি শার্ট ডিসারনের গিফট করার জন্য ও ক্যাম্পিন করার জন্য উক্ত টি শার্ট ক্রয় করা হয় ।', amount: 70900, date: '02-07-2026', status: 'Cancel' },
    { id: 137, code: 'AINP-000137', supplier: 'Unique Coding Solution L, t d [AI-000086]', desc: 'M R P মেশিনের মেকাপ ও কালি ক্রয় বাবদ 5 পিচ', amount: 38300, date: '14-06-2026', status: 'Pending' },
    { id: 136, code: 'AINP-000136', supplier: 'Pyramid Printing Pack [AI-000058]', desc: 'শিকড় প্যাকেট নতুন সিলিন্ডার ৪ পিচ তৈরি করা হয়।', amount: 37632, date: '21-05-2026', status: 'Pending' },
    { id: 135, code: 'AINP-000135', supplier: 'Mitali Offset Press and Computer [AI-000004]', desc: 'Advance Crop Solution A4 pad 1000 ps 3800 taka, (ID Card /Lebel) 300 Taka, Total=4100 Taka', amount: 4100, date: '07-06-2026', status: 'Approved' },
    { id: 134, code: 'AINP-000134', supplier: 'M/S C P C Trading [AI-000074]', desc: 'কেপনার ক্রয় এর রেট সংশোধন করার জন্য অতিরিক্ত 64000 টাকা প্রদান করাহয়।', amount: 64000, date: '03-06-2026', status: 'Approved' },
    { id: 133, code: 'AINP-000133', supplier: 'Mitali Offset Press and Computer [AI-000004]', desc: 'পি ডি সি স্টিকার 300 পিচ ক্রয় করা হয়।', amount: 1000, date: '02-06-2026', status: 'Approved' },
    { id: 132, code: 'AINP-000132', supplier: 'AR Khan and CO. [AI-000015]', desc: '11/01/26 জিং এ শ্রী 10000 কেজি ক্রয় এর ভুল সংশোধন', amount: 387000, date: '17-05-2026', status: 'Approved' },
    { id: 131, code: 'AINP-000131', supplier: 'Mitali Offset Press and Computer [AI-000004]', desc: 'আইডি কার্ড ১৬ পিচ ভিজিটিং কার্ড ৩০০০ পিচ জামাল পুর ও যেশর ডিপো অফিসে পাঠানো হয় ।', amount: 17200, date: '07-05-2026', status: 'Approved' },
    { id: 130, code: 'AINP-000130', supplier: 'Rubel Chemical [AI-000035]', desc: 'গ্রীনচার্জ এর কামিকেল ক্রয় করা হয়।', amount: 538000, date: '10-05-2026', status: 'Approved' },
    { id: 129, code: 'AINP-000129', supplier: 'Hasan Polymer Industries [AI-000002]', desc: 'হিসাব সমন্বয় (গাড়ি ভাড়া ও ট্রান্সপোর্ট বাবদ) করাহয়।', amount: 300000, date: '09-05-2026', status: 'Approved' },
];

const statusColor = { Pending: '#0dcaf0', Approved: '#28a745', Cancel: '#dc3545' };

function SupplierPurchase() {
    const [rows, setRows] = useState(INITIAL_ROWS);
    const [view, setView] = useState('list'); // 'list' | 'add'
    const [search, setSearch] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [form, setForm] = useState({ supplier: '', amount: '', date: new Date().toISOString().split('T')[0], desc: '' });
    const [editId, setEditId] = useState(null);
    const [editForm, setEditForm] = useState(null);

    const filtered = rows.filter(r =>
        r.supplier.toLowerCase().includes(search.toLowerCase()) ||
        r.code.toLowerCase().includes(search.toLowerCase()) ||
        r.desc.toLowerCase().includes(search.toLowerCase())
    );

    const handleSave = () => {
        if (!form.supplier || !form.amount || !form.date) return alert('Supplier, Amount and Date are required');
        const newId = Math.max(...rows.map(r => r.id)) + 1;
        setRows(prev => [{
            id: newId,
            code: `AINP-000${newId}`,
            supplier: form.supplier,
            desc: form.desc,
            amount: parseFloat(form.amount) || 0,
            date: new Date(form.date).toLocaleDateString('en-GB').replace(/\//g, '-'),
            status: 'Pending',
        }, ...prev]);
        setForm({ supplier: '', amount: '', date: new Date().toISOString().split('T')[0], desc: '' });
        setView('list');
    };

    const handleApprove = (id) => {
        setRows(prev => prev.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
    };

    const handleDelete = (id) => {
        if (!window.confirm('Delete this purchase record?')) return;
        setRows(prev => prev.filter(r => r.id !== id));
    };

    const handleEditSave = () => {
        setRows(prev => prev.map(r => r.id === editId ? { ...r, ...editForm, amount: parseFloat(editForm.amount) } : r));
        setEditId(null); setEditForm(null);
    };

    if (view === 'add') return (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>
            <div style={{ background: '#fff', borderRadius: 8, padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', maxWidth: 860 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 17, fontWeight: 700, color: '#1a2035', borderBottom: '1px solid #eee', paddingBottom: 12 }}>
                    <span style={{ fontSize: 13 }}>▶</span> Add Purchase
                </div>

                <div style={{ display: 'grid', gap: 18 }}>
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>Supplier <span style={{ color: '#dc3545' }}>*</span></label>
                        <select value={form.supplier} onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #ced4da', borderRadius: 5, fontSize: 14 }}>
                            <option value="">Select Supplier</option>
                            {SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>Amount <span style={{ color: '#dc3545' }}>*</span></label>
                        <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #ced4da', borderRadius: 5, fontSize: 14, boxSizing: 'border-box' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>Date <span style={{ color: '#dc3545' }}>*</span></label>
                        <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #ced4da', borderRadius: 5, fontSize: 14, boxSizing: 'border-box', background: '#f8f9fa' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>Description</label>
                        <textarea value={form.desc} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} rows={3}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #ced4da', borderRadius: 5, fontSize: 14, boxSizing: 'border-box', resize: 'vertical' }} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                    <button onClick={handleSave}
                        style={{ background: '#28a745', color: '#fff', border: 'none', borderRadius: 5, padding: '9px 24px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                        Save
                    </button>
                    <button onClick={() => setView('list')}
                        style={{ background: '#0d6efd', color: '#fff', border: 'none', borderRadius: 5, padding: '9px 24px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>
            <div style={{ marginBottom: 16 }}>
                <h2 style={{ color: '#0d6efd', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    👤 Purchase History
                </h2>
                <p style={{ color: '#6c757d', fontSize: 13, margin: '2px 0 0' }}>Detailed purchase record</p>
            </div>

            {/* Filter Bar */}
            <div style={{ background: '#fff', borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#aaa', fontSize: 13 }}>🔍</span>
                    <input placeholder="Search Key" value={search} onChange={e => setSearch(e.target.value)}
                        style={{ padding: '8px 10px 8px 28px', border: '1px solid #ddd', borderRadius: 5, fontSize: 13, width: 160 }} />
                </div>
                <input type="date" placeholder="Purchase date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                    style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 5, fontSize: 13 }} />
                <select style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 5, fontSize: 13 }}>
                    <option value="">🔍 Select Office</option>
                    <option>Head Office</option>
                    <option>Dhaka Branch</option>
                </select>
                <button style={{ background: '#28a745', color: '#fff', border: 'none', borderRadius: 5, padding: '8px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>✔ Go</button>
                <button onClick={() => { setSearch(''); setDateFilter(''); }} style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: 5, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>✕ Clear</button>
            </div>

            {/* Table */}
            <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: '#1a2035', color: '#fff' }}>
                                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600 }}>No</th>
                                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600 }}>Code</th>
                                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600 }}>Supplier name</th>
                                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600 }}>Description</th>
                                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600 }}>Buy amount</th>
                                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600 }}>Date</th>
                                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        Action
                                        <button onClick={() => setView('add')}
                                            style={{ background: '#28a745', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
                                            🛒 Add
                                        </button>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((row, i) => (
                                <tr key={row.id} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                    <td style={{ padding: '10px 14px' }}>{i + 1}</td>
                                    <td style={{ padding: '10px 14px', color: '#0d6efd', fontWeight: 500 }}>{row.code}</td>
                                    <td style={{ padding: '10px 14px' }}>{row.supplier}</td>
                                    <td style={{ padding: '10px 14px', maxWidth: 300, fontSize: 12, color: '#555' }}>{row.desc}</td>
                                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{row.amount.toLocaleString()}</td>
                                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{row.date}</td>
                                    <td style={{ padding: '10px 14px' }}>
                                        <span style={{ background: statusColor[row.status], color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4 }}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                                        {row.status !== 'Cancel' && row.status !== 'Approved' && (<>
                                            <button onClick={() => { setEditId(row.id); setEditForm({ supplier: row.supplier, amount: row.amount, date: row.date, desc: row.desc }); }}
                                                style={{ background: '#f0932b', color: '#fff', border: 'none', borderRadius: 4, width: 28, height: 28, cursor: 'pointer', fontSize: 13, margin: '0 2px' }}>✎</button>
                                            <button onClick={() => handleApprove(row.id)}
                                                style={{ background: '#28a745', color: '#fff', border: 'none', borderRadius: 4, width: 28, height: 28, cursor: 'pointer', fontSize: 13, margin: '0 2px' }}>✓</button>
                                            <button onClick={() => handleDelete(row.id)}
                                                style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: 4, width: 28, height: 28, cursor: 'pointer', fontSize: 13, margin: '0 2px' }}>🗑</button>
                                        </>)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div style={{ padding: '10px 14px', color: '#888', fontSize: 12, borderTop: '1px solid #eee' }}>
                    Showing {filtered.length} of {rows.length} records
                </div>
            </div>

            {/* Edit Modal */}
            {editId && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => e.target === e.currentTarget && setEditId(null)}>
                    <div style={{ background: '#fff', borderRadius: 8, padding: 24, width: 480, maxWidth: '95%' }}>
                        <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 15, color: '#1a2035' }}>✎ Edit Purchase</h3>
                        {[['Supplier', 'supplier', 'text'], ['Amount', 'amount', 'number'], ['Date', 'date', 'text'], ['Description', 'desc', 'text']].map(([lbl, key, type]) => (
                            <div key={key} style={{ marginBottom: 12 }}>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{lbl}</label>
                                <input type={type} value={editForm[key]} onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))}
                                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 5, fontSize: 13, boxSizing: 'border-box' }} />
                            </div>
                        ))}
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                            <button onClick={() => setEditId(null)} style={{ padding: '8px 18px', border: '1px solid #ddd', borderRadius: 5, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleEditSave} style={{ padding: '8px 18px', background: '#28a745', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 600 }}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SupplierPurchase;
