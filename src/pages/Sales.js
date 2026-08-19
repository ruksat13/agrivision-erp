import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    listSales, getSaleWithItems, updateSaleStatus, advanceSale, cancelSale,
    nextStatus, formatDate, officeLabel, officeOptions, actorScope,
    SALE_STATUS,
} from '../services';
import { Notice, useCollection, useFlash } from '../components/Notice';
import { InvoiceSafetySection, SAFETY_PRINT_CSS, PRINT_BODY_FONT } from '../components/SafetyPanel';

// The sales register and the invoice.
//
// Both read Firestore. What used to be here — `confirmRows`, `deliveredRows`,
// `searchOnlyRows` and `mockItems()`, which split whatever total the row
// carried 60/40 across two hardcoded product names — is gone. That fabrication
// is SCREEN-AUDIT.md §2.4: an invoice that invents its own lines cannot carry
// Feature 3's safety panel, because there is no product behind the line to
// carry safety data.
//
// The invoice prints `sale_items.safetySnapshot`, which createSale() copies off
// the product at the moment of sale. That is why an old invoice reprints the
// advice that was current when it was raised rather than today's.

const COMPANY = {
    name: 'Agrivision International',
    address: 'House # 42, Road # 11, Block-C, Banani, Dhaka-1213, Bangladesh',
    phone: '01700-123456',
    email: 'info@agrivisionbd.com',
    website: 'www.agrivisionbd.com',
};

const money = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * "2 * 24 = 48 ( 100 Gm )" — cartons times pack, as the paper invoices read.
 * Falls back to the bare quantity when the line is not a whole number of
 * cartons, rather than printing a division that does not come out.
 */
function qtyLabel(item) {
    const carton = Number(item.cartonQty || 0);
    const qty = Number(item.qty || 0);
    const pack = item.packSize || item.unitId || '';
    if (carton > 1 && qty % carton === 0) return `${qty / carton} * ${carton} = ${qty} ( ${pack} )`;
    return `${qty} ( ${pack} )`;
}

const cartonCount = (items) => items.reduce((s, it) => {
    const c = Number(it.cartonQty || 0);
    return s + (c > 1 ? Math.round(Number(it.qty || 0) / c) : 0);
}, 0);

function InvoiceModal({ invoiceNo, onClose }) {
    const [sale, setSale] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let alive = true;
        getSaleWithItems(invoiceNo)
            .then(s => alive && setSale(s))
            .catch(err => alive && setError(`Could not load ${invoiceNo} (${err.code || err.message}).`));
        return () => { alive = false; };
    }, [invoiceNo]);

    const items = sale?.items || [];

    /**
     * Print. The window is blank and gets a whole document written into it, so
     * it inherits nothing from the application — not the stylesheet, not the
     * encoding, not a font.
     *
     * Two things here are Feature 3's and are easy to lose:
     *
     *   · `<meta charset="utf-8">`. Without it the new document guesses its
     *     encoding, and Bengali arrives as mojibake even though the modal on
     *     screen behind it is perfect.
     *   · a font stack with Bengali coverage. Arial alone — what this template
     *     asked for — has no Bengali glyphs at all. Every family named is one
     *     that ships with an operating system, so nothing has to download
     *     before `print()` runs a line later.
     *
     * INTERNAL-PLAN.md §5 calls this a ten-minute fix on day one and a panic on
     * demo day. This is the ten minutes.
     */
    const handlePrint = () => {
        const area = document.getElementById('sales-invoice-print-area');
        if (!area) return;
        const w = window.open('', '_blank');
        if (!w) return;                       // pop-up blocked — nothing to do
        w.document.write(`<!DOCTYPE html><html lang="bn"><head><meta charset="utf-8"><title>Invoice - ${invoiceNo}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: ${PRINT_BODY_FONT}; font-size: 12px; color: #000; padding: 20px; }
  .inv-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; border-bottom:2px solid #1a2035; padding-bottom:12px; }
  .company-name { font-size:22px; font-weight:bold; color:#0d6efd; }
  .company-addr { font-size:11px; color:#555; margin-top:4px; }
  .inv-title { font-size:18px; font-weight:bold; }
  .inv-meta { font-size:11px; margin-top:6px; line-height:1.7; }
  .billing { margin:12px 0; padding:10px; border:1px solid #ddd; border-radius:4px; background:#fafafa; }
  table { width:100%; border-collapse:collapse; margin:12px 0; }
  th { background:#1a2035; color:white; padding:8px; text-align:left; font-size:11px; }
  td { padding:7px 8px; border-bottom:1px solid #eee; font-size:11px; }
  .td-right { text-align:right; }
  .total-section { display:flex; flex-direction:column; align-items:flex-end; margin:8px 0; font-size:12px; }
  .grand-total { font-size:14px; font-weight:bold; }
  .sig-area { display:flex; justify-content:space-between; margin-top:40px; }
  .sig-item { text-align:center; }
  .sig-name { font-size:12px; font-weight:bold; color:#0d6efd; margin-bottom:4px; }
  .sig-line { border-top:1px dashed #000; width:140px; padding-top:4px; font-size:11px; }
  .note { text-align:center; font-size:10px; color:#666; margin-top:10px; }
  .offer-section { background:#fff8e1; border:1px solid #ffc107; border-radius:4px; padding:8px; margin:8px 0; font-size:11px; }
  ${SAFETY_PRINT_CSS}
  /* Backgrounds carry the hazard colour, so they are not decoration. */
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>${area.innerHTML}</body></html>`);
        w.document.close();
        w.focus();
        w.print();
        w.close();
    };

    return (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'flex-start', justifyContent:'center', overflowY:'auto', padding:'20px' }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ background:'#fff', borderRadius:8, width:'900px', maxWidth:'98%', position:'relative' }}>
                {/* Top bar */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 20px', borderBottom:'1px solid #e0e0e0', background:'#f8f9fa', borderRadius:'8px 8px 0 0' }}>
                    <span style={{ fontWeight:700, fontSize:15 }}>Invoice — {invoiceNo}</span>
                    <div style={{ display:'flex', gap:8 }}>
                        <button onClick={handlePrint} disabled={!sale} style={{ background: sale ? '#0d6efd' : '#adb5bd', color:'#fff', border:'none', borderRadius:5, padding:'6px 16px', cursor: sale ? 'pointer' : 'not-allowed', fontSize:13, fontWeight:600 }}>🖨️ Print</button>
                        <button onClick={onClose} style={{ background:'#dc3545', color:'#fff', border:'none', borderRadius:5, padding:'6px 12px', cursor:'pointer', fontSize:13 }}>✕ Close</button>
                    </div>
                </div>

                {error && <div style={{ padding:'20px 28px' }}><Notice tone="warn">{error}</Notice></div>}
                {!sale && !error && <div style={{ padding:'40px 28px', textAlign:'center', color:'#6c757d' }}>Loading the invoice…</div>}

                {/* Invoice body */}
                {sale && (
                <div id="sales-invoice-print-area" style={{ padding:'24px 28px' }}>
                    {/* Header */}
                    <div className="inv-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16, borderBottom:'2px solid #1a2035', paddingBottom:14 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                            <div style={{ width:64, height:64, borderRadius:'50%', background:'#0d6efd', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700 }}>AI</div>
                            <div>
                                <div style={{ fontSize:22, fontWeight:700, color:'#0d6efd' }}>{COMPANY.name}</div>
                                <div style={{ fontSize:11, color:'#555', marginTop:3 }}>📍 {COMPANY.address}</div>
                                <div style={{ fontSize:11, color:'#555' }}>📞 {COMPANY.phone} &nbsp;|&nbsp; ✉️ {COMPANY.email} &nbsp;|&nbsp; 🌐 {COMPANY.website}</div>
                            </div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                            <div style={{ fontSize:18, fontWeight:700, color:'#1a2035' }}>INVOICE</div>
                            <div style={{ fontSize:11, marginTop:6, lineHeight:1.8, color:'#444' }}>
                                <div><strong>Inv. No.:</strong> {sale.invoiceNo}</div>
                                <div><strong>Inv. Date:</strong> {formatDate(sale.saleDate)}</div>
                                <div><strong>Due Date:</strong> {formatDate(sale.dueDate) || '—'}</div>
                                <div><strong>Status:</strong> <span style={{ color: sale.status === 'Cancelled' ? '#dc3545' : '#28a745', fontWeight:700 }}>{sale.status}</span></div>
                                <div><strong>Payment Method:</strong> {sale.paymentType}</div>
                                <div><strong>Officer:</strong> {sale.officerName || '—'} [{sale.officerId}]</div>
                                <div><strong>Territory:</strong> {sale.territoryId || '—'}</div>
                                <div><strong>Area:</strong> {sale.areaId || '—'}</div>
                                <div><strong>Office:</strong> {officeLabel(sale.officeId)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Billing Address */}
                    <div style={{ marginBottom:14, padding:'10px 14px', border:'1px solid #ddd', borderRadius:5, background:'#fafafa' }}>
                        <div style={{ fontWeight:700, marginBottom:4, fontSize:13 }}>Billing Address</div>
                        <div style={{ fontWeight:600, fontSize:13 }}>{sale.customerName} [{sale.customerId}]</div>
                        <div style={{ fontSize:12, color:'#555' }}>{sale.customerAddress}</div>
                        <div style={{ fontSize:12, color:'#555' }}>{sale.customerPhone}</div>
                    </div>

                    {/* Items Table */}
                    <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:10 }}>
                        <thead>
                            <tr style={{ background:'#1a2035', color:'#fff' }}>
                                {['S/N','Name','Qty','Unit price','Price'].map(h => (
                                    <th key={h} style={{ padding:'9px 10px', textAlign: h==='Unit price'||h==='Price' ? 'right' : 'left', fontSize:12 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={item.id || item.lineNo} style={{ borderBottom:'1px solid #eee' }}>
                                    <td style={{ padding:'8px 10px', fontSize:12 }}>{item.lineNo}</td>
                                    <td style={{ padding:'8px 10px', fontSize:12 }}>
                                        {item.productName}
                                        <span style={{ color:'#6c757d' }}> [{item.productCode}]</span>
                                    </td>
                                    <td style={{ padding:'8px 10px', fontSize:12 }}>{qtyLabel(item)}</td>
                                    <td style={{ padding:'8px 10px', fontSize:12, textAlign:'right' }}>{money(item.unitPrice)}</td>
                                    <td style={{ padding:'8px 10px', fontSize:12, textAlign:'right' }}>{money(item.lineTotal)}</td>
                                </tr>
                            ))}
                            <tr style={{ background:'#f5f5f5', fontWeight:700 }}>
                                <td colSpan={4} style={{ padding:'8px 10px', fontSize:12, textAlign:'right' }}>
                                    Total &nbsp; {cartonCount(items)} Carton
                                </td>
                                <td style={{ padding:'8px 10px', fontSize:12, textAlign:'right' }}>{money(sale.subTotal)}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Feature 3 — the Bengali safety panel, one per agrochemical
                        line, colour-coded by WHO hazard class. Sits directly under
                        the lines it describes and above the money, because it is
                        the part the dealer is meant to read. */}
                    <InvoiceSafetySection items={items} />

                    {/* Feature 1 — a sale that proceeded on an Area Manager's
                        authority says so on the document itself, not only in the
                        audit log. UNIQUE-FEATURES.md §5 requires this. */}
                    {(sale.ruleChecks || []).filter(r => r.overridden).length > 0 && (
                        <div className="offer-section" style={{ background:'#fff8e1', border:'1px solid #ffc107', borderRadius:4, padding:'8px 12px', marginBottom:12, fontSize:12 }}>
                            <strong>Sold under override</strong>
                            {sale.ruleChecks.filter(r => r.overridden).map((r, i) => (
                                <div key={r.code + i} style={{ marginTop:3 }}>
                                    {i + 1}. {r.message} — <em>authorised by {r.overrideBy || 'a manager'}: “{r.overrideReason}”</em>
                                </div>
                            ))}
                        </div>
                    )}

                    {sale.status === 'Cancelled' && (
                        <div style={{ background:'#f8d7da', border:'1px solid #dc3545', color:'#721c24', borderRadius:4, padding:'8px 12px', marginBottom:12, fontSize:12 }}>
                            <strong>CANCELLED</strong> {formatDate(sale.cancelledAt)} — {sale.cancelReason}
                        </div>
                    )}

                    {/* Totals */}
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, marginBottom:10 }}>
                        <div style={{ fontSize:13 }}>Sub Total &nbsp;&nbsp; <strong>{money(sale.subTotal)}</strong></div>
                        {Number(sale.discount) > 0 && <div style={{ fontSize:13 }}>Discount (−) &nbsp;&nbsp; <strong>{money(sale.discount)}</strong></div>}
                        <div style={{ fontSize:13 }}>Flat Shipping Rate (+) &nbsp;&nbsp; <strong>{money(sale.shipping)}</strong></div>
                        {Number(sale.vat) > 0 && <div style={{ fontSize:13 }}>VAT (+) &nbsp;&nbsp; <strong>{money(sale.vat)}</strong></div>}
                        <div style={{ fontSize:15, fontWeight:700 }}>Grand Total &nbsp;&nbsp; {money(sale.grandTotal)}</div>
                        <div style={{ fontSize:13 }}>Paid &nbsp;&nbsp; <strong>{money(sale.paidAmount)}</strong></div>
                    </div>

                    {/* Due Balance — sale.dueAmount, not the grandTotal * 3.5 this
                        template used to print (SCREEN-AUDIT.md §2.4). */}
                    <div style={{ fontSize:13, marginBottom:30 }}><strong>Due Balance :</strong> {money(sale.dueAmount)}</div>

                    {/* Signatures — 4 columns */}
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:40, flexWrap:'wrap', gap:16 }}>
                        {[
                            { name: sale.officerName || '', role:'Created by' },
                            { name:'', role:'Authorised signature' },
                            { name:'', role:'Delivered by' },
                            { name:'', role:'Customer signature' },
                        ].map((sig) => (
                            <div key={sig.role} style={{ textAlign:'center' }}>
                                {sig.name && <div style={{ fontSize:12, fontWeight:700, color:'#0d6efd', marginBottom:4 }}>{sig.name}</div>}
                                <div style={{ borderTop:'1px dashed #000', width:140, paddingTop:4, fontSize:11 }}>{sig.role}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ textAlign:'center', fontSize:11, color:'#888', marginTop:14 }}>
                        Invoice was created on a computer and is valid without the signature and seal.
                    </div>
                </div>
                )}
            </div>
        </div>
    );
}

// ── The register ──────────────────────────────────────────────────────────

// The eight workflow statuses, plus Cancelled — which the register did not have
// a tab for even though `cancelSale()` writes it, so a cancelled invoice used
// to vanish from this screen with nowhere to reappear (decision D3: it is the
// same collection, not a second one).
const salesStatuses = SALE_STATUS;

const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

const inputStyle = {
    padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px',
};

const PAGE_SIZE = 10;

function Badge({ text, color }) {
    return (
        <span style={{ background: color, color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', display: 'inline-block' }}>
            {text}
        </span>
    );
}

function ActionBtn({ bg, children, title, onClick, disabled }) {
    return (
        <button title={title} onClick={onClick} disabled={disabled}
            style={{ background: disabled ? '#ced4da' : bg, color: 'white', border: 'none', borderRadius: '4px', width: '26px', height: '26px', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '12px', margin: '1px' }}>
            {children}
        </button>
    );
}

function Sales({ type = 'Sales' }) {
    const navigate = useNavigate();
    const { flash, say, busy, run } = useFlash();

    // The Dashboard's Latest Orders panel sends an invoice here rather than
    // dropping you on the register and leaving you to find it. Its View button
    // had no onClick at all before (SCREEN-AUDIT.md §4), and a button that
    // navigates to a list is barely better than one that does nothing — so the
    // invoice number arrives as router state and opens its own invoice, on the
    // tab it actually lives on.
    const { state: nav } = useLocation();

    const [activeStatus, setActiveStatus] = useState(nav?.focusStatus || 'Confirm');
    const [page, setPage] = useState(1);

    // filter bar
    const [search, setSearch] = useState('');
    const [date, setDate] = useState('');
    const [discount, setDiscount] = useState('');
    const [office, setOffice] = useState('');

    // invoice view modal — the invoice NUMBER, not a row: the modal loads the
    // sale and its lines itself, so what it prints is the document, not
    // whatever a list row happened to be carrying.
    const [viewInvoice, setViewInvoice] = useState(nav?.focusInvoice || null);

    // pending status change per row: { [invoiceNo]: selectedStatus }
    const [pendingStatus, setPendingStatus] = useState({});

    /**
     * One read for the whole screen. The tab badges and the table then come
     * from the same rows and cannot contradict each other — SCREEN-AUDIT.md §2.3
     * defect 7 was exactly that: badges reading 47 and 21121 over tables of 12
     * and 22.
     *
     * `actorScope()` puts the signed-in user's restriction on the query: a Sales
     * Officer sees their own invoices, an Area Manager their area's. Security
     * Rules require the where() clause to be present, so an unscoped read here
     * would not merely show too much — it would be refused.
     */
    const load = useCallback(() => listSales({ ...actorScope(), limit: 500 }), []);
    const { rows: allSales, loading, error, reload } = useCollection(load, { what: 'sales' });

    const counts = useMemo(() => allSales.reduce(
        (acc, s) => ({ ...acc, [s.status]: (acc[s.status] || 0) + 1 }), {},
    ), [allSales]);

    const filtered = useMemo(() => {
        const k = search.trim().toLowerCase();
        return allSales.filter(s => {
            if (s.status !== activeStatus) return false;
            if (k && !(`${s.customerName} ${s.customerId} ${s.invoiceNo}`.toLowerCase().includes(k))) return false;
            if (date && formatDate(s.saleDate) !== date) return false;
            if (office && s.officeId !== office) return false;
            if (discount === 'Yes' && !(Number(s.discount) > 0)) return false;
            if (discount === 'No' && Number(s.discount) > 0) return false;
            return true;
        });
    }, [allSales, activeStatus, search, date, office, discount]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const isCancelled = activeStatus === 'Cancelled';
    const showChangeStatus = !isCancelled && activeStatus !== 'Delivered';

    const switchTab = (s) => { setActiveStatus(s); setPage(1); };

    const handleClear = () => {
        setSearch(''); setDate(''); setDiscount(''); setOffice('');
        setPage(1);
    };

    // ── Writes. Each one goes through the service layer, which writes the
    // audit row in the same batch, and then re-reads — the register showing a
    // status the database does not hold is how the old local-state version
    // managed to look like it worked. ────────────────────────────────────────

    const handleCancel = (row) => {
        const reason = window.prompt(`Cancel ${row.invoiceNo}?\n\nThis reverses the stock and the dealer's balance. A written reason is required and is recorded against the invoice.`);
        if (reason === null) return;
        if (!reason.trim()) { say('error', 'A cancellation must carry a reason.'); return; }
        run(async () => {
            await cancelSale(row.invoiceNo, reason.trim());
            say('ok', `${row.invoiceNo} cancelled. Stock and balance reversed.`);
            await reload();
        });
    };

    const moveTo = (row, status) => run(async () => {
        await updateSaleStatus(row.invoiceNo, status);
        setPendingStatus(prev => { const n = { ...prev }; delete n[row.invoiceNo]; return n; });
        say('ok', `${row.invoiceNo} → ${status}.`);
        await reload();
    });

    const advance = (row) => run(async () => {
        const next = nextStatus(row.status);
        await advanceSale(row.invoiceNo);
        say('ok', `${row.invoiceNo} → ${next}.`);
        await reload();
    });

    const icons = { Sales: '🛒', 'Sales Return': '↩️', 'Cancel Sales': '❌', Damage: '⚠️' };

    return (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>

            {/* Header */}
            <div style={{ marginBottom: '16px' }}>
                <h2 style={{ color: '#0d6efd', margin: 0 }}>{icons[type] || '🛒'} {type}</h2>
                <p style={{ color: '#6c757d', fontSize: '13px', margin: '2px 0 0' }}>Detailed sales record</p>
            </div>

            {loading && <Notice tone="info">Loading sales…</Notice>}
            {error && <Notice tone="warn">{error}</Notice>}
            {flash && <Notice tone={flash.tone}>{flash.text}</Notice>}

            {/* Status Tabs */}
            <div style={{ ...cardStyle, padding: 0, marginBottom: '16px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {salesStatuses.map((s, i) => {
                        const active = activeStatus === s;
                        const n = counts[s] || 0;
                        return (
                            <div key={s} onClick={() => switchTab(s)}
                                style={{
                                    flex: '1 1 auto', minWidth: '110px', textAlign: 'center', cursor: 'pointer',
                                    padding: '14px 10px', fontSize: '13px', fontWeight: 'bold', color: 'white',
                                    background: active ? 'linear-gradient(135deg, #f5b544, #f0932b)' : '#243050',
                                    borderRight: i < salesStatuses.length - 1 ? '1px solid #1a2035' : 'none',
                                }}>
                                {s}
                                <span style={{ background: active ? '#dc3545' : '#0dcaf0', color: 'white', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', marginLeft: '6px' }}>
                                    {n}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Filter Bar */}
            <div style={{ ...cardStyle, marginBottom: '16px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                    <input placeholder="🔍 Dealer, code or invoice number" value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ ...inputStyle, flex: '1 1 180px' }} />
                    <input type="date" value={date} onChange={e => { setDate(e.target.value); setPage(1); }} style={{ ...inputStyle, flex: '1 1 140px' }} />
                    <select value={discount} onChange={e => { setDiscount(e.target.value); setPage(1); }} style={{ ...inputStyle, flex: '1 1 140px' }}>
                        <option value="">Any discount</option>
                        <option value="Yes">Discounted</option>
                        <option value="No">No discount</option>
                    </select>
                    <select value={office} onChange={e => { setOffice(e.target.value); setPage(1); }} style={{ ...inputStyle, flex: '1 1 140px' }}>
                        <option value="">All Office</option>
                        {officeOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <button onClick={reload} disabled={loading} style={{ background: '#28a745', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>⟳ Refresh</button>
                    <button onClick={handleClear} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>✕ Clear</button>
                </div>
            </div>

            {/* Table */}
            <div style={{ ...cardStyle, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '900px' }}>
                    <thead>
                        <tr style={{ background: '#1a2035', color: 'white' }}>
                            <th style={{ padding: '12px', textAlign: 'left' }}>No</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Invoice</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Address</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                            <th style={{ padding: '12px', textAlign: 'right' }}>Amount</th>
                            <th style={{ padding: '12px', textAlign: 'right' }}>Due</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Source</th>
                            {showChangeStatus && <th style={{ padding: '12px', textAlign: 'left' }}>Change Status</th>}
                            <th style={{ padding: '12px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                                Action <button onClick={() => navigate('/sales-entry')} title="Create a new sales order"
                                    style={{ background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer', marginLeft: '4px' }}>+ Add</button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageRows.map((row, i) => (
                            <tr key={row.invoiceNo} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                <td style={{ padding: '10px 12px' }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                                <td style={{ padding: '10px 12px' }}>
                                    <div style={{ color: '#0d6efd', fontWeight: 'bold', marginBottom: '4px' }}>{row.invoiceNo}</div>
                                    <Badge text={row.paymentType} color={row.paymentType === 'Cash' ? '#28a745' : '#0d6efd'} />
                                </td>
                                <td style={{ padding: '10px 12px' }}>
                                    <div style={{ fontWeight: 'bold', color: '#1a2035' }}>{row.customerName} [{row.customerId}]</div>
                                    <div style={{ color: '#6c757d', fontSize: '12px' }}>{row.customerPhone}</div>
                                </td>
                                <td style={{ padding: '10px 12px', color: '#495057' }}>
                                    <div>{row.customerAddress}</div>
                                    <div style={{ color: '#adb5bd', fontSize: '12px' }}>{row.territoryId}, {row.areaId}</div>
                                </td>
                                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{formatDate(row.saleDate)}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 'bold' }}>{money(row.grandTotal)}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', color: Number(row.dueAmount) > 0 ? '#dc3545' : '#6c757d' }}>{money(row.dueAmount)}</td>
                                <td style={{ padding: '10px 12px' }}>
                                    <Badge text={row.source} color={row.source === 'Admin' ? '#28a745' : '#0dcaf0'} />
                                </td>
                                {showChangeStatus && (
                                    <td style={{ padding: '10px 12px' }}>
                                        <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                                            <select
                                                value={pendingStatus[row.invoiceNo] || ''}
                                                onChange={e => setPendingStatus(prev => ({ ...prev, [row.invoiceNo]: e.target.value }))}
                                                style={{ ...inputStyle, fontSize: '12px', padding: '6px 8px' }}>
                                                <option value="">Select status</option>
                                                {salesStatuses
                                                    .filter(s => s !== activeStatus && s !== 'Cancelled')
                                                    .map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                            <button
                                                onClick={() => { const sel = pendingStatus[row.invoiceNo]; if (sel) moveTo(row, sel); }}
                                                disabled={busy || !pendingStatus[row.invoiceNo]}
                                                title="Confirm status change"
                                                style={{ background: busy || !pendingStatus[row.invoiceNo] ? '#ced4da' : '#28a745', color:'#fff', border:'none', borderRadius:4, padding:'5px 8px', cursor:'pointer', fontWeight:700, fontSize:13 }}>
                                                ✓
                                            </button>
                                        </div>
                                    </td>
                                )}
                                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                                    <ActionBtn bg="#0d6efd" title="View and print the invoice" onClick={() => setViewInvoice(row.invoiceNo)}>ℹ</ActionBtn>
                                    {!isCancelled && nextStatus(row.status) && (
                                        <ActionBtn bg="#28a745" title={`Move to ${nextStatus(row.status)}`} disabled={busy} onClick={() => advance(row)}>✓</ActionBtn>
                                    )}
                                    {!isCancelled && (
                                        <ActionBtn bg="#dc3545" title="Cancel this invoice" disabled={busy} onClick={() => handleCancel(row)}>🗑</ActionBtn>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {!loading && pageRows.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#adb5bd', padding: '30px' }}>
                        No invoices with status “{activeStatus}”.
                    </p>
                )}

                {/* Pagination */}
                {filtered.length > PAGE_SIZE && (
                    <div style={{ display: 'flex', gap: '4px', marginTop: '16px' }}>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button key={p} onClick={() => setPage(p)} style={{
                                padding: '6px 12px', fontSize: '13px', cursor: 'pointer',
                                border: '1px solid #dee2e6', borderRadius: '4px',
                                background: p === page ? '#0d6efd' : 'white',
                                color: p === page ? 'white' : '#495057',
                            }}>{p}</button>
                        ))}
                    </div>
                )}
            </div>

            {/* Invoice View Modal */}
            {viewInvoice && <InvoiceModal invoiceNo={viewInvoice} onClose={() => setViewInvoice(null)} />}
        </div>
    );
}

export default Sales;
