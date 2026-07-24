import React, { useState } from 'react';

const today = new Date().toISOString().split('T')[0];
const thS = { padding: '10px 12px', color: 'white', fontWeight: '600', fontSize: '13px', textAlign: 'left', whiteSpace: 'nowrap' };
const tdS = { padding: '9px 12px', fontSize: '12px', color: '#333', borderBottom: '1px solid #f0f0f0', verticalAlign: 'top' };

const Badge = ({ color, children }) => (
    <span style={{ background: color, color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '600', display: 'inline-block' }}>{children}</span>
);

const IBtn = ({ bg, onClick, title, children }) => (
    <button onClick={onClick} title={title} style={{ padding: '4px 8px', background: bg, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', marginRight: '3px' }}>{children}</button>
);

const typeColors = {
    Yearly: '#28a745',
    Amount: '#0d6efd',
    Percentage: '#20c997',
    Product: '#fd7e14',
    Travel: '#0d6efd',
    Invoice: '#6f42c1',
};

// Commission records — Type = [category, method]
const initialRecords = [
    {
        id: 1, no: 1, name: 'M/s-Aleya Traders', code: 'AIC-000112', recordCode: 'AICO-017332',
        types: ['Yearly', 'Amount'],
        detail: { kind: 'invoices', invoices: ['AINV-2025-12-0023287', 'AINV-2026-02-0026562', 'AINV-2026-03-0029143', 'AINV-2026-08-0033175'], total: '4,02,647.00' },
        amount: '59,466.40', date: '23-07-2026', note: '',
        status: 'Pending', posting: 'Md. Abul Kalam\n23-07-2026 15:04PM',
    },
    {
        id: 2, no: 2, name: 'M/s-Solaiman Traders', code: 'AIC-000407', recordCode: 'AICO-017331',
        types: ['Yearly', 'Percentage'],
        detail: { kind: 'invoices', invoices: ['AINV-2025-10-0018602', 'AINV-2026-01-0025610'], total: '84,427.00', percent: '13.00%' },
        amount: '10,975.51', date: '23-07-2026', note: '',
        status: 'Pending', posting: 'Md. Abul Kalam\n23-07-2026 19:02PM',
    },
    {
        id: 3, no: 3, name: 'M/s-J N Traders', code: 'AIC-000111', recordCode: 'AICO-017330',
        types: ['Product', 'Amount'],
        detail: { kind: 'product', product: 'Primithy 50 Ec 50 Ml', pcode: 'AI-000434' },
        amount: '8,000.00', date: '23-07-2026', note: 'ইনভয়েস নং ২৭০৪৪ এর বিপরীতে প্রোডাক্ট কমিশন প্রদান করা হয়।',
        status: 'Pending', posting: 'Md. Abul Kalam\n23-07-2026 14:57PM',
    },
    {
        id: 4, no: 4, name: 'M/s-J N Traders', code: 'AIC-000111', recordCode: 'AICO-017329',
        types: ['Travel', 'Amount'],
        detail: { kind: 'year', year: '2026' },
        amount: '72,684.00', date: '23-07-2026', note: 'ইনভয়েস নং ১৬৮৮৮, ২৭০৪৪, ৩১৪২৯, ২৯৫৬১ মোট ৪,৮৪,৫৬০ টাকা বিক্রির ১৫% ট্রাভেল কমিশন প্রদান।',
        status: 'Pending', posting: 'Md. Abul Kalam\n23-07-2026 14:52PM',
    },
    {
        id: 5, no: 5, name: 'M/s- sumaiya Traders', code: 'AIC-000225', recordCode: 'AICO-017328',
        types: ['Product', 'Amount'],
        detail: { kind: 'product', product: 'Green Charge 1 Ltr', pcode: 'AI-000049' },
        amount: '8,000.00', date: '23-07-2026', note: 'ইনভয়েস নং ২৬৪১৮ এর গ্রীন চার্জ প্রোডাক্ট কমিশন প্রদান করা হয়।',
        status: 'Pending', posting: 'Md. Abul Kalam\n23-07-2026 12:58PM',
    },
    {
        id: 6, no: 6, name: 'M/s-Nazim Enterprise', code: 'AIC-000924', recordCode: 'AICO-017264',
        types: ['Yearly', 'Amount'],
        detail: { kind: 'invoices', invoices: ['AINV-2025-09-0015754', 'AINV-2025-10-0019913', 'AINV-2025-11-0021445', 'AINV-2025-11-0021692', 'AINV-2025-12-0024677', 'AINV-2026-03-0029061'], total: '8,61,932.48' },
        amount: '99,244.48', date: '20-07-2026', note: 'বছরের মোট বিক্রির উপর ১৫% কমিশন প্রদান।',
        status: 'Pending', posting: 'Md. Abul Kalam\n20-07-2026 14:59PM',
    },
    {
        id: 7, no: 7, name: 'M/s-Mim Traders', code: 'AIC-000982', recordCode: 'AICO-017263',
        types: ['Yearly', 'Percentage'],
        detail: { kind: 'invoices', invoices: ['AINV-2025-10-0018642', 'AINV-2025-11-0021107', 'AINV-2026-02-0027228', 'AINV-2026-03-0029056', 'AINV-2026-03-0030227', 'AINV-2026-04-0030665'], total: '4,22,016.48', percent: '15.00%' },
        amount: '63,302.47', date: '20-07-2026', note: '',
        status: 'Pending', posting: 'Md. Abul Kalam\n20-07-2026 14:52PM',
    },
    {
        id: 8, no: 8, name: 'M/s- Rakib Traders', code: 'AIC-000231', recordCode: 'AICO-017262',
        types: ['Product', 'Amount'],
        detail: { kind: 'product', product: 'Green Charge 1 Ltr', pcode: 'AI-000049' },
        amount: '60,000.08', date: '20-07-2026', note: 'ইনভয়েস নং ২২১৯২ এর বিপরীতে প্রোডাক্ট কমিশন ৬০০ টাকা করে প্রদান।',
        status: 'Pending', posting: 'Md. Abul Kalam\n20-07-2026 14:29PM',
    },
    {
        id: 9, no: 9, name: 'M/s- Rakib Traders', code: 'AIC-000231', recordCode: 'AICO-017261',
        types: ['Yearly', 'Percentage'],
        detail: { kind: 'invoices', invoices: ['AINV-2025-11-0021103', 'AINV-2026-03-0029105'], total: '3,54,148.00', percent: '15.00%' },
        amount: '53,122.20', date: '20-07-2026', note: '',
        status: 'Pending', posting: 'Md. Abul Kalam\n20-07-2026 14:27PM',
    },
    {
        id: 10, no: 10, name: 'M/S Nabil Traders', code: 'AIC-000695', recordCode: 'AICO-017260',
        types: ['Invoice', 'Percentage'],
        detail: { kind: 'invoices', invoices: ['AINV-2026-05-0032826'], total: '1,74,496.00', percent: '24.00%' },
        amount: '41,870.40', date: '20-07-2026', note: 'একক ইনভয়েসের উপর ২৪% কমিশন প্রদান করা হয়।',
        status: 'Pending', posting: 'Md. Abul Kalam\n20-07-2026 14:24PM',
    },
];

const typeOptions = ['Yearly Amount', 'Yearly Percentage', 'Product Amount', 'Travel Amount', 'Invoice Percentage'];
const officeOptions = ['Head Office', 'Bogura Office', 'Naogaon Office'];
const customerOptions = ['M/s-Aleya Traders', 'M/s-Solaiman Traders', 'M/s-J N Traders', 'M/s- sumaiya Traders', 'M/s-Nazim Enterprise'];

function AddForm({ onBack }) {
    const [form, setForm] = useState({ customer: '', type: '', amount: '', percent: '', date: today, note: '' });
    const inp = { width: '100%', padding: '9px 12px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' };

    return (
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                Add Customer Commission
            </div>
            <div style={{ padding: '24px 32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '5px' }}>Customer <span style={{ color: '#dc3545' }}>*</span></label>
                        <select value={form.customer} onChange={e => setForm(p => ({ ...p, customer: e.target.value }))} style={inp}>
                            <option value="">Select Customer</option>
                            {customerOptions.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '5px' }}>Commission Type <span style={{ color: '#dc3545' }}>*</span></label>
                        <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={inp}>
                            <option value="">🔍 Please select</option>
                            {typeOptions.map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '5px' }}>Date <span style={{ color: '#dc3545' }}>*</span></label>
                        <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={{ ...inp, background: '#f8f9fa' }} />
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '5px' }}>Amount <span style={{ color: '#dc3545' }}>*</span></label>
                        <input placeholder="Enter Amount" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} style={inp} />
                    </div>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '5px' }}>Percentage (%)</label>
                        <input placeholder="Enter Percentage" value={form.percent} onChange={e => setForm(p => ({ ...p, percent: e.target.value }))} style={inp} />
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

function CustomerCommission() {
    const [view, setView] = useState('list');
    const [records, setRecords] = useState(initialRecords);
    const [open, setOpen] = useState(true);

    const handleApprove = (id) => setRecords(prev => prev.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
    const handleDelete = (id) => { if (window.confirm('Delete this commission?')) setRecords(prev => prev.filter(r => r.id !== id)); };

    if (view === 'add') return <AddForm onBack={() => setView('list')} />;

    const renderDetail = (d) => {
        if (d.kind === 'invoices') {
            return (
                <div>
                    {d.invoices.map(inv => (
                        <div key={inv} style={{ marginBottom: '2px' }}>
                            <span style={{ color: '#0d6efd', fontWeight: '600', fontSize: '11px', marginRight: '5px' }}>{inv}</span>
                            <Badge color="#0d6efd">Credit</Badge>
                        </div>
                    ))}
                    <div style={{ fontWeight: '700', color: '#1a2035', marginTop: '4px' }}>{d.total}</div>
                    {d.percent && <div style={{ fontWeight: '700', color: '#20c997' }}>{d.percent}</div>}
                </div>
            );
        }
        if (d.kind === 'product') {
            return (
                <div>
                    <div style={{ fontWeight: '600' }}>{d.product}</div>
                    <div style={{ color: '#6c757d', fontSize: '11px' }}>{d.pcode}</div>
                </div>
            );
        }
        if (d.kind === 'year') {
            return <div style={{ fontWeight: '600' }}>{d.year}</div>;
        }
        return null;
    };

    return (
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div onClick={() => setOpen(!open)} style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: '700', fontSize: '14px', color: '#333', cursor: 'pointer', userSelect: 'none' }}>
                {open ? '∨' : '>'} Commission
            </div>

            {open && (
                <>
                    {/* Filter bar */}
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <input placeholder="🔍 Search Key" style={{ padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', width: '150px' }} />
                        <input placeholder="🔍 Invoice No" style={{ padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', width: '140px' }} />
                        <input type="date" style={{ padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px' }} />
                        <select style={{ padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', minWidth: '130px' }}>
                            <option>🔍 Select Type</option>
                            {typeOptions.map(t => <option key={t}>{t}</option>)}
                        </select>
                        <select style={{ padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', minWidth: '130px' }}>
                            <option>🔍 Select Office</option>
                            {officeOptions.map(o => <option key={o}>{o}</option>)}
                        </select>
                        <button style={{ padding: '7px 18px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Go</button>
                        <button style={{ padding: '7px 18px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Clear</button>
                    </div>

                    {/* Table */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#1a2035' }}>
                                    <th style={{ ...thS, width: '36px', textAlign: 'center' }}>#</th>
                                    <th style={thS}>Customer</th>
                                    <th style={thS}>Type</th>
                                    <th style={thS}>Invoice | Product | Year</th>
                                    <th style={{ ...thS, textAlign: 'right' }}>Amount</th>
                                    <th style={thS}>Date</th>
                                    <th style={thS}>Note</th>
                                    <th style={thS}>Status</th>
                                    <th style={thS}>Posting</th>
                                    <th style={{ ...thS, textAlign: 'right' }}>
                                        Action&nbsp;
                                        <button onClick={() => setView('add')} style={{ padding: '3px 10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>🌿 Add</button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((r, i) => (
                                    <tr key={r.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                        <td style={{ ...tdS, textAlign: 'center' }}>{r.no}</td>
                                        <td style={tdS}>
                                            <div style={{ fontWeight: '600', color: '#1a2035' }}>{r.name} [{r.code}]</div>
                                            <div style={{ color: '#6c757d', fontSize: '11px' }}>{r.recordCode}</div>
                                        </td>
                                        <td style={tdS}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
                                                {r.types.map(t => <Badge key={t} color={typeColors[t] || '#6c757d'}>{t}</Badge>)}
                                            </div>
                                        </td>
                                        <td style={tdS}>{renderDetail(r.detail)}</td>
                                        <td style={{ ...tdS, textAlign: 'right', fontWeight: '600' }}>{r.amount}</td>
                                        <td style={{ ...tdS, whiteSpace: 'nowrap' }}>{r.date}</td>
                                        <td style={{ ...tdS, fontSize: '11px', maxWidth: '200px' }}>{r.note}</td>
                                        <td style={tdS}>
                                            <Badge color={r.status === 'Approved' ? '#28a745' : '#0dcaf0'}>{r.status}</Badge>
                                        </td>
                                        <td style={{ ...tdS, fontSize: '11px', color: '#6c757d', whiteSpace: 'pre-line' }}>{r.posting}</td>
                                        <td style={{ ...tdS, whiteSpace: 'nowrap' }}>
                                            {r.status === 'Pending' && (
                                                <>
                                                    <IBtn bg="#fd7e14" onClick={() => setView('add')} title="Edit">✎</IBtn>
                                                    <IBtn bg="#0d6efd" onClick={() => handleApprove(r.id)} title="Approve">✔</IBtn>
                                                    <IBtn bg="#dc3545" onClick={() => handleDelete(r.id)} title="Delete">🗑</IBtn>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}

export default CustomerCommission;
