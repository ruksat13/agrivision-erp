import React, { useState } from 'react';

const COMPANY = {
    name: 'Agrivision International',
    address: 'House # 42, Road # 11, Block-C, Banani, Dhaka-1213, Bangladesh',
    phone: '01700-123456',
    email: 'info@agrivisionbd.com',
    website: 'www.agrivisionbd.com',
};

// Generate mock product items for invoice modal
const mockItems = (row) => [
    { sn: 1, name: 'Smartzeb 80 Wp 100 Gm (blue)', qty: '1 * 1 = 1 ( Pcs )', unitPrice: row.amount > 0 ? parseFloat((row.amount * 0.6).toFixed(2)) : 0.00, price: row.amount > 0 ? parseFloat((row.amount * 0.6).toFixed(2)) : 0.00 },
    { sn: 2, name: 'Cupertino 72wp Blue 100 Gm', qty: '1 * 1 = 1 ( Pcs )', unitPrice: row.amount > 0 ? parseFloat((row.amount * 0.4).toFixed(2)) : 0.00, price: row.amount > 0 ? parseFloat((row.amount * 0.4).toFixed(2)) : 0.00 },
];

function InvoiceModal({ row, onClose }) {
    const items = mockItems(row);
    const subTotal = items.reduce((s, i) => s + i.price, 0);
    const shippingRate = 0;
    const grandTotal = subTotal + shippingRate;

    const handlePrint = () => {
        const printContents = document.getElementById('sales-invoice-print-area').innerHTML;
        const w = window.open('', '_blank');
        w.document.write(`<!DOCTYPE html><html><head><title>Invoice - ${row.invoice}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #000; padding: 20px; }
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
</style></head><body>${printContents}</body></html>`);
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
                    <span style={{ fontWeight:700, fontSize:15 }}>Invoice — {row.invoice}</span>
                    <div style={{ display:'flex', gap:8 }}>
                        <button onClick={handlePrint} style={{ background:'#0d6efd', color:'#fff', border:'none', borderRadius:5, padding:'6px 16px', cursor:'pointer', fontSize:13, fontWeight:600 }}>🖨️ Print</button>
                        <button onClick={onClose} style={{ background:'#dc3545', color:'#fff', border:'none', borderRadius:5, padding:'6px 12px', cursor:'pointer', fontSize:13 }}>✕ Close</button>
                    </div>
                </div>

                {/* Invoice body */}
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
                                <div><strong>Inv. No.:</strong> {row.invoice}</div>
                                <div><strong>Inv. Date:</strong> {row.date}</div>
                                <div><strong>Due Date:</strong> {row.date}</div>
                                <div><strong>Status:</strong> <span style={{ color:'#28a745', fontWeight:700 }}>Confirmed</span></div>
                                <div><strong>Payment Method:</strong> {row.pay}</div>
                                <div><strong>Officer:</strong> Md. Sales Officer [AIO-000001]</div>
                                <div><strong>Territory:</strong> Dhaka Sadar</div>
                                <div><strong>Area:</strong> Dhaka</div>
                            </div>
                        </div>
                    </div>

                    {/* Billing Address */}
                    <div style={{ marginBottom:14, padding:'10px 14px', border:'1px solid #ddd', borderRadius:5, background:'#fafafa' }}>
                        <div style={{ fontWeight:700, marginBottom:4, fontSize:13 }}>Billing Address</div>
                        <div style={{ fontWeight:600, fontSize:13 }}>{row.name}</div>
                        <div style={{ fontSize:12, color:'#555' }}>{row.address}</div>
                        <div style={{ fontSize:12, color:'#555' }}>{row.phone}</div>
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
                                <tr key={item.sn} style={{ borderBottom:'1px solid #eee' }}>
                                    <td style={{ padding:'8px 10px', fontSize:12 }}>{item.sn}</td>
                                    <td style={{ padding:'8px 10px', fontSize:12 }}>{item.name}</td>
                                    <td style={{ padding:'8px 10px', fontSize:12 }}>{item.qty}</td>
                                    <td style={{ padding:'8px 10px', fontSize:12, textAlign:'right' }}>{item.unitPrice.toFixed(2)}</td>
                                    <td style={{ padding:'8px 10px', fontSize:12, textAlign:'right' }}>{item.price.toFixed(2)}</td>
                                </tr>
                            ))}
                            <tr style={{ background:'#f5f5f5', fontWeight:700 }}>
                                <td colSpan={4} style={{ padding:'8px 10px', fontSize:12, textAlign:'right' }}>Total &nbsp; 1 Carton</td>
                                <td style={{ padding:'8px 10px', fontSize:12 }}></td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Offer section */}
                    <div style={{ background:'#fff8e1', border:'1px solid #ffc107', borderRadius:4, padding:'8px 12px', marginBottom:12, fontSize:12 }}>
                        <strong>Offer</strong><br />
                        1. Agrivision Loyalty Bonus — Prev. Inv.: {row.invoice}
                    </div>

                    {/* Totals */}
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, marginBottom:10 }}>
                        <div style={{ fontSize:13 }}>Sub Total &nbsp;&nbsp; <strong>{subTotal.toFixed(2)}</strong></div>
                        <div style={{ fontSize:13 }}>Flat Shipping Rate (+) &nbsp;&nbsp; <strong>{shippingRate.toFixed(2)}</strong></div>
                        <div style={{ fontSize:15, fontWeight:700 }}>Grand Total &nbsp;&nbsp; {grandTotal.toFixed(2)}</div>
                    </div>

                    {/* Due Balance */}
                    <div style={{ fontSize:13, marginBottom:4 }}><strong>Due Balance :</strong> {(grandTotal * 3.5).toFixed(2)}</div>
                    <div style={{ fontSize:12, color:'#555', marginBottom:30 }}>Amount in words for due balance</div>

                    {/* Signatures — 4 columns */}
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:40, flexWrap:'wrap', gap:16 }}>
                        {[
                            { name:'Md. Sales Officer', role:'Created by' },
                            { name:'', role:'Authorised signature' },
                            { name:'Md. Delivery Man', role:'Delivered by' },
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
            </div>
        </div>
    );
}

const salesStatuses = ['Pending', 'Confirm', 'Processing', 'Scanning', 'Scanned', 'Picked', 'Shipped', 'Delivered'];
const statusCounts = { Confirm: 47, Delivered: 21121 };

// Statuses that already show records; the rest stay empty until the user hits "Go"
const DEFAULT_VISIBLE = ['Confirm', 'Delivered'];

const offices = ['All Office', 'Head Office', 'Jessore Office', 'Jamalpur Office'];

const confirmRows = [
    { id: 201, invoice: 'AINV-2026-07-0034687', pay: 'Credit', name: 'M/s- Nijhum Traders [AIC-000791]', phone: '01300833577', address: 'Saheb Bazar Haribhanga Panchgarh', address2: 'Panchagarh Sadar, Panchagarh', date: '23-07-2026', amount: 0.00, source: 'Admin' },
    { id: 202, invoice: 'AINV-2026-07-0034686', pay: 'Credit', name: 'M/s-Firoz Traders [AIC-000120]', phone: '01740951459', address: 'Bamoin Bazar, Niamotpur Naogaon', address2: 'Niamotpur, Naogaon', date: '23-07-2026', amount: 100856.00, source: 'App' },
    { id: 203, invoice: 'AINV-2026-07-0034681', pay: 'Credit', name: 'M/s -Arabi Shah Traders [AIC-000830]', phone: '01740999834', address: 'Gangoor Bazar, Niamatpur Naogaon', address2: 'Niamotpur, Naogaon', date: '23-07-2026', amount: 127592.00, source: 'App' },
    { id: 204, invoice: 'AINV-2026-07-0034677', pay: 'Credit', name: 'M/s- Tin Bhai Traders [AIC-000167]', phone: '01717758070', address: 'Choupoti Bazar, Parbotipur Dinajpur', address2: 'Parbotipur Dinajpur, Fulbari', date: '23-07-2026', amount: 45280.00, source: 'App' },
    { id: 205, invoice: 'AINV-2026-07-0034676', pay: 'Cash', name: 'M/s- Alam Traders [AIC-001486]', phone: '01738230480', address: 'Atpukur Hat Phulbari Dinajpur', address2: 'Fulbari, Fulbari', date: '23-07-2026', amount: 36947.20, source: 'App' },
    { id: 206, invoice: 'AINV-2026-07-0034671', pay: 'Cash', name: 'M/s-Alamin Traders [AIC-000274]', phone: '01744326112', address: 'Shisatola Bazar, Charghat Rajshahi', address2: 'Puthia, Natore', date: '23-07-2026', amount: 6400.00, source: 'App' },
    { id: 207, invoice: 'AINV-2026-07-0034669', pay: 'Credit', name: 'M/s- Yesmin Traders [AIC-000241]', phone: '01745831084', address: 'Tetulia Panchagarh', address2: 'Tetulia Panchagarh, Panchagarh', date: '23-07-2026', amount: 39360.00, source: 'App' },
    { id: 208, invoice: 'AINV-2026-07-0034668', pay: 'Cash', name: 'M/s- Kashem Traders [AIC-000147]', phone: '01728399922', address: 'Daridoho Bazar, Shibganj', address2: 'Gobindogonj, Gaibandha', date: '23-07-2026', amount: 15456.00, source: 'App' },
    { id: 209, invoice: 'AINV-2026-07-0034666', pay: 'Cash', name: 'M/s- Kashem Traders [AIC-000147]', phone: '01728399922', address: 'Daridoho Bazar, Shibganj', address2: 'Gobindogonj, Gaibandha', date: '23-07-2026', amount: 5280.00, source: 'App' },
    { id: 210, invoice: 'AINV-2026-07-0034663', pay: 'Credit', name: 'M/s- Alam Traders [AIC-001486]', phone: '01738230480', address: 'Atpukur Hat Phulbari Dinajpur', address2: 'Fulbari, Fulbari', date: '23-07-2026', amount: 976264.00, source: 'App' },
    { id: 211, invoice: 'AINV-2026-07-0034662', pay: 'Cash', name: 'M/s-Barik Traders [AIC-000131]', phone: '01716191059', address: 'Aroter More, Porsha Naogaon', address2: 'Porsha, Naogaon', date: '23-07-2026', amount: 151385.20, source: 'App' },
    { id: 212, invoice: 'AINV-2026-07-0034657', pay: 'Cash', name: 'M/s- Yesmin Traders [AIC-000241]', phone: '01745831084', address: 'Tetulia Panchagarh', address2: 'Tetulia Panchagarh, Panchagarh', date: '23-07-2026', amount: 18504.00, source: 'App' },
];

const deliveredRows = [
    { id: 801, invoice: 'AINV-2026-07-0034601', pay: 'Cash', name: 'M/s Kader Traders [AIC-000486]', phone: '01719669336', address: 'Bscic Industrial, Bogura', address2: 'Bulk, Office', date: '22-07-2026', amount: 44200.00, source: 'Admin' },
    { id: 802, invoice: 'AINV-2026-07-0034596', pay: 'Cash', name: 'M/S Bhai Bhai Traders [AIC-000001]', phone: '01746604015', address: 'Mohasthan Bazar, Shibganj, Bogura', address2: 'Bogura Sadar, Bogura', date: '22-07-2026', amount: 8028.00, source: 'Admin' },
    { id: 803, invoice: 'AINV-2026-07-0034593', pay: 'Cash', name: 'M/S Bhai Bhai Traders [AIC-000001]', phone: '01746604015', address: 'Mohasthan Bazar, Shibganj, Bogura', address2: 'Bogura Sadar, Bogura', date: '22-07-2026', amount: 47025.00, source: 'Admin' },
    { id: 804, invoice: 'AINV-2026-07-0034548', pay: 'Cash', name: 'M/s- Sapla Traders [AIC-000480]', phone: '01712015450', address: 'Fotepur manda Naogaon', address2: 'Manda, Rajshahi', date: '21-07-2026', amount: 4014.00, source: 'App' },
    { id: 805, invoice: 'AINV-2026-07-0034522', pay: 'Cash', name: 'M/s- Alif Traders [AIC-001799]', phone: '01747018954', address: 'Raymajhira Bazar, Bogura Sadar, Bogura', address2: 'Bogura Sadar, Bogura', date: '21-07-2026', amount: 1578.00, source: 'App' },
    { id: 806, invoice: 'AINV-2026-07-0034490', pay: 'Credit', name: 'M/s All Amin Traders [AIC-001738]', phone: '01324199895', address: 'Aftab gong Bazar Nobab gong Dinajpur', address2: 'Birampur, Fulbari', date: '19-07-2026', amount: 0.00, source: 'Admin' },
    { id: 807, invoice: 'AINV-2026-07-0034489', pay: 'Cash', name: 'M/s- Orin Traders [AIC-000393]', phone: '01731990014', address: 'Rampur Bazar, Ranishonkoil', address2: 'Ranishonkoil, Pirganj', date: '19-07-2026', amount: 0.00, source: 'Admin' },
    { id: 808, invoice: 'AINV-2026-07-0034488', pay: 'Credit', name: 'M/s- Orin Traders [AIC-000393]', phone: '01731990014', address: 'Rampur Bazar, Ranishonkoil', address2: 'Ranishonkoil, Pirganj', date: '19-07-2026', amount: 0.00, source: 'Admin' },
    { id: 809, invoice: 'AINV-2026-07-0034487', pay: 'Cash', name: 'M/s-Jahangir Traders [AIC-000404]', phone: '01712739045', address: 'Adhardighi Bazar, Baliadangi Thakurgaon', address2: 'Baliadangi, Panchagarh', date: '19-07-2026', amount: 0.00, source: 'Admin' },
    { id: 810, invoice: 'AINV-2026-07-0034486', pay: 'Credit', name: 'M/s- Jai Shri Traders [AIC-000946]', phone: '01773627813', address: 'Lahiri Hat Baliadangi Thakurgaon', address2: 'Baliadangi, Panchagarh', date: '19-07-2026', amount: 0.00, source: 'Admin' },
    { id: 811, invoice: 'AINV-2026-07-0034485', pay: 'Cash', name: 'M/s- Three Brother [AIC-000451]', phone: '01733137301', address: 'Joldhaka, Nilfamari', address2: 'Dimla Aditmari, Rangpur', date: '19-07-2026', amount: 0.00, source: 'Admin' },
    { id: 812, invoice: 'AINV-2026-07-0034483', pay: 'Credit', name: 'M/s Islam Traders [AIC-002031]', phone: '01719404447', address: 'Silinda, Poba, Rajshahi', address2: 'Paba Rajshahi, Rajshahi', date: '19-07-2026', amount: 0.00, source: 'Admin' },
    { id: 813, invoice: 'AINV-2026-07-0034482', pay: 'Cash', name: 'M/S Jitu Traders [AIC-001244]', phone: '01831561615', address: 'Shokher Bazar, Hakimpur, Dinajpur', address2: 'Ghoraghat, Gaibandha', date: '19-07-2026', amount: 6035.00, source: 'App' },
    { id: 814, invoice: 'AINV-2026-07-0034480', pay: 'Credit', name: 'M/s- Sihab Traders [AIC-000657]', phone: '01717381396', address: 'Shategram Bangla Bazar, Birganj Dinajpur', address2: 'Birganj, Thakurgaon', date: '19-07-2026', amount: 8885.00, source: 'App' },
    { id: 815, invoice: 'AINV-2026-07-0034479', pay: 'Credit', name: 'M/s- Baba Mayer Doya Traders [AIC-000350]', phone: '01723892142', address: 'Shakoya Hat, Boda Panchagarh', address2: 'Boda Panchagarh, Thakurgaon', date: '19-07-2026', amount: 6960.00, source: 'App' },
    { id: 816, invoice: 'AINV-2026-07-0034478', pay: 'Credit', name: 'M/s- Rubel Traders [AIC-002009]', phone: '01736112143', address: 'Kasiyadanga Mor, Poba, Rajshahi', address2: 'Paba Rajshahi, Rajshahi', date: '19-07-2026', amount: 39354.00, source: 'App' },
    { id: 817, invoice: 'AINV-2026-07-0034476', pay: 'Cash', name: 'M/s-Maruf Traders [AIC-000382]', phone: '01747334645', address: 'Chackinarayon More, Porsha Naogaon', address2: 'Porsha, Naogaon', date: '19-07-2026', amount: 11300.00, source: 'App' },
    { id: 818, invoice: 'AINV-2026-07-0034475', pay: 'Cash', name: 'M/s-Shihab Traders [AIC-000253]', phone: '01713705422', address: 'Proshadpur Bazar, Manda Naogaon', address2: 'Manda, Rajshahi', date: '19-07-2026', amount: 7860.00, source: 'App' },
    { id: 819, invoice: 'AINV-2026-07-0034462', pay: 'Credit', name: 'M/s- Moskan Traders [AIC-000507]', phone: '01723613939', address: 'Lohagara Bazar, Baliaydangi', address2: 'Baliadangi, Panchagarh', date: '19-07-2026', amount: 238252.00, source: 'App' },
    { id: 820, invoice: 'AINV-2026-07-0034461', pay: 'Cash', name: 'M/s-Tamim Traders [AIC-000186]', phone: '01792808821', address: 'Madaripur Bazar, Tanore Rajshahi', address2: 'Tanore, Rajshahi', date: '19-07-2026', amount: 5376.00, source: 'App' },
    { id: 821, invoice: 'AINV-2026-07-0034460', pay: 'Credit', name: 'M/s-Faishal Traders [AIC-000173]', phone: '01737665361', address: 'Gakrondo More, Tanore Rajshahi', address2: 'Tanore, Rajshahi', date: '19-07-2026', amount: 3340.00, source: 'App' },
    { id: 822, invoice: 'AINV-2026-07-0034458', pay: 'Cash', name: 'M/s-Faishal Traders [AIC-000173]', phone: '01737665361', address: 'Gakrondo More, Tanore Rajshahi', address2: 'Tanore, Rajshahi', date: '19-07-2026', amount: 28400.00, source: 'App' },
];

// Records that appear for the "search only" tabs once the user presses Go
const searchOnlyRows = {
    Pending: [
        { id: 101, invoice: 'AINV-2026-07-0034702', pay: 'Credit', name: 'M/s- Rahman Traders [AIC-000912]', phone: '01711223344', address: 'Sadar Bazar, Rangpur', address2: 'Rangpur Sadar, Rangpur', date: '24-07-2026', amount: 12500.00, source: 'App' },
        { id: 102, invoice: 'AINV-2026-07-0034701', pay: 'Cash', name: 'M/s- Hoque Traders [AIC-000455]', phone: '01755667788', address: 'Boro Bazar, Dinajpur', address2: 'Dinajpur Sadar, Dinajpur', date: '24-07-2026', amount: 8750.50, source: 'Admin' },
    ],
    Processing: [
        { id: 301, invoice: 'AINV-2026-07-0034690', pay: 'Credit', name: 'M/s- Sumon Traders [AIC-001102]', phone: '01799887766', address: 'Notun Bazar, Bogura', address2: 'Bogura Sadar, Bogura', date: '23-07-2026', amount: 21830.00, source: 'App' },
    ],
    Scanning: [
        { id: 401, invoice: 'AINV-2026-07-0034689', pay: 'Cash', name: 'M/s- Nasir Traders [AIC-000778]', phone: '01733445566', address: 'Station Road, Naogaon', address2: 'Naogaon Sadar, Naogaon', date: '23-07-2026', amount: 23718.00, source: 'App' },
    ],
    Scanned: [
        { id: 501, invoice: 'AINV-2026-07-0034688', pay: 'Credit', name: 'M/s- Jalal Traders [AIC-000634]', phone: '01722334455', address: 'College Road, Thakurgaon', address2: 'Thakurgaon Sadar, Thakurgaon', date: '23-07-2026', amount: 40571.00, source: 'App' },
    ],
    Picked: [
        { id: 601, invoice: 'AINV-2026-07-0034685', pay: 'Cash', name: 'M/s- Babul Traders [AIC-000521]', phone: '01766554433', address: 'Hat Khola, Gaibandha', address2: 'Gaibandha Sadar, Gaibandha', date: '22-07-2026', amount: 17250.00, source: 'App', deliveryMan: 'Karim Mia' },
        { id: 602, invoice: 'AINV-2026-07-0034684', pay: 'Credit', name: 'M/s- Sohel Traders [AIC-000399]', phone: '01744332211', address: 'Puran Bazar, Natore', address2: 'Natore Sadar, Natore', date: '22-07-2026', amount: 9640.00, source: 'Admin', deliveryMan: 'Nazmul Islam' },
    ],
    Shipped: [
        { id: 701, invoice: 'AINV-2026-07-0034680', pay: 'Cash', name: 'M/s- Faruk Traders [AIC-000287]', phone: '01788990011', address: 'Bus Stand, Panchagarh', address2: 'Panchagarh Sadar, Panchagarh', date: '22-07-2026', amount: 33400.00, source: 'App' },
    ],
};

const buildInitialData = () => {
    const map = {};
    salesStatuses.forEach(s => { map[s] = searchOnlyRows[s] ? [...searchOnlyRows[s]] : []; });
    map.Confirm = [...confirmRows];
    map.Delivered = [...deliveredRows];
    return map;
};

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

function ActionBtn({ bg, children, title, onClick }) {
    return (
        <button title={title} onClick={onClick}
            style={{ background: bg, color: 'white', border: 'none', borderRadius: '4px', width: '26px', height: '26px', cursor: 'pointer', fontSize: '12px', margin: '1px' }}>
            {children}
        </button>
    );
}

function Sales({ type = 'Sales' }) {
    const [dataByStatus, setDataByStatus] = useState(buildInitialData);
    const [activeStatus, setActiveStatus] = useState('Pending');
    const [searched, setSearched] = useState({});
    const [page, setPage] = useState(1);

    // filter bar
    const [search, setSearch] = useState('');
    const [date, setDate] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [discount, setDiscount] = useState('');
    const [office, setOffice] = useState('');

    // edit modal
    const [editRow, setEditRow] = useState(null);
    // invoice view modal
    const [viewRow, setViewRow] = useState(null);
    // pending status change per row: { [rowId]: selectedStatus }
    const [pendingStatus, setPendingStatus] = useState({});

    const isDelivered = activeStatus === 'Delivered';
    const showChangeStatus = activeStatus === 'Confirm';
    const showDeliveryMan = activeStatus === 'Picked';

    const visible = DEFAULT_VISIBLE.includes(activeStatus) || searched[activeStatus];
    const allRows = dataByStatus[activeStatus] || [];
    const filtered = visible
        ? allRows.filter(d =>
            d.name.toLowerCase().includes(search.toLowerCase()) ||
            d.invoice.toLowerCase().includes(search.toLowerCase()))
        : [];

    const pageRows = isDelivered ? filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : filtered;
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

    const switchTab = (s) => { setActiveStatus(s); setPage(1); setSearch(''); };

    const handleGo = () => { setSearched(prev => ({ ...prev, [activeStatus]: true })); setPage(1); };

    const handleClear = () => {
        setSearch(''); setDate(''); setStatusFilter(''); setDiscount(''); setOffice('');
        setSearched(prev => ({ ...prev, [activeStatus]: false }));
        setPage(1);
    };

    const handleDelete = (row) => {
        if (!window.confirm(`Delete invoice ${row.invoice}?`)) return;
        setDataByStatus(prev => ({
            ...prev,
            [activeStatus]: prev[activeStatus].filter(r => r.id !== row.id),
        }));
    };

    const handleSaveEdit = () => {
        setDataByStatus(prev => ({
            ...prev,
            [activeStatus]: prev[activeStatus].map(r => (r.id === editRow.id ? { ...editRow, amount: parseFloat(editRow.amount) || 0 } : r)),
        }));
        setEditRow(null);
    };

    // Move a record from the current tab into another status
    const moveTo = (row, newStatus) => {
        if (!newStatus || newStatus === activeStatus) return;
        setDataByStatus(prev => ({
            ...prev,
            [activeStatus]: prev[activeStatus].filter(r => r.id !== row.id),
            [newStatus]: [row, ...(prev[newStatus] || [])],
        }));
    };

    const nextStatus = (row) => {
        const i = salesStatuses.indexOf(activeStatus);
        if (i < salesStatuses.length - 1) moveTo(row, salesStatuses[i + 1]);
    };

    const icons = { Sales: '🛒', 'Sales Return': '↩️', 'Cancel Sales': '❌', Damage: '⚠️' };

    return (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>

            {/* Header */}
            <div style={{ marginBottom: '16px' }}>
                <h2 style={{ color: '#0d6efd', margin: 0 }}>{icons[type] || '🛒'} {type}</h2>
                <p style={{ color: '#6c757d', fontSize: '13px', margin: '2px 0 0' }}>Detailed sales record</p>
            </div>

            {/* Status Tabs */}
            <div style={{ ...cardStyle, padding: 0, marginBottom: '16px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {salesStatuses.map((s, i) => {
                        const active = activeStatus === s;
                        return (
                            <div key={s} onClick={() => switchTab(s)}
                                style={{
                                    flex: '1 1 auto', minWidth: '110px', textAlign: 'center', cursor: 'pointer',
                                    padding: '14px 10px', fontSize: '13px', fontWeight: 'bold', color: 'white',
                                    background: active ? 'linear-gradient(135deg, #f5b544, #f0932b)' : '#243050',
                                    borderRight: i < salesStatuses.length - 1 ? '1px solid #1a2035' : 'none',
                                }}>
                                {s}
                                {statusCounts[s] != null && (
                                    <span style={{ background: active ? '#dc3545' : '#0dcaf0', color: 'white', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', marginLeft: '6px' }}>
                                        {statusCounts[s]}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Filter Bar */}
            <div style={{ ...cardStyle, marginBottom: '16px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                    <input placeholder="🔍 Search Key" value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, flex: '1 1 180px' }} />
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inputStyle, flex: '1 1 140px' }} />
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, flex: '1 1 140px' }}>
                        <option value="">Select Status</option>
                        {salesStatuses.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <select value={discount} onChange={e => setDiscount(e.target.value)} style={{ ...inputStyle, flex: '1 1 140px' }}>
                        <option value="">Select Discount</option>
                        <option>Yes</option>
                    </select>
                    <select value={office} onChange={e => setOffice(e.target.value)} style={{ ...inputStyle, flex: '1 1 140px' }}>
                        <option value="">Select Office</option>
                        {offices.map(o => <option key={o}>{o}</option>)}
                    </select>
                    <button onClick={handleGo} style={{ background: '#28a745', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>✓ Go</button>
                    <button onClick={handleClear} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>✕ Clear</button>
                </div>
            </div>

            {/* Table */}
            <div style={{ ...cardStyle, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '900px' }}>
                    <thead>
                        <tr style={{ background: '#1a2035', color: 'white' }}>
                            <th style={{ padding: '12px', textAlign: 'left' }}>No</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Invoise</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Address</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                            <th style={{ padding: '12px', textAlign: 'right' }}>Amount</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Source</th>
                            {showDeliveryMan && <th style={{ padding: '12px', textAlign: 'left' }}>Delivery Man</th>}
                            {showChangeStatus && <th style={{ padding: '12px', textAlign: 'left' }}>Change Status</th>}
                            <th style={{ padding: '12px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                                Action <button style={{ background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer', marginLeft: '4px' }}>+ Add</button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageRows.map((row, i) => (
                            <tr key={row.id} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                <td style={{ padding: '10px 12px' }}>{(isDelivered ? (page - 1) * PAGE_SIZE : 0) + i + 1}</td>
                                <td style={{ padding: '10px 12px' }}>
                                    <div style={{ color: '#0d6efd', fontWeight: 'bold', marginBottom: '4px' }}>{row.invoice}</div>
                                    <Badge text={row.pay} color={row.pay === 'Cash' ? '#28a745' : '#0d6efd'} />
                                </td>
                                <td style={{ padding: '10px 12px' }}>
                                    <div style={{ fontWeight: 'bold', color: '#1a2035' }}>{row.name}</div>
                                    <div style={{ color: '#6c757d', fontSize: '12px' }}>{row.phone}</div>
                                </td>
                                <td style={{ padding: '10px 12px', color: '#495057' }}>
                                    <div>{row.address}</div>
                                    <div style={{ color: '#adb5bd', fontSize: '12px' }}>{row.address2}</div>
                                </td>
                                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{row.date}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 'bold' }}>{row.amount.toFixed(2)}</td>
                                <td style={{ padding: '10px 12px' }}>
                                    <Badge text={row.source} color={row.source === 'Admin' ? '#28a745' : '#0dcaf0'} />
                                </td>
                                {showDeliveryMan && <td style={{ padding: '10px 12px' }}>{row.deliveryMan || '-'}</td>}
                                {showChangeStatus && (
                                    <td style={{ padding: '10px 12px' }}>
                                        <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                                            <select
                                                value={pendingStatus[row.id] || ''}
                                                onChange={e => setPendingStatus(prev => ({ ...prev, [row.id]: e.target.value }))}
                                                style={{ ...inputStyle, fontSize: '12px', padding: '6px 8px' }}>
                                                <option value="">Select status</option>
                                                {salesStatuses.filter(s => s !== activeStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                            <button
                                                onClick={() => {
                                                    const sel = pendingStatus[row.id];
                                                    if (!sel) return;
                                                    moveTo(row, sel);
                                                    setPendingStatus(prev => { const n = {...prev}; delete n[row.id]; return n; });
                                                }}
                                                title="Confirm status change"
                                                style={{ background:'#28a745', color:'#fff', border:'none', borderRadius:4, padding:'5px 8px', cursor:'pointer', fontWeight:700, fontSize:13 }}>
                                                ✓
                                            </button>
                                        </div>
                                    </td>
                                )}
                                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                                    <ActionBtn bg="#0d6efd" title="Info" onClick={() => setViewRow(row)}>ℹ</ActionBtn>
                                    {!isDelivered && <ActionBtn bg="#f0932b" title="Edit" onClick={() => setEditRow({ ...row })}>✎</ActionBtn>}
                                    {!isDelivered && <ActionBtn bg="#dc3545" title="Delete" onClick={() => handleDelete(row)}>🗑</ActionBtn>}
                                    {!isDelivered && <ActionBtn bg="#28a745" title="Move to next status" onClick={() => nextStatus(row)}>✓</ActionBtn>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {pageRows.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#adb5bd', padding: '30px' }}>
                        {visible ? 'No data found' : 'Use the filters above and press "Go" to load records.'}
                    </p>
                )}

                {/* Pagination — Delivered only */}
                {isDelivered && filtered.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', marginTop: '16px' }}>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button key={p} onClick={() => setPage(p)} style={{
                                padding: '6px 12px', fontSize: '13px', cursor: 'pointer',
                                border: '1px solid #dee2e6', borderRadius: '4px',
                                background: p === page ? '#0d6efd' : 'white',
                                color: p === page ? 'white' : '#495057',
                            }}>{p}</button>
                        ))}
                        <button onClick={() => setPage(Math.min(totalPages, page + 1))} style={{ padding: '6px 12px', fontSize: '13px', cursor: 'pointer', border: '1px solid #dee2e6', borderRadius: '4px', background: 'white', color: '#495057' }}>›</button>
                        <button onClick={() => setPage(totalPages)} style={{ padding: '6px 12px', fontSize: '13px', cursor: 'pointer', border: '1px solid #dee2e6', borderRadius: '4px', background: 'white', color: '#495057' }}>Last »</button>
                    </div>
                )}
            </div>

            {/* Invoice View Modal */}
            {viewRow && <InvoiceModal row={viewRow} onClose={() => setViewRow(null)} />}

            {/* Edit Modal */}
            {editRow && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px',
                }}>
                    <div style={{ background: 'white', borderRadius: '12px', padding: '24px', width: '520px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ marginTop: 0, color: '#1a2035' }}>✎ Edit — {editRow.invoice}</h3>

                        {[
                            { label: 'Customer Name', key: 'name' },
                            { label: 'Phone', key: 'phone' },
                            { label: 'Address', key: 'address' },
                            { label: 'Area', key: 'address2' },
                            { label: 'Date', key: 'date' },
                            { label: 'Amount', key: 'amount', type: 'number' },
                        ].map(f => (
                            <div key={f.key} style={{ marginBottom: '12px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '4px' }}>{f.label}</label>
                                <input type={f.type || 'text'} value={editRow[f.key]}
                                    onChange={e => setEditRow({ ...editRow, [f.key]: e.target.value })}
                                    style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
                            </div>
                        ))}

                        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '4px' }}>Payment</label>
                                <select value={editRow.pay} onChange={e => setEditRow({ ...editRow, pay: e.target.value })} style={{ ...inputStyle, width: '100%' }}>
                                    <option>Cash</option>
                                    <option>Credit</option>
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '4px' }}>Source</label>
                                <select value={editRow.source} onChange={e => setEditRow({ ...editRow, source: e.target.value })} style={{ ...inputStyle, width: '100%' }}>
                                    <option>Admin</option>
                                    <option>App</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '18px' }}>
                            <button onClick={() => setEditRow(null)} style={{ background: '#6c757d', color: 'white', border: 'none', padding: '9px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                            <button onClick={handleSaveEdit} style={{ background: '#28a745', color: 'white', border: 'none', padding: '9px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>💾 Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Sales;
