import React, { useState, useEffect, useCallback } from 'react';
import {
    listCommissions, createCommission, approveCommission, cancelCommission,
    commissionFromPercent, customerOptions, supplierOptions, productOptions,
    formatDate, COMMISSION_BASIS, COMMISSION_METHOD,
} from '../services';
import { Notice, useFlash, useCollection } from '../components/Notice';

// Commissions for a customer or a supplier — ONE component, two modes, the
// same treatment OpeningBalance.js gets and for the same reason.
//
// Three things changed while wiring Save (SCREEN-AUDIT.md §2.1):
//
//   · The type was a `types[]` array rendered as two badges — Yearly+Amount,
//     Purchase+Percentage. Those are two independent choices, so they are two
//     fields: `basis` (what the commission is for) and `method` (how it was
//     worked out). See §10.
//   · The form collected supplier, type, date, amount and note, but the table
//     renders the purchase list, the base total and the percentage as well. A
//     saved row would have had a blank "Purchase | Product | Year" column —
//     the §2.3 defect. Those fields are on the form now, and a percentage
//     commission works its own amount out.
//   · Clicking a purchase number opened a full invoice built from one
//     hardcoded `invoiceData` object, so every reference showed the same
//     fabricated invoice — the §4.3 defect. Until `purchases` exists (§2.1.1
//     group D) the references are shown as what they are: recorded numbers.
//
// A commission does not move the party's balance. Awarding is not paying.

const thS = { padding: '10px 12px', color: 'white', fontWeight: '600', fontSize: '13px', textAlign: 'left', whiteSpace: 'nowrap' };
const tdS = { padding: '9px 12px', fontSize: '12px', color: '#333', borderBottom: '1px solid #f0f0f0', verticalAlign: 'top' };
const inp = { width: '100%', padding: '9px 12px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' };
const lbl = { fontSize: '13px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '5px' };

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = formatDate(new Date());

const typeColors = {
    Yearly: '#28a745', Amount: '#0d6efd', Percentage: '#20c997',
    Product: '#fd7e14', Purchase: '#6f42c1', Invoice: '#6f42c1', Travel: '#0d6efd',
};

const Badge = ({ color, children }) => (
    <span style={{ background: color, color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '600', display: 'inline-block' }}>{children}</span>
);

const IBtn = ({ bg, onClick, title, children, disabled }) => (
    <button onClick={onClick} title={title} disabled={disabled}
        style={{ padding: '4px 8px', background: disabled ? '#adb5bd' : bg, color: 'white', border: 'none', borderRadius: '4px', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '13px', marginRight: '3px' }}>{children}</button>
);

const MODES = {
    customer: { title: 'Customer Commission', who: 'Customer', options: customerOptions, refLabel: 'Invoice numbers' },
    supplier: { title: 'Supplier Commission', who: 'Supplier', options: supplierOptions, refLabel: 'Purchase numbers' },
};

const EMPTY = {
    partyId: '', basis: 'Yearly', method: 'Amount', percent: '', baseAmount: '',
    productId: '', refs: '', amount: '', date: today, note: '',
};

function AddForm({ party, parties, products, busy, onBack, onSave }) {
    const mode = MODES[party];
    const [form, setForm] = useState(EMPTY);
    const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

    const isPercent = form.method === 'Percentage';
    const isProduct = form.basis === 'Product';

    // A percentage commission computes its own amount, but the field stays
    // editable — a figure that was agreed is not always the one arithmetic
    // gives, and the agreed one is what gets paid.
    const computed = isPercent && form.baseAmount && form.percent
        ? commissionFromPercent(form.baseAmount, form.percent)
        : null;

    const useComputed = () => setForm(p => ({ ...p, amount: String(computed) }));

    const ready = Boolean(
        form.partyId && form.basis && form.method && Number(form.amount) > 0 && form.date
        && (!isPercent || form.percent)
        && (!isProduct || form.productId),
    ) && !busy;

    return (
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                {mode.title}
            </div>
            <div style={{ padding: '24px 32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '18px', marginBottom: '18px' }}>
                    <div>
                        <label style={lbl}>{mode.who} <span style={{ color: '#dc3545' }}>*</span></label>
                        <select value={form.partyId} onChange={set('partyId')} style={inp}>
                            <option value="">{mode.who}</option>
                            {parties.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Basis <span style={{ color: '#dc3545' }}>*</span></label>
                        <select value={form.basis} onChange={set('basis')} style={inp}>
                            {COMMISSION_BASIS.map(t => <option key={t}>{t}</option>)}
                        </select>
                        <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px' }}>What the commission is for</div>
                    </div>
                    <div>
                        <label style={lbl}>Method <span style={{ color: '#dc3545' }}>*</span></label>
                        <select value={form.method} onChange={set('method')} style={inp}>
                            {COMMISSION_METHOD.map(t => <option key={t}>{t}</option>)}
                        </select>
                        <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px' }}>How it was worked out</div>
                    </div>
                </div>

                {isProduct && (
                    <div style={{ marginBottom: '18px' }}>
                        <label style={lbl}>Product <span style={{ color: '#dc3545' }}>*</span></label>
                        <select value={form.productId} onChange={set('productId')} style={{ ...inp, maxWidth: '520px' }}>
                            <option value="">🔍 Select product</option>
                            {products.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '18px', marginBottom: '18px' }}>
                    <div>
                        <label style={lbl}>Base amount {isPercent && <span style={{ color: '#dc3545' }}>*</span>}</label>
                        <input type="number" step="0.01" placeholder="Total the commission is taken on"
                            value={form.baseAmount} onChange={set('baseAmount')} style={inp} />
                    </div>
                    <div>
                        <label style={lbl}>Percentage {isPercent && <span style={{ color: '#dc3545' }}>*</span>}</label>
                        <input type="number" step="0.01" placeholder="e.g. 5" disabled={!isPercent}
                            value={form.percent} onChange={set('percent')}
                            style={{ ...inp, background: isPercent ? 'white' : '#f1f3f5' }} />
                    </div>
                    <div>
                        <label style={lbl}>Commission Amount <span style={{ color: '#dc3545' }}>*</span></label>
                        <input type="number" step="0.01" placeholder="Enter Amount" value={form.amount} onChange={set('amount')} style={inp} />
                        {computed != null && (
                            <div style={{ fontSize: '11px', marginTop: '4px' }}>
                                <span style={{ color: '#6c757d' }}>{form.percent}% of {fmt(form.baseAmount)} = {fmt(computed)} </span>
                                <button onClick={useComputed} style={{ background: 'none', border: 'none', color: '#0d6efd', cursor: 'pointer', fontSize: '11px', textDecoration: 'underline', padding: 0 }}>use this</button>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '18px', marginBottom: '18px' }}>
                    <div>
                        <label style={lbl}>{mode.refLabel}</label>
                        <input placeholder="AINP-2026-02-0002562, AINP-2026-03-0003143"
                            value={form.refs} onChange={set('refs')} style={inp} />
                        <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px' }}>
                            Comma separated. Recorded as text until the purchase register is migrated.
                        </div>
                    </div>
                    <div>
                        <label style={lbl}>Date <span style={{ color: '#dc3545' }}>*</span></label>
                        <input type="date" value={form.date} onChange={set('date')} style={{ ...inp, background: '#f8f9fa' }} />
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={lbl}>Note</label>
                    <textarea value={form.note} onChange={set('note')} style={{ ...inp, height: '70px', resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={onBack} style={{ padding: '8px 24px', background: '#0d6efd', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Back</button>
                    <button onClick={() => onSave({ ...form, refs: form.refs.split(',').map(r => r.trim()).filter(Boolean) })}
                        disabled={!ready}
                        style={{ padding: '8px 24px', background: ready ? '#28a745' : '#adb5bd', color: 'white', border: 'none', borderRadius: '6px', cursor: ready ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: '600' }}>
                        {busy ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const emptyFilter = { searchKey: '', ref: '', date: '', basis: '', method: '' };

function Commission({ party = 'supplier' }) {
    const mode = MODES[party];
    const [view, setView] = useState('list');
    const [open, setOpen] = useState(true);
    const [parties, setParties] = useState([]);
    const [products, setProducts] = useState([]);
    const [draft, setDraft] = useState(emptyFilter);
    const [applied, setApplied] = useState(emptyFilter);

    const load = useCallback(() => listCommissions({ party }), [party]);
    const { rows: records, loading, error, reload } = useCollection(load, { what: `${party} commissions` });
    const { flash, say, busy, run } = useFlash();

    useEffect(() => {
        mode.options().then(setParties).catch(() => setParties([]));
        productOptions().then(setProducts).catch(() => setProducts([]));
    }, [mode]);

    const handleGo = () => setApplied(draft);
    const handleClear = () => { setDraft(emptyFilter); setApplied(emptyFilter); };

    const handleSave = (form) => run(async () => {
        const saved = await createCommission({ ...form, party });
        say('ok', `Commission ${saved.code} saved as Pending.`);
        setView('list');
        await reload();
    });

    const handleApprove = (r) => run(async () => {
        await approveCommission(r.code);
        say('ok', `${r.code} approved.`);
        await reload();
    });

    const handleCancel = (r) => {
        const reason = window.prompt(`Why is commission ${r.code} being cancelled?`);
        if (!reason) return;
        run(async () => {
            await cancelCommission(r.code, reason);
            say('ok', `${r.code} cancelled.`);
            await reload();
        });
    };

    const filtered = records.filter(r => {
        if (applied.searchKey) {
            const k = applied.searchKey.toLowerCase();
            const hay = `${r.partyName || ''} ${r.partyCode || ''} ${r.code}`.toLowerCase();
            if (!hay.includes(k)) return false;
        }
        if (applied.ref && !(r.refs || []).some(x => x.toLowerCase().includes(applied.ref.toLowerCase()))) return false;
        if (applied.date && formatDate(r.date) !== applied.date) return false;
        if (applied.basis && r.basis !== applied.basis) return false;
        if (applied.method && r.method !== applied.method) return false;
        return true;
    });

    const notices = (
        <>
            {loading && view === 'list' && <Notice tone="info">Loading commissions…</Notice>}
            {error && <Notice tone="warn">{error}</Notice>}
            {flash && <Notice tone={flash.tone}>{flash.text}</Notice>}
        </>
    );

    if (view === 'add') {
        return (
            <div>
                {notices}
                <AddForm party={party} parties={parties} products={products} busy={busy}
                    onBack={() => setView('list')} onSave={handleSave} />
            </div>
        );
    }

    const filterInput = { padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px' };

    return (
        <div>
            {notices}

            <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                <div onClick={() => setOpen(!open)} style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: '700', fontSize: '14px', color: '#333', cursor: 'pointer', userSelect: 'none' }}>
                    {open ? '∨' : '>'} {mode.title} <span style={{ fontWeight: 400, color: '#6c757d' }}>({records.length})</span>
                </div>

                {open && (
                    <>
                        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <input placeholder="🔍 Search Key" value={draft.searchKey} onChange={e => setDraft(p => ({ ...p, searchKey: e.target.value }))} style={{ ...filterInput, width: '150px' }} />
                            <input placeholder={`🔍 ${party === 'supplier' ? 'Purchase' : 'Invoice'} No`} value={draft.ref} onChange={e => setDraft(p => ({ ...p, ref: e.target.value }))} style={{ ...filterInput, width: '150px' }} />
                            <input type="date" value={draft.date} onChange={e => setDraft(p => ({ ...p, date: e.target.value }))} style={filterInput} />
                            <select value={draft.basis} onChange={e => setDraft(p => ({ ...p, basis: e.target.value }))} style={{ ...filterInput, minWidth: '140px' }}>
                                <option value="">🔍 Basis</option>
                                {COMMISSION_BASIS.map(t => <option key={t}>{t}</option>)}
                            </select>
                            <select value={draft.method} onChange={e => setDraft(p => ({ ...p, method: e.target.value }))} style={{ ...filterInput, minWidth: '140px' }}>
                                <option value="">🔍 Method</option>
                                {COMMISSION_METHOD.map(t => <option key={t}>{t}</option>)}
                            </select>
                            <button onClick={handleGo} style={{ padding: '7px 18px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Go</button>
                            <button onClick={handleClear} style={{ padding: '7px 18px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Clear</button>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#1a2035' }}>
                                        <th style={{ ...thS, width: '36px', textAlign: 'center' }}>#</th>
                                        <th style={thS}>{mode.who}</th>
                                        <th style={thS}>Type</th>
                                        <th style={thS}>{party === 'supplier' ? 'Purchase' : 'Invoice'} | Product | Base</th>
                                        <th style={{ ...thS, textAlign: 'right' }}>Amount</th>
                                        <th style={thS}>Date</th>
                                        <th style={thS}>Note</th>
                                        <th style={thS}>Status</th>
                                        <th style={{ ...thS, textAlign: 'right' }}>
                                            Action&nbsp;
                                            <button onClick={() => setView('add')} style={{ padding: '3px 10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>🌿 Add</button>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr><td colSpan={9} style={{ ...tdS, textAlign: 'center', padding: '30px', color: '#6c757d' }}>
                                            {loading ? 'Loading…' : 'No data found'}
                                        </td></tr>
                                    ) : filtered.map((r, i) => (
                                        <tr key={r.code} style={{ background: i % 2 === 0 ? 'white' : '#fafafa', opacity: r.status === 'Cancelled' ? 0.55 : 1 }}>
                                            <td style={{ ...tdS, textAlign: 'center' }}>{i + 1}</td>
                                            <td style={tdS}>
                                                <div style={{ fontWeight: '600', color: '#1a2035' }}>{r.partyName} [{r.partyCode}]</div>
                                                <div style={{ color: '#6c757d', fontSize: '11px' }}>{r.code}</div>
                                            </td>
                                            <td style={tdS}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
                                                    <Badge color={typeColors[r.basis] || '#6c757d'}>{r.basis}</Badge>
                                                    <Badge color={typeColors[r.method] || '#6c757d'}>{r.method}</Badge>
                                                </div>
                                            </td>
                                            <td style={tdS}>
                                                {(r.refs || []).map(ref => (
                                                    <div key={ref} style={{ fontSize: '11px', color: '#495057', marginBottom: '2px' }}>{ref}</div>
                                                ))}
                                                {r.productName && (
                                                    <div>
                                                        <div style={{ fontWeight: '600' }}>{r.productName}</div>
                                                        <div style={{ color: '#6c757d', fontSize: '11px' }}>{r.productId}</div>
                                                    </div>
                                                )}
                                                {r.baseAmount != null && (
                                                    <div style={{ fontWeight: '700', color: '#1a2035', marginTop: '4px' }}>{fmt(r.baseAmount)}</div>
                                                )}
                                                {r.percent != null && (
                                                    <div style={{ fontWeight: '700', color: '#20c997' }}>{r.percent}%</div>
                                                )}
                                            </td>
                                            <td style={{ ...tdS, textAlign: 'right', fontWeight: '600', textDecoration: r.status === 'Cancelled' ? 'line-through' : 'none' }}>{fmt(r.amount)}</td>
                                            <td style={{ ...tdS, whiteSpace: 'nowrap' }}>{formatDate(r.date)}</td>
                                            <td style={{ ...tdS, fontSize: '11px', maxWidth: '200px' }}>{r.note}</td>
                                            <td style={tdS}>
                                                <Badge color={r.status === 'Approved' ? '#28a745' : r.status === 'Cancelled' ? '#dc3545' : '#0dcaf0'}>{r.status}</Badge>
                                            </td>
                                            <td style={{ ...tdS, whiteSpace: 'nowrap' }}>
                                                {r.status === 'Pending' && (
                                                    <IBtn bg="#0d6efd" disabled={busy} onClick={() => handleApprove(r)} title="Approve">✔</IBtn>
                                                )}
                                                {r.status !== 'Cancelled' && (
                                                    <IBtn bg="#dc3545" disabled={busy} onClick={() => handleCancel(r)} title="Cancel">🗑</IBtn>
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
        </div>
    );
}

export default Commission;
