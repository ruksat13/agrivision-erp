import React, { useState } from 'react';

const thS = { padding: '11px 12px', color: 'white', fontWeight: '700', fontSize: '13px', textAlign: 'left', verticalAlign: 'middle' };
const tdS = { padding: '10px 12px', fontSize: '13px', color: '#333', borderBottom: '1px solid #f0f0f0', verticalAlign: 'top' };

const Badge = ({ color, children }) => (
    <span style={{ background: color, color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', display: 'inline-block', marginRight: '4px' }}>{children}</span>
);

const IBtn = ({ bg, title, children, onClick }) => (
    <button onClick={onClick} title={title} style={{ padding: '5px 9px', background: bg, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', marginRight: '3px' }}>{children}</button>
);

const initialOffers = [
    {
        id: 1, name: 'Egsul 80WG/Get Extra 10% Bonus', code: 'AIOF-000292', period: '2026-08-01 to 2026-09-30',
        buy: { type: 'Product', label: 'Egsul 80 Wg 1 Kg', pcode: 'AI-000044', qty: '1' },
        gift: { type: 'Amount', label: '', qty: '10.00 %' },
        pay: ['Cash', 'Publish', 'Instant Deal'],
        note: 'এগসুল ৮০ডব্লিউজি যেকোনো সাইজের ক্যাশ বিক্রির ক্ষেত্রে অতিরিক্ত ইনভয়েস হতে ১০% ছাড় পাবেন। ক্রেডিটে কোনো ছাড় নেই। কোম্পানির পলিসি অনুযায়ী ক্যাশ ও ক্রেডিট বোনাস পাবেন।',
    },
    {
        id: 2, name: 'Hundred Plus 300 gm get Bucket 10 ltr', code: 'AIOF-000291', period: '2026-07-29 to 2026-09-30',
        buy: { type: 'Product', label: 'Hundred Plus 40wdg 300gm', pcode: 'AI-000024', qty: '1' },
        gift: { type: 'Product', label: 'Bucket 10 LTR', pcode: 'AI-000738', qty: '1' },
        pay: ['Both', 'Publish', 'Instant Deal'],
        note: 'হানড্রেড প্লাস ৩০০ গ্রামের প্রতি ১ কার্টন ক্যাশ অথবা ক্রেডিটে নিলে সাথে সাথে ০১ টি ১০ লিটারের বালতি ফ্রি।',
    },
    {
        id: 3, name: 'Hundred Plus 100 gm get Bucket 5 ltr', code: 'AIOF-000290', period: '2026-07-29 to 2026-09-30',
        buy: { type: 'Product', label: 'Hundred Plus 40wdg 100gm', pcode: 'AI-000025', qty: '1' },
        gift: { type: 'Product', label: 'Bucket 5 LTR', pcode: 'AI-000737', qty: '1' },
        pay: ['Both', 'Publish', 'Instant Deal'],
        note: 'হানড্রেড প্লাস ১০০ গ্রামের প্রতি ১ কার্টন ক্যাশ অথবা ক্রেডিটে নিলে সাথে সাথে ০১ টি ৫ লিটারের বালতি ফ্রি।',
    },
    {
        id: 4, name: 'Super Green 30 Ltr/Get Electric Chula 1pcs', code: 'AIOF-000289', period: '2026-07-01 to 2026-09-30',
        buy: { type: 'Product', label: 'Super Green 25sc (paclobutrazol 25%) 1 Ltr', pcode: 'AI-000535', qty: '30.00 KG/Litter' },
        gift: { type: 'Product', label: 'Electric Chula', pcode: 'AI-000507', qty: '1', extra: '3000 Tk/=' },
        pay: ['Both', 'Publish', 'Instant Deal'],
        note: 'সুপারগ্রীন যেকোনো সাইজের ৩০ লিটার ক্যাশ ও ক্রেডিট বিক্রির ক্ষেত্রে ১টি ইলেকট্রিক চুলা অথবা ৩,০০০/- টাকা পাবেন। ক্যাশ বিক্রিতে অফার সাথে সাথে, ক্রেডিটে অফার ক্লোজিংয়ের পরে।',
    },
    {
        id: 5, name: 'Tetop 2.4 ltr/Get Ceramic Plates', code: 'AIOF-000288', period: '2026-07-01 to 2026-09-30',
        buy: { type: 'Product', label: 'Tetop 100 ml', pcode: 'AI-000642', qty: '2.40 KG/Litter' },
        gift: { type: 'Product', label: 'Ceramic Plates', pcode: 'AI-000491', qty: '1' },
        pay: ['Both', 'Publish', 'Instant Deal'],
        note: 'টিটপ ৫০ইসি যেকোনো সাইজের ২.৪ লিটার ক্যাশ ও ক্রেডিট বিক্রির ক্ষেত্রে ১টি সিরামিক প্লেট পাবেন। ক্যাশে সাথে সাথে, ক্রেডিটে অফার ক্লোজিংয়ের পরে।',
    },
    {
        id: 6, name: 'Super Green 1000 ltr/Get Pulsar 150cc', code: 'AIOF-000287', period: '2026-07-01 to 2026-09-30',
        buy: { type: 'Product', label: 'Super Green 25sc (paclobutrazol 25%) 1 Ltr', pcode: 'AI-000535', qty: '1000.00 KG/Litter' },
        gift: { type: 'Product', label: 'Pulsar 150cc', pcode: 'AI-000505', qty: '1', extra: '210000 Tk/=' },
        pay: ['Both', 'Publish', 'Instant Deal'],
        note: 'সুপারগ্রীন যেকোনো সাইজের ১০০০ লিটার ক্যাশ ও ক্রেডিট বিক্রির ক্ষেত্রে ১টি পালসার ১৫০সিসি মোটরসাইকেল অথবা ২,১০,০০০/- টাকা পাবেন।',
    },
    {
        id: 7, name: 'Super Green 500 ltr/Get Maldives Tour', code: 'AIOF-000286', period: '2026-07-01 to 2026-09-30',
        buy: { type: 'Product', label: 'Super Green 25sc (paclobutrazol 25%) 1 Ltr', pcode: 'AI-000535', qty: '500.00 KG/Litter' },
        gift: { type: 'Product', label: 'Maldives Tour', pcode: 'AI-000734', qty: '1', extra: '90000 Tk/=' },
        pay: ['Both', 'Publish', 'Instant Deal'],
        note: 'সুপারগ্রীন যেকোনো সাইজের ৫০০ লিটার ক্যাশ ও ক্রেডিট বিক্রির ক্ষেত্রে ১টি মালদ্বীপ ভ্রমণ অথবা ৯০,০০০/- টাকা পাবেন।',
    },
    {
        id: 8, name: 'Super Green 600 ltr/Get Umra Hajj', code: 'AIOF-000285', period: '2026-07-01 to 2026-09-30',
        buy: { type: 'Product', label: 'Super Green 25sc (paclobutrazol 25%) 1 Ltr', pcode: 'AI-000535', qty: '600.00 KG/Litter' },
        gift: { type: 'Product', label: 'Umra Hajj', pcode: 'AI-000503', qty: '1', extra: '111000 Tk/=' },
        pay: ['Both', 'Publish', 'Instant Deal'],
        note: 'সুপারগ্রীন যেকোনো সাইজের ৬০০ লিটার ক্যাশ ও ক্রেডিট বিক্রির ক্ষেত্রে ১টি ওমরা হজ্জ অথবা ১,১১,০০০/- টাকা পাবেন।',
    },
    {
        id: 9, name: 'Super Green 400 ltr/Get Thailand Tour', code: 'AIOF-000284', period: '2026-07-01 to 2026-09-30',
        buy: { type: 'Product', label: 'Super Green 25sc (paclobutrazol 25%) 1 Ltr', pcode: 'AI-000535', qty: '400.00 KG/Litter' },
        gift: { type: 'Product', label: 'Thailand Tour', pcode: 'AI-000500', qty: '1', extra: '73000 Tk/=' },
        pay: ['Both', 'Publish', 'Instant Deal'],
        note: 'সুপারগ্রীন যেকোনো সাইজের ৪০০ লিটার ক্যাশ ও ক্রেডিট বিক্রির ক্ষেত্রে ১টি থাইল্যান্ড ভ্রমণ অথবা ৭৩,০০০/- টাকা পাবেন।',
    },
];

const buyProducts = ['Egsul 80 Wg 1 Kg', 'Hundred Plus 40wdg 300gm', 'Hundred Plus 40wdg 100gm', 'Super Green 25sc 1 Ltr', 'Tetop 100 ml'];
const giftProducts = ['Bucket 10 LTR', 'Bucket 5 LTR', 'Electric Chula', 'Ceramic Plates', 'Pulsar 150cc', 'Maldives Tour', 'Umra Hajj', 'Thailand Tour'];
const paymentTypes = ['Cash', 'Credit', 'Both'];
const buyTypes = ['Product', 'Amount', 'Quantity'];
const statuses = ['Publish', 'Unpublish'];
const modules = ['Product', 'Category', 'Brand'];
const offerTypes = ['Instant Deal', 'Closing Deal'];

function AddOffer({ onBack }) {
    const [form, setForm] = useState({
        buyModule: '', buyProduct: '', buyType: '', giftModule: '',
        name: '', paymentType: '', startDate: '', endDate: '', status: '', type: '', notes: '',
    });
    const inp = { width: '100%', padding: '9px 12px', border: '1px solid #dee2e6', borderRadius: '5px', fontSize: '13px', boxSizing: 'border-box' };
    const lbl = { fontSize: '14px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '7px' };
    const req = <span style={{ color: '#dc3545' }}>*</span>;

    return (
        <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #e9ecef', fontSize: '15px', color: '#333' }}>Add Offer</div>
            <div style={{ padding: '22px' }}>
                {/* Buy fieldset */}
                <fieldset style={{ border: '1px solid #dee2e6', borderRadius: '5px', padding: '18px 20px', marginBottom: '20px' }}>
                    <legend style={{ padding: '0 8px', fontSize: '17px', fontWeight: '700', color: '#333' }}>Buy</legend>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '18px' }}>
                        <div>
                            <label style={lbl}>Select Module {req}</label>
                            <select value={form.buyModule} onChange={e => setForm(p => ({ ...p, buyModule: e.target.value }))} style={inp}>
                                <option value="">🔍 Please select</option>
                                {modules.map(m => <option key={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Select Product {req}</label>
                            <select value={form.buyProduct} onChange={e => setForm(p => ({ ...p, buyProduct: e.target.value }))} style={inp}>
                                <option value="">🔍 Select Products</option>
                                {buyProducts.map(b => <option key={b}>{b}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Select Type {req}</label>
                            <select value={form.buyType} onChange={e => setForm(p => ({ ...p, buyType: e.target.value }))} style={inp}>
                                <option value="">🔍 Please select</option>
                                {buyTypes.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                </fieldset>

                {/* Gift fieldset */}
                <fieldset style={{ border: '1px solid #dee2e6', borderRadius: '5px', padding: '18px 20px', marginBottom: '20px' }}>
                    <legend style={{ padding: '0 8px', fontSize: '17px', fontWeight: '700', color: '#333' }}>Gift</legend>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '18px' }}>
                        <div>
                            <label style={lbl}>Target module {req}</label>
                            <select value={form.giftModule} onChange={e => setForm(p => ({ ...p, giftModule: e.target.value }))} style={inp}>
                                <option value="">🔍 Please select</option>
                                {giftProducts.map(g => <option key={g}>{g}</option>)}
                            </select>
                        </div>
                        <div /><div />
                    </div>
                </fieldset>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px', marginBottom: '18px' }}>
                    <div>
                        <label style={lbl}>Name {req}</label>
                        <input placeholder="Enter Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={inp} />
                    </div>
                    <div>
                        <label style={lbl}>Payment Type {req}</label>
                        <select value={form.paymentType} onChange={e => setForm(p => ({ ...p, paymentType: e.target.value }))} style={inp}>
                            <option value="">🔍 Please select</option>
                            {paymentTypes.map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Start Date {req}</label>
                        <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} style={inp} />
                    </div>
                    <div>
                        <label style={lbl}>End Date {req}</label>
                        <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} style={inp} />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
                    <div>
                        <label style={lbl}>Status {req}</label>
                        <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} style={inp}>
                            <option value="">🔍 Please select</option>
                            {statuses.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Type {req}</label>
                        <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={inp}>
                            <option value="">🔍 Please select</option>
                            {offerTypes.map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Notes</label>
                        <textarea placeholder="Notes" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ ...inp, height: '68px', resize: 'vertical' }} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button onClick={onBack} style={{ padding: '8px 22px', background: '#4e73df', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>Back</button>
                    <button style={{ padding: '8px 22px', background: '#1e7e34', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>Save</button>
                </div>
            </div>
        </div>
    );
}

const emptyF = { buyProduct: '', giftProduct: '', paymentType: '', buyType: '', status: '' };

function Offers() {
    const [view, setView] = useState('list');
    const [offers, setOffers] = useState(initialOffers);
    const [draft, setDraft] = useState(emptyF);
    const [applied, setApplied] = useState(emptyF);

    const handleGo = () => setApplied(draft);
    const handleClear = () => { setDraft(emptyF); setApplied(emptyF); };
    const handleShowAll = () => { setDraft(emptyF); setApplied(emptyF); };
    const handleDelete = (id) => { if (window.confirm('Delete this offer?')) setOffers(prev => prev.filter(o => o.id !== id)); };

    const filtered = offers.filter(o => {
        if (applied.buyProduct && !o.buy.label.includes(applied.buyProduct)) return false;
        if (applied.giftProduct && !(o.gift.label || '').includes(applied.giftProduct)) return false;
        if (applied.paymentType && !o.pay.includes(applied.paymentType)) return false;
        if (applied.buyType && o.buy.type !== applied.buyType) return false;
        if (applied.status && !o.pay.includes(applied.status)) return false;
        return true;
    });

    if (view === 'add') return <AddOffer onBack={() => setView('list')} />;

    const fInp = { padding: '9px 12px', border: '1px solid #ced4da', borderRadius: '5px', fontSize: '13px' };

    return (
        <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: '22px' }}>
            <div style={{ borderBottom: '2px solid #0d6efd', paddingBottom: '14px', marginBottom: '18px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#0d6efd' }}>🎁 Offers</div>
                <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '2px' }}>Detailed offers record</div>
            </div>

            <div style={{ background: '#f0f9ff', padding: '14px 16px', borderRadius: '5px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '18px' }}>
                <select value={draft.buyProduct} onChange={e => setDraft(p => ({ ...p, buyProduct: e.target.value }))} style={{ ...fInp, minWidth: '240px' }}>
                    <option value="">🔍 Buy Product</option>
                    {buyProducts.map(b => <option key={b}>{b}</option>)}
                </select>
                <select value={draft.giftProduct} onChange={e => setDraft(p => ({ ...p, giftProduct: e.target.value }))} style={{ ...fInp, minWidth: '240px' }}>
                    <option value="">🔍 Gift Product</option>
                    {giftProducts.map(g => <option key={g}>{g}</option>)}
                </select>
                <select value={draft.paymentType} onChange={e => setDraft(p => ({ ...p, paymentType: e.target.value }))} style={{ ...fInp, minWidth: '150px' }}>
                    <option value="">🔍 Payment Type</option>
                    {paymentTypes.map(t => <option key={t}>{t}</option>)}
                </select>
                <select value={draft.buyType} onChange={e => setDraft(p => ({ ...p, buyType: e.target.value }))} style={{ ...fInp, minWidth: '150px' }}>
                    <option value="">🔍 Buy Type</option>
                    {buyTypes.map(t => <option key={t}>{t}</option>)}
                </select>
                <select value={draft.status} onChange={e => setDraft(p => ({ ...p, status: e.target.value }))} style={{ ...fInp, minWidth: '150px' }}>
                    <option value="">🔍 Status</option>
                    {statuses.map(s => <option key={s}>{s}</option>)}
                </select>
                <button onClick={handleGo} style={{ padding: '9px 20px', background: '#1e7e34', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>🔍 Go</button>
                <button onClick={handleClear} style={{ padding: '9px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>✕ Clear</button>
                <button onClick={handleShowAll} style={{ padding: '9px 20px', background: '#4e73df', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>Show All</button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#1a2035' }}>
                            <th style={{ ...thS, width: '50px' }}>No</th>
                            <th style={thS}>Name</th>
                            <th style={thS}>Select Module (Buy)</th>
                            <th style={thS}>Target Module (Gift)</th>
                            <th style={thS}>Payment<br />Status</th>
                            <th style={thS}>Note</th>
                            <th style={{ ...thS, textAlign: 'right' }}>
                                Action&nbsp;
                                <button onClick={() => setView('add')} style={{ padding: '3px 11px', background: '#28a745', color: 'white', border: 'none', borderRadius: '3px', fontSize: '12px', cursor: 'pointer' }}>Add</button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={7} style={{ ...tdS, textAlign: 'center', padding: '30px', color: '#adb5bd' }}>No data found</td></tr>
                        ) : filtered.map((o, i) => (
                            <tr key={o.id} style={{ background: i % 2 === 0 ? 'white' : '#f8fbfd' }}>
                                <td style={{ ...tdS, textAlign: 'center' }}>{i + 1}</td>
                                <td style={{ ...tdS, minWidth: '220px' }}>
                                    <div style={{ fontWeight: '600', color: '#1a2035' }}>{o.name}</div>
                                    <div style={{ fontSize: '12px', color: '#495057' }}>{o.code}</div>
                                    <div style={{ fontSize: '12px', color: '#6c757d' }}>{o.period}</div>
                                </td>
                                <td style={{ ...tdS, minWidth: '230px' }}>
                                    <Badge color="#28a745">{o.buy.type}</Badge>
                                    <span style={{ fontSize: '12px' }}>{o.buy.label} [{o.buy.pcode}]</span>
                                    <div style={{ marginTop: '4px' }}>
                                        <Badge color={o.buy.qty && o.buy.qty.includes('KG') ? '#20c997' : '#28a745'}>{o.buy.qty}</Badge>
                                    </div>
                                </td>
                                <td style={{ ...tdS, minWidth: '200px' }}>
                                    <Badge color="#28a745">{o.gift.type}</Badge>
                                    {o.gift.label && <span style={{ fontSize: '12px' }}>{o.gift.label} [{o.gift.pcode}]</span>}
                                    <div style={{ marginTop: '4px' }}>
                                        <Badge color="#28a745">{o.gift.qty}</Badge>
                                        {o.gift.extra && <Badge color="#20c997">{o.gift.extra}</Badge>}
                                    </div>
                                </td>
                                <td style={tdS}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
                                        {o.pay.map(p => <Badge key={p} color="#0dcaf0">{p}</Badge>)}
                                    </div>
                                </td>
                                <td style={{ ...tdS, fontSize: '12px', maxWidth: '320px', whiteSpace: 'normal' }}>{o.note}</td>
                                <td style={{ ...tdS, whiteSpace: 'nowrap', textAlign: 'right' }}>
                                    <IBtn bg="#dc3545" title="Unpublish">👎</IBtn>
                                    <IBtn bg="#4e73df" title="Edit" onClick={() => setView('add')}>✎</IBtn>
                                    <IBtn bg="#dc3545" title="Delete" onClick={() => handleDelete(o.id)}>🗑</IBtn>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Offers;
