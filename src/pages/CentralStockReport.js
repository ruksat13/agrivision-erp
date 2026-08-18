import React, { useState, useCallback, useMemo } from 'react';
import { centralStockReport, listProducts, OFFICE, officeLabel, PRODUCT_CATEGORY } from '../services';
import { Notice, useCollection } from '../components/Notice';

// Central stock: one row per product, one column pair per office.
//
// This screen does NOT share a component with StockReport.js — it never did.
// The two render different tables from the same ledger: Stock Report breaks one
// office down by movement type, Central Stock breaks every product across the
// offices. They are handled consistently in the sense that matters, which is
// that neither holds figures any more: centralStockReport() in
// src/services/stock.js was written alongside stockReport(), had no caller
// either, and this screen now uses it.
//
// ── What the columns are made of ──────────────────────────────────────────
// The service returns a quantity per office and a total. Everything else is
// joined from the catalogue on the product code:
//
//   Price          products.mrp
//   Crtn / PCS     the quantity divided by products.cartonQty — schema §4.1
//                  says outright that "Central Stock's Crtn, PCS is derived
//                  from this"
//   Amount         the quantity at the MRP, in pieces, not cartons
//
// ── The grouping ──────────────────────────────────────────────────────────
// The hardcoded version grouped by product family ('Green Charge 4CPA',
// 'Memory Plus 32.5SC'). There is no family field in the schema and inventing
// one by parsing product names would be a guess that breaks on the first
// product named differently. Rows are grouped by `category` instead, which is a
// real required field and the one Feature 1 already gates on. A product with no
// catalogue row behind it — a movement written against something since removed
// — groups under 'Uncategorised' rather than disappearing.

const thS = { padding: '10px', color: 'white', fontWeight: '700', fontSize: '13px', textAlign: 'center', whiteSpace: 'nowrap', border: '1px solid #2d3a5a' };
const tdS = { padding: '9px 10px', fontSize: '13px', color: '#333', border: '1px solid #e6ebf0', textAlign: 'right', whiteSpace: 'nowrap' };

const money = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * "1759 Crtn, 21 PCS" — the notation this screen has always printed. A product
 * packed one to a carton is just a piece count; saying "630 Crtn" of something
 * that has no carton would be worse than saying nothing.
 */
function cartons(qty, cartonQty) {
    const n = Number(qty || 0);
    const per = Number(cartonQty || 1);
    if (!n) return '';
    if (per <= 1) return `${n.toLocaleString('en-US')} PCS`;
    const whole = Math.trunc(n / per);
    const rest = n % per;
    if (!whole) return `${rest} PCS`;
    return `${whole.toLocaleString('en-US')} Crtn${rest ? `, ${rest} PCS` : ''}`;
}

// The catalogue order, then anything the catalogue does not know about.
const groupRank = (category) => {
    const i = PRODUCT_CATEGORY.indexOf(category);
    return i === -1 ? PRODUCT_CATEGORY.length : i;
};

function CentralStockReport() {
    const [draft, setDraft] = useState('');
    const [applied, setApplied] = useState('');

    const load = useCallback(async () => {
        const [rows, products] = await Promise.all([
            centralStockReport(),
            listProducts({ status: null }),
        ]);
        const byCode = new Map(products.map(p => [p.code, p]));
        return rows.map(r => {
            const product = byCode.get(r.productId) || null;
            return {
                ...r,
                product,
                category: product?.category || 'Uncategorised',
                cartonQty: Number(product?.cartonQty || 1),
                price: Number(product?.mrp || 0),
                packSize: product?.packSize || '',
            };
        });
    }, []);

    const { rows, loading, error } = useCollection(load, { what: 'central stock' });

    const handleGo = () => setApplied(draft);
    const handleClear = () => { setDraft(''); setApplied(''); };

    const groups = useMemo(() => {
        const k = applied.toLowerCase();
        const matched = k
            ? rows.filter(r =>
                (r.productName || '').toLowerCase().includes(k)
                || (r.productCode || '').toLowerCase().includes(k)
                || (r.packSize || '').toLowerCase().includes(k)
                || r.category.toLowerCase().includes(k))
            : rows;

        const byCategory = new Map();
        matched.forEach(r => {
            if (!byCategory.has(r.category)) byCategory.set(r.category, []);
            byCategory.get(r.category).push(r);
        });

        return [...byCategory.entries()]
            .map(([group, list]) => ({ group, rows: list }))
            .sort((a, b) => groupRank(a.group) - groupRank(b.group) || a.group.localeCompare(b.group));
    }, [rows, applied]);

    const grandTotal = groups.reduce(
        (sum, g) => sum + g.rows.reduce((s, r) => s + r.total * r.price, 0), 0,
    );

    let sl = 0;

    return (
        <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: '22px' }}>
            <div style={{ borderBottom: '2px solid #0d6efd', paddingBottom: '14px', marginBottom: '18px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#0d6efd' }}>📊 Central stock</div>
                <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '2px' }}>Detailed product stock record</div>
            </div>

            {loading && <Notice tone="info">Loading central stock…</Notice>}
            {error && <Notice tone="warn">{error}</Notice>}

            <div style={{ background: '#f0f9ff', padding: '14px 16px', borderRadius: '5px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '18px' }}>
                <input placeholder="Product name, code or category" value={draft} onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleGo()}
                    style={{ padding: '9px 12px', border: '1px solid #ced4da', borderRadius: '5px', fontSize: '13px', width: '260px' }} />
                <button onClick={handleGo} style={{ padding: '9px 20px', background: '#1e7e34', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>🔍 Go</button>
                <button onClick={handleClear} style={{ padding: '9px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>✕ Clear</button>
                <button onClick={() => window.print()} style={{ padding: '9px 14px', background: '#1e7e34', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>🖨️</button>
                <div style={{ marginLeft: 'auto', fontSize: 13, color: '#495057' }}>
                    Stock at MRP: <b>৳ {money(grandTotal)}</b>
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#1a2035' }}>
                            <th style={{ ...thS, width: '45px' }} rowSpan={2}>SL</th>
                            <th style={{ ...thS, textAlign: 'left' }} rowSpan={2}>Category / Product Name</th>
                            <th style={thS} rowSpan={2}>Unit &amp; Pack</th>
                            <th style={thS} rowSpan={2}>Price</th>
                            {OFFICE.map(o => <th key={o} style={thS} colSpan={2}>{officeLabel(o)}</th>)}
                            <th style={thS} colSpan={2}>Total</th>
                        </tr>
                        <tr style={{ background: '#1a2035' }}>
                            {OFFICE.map(o => (
                                <React.Fragment key={o}>
                                    <th style={thS}>Crtn</th><th style={thS}>Amount</th>
                                </React.Fragment>
                            ))}
                            <th style={thS}>Crtn</th><th style={thS}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groups.length === 0 ? (
                            <tr><td colSpan={6 + OFFICE.length * 2} style={{ ...tdS, textAlign: 'center', padding: '30px', color: '#adb5bd' }}>
                                {loading ? 'Loading…' : 'No data found'}
                            </td></tr>
                        ) : groups.map(g => (
                            g.rows.map((r, ri) => {
                                sl += 1;
                                return (
                                    <tr key={r.productId} style={{ background: sl % 2 === 0 ? '#f8fbfd' : 'white' }}>
                                        <td style={{ ...tdS, textAlign: 'center' }}>{sl}</td>
                                        {ri === 0 && (
                                            <td style={{ ...tdS, textAlign: 'left', fontWeight: '600', verticalAlign: 'middle', background: 'white' }} rowSpan={g.rows.length}>
                                                {g.group}
                                            </td>
                                        )}
                                        <td style={{ ...tdS, textAlign: 'left' }}>
                                            <div>{r.productName}</div>
                                            <div style={{ fontSize: '11px', color: '#6c757d' }}>
                                                {r.packSize && `${r.packSize} · `}{r.productCode}
                                            </div>
                                        </td>
                                        <td style={tdS}>{r.price ? money(r.price) : ''}</td>
                                        {OFFICE.map(o => (
                                            <React.Fragment key={o}>
                                                <td style={tdS}>{cartons(r[o], r.cartonQty)}</td>
                                                <td style={tdS}>{r[o] ? money(r[o] * r.price) : ''}</td>
                                            </React.Fragment>
                                        ))}
                                        <td style={{ ...tdS, fontWeight: 700 }}>{cartons(r.total, r.cartonQty)}</td>
                                        <td style={{ ...tdS, fontWeight: 700 }}>{r.total ? money(r.total * r.price) : ''}</td>
                                    </tr>
                                );
                            })
                        ))}
                    </tbody>
                </table>
            </div>

            <p style={{ fontSize: 12, color: '#6c757d', marginTop: 14, lineHeight: 1.6 }}>
                Quantities are summed from <code>stock_movements</code> per office at read time, so a
                sale raised against one office lowers that office's column and the total, and leaves
                the other two alone. <b>Crtn</b> is the quantity divided by the product's carton size;{' '}
                <b>Amount</b> values the pieces at MRP, not the cartons.
            </p>
        </div>
    );
}

export default CentralStockReport;
