import React, { useState } from 'react';
import { CompanyHeader } from './Purchase';

const today = new Date().toISOString().split('T')[0];
const thS = { padding: '11px 12px', color: 'white', fontWeight: '700', fontSize: '13px', textAlign: 'left', whiteSpace: 'nowrap' };
const tdS = { padding: '10px 12px', fontSize: '13px', color: '#333', borderBottom: '1px solid #f0f0f0', verticalAlign: 'top' };
const toISO = (d) => d.split('-').reverse().join('-');

const Badge = ({ color, children }) => (
    <span style={{ background: color, color: 'white', padding: '3px 9px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>{children}</span>
);

const statusColor = (s) => (s === 'Cancel' ? '#dc3545' : '#28a745');

const offices = ['Head Office', 'Jessore Office', 'Jamalpur Office'];

const demandItems = [
    { name: 'Super Green 25sc (paclobutrazol 25%) 1 Ltr', code: 'AI-000535', stock: '263/6\n43, 5 pcs.', demand: '600/6\n100', unit: '1 Ltr' },
    { name: 'Ayna Plus 18wp 100 Gm', code: 'AI-000078', stock: '16528/40\n413, 8 pcs.', demand: '2000/40\n50', unit: '100 Gm' },
    { name: 'Bucket 5 LTR', code: 'AI-000737', stock: '382/1\n382', demand: '50/1\n50', unit: '5 Ltr' },
    { name: 'Bucket 10 LTR', code: 'AI-000738', stock: '53/1\n53', demand: '50/1\n50', unit: '10 ltr' },
    { name: 'Discover 75wp 100 Gm', code: 'AI-000377', stock: '4705/24\n196, 1 pcs.', demand: '480/24\n20', unit: '100 Gm' },
    { name: 'Egsul 80 Wg 1 Kg', code: 'AI-000044', stock: '12928/10\n1292, 8 pcs.', demand: '2000/10\n200', unit: '1 KG' },
    { name: 'Hundred Plus 40wdg 100gm', code: 'AI-000025', stock: '22564/24\n940, 4 pcs.', demand: '1200/24\n50', unit: '100 Gm' },
    { name: 'Iron', code: 'AI-000692', stock: '15/1\n15', demand: '5/1\n5', unit: 'Pcs' },
    { name: 'Kepnar 3gr (fipronil 3%) 1 Kg', code: 'AI-000452', stock: '23365/10\n2336, 5 pcs.', demand: '2000/10\n200', unit: '1 KG' },
    { name: 'New Churanto 1.8ec 100 Ml', code: 'AI-000716', stock: '2040/24\n85', demand: '720/24\n30', unit: '100 Ml' },
    { name: 'New Churanto 1.8ec 400 Ml', code: 'AI-000715', stock: '700/10\n70', demand: '200/10\n20', unit: '400 Ml' },
    { name: 'Newban Mota 1 Kg', code: 'AI-000101', stock: '13916/20\n695, 16 pcs.', demand: '2000/20\n100', unit: '1 KG' },
    { name: 'Noorzink Mono 1 Kg', code: 'AI-000099', stock: '14581/10\n1458, 1 pcs.', demand: '1000/10\n100', unit: '1 KG' },
    { name: 'Poroshmoni 10ec 400 Ml', code: 'AI-000012', stock: '1085/9\n120, 5 pcs.', demand: '90/9\n10', unit: '400 Ml' },
    { name: 'Rice Cooker', code: 'AI-000480', stock: '35/1\n35', demand: '5/1\n5', unit: 'Pcs' },
    { name: 'Shikor Hormon 1kg', code: 'AI-000092', stock: '26810/20\n1340, 10 pcs.', demand: '2000/20\n100', unit: '1 KG' },
];

const requests = [
    { id: 1, no: 'AIPR-000216', from: 'Head Office', to: 'Jessore Office', expected: '03-08-2026', reqDate: '04-08-2026', time: '2026-08-04 13:39:00', status: 'Approved', note: '৩৫ কার্টন আপডেট দামের MRP হবে।', totalCarton: '1445, 0 pcs' },
    { id: 2, no: 'AIPR-000215', from: 'Head Office', to: 'Jamalpur Office', expected: '30-07-2026', reqDate: '30-07-2026', time: '2026-07-30 11:20:00', status: 'Approved', note: '', totalCarton: '980, 0 pcs' },
    { id: 3, no: 'AIPR-000214', from: 'Jamalpur Office', to: 'Head Office', expected: '28-07-2026', reqDate: '28-07-2026', time: '2026-07-28 10:05:00', status: 'Received', note: '', totalCarton: '412, 0 pcs' },
    { id: 4, no: 'AIPR-000213', from: 'Jamalpur Office', to: 'Head Office', expected: '28-07-2026', reqDate: '28-07-2026', time: '2026-07-28 09:40:00', status: 'Cancel', note: '', totalCarton: '0, 0 pcs' },
    { id: 5, no: 'AIPR-000212', from: 'Head Office', to: 'Jamalpur Office', expected: '25-07-2026', reqDate: '25-07-2026', time: '2026-07-25 14:12:00', status: 'Received', note: '', totalCarton: '760, 0 pcs' },
    { id: 6, no: 'AIPR-000211', from: 'Head Office', to: 'Jessore Office', expected: '25-07-2026', reqDate: '25-07-2026', time: '2026-07-25 12:30:00', status: 'Received', note: 'সুপারগ্রীন ১ লিটারের বডি রেট ৪৫০০/- টাকা করতে হবে ৩৫ কার্টনে।', totalCarton: '855, 0 pcs' },
    { id: 7, no: 'AIPR-000210', from: 'Head Office', to: 'Jamalpur Office', expected: '23-07-2026', reqDate: '23-07-2026', time: '2026-07-23 16:00:00', status: 'Approved', note: 'অফিসের অফিশিয়াল বড় খাম দিয়ে পাঠাবেন।', totalCarton: '640, 0 pcs' },
    { id: 8, no: 'AIPR-000209', from: 'Head Office', to: 'Jessore Office', expected: '22-07-2026', reqDate: '22-07-2026', time: '2026-07-22 11:45:00', status: 'Received', note: '৩৫৪ টি অক্সিট্যাবের জার সাথে দিবেন (লেবেল সহ)। ক্যাপনার ২০ টি খালি কার্টন দিবেন।', totalCarton: '1120, 0 pcs' },
    { id: 9, no: 'AIPR-000208', from: 'Head Office', to: 'Jamalpur Office', expected: '16-07-2026', reqDate: '16-07-2026', time: '2026-07-16 10:15:00', status: 'Received', note: '', totalCarton: '520, 0 pcs' },
    { id: 10, no: 'AIPR-000207', from: 'Head Office', to: 'Jessore Office', expected: '16-07-2026', reqDate: '16-07-2026', time: '2026-07-16 09:50:00', status: 'Received', note: '', totalCarton: '690, 0 pcs' },
    { id: 11, no: 'AIPR-000206', from: 'Head Office', to: 'Jessore Office', expected: '08-07-2026', reqDate: '08-07-2026', time: '2026-07-08 15:25:00', status: 'Received', note: 'Agri Zink ৫০০ কার্টন ও New AC Plus এর ৩০০ পিছ ম্যানুয়াল স্টক টি-শার্ট সাথে দিয়ে দিবেন (যা অনলাইনে হবে না)।', totalCarton: '800, 0 pcs' },
    { id: 12, no: 'AIPR-000205', from: 'Head Office', to: 'Jamalpur Office', expected: '06-07-2026', reqDate: '06-07-2026', time: '2026-07-06 13:10:00', status: 'Received', note: '', totalCarton: '430, 0 pcs' },
    { id: 13, no: 'AIPR-000204', from: 'Head Office', to: 'Jamalpur Office', expected: '06-07-2026', reqDate: '06-07-2026', time: '2026-07-06 11:00:00', status: 'Received', note: '', totalCarton: '375, 0 pcs' },
];

// ---- Request detail (separate page) ----
function RequestDetail({ row, onBack }) {
    const th = { border: '1px solid #999', padding: '8px', fontSize: '12px', textAlign: 'left' };
    return (
        <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: '24px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '20px' }}>
                <button onClick={() => window.print()} style={{ padding: '7px 14px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>🖨️</button>
                <button onClick={onBack} style={{ padding: '7px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '13px' }}>← Back</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '22px' }}>
                <CompanyHeader />
                <div style={{ fontSize: '12px', color: '#333' }}>
                    <div style={{ fontWeight: '800', fontSize: '16px', color: '#1a2035' }}>INVOICE</div>
                    <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '5px' }}>Invoice No: {row.no}</div>
                    <div style={{ fontSize: '11px' }}>Expected Date: {toISO(row.expected)}</div>
                    <div style={{ fontSize: '11px' }}>Request Date: {toISO(row.reqDate)}</div>
                    <div style={{ fontSize: '11px' }}>From: {row.from}</div>
                    <div style={{ fontSize: '11px' }}>To: {row.to}</div>
                    <div style={{ fontSize: '11px' }}>Time: {row.time}</div>
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ ...th, width: '55px' }}>S/N</th>
                        <th style={th}>Name</th>
                        <th style={{ ...th, width: '190px' }}>Stock</th>
                        <th style={{ ...th, width: '190px' }}>Demand Qty</th>
                    </tr>
                </thead>
                <tbody>
                    {demandItems.map((it, i) => (
                        <tr key={it.code}>
                            <td style={{ border: '1px solid #999', padding: '8px', fontSize: '12px' }}>{i + 1}</td>
                            <td style={{ border: '1px solid #999', padding: '8px', fontSize: '12px' }}>{it.name} [{it.code}]</td>
                            <td style={{ border: '1px solid #999', padding: '8px', fontSize: '12px', whiteSpace: 'pre-line' }}>{it.stock}</td>
                            <td style={{ border: '1px solid #999', padding: '8px', fontSize: '12px', whiteSpace: 'pre-line' }}>
                                {it.demand} <span style={{ fontSize: '10px', color: '#666' }}>({it.unit})</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan={3} style={{ padding: '8px', fontSize: '13px', fontWeight: '700', textAlign: 'right' }}>Total Carton</td>
                        <td style={{ padding: '8px', fontSize: '13px', fontWeight: '700' }}>{row.totalCarton}</td>
                    </tr>
                </tfoot>
            </table>

            {row.note && <div style={{ marginTop: '16px', fontSize: '13px' }}>{row.note}</div>}

            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '50px', fontSize: '11px', color: '#555' }}>
                {['Created by', 'Authorised signature', 'Delivered by', 'Customer signature'].map(s => (
                    <div key={s} style={{ textAlign: 'center' }}>
                        <div style={{ borderTop: '1px dotted #999', paddingTop: '5px', minWidth: '150px' }}>{s}</div>
                    </div>
                ))}
            </div>
            <div style={{ textAlign: 'center', fontSize: '11px', color: '#666', marginTop: '10px' }}>
                Invoice was created on a computer and is valid without the signature and seal.
            </div>
        </div>
    );
}

// ---- Add Request ----
function AddRequest({ onBack }) {
    const [form, setForm] = useState({ from: '', to: '', expected: today, note: '' });
    const inp = { width: '100%', padding: '9px 12px', border: '1px solid #dee2e6', borderRadius: '5px', fontSize: '13px', boxSizing: 'border-box' };
    const lbl = { fontSize: '14px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '7px' };
    const req = <span style={{ color: '#dc3545' }}>*</span>;

    return (
        <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #e9ecef', fontSize: '15px', color: '#333' }}>Add Product Request</div>
            <div style={{ padding: '22px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '18px', marginBottom: '18px' }}>
                    <div>
                        <label style={lbl}>From Office {req}</label>
                        <select value={form.from} onChange={e => setForm(p => ({ ...p, from: e.target.value }))} style={inp}>
                            <option value="">🔍 Please select</option>
                            {offices.map(o => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>To Office {req}</label>
                        <select value={form.to} onChange={e => setForm(p => ({ ...p, to: e.target.value }))} style={inp}>
                            <option value="">🔍 Please select</option>
                            {offices.map(o => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Expected Date {req}</label>
                        <input type="date" value={form.expected} onChange={e => setForm(p => ({ ...p, expected: e.target.value }))} style={{ ...inp, background: '#f8f9fa' }} />
                    </div>
                </div>

                <div>
                    <label style={lbl}>Note</label>
                    <textarea placeholder="Note" value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} style={{ ...inp, height: '70px', resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button onClick={onBack} style={{ padding: '8px 22px', background: '#4e73df', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>Back</button>
                    <button style={{ padding: '8px 22px', background: '#1e7e34', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>Save</button>
                </div>
            </div>
        </div>
    );
}

const emptyF = { date: '', no: '' };

function ProductDemand() {
    const [view, setView] = useState('list');
    const [detail, setDetail] = useState(null);
    const [draft, setDraft] = useState(emptyF);
    const [applied, setApplied] = useState(emptyF);

    const handleGo = () => setApplied(draft);
    const handleClear = () => { setDraft(emptyF); setApplied(emptyF); };

    const filtered = requests.filter(r => {
        if (applied.date && toISO(r.expected) !== applied.date) return false;
        if (applied.no && !r.no.toLowerCase().includes(applied.no.toLowerCase())) return false;
        return true;
    });

    if (view === 'add') return <AddRequest onBack={() => setView('list')} />;
    if (detail) return <RequestDetail row={detail} onBack={() => setDetail(null)} />;

    const fInp = { padding: '9px 12px', border: '1px solid #ced4da', borderRadius: '5px', fontSize: '13px' };

    return (
        <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: '22px' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#333', marginBottom: '18px' }}>&gt; Manage Request</div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '18px' }}>
                <input type="date" value={draft.date} onChange={e => setDraft(p => ({ ...p, date: e.target.value }))} style={{ ...fInp, width: '230px' }} />
                <input placeholder="Request no" value={draft.no} onChange={e => setDraft(p => ({ ...p, no: e.target.value }))} style={{ ...fInp, width: '230px' }} />
                <button onClick={handleGo} style={{ padding: '9px 20px', background: '#1e7e34', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>Go</button>
                <button onClick={handleClear} style={{ padding: '9px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>Clear</button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#1a2035' }}>
                            <th style={{ ...thS, width: '55px' }}>SL</th>
                            <th style={thS}>No</th>
                            <th style={thS}>From Office</th>
                            <th style={thS}>To Office</th>
                            <th style={thS}>Expected Date</th>
                            <th style={thS}>Status</th>
                            <th style={thS}>Note</th>
                            <th style={{ ...thS, textAlign: 'right' }}>
                                Action&nbsp;
                                <button onClick={() => setView('add')} style={{ padding: '3px 11px', background: '#28a745', color: 'white', border: 'none', borderRadius: '3px', fontSize: '12px', cursor: 'pointer' }}>Add</button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={8} style={{ ...tdS, textAlign: 'center', padding: '30px', color: '#adb5bd' }}>No data found</td></tr>
                        ) : filtered.map((r, i) => (
                            <tr key={r.id} style={{ background: i % 2 === 0 ? 'white' : '#f8fbfd' }}>
                                <td style={{ ...tdS, textAlign: 'center' }}>{i + 1}</td>
                                <td style={tdS}>{r.no}</td>
                                <td style={tdS}>{r.from}</td>
                                <td style={tdS}>{r.to}</td>
                                <td style={{ ...tdS, whiteSpace: 'nowrap' }}>{r.expected}</td>
                                <td style={tdS}><Badge color={statusColor(r.status)}>{r.status}</Badge></td>
                                <td style={{ ...tdS, fontSize: '12px', maxWidth: '300px', whiteSpace: 'normal' }}>{r.note}</td>
                                <td style={{ ...tdS, textAlign: 'right' }}>
                                    <button onClick={() => setDetail(r)} title="Show" style={{ padding: '6px 12px', background: '#4e73df', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>i</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ProductDemand;
