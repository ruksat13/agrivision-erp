import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    listCustomers, listProducts, getCustomer, getDealerLicences,
    createSale, licenceStatus, formatDate, ServiceError, PAYMENT_TYPE, OFFICE,
    OVERRIDE_ROLES,
} from '../services';
import { useAuth } from '../context/AuthContext';
import {
    checkSaleRules, applyOverride, removeOverride,
    unresolvedBlocks, canSave, summarise, registeredRuleCount,
} from '../rules/checkSaleRules';

// The one screen that creates a sale. Every enforcement rule is applied here —
// see src/rules/checkSaleRules.js.
//
// It is built to survive an empty or unreachable database: the lists load
// behind try/catch, a failure leaves the dropdowns empty and shows a notice,
// and the form still renders so the layout can be reviewed. Saving is disabled
// until there is something real to save.

const card = {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    marginBottom: '16px',
};

const inp = {
    padding: '9px 12px', borderRadius: '6px', border: '1px solid #dee2e6',
    fontSize: '13px', width: '100%', boxSizing: 'border-box',
};

const lbl = { fontSize: '12px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '5px' };
const thS = { padding: '11px 12px', color: 'white', fontWeight: '700', fontSize: '13px', textAlign: 'left' };
const tdS = { padding: '10px 12px', fontSize: '13px', color: '#333', borderBottom: '1px solid #f0f0f0' };

const btn = (bg, extra = {}) => ({
    background: bg, color: 'white', border: 'none', borderRadius: '6px',
    padding: '9px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, ...extra,
});

// Local date, never toISOString() — see the note at core.js:101. This seeds
// saleDate, which createSale() stores and which Feature 1 checks licence expiry
// against and Feature 2 checks the ban date against. At UTC+6 the UTC form
// yields yesterday between 00:00 and 06:00 local, gating an early-morning sale
// on the wrong day's rules.
const today = () => formatDate(new Date());
const money = (n) => (Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100);
const fmt = (n) => money(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Notice bar shown when the data source is unreachable ──────────────────

function Notice({ tone = 'warn', children }) {
    const tones = {
        warn: { bg: '#fff8e1', border: '#ffc107', color: '#856404' },
        error: { bg: '#f8d7da', border: '#dc3545', color: '#721c24' },
        ok: { bg: '#d4edda', border: '#28a745', color: '#155724' },
        info: { bg: '#e7f1ff', border: '#0d6efd', color: '#084298' },
    };
    const t = tones[tone] || tones.warn;
    return (
        <div style={{
            background: t.bg, border: `1px solid ${t.border}`, color: t.color,
            borderRadius: '6px', padding: '10px 14px', fontSize: '13px', marginBottom: '16px', lineHeight: 1.6,
        }}>
            {children}
        </div>
    );
}

// ── Rule results panel ────────────────────────────────────────────────────

// `canOverride` is the caller's role tested against OVERRIDE_ROLES. A Sales
// Officer raises the order and is the person a block is aimed at, so they never
// see the Override button — PROJECT-OUTLINE.md §3.4 makes waiving a block the
// Area Manager's decision. firestore.rules refuses the rule_override audit
// entry from anyone else as well; this half only keeps the screen honest.
function RulePanel({ results, onOverride, onUndoOverride, canOverride }) {
    const [openIndex, setOpenIndex] = useState(null);
    const [reason, setReason] = useState('');

    if (!results || results.length === 0) {
        return (
            <div style={{ ...card, borderLeft: '4px solid #28a745' }}>
                <div style={{ fontWeight: 700, color: '#1a2035', marginBottom: 4 }}>✓ Rule checks</div>
                <div style={{ fontSize: '13px', color: '#6c757d' }}>
                    No issues.{' '}
                    {registeredRuleCount() === 0 && (
                        <span>
                            <strong>No rules are registered yet</strong> — the engine is wired up but
                            Features 1 and 2 have not been added to the registry in
                            <code style={{ margin: '0 4px' }}>src/rules/checkSaleRules.js</code>.
                        </span>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div style={{ ...card, borderLeft: `4px solid ${canSave(results) ? '#fd7e14' : '#dc3545'}` }}>
            <div style={{ fontWeight: 700, color: '#1a2035', marginBottom: 10 }}>
                Rule checks — {summarise(results)}
            </div>

            {results.map((r, i) => {
                const isBlock = r.level === 'block';
                const done = r.overridden;
                const colour = done ? '#28a745' : isBlock ? '#dc3545' : '#fd7e14';

                return (
                    <div key={`${r.code}-${r.productId}-${i}`}
                        style={{ border: `1px solid ${colour}33`, borderLeft: `3px solid ${colour}`, borderRadius: 5, padding: '10px 12px', marginBottom: 8, background: '#fcfcfd' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <div style={{ flex: '1 1 320px' }}>
                                <span style={{ background: colour, color: 'white', borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 700, marginRight: 8 }}>
                                    {done ? 'OVERRIDDEN' : r.level.toUpperCase()}
                                </span>
                                <span style={{ fontSize: 12, color: '#6c757d', fontFamily: 'monospace' }}>{r.code}</span>
                                <div style={{ fontSize: 13, color: '#1a2035', marginTop: 4 }}>{r.message}</div>
                                {done && (
                                    <div style={{ fontSize: 12, color: '#155724', marginTop: 4 }}>
                                        Reason recorded: “{r.overrideReason}”
                                    </div>
                                )}
                            </div>

                            <div style={{ flexShrink: 0 }}>
                                {isBlock && r.overridable && !done && canOverride && (
                                    <button onClick={() => { setOpenIndex(openIndex === i ? null : i); setReason(''); }}
                                        style={btn('#fd7e14', { padding: '6px 14px', fontSize: 12 })}>
                                        Override…
                                    </button>
                                )}
                                {isBlock && r.overridable && !done && !canOverride && (
                                    <span style={{ fontSize: 11, color: '#6c757d', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
                                        Area Manager only
                                    </span>
                                )}
                                {done && (
                                    <button onClick={() => onUndoOverride(i)}
                                        style={btn('#6c757d', { padding: '6px 14px', fontSize: 12 })}>
                                        Undo
                                    </button>
                                )}
                            </div>
                        </div>

                        {openIndex === i && (
                            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed #dee2e6' }}>
                                <label style={lbl}>
                                    Written reason <span style={{ color: '#dc3545' }}>*</span>
                                    <span style={{ fontWeight: 400, color: '#6c757d' }}> — recorded in the audit log against this invoice</span>
                                </label>
                                <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
                                    placeholder="Why is this sale permitted despite the block?"
                                    style={{ ...inp, resize: 'vertical' }} />
                                <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                                    <button onClick={() => setOpenIndex(null)} style={btn('#6c757d', { padding: '6px 14px', fontSize: 12 })}>Cancel</button>
                                    <button
                                        disabled={!reason.trim()}
                                        onClick={() => { onOverride(i, reason); setOpenIndex(null); setReason(''); }}
                                        style={{ ...btn(reason.trim() ? '#28a745' : '#adb5bd', { padding: '6px 14px', fontSize: 12 }), cursor: reason.trim() ? 'pointer' : 'not-allowed' }}>
                                        Record override
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── The screen ────────────────────────────────────────────────────────────

function SalesEntry() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    // Who may waive a block. Read from the signed-in profile's role, which
    // comes from users/{uid} — the same field firestore.rules tests.
    const canOverride = OVERRIDE_ROLES.includes(currentUser?.role);

    // reference data
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [dataNotice, setDataNotice] = useState(null);
    const [loading, setLoading] = useState(true);

    // order header
    const [customerId, setCustomerId] = useState('');
    const [customer, setCustomer] = useState(null);
    const [licences, setLicences] = useState([]);
    const [saleDate, setSaleDate] = useState(today);
    const [dueDate, setDueDate] = useState('');
    const [paymentType, setPaymentType] = useState('Credit');
    const [officeId, setOfficeId] = useState('head');

    // lines
    const [lines, setLines] = useState([]);
    const [draft, setDraft] = useState({ productId: '', qty: '', unitPrice: '' });

    // charges
    const [discount, setDiscount] = useState('');
    const [shipping, setShipping] = useState('');
    const [vat, setVat] = useState('');
    const [paidAmount, setPaidAmount] = useState('');

    // rules + save
    const [ruleResults, setRuleResults] = useState([]);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [saved, setSaved] = useState(null);

    // ── Load reference data. A failure must not take the screen down. ─────
    useEffect(() => {
        let alive = true;
        (async () => {
            const problems = [];
            let cs = [];
            let ps = [];
            try { cs = await listCustomers(); } catch (e) { problems.push(`dealers (${e.code || e.message})`); }
            try { ps = await listProducts(); } catch (e) { problems.push(`products (${e.code || e.message})`); }
            if (!alive) return;

            setCustomers(cs);
            setProducts(ps);
            setLoading(false);

            if (problems.length) {
                setDataNotice({
                    tone: 'warn',
                    text: `Could not load ${problems.join(' and ')}. The form is shown so the layout can be reviewed, but there is nothing to select yet.`,
                });
            } else if (cs.length === 0 || ps.length === 0) {
                setDataNotice({
                    tone: 'info',
                    text: 'The database is reachable but empty. Run the seed script to populate it: node scripts/seed.mjs',
                });
            }
        })();
        return () => { alive = false; };
    }, []);

    // ── Dealer selection pulls the dealer and their licences ─────────────
    useEffect(() => {
        let alive = true;
        if (!customerId) { setCustomer(null); setLicences([]); return; }
        (async () => {
            let c = null;
            let ls = [];
            try { c = await getCustomer(customerId); } catch (e) { /* leave null */ }
            try { ls = await getDealerLicences(customerId); } catch (e) { /* leave empty */ }
            if (!alive) return;
            setCustomer(c || customers.find(x => x.code === customerId) || null);
            setLicences(ls);
        })();
        return () => { alive = false; };
    }, [customerId, customers]);

    // ── Totals ───────────────────────────────────────────────────────────
    const totals = useMemo(() => {
        const subTotal = money(lines.reduce((s, l) => s + l.lineTotal, 0));
        const grandTotal = money(subTotal - money(discount) + money(shipping) + money(vat));
        const paid = paidAmount === '' ? (paymentType === 'Cash' ? grandTotal : 0) : money(paidAmount);
        return { subTotal, grandTotal, paidAmount: paid, dueAmount: money(grandTotal - paid) };
    }, [lines, discount, shipping, vat, paidAmount, paymentType]);

    // ── Run the rules whenever the order changes ─────────────────────────
    const runRules = useCallback(async () => {
        if (!customer || lines.length === 0) { setRuleResults([]); return; }
        const results = await checkSaleRules({
            customer,
            licences,
            lines,
            saleDate: new Date(saleDate),
            totals,
        });
        // Preserve overrides already granted for the same code + product
        setRuleResults(prev => results.map(r => {
            const kept = prev.find(p => p.code === r.code && p.productId === r.productId && p.overridden);
            return kept ? { ...r, ...kept } : r;
        }));
    }, [customer, licences, lines, saleDate, totals]);

    useEffect(() => { runRules(); }, [runRules]);

    // ── Line handling ────────────────────────────────────────────────────
    const selectedProduct = products.find(p => p.code === draft.productId) || null;

    const onPickProduct = (code) => {
        const p = products.find(x => x.code === code);
        setDraft({ productId: code, qty: draft.qty, unitPrice: p ? String(p.mrp) : '' });
    };

    const addLine = () => {
        if (!selectedProduct) return;
        const qty = Number(draft.qty);
        const unitPrice = money(draft.unitPrice);
        if (!qty || qty <= 0) return;

        setLines(prev => {
            const existing = prev.findIndex(l => l.product.code === selectedProduct.code);
            if (existing >= 0) {
                const next = [...prev];
                const merged = next[existing].qty + qty;
                next[existing] = { ...next[existing], qty: merged, unitPrice, lineTotal: money(merged * unitPrice) };
                return next;
            }
            return [...prev, { product: selectedProduct, qty, unitPrice, lineTotal: money(qty * unitPrice) }];
        });
        setDraft({ productId: '', qty: '', unitPrice: '' });
    };

    const removeLine = (code) => setLines(prev => prev.filter(l => l.product.code !== code));

    const changeQty = (code, qty) => setLines(prev => prev.map(l =>
        l.product.code === code
            ? { ...l, qty: Number(qty) || 0, lineTotal: money((Number(qty) || 0) * l.unitPrice) }
            : l));

    // ── Overrides ────────────────────────────────────────────────────────
    const handleOverride = (index, reason) => {
        try {
            // The signed-in profile, not a localStorage read: this is what the
            // audit entry is attributed to, so it has to be the account
            // Firebase Auth actually authenticated.
            setRuleResults(prev => applyOverride(prev, index, { user: currentUser, reason }));
        } catch (err) {
            setSaveError(err.message);
        }
    };

    const handleUndoOverride = (index) => setRuleResults(prev => removeOverride(prev, index));

    // ── Save ─────────────────────────────────────────────────────────────
    const blocked = unresolvedBlocks(ruleResults).length > 0;
    const ready = Boolean(customer) && lines.length > 0 && !blocked && !saving;

    const handleSave = async () => {
        setSaving(true);
        setSaveError(null);
        try {
            const sale = await createSale({
                customerId: customer.code,
                officeId,
                saleDate,
                dueDate: dueDate || null,
                paymentType,
                discount: money(discount),
                shipping: money(shipping),
                vat: money(vat),
                paidAmount: totals.paidAmount,
                lines: lines.map(l => ({ productId: l.product.code, qty: l.qty, unitPrice: l.unitPrice })),
                ruleChecks: ruleResults,
            });
            setSaved(sale);
        } catch (err) {
            setSaveError(err instanceof ServiceError
                ? err.message
                : `Could not save: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setSaved(null); setCustomerId(''); setCustomer(null); setLicences([]);
        setLines([]); setDraft({ productId: '', qty: '', unitPrice: '' });
        setDiscount(''); setShipping(''); setVat(''); setPaidAmount('');
        setRuleResults([]); setSaveError(null);
    };

    // ── Saved confirmation ───────────────────────────────────────────────
    if (saved) {
        return (
            <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 720 }}>
                <div style={{ ...card, borderLeft: '4px solid #28a745' }}>
                    <h2 style={{ margin: '0 0 8px', color: '#28a745' }}>✓ Order saved</h2>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2035' }}>{saved.invoiceNo}</div>
                    <div style={{ fontSize: 13, color: '#495057', marginTop: 6 }}>
                        {saved.customerName} — {saved.items.length} line{saved.items.length > 1 ? 's' : ''} — ৳ {fmt(saved.grandTotal)}
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                        <button onClick={resetForm} style={btn('#0d6efd')}>+ New order</button>
                        <button onClick={() => navigate('/sales')} style={btn('#6c757d')}>Back to Sales</button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Form ─────────────────────────────────────────────────────────────
    return (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div>
                    <h2 style={{ color: '#0d6efd', margin: 0 }}>🛒 New Sales Order</h2>
                    <p style={{ color: '#6c757d', fontSize: 13, margin: '2px 0 0' }}>
                        Rules are applied here before the order can be saved
                    </p>
                </div>
                <button onClick={() => navigate('/sales')} style={btn('#6c757d')}>← Back to Sales</button>
            </div>

            {loading && <Notice tone="info">Loading dealers and products…</Notice>}
            {dataNotice && <Notice tone={dataNotice.tone}>{dataNotice.text}</Notice>}
            {saveError && <Notice tone="error"><strong>Not saved.</strong> {saveError}</Notice>}

            {/* ── Dealer and order header ── */}
            <div style={card}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16 }}>
                    <div style={{ gridColumn: 'span 2', minWidth: 0 }}>
                        <label style={lbl}>Dealer <span style={{ color: '#dc3545' }}>*</span></label>
                        <select value={customerId} onChange={e => setCustomerId(e.target.value)} style={inp}>
                            <option value="">
                                {customers.length ? '🔍 Select dealer' : '— no dealers available —'}
                            </option>
                            {customers.map(c => (
                                <option key={c.code} value={c.code}>{c.name} [{c.code}]</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Order date <span style={{ color: '#dc3545' }}>*</span></label>
                        <input type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} style={inp} />
                    </div>
                    <div>
                        <label style={lbl}>Due date</label>
                        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inp} />
                    </div>
                    <div>
                        <label style={lbl}>Payment</label>
                        <select value={paymentType} onChange={e => setPaymentType(e.target.value)} style={inp}>
                            {PAYMENT_TYPE.map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Office</label>
                        <select value={officeId} onChange={e => setOfficeId(e.target.value)} style={inp}>
                            {OFFICE.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>
                </div>

                {customer && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f0f0f0', display: 'flex', gap: 28, flexWrap: 'wrap', fontSize: 13 }}>
                        <div>
                            <div style={{ color: '#6c757d', fontSize: 11 }}>Outstanding</div>
                            <div style={{ fontWeight: 700, color: Number(customer.balance) > 0 ? '#dc3545' : '#28a745' }}>
                                ৳ {fmt(customer.balance)}
                            </div>
                        </div>
                        <div>
                            <div style={{ color: '#6c757d', fontSize: 11 }}>Credit limit</div>
                            <div style={{ fontWeight: 700, color: '#1a2035' }}>
                                {Number(customer.creditLimit) > 0 ? `৳ ${fmt(customer.creditLimit)}` : 'none set'}
                            </div>
                        </div>
                        <div>
                            <div style={{ color: '#6c757d', fontSize: 11 }}>Territory</div>
                            <div style={{ fontWeight: 700, color: '#1a2035' }}>{customer.territoryId || '—'}</div>
                        </div>
                        <div style={{ flex: '1 1 240px' }}>
                            <div style={{ color: '#6c757d', fontSize: 11 }}>Licences</div>
                            {licences.length === 0 ? (
                                <div style={{ fontWeight: 700, color: '#6c757d' }}>none on record</div>
                            ) : (
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                                    {licences.map(l => {
                                        const s = l.status || licenceStatus(l, new Date(saleDate));
                                        const bad = s === 'Expired';
                                        const soon = s.startsWith('Expiring');
                                        return (
                                            <span key={l.id} title={`${l.licenceNo} · ${s}`}
                                                style={{
                                                    background: bad ? '#f8d7da' : soon ? '#fff3cd' : '#d4edda',
                                                    color: bad ? '#721c24' : soon ? '#856404' : '#155724',
                                                    borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700,
                                                }}>
                                                {l.licenceType}: {s}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Add a line ── */}
            <div style={card}>
                <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr auto', gap: 14, alignItems: 'end' }}>
                    <div style={{ minWidth: 0 }}>
                        <label style={lbl}>Product</label>
                        <select value={draft.productId} onChange={e => onPickProduct(e.target.value)} style={inp}>
                            <option value="">
                                {products.length ? '🔍 Select product' : '— no products available —'}
                            </option>
                            {products.map(p => (
                                <option key={p.code} value={p.code}>{p.name} [{p.code}]</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Quantity</label>
                        <input type="number" min="1" value={draft.qty}
                            onChange={e => setDraft(d => ({ ...d, qty: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && addLine()}
                            placeholder="0" style={inp} />
                    </div>
                    <div>
                        <label style={lbl}>Unit price</label>
                        <input type="number" step="0.01" value={draft.unitPrice}
                            onChange={e => setDraft(d => ({ ...d, unitPrice: e.target.value }))}
                            placeholder="0.00" style={inp} />
                    </div>
                    <button onClick={addLine} disabled={!selectedProduct || !Number(draft.qty)}
                        style={{
                            ...btn(selectedProduct && Number(draft.qty) ? '#28a745' : '#adb5bd'),
                            cursor: selectedProduct && Number(draft.qty) ? 'pointer' : 'not-allowed',
                            whiteSpace: 'nowrap',
                        }}>
                        + Add line
                    </button>
                </div>

                {selectedProduct && (
                    <div style={{ marginTop: 10, fontSize: 12, color: '#6c757d' }}>
                        {selectedProduct.category} · {selectedProduct.packSize} · carton of {selectedProduct.cartonQty} · MRP ৳ {fmt(selectedProduct.mrp)}
                    </div>
                )}
            </div>

            {/* ── Lines ── */}
            <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#1a2035' }}>
                            <th style={{ ...thS, width: 50 }}>#</th>
                            <th style={thS}>Product</th>
                            <th style={{ ...thS, width: 110 }}>Qty</th>
                            <th style={{ ...thS, width: 120, textAlign: 'right' }}>Unit price</th>
                            <th style={{ ...thS, width: 140, textAlign: 'right' }}>Line total</th>
                            <th style={{ ...thS, width: 60 }} />
                        </tr>
                    </thead>
                    <tbody>
                        {lines.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ ...tdS, textAlign: 'center', padding: '36px', color: '#adb5bd' }}>
                                    No lines yet — pick a product above.
                                </td>
                            </tr>
                        ) : lines.map((l, i) => (
                            <tr key={l.product.code} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                <td style={{ ...tdS, textAlign: 'center' }}>{i + 1}</td>
                                <td style={tdS}>
                                    <div style={{ fontWeight: 600, color: '#1a2035' }}>{l.product.name}</div>
                                    <div style={{ fontSize: 11, color: '#6c757d' }}>
                                        {l.product.code} · {l.product.category}
                                    </div>
                                </td>
                                <td style={tdS}>
                                    <input type="number" min="1" value={l.qty}
                                        onChange={e => changeQty(l.product.code, e.target.value)}
                                        style={{ ...inp, padding: '6px 8px' }} />
                                </td>
                                <td style={{ ...tdS, textAlign: 'right' }}>{fmt(l.unitPrice)}</td>
                                <td style={{ ...tdS, textAlign: 'right', fontWeight: 700 }}>{fmt(l.lineTotal)}</td>
                                <td style={{ ...tdS, textAlign: 'center' }}>
                                    <button onClick={() => removeLine(l.product.code)}
                                        title="Remove line"
                                        style={{ ...btn('#dc3545'), padding: '4px 9px', fontSize: 12 }}>🗑</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── Rules ── */}
            <RulePanel results={ruleResults} onOverride={handleOverride} onUndoOverride={handleUndoOverride} canOverride={canOverride} />

            {/* ── Totals and save ── */}
            <div style={card}>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14, flex: '1 1 420px' }}>
                        <div>
                            <label style={lbl}>Discount</label>
                            <input type="number" step="0.01" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0.00" style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Shipping</label>
                            <input type="number" step="0.01" value={shipping} onChange={e => setShipping(e.target.value)} placeholder="0.00" style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>VAT</label>
                            <input type="number" step="0.01" value={vat} onChange={e => setVat(e.target.value)} placeholder="0.00" style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Paid now</label>
                            <input type="number" step="0.01" value={paidAmount}
                                onChange={e => setPaidAmount(e.target.value)}
                                placeholder={paymentType === 'Cash' ? 'full amount' : '0.00'} style={inp} />
                        </div>
                    </div>

                    <div style={{ minWidth: 240, fontSize: 13 }}>
                        {[
                            ['Sub total', totals.subTotal],
                            ['Discount (−)', money(discount)],
                            ['Shipping (+)', money(shipping)],
                            ['VAT (+)', money(vat)],
                        ].map(([label, value]) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#495057' }}>
                                <span>{label}</span><span>{fmt(value)}</span>
                            </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', marginTop: 4, borderTop: '2px solid #1a2035', fontSize: 15, fontWeight: 700, color: '#1a2035' }}>
                            <span>Grand total</span><span>৳ {fmt(totals.grandTotal)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#6c757d' }}>
                            <span>Paid</span><span>{fmt(totals.paidAmount)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontWeight: 700, color: totals.dueAmount > 0 ? '#dc3545' : '#28a745' }}>
                            <span>Due</span><span>৳ {fmt(totals.dueAmount)}</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18, paddingTop: 16, borderTop: '1px solid #f0f0f0', alignItems: 'center', flexWrap: 'wrap' }}>
                    {blocked && (
                        <span style={{ fontSize: 12, color: '#dc3545', marginRight: 'auto' }}>
                            {unresolvedBlocks(ruleResults).length} block(s) must be resolved or overridden before this order can be saved.
                        </span>
                    )}
                    <button onClick={() => navigate('/sales')} style={btn('#6c757d')}>Cancel</button>
                    <button onClick={handleSave} disabled={!ready}
                        style={{ ...btn(ready ? '#28a745' : '#adb5bd'), cursor: ready ? 'pointer' : 'not-allowed', padding: '10px 26px' }}>
                        {saving ? 'Saving…' : '💾 Save order'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SalesEntry;
