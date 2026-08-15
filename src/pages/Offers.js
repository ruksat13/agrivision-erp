import React, { useState, useEffect, useCallback } from 'react';
import {
    listOffers, createOffer, updateOffer, archiveOffer, publishOffer, unpublishOffer,
    productOptions, formatDate,
    OFFER_TYPE, OFFER_BUY_TYPE, OFFER_MODULE, PAYMENT_TYPE,
} from '../services';
import { Notice, useFlash, useCollection } from '../components/Notice';

// Offers, backed by Firestore.
//
// Third of the fourteen screens in SCREEN-AUDIT.md §2.1. Two things changed
// beyond wiring Save:
//
//   · `buyProducts` and `giftProducts` were hardcoded string arrays — named in
//     §4.2 as two of the dropdowns that never read a master. Both now come from
//     productOptions(), so an offer carries a real product code.
//   · The form never collected the buy and gift quantities, but the table
//     renders them. Saving would have produced a row with two blank badges —
//     the §2.3 defect. The fields are on the form now.
//
// The old `pay` array mixed three different things (payment type, publish state
// and deal type) into one list of badges. They are three fields now; the table
// still shows them stacked, so it reads the same.

const thS = { padding: '11px 12px', color: 'white', fontWeight: '700', fontSize: '13px', textAlign: 'left', verticalAlign: 'middle' };
const tdS = { padding: '10px 12px', fontSize: '13px', color: '#333', borderBottom: '1px solid #f0f0f0', verticalAlign: 'top' };
const inp = { width: '100%', padding: '9px 12px', border: '1px solid #dee2e6', borderRadius: '5px', fontSize: '13px', boxSizing: 'border-box' };
const lbl = { fontSize: '14px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '7px' };
const req = <span style={{ color: '#dc3545' }}>*</span>;

const Badge = ({ color, children }) => (
    <span style={{ background: color, color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', display: 'inline-block', marginRight: '4px' }}>{children}</span>
);

const IBtn = ({ bg, title, children, onClick, disabled }) => (
    <button onClick={onClick} title={title} disabled={disabled}
        style={{ padding: '5px 9px', background: disabled ? '#adb5bd' : bg, color: 'white', border: 'none', borderRadius: '4px', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '13px', marginRight: '3px' }}>{children}</button>
);

// "Both" is not a stored value — it is both payment types (schema §10).
const PAY_CHOICES = [
    { label: 'Cash', value: ['Cash'] },
    { label: 'Credit', value: ['Credit'] },
    { label: 'Both', value: ['Cash', 'Credit'] },
];
const payLabel = (types = []) => (types.length > 1 ? 'Both' : types[0] || '—');
const payKey = (types = []) => payLabel(types);

const EMPTY = {
    buyModule: 'Product', buyProductId: '', buyType: 'Product', buyQty: '',
    giftType: 'Product', giftProductId: '', giftQty: '', giftExtra: '',
    name: '', pay: 'Both', startDate: '', endDate: '', status: 'Publish', offerType: 'Instant Deal', noteBn: '',
};

function fromOffer(o) {
    return {
        buyModule: o.buyModule || 'Product',
        buyProductId: o.buy?.productId || '',
        buyType: o.buy?.type || 'Product',
        buyQty: o.buy?.qty || '',
        giftType: o.gift?.type || 'Product',
        giftProductId: o.gift?.productId || '',
        giftQty: o.gift?.qty || '',
        giftExtra: o.gift?.extra || '',
        name: o.name || '',
        pay: payLabel(o.paymentTypes),
        startDate: formatDate(o.startDate),
        endDate: formatDate(o.endDate),
        status: o.status === 'Archived' ? 'Unpublish' : (o.status || 'Publish'),
        offerType: o.offerType || 'Instant Deal',
        noteBn: o.noteBn || '',
    };
}

function AddOffer({ editing, products, busy, onBack, onSave }) {
    const [form, setForm] = useState(editing ? fromOffer(editing) : EMPTY);
    const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

    const needsBuyProduct = form.buyType === 'Product';
    const needsGiftProduct = form.giftType === 'Product';
    const ready = Boolean(
        form.name.trim() && form.startDate && form.endDate
        && (!needsBuyProduct || form.buyProductId)
        && (!needsGiftProduct || form.giftProductId),
    ) && !busy;

    const productSelect = (value, onChange, placeholder) => (
        <select value={value} onChange={onChange} style={inp}>
            <option value="">🔍 {placeholder}</option>
            {products.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
    );

    return (
        <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #e9ecef', fontSize: '15px', color: '#333' }}>
                {editing ? `Edit Offer — ${editing.code}` : 'Add Offer'}
            </div>
            <div style={{ padding: '22px' }}>
                {/* Buy fieldset */}
                <fieldset style={{ border: '1px solid #dee2e6', borderRadius: '5px', padding: '18px 20px', marginBottom: '20px' }}>
                    <legend style={{ padding: '0 8px', fontSize: '17px', fontWeight: '700', color: '#333' }}>Buy</legend>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '18px' }}>
                        <div>
                            <label style={lbl}>Select Module {req}</label>
                            <select value={form.buyModule} onChange={set('buyModule')} style={inp}>
                                {OFFER_MODULE.map(m => <option key={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Select Type {req}</label>
                            <select value={form.buyType} onChange={set('buyType')} style={inp}>
                                {OFFER_BUY_TYPE.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Select Product {needsBuyProduct && req}</label>
                            {productSelect(form.buyProductId, set('buyProductId'), 'Select Products')}
                        </div>
                        <div>
                            <label style={lbl}>Qty / threshold</label>
                            <input placeholder="e.g. 1  ·  30.00 KG/Litter" value={form.buyQty} onChange={set('buyQty')} style={inp} />
                        </div>
                    </div>
                </fieldset>

                {/* Gift fieldset */}
                <fieldset style={{ border: '1px solid #dee2e6', borderRadius: '5px', padding: '18px 20px', marginBottom: '20px' }}>
                    <legend style={{ padding: '0 8px', fontSize: '17px', fontWeight: '700', color: '#333' }}>Gift</legend>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '18px' }}>
                        <div>
                            <label style={lbl}>Gift Type {req}</label>
                            <select value={form.giftType} onChange={set('giftType')} style={inp}>
                                {OFFER_BUY_TYPE.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Target module {needsGiftProduct && req}</label>
                            {productSelect(form.giftProductId, set('giftProductId'), 'Select Gift')}
                        </div>
                        <div>
                            <label style={lbl}>Gift qty</label>
                            <input placeholder="e.g. 1  ·  10.00 %" value={form.giftQty} onChange={set('giftQty')} style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Cash alternative</label>
                            <input placeholder="e.g. 3000 Tk/=" value={form.giftExtra} onChange={set('giftExtra')} style={inp} />
                        </div>
                    </div>
                </fieldset>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px', marginBottom: '18px' }}>
                    <div>
                        <label style={lbl}>Name {req}</label>
                        <input placeholder="Enter Name" value={form.name} onChange={set('name')} style={inp} />
                    </div>
                    <div>
                        <label style={lbl}>Payment Type {req}</label>
                        <select value={form.pay} onChange={set('pay')} style={inp}>
                            {PAY_CHOICES.map(c => <option key={c.label}>{c.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Start Date {req}</label>
                        <input type="date" value={form.startDate} onChange={set('startDate')} style={inp} />
                    </div>
                    <div>
                        <label style={lbl}>End Date {req}</label>
                        <input type="date" value={form.endDate} onChange={set('endDate')} style={inp} />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
                    <div>
                        <label style={lbl}>Status {req}</label>
                        <select value={form.status} onChange={set('status')} style={inp}>
                            <option>Publish</option>
                            <option>Unpublish</option>
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Type {req}</label>
                        <select value={form.offerType} onChange={set('offerType')} style={inp}>
                            {OFFER_TYPE.map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Notes</label>
                        <textarea placeholder="Notes" value={form.noteBn} onChange={set('noteBn')} style={{ ...inp, height: '68px', resize: 'vertical' }} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button onClick={onBack} style={{ padding: '8px 22px', background: '#4e73df', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>Back</button>
                    <button onClick={() => onSave(form)} disabled={!ready}
                        style={{ padding: '8px 22px', background: ready ? '#1e7e34' : '#adb5bd', color: 'white', border: 'none', borderRadius: '5px', cursor: ready ? 'pointer' : 'not-allowed', fontSize: '14px' }}>
                        {busy ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const emptyF = { buyProductId: '', paymentType: '', buyType: '', status: '' };

function Offers() {
    const [view, setView] = useState('list');
    const [editing, setEditing] = useState(null);
    const [draft, setDraft] = useState(emptyF);
    const [applied, setApplied] = useState(emptyF);
    const [products, setProducts] = useState([]);

    const load = useCallback(() => listOffers(), []);
    const { rows: offers, loading, error, reload } = useCollection(load, { what: 'offers' });
    const { flash, say, busy, run } = useFlash();

    // The product master feeds both selectors on the form and the filter bar.
    useEffect(() => {
        productOptions().then(setProducts).catch(() => setProducts([]));
    }, []);

    const handleGo = () => setApplied(draft);
    const handleClear = () => { setDraft(emptyF); setApplied(emptyF); };

    const handleSave = (form) => run(async () => {
        const paymentTypes = PAY_CHOICES.find(c => c.label === form.pay)?.value || ['Cash'];
        const label = (id) => products.find(p => p.value === id)?.product?.name || null;
        const payload = {
            name: form.name,
            buyModule: form.buyModule,
            buy: { type: form.buyType, productId: form.buyProductId || null, label: label(form.buyProductId), qty: form.buyQty },
            gift: { type: form.giftType, productId: form.giftProductId || null, label: label(form.giftProductId), qty: form.giftQty, extra: form.giftExtra },
            paymentTypes,
            offerType: form.offerType,
            startDate: form.startDate,
            endDate: form.endDate,
            status: form.status,
            noteBn: form.noteBn,
        };

        if (editing) {
            await updateOffer(editing.code, payload);
            say('ok', `Offer ${editing.code} updated.`);
        } else {
            const saved = await createOffer(payload);
            say('ok', `Offer ${saved.code} saved.`);
        }
        setEditing(null);
        setView('list');
        await reload();
    });

    const handleArchive = (o) => {
        if (!window.confirm(`Delete offer ${o.code}? It is archived rather than removed — an invoice that gave its gift must still resolve it.`)) return;
        run(async () => {
            await archiveOffer(o.code, 'Deleted from the offers register');
            say('ok', `Offer ${o.code} archived.`);
            await reload();
        });
    };

    const handleTogglePublish = (o) => run(async () => {
        const published = o.status === 'Publish';
        await (published ? unpublishOffer(o.code) : publishOffer(o.code));
        say('ok', `Offer ${o.code} ${published ? 'unpublished' : 'published'}.`);
        await reload();
    });

    const filtered = offers.filter(o => {
        if (applied.buyProductId && o.buy?.productId !== applied.buyProductId && o.gift?.productId !== applied.buyProductId) return false;
        if (applied.paymentType && !(o.paymentTypes || []).includes(applied.paymentType)) return false;
        if (applied.buyType && o.buy?.type !== applied.buyType) return false;
        if (applied.status && o.status !== applied.status) return false;
        return true;
    });

    const notices = (
        <>
            {loading && view === 'list' && <Notice tone="info">Loading offers…</Notice>}
            {error && <Notice tone="warn">{error}</Notice>}
            {flash && <Notice tone={flash.tone}>{flash.text}</Notice>}
        </>
    );

    if (view === 'add') {
        return (
            <div>
                {notices}
                <AddOffer
                    key={editing ? editing.code : 'new'}
                    editing={editing}
                    products={products}
                    busy={busy}
                    onBack={() => { setEditing(null); setView('list'); }}
                    onSave={handleSave}
                />
            </div>
        );
    }

    const fInp = { padding: '9px 12px', border: '1px solid #ced4da', borderRadius: '5px', fontSize: '13px' };

    return (
        <div>
            {notices}

            <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: '22px' }}>
                <div style={{ borderBottom: '2px solid #0d6efd', paddingBottom: '14px', marginBottom: '18px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#0d6efd' }}>🎁 Offers</div>
                    <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '2px' }}>Detailed offers record</div>
                </div>

                <div style={{ background: '#f0f9ff', padding: '14px 16px', borderRadius: '5px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '18px' }}>
                    <select value={draft.buyProductId} onChange={e => setDraft(p => ({ ...p, buyProductId: e.target.value }))} style={{ ...fInp, minWidth: '260px' }}>
                        <option value="">🔍 Product (buy or gift)</option>
                        {products.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                    <select value={draft.paymentType} onChange={e => setDraft(p => ({ ...p, paymentType: e.target.value }))} style={{ ...fInp, minWidth: '150px' }}>
                        <option value="">🔍 Payment Type</option>
                        {PAYMENT_TYPE.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <select value={draft.buyType} onChange={e => setDraft(p => ({ ...p, buyType: e.target.value }))} style={{ ...fInp, minWidth: '150px' }}>
                        <option value="">🔍 Buy Type</option>
                        {OFFER_BUY_TYPE.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <select value={draft.status} onChange={e => setDraft(p => ({ ...p, status: e.target.value }))} style={{ ...fInp, minWidth: '150px' }}>
                        <option value="">🔍 Status</option>
                        <option>Publish</option>
                        <option>Unpublish</option>
                    </select>
                    <button onClick={handleGo} style={{ padding: '9px 20px', background: '#1e7e34', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>🔍 Go</button>
                    <button onClick={handleClear} style={{ padding: '9px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>✕ Clear</button>
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
                                    <button onClick={() => { setEditing(null); setView('add'); }} style={{ padding: '3px 11px', background: '#28a745', color: 'white', border: 'none', borderRadius: '3px', fontSize: '12px', cursor: 'pointer' }}>Add</button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={7} style={{ ...tdS, textAlign: 'center', padding: '30px', color: '#adb5bd' }}>
                                    {loading ? 'Loading…' : 'No data found'}
                                </td></tr>
                            ) : filtered.map((o, i) => (
                                <tr key={o.code} style={{ background: i % 2 === 0 ? 'white' : '#f8fbfd', opacity: o.status === 'Publish' ? 1 : 0.6 }}>
                                    <td style={{ ...tdS, textAlign: 'center' }}>{i + 1}</td>
                                    <td style={{ ...tdS, minWidth: '220px' }}>
                                        <div style={{ fontWeight: '600', color: '#1a2035' }}>{o.name}</div>
                                        <div style={{ fontSize: '12px', color: '#495057' }}>{o.code}</div>
                                        <div style={{ fontSize: '12px', color: '#6c757d' }}>{formatDate(o.startDate)} to {formatDate(o.endDate)}</div>
                                    </td>
                                    <td style={{ ...tdS, minWidth: '230px' }}>
                                        <Badge color="#28a745">{o.buy?.type}</Badge>
                                        {o.buy?.label && <span style={{ fontSize: '12px' }}>{o.buy.label} [{o.buy.productId}]</span>}
                                        {o.buy?.qty && (
                                            <div style={{ marginTop: '4px' }}>
                                                <Badge color={String(o.buy.qty).includes('KG') ? '#20c997' : '#28a745'}>{o.buy.qty}</Badge>
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ ...tdS, minWidth: '200px' }}>
                                        <Badge color="#28a745">{o.gift?.type}</Badge>
                                        {o.gift?.label && <span style={{ fontSize: '12px' }}>{o.gift.label} [{o.gift.productId}]</span>}
                                        {(o.gift?.qty || o.gift?.extra) && (
                                            <div style={{ marginTop: '4px' }}>
                                                {o.gift?.qty && <Badge color="#28a745">{o.gift.qty}</Badge>}
                                                {o.gift?.extra && <Badge color="#20c997">{o.gift.extra}</Badge>}
                                            </div>
                                        )}
                                    </td>
                                    <td style={tdS}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
                                            <Badge key={payKey(o.paymentTypes)} color="#0dcaf0">{payLabel(o.paymentTypes)}</Badge>
                                            <Badge color={o.status === 'Publish' ? '#0dcaf0' : '#6c757d'}>{o.status}</Badge>
                                            <Badge color="#0dcaf0">{o.offerType}</Badge>
                                        </div>
                                    </td>
                                    <td style={{ ...tdS, fontSize: '12px', maxWidth: '320px', whiteSpace: 'normal' }}>{o.noteBn}</td>
                                    <td style={{ ...tdS, whiteSpace: 'nowrap', textAlign: 'right' }}>
                                        <IBtn bg={o.status === 'Publish' ? '#dc3545' : '#28a745'} disabled={busy}
                                            title={o.status === 'Publish' ? 'Unpublish' : 'Publish'}
                                            onClick={() => handleTogglePublish(o)}>{o.status === 'Publish' ? '👎' : '👍'}</IBtn>
                                        <IBtn bg="#4e73df" title="Edit" disabled={busy} onClick={() => { setEditing(o); setView('add'); }}>✎</IBtn>
                                        <IBtn bg="#dc3545" title="Delete" disabled={busy} onClick={() => handleArchive(o)}>🗑</IBtn>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Offers;
