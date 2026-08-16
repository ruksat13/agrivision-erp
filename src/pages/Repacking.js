import React, { useState, useEffect, useCallback } from 'react';
import { CompanyHeader } from './Purchase';
import {
    listRepackings, createRepacking, cancelRepacking, checkMaterials,
    bomOptions, formatDate, officeLabel, officeOptions,
} from '../services';
import { Notice, useFlash, useCollection } from '../components/Notice';

// Repacking, backed by Firestore. The last of the fourteen dead Save buttons in
// SCREEN-AUDIT.md §2.1, and the most interesting of them.
//
// This is the only screen where stock moves both ways at once: a run consumes
// its materials and produces the finished product in one batch. Two audit
// findings close here:
//
//   · §4.4 — "Batch → Repacking: `Repacking.js:38` hardcodes three batch
//     options; the twelve batches in Batch.js are not read." The recipe
//     selector reads `boms`.
//   · §4.3 — every repacking detail showed the same six Porbot items from one
//     shared `detailItems` array. What a run consumed is stored on the run.
//
// The consumption preview below the recipe selector is not decoration: it is
// the same checkMaterials() the service calls before saving, so a short
// material is visible before Save rather than as an error afterwards.

const thS = { padding: '11px 12px', color: 'white', fontWeight: '700', fontSize: '13px', textAlign: 'left', whiteSpace: 'nowrap' };
const tdS = { padding: '10px 12px', fontSize: '13px', color: '#333', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' };
const inp = { width: '100%', padding: '9px 12px', border: '1px solid #dee2e6', borderRadius: '5px', fontSize: '13px', boxSizing: 'border-box' };
const lbl = { fontSize: '14px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '7px' };
const cell = { border: '1px solid #999', padding: '7px', fontSize: '12px' };

const today = formatDate(new Date());
const num = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 3 });

const Badge = ({ color, children }) => (
    <span style={{ background: color, color: 'white', padding: '3px 9px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>{children}</span>
);

const statusColour = (s) => ({ Done: '#28a745', Pending: '#fd7e14', Cancelled: '#dc3545' }[s] || '#6c757d');

// ---- Repacking detail (separate page) ----
function RepackingDetail({ row, onBack }) {
    return (
        <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: '24px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '20px' }}>
                <button onClick={() => window.print()} style={{ padding: '7px 14px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>🖨️</button>
                <button onClick={onBack} style={{ padding: '7px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '13px' }}>← Back</button>
            </div>

            <CompanyHeader />

            <div style={{ marginTop: '20px', marginBottom: '16px', fontSize: '13px' }}>
                <div style={{ fontWeight: '700', color: '#1a2035' }}>Repacking {row.repackNo}</div>
                <div style={{ fontWeight: '700' }}>{row.outputProductName} [{row.outputProductId}]</div>
                <div style={{ fontSize: '12px', color: '#555' }}>Recipe: {row.bomId}</div>
                <div style={{ fontSize: '12px', color: '#555' }}>Production items : {num(row.qty)}</div>
                <div style={{ fontSize: '12px', color: '#555' }}>Production carton : {num(row.cartons)}</div>
                <div style={{ fontSize: '12px', color: '#555' }}>{officeLabel(row.officeId)} · {formatDate(row.repackDate)} · {row.status}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ ...cell, width: '55px' }}>S/N</th>
                        <th style={cell}>Material</th>
                        <th style={{ ...cell, width: '150px', textAlign: 'right' }}>Per unit</th>
                        <th style={{ ...cell, width: '130px', textAlign: 'right' }}>Run size</th>
                        <th style={{ ...cell, width: '150px', textAlign: 'right' }}>Consumed</th>
                    </tr>
                </thead>
                <tbody>
                    {(row.consumed || []).map((it, i) => (
                        <tr key={it.productId}>
                            <td style={cell}>{i + 1}</td>
                            <td style={cell}>{it.name} [{it.productId}]</td>
                            <td style={{ ...cell, textAlign: 'right' }}>{Number(it.ratio).toFixed(3)}</td>
                            <td style={{ ...cell, textAlign: 'right' }}>{num(row.qty)}</td>
                            <td style={{ ...cell, textAlign: 'right', fontWeight: 700 }}>{num(it.qty)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {row.note && <div style={{ marginTop: '16px', fontSize: '13px' }}>{row.note}</div>}
            <div style={{ marginTop: '14px', fontSize: '12px', color: '#6c757d' }}>
                These are the quantities this run actually consumed, recorded when it was made. Editing
                the recipe afterwards does not change them.
            </div>
        </div>
    );
}

// ---- Add repacking ----
function AddRepacking({ boms, busy, onBack, onSave }) {
    const [form, setForm] = useState({ bomId: '', qty: '', cartonQty: '', officeId: 'head', repackDate: today, note: '' });
    const [preview, setPreview] = useState([]);
    const [checking, setChecking] = useState(false);

    const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
    const bom = boms.find(b => b.value === form.bomId)?.bom;

    // The same check the service runs before saving, so a shortfall shows up
    // here rather than as an error message after pressing Save.
    useEffect(() => {
        let cancelled = false;
        if (!bom || !(Number(form.qty) > 0) || !form.officeId) { setPreview([]); return undefined; }
        setChecking(true);
        checkMaterials(bom, Number(form.qty), form.officeId)
            .then(rows => { if (!cancelled) setPreview(rows); })
            .catch(() => { if (!cancelled) setPreview([]); })
            .finally(() => { if (!cancelled) setChecking(false); });
        return () => { cancelled = true; };
    }, [bom, form.qty, form.officeId]);

    const short = preview.filter(p => p.short > 0);
    const ready = Boolean(form.bomId && Number(form.qty) > 0 && form.officeId) && !short.length && !busy;

    return (
        <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #e9ecef', fontSize: '15px', color: '#333' }}>Add Repacking</div>
            <div style={{ padding: '22px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '18px', marginBottom: '18px' }}>
                    <div>
                        <label style={lbl}>Recipe <span style={{ color: '#dc3545' }}>*</span></label>
                        <select value={form.bomId} onChange={set('bomId')} style={inp}>
                            <option value="">🔍 Please select</option>
                            {boms.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                        </select>
                        {boms.length === 0 && (
                            <div style={{ fontSize: '12px', color: '#856404', marginTop: '5px' }}>
                                No bills of materials yet — create one on the Bill of Materials screen first.
                            </div>
                        )}
                    </div>
                    <div>
                        <label style={lbl}>Units to make <span style={{ color: '#dc3545' }}>*</span></label>
                        <input type="number" min="1" placeholder="e.g. 1344" value={form.qty} onChange={set('qty')} style={inp} />
                    </div>
                    <div>
                        <label style={lbl}>Units per carton</label>
                        <input type="number" min="1" placeholder="e.g. 24" value={form.cartonQty} onChange={set('cartonQty')} style={inp} />
                    </div>
                    <div>
                        <label style={lbl}>At office <span style={{ color: '#dc3545' }}>*</span></label>
                        <select value={form.officeId} onChange={set('officeId')} style={inp}>
                            {officeOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                </div>

                {bom && (
                    <fieldset style={{ border: `1px solid ${short.length ? '#dc3545' : '#dee2e6'}`, borderRadius: '5px', padding: '18px 20px', marginBottom: '18px' }}>
                        <legend style={{ padding: '0 8px', fontSize: '16px', fontWeight: '700', color: short.length ? '#dc3545' : '#333' }}>
                            This run will consume {checking && <span style={{ fontWeight: 400, fontSize: 13 }}>— checking…</span>}
                        </legend>
                        {preview.length === 0 ? (
                            <div style={{ fontSize: '13px', color: '#6c757d' }}>Enter the number of units to see what it uses.</div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#1a2035' }}>
                                        <th style={thS}>Material</th>
                                        <th style={{ ...thS, textAlign: 'right' }}>Per unit</th>
                                        <th style={{ ...thS, textAlign: 'right' }}>Needs</th>
                                        <th style={{ ...thS, textAlign: 'right' }}>In stock</th>
                                        <th style={{ ...thS, textAlign: 'right' }}>Short by</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.map(p => (
                                        <tr key={p.productId} style={{ background: p.short > 0 ? '#fff5f5' : 'white' }}>
                                            <td style={tdS}>{p.name} [{p.productId}]</td>
                                            <td style={{ ...tdS, textAlign: 'right' }}>{Number(p.ratio).toFixed(3)}</td>
                                            <td style={{ ...tdS, textAlign: 'right', fontWeight: 600 }}>{num(p.qty)}</td>
                                            <td style={{ ...tdS, textAlign: 'right' }}>{num(p.held)}</td>
                                            <td style={{ ...tdS, textAlign: 'right', color: '#dc3545', fontWeight: 700 }}>
                                                {p.short > 0 ? num(p.short) : ''}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {short.length > 0 && (
                            <div style={{ marginTop: '10px', fontSize: '13px', color: '#721c24' }}>
                                Not enough material for this run. Reduce the quantity, or receive more stock first.
                            </div>
                        )}
                    </fieldset>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '18px' }}>
                    <div>
                        <label style={lbl}>Repack date</label>
                        <input type="date" value={form.repackDate} onChange={set('repackDate')} style={{ ...inp, background: '#f8f9fa' }} />
                    </div>
                    <div>
                        <label style={lbl}>Note</label>
                        <textarea placeholder="Note" value={form.note} onChange={set('note')} style={{ ...inp, height: '70px', resize: 'vertical' }} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '18px' }}>
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

const emptyF = { search: '', date: '' };

function Repacking() {
    const [view, setView] = useState('list');
    const [detail, setDetail] = useState(null);
    const [draft, setDraft] = useState(emptyF);
    const [applied, setApplied] = useState(emptyF);
    const [boms, setBoms] = useState([]);

    const load = useCallback(() => listRepackings(), []);
    const { rows: runs, loading, error, reload } = useCollection(load, { what: 'repacking runs' });
    const { flash, say, busy, run } = useFlash();

    useEffect(() => { bomOptions().then(setBoms).catch(() => setBoms([])); }, []);

    const handleGo = () => setApplied(draft);
    const handleClear = () => { setDraft(emptyF); setApplied(emptyF); };

    const handleSave = (payload) => run(async () => {
        const saved = await createRepacking(payload);
        say('ok', `${saved.repackNo} done — ${num(saved.qty)} × ${saved.outputProductName} made, materials taken out of stock.`);
        setView('list');
        await reload();
    });

    const handleCancel = (r) => {
        const reason = window.prompt(`Why is run ${r.repackNo} being cancelled? The finished goods go back out and the materials come back in.`);
        if (!reason) return;
        run(async () => {
            await cancelRepacking(r.repackNo, reason);
            say('ok', `${r.repackNo} cancelled — the stock movements have been reversed.`);
            await reload();
        });
    };

    const filtered = runs.filter(r => {
        if (applied.search) {
            const k = applied.search.toLowerCase();
            const hay = `${r.repackNo} ${r.outputProductName || ''} ${r.bomId || ''} ${r.note || ''}`.toLowerCase();
            if (!hay.includes(k)) return false;
        }
        if (applied.date && formatDate(r.repackDate) !== applied.date) return false;
        return true;
    });

    const notices = (
        <>
            {loading && view === 'list' && !detail && <Notice tone="info">Loading repacking runs…</Notice>}
            {error && <Notice tone="warn">{error}</Notice>}
            {flash && <Notice tone={flash.tone}>{flash.text}</Notice>}
        </>
    );

    if (view === 'add') {
        return (
            <div>
                {notices}
                <AddRepacking boms={boms} busy={busy} onBack={() => setView('list')} onSave={handleSave} />
            </div>
        );
    }

    if (detail) {
        return (
            <div>
                {notices}
                <RepackingDetail row={detail} onBack={() => setDetail(null)} />
            </div>
        );
    }

    const fInp = { padding: '9px 12px', border: '1px solid #ced4da', borderRadius: '5px', fontSize: '13px' };

    return (
        <div>
            {notices}

            <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: '22px' }}>
                <div style={{ borderBottom: '2px solid #0d6efd', paddingBottom: '14px', marginBottom: '18px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#0d6efd' }}>📦 Repacking</div>
                    <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '2px' }}>
                        Materials out, finished product in — both in the same movement ledger
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '18px' }}>
                    <input placeholder="Repack no, product or recipe" value={draft.search} onChange={e => setDraft(p => ({ ...p, search: e.target.value }))} style={{ ...fInp, width: '260px' }} />
                    <input type="date" value={draft.date} onChange={e => setDraft(p => ({ ...p, date: e.target.value }))} style={{ ...fInp, width: '200px' }} />
                    <button onClick={handleGo} style={{ padding: '9px 20px', background: '#1e7e34', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>Go</button>
                    <button onClick={handleClear} style={{ padding: '9px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>Clear</button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#1a2035' }}>
                                <th style={{ ...thS, width: '50px' }}>No</th>
                                <th style={thS}>Repack No</th>
                                <th style={thS}>Made</th>
                                <th style={{ ...thS, textAlign: 'right' }}>Qty</th>
                                <th style={{ ...thS, textAlign: 'right' }}>Cartons</th>
                                <th style={thS}>Recipe</th>
                                <th style={thS}>Office</th>
                                <th style={thS}>Date</th>
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
                                <tr><td colSpan={11} style={{ ...tdS, textAlign: 'center', padding: '30px', color: '#adb5bd' }}>
                                    {loading ? 'Loading…' : 'No data found'}
                                </td></tr>
                            ) : filtered.map((r, i) => (
                                <tr key={r.repackNo} style={{ background: i % 2 === 0 ? 'white' : '#f4f8fb', opacity: r.status === 'Cancelled' ? 0.55 : 1 }}>
                                    <td style={{ ...tdS, textAlign: 'center' }}>{i + 1}</td>
                                    <td style={tdS}>{r.repackNo}</td>
                                    <td style={tdS}>
                                        <div style={{ fontWeight: 600, color: '#1a2035' }}>{r.outputProductName}</div>
                                        <div style={{ color: '#6c757d', fontSize: 11 }}>{r.outputProductId}</div>
                                    </td>
                                    <td style={{ ...tdS, textAlign: 'right', fontWeight: 600, textDecoration: r.status === 'Cancelled' ? 'line-through' : 'none' }}>{num(r.qty)}</td>
                                    <td style={{ ...tdS, textAlign: 'right' }}>{num(r.cartons)}</td>
                                    <td style={tdS}>{r.bomId}</td>
                                    <td style={tdS}>{officeLabel(r.officeId)}</td>
                                    <td style={{ ...tdS, whiteSpace: 'nowrap' }}>{formatDate(r.repackDate)}</td>
                                    <td style={tdS}><Badge color={statusColour(r.status)}>{r.status}</Badge></td>
                                    <td style={{ ...tdS, fontSize: 12, maxWidth: 200 }}>{r.note}</td>
                                    <td style={{ ...tdS, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                        <button onClick={() => setDetail(r)} title="View" style={{ padding: '6px 11px', background: '#4e73df', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', marginRight: 4 }}>👁</button>
                                        {r.status !== 'Cancelled' && (
                                            <button onClick={() => handleCancel(r)} disabled={busy} title="Cancel — reverses both sides" style={{ padding: '6px 11px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>🗑</button>
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

export default Repacking;
