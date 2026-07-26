import React, { useState } from 'react';

const today = new Date().toISOString().split('T')[0];
const thS = { padding: '10px 12px', color: 'white', fontWeight: '600', fontSize: '13px', textAlign: 'left', whiteSpace: 'nowrap' };
const tdS = { padding: '9px 12px', fontSize: '12px', color: '#333', borderBottom: '1px solid #f0f0f0', verticalAlign: 'top' };

const Badge = ({ color, children }) => (
    <span style={{ background: color, color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '600', display: 'inline-block' }}>{children}</span>
);

const IBtn = ({ bg, onClick, title, children }) => (
    <button onClick={onClick} title={title} style={{ padding: '4px 8px', background: bg, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', marginRight: '3px' }}>{children}</button>
);

const toISO = (d) => d.split('-').reverse().join('-');

const expenseHeads = ['Advance Expense', 'Bank Charge', 'Bus Delivery Expense', 'Car Expense', 'Courier Expense', 'Labour Cost', 'Labour Delivery Expense', 'Labour Breakfast', 'Meeting Expense', 'Manager Expense', 'Office Expense', 'Rent Expense'];
const officers = ['Md. Ruksat Hasan Akib', 'Aktaruzzaman Monir', 'Md. Shafirul Islam'];

const initialExpenses = [
    { id: 1, no: 19, code: 'AIEX-012513', voucher: 'V:217', officer: 'Md. Ruksat Hasan Akib', head: 'Labour Delivery Expense', date: '19-07-2026', amount: '4,600.00', note: 'পণ্য ডেলিভারির শ্রমিক খরচ বাবদ প্রদান করা হয়।', status: 'Pending', posting: 'Aktaruzzaman Monir\n23-07-2026 14:56PM' },
    { id: 2, no: 20, code: 'AIEX-012512', voucher: 'V:216', officer: 'Md. Ruksat Hasan Akib', head: 'Meeting Expense', date: '22-07-2026', amount: '536.00', note: 'মাসিক মিটিং এর আপ্যায়ন খরচ।', status: 'Pending', posting: 'Aktaruzzaman Monir\n25-07-2026 14:32PM' },
    { id: 3, no: 21, code: 'AIEX-012511', voucher: 'V:215', officer: 'Md. Ruksat Hasan Akib', head: 'Labour Cost', date: '15-07-2026', amount: '2,760.00', note: 'গুদামের শ্রমিক মজুরি প্রদান।', status: 'Pending', posting: 'Aktaruzzaman Monir\n23-07-2026 14:17PM' },
    { id: 4, no: 22, code: 'AIEX-012510', voucher: 'V:214', officer: 'Md. Ruksat Hasan Akib', head: 'Office Expense', date: '16-07-2026', amount: '500.00', note: 'অফিসের প্রয়োজনীয় সামগ্রী ক্রয়।', status: 'Pending', posting: 'Aktaruzzaman Monir\n23-07-2026 14:14PM' },
    { id: 5, no: 23, code: 'AIEX-012509', voucher: 'V:213', officer: 'Md. Ruksat Hasan Akib', head: 'Bus Delivery Expense', date: '15-07-2026', amount: '288.00', note: 'বাসে পণ্য পরিবহন খরচ।', status: 'Pending', posting: 'Aktaruzzaman Monir\n23-07-2026 14:12PM' },
    { id: 6, no: 24, code: 'AIEX-012508', voucher: 'V:212', officer: 'Md. Ruksat Hasan Akib', head: 'Manager Expense', date: '20-07-2026', amount: '2,655.00', note: 'ম্যানেজারের যাতায়াত ও আপ্যায়ন খরচ।', status: 'Pending', posting: 'Aktaruzzaman Monir\n23-07-2026 13:08PM' },
    { id: 7, no: 25, code: 'AIEX-012507', voucher: 'V:211', officer: 'Md. Ruksat Hasan Akib', head: 'Rent Expense', date: '20-07-2026', amount: '1,600.00', note: 'গুদাম ভাড়া বাবদ প্রদান।', status: 'Pending', posting: 'Aktaruzzaman Monir\n23-07-2026 12:56PM' },
    { id: 8, no: 26, code: 'AIEX-012506', voucher: 'V:210', officer: 'Md. Ruksat Hasan Akib', head: 'Meeting Expense', date: '21-07-2026', amount: '3,168.00', note: 'ডিলার মিটিং এর খরচ।', status: 'Pending', posting: 'Aktaruzzaman Monir\n25-07-2026 12:53PM' },
    { id: 9, no: 27, code: 'AIEX-012505', voucher: 'V:209', officer: 'Md. Ruksat Hasan Akib', head: 'Labour Cost', date: '21-07-2026', amount: '1,260.00', note: 'লোড-আনলোড শ্রমিক মজুরি।', status: 'Pending', posting: 'Aktaruzzaman Monir\n25-07-2026 12:41PM' },
    { id: 10, no: 28, code: 'AIEX-012504', voucher: 'V:208', officer: 'Md. Ruksat Hasan Akib', head: 'Manager Expense', date: '02-07-2026', amount: '1,430.00', note: 'ম্যানেজার যাতায়াত খরচ।', status: 'Pending', posting: 'Aktaruzzaman Monir\n23-07-2026 12:32PM' },
    { id: 11, no: 29, code: 'AIEX-012503', voucher: 'V:207', officer: 'Md. Ruksat Hasan Akib', head: 'Courier Expense', date: '18-07-2026', amount: '200.00', note: 'কুরিয়ার সার্ভিস খরচ।', status: 'Pending', posting: 'Aktaruzzaman Monir\n23-07-2026 12:29PM' },
    { id: 12, no: 30, code: 'AIEX-012502', voucher: 'V:206', officer: 'Md. Ruksat Hasan Akib', head: 'Meeting Expense', date: '21-07-2026', amount: '2,665.00', note: 'সেলস টিম মিটিং আপ্যায়ন।', status: 'Approved', posting: 'Aktaruzzaman Monir\n25-07-2026 12:23PM' },
    { id: 13, no: 31, code: 'AIEX-012501', voucher: 'V:205', officer: 'Md. Ruksat Hasan Akib', head: 'Labour Breakfast', date: '18-07-2026', amount: '1,600.00', note: 'শ্রমিকদের সকালের নাস্তা।', status: 'Approved', posting: 'Aktaruzzaman Monir\n23-07-2026 12:19PM' },
];

function AddForm({ onBack }) {
    const [form, setForm] = useState({ type: 'Expense', head: '', receivedBy: '', date: today, amount: '', note: '' });
    const inp = { width: '100%', padding: '9px 12px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' };
    const row = { display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'flex-start' };
    const lbl = { width: '150px', flexShrink: 0, fontWeight: '600', fontSize: '13px', color: '#495057', paddingTop: '10px' };

    return (
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                &gt; Add Transaction
            </div>
            <div style={{ padding: '24px 32px', maxWidth: '800px' }}>
                <div style={row}>
                    <span style={lbl}>Type <span style={{ color: '#dc3545' }}>*</span></span>
                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={inp}>
                        <option>Expense</option>
                        <option>Income</option>
                    </select>
                </div>
                <div style={row}>
                    <span style={lbl}>Expense <span style={{ color: '#dc3545' }}>*</span></span>
                    <select value={form.head} onChange={e => setForm(p => ({ ...p, head: e.target.value }))} style={inp}>
                        <option value="">Select Expense Head</option>
                        {expenseHeads.map(h => <option key={h}>{h}</option>)}
                    </select>
                </div>
                <div style={row}>
                    <span style={lbl}>Received By <span style={{ color: '#dc3545' }}>*</span></span>
                    <select value={form.receivedBy} onChange={e => setForm(p => ({ ...p, receivedBy: e.target.value }))} style={inp}>
                        <option value="">Select Officer</option>
                        {officers.map(o => <option key={o}>{o}</option>)}
                    </select>
                </div>
                <div style={row}>
                    <span style={lbl}>Date <span style={{ color: '#dc3545' }}>*</span></span>
                    <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={{ ...inp, background: '#f8f9fa' }} />
                </div>
                <div style={row}>
                    <span style={lbl}>Amount <span style={{ color: '#dc3545' }}>*</span></span>
                    <input placeholder="Enter Amount" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} style={inp} />
                </div>
                <div style={row}>
                    <span style={lbl}>Note</span>
                    <textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} style={{ ...inp, height: '70px', resize: 'vertical' }} />
                </div>
                <div style={row}>
                    <span style={lbl}>Document</span>
                    <div style={{ flex: 1 }}>
                        <input type="file" accept="image/*" style={{ fontSize: '13px' }} />
                        <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '6px' }}>⚠ Note: Only image files (JPG, JPEG, PNG) are allowed. Other files will not work.</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', paddingLeft: '166px' }}>
                    <button style={{ padding: '8px 24px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Save</button>
                    <button onClick={onBack} style={{ padding: '8px 24px', background: '#0d6efd', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Go Back</button>
                </div>
            </div>
        </div>
    );
}

const emptyF = { search: '', date: '', status: '' };

function Expense() {
    const [view, setView] = useState('list');
    const [expenses, setExpenses] = useState(initialExpenses);
    const [open, setOpen] = useState(true);
    const [draft, setDraft] = useState(emptyF);
    const [applied, setApplied] = useState(emptyF);

    const handleGo = () => setApplied(draft);
    const handleClear = () => { setDraft(emptyF); setApplied(emptyF); };
    const handleApprove = (id) => setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: 'Approved' } : e));
    const handleDelete = (id) => { if (window.confirm('Delete this expense?')) setExpenses(prev => prev.filter(e => e.id !== id)); };

    const filtered = expenses.filter(e => {
        if (applied.search) {
            const k = applied.search.toLowerCase();
            if (!e.head.toLowerCase().includes(k) && !e.code.toLowerCase().includes(k) && !e.officer.toLowerCase().includes(k) && !e.note.toLowerCase().includes(k)) return false;
        }
        if (applied.date && toISO(e.date) !== applied.date) return false;
        if (applied.status && e.status !== applied.status) return false;
        return true;
    });

    if (view === 'add') return <AddForm onBack={() => setView('list')} />;

    const filterInput = { padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px' };

    return (
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div onClick={() => setOpen(!open)} style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: '700', fontSize: '14px', color: '#333', cursor: 'pointer', userSelect: 'none' }}>
                {open ? '∨' : '>'} Manage Expense
            </div>

            {open && (
                <>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <input placeholder="🔍 Search Key" value={draft.search} onChange={e => setDraft(p => ({ ...p, search: e.target.value }))} style={{ ...filterInput, width: '160px' }} />
                        <input type="date" value={draft.date} onChange={e => setDraft(p => ({ ...p, date: e.target.value }))} style={filterInput} />
                        <select value={draft.status} onChange={e => setDraft(p => ({ ...p, status: e.target.value }))} style={{ ...filterInput, minWidth: '130px' }}>
                            <option value="">🔍 Select Status</option>
                            <option>Pending</option>
                            <option>Approved</option>
                        </select>
                        <button onClick={handleGo} style={{ padding: '7px 18px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Go</button>
                        <button onClick={handleClear} style={{ padding: '7px 18px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Clear</button>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#1a2035' }}>
                                    <th style={{ ...thS, width: '36px', textAlign: 'center' }}>#</th>
                                    <th style={thS}>Voucher | Code</th>
                                    <th style={thS}>Officer</th>
                                    <th style={thS}>Expense Head</th>
                                    <th style={thS}>Date</th>
                                    <th style={{ ...thS, textAlign: 'right' }}>Amount</th>
                                    <th style={thS}>Note</th>
                                    <th style={thS}>Status</th>
                                    <th style={thS}>Posting</th>
                                    <th style={{ ...thS, textAlign: 'right' }}>
                                        Action&nbsp;
                                        <button onClick={() => setView('add')} style={{ padding: '3px 10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>🌿 Add</button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={10} style={{ ...tdS, textAlign: 'center', padding: '30px', color: '#6c757d' }}>No data found</td></tr>
                                ) : filtered.map((e, i) => (
                                    <tr key={e.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                        <td style={{ ...tdS, textAlign: 'center' }}>{e.no}</td>
                                        <td style={tdS}>
                                            <Badge color="#28a745">Expense</Badge>
                                            <div style={{ fontSize: '11px', marginTop: '3px' }}>{e.voucher}</div>
                                            <div style={{ color: '#6c757d', fontSize: '11px' }}>{e.code}</div>
                                        </td>
                                        <td style={tdS}>{e.officer}</td>
                                        <td style={{ ...tdS, fontWeight: '500' }}>{e.head}</td>
                                        <td style={{ ...tdS, whiteSpace: 'nowrap' }}>{e.date}</td>
                                        <td style={{ ...tdS, textAlign: 'right', fontWeight: '600' }}>{e.amount}</td>
                                        <td style={{ ...tdS, fontSize: '11px', maxWidth: '200px' }}>{e.note}</td>
                                        <td style={tdS}>
                                            <Badge color={e.status === 'Approved' ? '#28a745' : '#fd7e14'}>{e.status}</Badge>
                                        </td>
                                        <td style={{ ...tdS, fontSize: '11px', color: '#6c757d', whiteSpace: 'pre-line' }}>{e.posting}</td>
                                        <td style={{ ...tdS, whiteSpace: 'nowrap' }}>
                                            {e.status === 'Pending' ? (
                                                <>
                                                    <IBtn bg="#4e73df" onClick={() => setView('add')} title="Edit">✎</IBtn>
                                                    <IBtn bg="#1cc88a" onClick={() => handleApprove(e.id)} title="Approve">✔</IBtn>
                                                    <IBtn bg="#e74a3b" onClick={() => handleDelete(e.id)} title="Delete">🗑</IBtn>
                                                </>
                                            ) : (
                                                <IBtn bg="#4e73df" onClick={() => setView('add')} title="View">🔍</IBtn>
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
    );
}

export default Expense;
