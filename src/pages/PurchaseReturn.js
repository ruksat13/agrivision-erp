import React, { useState, useEffect, useCallback } from 'react';
import {
    listPurchaseReturns, createPurchaseReturn, approvePurchaseReturn, cancelPurchaseReturn,
    supplierOptions, productOptions, listPurchases,
    formatDate, officeLabel, officeOptions,
} from '../services';
import { Notice, useFlash, useCollection } from '../components/Notice';

// Purchase returns, backed by Firestore.
//
// Twelfth of the fourteen screens in SCREEN-AUDIT.md §2.1. The list was
// `const [rows] = useState([])` — permanently empty and not even writable.
//
// The original form collected a supplier, an invoice and a return type but no
// products or quantities, so "Add" appended a row that could not say what was
// being returned. A return has product lines now, because otherwise there is
// nothing to take out of stock.
//
// Stock leaves and the payable drops on APPROVE, not on save: until somebody
// confirms the goods physically went back, neither has happened. The service
// refuses to approve a return larger than the office actually holds.

const thS = { padding: '11px 12px', color: 'white', fontWeight: '700', fontSize: '13px', textAlign: 'left', whiteSpace: 'nowrap' };
const tdS = { padding: '10px 12px', fontSize: '13px', color: '#333', borderBottom: '1px solid #f0f0f0', verticalAlign: 'top' };
const inp = { width: '100%', padding: '9px 12px', border: '1px solid #dee2e6', borderRadius: '5px', fontSize: '13px', boxSizing: 'border-box' };
const lbl = { fontSize: '14px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '7px' };

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = formatDate(new Date());

const returnReasons = ['Damaged Product', 'Wrong Product', 'Expired Product', 'Quality Issue', 'Excess Quantity'];

const Badge = ({ color, children }) => (
    <span style={{ background: color, color: 'white', padding: '3px 9px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>{children}</span>
);

const statusColour = (s) => ({ Approved: '#28a745', Pending: '#fd7e14', Cancelled: '#dc3545' }[s] || '#6c757d');

function AddPurchaseReturn({ suppliers, products, purchases, busy, onBack, onSave }) {
    const [form, setForm] = useState({
        supplierId: '', purchaseNo: '', officeId: 'head', returnDate: today, reason: '', note: '',
    });
    const [items, setItems] = useState([]);
    const [row, setRow] = useState({ productId: '', qty: '', unitPrice: '' });

    const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

    // Only this supplier's purchases are offerable — returning against someone
    // else's invoice is always a mistake.
    const theirPurchases = purchases.filter(p => !form.supplierId || p.supplierId === form.supplierId);

    const addItem = () => {
        if (!row.productId || !(Number(row.qty) > 0)) return;
        if (items.some(i => i.productId === row.productId)) return;
        const product = products.find(p => p.value === row.productId)?.product;
        setItems(prev => [...prev, {
            ...row,
            qty: Number(row.qty),
            unitPrice: Number(row.unitPrice || 0),
            name: product?.name || row.productId,
        }]);
        setRow({ productId: '', qty: '', unitPrice: '' });
    };

    const amount = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
    const ready = Boolean(form.supplierId && form.officeId && form.returnDate && form.reason && items.length) && !busy;

    return (
        <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #e9ecef', fontSize: '15px', color: '#333' }}>Add Purchase Return</div>
            <div style={{ padding: '22px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '18px', marginBottom: '20px' }}>
                    <div>
                        <label style={lbl}>Supplier <span style={{ color: '#dc3545' }}>*</span></label>
                        <select value={form.supplierId} onChange={set('supplierId')} style={inp}>
                            <option value="">🔍 Please select</option>
                            {suppliers.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Against purchase</label>
                        <select value={form.purchaseNo} onChange={set('purchaseNo')} style={inp}>
                            <option value="">— none / older stock —</option>
                            {theirPurchases.map(p => (
                                <option key={p.purchaseNo} value={p.purchaseNo}>
                                    {p.purchaseNo} · {formatDate(p.purchaseDate)} · ৳{fmt(p.grandTotal)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Return from <span style={{ color: '#dc3545' }}>*</span></label>
                        <select value={form.officeId} onChange={set('officeId')} style={inp}>
                            {officeOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Return Date <span style={{ color: '#dc3545' }}>*</span></label>
                        <input type="date" value={form.returnDate} onChange={set('returnDate')} style={{ ...inp, background: '#f8f9fa' }} />
                    </div>
                </div>

                {/* The lines. Without these there is nothing to take out of stock. */}
                <fieldset style={{ border: '1px solid #dee2e6', borderRadius: '5px', padding: '18px 20px', marginBottom: '20px' }}>
                    <legend style={{ padding: '0 8px', fontSize: '16px', fontWeight: '700', color: '#333' }}>
                        Products returned <span style={{ color: '#dc3545' }}>*</span>
                    </legend>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                        <div>
                            <label style={lbl}>Product</label>
                            <select value={row.productId} onChange={e => setRow(p => ({ ...p, productId: e.target.value }))} style={inp}>
                                <option value="">🔍 Please select</option>
                                {products.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Quantity</label>
                            <input type="number" min="1" value={row.qty} onChange={e => setRow(p => ({ ...p, qty: e.target.value }))} style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Unit price</label>
                            <input type="number" step="0.01" value={row.unitPrice} onChange={e => setRow(p => ({ ...p, unitPrice: e.target.value }))} style={inp} />
                        </div>
                        <button onClick={addItem} style={{ padding: '10px 16px', background: '#4e73df', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>Add line</button>
                    </div>

                    {items.length > 0 && (
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
                            <thead>
                                <tr style={{ background: '#1a2035' }}>
                                    <th style={thS}>#</th><th style={thS}>Product</th><th style={thS}>Qty</th>
                                    <th style={{ ...thS, textAlign: 'right' }}>Unit price</th>
                                    <th style={{ ...thS, textAlign: 'right' }}>Line total</th><th style={thS}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((it, i) => (
                                    <tr key={it.productId}>
                                        <td style={tdS}>{i + 1}</td>
                                        <td style={tdS}>{it.name} [{it.productId}]</td>
                                        <td style={tdS}>{it.qty}</td>
                                        <td style={{ ...tdS, textAlign: 'right' }}>{fmt(it.unitPrice)}</td>
                                        <td style={{ ...tdS, textAlign: 'right' }}>{fmt(it.qty * it.unitPrice)}</td>
                                        <td style={tdS}>
                                            <button onClick={() => setItems(items.filter(x => x.productId !== it.productId))} style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', padding: '3px 9px', cursor: 'pointer' }}>🗑</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </fieldset>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '18px' }}>
                    <div>
                        <label style={lbl}>Reason <span style={{ color: '#dc3545' }}>*</span></label>
                        <select value={form.reason} onChange={set('reason')} style={inp}>
                            <option value="">🔍 Please select</option>
                            {returnReasons.map(r => <option key={r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Notes</label>
                        <textarea placeholder="Notes" value={form.note} onChange={set('note')} style={{ ...inp, height: '70px', resize: 'vertical' }} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', alignItems: 'center', marginTop: '18px' }}>
                    <div style={{ fontSize: '14px', color: '#495057' }}>
                        Return value <strong style={{ color: '#1a2035', fontSize: '16px' }}>৳ {fmt(amount)}</strong>
                    </div>
                    <button onClick={onBack} style={{ padding: '8px 22px', background: '#4e73df', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>Back</button>
                    <button onClick={() => onSave({ ...form, items })} disabled={!ready}
                        style={{ padding: '8px 22px', background: ready ? '#1e7e34' : '#adb5bd', color: 'white', border: 'none', borderRadius: '5px', cursor: ready ? 'pointer' : 'not-allowed', fontSize: '14px' }}>
                        {busy ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const emptyF = { supplierId: '', date: '', search: '' };

function PurchaseReturn() {
    const [view, setView] = useState('list');
    const [draft, setDraft] = useState(emptyF);
    const [applied, setApplied] = useState(emptyF);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [purchases, setPurchases] = useState([]);

    const load = useCallback(() => listPurchaseReturns(), []);
    const { rows, loading, error, reload } = useCollection(load, { what: 'purchase returns' });
    const { flash, say, busy, run } = useFlash();

    const loadMasters = useCallback(() => {
        supplierOptions().then(setSuppliers).catch(() => setSuppliers([]));
        productOptions().then(setProducts).catch(() => setProducts([]));
        listPurchases({ status: 'Stock Done' }).then(setPurchases).catch(() => setPurchases([]));
    }, []);

    useEffect(() => { loadMasters(); }, [loadMasters]);

    const handleGo = () => setApplied(draft);
    const handleClear = () => { setDraft(emptyF); setApplied(emptyF); };

    const handleSave = (payload) => run(async () => {
        const saved = await createPurchaseReturn(payload);
        say('ok', `Return ${saved.returnNo} saved as Pending. Approve it to take the stock out and reduce the payable.`);
        setView('list');
        await reload();
    });

    const handleApprove = (r) => run(async () => {
        await approvePurchaseReturn(r.returnNo);
        say('ok', `${r.returnNo} approved — stock is out and ${r.supplierName}'s payable is down by ৳ ${fmt(r.amount)}.`);
        await reload();
    });

    const handleCancel = (r) => {
        const reason = window.prompt(`Why is return ${r.returnNo} being cancelled?`);
        if (!reason) return;
        run(async () => {
            await cancelPurchaseReturn(r.returnNo, reason);
            say('ok', r.status === 'Approved'
                ? `${r.returnNo} cancelled — the stock and the payable have both gone back.`
                : `${r.returnNo} cancelled.`);
            await reload();
        });
    };

    const filtered = rows.filter(r => {
        if (applied.supplierId && r.supplierId !== applied.supplierId) return false;
        if (applied.date && formatDate(r.returnDate) !== applied.date) return false;
        if (applied.search) {
            const k = applied.search.toLowerCase();
            const hay = `${r.returnNo} ${r.purchaseNo || ''} ${r.reason || ''}`.toLowerCase();
            if (!hay.includes(k)) return false;
        }
        return true;
    });

    const notices = (
        <>
            {loading && view === 'list' && <Notice tone="info">Loading purchase returns…</Notice>}
            {error && <Notice tone="warn">{error}</Notice>}
            {flash && <Notice tone={flash.tone}>{flash.text}</Notice>}
        </>
    );

    if (view === 'add') {
        return (
            <div>
                {notices}
                <AddPurchaseReturn suppliers={suppliers} products={products} purchases={purchases}
                    busy={busy} onBack={() => setView('list')} onSave={handleSave} />
            </div>
        );
    }

    const fInp = { padding: '9px 12px', border: '1px solid #ced4da', borderRadius: '5px', fontSize: '13px' };

    return (
        <div>
            {notices}

            <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: '22px' }}>
                <div style={{ borderBottom: '2px solid #0d6efd', paddingBottom: '14px', marginBottom: '18px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#0d6efd' }}>↩️ Purchase Return</div>
                    <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '2px' }}>Goods sent back to a supplier</div>
                </div>

                <div style={{ background: '#f0f9ff', padding: '14px 16px', borderRadius: '5px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '18px' }}>
                    <select value={draft.supplierId} onChange={e => setDraft(p => ({ ...p, supplierId: e.target.value }))} style={{ ...fInp, minWidth: '300px' }}>
                        <option value="">🔍 Please select</option>
                        {suppliers.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <input type="date" value={draft.date} onChange={e => setDraft(p => ({ ...p, date: e.target.value }))} style={{ ...fInp, width: '200px' }} />
                    <input placeholder="Return no or reason" value={draft.search} onChange={e => setDraft(p => ({ ...p, search: e.target.value }))} style={{ ...fInp, width: '200px' }} />
                    <button onClick={handleGo} style={{ padding: '9px 20px', background: '#1e7e34', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>🔍 Go</button>
                    <button onClick={handleClear} style={{ padding: '9px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>✕ Clear</button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#1a2035' }}>
                                <th style={{ ...thS, width: '50px' }}>No</th>
                                <th style={thS}>Return No</th>
                                <th style={thS}>Supplier</th>
                                <th style={thS}>Against</th>
                                <th style={thS}>Products</th>
                                <th style={thS}>Date</th>
                                <th style={{ ...thS, textAlign: 'right' }}>Amount</th>
                                <th style={thS}>Reason</th>
                                <th style={thS}>Status</th>
                                <th style={{ ...thS, textAlign: 'right' }}>
                                    Action&nbsp;
                                    <button onClick={() => setView('add')} style={{ padding: '3px 11px', background: '#28a745', color: 'white', border: 'none', borderRadius: '3px', fontSize: '12px', cursor: 'pointer' }}>Add</button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={10} style={{ ...tdS, textAlign: 'center', padding: '30px', color: '#adb5bd' }}>
                                    {loading ? 'Loading…' : 'No data found'}
                                </td></tr>
                            ) : filtered.map((r, i) => (
                                <tr key={r.returnNo} style={{ background: i % 2 === 0 ? 'white' : '#f4f8fb', opacity: r.status === 'Cancelled' ? 0.55 : 1 }}>
                                    <td style={{ ...tdS, textAlign: 'center' }}>{i + 1}</td>
                                    <td style={tdS}>{r.returnNo}</td>
                                    <td style={tdS}>{r.supplierName}</td>
                                    <td style={tdS}>{r.purchaseNo || '—'}</td>
                                    <td style={{ ...tdS, fontSize: '12px' }}>
                                        {(r.items || []).map(it => (
                                            <div key={it.productId}>{it.qty} × {it.productName}</div>
                                        ))}
                                    </td>
                                    <td style={{ ...tdS, whiteSpace: 'nowrap' }}>{formatDate(r.returnDate)}</td>
                                    <td style={{ ...tdS, textAlign: 'right', fontWeight: 600, textDecoration: r.status === 'Cancelled' ? 'line-through' : 'none' }}>{fmt(r.amount)}</td>
                                    <td style={{ ...tdS, fontSize: '12px' }}>
                                        {r.reason}
                                        <div style={{ color: '#6c757d' }}>{officeLabel(r.officeId)}</div>
                                    </td>
                                    <td style={tdS}><Badge color={statusColour(r.status)}>{r.status}</Badge></td>
                                    <td style={{ ...tdS, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                        {r.status === 'Pending' && (
                                            <button onClick={() => handleApprove(r)} disabled={busy} title="Approve — takes the stock out"
                                                style={{ padding: '5px 10px', background: '#1cc88a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', marginRight: 4 }}>✔</button>
                                        )}
                                        {r.status !== 'Cancelled' && (
                                            <button onClick={() => handleCancel(r)} disabled={busy} title="Cancel"
                                                style={{ padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>🗑</button>
                                        )}
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

export default PurchaseReturn;
