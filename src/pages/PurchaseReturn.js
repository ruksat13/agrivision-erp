import React, { useState } from 'react';

const today = new Date().toISOString().split('T')[0];
const thS = { padding: '11px 12px', color: 'white', fontWeight: '700', fontSize: '13px', textAlign: 'left', whiteSpace: 'nowrap' };
const tdS = { padding: '10px 12px', fontSize: '13px', color: '#333', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' };
const toISO = (d) => d.split('-').reverse().join('-');

const Badge = ({ color, children }) => (
    <span style={{ background: color, color: 'white', padding: '3px 9px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>{children}</span>
);

const supplierOptions = ['Shafirul Islam (Agrivision International)', 'M/s- Akondho Gift Please', 'M/s Leton Gift Palace', 'Nanjing Ecofarm Biotechnology Co., Ltd', 'Shahin Screen Printer', 'Saba Packaging BD'];
const returnTypes = ['Full Return', 'Partial Return'];
const returnReasons = ['Damaged Product', 'Wrong Product', 'Expired Product', 'Quality Issue', 'Excess Quantity'];
const purchaseInvoices = ['AI-001095', 'AI-001094', 'AI-001093', 'AI-001090', 'AI-001088'];

// saerp shows this list empty — same here
const initialReturns = [];

function AddPurchaseReturn({ onBack }) {
    const [form, setForm] = useState({ supplier: '', returnType: '', purchaseInvoice: '', returnDate: today, reason: '', notes: '' });
    const [items, setItems] = useState([]);
    const inp = { width: '100%', padding: '9px 12px', border: '1px solid #dee2e6', borderRadius: '5px', fontSize: '13px', boxSizing: 'border-box' };
    const lbl = { fontSize: '14px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '7px' };

    const handleAdd = () => {
        if (!form.supplier || !form.purchaseInvoice) return;
        setItems(prev => [...prev, { id: Date.now(), supplier: form.supplier, invoice: form.purchaseInvoice, type: form.returnType }]);
    };

    return (
        <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #e9ecef', fontSize: '15px', color: '#333' }}>Add Purchase Return</div>
            <div style={{ padding: '22px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '18px', alignItems: 'end', paddingBottom: '20px', borderBottom: '1px solid #f0f0f0' }}>
                    <div>
                        <label style={lbl}>Supplier <span style={{ color: '#dc3545' }}>*</span></label>
                        <select value={form.supplier} onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))} style={inp}>
                            <option value="">🔍 Please select</option>
                            {supplierOptions.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Return Type</label>
                        <select value={form.returnType} onChange={e => setForm(p => ({ ...p, returnType: e.target.value }))} style={inp}>
                            <option value="">🔍 Please select</option>
                            {returnTypes.map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Purchase Invoice</label>
                        <select value={form.purchaseInvoice} onChange={e => setForm(p => ({ ...p, purchaseInvoice: e.target.value }))} style={inp}>
                            <option value="">🔍 Please select</option>
                            {purchaseInvoices.map(i => <option key={i}>{i}</option>)}
                        </select>
                    </div>
                    <button onClick={handleAdd} style={{ padding: '10px', background: '#1e7e34', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>Add</button>
                </div>

                {items.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', margin: '18px 0' }}>
                        <thead>
                            <tr style={{ background: '#1a2035' }}>
                                <th style={thS}>#</th><th style={thS}>Supplier</th><th style={thS}>Purchase Invoice</th><th style={thS}>Return Type</th><th style={thS}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((it, i) => (
                                <tr key={it.id}>
                                    <td style={tdS}>{i + 1}</td>
                                    <td style={tdS}>{it.supplier}</td>
                                    <td style={tdS}>{it.invoice}</td>
                                    <td style={tdS}>{it.type}</td>
                                    <td style={tdS}>
                                        <button onClick={() => setItems(items.filter(x => x.id !== it.id))} style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', padding: '3px 9px', cursor: 'pointer' }}>🗑</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '18px', marginTop: '22px' }}>
                    <div>
                        <label style={lbl}>Return Date <span style={{ color: '#dc3545' }}>*</span></label>
                        <input type="date" value={form.returnDate} onChange={e => setForm(p => ({ ...p, returnDate: e.target.value }))} style={{ ...inp, background: '#f8f9fa' }} />
                    </div>
                    <div>
                        <label style={lbl}>Return Reason <span style={{ color: '#dc3545' }}>*</span></label>
                        <select value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} style={inp}>
                            <option value="">🔍 Please select</option>
                            {returnReasons.map(r => <option key={r}>{r}</option>)}
                        </select>
                    </div>
                    <div />
                </div>

                <div style={{ marginTop: '18px' }}>
                    <label style={lbl}>Notes</label>
                    <textarea placeholder="Notes" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ ...inp, height: '70px', resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '18px' }}>
                    <button onClick={onBack} style={{ padding: '8px 22px', background: '#4e73df', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>Back</button>
                    <button style={{ padding: '8px 22px', background: '#1e7e34', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>Save</button>
                </div>
            </div>
        </div>
    );
}

const emptyF = { supplier: '', date: '', invoice: '' };

function PurchaseReturn() {
    const [view, setView] = useState('list');
    const [rows] = useState(initialReturns);
    const [draft, setDraft] = useState(emptyF);
    const [applied, setApplied] = useState(emptyF);

    const handleGo = () => setApplied(draft);
    const handleClear = () => { setDraft(emptyF); setApplied(emptyF); };

    const filtered = rows.filter(r => {
        if (applied.supplier && r.supplier !== applied.supplier) return false;
        if (applied.date && toISO(r.date) !== applied.date) return false;
        if (applied.invoice && !r.retNo.toLowerCase().includes(applied.invoice.toLowerCase())) return false;
        return true;
    });

    if (view === 'add') return <AddPurchaseReturn onBack={() => setView('list')} />;

    const fInp = { padding: '9px 12px', border: '1px solid #ced4da', borderRadius: '5px', fontSize: '13px' };

    return (
        <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: '22px' }}>
            <div style={{ borderBottom: '2px solid #0d6efd', paddingBottom: '14px', marginBottom: '18px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#0d6efd' }}>🛒 Purchase Return</div>
                <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '2px' }}>Detailed purchase return record</div>
            </div>

            <div style={{ background: '#f0f9ff', padding: '14px 16px', borderRadius: '5px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '18px' }}>
                <select value={draft.supplier} onChange={e => setDraft(p => ({ ...p, supplier: e.target.value }))} style={{ ...fInp, minWidth: '300px' }}>
                    <option value="">🔍 Please select</option>
                    {supplierOptions.map(s => <option key={s}>{s}</option>)}
                </select>
                <input type="date" value={draft.date} onChange={e => setDraft(p => ({ ...p, date: e.target.value }))} style={{ ...fInp, width: '200px' }} />
                <input placeholder="Return invoice no" value={draft.invoice} onChange={e => setDraft(p => ({ ...p, invoice: e.target.value }))} style={{ ...fInp, width: '200px' }} />
                <button onClick={handleGo} style={{ padding: '9px 20px', background: '#1e7e34', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>🔍 Go</button>
                <button onClick={handleClear} style={{ padding: '9px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>✕ Clear</button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#1a2035' }}>
                            <th style={{ ...thS, width: '55px' }}>No</th>
                            <th style={thS}>Type | Pur No</th>
                            <th style={thS}>Pur-Ret No</th>
                            <th style={thS}>Supplier</th>
                            <th style={thS}>Date</th>
                            <th style={{ ...thS, textAlign: 'right' }}>Amount</th>
                            <th style={thS}>Status</th>
                            <th style={thS}>Posting Date</th>
                            <th style={{ ...thS, textAlign: 'right' }}>
                                Action&nbsp;
                                <button onClick={() => setView('add')} style={{ padding: '3px 11px', background: '#28a745', color: 'white', border: 'none', borderRadius: '3px', fontSize: '12px', cursor: 'pointer' }}>Add</button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((r, i) => (
                            <tr key={r.id} style={{ background: i % 2 === 0 ? 'white' : '#f4f8fb' }}>
                                <td style={{ ...tdS, textAlign: 'center' }}>{i + 1}</td>
                                <td style={tdS}>{r.type} | {r.purNo}</td>
                                <td style={tdS}>{r.retNo}</td>
                                <td style={tdS}>{r.supplier}</td>
                                <td style={tdS}>{r.date}</td>
                                <td style={{ ...tdS, textAlign: 'right' }}>{r.amount}</td>
                                <td style={tdS}><Badge color="#28a745">{r.status}</Badge></td>
                                <td style={{ ...tdS, fontSize: '12px' }}>{r.posting}</td>
                                <td style={{ ...tdS, textAlign: 'right' }}>
                                    <button style={{ padding: '6px 11px', background: '#4e73df', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>👁</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default PurchaseReturn;
