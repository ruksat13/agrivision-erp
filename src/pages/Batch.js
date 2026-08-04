import React, { useState } from 'react';
import { CompanyHeader } from './Purchase';

const thS = { padding: '11px 12px', color: 'white', fontWeight: '700', fontSize: '13px', textAlign: 'left', whiteSpace: 'nowrap' };
const tdS = { padding: '10px 12px', fontSize: '13px', color: '#333', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' };
const toISO = (d) => d.split('-').reverse().join('-');

const batches = [
    { id: 1, no: 'AIB-000181', product: 'Agri Zink 1KG', pcode: 'AI-000730', date: '18-07-2026', items: [{ name: 'Agri Zink( Bulk) 50 kg', code: 'AI-000727', unit: '1.000' }, { name: 'Agri Zink (packet) 1kg', code: 'AI-000728', unit: '1.000' }] },
    { id: 2, no: 'AIB-000180', product: 'Jassquate 61sl 400 Ml', pcode: 'AI-000518', date: '15-07-2026', items: [{ name: 'Jassquate 61sl (bulk) 200 Ltr', code: 'AI-000519', unit: '0.400' }, { name: 'Jassquate 400 Ml (bottle)', code: 'AI-000520', unit: '1.000' }] },
    { id: 3, no: 'AIB-000179', product: 'New Churanto 1.8ec 50 Ml', pcode: 'AI-000717', date: '09-07-2026', items: [{ name: 'New Churanto 1.8ec (bulk) 200 Ltr', code: 'AI-000711', unit: '0.050' }, { name: 'White Bottle 50 Ml', code: 'AI-000153', unit: '1.000' }] },
    { id: 4, no: 'AIB-000178', product: 'New Churanto 1.8ec 100 Ml', pcode: 'AI-000716', date: '08-07-2026', items: [{ name: 'New Churanto 1.8ec (bulk) 200 Ltr', code: 'AI-000711', unit: '0.100' }, { name: 'White Bottle 100 Ml', code: 'AI-000154', unit: '1.000' }] },
    { id: 5, no: 'AIB-000177', product: 'New Churanto 1.8ec 400 Ml', pcode: 'AI-000715', date: '07-07-2026', items: [{ name: 'New Churanto 1.8ec (bulk) 200 Ltr', code: 'AI-000711', unit: '0.400' }, { name: 'White Bottle 400 Ml', code: 'AI-000155', unit: '1.000' }] },
    { id: 6, no: 'AIB-000176', product: 'Smart Humic Acid (Crystal) 1kg', pcode: 'AI-000710', date: '02-07-2026', items: [{ name: 'Humic Acid Crystal (bulk) 25 Kg', code: 'AI-000709', unit: '1.000' }] },
    { id: 7, no: 'AIB-000175', product: 'Smart Humic Acid (B) 1kg', pcode: 'AI-000688', date: '20-05-2026', items: [{ name: 'Humic Acid B (bulk) 25 Kg', code: 'AI-000687', unit: '1.000' }] },
    { id: 8, no: 'AIB-000174', product: 'Smart All Saline 250 gm', pcode: 'AI-000680', date: '02-05-2026', items: [{ name: 'All Saline (bulk) 25 Kg', code: 'AI-000679', unit: '0.250' }] },
    { id: 9, no: 'AIB-000173', product: 'Smart All Saline 1 kg', pcode: 'AI-000555', date: '02-05-2026', items: [{ name: 'All Saline (bulk) 25 Kg', code: 'AI-000679', unit: '1.000' }] },
    { id: 10, no: 'AIB-000172', product: 'Memory Plus 32.5sc 1 Ltr', pcode: 'AI-000676', date: '30-04-2026', items: [{ name: 'Memory Plus 32.5sc (bulk) 200 Ltr', code: 'AI-000677', unit: '1.000' }, { name: 'White Bottle 1 Ltr', code: 'AI-000156', unit: '1.000' }] },
    { id: 11, no: 'AIB-000171', product: 'Ziolite 10 Kg', pcode: 'AI-000673', date: '12-04-2026', items: [{ name: 'Ziolite (bulk) 50 Kg', code: 'AI-000672', unit: '1.000' }, { name: 'Ziolite 10 Kg (packet)', code: 'AI-000674', unit: '1.000' }] },
    { id: 12, no: 'AIB-000170', product: 'Ziolite 5 Kg', pcode: 'AI-000672', date: '12-04-2026', items: [{ name: 'Ziolite (bulk) 50 Kg', code: 'AI-000672', unit: '1.000' }, { name: 'Ziolite 5 Kg (packet)', code: 'AI-000675', unit: '1.000' }] },
];

const productOptions = batches.map(b => b.product);
const materialOptions = ['Agri Zink( Bulk) 50 kg [AI-000727]', 'Agri Zink (packet) 1kg [AI-000728]', 'White Bottle 50 Ml [AI-000153]', 'White Bottle 100 Ml [AI-000154]', 'Ziolite (bulk) 50 Kg [AI-000672]'];

// ---- Batch detail (separate page) ----
function BatchDetail({ row, onBack }) {
    return (
        <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: '24px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '20px' }}>
                <button onClick={() => window.print()} style={{ padding: '7px 14px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>🖨️</button>
                <button onClick={onBack} style={{ padding: '7px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '13px' }}>← Back</button>
            </div>

            <CompanyHeader />

            <div style={{ marginTop: '20px', marginBottom: '16px', fontSize: '13px' }}>
                <div style={{ fontWeight: '700', color: '#1a2035' }}>Batch Item</div>
                <div style={{ fontWeight: '700' }}>{row.product} [{row.pcode}]</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ border: '1px solid #999', padding: '7px', fontSize: '12px', textAlign: 'left', width: '55px' }}>S/N</th>
                        <th style={{ border: '1px solid #999', padding: '7px', fontSize: '12px', textAlign: 'left' }}>Name</th>
                        <th style={{ border: '1px solid #999', padding: '7px', fontSize: '12px', textAlign: 'right', width: '220px' }}>Batch Unit</th>
                    </tr>
                </thead>
                <tbody>
                    {row.items.map((it, i) => (
                        <tr key={it.code + i}>
                            <td style={{ border: '1px solid #999', padding: '7px', fontSize: '12px' }}>{i + 1}</td>
                            <td style={{ border: '1px solid #999', padding: '7px', fontSize: '12px' }}>{it.name} [{it.code}]</td>
                            <td style={{ border: '1px solid #999', padding: '7px', fontSize: '12px', textAlign: 'right' }}>{it.unit}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ---- Add Batch ----
function AddBatch({ onBack }) {
    const [batchProduct, setBatchProduct] = useState('');
    const [row, setRow] = useState({ material: '', qty: '' });
    const [items, setItems] = useState([]);
    const inp = { width: '100%', padding: '9px 12px', border: '1px solid #dee2e6', borderRadius: '5px', fontSize: '13px', boxSizing: 'border-box' };
    const lbl = { fontSize: '14px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '7px' };

    const addProduct = () => {
        if (!row.material) return;
        setItems(prev => [...prev, { ...row, id: Date.now() }]);
        setRow({ material: '', qty: '' });
    };

    return (
        <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #e9ecef', fontSize: '15px', color: '#333' }}>Add Batch</div>
            <div style={{ padding: '22px' }}>
                <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #f0f0f0' }}>
                    <label style={lbl}>Batch Product</label>
                    <select value={batchProduct} onChange={e => setBatchProduct(e.target.value)} style={{ ...inp, maxWidth: '770px' }}>
                        <option value="">🔍 Please select</option>
                        {productOptions.map(p => <option key={p}>{p}</option>)}
                    </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '18px', alignItems: 'end' }}>
                    <div>
                        <label style={lbl}>Material</label>
                        <select value={row.material} onChange={e => setRow(p => ({ ...p, material: e.target.value }))} style={inp}>
                            <option value="">🔍 Please select</option>
                            {materialOptions.map(m => <option key={m}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Quantity</label>
                        <input placeholder="Quantity" value={row.qty} onChange={e => setRow(p => ({ ...p, qty: e.target.value }))} style={inp} />
                    </div>
                    <button onClick={addProduct} style={{ padding: '10px', background: '#1e7e34', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>Add Product</button>
                </div>

                {items.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', fontSize: '26px', fontWeight: '600', color: '#333' }}>Empty Items Table</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', margin: '24px 0' }}>
                        <thead>
                            <tr style={{ background: '#1a2035' }}>
                                <th style={thS}>#</th><th style={thS}>Material</th><th style={thS}>Quantity</th><th style={thS}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((it, i) => (
                                <tr key={it.id}>
                                    <td style={tdS}>{i + 1}</td>
                                    <td style={tdS}>{it.material}</td>
                                    <td style={tdS}>{it.qty}</td>
                                    <td style={tdS}>
                                        <button onClick={() => setItems(items.filter(x => x.id !== it.id))} style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', padding: '3px 9px', cursor: 'pointer' }}>🗑</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
                    <button onClick={onBack} style={{ padding: '8px 22px', background: '#4e73df', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>Go Back</button>
                    <button style={{ padding: '8px 22px', background: '#1e7e34', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>Save</button>
                </div>
            </div>
        </div>
    );
}

const emptyF = { product: '', date: '', no: '' };

function Batch() {
    const [view, setView] = useState('list');
    const [detail, setDetail] = useState(null);
    const [draft, setDraft] = useState(emptyF);
    const [applied, setApplied] = useState(emptyF);

    const handleGo = () => setApplied(draft);
    const handleClear = () => { setDraft(emptyF); setApplied(emptyF); };

    const filtered = batches.filter(b => {
        if (applied.product && b.product !== applied.product) return false;
        if (applied.date && toISO(b.date) !== applied.date) return false;
        if (applied.no && !b.no.toLowerCase().includes(applied.no.toLowerCase())) return false;
        return true;
    });

    if (view === 'add') return <AddBatch onBack={() => setView('list')} />;
    if (detail) return <BatchDetail row={detail} onBack={() => setDetail(null)} />;

    const fInp = { padding: '9px 12px', border: '1px solid #ced4da', borderRadius: '5px', fontSize: '13px' };

    return (
        <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: '22px' }}>
            <div style={{ borderBottom: '2px solid #0d6efd', paddingBottom: '14px', marginBottom: '18px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#0d6efd' }}>📋 Batch</div>
                <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '2px' }}>Detailed batch record</div>
            </div>

            <div style={{ background: '#f0f9ff', padding: '14px 16px', borderRadius: '5px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '18px' }}>
                <select value={draft.product} onChange={e => setDraft(p => ({ ...p, product: e.target.value }))} style={{ ...fInp, minWidth: '300px' }}>
                    <option value="">🔍 Select Product</option>
                    {productOptions.map(p => <option key={p}>{p}</option>)}
                </select>
                <input type="date" value={draft.date} onChange={e => setDraft(p => ({ ...p, date: e.target.value }))} style={{ ...fInp, width: '200px' }} />
                <input placeholder="🔍 Batch No" value={draft.no} onChange={e => setDraft(p => ({ ...p, no: e.target.value }))} style={{ ...fInp, width: '200px' }} />
                <button onClick={handleGo} style={{ padding: '9px 20px', background: '#1e7e34', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>🔍 Go</button>
                <button onClick={handleClear} style={{ padding: '9px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>✕ Clear</button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#1a2035' }}>
                            <th style={{ ...thS, width: '55px' }}>SL</th>
                            <th style={thS}>No</th>
                            <th style={thS}>Product</th>
                            <th style={thS}>Date</th>
                            <th style={{ ...thS, textAlign: 'right' }}>
                                Action&nbsp;
                                <button onClick={() => setView('add')} style={{ padding: '3px 11px', background: '#28a745', color: 'white', border: 'none', borderRadius: '3px', fontSize: '12px', cursor: 'pointer' }}>Add</button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={5} style={{ ...tdS, textAlign: 'center', padding: '30px', color: '#adb5bd' }}>No data found</td></tr>
                        ) : filtered.map((b, i) => (
                            <tr key={b.id} style={{ background: i % 2 === 0 ? 'white' : '#f8fbfd' }}>
                                <td style={{ ...tdS, textAlign: 'center' }}>{i + 1}</td>
                                <td style={tdS}>{b.no}</td>
                                <td style={tdS}>{b.product}[{b.pcode}]</td>
                                <td style={{ ...tdS, whiteSpace: 'nowrap' }}>{b.date}</td>
                                <td style={{ ...tdS, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                    <button onClick={() => setDetail(b)} title="Show" style={{ padding: '6px 12px', background: '#4e73df', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', marginRight: '4px', fontWeight: '700' }}>i</button>
                                    <button onClick={() => setView('add')} title="Edit" style={{ padding: '6px 11px', background: '#1e7e34', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>✎</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Batch;
