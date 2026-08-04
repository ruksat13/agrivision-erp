import React, { useState } from 'react';

const today = new Date().toISOString().split('T')[0];
const thS = { padding: '11px 12px', color: 'white', fontWeight: '700', fontSize: '13px', textAlign: 'left', whiteSpace: 'nowrap' };
const tdS = { padding: '10px 12px', fontSize: '13px', color: '#333', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' };
const toISO = (d) => d.split('-').reverse().join('-');

const Badge = ({ color, children }) => (
    <span style={{ background: color, color: 'white', padding: '3px 9px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>{children}</span>
);

const company = {
    name: 'AGRIVISION INTERNATIONAL',
    address: 'House # 42, Road # 11, Block-C, Banani, Dhaka-1213, Bangladesh',
    phone: '01700-123456',
    email: 'info@agrivisionbd.com',
    web: 'www.agrivisionbd.com',
};

export function CompanyHeader() {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#0d6efd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px', fontWeight: '800', flexShrink: 0 }}>AI</div>
            <div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: '#1a2035', letterSpacing: '0.5px' }}>{company.name}</div>
                <div style={{ fontSize: '12px', color: '#555', marginTop: '6px' }}>📍 : {company.address}</div>
                <div style={{ fontSize: '12px', color: '#555' }}>📞 : {company.phone} , ✉ : {company.email} , 🌐 : {company.web}</div>
            </div>
        </div>
    );
}

const initialPurchases = [
    { id: 1, no: 'AI-001095', supplier: 'Shafirul Islam (Agrivision International)', scode: 'AIS-000055', invoice: '00', date: '04-08-2026', amount: '0.00', status: 'Stock Done', postBy: 'Md. Shafikul Islam', postAt: '04-08-2026 11:32:AM' },
    { id: 2, no: 'AI-001094', supplier: 'M/s- Akondho Gift Please', scode: 'AIS-000065', invoice: '1877', date: '03-08-2026', amount: '29500.00', status: 'Stock Done', postBy: 'Md. Shafikul Islam', postAt: '03-08-2026 11:36:AM' },
    { id: 3, no: 'AI-001093', supplier: 'Shafirul Islam (Agrivision International)', scode: 'AIS-000055', invoice: '0', date: '02-08-2026', amount: '0.00', status: 'Stock Done', postBy: 'Md. Shafikul Islam', postAt: '02-08-2026 17:30:PM' },
    { id: 4, no: 'AI-001092', supplier: 'Shafirul Islam (Agrivision International)', scode: 'AIS-000055', invoice: '00', date: '02-08-2026', amount: '0.00', status: 'Stock Done', postBy: 'Md. Shafikul Islam', postAt: '02-08-2026 11:05:AM' },
    { id: 5, no: 'AI-001091', supplier: 'Shafirul Islam (Agrivision International)', scode: 'AIS-000055', invoice: '00', date: '01-08-2026', amount: '0.00', status: 'Stock Done', postBy: 'Md. Shafikul Islam', postAt: '01-08-2026 17:49:PM' },
    { id: 6, no: 'AI-001090', supplier: 'M/s Leton Gift Palace', scode: 'AIS-000089', invoice: '1095', date: '01-08-2026', amount: '18000.00', status: 'Stock Done', postBy: 'Md. Shafikul Islam', postAt: '01-08-2026 17:41:PM' },
    { id: 7, no: 'AI-001089', supplier: 'Shafirul Islam (Agrivision International)', scode: 'AIS-000055', invoice: '00', date: '01-08-2026', amount: '0.00', status: 'Stock Done', postBy: 'Md. Shafikul Islam', postAt: '01-08-2026 17:27:PM' },
    { id: 8, no: 'AI-001088', supplier: 'Nanjing Ecofarm Biotechnology Co., Ltd', scode: 'AIS-000053', invoice: '10561', date: '30-07-2026', amount: '8876160.00', status: 'Stock Done', postBy: 'Md. Shafikul Islam', postAt: '01-08-2026 16:02:PM' },
    { id: 9, no: 'AI-001087', supplier: 'Shafirul Islam (Agrivision International)', scode: 'AIS-000055', invoice: '12', date: '01-08-2026', amount: '0.00', status: 'Stock Done', postBy: 'Md. Shafikul Islam', postAt: '01-08-2026 12:56:PM' },
    { id: 10, no: 'AI-001086', supplier: 'Shahin Screen Printer', scode: 'AIS-000019', invoice: '549', date: '30-07-2026', amount: '68400.00', status: 'Stock Done', postBy: 'Md. Shafikul Islam', postAt: '01-08-2026 12:49:PM' },
    { id: 11, no: 'AI-001085', supplier: 'Shafirul Islam (Agrivision International)', scode: 'AIS-000055', invoice: '77', date: '30-07-2026', amount: '0.00', status: 'Stock Done', postBy: 'Md. Zihad Ahmed', postAt: '30-07-2026 14:16:PM' },
    { id: 12, no: 'AI-001084', supplier: 'Saba Packaging BD', scode: 'AIS-000005', invoice: '4943', date: '29-07-2026', amount: '74495.00', status: 'Stock Done', postBy: 'Md. Shafikul Islam', postAt: '30-07-2026 12:29:PM' },
];

const supplierOptions = ['Shafirul Islam (Agrivision International)', 'M/s- Akondho Gift Please', 'M/s Leton Gift Palace', 'Nanjing Ecofarm Biotechnology Co., Ltd', 'Shahin Screen Printer', 'Saba Packaging BD'];
const productOptions = ['Agri Zink (packet) 1kg [AI-000728]', 'Green Charge 1 Ltr [AI-000049]', 'Jas Gold 100 Gm [AI-000077]', 'Tetop 100 ml [AI-000642]'];

// ---- Purchase invoice detail (separate page) ----
function PurchaseDetail({ row, onBack }) {
    return (
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: '24px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '18px' }}>
                <button onClick={() => window.print()} style={{ padding: '7px 14px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>🖨️</button>
                <button onClick={onBack} style={{ padding: '7px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '13px' }}>← Back</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
                <CompanyHeader />
                <div style={{ fontSize: '12px', color: '#333' }}>
                    <div style={{ fontWeight: '800', fontSize: '17px', color: '#1a2035', marginBottom: '6px' }}>INVOICE</div>
                    <div>Purchase Number: {row.invoice}</div>
                    <div>Invoice Number: {row.no}</div>
                    <div>Purchase Date: {toISO(row.date)}</div>
                    <div>Due Date: 0000-00-00</div>
                    <div>Payment Method :</div>
                </div>
            </div>

            <div style={{ marginBottom: '16px', fontSize: '12px' }}>
                <div style={{ fontWeight: '700', color: '#1a2035', marginBottom: '3px' }}>Billing Address</div>
                <div>{row.supplier} [{row.scode}]</div>
                <div>01318313050, info@agrivisionbd.com, House # 42, Road # 11, Block-C, Banani, Dhaka.</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
                <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ border: '1px solid #999', padding: '7px', fontSize: '12px', textAlign: 'left', width: '55px' }}>S/N</th>
                        <th style={{ border: '1px solid #999', padding: '7px', fontSize: '12px', textAlign: 'left' }}>Product</th>
                        <th style={{ border: '1px solid #999', padding: '7px', fontSize: '12px', textAlign: 'left', width: '170px' }}>Quantity</th>
                        <th style={{ border: '1px solid #999', padding: '7px', fontSize: '12px', textAlign: 'right', width: '150px' }}>Unit price</th>
                        <th style={{ border: '1px solid #999', padding: '7px', fontSize: '12px', textAlign: 'right', width: '150px' }}>Price</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={{ border: '1px solid #999', padding: '7px', fontSize: '12px' }}>1</td>
                        <td style={{ border: '1px solid #999', padding: '7px', fontSize: '12px' }}>Agri Zink (packet) 1kg</td>
                        <td style={{ border: '1px solid #999', padding: '7px', fontSize: '12px' }}>310 ( 1 KG )</td>
                        <td style={{ border: '1px solid #999', padding: '7px', fontSize: '12px', textAlign: 'right' }}>0.00</td>
                        <td style={{ border: '1px solid #999', padding: '7px', fontSize: '12px', textAlign: 'right' }}>0</td>
                    </tr>
                </tbody>
            </table>

            <div style={{ fontSize: '12px', textAlign: 'right', lineHeight: '1.9' }}>
                <div><b>Net Total</b> &nbsp;&nbsp; {row.amount}</div>
                <div><b>Shipping Charge (+)</b></div>
                <div><b>Additional (+)</b></div>
                <div><b>Discount (-)</b></div>
                <div><b>Total Amount</b> &nbsp;&nbsp; {row.amount}</div>
            </div>

            <div style={{ fontSize: '12px', marginTop: '20px' }}>Note:</div>

            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '50px', fontSize: '12px', color: '#555' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1px dotted #999', paddingTop: '5px', minWidth: '260px' }}>signature</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1px dotted #999', paddingTop: '5px', minWidth: '260px' }}>signature</div>
                </div>
            </div>
        </div>
    );
}

// ---- Add Purchase form ----
function AddPurchase({ onBack }) {
    const [items, setItems] = useState([]);
    const [row, setRow] = useState({ product: '', qty: '', price: '' });
    const [form, setForm] = useState({ invoiceNo: '', date: today, supplier: '', dueDate: '', notes: '' });
    const inp = { width: '100%', padding: '9px 12px', border: '1px solid #dee2e6', borderRadius: '5px', fontSize: '13px', boxSizing: 'border-box' };
    const lbl = { fontSize: '14px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '7px' };

    const addProduct = () => {
        if (!row.product) return;
        setItems(prev => [...prev, { ...row, id: Date.now() }]);
        setRow({ product: '', qty: '', price: '' });
    };

    return (
        <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #e9ecef', fontSize: '15px', color: '#333' }}>Add Purchase</div>
            <div style={{ padding: '22px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '18px', alignItems: 'end', paddingBottom: '20px', borderBottom: '1px solid #f0f0f0' }}>
                    <div>
                        <label style={lbl}>Product</label>
                        <select value={row.product} onChange={e => setRow(p => ({ ...p, product: e.target.value }))} style={inp}>
                            <option value="">🔍 Please select</option>
                            {productOptions.map(p => <option key={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Quantity</label>
                        <input placeholder="Quantity" value={row.qty} onChange={e => setRow(p => ({ ...p, qty: e.target.value }))} style={inp} />
                    </div>
                    <div>
                        <label style={lbl}>Unit Price</label>
                        <input placeholder="Unit Price" value={row.price} onChange={e => setRow(p => ({ ...p, price: e.target.value }))} style={inp} />
                    </div>
                    <button onClick={addProduct} style={{ padding: '10px', background: '#4e73df', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>Add Product</button>
                </div>

                {items.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', margin: '18px 0' }}>
                        <thead>
                            <tr style={{ background: '#1a2035' }}>
                                <th style={thS}>#</th><th style={thS}>Product</th><th style={thS}>Qty</th><th style={thS}>Unit Price</th><th style={thS}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((it, i) => (
                                <tr key={it.id}>
                                    <td style={tdS}>{i + 1}</td>
                                    <td style={tdS}>{it.product}</td>
                                    <td style={tdS}>{it.qty}</td>
                                    <td style={tdS}>{it.price}</td>
                                    <td style={tdS}>
                                        <button onClick={() => setItems(items.filter(x => x.id !== it.id))} style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', padding: '3px 9px', cursor: 'pointer' }}>🗑</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px', marginTop: '22px' }}>
                    <div>
                        <label style={lbl}>Purchase Invoice No</label>
                        <input placeholder="Purchase Invoice No" value={form.invoiceNo} onChange={e => setForm(p => ({ ...p, invoiceNo: e.target.value }))} style={inp} />
                    </div>
                    <div>
                        <label style={lbl}>Purchase Date</label>
                        <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={{ ...inp, background: '#f8f9fa' }} />
                    </div>
                    <div>
                        <label style={lbl}>Supplier <span style={{ color: '#dc3545' }}>*</span></label>
                        <select value={form.supplier} onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))} style={inp}>
                            <option value="">🔍 Please select</option>
                            {supplierOptions.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Due Date</label>
                        <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} style={inp} />
                    </div>
                </div>

                <div style={{ marginTop: '18px' }}>
                    <label style={lbl}>Notes</label>
                    <textarea placeholder="Notes" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ ...inp, height: '70px', resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '18px' }}>
                    <button onClick={onBack} style={{ padding: '8px 22px', background: '#4e73df', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>Back</button>
                    <button style={{ padding: '8px 22px', background: '#1e7e34', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>Save</button>
                </div>
            </div>
        </div>
    );
}

const emptyF = { supplier: '', date: '', invoice: '' };

function Purchase() {
    const [view, setView] = useState('list');
    const [detail, setDetail] = useState(null);
    const [draft, setDraft] = useState(emptyF);
    const [applied, setApplied] = useState(emptyF);

    const handleGo = () => setApplied(draft);
    const handleClear = () => { setDraft(emptyF); setApplied(emptyF); };

    const filtered = initialPurchases.filter(p => {
        if (applied.supplier && p.supplier !== applied.supplier) return false;
        if (applied.date && toISO(p.date) !== applied.date) return false;
        if (applied.invoice && !p.invoice.includes(applied.invoice) && !p.no.toLowerCase().includes(applied.invoice.toLowerCase())) return false;
        return true;
    });

    if (view === 'add') return <AddPurchase onBack={() => setView('list')} />;
    if (detail) return <PurchaseDetail row={detail} onBack={() => setDetail(null)} />;

    const fInp = { padding: '9px 12px', border: '1px solid #ced4da', borderRadius: '5px', fontSize: '13px' };

    return (
        <div style={{ background: 'white', borderRadius: '6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: '22px' }}>
            <div style={{ borderBottom: '2px solid #0d6efd', paddingBottom: '14px', marginBottom: '18px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#0d6efd' }}>🛒 Purchase</div>
                <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '2px' }}>Detailed purchase record</div>
            </div>

            <div style={{ background: '#f0f9ff', padding: '14px 16px', borderRadius: '5px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '18px' }}>
                <select value={draft.supplier} onChange={e => setDraft(p => ({ ...p, supplier: e.target.value }))} style={{ ...fInp, minWidth: '300px' }}>
                    <option value="">🔍 Please select</option>
                    {supplierOptions.map(s => <option key={s}>{s}</option>)}
                </select>
                <input type="date" value={draft.date} onChange={e => setDraft(p => ({ ...p, date: e.target.value }))} style={{ ...fInp, width: '200px' }} />
                <input placeholder="Purchase invoice no" value={draft.invoice} onChange={e => setDraft(p => ({ ...p, invoice: e.target.value }))} style={{ ...fInp, width: '200px' }} />
                <button onClick={handleGo} style={{ padding: '9px 20px', background: '#1e7e34', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>🔍 Go</button>
                <button onClick={handleClear} style={{ padding: '9px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', cursor: 'pointer' }}>✕ Clear</button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#1a2035' }}>
                            <th style={{ ...thS, width: '55px' }}>No</th>
                            <th style={thS}>Purchase No</th>
                            <th style={thS}>Supplier</th>
                            <th style={thS}>Invoice no</th>
                            <th style={thS}>Date</th>
                            <th style={{ ...thS, textAlign: 'right' }}>Amount</th>
                            <th style={thS}>Status</th>
                            <th style={thS}>Posting Date</th>
                            <th style={{ ...thS, textAlign: 'right' }}>
                                Action&nbsp;
                                <button onClick={() => setView('add')} style={{ padding: '3px 11px', background: '#28a745', color: 'white', border: 'none', borderRadius: '3px', fontSize: '12px', cursor: 'pointer' }}>Add</button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={9} style={{ ...tdS, textAlign: 'center', padding: '30px', color: '#adb5bd' }}>No data found</td></tr>
                        ) : filtered.map((p, i) => (
                            <tr key={p.id} style={{ background: i % 2 === 0 ? 'white' : '#f4f8fb' }}>
                                <td style={{ ...tdS, textAlign: 'center' }}>{i + 1}</td>
                                <td style={tdS}>{p.no}</td>
                                <td style={tdS}>{p.supplier} [{p.scode}]</td>
                                <td style={tdS}>{p.invoice}</td>
                                <td style={{ ...tdS, whiteSpace: 'nowrap' }}>{p.date}</td>
                                <td style={{ ...tdS, textAlign: 'right' }}>{p.amount}</td>
                                <td style={tdS}><Badge color="#28a745">{p.status}</Badge></td>
                                <td style={{ ...tdS, fontSize: '12px' }}>
                                    <div style={{ fontWeight: '700', color: '#1a2035' }}>{p.postBy}</div>
                                    <div style={{ color: '#6c757d' }}>{p.postAt}</div>
                                </td>
                                <td style={{ ...tdS, textAlign: 'right' }}>
                                    <button onClick={() => setDetail(p)} title="View" style={{ padding: '6px 11px', background: '#4e73df', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>👁</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Purchase;
