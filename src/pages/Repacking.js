import React, { useState } from 'react';
import { CompanyHeader } from './Purchase';

const thS = { padding: '11px 12px', color: 'white', fontWeight: '700', fontSize: '13px', textAlign: 'left', whiteSpace: 'nowrap' };
const tdS = { padding: '10px 12px', fontSize: '13px', color: '#333', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' };
const toISO = (d) => d.split('-').reverse().join('-');

const Badge = ({ color, children }) => (
    <span style={{ background: color, color: 'white', padding: '3px 9px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>{children}</span>
);

const detailItems = [
    { name: 'Porbot 2.5ec 50 Ml (label)', code: 'AI-000340', batchUnit: '1.000', repackUnit: '1344', total: '1344.000' },
    { name: 'White Bottle 50 Ml', code: 'AI-000153', batchUnit: '1.000', repackUnit: '1344', total: '1344.000' },
    { name: 'Porbot 2.5 Ec 200 Ltr (bulk)', code: 'AI-000347', batchUnit: '0.050', repackUnit: '1344', total: '67.200' },
    { name: 'Washer 100 Ml (Golden)', code: 'AI-000342', batchUnit: '1.000', repackUnit: '1344', total: '1344.000' },
    { name: 'Nekban 100 Ml', code: 'AI-000344', batchUnit: '1.000', repackUnit: '1344', total: '1344.000' },
    { name: 'Porbot 2.5ec 50 Ml (cartoon)', code: 'AI-000384', batchUnit: '', repackUnit: '', total: '56.000' },
];

const repackings = [
    { id: 1, no: 'AIR-006390', product: 'Porbot 2.5ec 50 Ml', pcode: 'AI-000006', qty: '1344', date: '04-08-2026', status: 'Approved', note: 'Porbot 50 ml', carton: '56', items: '1344' },
    { id: 2, no: 'AIR-006389', product: 'Memory Plus 32.5sc 50 Ml', pcode: 'AI-000055', qty: '1848', date: '04-08-2026', status: 'Approved', note: 'Memory plus 100 gm', carton: '77', items: '1848' },
    { id: 3, no: 'AIR-006388', product: 'New Churanto 1.8ec 100 Ml', pcode: 'AI-000716', qty: '960', date: '04-08-2026', status: 'Approved', note: 'New Churanto 100 ml', carton: '40', items: '960' },
    { id: 4, no: 'AIR-006387', product: 'Jass Gold 50 Gm', pcode: 'AI-000077', qty: '2448', date: '04-08-2026', status: 'Approved', note: 'Jass Gold 50 gm', carton: '102', items: '2448' },
    { id: 5, no: 'AIR-006386', product: 'Super Green 25sc (paclobutrazol 25%) 100 Ml', pcode: 'AI-000537', qty: '1200', date: '04-08-2026', status: 'Approved', note: 'Super Green 100 ml', carton: '50', items: '1200' },
    { id: 6, no: 'AIR-006385', product: 'Smartap 50sp 50 Gm', pcode: 'AI-000019', qty: '3240', date: '04-08-2026', status: 'Approved', note: 'Smartap 50 gm', carton: '135', items: '3240' },
    { id: 7, no: 'AIR-006384', product: 'New Thaizip 10 Kg', pcode: 'AI-000581', qty: '280', date: '04-08-2026', status: 'Approved', note: 'New Thaizip 10 kg', carton: '28', items: '280' },
    { id: 8, no: 'AIR-006383', product: 'Jass Gold 300 Gm', pcode: 'AI-000075', qty: '1000', date: '04-08-2026', status: 'Approved', note: 'Jass Gold 300 gm', carton: '50', items: '1000' },
    { id: 9, no: 'AIR-006382', product: 'Agri Zink 1KG', pcode: 'AI-000730', qty: '1760', date: '04-08-2026', status: 'Approved', note: 'Agri Zink 1 kg', carton: '88', items: '1760' },
    { id: 10, no: 'AIR-006381', product: 'Smartap 50sp 50 Gm', pcode: 'AI-000019', qty: '288', date: '03-08-2026', status: 'Approved', note: 'Smartap 50 ml', carton: '12', items: '288' },
    { id: 11, no: 'AIR-006380', product: 'Porbot 2.5ec 500ml', pcode: 'AI-000003', qty: '2800', date: '03-08-2026', status: 'Approved', note: 'Porbot 500 ml', carton: '140', items: '2800' },
    { id: 12, no: 'AIR-006379', product: 'Memory Plus 32.5sc 50 Ml', pcode: 'AI-000055', qty: '1824', date: '03-08-2026', status: 'Approved', note: 'Memory plus 50 ml', carton: '76', items: '1824' },
    { id: 13, no: 'AIR-006378', product: 'Turki Boron 500 Gm', pcode: 'AI-000098', qty: '2540', date: '03-08-2026', status: 'Approved', note: 'Turki Boron 500 gm', carton: '127', items: '2540' },
];

const productOptions = [...new Set(repackings.map(r => r.product))];
const batchOptions = ['AIB-000181 — Agri Zink 1KG', 'AIB-000180 — Jassquate 61sl 400 Ml', 'AIB-000179 — New Churanto 1.8ec 50 Ml'];
const cartonOptions = ['Porbot 2.5ec 50 Ml (cartoon) [AI-000384]', 'Tetop 100 ml (Carton) [AI-000644]', 'Cypress 50 ml ( carton print ) [AI-000630]'];

// ---- Repacking detail (separate page) ----
function RepackingDetail({ row, onBack }) {
    const th = { border: '1px solid #999', padding: '7px', fontSize: '12px', textAlign: 'left' };
    const thR = { ...th, textAlign: 'right' };
    return (
        <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: '24px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '20px' }}>
                <button onClick={() => window.print()} style={{ padding: '7px 14px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>🖨️</button>
                <button onClick={onBack} style={{ padding: '7px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '13px' }}>← Back</button>
            </div>

            <CompanyHeader />

            <div style={{ marginTop: '20px', marginBottom: '16px', fontSize: '13px' }}>
                <div style={{ fontWeight: '700', color: '#1a2035' }}>Repacking Item</div>
                <div style={{ fontWeight: '700' }}>{row.product} [{row.pcode}]</div>
                <div style={{ fontSize: '12px', color: '#555' }}>Production Carton : {row.carton}</div>
                <div style={{ fontSize: '12px', color: '#555' }}>Production items : {row.items}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ ...th, width: '55px' }}>S/N</th>
                        <th style={th}>Name</th>
                        <th style={{ ...thR, width: '160px' }}>Batch Unit</th>
                        <th style={{ ...thR, width: '160px' }}>Repacking Unit</th>
                        <th style={{ ...thR, width: '160px' }}>Total Unit</th>
                    </tr>
                </thead>
                <tbody>
                    {detailItems.map((it, i) => (
                        <tr key={it.code}>
                            <td style={{ border: '1px solid #999', padding: '7px', fontSize: '12px' }}>{i + 1}</td>
                            <td style={{ border: '1px solid #999', padding: '7px', fontSize: '12px' }}>{it.name} [{it.code}]</td>
                            <td style={{ border: '1px solid #999', padding: '7px', fontSize: '12px', textAlign: 'right' }}>{it.batchUnit}</td>
                            <td style={{ border: '1px solid #999', padding: '7px', fontSize: '12px', textAlign: 'right' }}>{it.repackUnit}</td>
                            <td style={{ border: '1px solid #999', padding: '7px', fontSize: '12px', textAlign: 'right' }}>{it.total}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ---- Add Repacking ----
function AddRepacking({ onBack }) {
    const [form, setForm] = useState({ itemType: 'Batch', batch: '', qty: '1', carton: '', cartonQty: '', productionItems: '', note: '' });
    const [batchItems, setBatchItems] = useState([]);
    const [addItems] = useState([]);
    const inp = { width: '100%', padding: '9px 12px', border: '1px solid #dee2e6', borderRadius: '5px', fontSize: '13px', boxSizing: 'border-box' };
    const lbl = { fontSize: '14px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '7px' };

    const addProduct = () => {
        if (!form.batch) return;
        setBatchItems(prev => [...prev, { id: Date.now(), batch: form.batch, qty: form.qty }]);
    };

    const EmptyTable = () => (
        <div style={{ textAlign: 'center', padding: '30px 0', fontSize: '26px', fontWeight: '600', color: '#333' }}>Empty Items Table</div>
    );

    return (
        <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #e9ecef', fontSize: '15px', color: '#333' }}>Add Repacking</div>
            <div style={{ padding: '22px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', gap: '18px', alignItems: 'end' }}>
                    <div>
                        <label style={lbl}>Item Type</label>
                        <select value={form.itemType} onChange={e => setForm(p => ({ ...p, itemType: e.target.value }))} style={inp}>
                            <option>Batch</option>
                            <option>Product</option>
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Batch</label>
                        <select value={form.batch} onChange={e => setForm(p => ({ ...p, batch: e.target.value }))} style={inp}>
                            <option value="">🔍 Please select</option>
                            {batchOptions.map(b => <option key={b}>{b}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Quantity</label>
                        <input value={form.qty} onChange={e => setForm(p => ({ ...p, qty: e.target.value }))} style={{ ...inp, background: '#f8f9fa' }} />
                    </div>
                    <button onClick={addProduct} style={{ padding: '10px', background: '#1e7e34', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>Add Product</button>
                </div>

                <div style={{ marginTop: '22px' }}>
                    <div style={{ fontSize: '19px', fontWeight: '600', color: '#333' }}>Batch Items</div>
                    {batchItems.length === 0 ? <EmptyTable /> : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '14px 0' }}>
                            <thead>
                                <tr style={{ background: '#1a2035' }}>
                                    <th style={thS}>#</th><th style={thS}>Batch</th><th style={thS}>Quantity</th><th style={thS}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {batchItems.map((it, i) => (
                                    <tr key={it.id}>
                                        <td style={tdS}>{i + 1}</td>
                                        <td style={tdS}>{it.batch}</td>
                                        <td style={tdS}>{it.qty}</td>
                                        <td style={tdS}>
                                            <button onClick={() => setBatchItems(batchItems.filter(x => x.id !== it.id))} style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', padding: '3px 9px', cursor: 'pointer' }}>🗑</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div style={{ marginTop: '10px' }}>
                    <div style={{ fontSize: '19px', fontWeight: '600', color: '#333' }}>Additional Items Table</div>
                    {addItems.length === 0 ? <EmptyTable /> : null}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '18px', marginTop: '10px' }}>
                    <div>
                        <label style={lbl}>Carton</label>
                        <select value={form.carton} onChange={e => setForm(p => ({ ...p, carton: e.target.value }))} style={inp}>
                            <option value="">🔍 Please select</option>
                            {cartonOptions.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Carton Quantity</label>
                        <input placeholder="Carton Quantity" value={form.cartonQty} onChange={e => setForm(p => ({ ...p, cartonQty: e.target.value }))} style={inp} />
                    </div>
                    <div>
                        <label style={lbl}>Production items</label>
                        <input placeholder="Production items" value={form.productionItems} onChange={e => setForm(p => ({ ...p, productionItems: e.target.value }))} style={inp} />
                    </div>
                </div>

                <div style={{ marginTop: '18px' }}>
                    <label style={lbl}>Note</label>
                    <textarea placeholder="Note" value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} style={{ ...inp, height: '68px', resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
                    <button onClick={onBack} style={{ padding: '8px 22px', background: '#4e73df', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>Back</button>
                    <button style={{ padding: '8px 22px', background: '#1e7e34', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>Save</button>
                </div>
            </div>
        </div>
    );
}

const emptyF = { product: '', date: '', no: '' };

function Repacking() {
    const [view, setView] = useState('list');
    const [detail, setDetail] = useState(null);
    const [checked, setChecked] = useState({});
    const [draft, setDraft] = useState(emptyF);
    const [applied, setApplied] = useState(emptyF);

    const handleGo = () => setApplied(draft);
    const handleClear = () => { setDraft(emptyF); setApplied(emptyF); };

    const filtered = repackings.filter(r => {
        if (applied.product && r.product !== applied.product) return false;
        if (applied.date && toISO(r.date) !== applied.date) return false;
        if (applied.no && !r.no.toLowerCase().includes(applied.no.toLowerCase())) return false;
        return true;
    });

    const selectedCount = Object.values(checked).filter(Boolean).length;

    if (view === 'add') return <AddRepacking onBack={() => setView('list')} />;
    if (detail) return <RepackingDetail row={detail} onBack={() => setDetail(null)} />;

    const fInp = { padding: '9px 12px', border: '1px solid #ced4da', borderRadius: '5px', fontSize: '13px' };

    return (
        <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: '22px' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#333', marginBottom: '18px' }}>&gt; Manage Repacking</div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '18px' }}>
                <select value={draft.product} onChange={e => setDraft(p => ({ ...p, product: e.target.value }))} style={{ ...fInp, minWidth: '330px' }}>
                    <option value="">🔍 Please select</option>
                    {productOptions.map(p => <option key={p}>{p}</option>)}
                </select>
                <input type="date" value={draft.date} onChange={e => setDraft(p => ({ ...p, date: e.target.value }))} style={{ ...fInp, width: '220px' }} />
                <input placeholder="Repacking no" value={draft.no} onChange={e => setDraft(p => ({ ...p, no: e.target.value }))} style={{ ...fInp, width: '220px' }} />
                <button onClick={handleGo} style={{ padding: '9px 20px', background: '#1e7e34', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>Go</button>
                <button onClick={handleClear} style={{ padding: '9px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>Clear</button>
                <button onClick={() => window.print()} style={{ padding: '9px 16px', background: '#4e73df', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>🖨️ ({selectedCount})</button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#1a2035' }}>
                            <th style={{ ...thS, width: '55px' }}>SL</th>
                            <th style={thS}>No</th>
                            <th style={thS}>Batch Product</th>
                            <th style={{ ...thS, textAlign: 'right' }}>Quantity</th>
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
                            <tr><td colSpan={8} style={{ ...tdS, textAlign: 'center', padding: '30px', color: '#adb5bd' }}>No data found</td></tr>
                        ) : filtered.map((r, i) => (
                            <tr key={r.id} style={{ background: i % 2 === 0 ? 'white' : '#f8fbfd' }}>
                                <td style={{ ...tdS, textAlign: 'center' }}>{i + 1}</td>
                                <td style={tdS}>
                                    <input type="checkbox" checked={!!checked[r.id]}
                                        onChange={() => setChecked(p => ({ ...p, [r.id]: !p[r.id] }))}
                                        style={{ marginRight: '8px', cursor: 'pointer' }} />
                                    {r.no}
                                </td>
                                <td style={tdS}>{r.product}[{r.pcode}]</td>
                                <td style={{ ...tdS, textAlign: 'right' }}>{r.qty}</td>
                                <td style={{ ...tdS, whiteSpace: 'nowrap' }}>{r.date}</td>
                                <td style={tdS}><Badge color="#28a745">{r.status}</Badge></td>
                                <td style={tdS}>{r.note}</td>
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

export default Repacking;
