import React, { useState } from 'react';

const COMPANY = {
    name: 'Agrivision International',
    address: 'House # 42, Road # 11, Block-C, Banani, Dhaka-1213, Bangladesh',
    phone: '01700-123456',
    email: 'info@agrivisionbd.com',
    website: 'www.agrivisionbd.com',
};

const salesStatuses = ['Pending', 'Confirm', 'Processing', 'Scanning', 'Scanned', 'Picked', 'Shipped', 'Delivered'];
const statusCounts = { Confirm: 47, Delivered: 21121 };

const CANCEL_ROWS = [
    { id: 1, name: "M/s- Tin Bhai Traders", invoice: 'SAINV-2026-07-0034675', discount: 0.00, amount: 3120.00, source: 'App', phone: '01717758070', address: 'Choupoti Bazar, Parbotipur Dinajpur', contact: 'Md. Abu Saeed', officer: 'Md. Ariful Islam [AIO-000034]', territory: 'Parbotipur Dinajpur', area: 'Fulbari', pay: 'Credit', invDate: '23-07-2026', dueDate: '30-07-2026', items: [{ sn: 1, name: 'Jassquate 61sl 100 Ml', qty: '2 * 24 = 48 ( 100 Ml )', unitPrice: 65.00, price: 3120.00 }], totalLabel: '2 Carton' },
    { id: 2, name: "M/s- S S Traders", invoice: 'SAINV-2026-07-0034622', discount: 0.00, amount: 5376.00, source: 'App', phone: '01716783704', address: 'Rangpur Sadar, Rangpur', contact: 'Md. Salim', officer: 'Bimol Kumar [AIO-000195]', territory: 'Rangpur Sadar', area: 'Rangpur', pay: 'Cash', invDate: '22-07-2026', dueDate: '29-07-2026', items: [{ sn: 1, name: 'Smartzeb 80 Wp 100 Gm', qty: '2 * 24 = 48 ( 100 Gm )', unitPrice: 112.00, price: 5376.00 }], totalLabel: '2 Carton' },
    { id: 3, name: "M/s- S S Traders", invoice: 'SAINV-2026-07-0034621', discount: 0.00, amount: 4080.00, source: 'App', phone: '01716783704', address: 'Rangpur Sadar, Rangpur', contact: 'Md. Salim', officer: 'Bimol Kumar [AIO-000195]', territory: 'Rangpur Sadar', area: 'Rangpur', pay: 'Credit', invDate: '22-07-2026', dueDate: '29-07-2026', items: [{ sn: 1, name: 'Cupertino 72wp Blue 100 Gm', qty: '2 * 24 = 48 ( 100 Gm )', unitPrice: 85.00, price: 4080.00 }], totalLabel: '2 Carton' },
    { id: 4, name: "M/s-Mukta Traders", invoice: 'SAINV-2026-07-0034610', discount: 0.00, amount: 13336.00, source: 'App', phone: '01731990014', address: 'Mirpur, Dhaka', contact: 'Mukta Begum', officer: 'Rozob Ali [AIO-000106]', territory: 'Mirpur', area: 'Dhaka', pay: 'Credit', invDate: '22-07-2026', dueDate: '29-07-2026', items: [{ sn: 1, name: 'GreenMax Fertilizer 1kg', qty: '4 * 12 = 48 ( 1 Kg )', unitPrice: 210.00, price: 10080.00 }, { sn: 2, name: 'Blue Sundari 72wp 100gm', qty: '1 * 24 = 24 ( 100 Gm )', unitPrice: 138.58, price: 3256.00 }], totalLabel: '5 Carton' },
    { id: 5, name: "M/S Rajiya Traders", invoice: 'SAINV-2026-07-0034605', discount: 0.00, amount: 221224.00, source: 'App', phone: '01788990011', address: 'Bus Stand, Panchagarh', contact: 'Md. Rajiy', officer: 'Md. Faruk Islam [AIO-000058]', territory: 'Panchagarh Sadar', area: 'Panchagarh', pay: 'Credit', invDate: '22-07-2026', dueDate: '29-07-2026', items: [{ sn: 1, name: 'Smartzeb 80 Wp 100 Gm (blue)', qty: '10 * 24 = 240 ( 100 Gm )', unitPrice: 102.00, price: 24480.00 }, { sn: 2, name: 'Agrivit Plus 500ml', qty: '8 * 12 = 96 ( 500 Ml )', unitPrice: 153.75, price: 14760.00 }, { sn: 3, name: 'GreenMax Super 1kg', qty: '30 * 12 = 360 ( 1 Kg )', unitPrice: 506.62, price: 182384.00 }], totalLabel: '48 Carton' },
    { id: 6, name: "M/s- Jenin Traders", invoice: 'SAINV-2026-07-0034519', discount: 0.00, amount: 40986.00, source: 'App', phone: '01700112233', address: 'Mohammadpur, Dhaka', contact: 'Jenin Akter', officer: 'Md. Sales Officer [AIO-000010]', territory: 'Mohammadpur', area: 'Dhaka', pay: 'Cash', invDate: '21-07-2026', dueDate: '28-07-2026', items: [{ sn: 1, name: 'Cupertino 72wp Blue 100 Gm', qty: '6 * 24 = 144 ( 100 Gm )', unitPrice: 171.00, price: 24624.00 }, { sn: 2, name: 'Jassquate 61sl 100 Ml', qty: '4 * 24 = 96 ( 100 Ml )', unitPrice: 170.44, price: 16362.00 }], totalLabel: '10 Carton' },
    { id: 7, name: "M/s-Faishal Traders", invoice: 'SAINV-2026-07-0034457', discount: 0.00, amount: 28400.00, source: 'App', phone: '01737665361', address: 'Gakrondo More, Tanore Rajshahi', contact: 'Md. Faishal', officer: 'Rozob Ali [AIO-000106]', territory: 'Tanore', area: 'Rajshahi', pay: 'Credit', invDate: '20-07-2026', dueDate: '27-07-2026', items: [{ sn: 1, name: 'Smartzeb 80 Wp 100 Gm (blue)', qty: '5 * 24 = 120 ( 100 Gm )', unitPrice: 102.00, price: 12240.00 }, { sn: 2, name: 'GreenMax Fertilizer 1kg', qty: '4 * 12 = 48 ( 1 Kg )', unitPrice: 336.67, price: 16160.00 }], totalLabel: '9 Carton' },
    { id: 8, name: "M/s- Yesmin Traders", invoice: 'SAINV-2026-07-0034433', discount: 0.00, amount: 18504.00, source: 'App', phone: '01745831084', address: 'Tetulia Panchagarh', contact: 'Yesmin Begum', officer: 'Md. Faruk Islam [AIO-000058]', territory: 'Tetulia Panchagarh', area: 'Panchagarh', pay: 'Cash', invDate: '20-07-2026', dueDate: '27-07-2026', items: [{ sn: 1, name: 'Blue Sundari 72wp 100gm', qty: '4 * 24 = 96 ( 100 Gm )', unitPrice: 192.75, price: 18504.00 }], totalLabel: '4 Carton' },
    { id: 9, name: "M/s- Alif Traders", invoice: 'SAINV-2026-07-0034424', discount: 0.00, amount: 39136.40, source: 'App', phone: '01747018954', address: 'Raymajhira Bazar, Bogura Sadar', contact: 'Md. Alif', officer: 'Md. Mahedi Hasan Antor [AIO-000083]', territory: 'Bogura Sadar', area: 'Bogura', pay: 'Credit', invDate: '19-07-2026', dueDate: '26-07-2026', items: [{ sn: 1, name: 'Cupertino 72wp Blue 100 Gm', qty: '5 * 24 = 120 ( 100 Gm )', unitPrice: 171.00, price: 20520.00 }, { sn: 2, name: 'Jassquate 61sl 100 Ml', qty: '3 * 24 = 72 ( 100 Ml )', unitPrice: 257.17, price: 18516.40 }], totalLabel: '8 Carton' },
    { id: 10, name: "M/s- Yea Traders", invoice: 'SAINV-2026-07-0034362', discount: 0.00, amount: 129730.00, source: 'App', phone: '01733445566', address: 'Station Road, Naogaon', contact: 'Md. Yeasin', officer: 'Md. moynul Hasan Shadik [AIO-000025]', territory: 'Naogaon Sadar', area: 'Naogaon', pay: 'Credit', invDate: '18-07-2026', dueDate: '25-07-2026', items: [{ sn: 1, name: 'GreenMax Super 1kg', qty: '20 * 12 = 240 ( 1 Kg )', unitPrice: 508.46, price: 122030.00 }, { sn: 2, name: 'Smartzeb 80 Wp 100 Gm (blue)', qty: '3 * 24 = 72 ( 100 Gm )', unitPrice: 107.78, price: 7760.00 }], totalLabel: '23 Carton' },
    { id: 11, name: "M/s- Aliza Traders", invoice: 'SAINV-2026-07-0034341', discount: 0.00, amount: 9000.00, source: 'App', phone: '01722334455', address: 'College Road, Thakurgaon', contact: 'Aliza Khatun', officer: 'Rozob Ali [AIO-000106]', territory: 'Thakurgaon Sadar', area: 'Thakurgaon', pay: 'Cash', invDate: '18-07-2026', dueDate: '25-07-2026', items: [{ sn: 1, name: 'Agrivit Plus 500ml', qty: '2 * 12 = 24 ( 500 Ml )', unitPrice: 153.75, price: 3690.00 }, { sn: 2, name: 'GreenMax Fertilizer 1kg', qty: '2 * 12 = 24 ( 1 Kg )', unitPrice: 220.83, price: 5310.00 }], totalLabel: '4 Carton' },
    { id: 12, name: "M/s Ma Babar dhoua Traders", invoice: 'SAINV-2026-07-0034303', discount: 0.00, amount: 54529.00, source: 'App', phone: '01766554433', address: 'Hat Khola, Gaibandha', contact: 'Md. Babar Ali', officer: 'Md. Sales Officer [AIO-000010]', territory: 'Gaibandha Sadar', area: 'Gaibandha', pay: 'Credit', invDate: '17-07-2026', dueDate: '24-07-2026', items: [{ sn: 1, name: 'Smartzeb 80 Wp 100 Gm (blue)', qty: '8 * 24 = 192 ( 100 Gm )', unitPrice: 102.00, price: 19584.00 }, { sn: 2, name: 'Cupertino 72wp Blue 100 Gm', qty: '6 * 24 = 144 ( 100 Gm )', unitPrice: 132.00, price: 19008.00 }, { sn: 3, name: 'Blue Sundari 72wp 100gm', qty: '4 * 24 = 96 ( 100 Gm )', unitPrice: 165.97, price: 15937.00 }], totalLabel: '18 Carton' },
    { id: 13, name: "M/s- Three Brother", invoice: 'SAINV-2026-07-0034293', discount: 0.00, amount: 38556.80, source: 'App', phone: '01733137301', address: 'Joldhaka, Nilfamari', contact: 'Md. Three Brother', officer: 'Md. Faruk Islam [AIO-000058]', territory: 'Dimla Aditmari', area: 'Rangpur', pay: 'Cash', invDate: '17-07-2026', dueDate: '24-07-2026', items: [{ sn: 1, name: 'GreenMax Super 1kg', qty: '6 * 12 = 72 ( 1 Kg )', unitPrice: 508.46, price: 36609.60 }, { sn: 2, name: 'Jassquate 61sl 100 Ml', qty: '1 * 24 = 24 ( 100 Ml )', unitPrice: 82.80, price: 1987.20 }], totalLabel: '7 Carton' },
    { id: 14, name: "M/s-Agri Science Traders", invoice: 'SAINV-2026-07-0034169', discount: 0.00, amount: 33400.00, source: 'App', phone: '01799887766', address: 'Notun Bazar, Bogura', contact: 'Md. Agri Science', officer: 'Md. Mahedi Hasan Antor [AIO-000083]', territory: 'Bogura Sadar', area: 'Bogura', pay: 'Credit', invDate: '16-07-2026', dueDate: '23-07-2026', items: [{ sn: 1, name: 'Smartzeb 80 Wp 100 Gm (blue)', qty: '5 * 24 = 120 ( 100 Gm )', unitPrice: 102.00, price: 12240.00 }, { sn: 2, name: 'Agrivit Plus 500ml', qty: '8 * 12 = 96 ( 500 Ml )', unitPrice: 220.42, price: 21160.00 }], totalLabel: '13 Carton' },
    { id: 15, name: "M/s- Rakib Traders", invoice: 'SAINV-2026-07-0034151', discount: 0.00, amount: 16700.00, source: 'App', phone: '01711223344', address: 'Sadar Bazar, Rangpur', contact: 'Md. Rakib', officer: 'Bimol Kumar [AIO-000195]', territory: 'Rangpur Sadar', area: 'Rangpur', pay: 'Cash', invDate: '16-07-2026', dueDate: '23-07-2026', items: [{ sn: 1, name: 'Cupertino 72wp Blue 100 Gm', qty: '5 * 24 = 120 ( 100 Gm )', unitPrice: 139.17, price: 16700.00 }], totalLabel: '5 Carton' },
    { id: 16, name: "M/s-Ma Baba traders", invoice: 'SAINV-2026-07-0034150', discount: 0.00, amount: 36510.00, source: 'App', phone: '01755667788', address: 'Boro Bazar, Dinajpur', contact: 'Md. Ma Baba', officer: 'Md. Ariful Islam [AIO-000034]', territory: 'Dinajpur Sadar', area: 'Dinajpur', pay: 'Credit', invDate: '16-07-2026', dueDate: '23-07-2026', items: [{ sn: 1, name: 'GreenMax Fertilizer 1kg', qty: '6 * 12 = 72 ( 1 Kg )', unitPrice: 210.00, price: 15120.00 }, { sn: 2, name: 'Smartzeb 80 Wp 100 Gm (blue)', qty: '8 * 24 = 192 ( 100 Gm )', unitPrice: 111.40, price: 21390.00 }], totalLabel: '14 Carton' },
    { id: 17, name: "M/s- Yesmin Traders", invoice: 'SAINV-2026-07-0034138', discount: 0.00, amount: 6792.00, source: 'App', phone: '01745831084', address: 'Tetulia Panchagarh', contact: 'Yesmin Begum', officer: 'Md. Faruk Islam [AIO-000058]', territory: 'Tetulia Panchagarh', area: 'Panchagarh', pay: 'Cash', invDate: '15-07-2026', dueDate: '22-07-2026', items: [{ sn: 1, name: 'Blue Sundari 72wp 100gm', qty: '2 * 24 = 48 ( 100 Gm )', unitPrice: 141.50, price: 6792.00 }], totalLabel: '2 Carton' },
];

function InvoiceModal({ row, onClose }) {
    const subTotal = row.items.reduce((s, i) => s + i.price, 0);
    const shippingRate = 0.00;
    const grandTotal = subTotal + shippingRate;

    const handlePrint = () => {
        const content = document.getElementById('cancel-invoice-print').innerHTML;
        const w = window.open('', '_blank');
        w.document.write(`<!DOCTYPE html><html><head><title>Invoice - ${row.invoice}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Arial,sans-serif; font-size:12px; color:#000; padding:20px; }
  .hdr { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #000; padding-bottom:12px; margin-bottom:14px; }
  .co-name { font-size:20px; font-weight:bold; color:#0d6efd; }
  .co-addr { font-size:11px; color:#555; margin-top:3px; }
  .inv-title { font-size:16px; font-weight:bold; }
  .inv-meta { font-size:11px; line-height:1.7; margin-top:5px; }
  .billing { border:1px solid #ddd; border-radius:4px; padding:8px 12px; margin-bottom:12px; background:#fafafa; }
  table { width:100%; border-collapse:collapse; }
  th { background:#1a2035; color:#fff; padding:8px; font-size:11px; text-align:left; }
  td { padding:7px 8px; border-bottom:1px solid #eee; font-size:11px; }
  .right { text-align:right; }
  .totals { display:flex; flex-direction:column; align-items:flex-end; margin-top:8px; gap:3px; font-size:12px; }
  .grand { font-size:14px; font-weight:bold; }
  .sigs { display:flex; justify-content:space-between; margin-top:40px; }
  .sig { text-align:center; }
  .sig-name { font-size:12px; font-weight:bold; color:#0d6efd; }
  .sig-line { border-top:1px dashed #000; width:140px; padding-top:4px; font-size:11px; }
  .note { text-align:center; font-size:10px; color:#777; margin-top:10px; }
</style></head><body>${content}</body></html>`);
        w.document.close(); w.focus(); w.print(); w.close();
    };

    return (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:1000, display:'flex', alignItems:'flex-start', justifyContent:'center', overflowY:'auto', padding:'20px' }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ background:'#fff', borderRadius:8, width:'900px', maxWidth:'98%' }}>
                {/* top bar */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 20px', background:'#f8f9fa', borderRadius:'8px 8px 0 0', borderBottom:'1px solid #e0e0e0' }}>
                    <span style={{ fontWeight:700, fontSize:15 }}>Invoice — {row.invoice}</span>
                    <div style={{ display:'flex', gap:8 }}>
                        <button onClick={handlePrint} style={{ background:'#0d6efd', color:'#fff', border:'none', borderRadius:5, padding:'6px 16px', cursor:'pointer', fontWeight:600, fontSize:13 }}>🖨️ Print</button>
                        <button onClick={onClose} style={{ background:'#dc3545', color:'#fff', border:'none', borderRadius:5, padding:'6px 12px', cursor:'pointer', fontSize:13 }}>✕ Close</button>
                    </div>
                </div>

                <div id="cancel-invoice-print" style={{ padding:'24px 28px' }}>
                    {/* Header */}
                    <div className="hdr" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', borderBottom:'2px solid #1a2035', paddingBottom:14, marginBottom:14 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                            <div style={{ width:64, height:64, borderRadius:'50%', background:'#0d6efd', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700 }}>AI</div>
                            <div>
                                <div style={{ fontSize:22, fontWeight:700, color:'#0d6efd' }}>{COMPANY.name}</div>
                                <div style={{ fontSize:11, color:'#555', marginTop:3 }}>📍 {COMPANY.address}</div>
                                <div style={{ fontSize:11, color:'#555' }}>📞 {COMPANY.phone} &nbsp;|&nbsp; ✉️ {COMPANY.email} &nbsp;|&nbsp; 🌐 {COMPANY.website}</div>
                            </div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                            <div style={{ fontSize:17, fontWeight:700, color:'#1a2035' }}>INVOICE</div>
                            <div style={{ fontSize:11, marginTop:5, lineHeight:1.8, color:'#444' }}>
                                <div><strong>Inv. No.:</strong> {row.invoice}</div>
                                <div><strong>Inv. Date:</strong> {row.invDate}</div>
                                <div><strong>Due Date:</strong> {row.dueDate}</div>
                                <div><strong>Status:</strong> <span style={{ color:'#dc3545', fontWeight:700 }}>Cancel</span></div>
                                <div><strong>Payment Method:</strong> {row.pay}</div>
                                <div><strong>Officer:</strong> {row.officer}</div>
                                <div><strong>Territory:</strong> {row.territory}</div>
                                <div><strong>Area:</strong> {row.area}</div>
                            </div>
                        </div>
                    </div>

                    {/* Billing Address */}
                    <div style={{ border:'1px solid #ddd', borderRadius:5, padding:'10px 14px', background:'#fafafa', marginBottom:14 }}>
                        <div style={{ fontWeight:700, fontSize:13, marginBottom:4 }}>Billing Address</div>
                        <div style={{ fontWeight:600, fontSize:13 }}>{row.name}</div>
                        <div style={{ fontSize:12, color:'#555' }}>{row.contact}</div>
                        <div style={{ fontSize:12, color:'#555' }}>{row.phone}, {row.address}</div>
                    </div>

                    {/* Items */}
                    <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:10 }}>
                        <thead>
                            <tr style={{ background:'#1a2035', color:'#fff' }}>
                                {['S/N','Name','Qty','Unit price','Price'].map(h => (
                                    <th key={h} style={{ padding:'9px 10px', textAlign: h==='Unit price'||h==='Price' ? 'right':'left', fontSize:12 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {row.items.map(item => (
                                <tr key={item.sn} style={{ borderBottom:'1px solid #eee' }}>
                                    <td style={{ padding:'8px 10px', fontSize:12 }}>{item.sn}</td>
                                    <td style={{ padding:'8px 10px', fontSize:12 }}>{item.name}</td>
                                    <td style={{ padding:'8px 10px', fontSize:12 }}>{item.qty}</td>
                                    <td style={{ padding:'8px 10px', fontSize:12, textAlign:'right' }}>{item.unitPrice.toFixed(2)}</td>
                                    <td style={{ padding:'8px 10px', fontSize:12, textAlign:'right' }}>{item.price.toFixed(2)}</td>
                                </tr>
                            ))}
                            <tr style={{ background:'#f5f5f5', fontWeight:700 }}>
                                <td colSpan={4} style={{ padding:'8px 10px', fontSize:12, textAlign:'right' }}>Total &nbsp; {row.totalLabel}</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Due Balance */}
                    <div style={{ fontSize:13, marginBottom:10 }}>
                        <strong>Due Balance :</strong> <span style={{ color:'#0d6efd' }}>0.00</span>
                    </div>

                    {/* Totals */}
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, marginBottom:14 }}>
                        <div style={{ fontSize:13 }}>Sub Total &nbsp;&nbsp; <strong>{subTotal.toFixed(2)}</strong></div>
                        <div style={{ fontSize:13 }}>Flat Shipping Rate (+) &nbsp;&nbsp; <strong>{shippingRate.toFixed(2)}</strong></div>
                        <div style={{ fontSize:15, fontWeight:700 }}>Grand Total &nbsp;&nbsp; {grandTotal.toFixed(2)}</div>
                    </div>

                    {/* Signatures */}
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:40, flexWrap:'wrap', gap:16 }}>
                        {[
                            { name: row.officer.split('[')[0].trim(), role:'Created by' },
                            { name:'', role:'Authorised signature' },
                            { name:'', role:'Delivered by' },
                            { name:'', role:'Customer signature' },
                        ].map(sig => (
                            <div key={sig.role} style={{ textAlign:'center' }}>
                                {sig.name && <div style={{ fontSize:12, fontWeight:700, color:'#0d6efd', marginBottom:4 }}>{sig.name}</div>}
                                <div style={{ borderTop:'1px dashed #000', width:140, paddingTop:4, fontSize:11 }}>{sig.role}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ textAlign:'center', fontSize:11, color:'#888', marginTop:12 }}>
                        Invoice was created on a computer and is valid without the signature and seal.
                    </div>
                </div>
            </div>
        </div>
    );
}

function CancelSales() {
    const [activeStatus, setActiveStatus] = useState('Confirm');
    const [viewRow, setViewRow] = useState(null);
    const [ordersOpen, setOrdersOpen] = useState(true);

    return (
        <div style={{ fontFamily:'Arial, sans-serif' }}>
            {/* Header */}
            <div style={{ marginBottom:16 }}>
                <h2 style={{ color:'#0d6efd', margin:0 }}>❌ Cancel Sales</h2>
                <p style={{ color:'#6c757d', fontSize:13, margin:'2px 0 0' }}>Detailed sales record</p>
            </div>

            {/* Collapsible Orders Panel */}
            <div style={{ background:'#fff', borderRadius:8, boxShadow:'0 2px 8px rgba(0,0,0,0.08)', overflow:'hidden', marginBottom:0 }}>
                {/* Orders toggle header */}
                <div onClick={() => setOrdersOpen(o => !o)}
                    style={{ display:'flex', alignItems:'center', gap:6, padding:'12px 18px', cursor:'pointer', borderBottom: ordersOpen ? '1px solid #eee' : 'none', background:'#f8f9fa', fontWeight:700, fontSize:14, color:'#1a2035' }}>
                    <span style={{ fontSize:12, transition:'transform 0.2s', display:'inline-block', transform: ordersOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                    Orders
                </div>

                {ordersOpen && (
                    <>
                        {/* Status Tabs */}
                        <div style={{ display:'flex', flexWrap:'wrap' }}>
                            {salesStatuses.map((s, i) => {
                                const active = activeStatus === s;
                                return (
                                    <div key={s} onClick={() => setActiveStatus(s)}
                                        style={{
                                            flex:'1 1 auto', minWidth:100, textAlign:'center', cursor:'pointer',
                                            padding:'13px 8px', fontSize:13, fontWeight:'bold', color:'white',
                                            background: active ? '#0dcaf0' : '#1a2035',
                                            borderRight: i < salesStatuses.length - 1 ? '1px solid #0a0f1e' : 'none',
                                        }}>
                                        {s}
                                        {statusCounts[s] != null && (
                                            <span style={{ background: active ? '#dc3545' : '#0dcaf0', color:'white', borderRadius:10, padding:'1px 6px', fontSize:11, marginLeft:5 }}>
                                                {statusCounts[s]}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Table */}
                        <div style={{ overflowX:'auto' }}>
                            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                                <thead>
                                    <tr style={{ background:'#1a2035', color:'white' }}>
                                        {['No','Name','Discount','Amount','Invoice','Source','Action'].map(h => (
                                            <th key={h} style={{ padding:'12px 14px', textAlign:'left', fontWeight:600, fontSize:12, whiteSpace:'nowrap' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeStatus === 'Confirm' ? CANCEL_ROWS.map((row, i) => (
                                        <tr key={row.id} style={{ borderBottom:'1px solid #f0f0f0', background: i%2===0 ? '#fff' : '#fafafa' }}>
                                            <td style={{ padding:'10px 14px' }}>{i + 1}</td>
                                            <td style={{ padding:'10px 14px', fontWeight:500 }}>{row.name}</td>
                                            <td style={{ padding:'10px 14px' }}>{row.discount.toFixed(2)}</td>
                                            <td style={{ padding:'10px 14px', fontWeight:600 }}>{row.amount.toLocaleString('en-US', { minimumFractionDigits:2 })}</td>
                                            <td style={{ padding:'10px 14px', color:'#0d6efd', fontWeight:500 }}>{row.invoice}</td>
                                            <td style={{ padding:'10px 14px' }}>
                                                <span style={{ background:'#0dcaf0', color:'#fff', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:4 }}>{row.source}</span>
                                            </td>
                                            <td style={{ padding:'10px 14px' }}>
                                                <button onClick={() => setViewRow(row)} title="View Invoice"
                                                    style={{ background:'#0d6efd', color:'#fff', border:'none', borderRadius:4, padding:'5px 10px', cursor:'pointer', fontSize:13 }}>
                                                    ℹ️
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={7} style={{ textAlign:'center', padding:40, color:'#aaa', fontSize:14 }}>
                                                No data found for <strong>{activeStatus}</strong>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* Invoice Modal */}
            {viewRow && <InvoiceModal row={viewRow} onClose={() => setViewRow(null)} />}
        </div>
    );
}

export default CancelSales;
