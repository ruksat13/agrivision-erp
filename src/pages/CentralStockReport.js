import React, { useState } from 'react';

const thS = { padding: '10px', color: 'white', fontWeight: '700', fontSize: '13px', textAlign: 'center', whiteSpace: 'nowrap', border: '1px solid #2d3a5a' };
const tdS = { padding: '9px 10px', fontSize: '13px', color: '#333', border: '1px solid #e6ebf0', textAlign: 'right', whiteSpace: 'nowrap' };

// grouped products: each group renders with a rowSpan cell for the group name
const groups = [
    {
        group: 'Green Charge 4CPA',
        rows: [
            { unit: '100 Ml x 24', code: 'AI-000051', price: '75.00', head: '1759 Crtn, 21 PCS', headAmt: '3,167,775.00', jes: '170 Crtn, 20 PCS', jesAmt: '307,500.00', jam: '163 Crtn', jamAmt: '293,400.00', tot: '2092 Crtn , 41 PCS', totAmt: '3,768,675.00' },
            { unit: '500 Ml x 10', code: 'AI-000050', price: '271.00', head: '1930 Crtn, 9 PCS', headAmt: '5,232,739.00', jes: '389 Crtn, 3 PCS', jesAmt: '1,055,003.00', jam: '252 Crtn, 9 PCS', jamAmt: '685,359.00', tot: '2571 Crtn , 21 PCS', totAmt: '6,973,101.00' },
            { unit: '1 Ltr x 6', code: 'AI-000049', price: '463.00', head: '2182 Crtn, 2 PCS', headAmt: '6,062,522.00', jes: '172 Crtn', jesAmt: '477,816.00', jam: '310 Crtn', jamAmt: '861,180.00', tot: '2664 Crtn , 2 PCS', totAmt: '7,401,518.00' },
            { unit: '5 Ltr x 1', code: 'AI-000048', price: '2145.00', head: '1614 Crtn', headAmt: '3,462,030.00', jes: '195 Crtn', jesAmt: '418,275.00', jam: '74 Crtn', jamAmt: '158,730.00', tot: '1883 Crtn', totAmt: '4,039,035.00' },
        ],
    },
    {
        group: 'Memory Plus 32.5SC',
        rows: [
            { unit: '50 Ml x 24', code: 'AI-000055', price: '175.00', head: '647 Crtn, 18 PCS', headAmt: '2,720,550.00', jes: '47 Crtn, 17 PCS', jesAmt: '200,375.00', jam: '49 Crtn', jamAmt: '205,800.00', tot: '743 Crtn , 35 PCS', totAmt: '3,126,725.00' },
            { unit: '100 Ml x 24', code: 'AI-000054', price: '320.00', head: '910 Crtn, 10 PCS', headAmt: '6,992,000.00', jes: '54 Crtn', jesAmt: '414,720.00', jam: '57 Crtn', jamAmt: '437,760.00', tot: '1021 Crtn , 10 PCS', totAmt: '7,844,480.00' },
            { unit: '400 Ml x 9', code: 'AI-000053', price: '1250.00', head: '334 Crtn, 8 PCS', headAmt: '3,767,500.00', jes: '16 Crtn, 6 PCS', jesAmt: '187,500.00', jam: '32 Crtn, 6 PCS', jamAmt: '367,500.00', tot: '382 Crtn , 20 PCS', totAmt: '4,322,500.00' },
            { unit: '500 Ml x 10', code: 'AI-000052', price: '1525.00', head: '293 Crtn, 5 PCS', headAmt: '4,475,875.00', jes: '32 Crtn', jesAmt: '488,000.00', jam: '10 Crtn', jamAmt: '152,500.00', tot: '335 Crtn , 5 PCS', totAmt: '5,116,375.00' },
            { unit: '1 Ltr x 6', code: 'AI-000676', price: '2850.00', head: '92 Crtn', headAmt: '1,573,200.00', jes: '5 Crtn', jesAmt: '85,500.00', jam: '1 Crtn', jamAmt: '17,100.00', tot: '98 Crtn', totAmt: '1,675,800.00' },
        ],
    },
    {
        group: 'Pahar 80WDG',
        rows: [
            { unit: '2 Gm x 100', code: 'AI-000468', price: '21.00', head: '164 Crtn, 50 PCS', headAmt: '345,450.00', jes: '135 Crtn', jesAmt: '283,500.00', jam: '11 Crtn', jamAmt: '23,100.00', tot: '310 Crtn , 50 PCS', totAmt: '652,050.00' },
            { unit: '10 Gm x 40', code: 'AI-000074', price: '82.00', head: '833 Crtn, 4 PCS', headAmt: '2,732,568.00', jes: '40 Crtn', jesAmt: '131,200.00', jam: '24 Crtn', jamAmt: '78,720.00', tot: '897 Crtn , 4 PCS', totAmt: '2,942,488.00' },
            { unit: '25 Gm x 20', code: 'AI-000073', price: '190.00', head: '1068 Crtn, 7 PCS', headAmt: '4,059,730.00', jes: '28 Crtn', jesAmt: '106,400.00', jam: '247 Crtn', jamAmt: '938,600.00', tot: '1343 Crtn , 7 PCS', totAmt: '5,104,730.00' },
            { unit: '50 Gm x 24', code: 'AI-000072', price: '360.00', head: '333 Crtn, 19 PCS', headAmt: '2,883,960.00', jes: '18 Crtn, 23 PCS', jesAmt: '163,800.00', jam: '54 Crtn', jamAmt: '466,560.00', tot: '405 Crtn , 42 PCS', totAmt: '3,514,320.00' },
            { unit: '100 Gm x 24', code: 'AI-000071', price: '672.00', head: '501 Crtn, 2 PCS', headAmt: '8,081,472.00', jes: '58 Crtn, 21 PCS', jesAmt: '949,536.00', jam: '21 Crtn', jamAmt: '338,688.00', tot: '580 Crtn , 23 PCS', totAmt: '9,369,696.00' },
        ],
    },
];

function CentralStockReport() {
    const [draft, setDraft] = useState('');
    const [applied, setApplied] = useState('');

    const handleGo = () => setApplied(draft);
    const handleClear = () => { setDraft(''); setApplied(''); };

    const filteredGroups = groups
        .map(g => {
            if (!applied) return g;
            const k = applied.toLowerCase();
            if (g.group.toLowerCase().includes(k)) return g;
            const rows = g.rows.filter(r => r.code.toLowerCase().includes(k) || r.unit.toLowerCase().includes(k));
            return rows.length ? { ...g, rows } : null;
        })
        .filter(Boolean);

    let sl = 0;

    return (
        <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: '22px' }}>
            <div style={{ borderBottom: '2px solid #0d6efd', paddingBottom: '14px', marginBottom: '18px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#0d6efd' }}>📊 Central stock</div>
                <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '2px' }}>Detailed product stock record</div>
            </div>

            <div style={{ background: '#f0f9ff', padding: '14px 16px', borderRadius: '5px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '18px' }}>
                <input placeholder="Product name or code" value={draft} onChange={e => setDraft(e.target.value)}
                    style={{ padding: '9px 12px', border: '1px solid #ced4da', borderRadius: '5px', fontSize: '13px', width: '230px' }} />
                <button onClick={handleGo} style={{ padding: '9px 20px', background: '#1e7e34', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>🔍 Go</button>
                <button onClick={handleClear} style={{ padding: '9px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>✕ Clear</button>
                <button onClick={() => window.print()} style={{ padding: '9px 14px', background: '#1e7e34', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>🖨️</button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#1a2035' }}>
                            <th style={{ ...thS, width: '45px' }} rowSpan={2}>SL</th>
                            <th style={{ ...thS, textAlign: 'left' }} rowSpan={2}>Group / Product Name</th>
                            <th style={thS} rowSpan={2}>Unit &amp; Pack</th>
                            <th style={thS} rowSpan={2}>Price</th>
                            <th style={thS} colSpan={2}>Head Office</th>
                            <th style={thS} colSpan={2}>Jessore Office</th>
                            <th style={thS} colSpan={2}>Jamalpur Office</th>
                            <th style={thS} colSpan={2}>Total</th>
                        </tr>
                        <tr style={{ background: '#1a2035' }}>
                            <th style={thS}>Crtn</th><th style={thS}>Amount</th>
                            <th style={thS}>Crtn</th><th style={thS}>Amount</th>
                            <th style={thS}>Crtn</th><th style={thS}>Amount</th>
                            <th style={thS}>Crtn</th><th style={thS}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredGroups.length === 0 ? (
                            <tr><td colSpan={12} style={{ ...tdS, textAlign: 'center', padding: '30px', color: '#adb5bd' }}>No data found</td></tr>
                        ) : filteredGroups.map(g => (
                            g.rows.map((r, ri) => {
                                sl += 1;
                                return (
                                    <tr key={g.group + r.code} style={{ background: sl % 2 === 0 ? '#f8fbfd' : 'white' }}>
                                        <td style={{ ...tdS, textAlign: 'center' }}>{sl}</td>
                                        {ri === 0 && (
                                            <td style={{ ...tdS, textAlign: 'left', fontWeight: '600', verticalAlign: 'middle', background: 'white' }} rowSpan={g.rows.length}>
                                                {g.group}
                                            </td>
                                        )}
                                        <td style={{ ...tdS, textAlign: 'left' }}>
                                            <div>{r.unit}</div>
                                            <div style={{ fontSize: '11px', color: '#6c757d' }}>{r.code}</div>
                                        </td>
                                        <td style={tdS}>{r.price}</td>
                                        <td style={tdS}>{r.head}</td>
                                        <td style={tdS}>{r.headAmt}</td>
                                        <td style={tdS}>{r.jes}</td>
                                        <td style={tdS}>{r.jesAmt}</td>
                                        <td style={tdS}>{r.jam}</td>
                                        <td style={tdS}>{r.jamAmt}</td>
                                        <td style={tdS}>{r.tot}</td>
                                        <td style={tdS}>{r.totAmt}</td>
                                    </tr>
                                );
                            })
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default CentralStockReport;
