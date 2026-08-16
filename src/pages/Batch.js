import React, { useState, useEffect, useCallback } from 'react';
import { CompanyHeader } from './Purchase';
import {
    listBoms, createBom, deactivateBom, productOptions, formatDate,
} from '../services';
import { Notice, useFlash, useCollection } from '../components/Notice';

// Bill of Materials, backed by Firestore.
//
// Thirteenth of the fourteen screens in SCREEN-AUDIT.md §2.1.
//
// The screen is reached from a menu entry called "Batch", but §3 item 1
// established that it never was a batch register — the fields are
// `no, product, pcode, date, items[{name, code, unit}]` with no lot number, no
// manufacturing date and no expiry date anywhere — and decision 2 in §7 renamed
// it. The collection is `boms` and the heading says Bill of Materials. The
// menu label is left for a separate change so this commit stays one thing.
//
// `ratio` is per unit of output, which is what lets Repacking multiply it out:
// a 50 ml bottle filled from a 200 litre drum consumes 0.05, and one bottle and
// one label each consume 1.

const thS = { padding: '11px 12px', color: 'white', fontWeight: '700', fontSize: '13px', textAlign: 'left', whiteSpace: 'nowrap' };
const tdS = { padding: '10px 12px', fontSize: '13px', color: '#333', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' };
const inp = { width: '100%', padding: '9px 12px', border: '1px solid #dee2e6', borderRadius: '5px', fontSize: '13px', boxSizing: 'border-box' };
const lbl = { fontSize: '14px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '7px' };
const cell = { border: '1px solid #999', padding: '7px', fontSize: '12px' };

const today = formatDate(new Date());

// ---- BOM detail (separate page) ----
function BomDetail({ row, onBack }) {
    return (
        <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: '24px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '20px' }}>
                <button onClick={() => window.print()} style={{ padding: '7px 14px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>🖨️</button>
                <button onClick={onBack} style={{ padding: '7px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '13px' }}>← Back</button>
            </div>

            <CompanyHeader />

            <div style={{ marginTop: '20px', marginBottom: '16px', fontSize: '13px' }}>
                <div style={{ fontWeight: '700', color: '#1a2035' }}>Bill of Materials — {row.bomNo}</div>
                <div style={{ fontWeight: '700' }}>{row.productName} [{row.productId}]</div>
                <div style={{ fontSize: '12px', color: '#555' }}>Effective from {formatDate(row.effectiveFrom)}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ ...cell, width: '55px' }}>S/N</th>
                        <th style={cell}>Material</th>
                        <th style={{ ...cell, width: '220px', textAlign: 'right' }}>Per unit of output</th>
                    </tr>
                </thead>
                <tbody>
                    {(row.items || []).map((it, i) => (
                        <tr key={it.productId}>
                            <td style={cell}>{i + 1}</td>
                            <td style={cell}>{it.name} [{it.productId}]</td>
                            <td style={{ ...cell, textAlign: 'right' }}>{Number(it.ratio).toFixed(3)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ marginTop: '14px', fontSize: '12px', color: '#6c757d' }}>
                A repacking run of N units consumes N × the figure in the last column, of each material.
            </div>
        </div>
    );
}

// ---- Add BOM ----
function AddBom({ products, busy, onBack, onSave }) {
    const [form, setForm] = useState({ productId: '', effectiveFrom: today });
    const [items, setItems] = useState([]);
    const [row, setRow] = useState({ productId: '', ratio: '' });

    const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

    const addMaterial = () => {
        if (!row.productId || !(Number(row.ratio) > 0)) return;
        if (row.productId === form.productId) return;
        if (items.some(i => i.productId === row.productId)) return;
        const product = products.find(p => p.value === row.productId)?.product;
        setItems(prev => [...prev, { productId: row.productId, ratio: Number(row.ratio), name: product?.name || row.productId }]);
        setRow({ productId: '', ratio: '' });
    };

    const ready = Boolean(form.productId && items.length) && !busy;

    return (
        <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #e9ecef', fontSize: '15px', color: '#333' }}>Add Bill of Materials</div>
            <div style={{ padding: '22px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '18px', marginBottom: '20px' }}>
                    <div>
                        <label style={lbl}>Product this recipe makes <span style={{ color: '#dc3545' }}>*</span></label>
                        <select value={form.productId} onChange={set('productId')} style={inp}>
                            <option value="">🔍 Please select</option>
                            {products.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Effective from</label>
                        <input type="date" value={form.effectiveFrom} onChange={set('effectiveFrom')} style={{ ...inp, background: '#f8f9fa' }} />
                    </div>
                </div>

                <fieldset style={{ border: '1px solid #dee2e6', borderRadius: '5px', padding: '18px 20px', marginBottom: '20px' }}>
                    <legend style={{ padding: '0 8px', fontSize: '16px', fontWeight: '700', color: '#333' }}>
                        Materials <span style={{ color: '#dc3545' }}>*</span>
                    </legend>
                    <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                        <div>
                            <label style={lbl}>Material</label>
                            <select value={row.productId} onChange={e => setRow(p => ({ ...p, productId: e.target.value }))} style={inp}>
                                <option value="">🔍 Please select</option>
                                {products.filter(p => p.value !== form.productId).map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Per unit of output</label>
                            <input type="number" step="0.001" min="0" placeholder="e.g. 0.050" value={row.ratio}
                                onChange={e => setRow(p => ({ ...p, ratio: e.target.value }))} style={inp} />
                        </div>
                        <button onClick={addMaterial} style={{ padding: '10px 16px', background: '#4e73df', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>Add material</button>
                    </div>
                    <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '8px' }}>
                        How much of this material one unit of output uses. A 50 ml bottle filled from a
                        200 litre drum is <strong>0.050</strong>; its bottle and its label are <strong>1</strong> each.
                    </div>

                    {items.length > 0 && (
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
                            <thead>
                                <tr style={{ background: '#1a2035' }}>
                                    <th style={thS}>#</th><th style={thS}>Material</th>
                                    <th style={{ ...thS, textAlign: 'right' }}>Per unit</th><th style={thS}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((it, i) => (
                                    <tr key={it.productId}>
                                        <td style={tdS}>{i + 1}</td>
                                        <td style={tdS}>{it.name} [{it.productId}]</td>
                                        <td style={{ ...tdS, textAlign: 'right' }}>{it.ratio.toFixed(3)}</td>
                                        <td style={tdS}>
                                            <button onClick={() => setItems(items.filter(x => x.productId !== it.productId))} style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', padding: '3px 9px', cursor: 'pointer' }}>🗑</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </fieldset>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
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

function Batch() {
    const [view, setView] = useState('list');
    const [detail, setDetail] = useState(null);
    const [search, setSearch] = useState('');
    const [products, setProducts] = useState([]);

    const load = useCallback(() => listBoms({ status: null }), []);
    const { rows: boms, loading, error, reload } = useCollection(load, { what: 'bills of materials' });
    const { flash, say, busy, run } = useFlash();

    useEffect(() => { productOptions().then(setProducts).catch(() => setProducts([])); }, []);

    const handleSave = (payload) => run(async () => {
        const saved = await createBom(payload);
        say('ok', `${saved.bomNo} saved — ${saved.items.length} material${saved.items.length > 1 ? 's' : ''} for ${saved.productName}.`);
        setView('list');
        await reload();
    });

    const handleDeactivate = (b) => {
        if (!window.confirm(`Retire ${b.bomNo}? Past repacking runs keep it; it stops being offered on new ones.`)) return;
        run(async () => {
            await deactivateBom(b.bomNo, 'Retired from the bill of materials register');
            say('ok', `${b.bomNo} retired.`);
            await reload();
        });
    };

    const filtered = boms.filter(b => {
        const k = search.toLowerCase();
        return !k || `${b.bomNo} ${b.productName || ''} ${b.productId}`.toLowerCase().includes(k);
    });

    const notices = (
        <>
            {loading && view === 'list' && !detail && <Notice tone="info">Loading bills of materials…</Notice>}
            {error && <Notice tone="warn">{error}</Notice>}
            {flash && <Notice tone={flash.tone}>{flash.text}</Notice>}
        </>
    );

    if (view === 'add') {
        return (
            <div>
                {notices}
                <AddBom products={products} busy={busy} onBack={() => setView('list')} onSave={handleSave} />
            </div>
        );
    }

    if (detail) {
        return (
            <div>
                {notices}
                <BomDetail row={detail} onBack={() => setDetail(null)} />
            </div>
        );
    }

    return (
        <div>
            {notices}

            <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: '22px' }}>
                <div style={{ borderBottom: '2px solid #0d6efd', paddingBottom: '14px', marginBottom: '18px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#0d6efd' }}>🧾 Bill of Materials</div>
                    <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '2px' }}>
                        What each finished product is made of. Repacking multiplies these by the run size.
                    </div>
                </div>

                <div style={{ marginBottom: '18px' }}>
                    <input placeholder="Search by BOM number or product…" value={search} onChange={e => setSearch(e.target.value)}
                        style={{ padding: '9px 12px', border: '1px solid #ced4da', borderRadius: '5px', fontSize: '13px', width: '340px' }} />
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#1a2035' }}>
                                <th style={{ ...thS, width: '55px' }}>No</th>
                                <th style={thS}>BOM No</th>
                                <th style={thS}>Makes</th>
                                <th style={thS}>Materials</th>
                                <th style={thS}>Effective from</th>
                                <th style={thS}>Status</th>
                                <th style={{ ...thS, textAlign: 'right' }}>
                                    Action&nbsp;
                                    <button onClick={() => setView('add')} style={{ padding: '3px 11px', background: '#28a745', color: 'white', border: 'none', borderRadius: '3px', fontSize: '12px', cursor: 'pointer' }}>Add</button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={7} style={{ ...tdS, textAlign: 'center', padding: '30px', color: '#adb5bd' }}>
                                    {loading ? 'Loading…' : 'No bills of materials yet. Press Add to create the first one.'}
                                </td></tr>
                            ) : filtered.map((b, i) => (
                                <tr key={b.bomNo} style={{ background: i % 2 === 0 ? 'white' : '#f4f8fb', opacity: b.status === 'Active' ? 1 : 0.55 }}>
                                    <td style={{ ...tdS, textAlign: 'center' }}>{i + 1}</td>
                                    <td style={tdS}>{b.bomNo}</td>
                                    <td style={tdS}>
                                        <div style={{ fontWeight: 600, color: '#1a2035' }}>{b.productName}</div>
                                        <div style={{ color: '#6c757d', fontSize: 11 }}>{b.productId}</div>
                                    </td>
                                    <td style={{ ...tdS, fontSize: 12 }}>
                                        {(b.items || []).map(it => (
                                            <div key={it.productId}>{it.name} × {Number(it.ratio).toFixed(3)}</div>
                                        ))}
                                    </td>
                                    <td style={{ ...tdS, whiteSpace: 'nowrap' }}>{formatDate(b.effectiveFrom)}</td>
                                    <td style={tdS}>
                                        <span style={{
                                            backgroundColor: b.status === 'Active' ? '#d4edda' : '#f8d7da',
                                            color: b.status === 'Active' ? '#155724' : '#721c24',
                                            padding: '3px 10px', borderRadius: 20, fontSize: 12,
                                        }}>{b.status === 'Active' ? 'Active' : 'Retired'}</span>
                                    </td>
                                    <td style={{ ...tdS, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                        <button onClick={() => setDetail(b)} title="View" style={{ padding: '6px 11px', background: '#4e73df', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', marginRight: 4 }}>👁</button>
                                        {b.status === 'Active' && (
                                            <button onClick={() => handleDeactivate(b)} disabled={busy} title="Retire" style={{ padding: '6px 11px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>✕</button>
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

export default Batch;
