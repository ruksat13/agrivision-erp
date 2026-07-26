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

const typeColors = { Yearly: '#28a745', Amount: '#0d6efd', Percentage: '#20c997', Product: '#fd7e14', Purchase: '#6f42c1' };
const toISO = (d) => d.split('-').reverse().join('-');

const initialRecords = [
    {
        id: 1, no: 1, name: 'Agro Dragon CO. Ltd.', code: 'AIS-000025', recordCode: 'AISC-008112',
        types: ['Yearly', 'Amount'],
        detail: { kind: 'purchases', purchases: ['AINP-2025-12-0002287', 'AINP-2026-02-0002562', 'AINP-2026-03-0003143'], total: '52,40,647.00' },
        amount: '3,14,438.00', date: '23-07-2026', note: 'বছরের মোট ক্রয়ের উপর কমিশন প্রদান।',
        status: 'Pending', posting: 'Md. Abul Kalam\n23-07-2026 15:04PM',
    },
    {
        id: 2, no: 2, name: 'AGROIRIS (BD) LTD (RAINBOW)', code: 'AIS-000056', recordCode: 'AISC-008111',
        types: ['Yearly', 'Percentage'],
        detail: { kind: 'purchases', purchases: ['AINP-2025-10-0001602', 'AINP-2026-01-0002610'], total: '18,64,427.00', percent: '5.00%' },
        amount: '93,221.35', date: '23-07-2026', note: '',
        status: 'Pending', posting: 'Md. Abul Kalam\n23-07-2026 19:02PM',
    },
    {
        id: 3, no: 3, name: 'CANARY AGRO CHEMICALS', code: 'AIS-000024', recordCode: 'AISC-008110',
        types: ['Product', 'Amount'],
        detail: { kind: 'product', product: 'Primithy 50 Ec 50 Ml', pcode: 'AI-000434' },
        amount: '18,000.00', date: '23-07-2026', note: 'নির্দিষ্ট প্রোডাক্ট ক্রয়ের জন্য কমিশন।',
        status: 'Pending', posting: 'Md. Abul Kalam\n23-07-2026 14:57PM',
    },
    {
        id: 4, no: 4, name: 'Digital Poly Pack', code: 'AIS-000008', recordCode: 'AISC-008109',
        types: ['Purchase', 'Percentage'],
        detail: { kind: 'purchases', purchases: ['AINP-2026-05-0004826'], total: '9,74,496.00', percent: '3.00%' },
        amount: '29,234.88', date: '20-07-2026', note: 'একক ক্রয়ের উপর ৩% কমিশন প্রদান।',
        status: 'Pending', posting: 'Md. Abul Kalam\n20-07-2026 14:24PM',
    },
    {
        id: 5, no: 5, name: 'Nanjing Ecofarm Biotechnology', code: 'AIS-000053', recordCode: 'AISC-008108',
        types: ['Yearly', 'Amount'],
        detail: { kind: 'purchases', purchases: ['AINP-2025-09-0001754', 'AINP-2025-11-0001445', 'AINP-2026-03-0003061'], total: '86,19,324.80' },
        amount: '99,244.48', date: '20-07-2026', note: 'বছরের মোট ক্রয়ের উপর ১৫% কমিশন প্রদান।',
        status: 'Approved', posting: 'Md. Abul Kalam\n20-07-2026 14:59PM',
    },
    {
        id: 6, no: 6, name: 'Madina Printing Pack', code: 'AIS-000003', recordCode: 'AISC-008107',
        types: ['Product', 'Amount'],
        detail: { kind: 'product', product: 'Label Print Pack', pcode: 'AI-000210' },
        amount: '12,000.00', date: '18-07-2026', note: 'লেবেল ক্রয়ের জন্য কমিশন।',
        status: 'Approved', posting: 'Md. Abul Kalam\n18-07-2026 12:58PM',
    },
];

const commissionTypes = ['Purchase Commission', 'Yearly Commission', 'Product'];
const officeOptions = ['Head Office', 'Bogura Office', 'Naogaon Office'];
const supplierOptions = ['Agro Dragon CO. Ltd.', 'AGROIRIS (BD) LTD (RAINBOW)', 'CANARY AGRO CHEMICALS', 'Digital Poly Pack', 'Nanjing Ecofarm Biotechnology', 'Madina Printing Pack'];

// ---- Purchase invoice detail page ----
const invoiceData = {
    company: 'AGRIVISION INTERNATIONAL',
    address: 'House # 42, Road # 11, Block-C, Banani, Dhaka-1213, Bangladesh',
    phone: '01700-123456', email: 'info@agrivisionbd.com', web: 'www.agrivisionbd.com',
    invDate: '19-06-2026', status: 'Received', payMethod: 'Bank Transfer',
    officer: 'Abdullah [AIE-000036]',
    supplierName: 'Agro Dragon CO. Ltd. [AIS-000025]',
    items: [
        { sn: 1, name: 'Jas Gold 100 Gm', qty: '10 * 24 = 240 (100 Gm)' },
        { sn: 2, name: 'Green Charge 1 Ltr', qty: '5 * 12 = 60 (1 Ltr)' },
    ],
    totalCarton: '15 Carton',
    dueBalance: '52,40,647.00',
    dueWords: 'Fifty Two Lakh Forty Thousand Six Hundred Forty Seven Taka Only',
};

function InvoicePage({ invNo, onBack }) {
    const d = invoiceData;
    return (
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', color: '#333' }}>&gt; Purchase Invoice Details</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => window.print()} style={{ padding: '6px 16px', background: '#0d6efd', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>🖨️ Print</button>
                    <button onClick={onBack} style={{ padding: '6px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>← Back</button>
                </div>
            </div>
            <div style={{ padding: '24px 28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: '#0d6efd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', flexShrink: 0 }}>AI</div>
                        <div>
                            <div style={{ fontSize: '18px', fontWeight: '800', color: '#1a2035' }}>{d.company}</div>
                            <div style={{ fontSize: '11px', color: '#555', marginTop: '3px' }}>📍 {d.address}</div>
                            <div style={{ fontSize: '11px', color: '#555' }}>📞 {d.phone} &nbsp; ✉ {d.email} &nbsp; 🌐 {d.web}</div>
                        </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#333', textAlign: 'right' }}>
                        <div style={{ fontWeight: '800', fontSize: '16px', color: '#1a2035', marginBottom: '4px' }}>PURCHASE INVOICE</div>
                        <div>Inv No: <b>{invNo}</b></div>
                        <div>Date: {d.invDate}</div>
                        <div>Status: <span style={{ color: '#28a745', fontWeight: '600' }}>{d.status}</span></div>
                        <div>Payment: {d.payMethod}</div>
                        <div>Officer: {d.officer}</div>
                    </div>
                </div>
                <div style={{ marginBottom: '14px', fontSize: '12px' }}>
                    <div style={{ fontWeight: '700', color: '#1a2035' }}>Supplier</div>
                    <div>{d.supplierName}</div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px' }}>
                    <thead>
                        <tr style={{ background: '#f8f9fa' }}>
                            <th style={{ border: '1px solid #dee2e6', padding: '8px', fontSize: '12px', textAlign: 'left', width: '60px' }}>S/N</th>
                            <th style={{ border: '1px solid #dee2e6', padding: '8px', fontSize: '12px', textAlign: 'left' }}>Name</th>
                            <th style={{ border: '1px solid #dee2e6', padding: '8px', fontSize: '12px', textAlign: 'left' }}>Qty</th>
                        </tr>
                    </thead>
                    <tbody>
                        {d.items.map(it => (
                            <tr key={it.sn}>
                                <td style={{ border: '1px solid #dee2e6', padding: '8px', fontSize: '12px' }}>{it.sn}</td>
                                <td style={{ border: '1px solid #dee2e6', padding: '8px', fontSize: '12px' }}>{it.name}</td>
                                <td style={{ border: '1px solid #dee2e6', padding: '8px', fontSize: '12px' }}>{it.qty}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div style={{ textAlign: 'right', fontWeight: '700', fontSize: '13px', marginBottom: '10px' }}>Total &nbsp; {d.totalCarton}</div>
                <div style={{ fontSize: '12px' }}>
                    <div><b>Total Amount :</b> {d.dueBalance}</div>
                    <div style={{ color: '#555' }}>{d.dueWords}</div>
                </div>
            </div>
        </div>
    );
}

function AddForm({ onBack }) {
    const [form, setForm] = useState({ supplier: '', type: '', date: today, amount: '', note: '' });
    const inp = { width: '100%', padding: '9px 12px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' };
    const lbl = { fontSize: '13px', fontWeight: '600', color: '#495057', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' };

    return (
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: '700', fontSize: '14px', color: '#333' }}>Commission</div>
            <div style={{ padding: '24px 32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '18px', marginBottom: '18px' }}>
                    <div>
                        <label style={lbl}>Supplier <span style={{ color: '#dc3545' }}>*</span>
                            <span style={{ background: '#0d6efd', color: 'white', fontSize: '10px', padding: '1px 7px', borderRadius: '4px' }}>View</span>
                        </label>
                        <select value={form.supplier} onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))} style={inp}>
                            <option value="">Supplier</option>
                            {supplierOptions.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Type <span style={{ color: '#dc3545' }}>*</span></label>
                        <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={inp}>
                            <option value="">Type</option>
                            {commissionTypes.map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Date <span style={{ color: '#dc3545' }}>*</span></label>
                        <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={{ ...inp, background: '#f8f9fa' }} />
                    </div>
                </div>
                <div style={{ marginBottom: '18px', maxWidth: '32%' }}>
                    <label style={lbl}>Commission Amount <span style={{ color: '#dc3545' }}>*</span>
                        <span style={{ background: '#0d6efd', color: 'white', fontSize: '10px', padding: '1px 6px', borderRadius: '4px' }}>00</span>
                        <span style={{ background: '#dc3545', color: 'white', fontSize: '10px', padding: '1px 6px', borderRadius: '4px' }}>00</span>
                    </label>
                    <input placeholder="Enter Amount" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} style={inp} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={lbl}>Note</label>
                    <textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} style={{ ...inp, height: '70px', resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={onBack} style={{ padding: '8px 24px', background: '#0d6efd', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Back</button>
                    <button style={{ padding: '8px 24px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Save</button>
                </div>
            </div>
        </div>
    );
}

const emptyFilter = { searchKey: '', invoiceNo: '', date: '', type: '', office: '' };

function SupplierCommission() {
    const [view, setView] = useState('list');
    const [records, setRecords] = useState(initialRecords);
    const [open, setOpen] = useState(true);
    const [viewInvoice, setViewInvoice] = useState(null);
    const [draft, setDraft] = useState(emptyFilter);
    const [applied, setApplied] = useState(emptyFilter);

    const handleApprove = (id) => setRecords(prev => prev.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
    const handleDelete = (id) => { if (window.confirm('Delete this commission?')) setRecords(prev => prev.filter(r => r.id !== id)); };
    const handleGo = () => setApplied(draft);
    const handleClear = () => { setDraft(emptyFilter); setApplied(emptyFilter); };

    const filtered = records.filter(r => {
        if (applied.searchKey) {
            const k = applied.searchKey.toLowerCase();
            if (!r.name.toLowerCase().includes(k) && !r.code.toLowerCase().includes(k) && !r.recordCode.toLowerCase().includes(k)) return false;
        }
        if (applied.invoiceNo) {
            const inv = applied.invoiceNo.toLowerCase();
            const list = r.detail.kind === 'purchases' ? r.detail.purchases : [];
            if (!list.some(i => i.toLowerCase().includes(inv))) return false;
        }
        if (applied.date && toISO(r.date) !== applied.date) return false;
        if (applied.type) {
            const map = { 'Purchase Commission': 'Purchase', 'Yearly Commission': 'Yearly', 'Product': 'Product' };
            if (!r.types.includes(map[applied.type])) return false;
        }
        return true;
    });

    if (view === 'add') return <AddForm onBack={() => setView('list')} />;
    if (viewInvoice) return <InvoicePage invNo={viewInvoice} onBack={() => setViewInvoice(null)} />;

    const renderDetail = (d) => {
        if (d.kind === 'purchases') {
            return (
                <div>
                    {d.purchases.map(inv => (
                        <div key={inv} style={{ marginBottom: '2px' }}>
                            <span onClick={() => setViewInvoice(inv)} style={{ color: '#0d6efd', fontWeight: '600', fontSize: '11px', marginRight: '5px', cursor: 'pointer', textDecoration: 'underline' }}>{inv}</span>
                            <Badge color="#6f42c1">Purchase</Badge>
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
        return null;
    };

    const filterInput = { padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px' };

    return (
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div onClick={() => setOpen(!open)} style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: '700', fontSize: '14px', color: '#333', cursor: 'pointer', userSelect: 'none' }}>
                {open ? '∨' : '>'} Supplier Commission
            </div>

            {open && (
                <>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <input placeholder="🔍 Search Key" value={draft.searchKey} onChange={e => setDraft(p => ({ ...p, searchKey: e.target.value }))} style={{ ...filterInput, width: '150px' }} />
                        <input placeholder="🔍 Purchase No" value={draft.invoiceNo} onChange={e => setDraft(p => ({ ...p, invoiceNo: e.target.value }))} style={{ ...filterInput, width: '140px' }} />
                        <input type="date" value={draft.date} onChange={e => setDraft(p => ({ ...p, date: e.target.value }))} style={filterInput} />
                        <select value={draft.type} onChange={e => setDraft(p => ({ ...p, type: e.target.value }))} style={{ ...filterInput, minWidth: '150px' }}>
                            <option value="">🔍 Select Type</option>
                            {commissionTypes.map(t => <option key={t}>{t}</option>)}
                        </select>
                        <select value={draft.office} onChange={e => setDraft(p => ({ ...p, office: e.target.value }))} style={{ ...filterInput, minWidth: '130px' }}>
                            <option value="">🔍 Select Office</option>
                            {officeOptions.map(o => <option key={o}>{o}</option>)}
                        </select>
                        <button onClick={handleGo} style={{ padding: '7px 18px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Go</button>
                        <button onClick={handleClear} style={{ padding: '7px 18px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Clear</button>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#1a2035' }}>
                                    <th style={{ ...thS, width: '36px', textAlign: 'center' }}>#</th>
                                    <th style={thS}>Supplier</th>
                                    <th style={thS}>Type</th>
                                    <th style={thS}>Purchase | Product | Year</th>
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
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={10} style={{ ...tdS, textAlign: 'center', padding: '30px', color: '#6c757d' }}>No data found</td></tr>
                                ) : filtered.map((r, i) => (
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

export default SupplierCommission;
