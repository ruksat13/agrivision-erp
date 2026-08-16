import React, { useState, useEffect, useCallback } from 'react';
import {
    listPurchases, createPurchase, cancelPurchase, getPurchaseWithItems,
    supplierOptions, productOptions, formatDate, officeLabel, officeOptions,
} from '../services';
import { Notice, useFlash, useCollection } from '../components/Notice';

// Purchases, backed by Firestore.
//
// Eleventh of the fourteen screens in SCREEN-AUDIT.md §2.1, and the first of
// group D — the four that move stock, which §2.1.1 calls the most valuable and
// the most work.
//
// A purchase writes its lines, its `purchase` stock movements and the
// supplier's payable in ONE batch, the mirror of createSale(). Saving one
// raises the Stock Report figure it should raise.
//
// Two hardcoded arrays are gone: `supplierOptions` (§4.2 — six names with no
// codes) and `productOptions` (four names). Both read their master.
//
// The invoice detail rendered ONE hardcoded line — "Agri Zink (packet) 1kg,
// 310" — on every purchase, which is §4.3's fourth bullet. It reads
// `purchase_items` now.
//
// Feature 2 applies here as INTERNAL-PLAN.md §3 asks: a product withdrawn from
// sale cannot be received either, and unlike a sale that refusal cannot be
// overridden.

const thS = { padding: '11px 12px', color: 'white', fontWeight: '700', fontSize: '13px', textAlign: 'left', whiteSpace: 'nowrap' };
const tdS = { padding: '10px 12px', fontSize: '13px', color: '#333', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' };
const inp = { width: '100%', padding: '9px 12px', border: '1px solid #dee2e6', borderRadius: '5px', fontSize: '13px', boxSizing: 'border-box' };
const lbl = { fontSize: '13px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '5px' };
const cell = { border: '1px solid #999', padding: '7px', fontSize: '12px' };

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = formatDate(new Date());

const Badge = ({ color, children }) => (
    <span style={{ background: color, color: 'white', padding: '3px 9px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>{children}</span>
);

const company = {
    name: 'AGRIVISION INTERNATIONAL',
    address: 'House # 42, Road # 11, Block-C, Banani, Dhaka-1213, Bangladesh',
    phone: '01700-123456',
    email: 'info@agrivisionbd.com',
    web: 'www.agrivisionbd.com',
};

export function CompanyHeader() {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#0d6efd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px', fontWeight: '800', flexShrink: 0 }}>AI</div>
            <div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: '#1a2035', letterSpacing: '0.5px' }}>{company.name}</div>
                <div style={{ fontSize: '12px', color: '#555', marginTop: '6px' }}>📍 : {company.address}</div>
                <div style={{ fontSize: '12px', color: '#555' }}>📞 : {company.phone} , ✉ : {company.email} , 🌐 : {company.web}</div>
            </div>
        </div>
    );
}

// ---- Purchase invoice detail (separate page) ----
function PurchaseDetail({ row, onBack }) {
    return (
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: '24px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '18px' }}>
                <button onClick={() => window.print()} style={{ padding: '7px 14px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>🖨️</button>
                <button onClick={onBack} style={{ padding: '7px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '13px' }}>← Back</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
                <CompanyHeader />
                <div style={{ fontSize: '12px', color: '#333' }}>
                    <div style={{ fontWeight: '800', fontSize: '17px', color: '#1a2035', marginBottom: '6px' }}>PURCHASE INVOICE</div>
                    <div>Purchase Number: {row.purchaseNo}</div>
                    <div>Supplier Invoice: {row.invoiceNo || '—'}</div>
                    <div>Purchase Date: {formatDate(row.purchaseDate)}</div>
                    <div>Due Date: {formatDate(row.dueDate) || '—'}</div>
                    <div>Office: {officeLabel(row.officeId)}</div>
                    <div>Status: {row.status}</div>
                </div>
            </div>

            <div style={{ marginBottom: '16px', fontSize: '12px' }}>
                <div style={{ fontWeight: '700', color: '#1a2035', marginBottom: '3px' }}>Billing Address</div>
                <div>{row.supplierName} [{row.supplierCode}]</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
                <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ ...cell, width: '55px' }}>S/N</th>
                        <th style={cell}>Product</th>
                        <th style={{ ...cell, width: '170px' }}>Quantity</th>
                        <th style={{ ...cell, width: '150px', textAlign: 'right' }}>Unit price</th>
                        <th style={{ ...cell, width: '150px', textAlign: 'right' }}>Price</th>
                    </tr>
                </thead>
                <tbody>
                    {(row.items || []).map((it, i) => (
                        <tr key={it.id || it.lineNo}>
                            <td style={cell}>{i + 1}</td>
                            <td style={cell}>{it.productName} [{it.productId}]</td>
                            <td style={cell}>{it.qty} ( {it.packSize} )</td>
                            <td style={{ ...cell, textAlign: 'right' }}>{fmt(it.unitPrice)}</td>
                            <td style={{ ...cell, textAlign: 'right' }}>{fmt(it.lineTotal)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ fontSize: '12px', textAlign: 'right', lineHeight: '1.9' }}>
                <div><b>Net Total</b> &nbsp;&nbsp; {fmt(row.subTotal)}</div>
                <div><b>Shipping Charge (+)</b> &nbsp;&nbsp; {fmt(row.shipping)}</div>
                <div><b>Additional (+)</b> &nbsp;&nbsp; {fmt(row.additional)}</div>
                <div><b>Discount (-)</b> &nbsp;&nbsp; {fmt(row.discount)}</div>
                <div style={{ fontSize: '14px' }}><b>Total Amount</b> &nbsp;&nbsp; {fmt(row.grandTotal)}</div>
            </div>

            {row.note && <div style={{ fontSize: '12px', marginTop: '20px' }}>Note: {row.note}</div>}

            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '50px', fontSize: '12px', color: '#555' }}>
                {['Received by', 'Store keeper', 'Authorised signature'].map(s => (
                    <div key={s} style={{ textAlign: 'center' }}>
                        <div style={{ borderTop: '1px dotted #999', paddingTop: '5px', minWidth: '160px' }}>{s}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ---- Add purchase ----
function AddPurchase({ suppliers, products, busy, onBack, onSave }) {
    const [form, setForm] = useState({
        supplierId: '', invoiceNo: '', purchaseDate: today, dueDate: '',
        officeId: 'head', shipping: '', additional: '', discount: '', note: '',
    });
    const [items, setItems] = useState([]);
    const [row, setRow] = useState({ productId: '', qty: '', unitPrice: '' });

    const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

    const addProduct = () => {
        if (!row.productId || !(Number(row.qty) > 0)) return;
        if (items.some(i => i.productId === row.productId)) return;
        const product = products.find(p => p.value === row.productId)?.product;
        setItems(prev => [...prev, {
            ...row,
            qty: Number(row.qty),
            unitPrice: Number(row.unitPrice || 0),
            name: product?.name || row.productId,
            packSize: product?.packSize || '',
            banned: Boolean(product?.bannedFrom),
        }]);
        setRow({ productId: '', qty: '', unitPrice: '' });
    };

    const subTotal = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
    const grandTotal = subTotal + Number(form.shipping || 0) + Number(form.additional || 0) - Number(form.discount || 0);

    const ready = Boolean(form.supplierId && form.purchaseDate && form.officeId && items.length) && !busy;
    const supplier = suppliers.find(s => s.value === form.supplierId)?.supplier;

    return (
        <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #e9ecef', fontSize: '15px', color: '#333' }}>Add Purchase</div>
            <div style={{ padding: '22px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '18px', alignItems: 'end', paddingBottom: '20px', borderBottom: '1px solid #f0f0f0' }}>
                    <div>
                        <label style={lbl}>Product</label>
                        <select value={row.productId} onChange={e => setRow(p => ({ ...p, productId: e.target.value }))} style={inp}>
                            <option value="">🔍 Please select</option>
                            {products.map(p => (
                                <option key={p.value} value={p.value}>
                                    {p.product?.bannedFrom ? '⛔ ' : ''}{p.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Quantity</label>
                        <input type="number" min="1" placeholder="Quantity" value={row.qty} onChange={e => setRow(p => ({ ...p, qty: e.target.value }))} style={inp} />
                    </div>
                    <div>
                        <label style={lbl}>Unit Price</label>
                        <input type="number" step="0.01" placeholder="Unit Price" value={row.unitPrice} onChange={e => setRow(p => ({ ...p, unitPrice: e.target.value }))} style={inp} />
                    </div>
                    <button onClick={addProduct} style={{ padding: '10px', background: '#4e73df', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>Add Product</button>
                </div>

                {items.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', margin: '18px 0' }}>
                        <thead>
                            <tr style={{ background: '#1a2035' }}>
                                <th style={thS}>#</th><th style={thS}>Product</th><th style={thS}>Qty</th>
                                <th style={{ ...thS, textAlign: 'right' }}>Unit Price</th>
                                <th style={{ ...thS, textAlign: 'right' }}>Line total</th><th style={thS}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((it, i) => (
                                <tr key={it.productId} style={{ background: it.banned ? '#fff5f5' : 'white' }}>
                                    <td style={tdS}>{i + 1}</td>
                                    <td style={tdS}>
                                        {it.name} [{it.productId}]
                                        {it.banned && <div style={{ color: '#dc3545', fontSize: 11, fontWeight: 700 }}>⛔ registration withdrawn — this purchase will be refused</div>}
                                    </td>
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px', marginTop: '22px' }}>
                    <div>
                        <label style={lbl}>Supplier Invoice No</label>
                        <input placeholder="Their invoice number" value={form.invoiceNo} onChange={set('invoiceNo')} style={inp} />
                    </div>
                    <div>
                        <label style={lbl}>Purchase Date <span style={{ color: '#dc3545' }}>*</span></label>
                        <input type="date" value={form.purchaseDate} onChange={set('purchaseDate')} style={{ ...inp, background: '#f8f9fa' }} />
                    </div>
                    <div>
                        <label style={lbl}>Supplier <span style={{ color: '#dc3545' }}>*</span></label>
                        <select value={form.supplierId} onChange={set('supplierId')} style={inp}>
                            <option value="">🔍 Please select</option>
                            {suppliers.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        {supplier && (
                            <div style={{ fontSize: 11, color: '#6c757d', marginTop: 4 }}>
                                Currently payable ৳ {fmt(supplier.balance)}
                            </div>
                        )}
                    </div>
                    <div>
                        <label style={lbl}>Receive into <span style={{ color: '#dc3545' }}>*</span></label>
                        <select value={form.officeId} onChange={set('officeId')} style={inp}>
                            {officeOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px', marginTop: '18px' }}>
                    <div>
                        <label style={lbl}>Due Date</label>
                        <input type="date" value={form.dueDate} onChange={set('dueDate')} style={inp} />
                    </div>
                    <div>
                        <label style={lbl}>Shipping (+)</label>
                        <input type="number" step="0.01" value={form.shipping} onChange={set('shipping')} style={inp} />
                    </div>
                    <div>
                        <label style={lbl}>Additional (+)</label>
                        <input type="number" step="0.01" value={form.additional} onChange={set('additional')} style={inp} />
                    </div>
                    <div>
                        <label style={lbl}>Discount (-)</label>
                        <input type="number" step="0.01" value={form.discount} onChange={set('discount')} style={inp} />
                    </div>
                </div>

                <div style={{ marginTop: '18px' }}>
                    <label style={lbl}>Notes</label>
                    <textarea placeholder="Notes" value={form.note} onChange={set('note')} style={{ ...inp, height: '70px', resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', alignItems: 'center', marginTop: '18px' }}>
                    <div style={{ fontSize: '14px', color: '#495057' }}>
                        Total <strong style={{ color: '#1a2035', fontSize: '16px' }}>৳ {fmt(grandTotal)}</strong>
                    </div>
                    <button onClick={onBack} style={{ padding: '8px 22px', background: '#4e73df', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>Back</button>
                    <button onClick={() => onSave({ ...form, lines: items })} disabled={!ready}
                        style={{ padding: '8px 22px', background: ready ? '#1e7e34' : '#adb5bd', color: 'white', border: 'none', borderRadius: '5px', cursor: ready ? 'pointer' : 'not-allowed', fontSize: '14px' }}>
                        {busy ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const emptyF = { supplierId: '', date: '', invoice: '' };

function Purchase() {
    const [view, setView] = useState('list');
    const [detail, setDetail] = useState(null);
    const [draft, setDraft] = useState(emptyF);
    const [applied, setApplied] = useState(emptyF);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);

    const load = useCallback(() => listPurchases(), []);
    const { rows: purchases, loading, error, reload } = useCollection(load, { what: 'purchases' });
    const { flash, say, busy, run } = useFlash();

    const loadMasters = useCallback(() => {
        supplierOptions().then(setSuppliers).catch(() => setSuppliers([]));
        // status: null → a banned product is still Active, but a withdrawn one
        // must be visible here so the refusal can be demonstrated rather than
        // hidden (UNIQUE-FEATURES.md §5, Feature 2).
        productOptions().then(setProducts).catch(() => setProducts([]));
    }, []);

    useEffect(() => { loadMasters(); }, [loadMasters]);

    const handleGo = () => setApplied(draft);
    const handleClear = () => { setDraft(emptyF); setApplied(emptyF); };

    const handleSave = (payload) => run(async () => {
        const saved = await createPurchase(payload);
        say('ok', `Purchase ${saved.purchaseNo} received — stock is up and the payable rose by ৳ ${fmt(saved.grandTotal)}.`);
        setView('list');
        loadMasters();
        await reload();
    });

    const handleOpen = (p) => run(async () => setDetail(await getPurchaseWithItems(p.purchaseNo)));

    const handleCancel = (p) => {
        const reason = window.prompt(`Why is purchase ${p.purchaseNo} being cancelled? The stock comes back out and the payable is reversed.`);
        if (!reason) return;
        run(async () => {
            await cancelPurchase(p.purchaseNo, reason);
            say('ok', `${p.purchaseNo} cancelled — stock and payable reversed.`);
            loadMasters();
            await reload();
        });
    };

    const filtered = purchases.filter(p => {
        if (applied.supplierId && p.supplierId !== applied.supplierId) return false;
        if (applied.date && formatDate(p.purchaseDate) !== applied.date) return false;
        if (applied.invoice) {
            const k = applied.invoice.toLowerCase();
            if (!(p.invoiceNo || '').toLowerCase().includes(k) && !p.purchaseNo.toLowerCase().includes(k)) return false;
        }
        return true;
    });

    const notices = (
        <>
            {loading && view === 'list' && !detail && <Notice tone="info">Loading purchases…</Notice>}
            {error && <Notice tone="warn">{error}</Notice>}
            {flash && <Notice tone={flash.tone}>{flash.text}</Notice>}
        </>
    );

    if (view === 'add') {
        return (
            <div>
                {notices}
                <AddPurchase suppliers={suppliers} products={products} busy={busy}
                    onBack={() => setView('list')} onSave={handleSave} />
            </div>
        );
    }

    if (detail) {
        return (
            <div>
                {notices}
                <PurchaseDetail row={detail} onBack={() => setDetail(null)} />
            </div>
        );
    }

    const fInp = { padding: '9px 12px', border: '1px solid #ced4da', borderRadius: '5px', fontSize: '13px' };

    return (
        <div>
            {notices}

            <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: '22px' }}>
                <div style={{ borderBottom: '2px solid #0d6efd', paddingBottom: '14px', marginBottom: '18px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#0d6efd' }}>🛒 Purchase</div>
                    <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '2px' }}>Detailed purchase record</div>
                </div>

                <div style={{ background: '#f0f9ff', padding: '14px 16px', borderRadius: '5px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '18px' }}>
                    <select value={draft.supplierId} onChange={e => setDraft(p => ({ ...p, supplierId: e.target.value }))} style={{ ...fInp, minWidth: '300px' }}>
                        <option value="">🔍 Please select</option>
                        {suppliers.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <input type="date" value={draft.date} onChange={e => setDraft(p => ({ ...p, date: e.target.value }))} style={{ ...fInp, width: '200px' }} />
                    <input placeholder="Purchase or invoice no" value={draft.invoice} onChange={e => setDraft(p => ({ ...p, invoice: e.target.value }))} style={{ ...fInp, width: '200px' }} />
                    <button onClick={handleGo} style={{ padding: '9px 20px', background: '#1e7e34', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>🔍 Go</button>
                    <button onClick={handleClear} style={{ padding: '9px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>✕ Clear</button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#1a2035' }}>
                                <th style={{ ...thS, width: '55px' }}>No</th>
                                <th style={thS}>Purchase No</th>
                                <th style={thS}>Supplier</th>
                                <th style={thS}>Invoice no</th>
                                <th style={thS}>Date</th>
                                <th style={thS}>Office</th>
                                <th style={{ ...thS, textAlign: 'right' }}>Amount</th>
                                <th style={thS}>Status</th>
                                <th style={{ ...thS, textAlign: 'right' }}>
                                    Action&nbsp;
                                    <button onClick={() => setView('add')} style={{ padding: '3px 11px', background: '#28a745', color: 'white', border: 'none', borderRadius: '3px', fontSize: '12px', cursor: 'pointer' }}>Add</button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={9} style={{ ...tdS, textAlign: 'center', padding: '30px', color: '#adb5bd' }}>
                                    {loading ? 'Loading…' : 'No data found'}
                                </td></tr>
                            ) : filtered.map((p, i) => (
                                <tr key={p.purchaseNo} style={{ background: i % 2 === 0 ? 'white' : '#f4f8fb', opacity: p.status === 'Cancelled' ? 0.55 : 1 }}>
                                    <td style={{ ...tdS, textAlign: 'center' }}>{i + 1}</td>
                                    <td style={tdS}>{p.purchaseNo}</td>
                                    <td style={tdS}>{p.supplierName} [{p.supplierCode}]</td>
                                    <td style={tdS}>{p.invoiceNo}</td>
                                    <td style={{ ...tdS, whiteSpace: 'nowrap' }}>{formatDate(p.purchaseDate)}</td>
                                    <td style={tdS}>{officeLabel(p.officeId)}</td>
                                    <td style={{ ...tdS, textAlign: 'right', fontWeight: 600, textDecoration: p.status === 'Cancelled' ? 'line-through' : 'none' }}>{fmt(p.grandTotal)}</td>
                                    <td style={tdS}><Badge color={p.status === 'Cancelled' ? '#dc3545' : '#28a745'}>{p.status}</Badge></td>
                                    <td style={{ ...tdS, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                        <button onClick={() => handleOpen(p)} disabled={busy} title="View" style={{ padding: '6px 11px', background: '#4e73df', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', marginRight: 4 }}>👁</button>
                                        {p.status !== 'Cancelled' && (
                                            <button onClick={() => handleCancel(p)} disabled={busy} title="Cancel — reverses stock and payable" style={{ padding: '6px 11px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>🗑</button>
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

export default Purchase;
