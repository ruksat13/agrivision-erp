import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    stockReport, listProducts, officeOptions, officeLabel,
    PRODUCT_CATEGORY, PRODUCT_TYPE,
} from '../services';
import { Notice, useCollection } from '../components/Notice';

// Stock status, computed from the ledger.
//
// SCREEN-AUDIT.md §4.1: this screen held sixteen rows of hardcoded STRINGS
// ('917', '7927', '912/24\n38') so the figures never moved when something was
// sold. stockReport() in src/services/stock.js already summed the real ones out
// of stock_movements and nothing called it. This screen now does.
//
// Stock is the sum of movements — no screen writes a stock figure — so a sale
// saved on /sales-entry writes its `sale` movement in the same batch as the
// invoice and shows up here as a smaller number, with the quantity in the Sell
// column. That is §4.1 closed on the reporting side.
//
// ── The four selects (SCREEN-AUDIT.md §4.5) ───────────────────────────────
// Brand, Category, Type and Office existed and filtered nothing; only `query`
// was read. The audit note says the rows "carry no brand or category field, so
// these cannot be made to work without a schema change" — that was true of the
// hardcoded array, and the schema change has since happened. `products` carries
// `category`, `type` and `brandId` (schema §4.1) and `stock_movements` carries
// `officeId` (§4.6), so all four now filter:
//
//   Office     re-runs the query — stockReport({ officeId }) filters in
//              Firestore, and no office selected means every office summed
//   Category   from the PRODUCT_CATEGORY enumeration
//   Type       from the PRODUCT_TYPE enumeration
//   Brand      from the distinct brandId values in the catalogue, because
//              `brands` is a Tier 2 collection that has not been migrated and
//              the products are therefore the only record of what exists
//
// A movement row carries the product's id and name but not its category, so the
// catalogue is read alongside and joined on the code. That is also where the
// unit, the average cost and the value come from.
//
// The Booked column is gone. Nothing in the schema or the service layer
// produces it — 'booked' appears nowhere but in the array this file used to
// hold — and it could not: createSale() writes the stock movement at the moment
// the invoice is raised, so there is no quantity that is ordered but not yet
// taken out of stock. An always-empty column is the same dead control the four
// selects were.

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
    damage: '#fdf7e6',
    avg: '#eef2fa',
    amount: '#e9eefa',
};

const emptyF = { query: '', brand: '', category: '', type: '', office: '' };

const qty = (n) => (Number(n) ? Number(n).toLocaleString('en-US') : '');
const money = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function StockReport() {
    const [draft, setDraft] = useState(emptyF);
    const [applied, setApplied] = useState(emptyF);

    // Office is the one filter that changes the QUERY rather than the rows:
    // stockReport() takes officeId and Firestore applies it, so an office is
    // one office's ledger and no office is every office summed. The other three
    // narrow what has already been read.
    const load = useCallback(async () => {
        const [rows, products] = await Promise.all([
            stockReport({ officeId: applied.office }),
            listProducts({ status: null }),
        ]);
        const byCode = new Map(products.map(p => [p.code, p]));
        return rows.map(r => ({ ...r, product: byCode.get(r.productId) || null }));
    }, [applied.office]);

    const { rows, loading, error, reload } = useCollection(load, { what: 'the stock report' });

    // useCollection loads on mount and holds the loader in a ref, so changing
    // the office does not re-fetch on its own. This does it, skipping the first
    // pass so the mount does not fetch twice — the same arrangement AuditLog.js
    // uses for its filter.
    const first = useRef(true);
    useEffect(() => {
        if (first.current) { first.current = false; return; }
        reload();
    }, [applied.office, reload]);

    // `brands` was never migrated (SCREEN-AUDIT.md §4.4), so the catalogue is
    // the only record of which brands exist. Hardcoding a second list here is
    // what put 'Rainbow', 'Canary' and 'Sufola' on a screen that has never held
    // a product from any of them.
    const brands = useMemo(() => (
        [...new Set(rows.map(r => r.product?.brandId).filter(Boolean))].sort()
    ), [rows]);

    const handleGo = () => setApplied(draft);
    const handleClear = () => { setDraft(emptyF); setApplied(emptyF); };

    const filtered = rows.filter(r => {
        if (applied.query) {
            const k = applied.query.toLowerCase();
            if (!(r.productName || '').toLowerCase().includes(k)
                && !(r.productCode || '').toLowerCase().includes(k)) return false;
        }
        // A movement whose product has been removed from the catalogue still has
        // stock and still belongs in the report, but it cannot answer a question
        // about its brand, category or type — so it drops out of those filters
        // rather than being silently counted as a match.
        if (applied.brand && r.product?.brandId !== applied.brand) return false;
        if (applied.category && r.product?.category !== applied.category) return false;
        if (applied.type && r.product?.type !== applied.type) return false;
        return true;
    });

    const fInp = { padding: '9px 12px', border: '1px solid #ced4da', borderRadius: '5px', fontSize: '13px' };

    return (
        <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: '22px' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#333', marginBottom: '18px' }}>
                &gt; Stock status
                <span style={{ fontSize: '13px', fontWeight: 400, color: '#6c757d', marginLeft: 10 }}>
                    {applied.office ? officeLabel(applied.office) : 'all offices'} · {filtered.length} product{filtered.length === 1 ? '' : 's'}
                </span>
            </div>

            {loading && <Notice tone="info">Loading the stock report…</Notice>}
            {error && <Notice tone="warn">{error}</Notice>}

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '18px' }}>
                <input placeholder="Query" value={draft.query} onChange={e => setDraft(p => ({ ...p, query: e.target.value }))} style={{ ...fInp, width: '230px' }} />
                <select value={draft.brand} onChange={e => setDraft(p => ({ ...p, brand: e.target.value }))} style={{ ...fInp, minWidth: '210px' }}>
                    <option value="">Select Brand</option>
                    {brands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <select value={draft.category} onChange={e => setDraft(p => ({ ...p, category: e.target.value }))} style={{ ...fInp, minWidth: '210px' }}>
                    <option value="">Select Category</option>
                    {PRODUCT_CATEGORY.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={draft.type} onChange={e => setDraft(p => ({ ...p, type: e.target.value }))} style={{ ...fInp, minWidth: '210px' }}>
                    <option value="">Select Type</option>
                    {PRODUCT_TYPE.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={draft.office} onChange={e => setDraft(p => ({ ...p, office: e.target.value }))} style={{ ...fInp, minWidth: '210px' }}>
                    <option value="">Select Office</option>
                    {officeOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <button onClick={handleGo} style={{ padding: '9px 20px', background: '#1e7e34', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>Go</button>
                <button onClick={handleClear} style={{ padding: '9px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>Clear</button>
                <button onClick={() => window.print()} style={{ padding: '9px 14px', background: '#1e7e34', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>🖨️</button>
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
                            <th style={thS}>Damage</th>
                            <th style={thS}>AVG Unit</th>
                            <th style={thS}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={12} style={{ ...tdS, textAlign: 'center', padding: '30px', color: '#adb5bd' }}>
                                {loading ? 'Loading…' : 'No data found'}
                            </td></tr>
                        ) : filtered.map((p, i) => {
                            const avg = Number(p.product?.buyPrice || 0);
                            return (
                                <tr key={p.productId} style={{ background: i % 2 === 0 ? 'white' : '#f8fbfd' }}>
                                    <td style={{ ...tdS, textAlign: 'left' }}>{i + 1}</td>
                                    <td style={{ ...tdS, textAlign: 'left', whiteSpace: 'normal', minWidth: '280px' }}>
                                        {p.productName} [{p.productCode}] {p.product?.packSize || ''}
                                    </td>
                                    <td style={{ ...tdS, background: colBg.stock, fontWeight: 700, color: p.stock < 0 ? '#dc3545' : '#333' }}>
                                        {Number(p.stock).toLocaleString('en-US')}
                                    </td>
                                    <td style={{ ...tdS, background: colBg.opening }}>{qty(p.opening)}</td>
                                    <td style={{ ...tdS, background: colBg.purchase }}>{qty(p.purchase)}</td>
                                    <td style={{ ...tdS, background: colBg.repacking }}>{qty(p.repacking)}</td>
                                    <td style={{ ...tdS, background: colBg.raw }}>{qty(p.raw)}</td>
                                    <td style={{ ...tdS, background: colBg.return }}>{qty(p.ret)}</td>
                                    <td style={{ ...tdS, background: colBg.sell }}>{qty(p.sell)}</td>
                                    <td style={{ ...tdS, background: colBg.damage }}>{qty(p.damage)}</td>
                                    <td style={{ ...tdS, background: colBg.avg }}>{avg ? money(avg) : ''}</td>
                                    <td style={{ ...tdS, background: colBg.amount }}>{avg ? money(p.stock * avg) : ''}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <p style={{ fontSize: 12, color: '#6c757d', marginTop: 14, lineHeight: 1.6 }}>
                Every figure is summed from <code>stock_movements</code> at read time — nothing here is
                stored, so selling, receiving, repacking or writing off stock moves it on the next
                load. <b>Raw</b>, <b>Sell</b> and <b>Damage</b> are shown as positive quantities; the
                ledger stores them negative, which is why <b>Stock</b> is their net.
                <br />
                <b>AVG Unit</b> is <code>products.buyPrice</code>, the recorded average cost, and{' '}
                <b>Amount</b> is the stock at that cost. A product whose cost has never been recorded
                leaves both blank rather than valuing it at zero.
            </p>
        </div>
    );
}

export default StockReport;
