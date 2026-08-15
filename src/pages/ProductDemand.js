import React, { useState, useEffect, useCallback } from 'react';
import { CompanyHeader } from './Purchase';
import {
    listDemands, createDemand, setDemandStatus, demandTotals, packNotation,
    productOptions, formatDate, officeLabel, officeOptions, DEMAND_STATUS,
} from '../services';
import { Notice, useFlash, useCollection } from '../components/Notice';

// Inter-office product requests, backed by Firestore.
//
// Fourth of the fourteen screens in SCREEN-AUDIT.md §2.1, and it closes §4.3's
// third bullet at the same time: `demandItems` was one module-level array of
// sixteen lines that EVERY request detail rendered, so all thirteen requests
// showed identical contents. Lines are now part of the request, entered on the
// form, and the detail page shows the ones that were actually asked for.
//
// The stock column is the balance as it stood when the request was raised, not
// today's — see `stockAtRequest` in the schema.

const today = formatDate(new Date());
const thS = { padding: '11px 12px', color: 'white', fontWeight: '700', fontSize: '13px', textAlign: 'left', whiteSpace: 'nowrap' };
const tdS = { padding: '10px 12px', fontSize: '13px', color: '#333', borderBottom: '1px solid #f0f0f0', verticalAlign: 'top' };
const inp = { width: '100%', padding: '9px 12px', border: '1px solid #dee2e6', borderRadius: '5px', fontSize: '13px', boxSizing: 'border-box' };
const lbl = { fontSize: '14px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '7px' };
const req = <span style={{ color: '#dc3545' }}>*</span>;

const statusColor = (s) => ({ Cancel: '#dc3545', Pending: '#fd7e14', Approved: '#28a745', Received: '#0d6efd' }[s] || '#6c757d');

// ---- Request detail (separate page) ----
function RequestDetail({ row, onBack }) {
    const th = { border: '1px solid #999', padding: '8px', fontSize: '12px', textAlign: 'left' };
    const cell = { border: '1px solid #999', padding: '8px', fontSize: '12px' };
    const totals = demandTotals(row);

    return (
        <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: '24px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '20px' }}>
                <button onClick={() => window.print()} style={{ padding: '7px 14px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>🖨️</button>
                <button onClick={onBack} style={{ padding: '7px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '13px' }}>← Back</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '22px' }}>
                <CompanyHeader />
                <div style={{ fontSize: '12px', color: '#333' }}>
                    <div style={{ fontWeight: '800', fontSize: '16px', color: '#1a2035' }}>PRODUCT REQUEST</div>
                    <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '5px' }}>Request No: {row.requestNo}</div>
                    <div style={{ fontSize: '11px' }}>Expected Date: {formatDate(row.expectedDate)}</div>
                    <div style={{ fontSize: '11px' }}>Request Date: {formatDate(row.requestedAt)}</div>
                    <div style={{ fontSize: '11px' }}>From: {officeLabel(row.fromOfficeId)}</div>
                    <div style={{ fontSize: '11px' }}>To: {officeLabel(row.toOfficeId)}</div>
                    <div style={{ fontSize: '11px' }}>Status: {row.status}</div>
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ ...th, width: '55px' }}>S/N</th>
                        <th style={th}>Name</th>
                        <th style={{ ...th, width: '190px' }}>Stock when requested</th>
                        <th style={{ ...th, width: '190px' }}>Demand Qty</th>
                    </tr>
                </thead>
                <tbody>
                    {(row.items || []).map((it, i) => (
                        <tr key={it.productId}>
                            <td style={cell}>{i + 1}</td>
                            <td style={cell}>{it.name} [{it.productId}]</td>
                            <td style={{ ...cell, whiteSpace: 'pre-line' }}>{packNotation(it.stockAtRequest, it.cartonQty)}</td>
                            <td style={{ ...cell, whiteSpace: 'pre-line' }}>
                                {packNotation(it.demandQty, it.cartonQty)}{' '}
                                <span style={{ fontSize: '10px', color: '#666' }}>({it.packSize})</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan={3} style={{ padding: '8px', fontSize: '13px', fontWeight: '700', textAlign: 'right' }}>Total Carton</td>
                        <td style={{ padding: '8px', fontSize: '13px', fontWeight: '700' }}>{totals.label}</td>
                    </tr>
                </tfoot>
            </table>

            {row.note && <div style={{ marginTop: '16px', fontSize: '13px' }}>{row.note}</div>}

            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '50px', fontSize: '11px', color: '#555' }}>
                {['Created by', 'Authorised signature', 'Delivered by', 'Received by'].map(s => (
                    <div key={s} style={{ textAlign: 'center' }}>
                        <div style={{ borderTop: '1px dotted #999', paddingTop: '5px', minWidth: '150px' }}>{s}</div>
                    </div>
                ))}
            </div>
            <div style={{ textAlign: 'center', fontSize: '11px', color: '#666', marginTop: '10px' }}>
                Request was created on a computer and is valid without the signature and seal.
            </div>
        </div>
    );
}

// ---- Add Request ----
const EMPTY_LINE = { productId: '', demandQty: '' };

function AddRequest({ products, busy, onBack, onSave }) {
    const [form, setForm] = useState({ fromOfficeId: '', toOfficeId: '', expectedDate: today, note: '' });
    const [lines, setLines] = useState([{ ...EMPTY_LINE }]);

    const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
    const setLine = (i, k, v) => setLines(ls => ls.map((l, n) => (n === i ? { ...l, [k]: v } : l)));
    const addLine = () => setLines(ls => [...ls, { ...EMPTY_LINE }]);
    const dropLine = (i) => setLines(ls => (ls.length === 1 ? [{ ...EMPTY_LINE }] : ls.filter((_, n) => n !== i)));

    const filled = lines.filter(l => l.productId && Number(l.demandQty) > 0);
    const ready = Boolean(form.fromOfficeId && form.toOfficeId && form.expectedDate && filled.length) && !busy;

    return (
        <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #e9ecef', fontSize: '15px', color: '#333' }}>Add Product Request</div>
            <div style={{ padding: '22px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '18px', marginBottom: '18px' }}>
                    <div>
                        <label style={lbl}>From Office {req}</label>
                        <select value={form.fromOfficeId} onChange={set('fromOfficeId')} style={inp}>
                            <option value="">🔍 Please select</option>
                            {officeOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>To Office {req}</label>
                        <select value={form.toOfficeId} onChange={set('toOfficeId')} style={inp}>
                            <option value="">🔍 Please select</option>
                            {officeOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Expected Date {req}</label>
                        <input type="date" value={form.expectedDate} onChange={set('expectedDate')} style={{ ...inp, background: '#f8f9fa' }} />
                    </div>
                </div>

                {/* The lines. Before this existed every request rendered the same
                    sixteen hardcoded items — SCREEN-AUDIT.md §4.3. */}
                <fieldset style={{ border: '1px solid #dee2e6', borderRadius: '5px', padding: '18px 20px', marginBottom: '18px' }}>
                    <legend style={{ padding: '0 8px', fontSize: '16px', fontWeight: '700', color: '#333' }}>Products requested {req}</legend>
                    {lines.map((l, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 170px 44px', gap: '12px', marginBottom: '10px', alignItems: 'center' }}>
                            <select value={l.productId} onChange={e => setLine(i, 'productId', e.target.value)} style={inp}>
                                <option value="">🔍 Select product</option>
                                {products.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                            <input type="number" min="1" placeholder="Demand qty" value={l.demandQty}
                                onChange={e => setLine(i, 'demandQty', e.target.value)} style={inp} />
                            <button onClick={() => dropLine(i)} title="Remove line"
                                style={{ padding: '9px 0', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                        </div>
                    ))}
                    <button onClick={addLine} style={{ padding: '7px 16px', background: '#4e73df', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '13px' }}>+ Add line</button>
                </fieldset>

                <div>
                    <label style={lbl}>Note</label>
                    <textarea placeholder="Note" value={form.note} onChange={set('note')} style={{ ...inp, height: '70px', resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button onClick={onBack} style={{ padding: '8px 22px', background: '#4e73df', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>Back</button>
                    <button onClick={() => onSave({ ...form, items: filled })} disabled={!ready}
                        style={{ padding: '8px 22px', background: ready ? '#1e7e34' : '#adb5bd', color: 'white', border: 'none', borderRadius: '5px', cursor: ready ? 'pointer' : 'not-allowed', fontSize: '14px' }}>
                        {busy ? 'Saving…' : 'Save'}
                    </button>
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
    const [products, setProducts] = useState([]);

    const load = useCallback(() => listDemands(), []);
    const { rows: requests, loading, error, reload } = useCollection(load, { what: 'product requests' });
    const { flash, say, busy, run } = useFlash();

    useEffect(() => { productOptions().then(setProducts).catch(() => setProducts([])); }, []);

    const handleGo = () => setApplied(draft);
    const handleClear = () => { setDraft(emptyF); setApplied(emptyF); };

    const handleSave = (payload) => run(async () => {
        const saved = await createDemand(payload);
        say('ok', `Request ${saved.requestNo} saved with ${saved.items.length} line${saved.items.length > 1 ? 's' : ''}.`);
        setView('list');
        await reload();
    });

    const handleStatus = (row, status) => {
        const reason = status === 'Cancel'
            ? window.prompt(`Why is ${row.requestNo} being cancelled?`)
            : null;
        if (status === 'Cancel' && !reason) return;
        run(async () => {
            await setDemandStatus(row.requestNo, status, reason);
            say('ok', `${row.requestNo} marked ${status}.`);
            await reload();
        });
    };

    const filtered = requests.filter(r => {
        if (applied.date && formatDate(r.expectedDate) !== applied.date) return false;
        if (applied.no && !r.requestNo.toLowerCase().includes(applied.no.toLowerCase())) return false;
        return true;
    });

    const notices = (
        <>
            {loading && view === 'list' && !detail && <Notice tone="info">Loading product requests…</Notice>}
            {error && <Notice tone="warn">{error}</Notice>}
            {flash && <Notice tone={flash.tone}>{flash.text}</Notice>}
        </>
    );

    if (view === 'add') {
        return (
            <div>
                {notices}
                <AddRequest products={products} busy={busy} onBack={() => setView('list')} onSave={handleSave} />
            </div>
        );
    }

    if (detail) {
        return (
            <div>
                {notices}
                <RequestDetail row={detail} onBack={() => setDetail(null)} />
            </div>
        );
    }

    const fInp = { padding: '9px 12px', border: '1px solid #ced4da', borderRadius: '5px', fontSize: '13px' };

    return (
        <div>
            {notices}

            <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: '22px' }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#333', marginBottom: '18px' }}>
                    &gt; Manage Request <span style={{ fontWeight: 400, fontSize: '14px', color: '#6c757d' }}>({requests.length})</span>
                </div>

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
                                <th style={thS}>Lines</th>
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
                                <tr><td colSpan={9} style={{ ...tdS, textAlign: 'center', padding: '30px', color: '#adb5bd' }}>
                                    {loading ? 'Loading…' : 'No data found'}
                                </td></tr>
                            ) : filtered.map((r, i) => (
                                <tr key={r.requestNo} style={{ background: i % 2 === 0 ? 'white' : '#f8fbfd' }}>
                                    <td style={{ ...tdS, textAlign: 'center' }}>{i + 1}</td>
                                    <td style={tdS}>{r.requestNo}</td>
                                    <td style={tdS}>{officeLabel(r.fromOfficeId)}</td>
                                    <td style={tdS}>{officeLabel(r.toOfficeId)}</td>
                                    <td style={{ ...tdS, whiteSpace: 'nowrap' }}>{formatDate(r.expectedDate)}</td>
                                    <td style={{ ...tdS, whiteSpace: 'nowrap' }}>
                                        {(r.items || []).length}
                                        <div style={{ fontSize: '11px', color: '#6c757d' }}>{demandTotals(r).label}</div>
                                    </td>
                                    <td style={tdS}>
                                        <select value={r.status} disabled={busy}
                                            onChange={e => handleStatus(r, e.target.value)}
                                            style={{ padding: '3px 6px', border: `1px solid ${statusColor(r.status)}`, borderRadius: 4, fontSize: 11, fontWeight: 700, color: statusColor(r.status), background: 'white' }}>
                                            {DEMAND_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </td>
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
        </div>
    );
}

export default ProductDemand;
