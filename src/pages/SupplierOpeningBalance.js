import React, { useState } from 'react';

const today = new Date().toISOString().split('T')[0];
const thS = { padding: '10px 12px', color: 'white', fontWeight: '600', fontSize: '13px', textAlign: 'left' };
const tdS = { padding: '9px 12px', fontSize: '12px', color: '#333', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' };

const Badge = ({ color, children }) => (
    <span style={{ background: color, color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>{children}</span>
);

const initialRecords = [
    { id: 1, name: 'M/s Jakirul Islam', code: 'AIS-000085', type: 'Credit', amount: '2,59,337.00', date: '01-03-2026', status: 'Approved', note: '', posting: 'Md. Shafirul Islam\n01-03-2026 15:54PM' },
    { id: 2, name: 'Nitol Motors (TATA)', code: 'AIS-000084', type: 'Credit', amount: '88,431.00', date: '01-03-2026', status: 'Approved', note: 'account adjustment entry', posting: 'Md. Shafirul Islam\n01-03-2026 15:32PM' },
    { id: 3, name: 'U.s Agro', code: 'AIS-000080', type: 'Credit', amount: '19,34,000.00', date: '28-02-2026', status: 'Approved', note: 'account adjustment entry', posting: 'Md. Shafirul Islam\n28-02-2026 16:34PM' },
    { id: 4, name: 'Palash', code: 'AIS-000029', type: 'Credit', amount: '5,00,000.00', date: '28-02-2026', status: 'Approved', note: 'account adjustment entry', posting: 'Md. Shafirul Islam\n28-02-2026 14:03PM' },
    { id: 5, name: 'Uttara Motors Saiful', code: 'AIS-000052', type: 'Credit', amount: '28,63,400.00', date: '13-11-2024', status: 'Approved', note: 'উত্তরা সাইফুল ভাই এর কাছে থেকে মাজদা গাড়ি দাম বাবদ মোট 2863400', posting: 'Md. Abul Kalam\n20-12-2025 15:42PM' },
    { id: 6, name: 'Runner Motor Eicher Coverd Van', code: 'AIS-000047', type: 'Credit', amount: '1,13,90,300.00', date: '11-10-2025', status: 'Approved', note: 'আইছার ৪ টা গাড়ির দাম যথাক্রমে ০১ নং 3059572 দ্বিতীয় টা 2957726 তৃতীয় টা 2152502 চতুর্থ টা 3220500', posting: 'Md. Abul Kalam\n20-12-2025 14:36PM' },
    { id: 7, name: 'Agrivision International (BRAC)', code: 'AIS-000041', type: 'Credit', amount: '7,41,91,510.00', date: '22-03-2025', status: 'Approved', note: 'Opening', posting: 'Md. Rakib Hasan\n22-03-2025 12:09PM' },
    { id: 8, name: 'Raha Trade International', code: 'AIS-000044', type: 'Credit', amount: '1,53,330.00', date: '01-02-2024', status: 'Approved', note: 'Opening', posting: 'Md. Rakib Hasan\n22-06-2024 12:46PM' },
    { id: 9, name: 'Emkay Enterprise Limited', code: 'AIS-000043', type: 'Debit', amount: '1,00,000.00', date: '15-02-2024', status: 'Approved', note: 'Advance Payment for Printer', posting: 'Md. Rakib Hasan\n06-06-2024 14:28PM' },
    { id: 10, name: 'Emkay Enterprise Limited', code: 'AIS-000043', type: 'Credit', amount: '1,00,000.00', date: '15-04-2024', status: 'Cancel', note: 'Advance Payment for Printer', posting: 'Md. Rakib Hasan\n06-06-2024 14:27PM' },
    { id: 11, name: 'Md. Nazrul Islam', code: 'AIS-000039', type: 'Credit', amount: '35,00,000.00', date: '14-03-2024', status: 'Approved', note: '', posting: 'Md. Abdul Mohaimenum\n14-03-2024 22:26PM' },
    { id: 12, name: 'Md. Nafizur Rahman', code: 'AIS-000038', type: 'Credit', amount: '10,00,000.00', date: '14-03-2024', status: 'Approved', note: '', posting: 'Md. Abdul Mohaimenum\n14-03-2024 22:25PM' },
    { id: 13, name: 'Rana Motors', code: 'AIS-000032', type: 'Credit', amount: '5,47,000.00', date: '01-02-2024', status: 'Approved', note: '', posting: 'Md. Abul Kalam\n13-03-2024 17:27PM' },
    { id: 14, name: 'Rangs Motors Ltd', code: 'AIS-000033', type: 'Credit', amount: '8,62,000.00', date: '20-02-2024', status: 'Approved', note: '', posting: 'Md. Abul Kalam\n13-03-2024 17:18PM' },
    { id: 15, name: 'Brac Bank Ltd', code: 'AIS-000036', type: 'Credit', amount: '1,94,57,768.00', date: '12-03-2024', status: 'Approved', note: '', posting: 'Md. Abdul Mohaimenum\n12-03-2024 17:05PM' },
    { id: 16, name: 'I D L C', code: 'AIS-000037', type: 'Credit', amount: '33,62,544.00', date: '01-03-2024', status: 'Approved', note: '', posting: 'Md. Abdul Mohaimenum\n12-03-2024 17:04PM' },
    { id: 17, name: 'Lanka Bangla Bank ltd', code: 'AIS-000034', type: 'Credit', amount: '95,92,760.00', date: '01-02-2024', status: 'Approved', note: '', posting: 'Md. Abdul Mohaimenum\n12-03-2024 16:57PM' },
    { id: 18, name: 'Need Agro Industries', code: 'AIS-000021', type: 'Credit', amount: '17,28,750.00', date: '01-02-2024', status: 'Approved', note: 'Need Agro Industries', posting: 'Md. Rakib Hasan\n06-03-2024 23:40PM' },
];

const supplierOptions = ['M/s Jakirul Islam', 'Nitol Motors (TATA)', 'U.s Agro', 'Palash', 'Uttara Motors Saiful', 'Runner Motor Eicher Coverd Van', 'Raha Trade International', 'Emkay Enterprise Limited', 'Md. Nazrul Islam', 'Rana Motors', 'Brac Bank Ltd', 'Lanka Bangla Bank ltd', 'Need Agro Industries'];
const paymentTypes = ['Cash', 'bKash', 'Nagad', 'Bank Transfer', 'Cheque', 'Credit'];

function AddForm({ onBack }) {
    const [form, setForm] = useState({ supplier: '', paymentType: '', amount: '', date: today, note: '' });
    const inp = { width: '100%', padding: '9px 12px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' };

    return (
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                Add Supplier Opening Balance
            </div>
            <div style={{ padding: '24px 32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '5px' }}>Supplier <span style={{ color: '#dc3545' }}>*</span></label>
                        <select value={form.supplier} onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))} style={inp}>
                            <option value="">Select Supplier</option>
                            {supplierOptions.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '5px' }}>Payment Type <span style={{ color: '#dc3545' }}>*</span></label>
                        <select value={form.paymentType} onChange={e => setForm(p => ({ ...p, paymentType: e.target.value }))} style={inp}>
                            <option value="">🔍 Please select</option>
                            {paymentTypes.map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '5px' }}>Amount <span style={{ color: '#dc3545' }}>*</span></label>
                        <input placeholder="Enter Amount" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} style={inp} />
                    </div>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '5px' }}>Date <span style={{ color: '#dc3545' }}>*</span></label>
                        <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={{ ...inp, background: '#f8f9fa' }} />
                    </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '5px' }}>Note</label>
                    <textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                        style={{ ...inp, height: '80px', resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={onBack} style={{ padding: '8px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Back</button>
                    <button style={{ padding: '8px 24px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Save</button>
                </div>
            </div>
        </div>
    );
}

function SupplierOpeningBalance() {
    const [view, setView] = useState('list');
    const [records] = useState(initialRecords);

    const emptyF = { search: '', date: '' };
    const [draft, setDraft] = useState(emptyF);
    const [applied, setApplied] = useState(emptyF);
    const handleGo = () => setApplied(draft);
    const handleClear = () => { setDraft(emptyF); setApplied(emptyF); };
    const toISO = (d) => d.split('-').reverse().join('-');

    const filtered = records.filter(r => {
        if (applied.search) {
            const k = applied.search.toLowerCase();
            if (!r.name.toLowerCase().includes(k) && !r.code.toLowerCase().includes(k) && !r.note.toLowerCase().includes(k)) return false;
        }
        if (applied.date && toISO(r.date) !== applied.date) return false;
        return true;
    });

    if (view === 'add') return <AddForm onBack={() => setView('list')} />;

    return (
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                &gt; Supplier Opening Balance
            </div>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input placeholder="Search" value={draft.search} onChange={e => setDraft(p => ({ ...p, search: e.target.value }))} style={{ padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', width: '160px' }} />
                <input type="date" value={draft.date} onChange={e => setDraft(p => ({ ...p, date: e.target.value }))} style={{ padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px' }} />
                <button onClick={handleGo} style={{ padding: '7px 18px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Go</button>
                <button onClick={handleClear} style={{ padding: '7px 18px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Clear</button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#1a2035' }}>
                            <th style={{ ...thS, width: '40px', textAlign: 'center' }}>#</th>
                            <th style={thS}>Name</th>
                            <th style={thS}>Type</th>
                            <th style={{ ...thS, textAlign: 'right' }}>Amount</th>
                            <th style={thS}>Date</th>
                            <th style={thS}>Status</th>
                            <th style={thS}>Note</th>
                            <th style={thS}>Posting</th>
                            <th style={{ ...thS, textAlign: 'right' }}>
                                Action&nbsp;
                                <button onClick={() => setView('add')} style={{ padding: '3px 10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>🌿 Add</button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={9} style={{ ...tdS, textAlign: 'center', padding: '30px', color: '#6c757d' }}>No data found</td></tr>
                        ) : filtered.map((r, i) => (
                            <tr key={r.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                <td style={{ ...tdS, textAlign: 'center' }}>{i + 1}</td>
                                <td style={tdS}>
                                    <div style={{ fontWeight: '600', color: '#1a2035' }}>{r.name}</div>
                                    <div style={{ color: '#6c757d', fontSize: '11px' }}>[{r.code}]</div>
                                </td>
                                <td style={tdS}>
                                    <Badge color={r.type === 'Debit' ? '#fd7e14' : '#28a745'}>{r.type}</Badge>
                                </td>
                                <td style={{ ...tdS, textAlign: 'right', fontWeight: '600' }}>{r.amount}</td>
                                <td style={{ ...tdS, whiteSpace: 'nowrap' }}>{r.date}</td>
                                <td style={tdS}>
                                    <Badge color={r.status === 'Approved' ? '#28a745' : r.status === 'Cancel' ? '#dc3545' : '#0dcaf0'}>{r.status}</Badge>
                                </td>
                                <td style={{ ...tdS, fontSize: '11px', maxWidth: '200px' }}>{r.note}</td>
                                <td style={{ ...tdS, fontSize: '11px', color: '#6c757d', whiteSpace: 'pre-line' }}>{r.posting}</td>
                                <td style={tdS}></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default SupplierOpeningBalance;
