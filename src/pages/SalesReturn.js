import React, { useState } from 'react';

const COMPANY = {
    name: 'Agrivision International',
    address: 'House # 42, Road # 11, Block-C, Banani, Dhaka-1213, Bangladesh',
    phone: '01700-123456',
    email: 'info@agrivisionbd.com',
    website: 'www.agrivisionbd.com',
};

const MOCK_DATA = [
    {
        id: 1, invoiceType: 'Invoice', invoice: 'AINV-2026-07-0010241', returnNo: 'AISR-001315',
        name: "M/s- Rahman Traders [AIC-000157]", phone: '01740354588',
        returnReason: 'Un Sold', date: '19-07-2026', warehouseDate: '19-07-2026',
        amount: 67329.00, officer: 'Md. Mahedi Hasan Antor', officerCode: '[AIO-000083]',
        status: 'Approved', billingAddress: 'Md. Golam Rabbi\nGulshan, Dhaka', area: 'Dhaka', territory: 'Gulshan',
        items: [
            { sn: 1, name: 'Smartzeb 80 Wp 100 Gm (blue)', qty: '2 * 24 = 48 ( 100 Gm )', unitPrice: 102.00, price: 4896.00 },
            { sn: 2, name: 'Cupertino 72wp Blue 100 Gm', qty: '2 * 24 = 48 ( 100 Gm )', unitPrice: 132.00, price: 6336.00 },
            { sn: 3, name: 'Blue Sundari 72wp 100gm', qty: '1 * 24 = 24 and 19 PCS = 43 ( 100 Gm )', unitPrice: 132.00, price: 5676.00 },
        ],
        totalLabel: '5 Carton, 19 Pcs', dueBalance: 115637.00,
        dueInWords: 'One Lakh Fifteen Thousands Six Hundred and Thirty Seven Tk',
    },
    {
        id: 2, invoiceType: 'Invoice', invoice: 'AINV-2026-07-0034209', returnNo: 'AISR-001314',
        name: "M/s- S S Traders [AIC-000633]", phone: '01716783704',
        returnReason: 'Un Sold', date: '19-07-2026', warehouseDate: '19-07-2026',
        amount: 1845.00, officer: 'Bimol Kumar', officerCode: '[AIO-000195]',
        status: 'Approved', billingAddress: 'Md. Sumon Ahmed\nMotijheel, Dhaka', area: 'Dhaka', territory: 'Motijheel',
        items: [
            { sn: 1, name: 'Agrivit Plus 500ml', qty: '1 * 12 = 12 ( 500 Ml )', unitPrice: 153.75, price: 1845.00 },
        ],
        totalLabel: '1 Carton', dueBalance: 42500.00,
        dueInWords: 'Forty Two Thousand Five Hundred Tk',
    },
    {
        id: 3, invoiceType: 'Invoice', invoice: 'AINV-2026-07-0034061', returnNo: 'AISR-001313',
        name: "M/s- Twoha Traders [AIC-000768]", phone: '01792257461',
        returnReason: 'Un Sold', date: '19-07-2026', warehouseDate: '19-07-2026',
        amount: 5040.00, officer: 'Md. moynul Hasan Shadik', officerCode: '[AIO-000025]',
        status: 'Approved', billingAddress: 'Md. Tawfiq\nDhanmondi, Dhaka', area: 'Dhaka', territory: 'Dhanmondi',
        items: [
            { sn: 1, name: 'GreenMax Fertilizer 1kg', qty: '2 * 12 = 24 ( 1 Kg )', unitPrice: 210.00, price: 5040.00 },
        ],
        totalLabel: '2 Carton', dueBalance: 89200.00,
        dueInWords: 'Eighty Nine Thousand Two Hundred Tk',
    },
    {
        id: 4, invoiceType: 'Invoice', invoice: 'AINV-2025-12-0023509', returnNo: 'AISR-001312',
        name: "M/s- Helal Traders [AIC-001867]", phone: '01810143278',
        returnReason: 'Un Sold', date: '19-07-2026', warehouseDate: '19-07-2026',
        amount: 16908.00, officer: 'Rozob Ali', officerCode: '[AIO-000106]',
        status: 'Approved', billingAddress: 'Md. Helal Uddin\nMirpur, Dhaka', area: 'Dhaka', territory: 'Mirpur',
        items: [
            { sn: 1, name: 'Smartzeb 80 Wp 100 Gm (blue)', qty: '2 * 24 = 48 ( 100 Gm )', unitPrice: 102.00, price: 4896.00 },
            { sn: 2, name: 'Cupertino 72wp Blue 100 Gm', qty: '4 * 24 = 96 ( 100 Gm )', unitPrice: 125.10, price: 12012.00 },
        ],
        totalLabel: '6 Carton', dueBalance: 230000.00,
        dueInWords: 'Two Lakh Thirty Thousand Tk',
    },
    {
        id: 5, invoiceType: 'Invoice', invoice: 'AINV-2025-12-0023366', returnNo: 'AISR-001311',
        name: "M/s- Helal Traders [AIC-001867]", phone: '01810143278',
        returnReason: 'Un Sold', date: '19-07-2026', warehouseDate: '19-07-2026',
        amount: 7740.00, officer: 'Rozob Ali', officerCode: '[AIO-000106]',
        status: 'Approved', billingAddress: 'Md. Helal Uddin\nMirpur, Dhaka', area: 'Dhaka', territory: 'Mirpur',
        items: [
            { sn: 1, name: 'Blue Sundari 72wp 100gm', qty: '2 * 24 = 48 ( 100 Gm )', unitPrice: 161.25, price: 7740.00 },
        ],
        totalLabel: '2 Carton', dueBalance: 222260.00,
        dueInWords: 'Two Lakh Twenty Two Thousand Two Hundred and Sixty Tk',
    },
    {
        id: 6, invoiceType: 'Invoice', invoice: 'AINV-2025-12-0023362', returnNo: 'AISR-001310',
        name: "M/s- Helal Traders [AIC-001867]", phone: '01810143278',
        returnReason: 'Un Sold', date: '19-07-2026', warehouseDate: '19-07-2026',
        amount: 36219.00, officer: 'Rozob Ali', officerCode: '[AIO-000106]',
        status: 'Approved', billingAddress: 'Md. Helal Uddin\nMirpur, Dhaka', area: 'Dhaka', territory: 'Mirpur',
        items: [
            { sn: 1, name: 'Smartzeb 80 Wp 100 Gm (blue)', qty: '5 * 24 = 120 ( 100 Gm )', unitPrice: 102.00, price: 12240.00 },
            { sn: 2, name: 'GreenMax Fertilizer 1kg', qty: '3 * 12 = 36 ( 1 Kg )', unitPrice: 210.00, price: 7560.00 },
            { sn: 3, name: 'Cupertino 72wp Blue 100 Gm', qty: '4 * 24 = 96 ( 100 Gm )', unitPrice: 171.03, price: 16419.00 },
        ],
        totalLabel: '12 Carton', dueBalance: 186041.00,
        dueInWords: 'One Lakh Eighty Six Thousand and Forty One Tk',
    },
];

function InvoiceModal({ row, onClose }) {
    const handlePrint = () => {
        const printContents = document.getElementById('invoice-print-area').innerHTML;
        const w = window.open('', '_blank');
        w.document.write(`<!DOCTYPE html><html><head><title>Return Invoice - ${row.returnNo}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #000; padding: 20px; }
  .inv-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 2px solid #000; padding-bottom: 12px; }
  .company-logo { display: flex; align-items: center; gap: 12px; }
  .logo-circle { width: 60px; height: 60px; border-radius: 50%; background: #0d6efd; color: white; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; }
  .company-name { font-size: 22px; font-weight: bold; color: #0d6efd; }
  .company-addr { font-size: 11px; color: #555; margin-top: 4px; }
  .inv-title { font-size: 18px; font-weight: bold; text-align: right; }
  .inv-meta { font-size: 11px; text-align: right; margin-top: 6px; line-height: 1.6; }
  .billing { margin: 12px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
  .billing-title { font-weight: bold; margin-bottom: 6px; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th { background: #1a2035; color: white; padding: 8px; text-align: left; font-size: 11px; }
  td { padding: 7px 8px; border-bottom: 1px solid #eee; font-size: 11px; }
  .td-right { text-align: right; }
  .total-row td { font-weight: bold; background: #f5f5f5; }
  .grand-total { text-align: right; font-size: 14px; font-weight: bold; margin: 8px 0; }
  .due-balance { font-size: 12px; margin: 6px 0; }
  .sig-area { display: flex; justify-content: space-between; margin-top: 40px; }
  .sig-line { border-top: 1px dashed #000; width: 160px; padding-top: 4px; text-align: center; font-size: 11px; }
  .note { text-align: center; font-size: 10px; color: #666; margin-top: 10px; }
  .green-badge { background: #28a745; color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; }
</style></head><body>${printContents}</body></html>`);
        w.document.close();
        w.focus();
        w.print();
        w.close();
    };

    const grandTotal = row.items.reduce((s, i) => s + i.price, 0);

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 1000, display: 'flex', alignItems: 'flex-start',
            justifyContent: 'center', overflowY: 'auto', padding: '20px',
        }}
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <div style={{ background: '#fff', borderRadius: 8, width: '860px', maxWidth: '98%', padding: 0, position: 'relative' }}>
                {/* Top bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #e0e0e0', background: '#f8f9fa' }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>Return Invoice — {row.returnNo}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={handlePrint} style={{
                            background: '#0d6efd', color: '#fff', border: 'none',
                            borderRadius: 5, padding: '6px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        }}>🖨️ Print</button>
                        <button onClick={onClose} style={{
                            background: '#dc3545', color: '#fff', border: 'none',
                            borderRadius: 5, padding: '6px 12px', cursor: 'pointer', fontSize: 13,
                        }}>✕ Close</button>
                    </div>
                </div>

                {/* Invoice body */}
                <div id="invoice-print-area" style={{ padding: '24px 28px' }}>
                    {/* Header */}
                    <div className="inv-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, borderBottom: '2px solid #1a2035', paddingBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#0d6efd', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700 }}>AI</div>
                            <div>
                                <div style={{ fontSize: 22, fontWeight: 700, color: '#0d6efd' }}>{COMPANY.name}</div>
                                <div style={{ fontSize: 11, color: '#555', marginTop: 3 }}>📍 {COMPANY.address}</div>
                                <div style={{ fontSize: 11, color: '#555' }}>📞 {COMPANY.phone} &nbsp;|&nbsp; ✉️ {COMPANY.email} &nbsp;|&nbsp; 🌐 {COMPANY.website}</div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 18, fontWeight: 700, color: '#1a2035' }}>RETURN INVOICE</div>
                            <div style={{ fontSize: 11, marginTop: 6, lineHeight: 1.7, color: '#444' }}>
                                <div><strong>Return Type:</strong> {row.invoiceType}</div>
                                <div><strong>Inv. No:</strong> {row.invoice}</div>
                                <div><strong>Inv. Date:</strong> {row.date}</div>
                                <div><strong>Return No:</strong> {row.returnNo}</div>
                                <div><strong>Return Date:</strong> {row.date}</div>
                                <div><strong>Area:</strong> {row.area}</div>
                                <div><strong>Territory:</strong> {row.territory}</div>
                            </div>
                        </div>
                    </div>

                    {/* Billing Address */}
                    <div style={{ marginBottom: 14, padding: '10px 14px', border: '1px solid #ddd', borderRadius: 5, background: '#fafafa' }}>
                        <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 13 }}>Billing Address</div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{row.name}</div>
                        <div style={{ fontSize: 12, color: '#555', whiteSpace: 'pre-line' }}>{row.billingAddress}</div>
                        <div style={{ fontSize: 12, color: '#555' }}>{row.phone}</div>
                    </div>

                    {/* Items Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10 }}>
                        <thead>
                            <tr style={{ background: '#1a2035', color: '#fff' }}>
                                <th style={{ padding: '9px 10px', textAlign: 'left', fontSize: 12 }}>S/N</th>
                                <th style={{ padding: '9px 10px', textAlign: 'left', fontSize: 12 }}>Name</th>
                                <th style={{ padding: '9px 10px', textAlign: 'left', fontSize: 12 }}>Qty</th>
                                <th style={{ padding: '9px 10px', textAlign: 'right', fontSize: 12 }}>Unit price</th>
                                <th style={{ padding: '9px 10px', textAlign: 'right', fontSize: 12 }}>Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {row.items.map((item) => (
                                <tr key={item.sn} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '8px 10px', fontSize: 12 }}>{item.sn}</td>
                                    <td style={{ padding: '8px 10px', fontSize: 12 }}>{item.name}</td>
                                    <td style={{ padding: '8px 10px', fontSize: 12 }}>{item.qty}</td>
                                    <td style={{ padding: '8px 10px', fontSize: 12, textAlign: 'right' }}>{item.unitPrice.toFixed(2)}</td>
                                    <td style={{ padding: '8px 10px', fontSize: 12, textAlign: 'right' }}>{item.price.toFixed(2)}</td>
                                </tr>
                            ))}
                            <tr style={{ background: '#f5f5f5', fontWeight: 700 }}>
                                <td colSpan={4} style={{ padding: '8px 10px', fontSize: 12, textAlign: 'right' }}>
                                    Total: {row.totalLabel}
                                </td>
                                <td style={{ padding: '8px 10px', fontSize: 12, textAlign: 'right' }}></td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Grand Total */}
                    <div style={{ textAlign: 'right', fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                        Grand Total &nbsp;&nbsp; {grandTotal.toFixed(2)}
                    </div>

                    {/* Due Balance */}
                    <div style={{ fontSize: 13, marginBottom: 4 }}>
                        <strong>Due Balance :</strong> {row.dueBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: 12, color: '#555', marginBottom: 30 }}>{row.dueInWords}</div>

                    {/* Signatures */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40 }}>
                        <div style={{ borderTop: '1px dashed #000', width: 160, paddingTop: 4, textAlign: 'center', fontSize: 12 }}>Customer signature</div>
                        <div style={{ borderTop: '1px dashed #000', width: 160, paddingTop: 4, textAlign: 'center', fontSize: 12 }}>Authorised signature</div>
                    </div>

                    <div style={{ textAlign: 'center', fontSize: 11, color: '#888', marginTop: 14 }}>
                        Invoice was created on a computer and is valid without the signature and seal.
                    </div>
                </div>
            </div>
        </div>
    );
}

function SalesReturn() {
    const [data, setData] = useState(MOCK_DATA);
    const [filterDate, setFilterDate] = useState('');
    const [filterOfficer, setFilterOfficer] = useState('');
    const [filterOffice, setFilterOffice] = useState('');
    const [viewRow, setViewRow] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newReturn, setNewReturn] = useState({ name: '', invoice: '', returnReason: '', amount: '', officer: '' });

    const officers = [...new Set(MOCK_DATA.map(d => d.officer))];

    const filtered = data.filter(row => {
        if (filterDate && !row.date.includes(filterDate)) return false;
        if (filterOfficer && row.officer !== filterOfficer) return false;
        return true;
    });

    const handleAdd = () => {
        if (!newReturn.name || !newReturn.invoice) return alert('Name and Invoice are required');
        const next = {
            id: Date.now(),
            invoiceType: 'Invoice',
            invoice: newReturn.invoice,
            returnNo: `AISR-00${data.length + 1316}`,
            name: newReturn.name,
            phone: '01700-000000',
            returnReason: newReturn.returnReason || 'Un Sold',
            date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
            warehouseDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
            amount: parseFloat(newReturn.amount) || 0,
            officer: newReturn.officer || 'Unassigned',
            officerCode: '',
            status: 'Pending',
            billingAddress: 'Dhaka, Bangladesh',
            area: 'Dhaka', territory: 'Dhaka',
            items: [{ sn: 1, name: newReturn.invoice, qty: '1', unitPrice: parseFloat(newReturn.amount) || 0, price: parseFloat(newReturn.amount) || 0 }],
            totalLabel: '1 item', dueBalance: 0, dueInWords: 'Zero Taka Only',
        };
        setData(prev => [next, ...prev]);
        setShowAddModal(false);
        setNewReturn({ name: '', invoice: '', returnReason: '', amount: '', officer: '' });
    };

    return (
        <div>
            {/* Page Title */}
            <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a2035', margin: 0 }}>
                    🛒 Sales Return
                </h2>
                <p style={{ color: '#6c757d', fontSize: 13, margin: '4px 0 0' }}>Detailed admin record</p>
            </div>

            {/* Filter Bar */}
            <div style={{ background: '#fff', borderRadius: 8, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                <input
                    type="date"
                    value={filterDate}
                    onChange={e => setFilterDate(e.target.value)}
                    style={{ padding: '7px 12px', border: '1px solid #ddd', borderRadius: 5, fontSize: 13, minWidth: 140 }}
                />
                <select value={filterOfficer} onChange={e => setFilterOfficer(e.target.value)}
                    style={{ padding: '7px 12px', border: '1px solid #ddd', borderRadius: 5, fontSize: 13, minWidth: 160 }}>
                    <option value="">🔍 Select Officer</option>
                    {officers.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <select value={filterOffice} onChange={e => setFilterOffice(e.target.value)}
                    style={{ padding: '7px 12px', border: '1px solid #ddd', borderRadius: 5, fontSize: 13, minWidth: 160 }}>
                    <option value="">🔍 Select Office</option>
                    <option value="head">Head Office</option>
                    <option value="dhaka">Dhaka Branch</option>
                    <option value="ctg">Chittagong Branch</option>
                </select>
                <button
                    onClick={() => { }}
                    style={{ background: '#28a745', color: '#fff', border: 'none', borderRadius: 5, padding: '7px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                    ✔ Go
                </button>
                <button
                    onClick={() => { setFilterDate(''); setFilterOfficer(''); setFilterOffice(''); }}
                    style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: 5, padding: '7px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                    ✕ Clear
                </button>
            </div>

            {/* Table Card */}
            <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                {/* Table Header Row */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 16px', borderBottom: '1px solid #eee' }}>
                    <button onClick={() => setShowAddModal(true)}
                        style={{ background: '#28a745', color: '#fff', border: 'none', borderRadius: 5, padding: '7px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                        🛒 Add
                    </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: '#1a2035', color: '#fff' }}>
                                {['No', 'Invoice Type', 'Invoice', 'Name', 'Return Reason', 'Date', 'Warehouse in date', 'Amount', 'Officer', 'Status', 'Action'].map(h => (
                                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap', fontSize: 12 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={11} style={{ textAlign: 'center', padding: 32, color: '#aaa' }}>No data found</td></tr>
                            ) : filtered.map((row, i) => (
                                <tr key={row.id} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                    <td style={{ padding: '9px 12px' }}>{i + 1}</td>
                                    <td style={{ padding: '9px 12px' }}>{row.invoiceType}</td>
                                    <td style={{ padding: '9px 12px' }}>
                                        <div style={{ fontWeight: 600, fontSize: 12 }}>{row.invoice}</div>
                                        <div style={{ fontSize: 11, color: '#888' }}>{row.returnNo}</div>
                                    </td>
                                    <td style={{ padding: '9px 12px' }}>
                                        <div style={{ fontSize: 12 }}>{row.name}</div>
                                        <div style={{ fontSize: 11, color: '#888' }}>{row.phone}</div>
                                    </td>
                                    <td style={{ padding: '9px 12px' }}>{row.returnReason}</td>
                                    <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>{row.date}</td>
                                    <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>{row.warehouseDate}</td>
                                    <td style={{ padding: '9px 12px', fontWeight: 600 }}>{row.amount.toLocaleString()}</td>
                                    <td style={{ padding: '9px 12px' }}>
                                        <div style={{ fontSize: 12 }}>{row.officer}</div>
                                        <div style={{ fontSize: 11, color: '#888' }}>{row.officerCode}</div>
                                    </td>
                                    <td style={{ padding: '9px 12px' }}>
                                        <span style={{
                                            background: row.status === 'Approved' ? '#28a745' : '#ffc107',
                                            color: '#fff', borderRadius: 4, padding: '3px 10px', fontSize: 11, fontWeight: 600,
                                        }}>{row.status}</span>
                                    </td>
                                    <td style={{ padding: '9px 12px' }}>
                                        <button
                                            onClick={() => setViewRow(row)}
                                            title="View Invoice"
                                            style={{ background: '#0d6efd', color: '#fff', border: 'none', borderRadius: 4, padding: '5px 10px', cursor: 'pointer', fontSize: 13 }}>
                                            ℹ️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ padding: '10px 16px', color: '#888', fontSize: 12, borderTop: '1px solid #eee' }}>
                    Showing {filtered.length} of {data.length} records
                </div>
            </div>

            {/* Invoice Modal */}
            {viewRow && <InvoiceModal row={viewRow} onClose={() => setViewRow(null)} />}

            {/* Add Return Modal */}
            {showAddModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => e.target === e.currentTarget && setShowAddModal(false)}>
                    <div style={{ background: '#fff', borderRadius: 8, padding: 28, width: 460, maxWidth: '95%' }}>
                        <h3 style={{ marginBottom: 18, fontSize: 16, color: '#1a2035' }}>Add Sales Return</h3>
                        {[
                            ['Customer Name', 'name', 'text'],
                            ['Invoice No', 'invoice', 'text'],
                            ['Return Reason', 'returnReason', 'text'],
                            ['Amount', 'amount', 'number'],
                            ['Officer', 'officer', 'text'],
                        ].map(([label, field, type]) => (
                            <div key={field} style={{ marginBottom: 12 }}>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{label}</label>
                                <input type={type} value={newReturn[field]}
                                    onChange={e => setNewReturn(p => ({ ...p, [field]: e.target.value }))}
                                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 5, fontSize: 13, boxSizing: 'border-box' }} />
                            </div>
                        ))}
                        <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowAddModal(false)}
                                style={{ padding: '8px 20px', border: '1px solid #ddd', borderRadius: 5, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                            <button onClick={handleAdd}
                                style={{ padding: '8px 20px', background: '#28a745', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                                Save Return
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SalesReturn;
