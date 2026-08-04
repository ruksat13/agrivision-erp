import React, { useState } from 'react';

const thS = { padding: '11px 10px', color: 'white', fontWeight: '700', fontSize: '13px', textAlign: 'right', whiteSpace: 'nowrap' };
const tdS = { padding: '10px', fontSize: '13px', color: '#333', borderBottom: '1px solid #eef2f5', textAlign: 'right', whiteSpace: 'nowrap' };

// pastel column tints matching saerp
const colBg = {
    stock: '#fdf8e9',
    opening: '#e9f5ea',
    purchase: '#e9f0fa',
    repacking: '#faf3e6',
    raw: '#f7ecec',
    return: '#e9f2fa',
    sell: '#fdeff0',
    booked: '#eef4ea',
    damage: '#fdf7e6',
    avg: '#eef2fa',
    amount: '#e9eefa',
};

const products = [
    { id: 1, name: 'Cypress 50 ml ( carton print )', code: 'AI-000630', unit: '50 Ml', stock: '917', opening: '85', purchase: '1542', repacking: '', raw: '710.000', ret: '', sell: '', booked: '', damage: '', avg: '22.67', amount: '20,785.33' },
    { id: 2, name: 'Cypress 50 ml ( label )', code: 'AI-000631', unit: '50 Ml', stock: '7927', opening: '269', purchase: '15195', repacking: '', raw: '7536.000', ret: '', sell: '1', booked: '', damage: '', avg: '2.00', amount: '15,854.00' },
    { id: 3, name: 'Jassquate Plus 61sl 100 Ml (carton)', code: 'AI-000659', unit: '100 Ml', stock: '37', opening: '101', purchase: '505', repacking: '', raw: '569.000', ret: '', sell: '', booked: '', damage: '', avg: '30.00', amount: '1,110.00' },
    { id: 4, name: 'New Churanto 1.8 ec 200 Ltr (bulk)', code: 'AI-000711', unit: '200 Ltr', stock: '312', opening: '0', purchase: '2000', repacking: '', raw: '1488.000', ret: '', sell: '200', booked: '', damage: '', avg: '460.00', amount: '143,520.00' },
    { id: 5, name: 'New Bun Mota 25 Kg (bulk)', code: 'AI-000632', unit: '25 KG', stock: '20960', opening: '0', purchase: '60000', repacking: '', raw: '39040.000', ret: '', sell: '', booked: '', damage: '', avg: '21.00', amount: '440,160.00' },
    { id: 6, name: 'New Thaizip (bag) 5 Kg', code: 'AI-000585', unit: '5 Kg', stock: '9119', opening: '5017', purchase: '19974', repacking: '', raw: '15872.000', ret: '', sell: '', booked: '', damage: '', avg: '18.89', amount: '172,219.83' },
    { id: 7, name: 'Smart Yucca All 500 Ml (bottle )', code: 'AI-000567', unit: '500 Ml', stock: '0', opening: '279', purchase: '', repacking: '', raw: '279.000', ret: '', sell: '', booked: '', damage: '', avg: '0.00', amount: '0.00' },
    { id: 8, name: 'Tetop 100 ml', code: 'AI-000642', unit: '100 Ml', stock: '912/24\n38', opening: '0', purchase: '', repacking: '2736', raw: '', ret: '', sell: '696', booked: '168', damage: '', avg: '252.00', amount: '229,824.00' },
    { id: 9, name: 'Tetop 50 ml', code: 'AI-000643', unit: '50 Ml', stock: '1464/24\n61', opening: '0', purchase: '', repacking: '3648', raw: '', ret: '', sell: '1032', booked: '168', damage: '', avg: '133.00', amount: '194,712.00' },
    { id: 10, name: 'Tetop 100 ml (Carton)', code: 'AI-000644', unit: '100 Ml', stock: '0', opening: '24', purchase: '', repacking: '', raw: '24.000', ret: '', sell: '', booked: '', damage: '', avg: '0.00', amount: '0.00' },
    { id: 11, name: 'Tetop 100 ml (Label)', code: 'AI-000645', unit: '100 Ml', stock: '23', opening: '-568', purchase: '3327', repacking: '', raw: '2736.000', ret: '', sell: '', booked: '', damage: '', avg: '1.57', amount: '36.09' },
    { id: 12, name: 'Tetop 50 ml (Label)', code: 'AI-000646', unit: '50 Ml', stock: '-120', opening: '-243', purchase: '3830', repacking: '', raw: '3707.000', ret: '', sell: '', booked: '', damage: '', avg: '1.00', amount: '0.00' },
    { id: 13, name: 'Washer 500 Ml( Golden)', code: 'AI-000606', unit: '500 Ml', stock: '79373', opening: '34761', purchase: '90000', repacking: '', raw: '45388.000', ret: '', sell: '', booked: '', damage: '', avg: '1.25', amount: '99,216.25' },
    { id: 14, name: 'Ziolite 10 Kg', code: 'AI-000673', unit: '10 Kg', stock: '630/1\n630', opening: '0', purchase: '', repacking: '1082', raw: '', ret: '', sell: '', booked: '2', damage: '', avg: '1,210.00', amount: '762,300.00' },
    { id: 15, name: 'Ziolite 10 Kg (packet)', code: 'AI-000674', unit: '10 Kg', stock: '2874', opening: '0', purchase: '4380', repacking: '', raw: '1484.000', ret: '', sell: '', booked: '', damage: '22.00', avg: '28.00', amount: '80,472.00' },
    { id: 16, name: 'Ziolite 5 Kg (packet)', code: 'AI-000675', unit: '5 Kg', stock: '4465', opening: '0', purchase: '7320', repacking: '', raw: '2846.000', ret: '', sell: '', booked: '', damage: '9.00', avg: '17.50', amount: '78,137.50' },
];

const brands = ['Agrivision', 'Rainbow', 'Canary', 'Sufola'];
const categories = ['Pesticide', 'Fertilizer', 'Seed', 'Packaging'];
const types = ['Finished', 'Raw Material', 'Carton', 'Label'];
const offices = ['Head Office', 'Jessore Office', 'Jamalpur Office'];

const emptyF = { query: '', brand: '', category: '', type: '', office: '' };

function StockReport() {
    const [draft, setDraft] = useState(emptyF);
    const [applied, setApplied] = useState(emptyF);

    const handleGo = () => setApplied(draft);
    const handleClear = () => { setDraft(emptyF); setApplied(emptyF); };

    const filtered = products.filter(p => {
        if (applied.query) {
            const k = applied.query.toLowerCase();
            if (!p.name.toLowerCase().includes(k) && !p.code.toLowerCase().includes(k)) return false;
        }
        return true;
    });

    const fInp = { padding: '9px 12px', border: '1px solid #ced4da', borderRadius: '5px', fontSize: '13px' };

    return (
        <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: '22px' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#333', marginBottom: '18px' }}>&gt; Stock status</div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '18px' }}>
                <input placeholder="Query" value={draft.query} onChange={e => setDraft(p => ({ ...p, query: e.target.value }))} style={{ ...fInp, width: '230px' }} />
                <select value={draft.brand} onChange={e => setDraft(p => ({ ...p, brand: e.target.value }))} style={{ ...fInp, minWidth: '210px' }}>
                    <option value="">Select Brand</option>
                    {brands.map(b => <option key={b}>{b}</option>)}
                </select>
                <select value={draft.category} onChange={e => setDraft(p => ({ ...p, category: e.target.value }))} style={{ ...fInp, minWidth: '210px' }}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c}>{c}</option>)}
                </select>
                <select value={draft.type} onChange={e => setDraft(p => ({ ...p, type: e.target.value }))} style={{ ...fInp, minWidth: '210px' }}>
                    <option value="">Select Type</option>
                    {types.map(t => <option key={t}>{t}</option>)}
                </select>
                <select value={draft.office} onChange={e => setDraft(p => ({ ...p, office: e.target.value }))} style={{ ...fInp, minWidth: '210px' }}>
                    <option value="">Select Office</option>
                    {offices.map(o => <option key={o}>{o}</option>)}
                </select>
                <button onClick={handleGo} style={{ padding: '9px 20px', background: '#1e7e34', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>Go</button>
                <button onClick={handleClear} style={{ padding: '9px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>Clear</button>
                <button onClick={() => window.print()} style={{ padding: '9px 14px', background: '#1e7e34', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>🖨️</button>
                <button style={{ padding: '9px 14px', background: '#4e73df', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>📄</button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#1a2035' }}>
                            <th style={{ ...thS, textAlign: 'left', width: '50px' }}>No</th>
                            <th style={{ ...thS, textAlign: 'left' }}>Product</th>
                            <th style={thS}>Stock</th>
                            <th style={thS}>Opening</th>
                            <th style={thS}>Purchase</th>
                            <th style={thS}>Repacking</th>
                            <th style={thS}>Raw</th>
                            <th style={thS}>Return</th>
                            <th style={thS}>Sell</th>
                            <th style={thS}>Booked</th>
                            <th style={thS}>Damage</th>
                            <th style={thS}>AVG Unit</th>
                            <th style={thS}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={13} style={{ ...tdS, textAlign: 'center', padding: '30px', color: '#adb5bd' }}>No data found</td></tr>
                        ) : filtered.map((p, i) => (
                            <tr key={p.id} style={{ background: i % 2 === 0 ? 'white' : '#f8fbfd' }}>
                                <td style={{ ...tdS, textAlign: 'left' }}>{i + 1}</td>
                                <td style={{ ...tdS, textAlign: 'left', whiteSpace: 'normal', minWidth: '280px' }}>
                                    {p.name} [{p.code}] {p.unit}
                                </td>
                                <td style={{ ...tdS, background: colBg.stock, whiteSpace: 'pre-line' }}>{p.stock}</td>
                                <td style={{ ...tdS, background: colBg.opening }}>{p.opening}</td>
                                <td style={{ ...tdS, background: colBg.purchase }}>{p.purchase}</td>
                                <td style={{ ...tdS, background: colBg.repacking }}>{p.repacking}</td>
                                <td style={{ ...tdS, background: colBg.raw }}>{p.raw}</td>
                                <td style={{ ...tdS, background: colBg.return }}>{p.ret}</td>
                                <td style={{ ...tdS, background: colBg.sell }}>{p.sell}</td>
                                <td style={{ ...tdS, background: colBg.booked }}>{p.booked}</td>
                                <td style={{ ...tdS, background: colBg.damage }}>{p.damage}</td>
                                <td style={{ ...tdS, background: colBg.avg }}>{p.avg}</td>
                                <td style={{ ...tdS, background: colBg.amount }}>{p.amount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default StockReport;
