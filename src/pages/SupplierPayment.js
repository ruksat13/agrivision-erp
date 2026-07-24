import React, { useState } from 'react';

const today = new Date().toISOString().split('T')[0];

const thS = { padding: '10px 12px', color: 'white', fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap', textAlign: 'left' };
const tdS = { padding: '9px 12px', fontSize: '12px', color: '#333', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' };

const Badge = ({ color, children }) => (
    <span style={{ background: color, color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>{children}</span>
);

const IBtn = ({ bg, onClick, title, children }) => (
    <button onClick={onClick} title={title} style={{ padding: '4px 8px', background: bg, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', marginRight: '3px' }}>{children}</button>
);

const initialPayments = [
    { id: 1, supplier: 'Fasal Agro Industries', code: 'AIS-000027', amount: '7,79,000.00', type: 'Cash', bankName: 'BRAC Bank', txnId: '', expense: 'Agrivision International (BRAC, CC) [AIE-000300]', date: '23-07-2026', status: 'Pending', note: 'B R A C হতে R T G S করা হয়।' },
    { id: 2, supplier: 'AR Khan and CO.', code: 'AIS-000015', amount: '10,00,000.00', type: 'Cash', bankName: 'BRAC Bank', txnId: '', expense: 'Agrivision International (BRAC, CC) [AIE-000300]', date: '23-07-2026', status: 'Pending', note: 'B R A C হতে R T G S করা হয়।' },
    { id: 3, supplier: 'Pyramid Printing Pack', code: 'AIS-000058', amount: '2,00,000.00', type: 'Cash', bankName: '', txnId: '', expense: 'Agrivision International (Mohasthangor SME/Krishi Bogra) [AIE-000181]', date: '19-07-2026', status: 'Pending', note: 'স্যারের মোবাইল মারফৎ পিরামিড প্রিন্টিং পাক কে উক্ত টাকা প্রদান করা হয়।' },
    { id: 4, supplier: 'CANARY AGRO CHEMICALS PRIVATE LIMITED', code: 'AIS-000024', amount: '5,00,000.00', type: 'Cash', bankName: '', txnId: '', expense: 'Agrivision International (Mohasthangor SME/Krishi Bogra) [AIE-000181]', date: '14-07-2026', status: 'Pending', note: 'স্যার মোবাইল ব্যাংকিং মহস্থান গড় শাখা হতে এল সি প্রোডাক্ট ক্রয় করার জন্য অগ্রিম 5,00,000 টাকা প্রদান।' },
    { id: 5, supplier: 'Nanjing Ecofarm Biotechnology Co., Ltd', code: 'AIS-000053', amount: '36,86,400.00', type: 'Cash', bankName: 'BRAC Bank', txnId: '', expense: 'Agrivision International (BRAC, CC) [AIE-000300]', date: '08-07-2026', status: 'Pending', note: 'জাস গোল্ড বাবদ B R A C হতে R T G S করা হয়।' },
    { id: 6, supplier: 'Sufola Agro Chemicals Industries', code: 'AIS-000006', amount: '5,80,000.00', type: 'Cash', bankName: 'BRAC Bank', txnId: '', expense: 'Agrivision International (BRAC, CC) [AIE-000300]', date: '09-07-2026', status: 'Pending', note: 'B R A C হতে R T G S করা হয়।' },
    { id: 7, supplier: 'Bongshe Moharaj & Agro Tecnology', code: 'AIS-000088', amount: '17,90,000.00', type: 'Cash', bankName: 'BRAC Bank', txnId: '', expense: 'Agrivision International (BRAC, CC) [AIE-000300]', date: '08-07-2026', status: 'Pending', note: 'B R A C Bank হতে R T G S করা হয়।' },
    { id: 8, supplier: 'Hasan Polymer Industries', code: 'AIS-000002', amount: '5,00,000.00', type: 'Cash', bankName: '', txnId: '', expense: 'Agrivision International [AIE-000057]', date: '08-07-2026', status: 'Pending', note: 'স্যার মোবাইল ব্যাংকিং মাধ্যমে উক্ত টাকা পাঠানো হয়।' },
    { id: 9, supplier: 'M F Fashion', code: 'AIS-000063', amount: '70,900.00', type: 'Cash', bankName: '', txnId: '', expense: 'Agrivision International [AIE-000057]', date: '07-07-2026', status: 'Pending', note: 'ডাচ-বাংলা ব্যাংক বড়গোলা শাখা চেক নং 8897433।' },
    { id: 10, supplier: 'AGROIRIS (BD) LTD (RAINBOW)', code: 'AIS-000056', amount: '45,51,500.00', type: 'Cash', bankName: '', txnId: '', expense: 'Agrivision International [AIE-000057]', date: '15-06-2026', status: 'Pending', note: 'রেইনবো কোম্পানী প্রোডাক্ট জি আর লেজার নং১ পৃষ্ঠা নং৭৫ টাকা ৪৫৫১৫০০।' },
    { id: 11, supplier: 'CANARY AGRO CHEMICALS PRIVATE LIMITED', code: 'AIS-000024', amount: '1,54,463.00', type: 'Cash', bankName: '', txnId: '', expense: 'Agrivision International [AIE-000057]', date: '01-07-2026', status: 'Pending', note: 'স্যার পারসোনাল ভাবে উক্ত টাকা প্রদান করেন।' },
    { id: 26, supplier: 'AGROIRIS (BD) LTD (RAINBOW)', code: 'AIS-000056', amount: '1,00,00,000.00', type: 'Cash', bankName: 'BRAC Bank', txnId: '', expense: 'Agrivision International (BRAC, CC) [AIE-000300]', date: '15-06-2026', status: 'Approved', note: 'B R A C ব্যাংক হতে R T G S করা হয়।' },
    { id: 27, supplier: 'Madina Printing Pack', code: 'AIS-000003', amount: '25,00,000.00', type: 'Cash', bankName: '', txnId: '', expense: 'Agrivision International [AIE-000057]', date: '08-06-2026', status: 'Approved', note: 'ডাচ-বাংলা ব্যাংক বড় গোল শাখা চেক নং 8897415।' },
    { id: 28, supplier: 'AR Khan and CO.', code: 'AIS-000015', amount: '19,51,500.00', type: 'Cash', bankName: '', txnId: '', expense: 'Agrivision International (Mohasthangor SME/Krishi Bogra) [AIE-000181]', date: '08-06-2026', status: 'Approved', note: 'ডাচ-বাংলা ব্যাংক মহস্থান শাখা হতে R T G S করা হয়।' },
    { id: 29, supplier: 'Mitali Offset Press and Computer', code: 'AIS-000004', amount: '10,00,000.00', type: 'Cash', bankName: '', txnId: '', expense: 'Agrivision International [AIE-000057]', date: '11-06-2026', status: 'Approved', note: 'মিতালী প্রেস কে লেবেল ক্রয় বাবদ উক্ত প্রদান করা হয়।' },
    { id: 30, supplier: 'Pyramid Printing Pack', code: 'AIS-000058', amount: '10,00,000.00', type: 'Cash', bankName: '', txnId: '', expense: 'Agrivision International (Mohasthangor SME/Krishi Bogra) [AIE-000181]', date: '11-06-2026', status: 'Approved', note: 'পিরামিড প্রিন্টিং পাক কে প্যাকেট ক্রয় বাবদ উক্ত টাকা প্রদান করা হয়।' },
    { id: 34, supplier: 'Saba Packaging BD', code: 'AIS-000005', amount: '33,00,000.00', type: 'Cash', bankName: '', txnId: '', expense: 'Agrivision International [AIE-000057]', date: '10-06-2026', status: 'Approved', note: 'সাবা প্যাকেজিং কে কার্টন ক্রয় বাবদ উক্ত টাকা প্রদান করা হয়।' },
    { id: 35, supplier: 'Digital Poly Pack', code: 'AIS-000008', amount: '40,00,000.00', type: 'Cash', bankName: '', txnId: '', expense: 'Agrivision International [AIE-000057]', date: '09-06-2026', status: 'Approved', note: 'ডিজিটাল পলিপ্যাক নাফিজকে প্যাকেট ও লেবেল ক্রয় বাবদ উক্ত টাকা প্রদান করা হয়।' },
];

const supplierOptions = ['Fasal Agro Industries', 'AR Khan and CO.', 'Pyramid Printing Pack', 'CANARY AGRO CHEMICALS', 'Nanjing Ecofarm Biotechnology', 'Sufola Agro Chemicals', 'Hasan Polymer Industries', 'Saba Packaging BD', 'Digital Poly Pack'];
const paymentTypes = ['Cash', 'bKash', 'Nagad', 'Bank Transfer', 'Cheque', 'RTGS'];
const accountExpenses = ['Agrivision International (BRAC, CC) [AIE-000300]', 'Agrivision International [AIE-000057]', 'Agrivision International (Mohasthangor SME/Krishi Bogra) [AIE-000181]'];

function EditModal({ row, onClose, onSave }) {
    const [form, setForm] = useState({ ...row });
    const inp = { width: '100%', padding: '8px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' };
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'white', borderRadius: '10px', padding: '28px', width: '520px', maxWidth: '95vw' }}>
                <h5 style={{ margin: '0 0 20px', color: '#1a2035' }}>Edit Supplier Payment</h5>
                {[
                    { label: 'Supplier', key: 'supplier', readOnly: true },
                    { label: 'Amount', key: 'amount' },
                    { label: 'Bank / Digital Name', key: 'bankName' },
                    { label: 'TxnID / Account Name', key: 'txnId' },
                ].map(f => (
                    <div key={f.key} style={{ marginBottom: '14px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '5px' }}>{f.label}</label>
                        <input value={form[f.key]} readOnly={f.readOnly}
                            onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                            style={{ ...inp, background: f.readOnly ? '#f8f9fa' : 'white' }} />
                    </div>
                ))}
                <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '5px' }}>Payment Type</label>
                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={inp}>
                        {paymentTypes.map(t => <option key={t}>{t}</option>)}
                    </select>
                </div>
                <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '5px' }}>Pay Date</label>
                    <input type="date" value={form.date.split('-').reverse().join('-')}
                        onChange={e => setForm(p => ({ ...p, date: e.target.value.split('-').reverse().join('-') }))}
                        style={inp} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '5px' }}>Note</label>
                    <textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                        style={{ ...inp, height: '70px', resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ padding: '8px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                    <button onClick={() => { onSave(form); onClose(); }} style={{ padding: '8px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Save</button>
                </div>
            </div>
        </div>
    );
}

function AddForm({ onBack }) {
    const [form, setForm] = useState({ supplier: '', amount: '', date: today, paymentType: '', accountExpense: '', note: '' });
    const inp = { width: '100%', padding: '9px 12px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' };
    const row = { display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'flex-start' };
    const lbl = { width: '160px', flexShrink: 0, fontWeight: '600', fontSize: '13px', color: '#495057', paddingTop: '10px' };

    return (
        <div style={{ background: 'white', borderRadius: '10px', padding: '0', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: '700', fontSize: '14px', color: '#333', cursor: 'pointer' }}>
                &gt; Add Supplier Payment
            </div>
            <div style={{ padding: '24px 32px' }}>
                <div style={row}>
                    <span style={lbl}>Supplier <span style={{ color: '#dc3545' }}>*</span></span>
                    <select value={form.supplier} onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))} style={inp}>
                        <option value="">Select Supplier</option>
                        {supplierOptions.map(s => <option key={s}>{s}</option>)}
                    </select>
                </div>
                <div style={row}>
                    <span style={lbl}>Pay amount <span style={{ color: '#dc3545' }}>*</span></span>
                    <input placeholder="Pay Amount" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} style={inp} />
                </div>
                <div style={row}>
                    <span style={lbl}>Pay date <span style={{ color: '#dc3545' }}>*</span></span>
                    <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={{ ...inp, background: '#f8f9fa' }} />
                </div>
                <div style={row}>
                    <span style={lbl}>Payment Type <span style={{ color: '#dc3545' }}>*</span></span>
                    <select value={form.paymentType} onChange={e => setForm(p => ({ ...p, paymentType: e.target.value }))} style={inp}>
                        <option value="">🔍 Please select</option>
                        {paymentTypes.map(t => <option key={t}>{t}</option>)}
                    </select>
                </div>
                <div style={row}>
                    <span style={lbl}>Account Expense <span style={{ color: '#dc3545' }}>*</span></span>
                    <select value={form.accountExpense} onChange={e => setForm(p => ({ ...p, accountExpense: e.target.value }))} style={inp}>
                        <option value="">🔍 Please select</option>
                        {accountExpenses.map(a => <option key={a}>{a}</option>)}
                    </select>
                </div>
                <div style={row}>
                    <span style={lbl}>Document</span>
                    <div style={{ flex: 1 }}>
                        <input type="file" accept="image/*" style={{ fontSize: '13px' }} />
                        <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '6px' }}>⚠ Note: Only image files (JPG, JPEG, PNG) are allowed. Other files will not work.</div>
                    </div>
                </div>
                <div style={row}>
                    <span style={lbl}>Note</span>
                    <textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                        style={{ ...inp, height: '80px', resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px', paddingLeft: '176px' }}>
                    <button style={{ padding: '8px 24px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Save</button>
                    <button onClick={onBack} style={{ padding: '8px 24px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Go Back</button>
                </div>
            </div>
        </div>
    );
}

function SupplierPayment() {
    const [view, setView] = useState('list');
    const [payments, setPayments] = useState(initialPayments);
    const [editRow, setEditRow] = useState(null);
    const [open, setOpen] = useState(true);

    const handleApprove = (id) => setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'Approved' } : p));
    const handleDelete = (id) => { if (window.confirm('Delete this payment?')) setPayments(prev => prev.filter(p => p.id !== id)); };
    const handleSave = (updated) => setPayments(prev => prev.map(p => p.id === updated.id ? updated : p));

    if (view === 'add') return <AddForm onBack={() => setView('list')} />;

    return (
        <div>
            {editRow && <EditModal row={editRow} onClose={() => setEditRow(null)} onSave={handleSave} />}

            <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                {/* Header */}
                <div onClick={() => setOpen(!open)} style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: '700', fontSize: '14px', color: '#333', cursor: 'pointer', userSelect: 'none' }}>
                    {open ? '∨' : '>'} Payment History
                </div>

                {open && (
                    <>
                        {/* Filter bar */}
                        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <select style={{ padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', minWidth: '160px' }}>
                                <option>🔍 Please select</option>
                                {supplierOptions.map(s => <option key={s}>{s}</option>)}
                            </select>
                            <input placeholder="Search" style={{ padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', width: '140px' }} />
                            <input type="date" style={{ padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px' }} />
                            <select style={{ padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', minWidth: '130px' }}>
                                <option>🔍 Please select</option>
                                <option>Pending</option>
                                <option>Approved</option>
                            </select>
                            <button style={{ padding: '7px 18px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Go</button>
                            <button style={{ padding: '7px 18px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Clear</button>
                        </div>

                        {/* Table */}
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#1a2035' }}>
                                        <th style={{ ...thS, width: '40px' }}>No</th>
                                        <th style={thS}>Supplier name</th>
                                        <th style={{ ...thS, textAlign: 'right' }}>Amount | Type</th>
                                        <th style={thS}>Digital/Bank Name</th>
                                        <th style={thS}>Num/TxnID | Ac Name/NO</th>
                                        <th style={thS}>Expense | Date</th>
                                        <th style={thS}>Status</th>
                                        <th style={thS}>Note</th>
                                        <th style={{ ...thS, textAlign: 'right' }}>
                                            Action&nbsp;
                                            <button onClick={() => setView('add')} style={{ padding: '3px 10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>🌿 Add</button>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((p, i) => (
                                        <tr key={p.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                            <td style={{ ...tdS, textAlign: 'center' }}>{i + 1}</td>
                                            <td style={tdS}>
                                                <div style={{ fontWeight: '600', color: '#1a2035' }}>{p.supplier}</div>
                                                <div style={{ color: '#6c757d', fontSize: '11px' }}>[{p.code}]</div>
                                            </td>
                                            <td style={{ ...tdS, textAlign: 'right' }}>
                                                <div style={{ fontWeight: '600' }}>{p.amount}</div>
                                                <Badge color="#28a745">{p.type}</Badge>
                                            </td>
                                            <td style={tdS}>{p.bankName}</td>
                                            <td style={tdS}>{p.txnId}</td>
                                            <td style={tdS}>
                                                <div style={{ fontSize: '11px', color: '#333' }}>{p.expense}</div>
                                                <div style={{ fontSize: '11px', color: '#6c757d' }}>{p.date}</div>
                                            </td>
                                            <td style={tdS}>
                                                <Badge color={p.status === 'Approved' ? '#28a745' : '#0dcaf0'}>
                                                    {p.status}
                                                </Badge>
                                            </td>
                                            <td style={{ ...tdS, maxWidth: '200px', fontSize: '11px' }}>{p.note}</td>
                                            <td style={{ ...tdS, whiteSpace: 'nowrap' }}>
                                                {p.status === 'Pending' && (
                                                    <>
                                                        <IBtn bg="#4e73df" onClick={() => setEditRow(p)} title="Edit">✎</IBtn>
                                                        <IBtn bg="#1cc88a" onClick={() => handleApprove(p.id)} title="Approve">✔</IBtn>
                                                        <IBtn bg="#e74a3b" onClick={() => handleDelete(p.id)} title="Delete">🗑</IBtn>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default SupplierPayment;
