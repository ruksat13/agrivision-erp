import React, { useState } from 'react';

const TODAY = new Date().toISOString().split('T')[0];
const FMT_DATE = (d) => new Date(d).toLocaleDateString('en-GB').replace(/\//g, '-');

const OFFICERS = [
    'Bokul Chandra Roy [ AIO-000032 ]', 'Md. Raihan Hossain [ AIO-000110 ]',
    'Md. Ahsan Habib [ AIO-000019 ]', 'Md. Bulbul Ahmed [ AIO-000090 ]',
    'Md. Rehanur Rahman [ AIO-000016 ]', 'Abdullah [ AIO-000036 ]',
    'Khairul Bashar Badsha [ AIO-000044 ]', 'Md. Zobair Hossen [ AIO-000186 ]',
    'Md. Samidul Haque [ AIO-000229 ]', 'Md. Arafat Rahman Ashik [ AIO-000192 ]',
    'Md. Mostafizur Rahman [ AIO-000043 ]', 'Md. Hasan Babu [ AIO-000021 ]',
];

const CUSTOMERS = [
    "M/s- Mimi Traders [ AIC-000219 ]", "M/s- Three Brother [ AIC-000451 ]",
    "M/s- Dou Bhai Traders [ AIC-001644 ]", "M/s-Mai Muna Traders [ AIC-000406 ]",
    "M/s- Bismillah Enterprise [ AIC-001678 ]", "M/S Bokul Enterprise [ AIC-001173 ]",
    "M/s- Shammi and Joy Traders [ AIC-000063 ]", "M/s- Khusi Traders [ AIC-000154 ]",
    "M/s- Bismillah Traders [ AIC-000502 ]",
];

const ACCOUNTS = ['Agrivision Head Office', 'Islami Bank - BARAGOLA', 'Dutch Bangla Bank', 'Sonali Bank'];
const PAYMENT_TYPES = ['Bank', 'Cash', 'Mobile Banking', 'Cheque'];

const INITIAL_COLLECTIONS = [
    {
        id: 1, code: 'AICA-014428',
        officer: 'Bokul Chandra Roy [ AIO-000032 ]',
        amount: 30000.00, type: 'Bank',
        bankName: 'Islami Bank Banglades Limited PLC(BARAGOLA), Joynanda Hat',
        txnId: 'Smart Agrovet\n20503120100146408',
        receivedBy: 'Agrivision International [ AIE-000057 ]',
        receivedDate: '23-07-2026', status: 'Pending',
        customers: [
            { id: 1, name: "M/s- Mimi Traders [ AIC-000219 ]\n01774377609", address: 'Joynandahat Kaharol, Dinajpur\nThakurgaon Sadar, Thakurgaon', mrn: '39262', date: '2026-07-23', invoice: '', amount: 30000.00 },
        ],
    },
    {
        id: 2, code: 'AICA-014427',
        officer: 'Md. Raihan Hossain [ AIO-000110 ]',
        amount: 29300.00, type: 'Bank',
        bankName: 'Islami Bank Banglades Limited PLC(BARAGOLA), Dimla Bazar',
        txnId: 'Smart Agrovet\n20503120100146408',
        receivedBy: 'Agrivision International [ AIE-000057 ]',
        receivedDate: '23-07-2026', status: 'Pending',
        customers: [
            { id: 1, name: "M/s- Three Brother [ AIC-000451 ]\n01733137301", address: 'Joldhaka, Nilfamari\nDimla Aditmari, Rangpur', mrn: '28622', date: '2026-07-22', invoice: '1. AINV-2026-07-0034310 : 29300.00', amount: 29300.00 },
        ],
    },
    {
        id: 3, code: 'AICA-014426',
        officer: 'Md. Ahsan Habib [ AIO-000019 ]',
        amount: 724270.00, type: 'Bank',
        bankName: 'Islami Bank Banglades Limited PLC(BARAGOLA), Nazipur Bazar Ibb',
        txnId: 'Smart Agrovet\n20503120100146408',
        receivedBy: 'Agrivision International [ AIE-000057 ]',
        receivedDate: '23-07-2026', status: 'Pending',
        customers: [
            { id: 1, name: "M/s- Dou Bhai Traders [ AIC-001644 ]\n01729321677", address: 'Bidirpur Bazar, Patnitola Naogaon\nNazipur, Naogaon', mrn: '31139/', date: '2026-07-23', invoice: '', amount: 600000.00 },
            { id: 2, name: "M/s-Mai Muna Traders [ AIC-000406 ]\n01743889318", address: 'Amonto Bazar, Patnitola Naogaon\nNazipur, Naogaon', mrn: '31140/', date: '2026-07-23', invoice: '', amount: 124270.00 },
        ],
    },
    {
        id: 4, code: 'AICA-014424',
        officer: 'Md. Bulbul Ahmed [ AIO-000090 ]',
        amount: 10000.00, type: 'Bank',
        bankName: 'Islami Bank Banglades Limited PLC(BARAGOLA), Dhopaghata Bazar Mohanpur',
        txnId: 'Smart Agrovet\n20503120100146408',
        receivedBy: 'Agrivision International [ AIE-000057 ]',
        receivedDate: '23-07-2026', status: 'Pending',
        customers: [
            { id: 1, name: "M/s- Bismillah Enterprise [ AIC-001678 ]\n01715625652", address: 'Dhoroil Bazar, Mohonpur, Rajshahi\nTanore, Rajshahi', mrn: '35369', date: '2026-07-23', invoice: '', amount: 10000.00 },
        ],
    },
    {
        id: 5, code: 'AICA-014423',
        officer: 'Md. Rehanur Rahman [ AIO-000016 ]',
        amount: 31408.00, type: 'Bank',
        bankName: 'Islami Bank Banglades Limited PLC(BARAGOLA), Mirzapur Bazar Ibb L',
        txnId: 'Smart Agrovet\n20503120100146408',
        receivedBy: 'Agrivision International [ AIE-000057 ]',
        receivedDate: '23-07-2026', status: 'Pending',
        customers: [
            { id: 1, name: "M/S Bokul Enterprise [ AIC-001173 ]\n01740390402", address: 'Bishalpur Bazar, Sherpur, Bogura\nSherpur Bogura, Sherpur', mrn: '31680', date: '2026-07-22', invoice: '1. AINV-2026-07-0034345 : 23200.00', amount: 23200.00 },
            { id: 2, name: "M/s- Shammi and Joy Traders [ AIC-000063 ]\n01774976164", address: 'Sadhubari, Pakarmatha, Sherpur, Bogura\nSherpur Bogura, Sherpur', mrn: '31681', date: '2026-07-22', invoice: '1. AINV-2026-07-0034342 : 8208.00', amount: 8208.00 },
        ],
    },
    {
        id: 6, code: 'AICA-014422',
        officer: 'Abdullah [ AIO-000036 ]',
        amount: 28126.00, type: 'Bank',
        bankName: 'Islami Bank Banglades Limited PLC(BARAGOLA), Tetulia Bazar',
        txnId: 'Smart Agrovet\n20503120100146408',
        receivedBy: 'Agrivision International [ AIE-000057 ]',
        receivedDate: '23-07-2026', status: 'Pending',
        customers: [],
    },
    {
        id: 7, code: 'AICA-014421',
        officer: 'Khairul Bashar Badsha [ AIO-000044 ]',
        amount: 7380.00, type: 'Bank',
        bankName: 'Islami Bank Banglades Limited PLC(BARAGOLA), Paglapir Bazar',
        txnId: 'Smart Agrovet\n20503120100146408',
        receivedBy: 'Agrivision International [ AIE-000057 ]',
        receivedDate: '23-07-2026', status: 'Pending',
        customers: [],
    },
    {
        id: 8, code: 'AICA-000048',
        officer: 'Md. Shoriful Islam [ AIO-000015 ]',
        amount: 5000.00, type: 'Bank',
        bankName: 'Islami Bank Banglades Limited PLC(BARAGOLA), Abadkupur Bazar Dupchaca',
        txnId: 'Smart Agrovet\n20503120100146408',
        receivedBy: 'Agrivision International [ AIE-000057 ]',
        receivedDate: '08-02-2024', status: 'Approved',
        customers: [
            { id: 1, name: "M/s- Khusi Traders [ AIC-000154 ]\n01874849978", address: 'Dighirpar Bazar, Atrai Naogaon\nAdamdighi, Bogura', mrn: '7865', date: '2024-02-09', invoice: '', amount: 5000.00 },
        ],
    },
    {
        id: 9, code: 'AICA-000047',
        officer: 'Md. Sohel Rana [ AIO-000058 ]',
        amount: 8376.00, type: 'Bank',
        bankName: 'Islami Bank Banglades Limited PLC(BARAGOLA), Kawnia Bazar Ibb L',
        txnId: 'Smart Agrovet\n20503120100146408',
        receivedBy: 'Agrivision International [ AIE-000057 ]',
        receivedDate: '08-02-2024', status: 'Approved',
        customers: [
            { id: 1, name: "M/s- Bismillah Traders [ AIC-000502 ]\n01751209362", address: 'Pirgong Rangpur\nRangpur Pirgacha, Rangpur', mrn: '7503', date: '2024-02-08', invoice: '', amount: 8376.00 },
        ],
    },
];

function AddCollectionForm({ onBack, onSave }) {
    const [depositOfficer, setDepositOfficer] = useState('');
    const [depositAmount, setDepositAmount] = useState('');
    const [depositDate, setDepositDate] = useState(TODAY);
    const [accountReceive, setAccountReceive] = useState('');
    const [paymentType, setPaymentType] = useState('');
    const [note, setNote] = useState('');
    const [customerBlocks, setCustomerBlocks] = useState([{
        id: 1, customer: '', mrn: '', payDate: TODAY, amount: '',
        invoices: [{ id: 1, invoice: '', status: '', amount: '' }],
    }]);

    const addCustomer = () => setCustomerBlocks(prev => [...prev, {
        id: Date.now(), customer: '', mrn: '', payDate: TODAY, amount: '',
        invoices: [{ id: Date.now() + 1, invoice: '', status: '', amount: '' }],
    }]);

    const updateCustomer = (cid, key, val) => setCustomerBlocks(prev => prev.map(c => c.id === cid ? { ...c, [key]: val } : c));
    const addInvoice = (cid) => setCustomerBlocks(prev => prev.map(c => c.id === cid ? { ...c, invoices: [...c.invoices, { id: Date.now(), invoice: '', status: '', amount: '' }] } : c));
    const updateInvoice = (cid, iid, key, val) => setCustomerBlocks(prev => prev.map(c => c.id === cid ? { ...c, invoices: c.invoices.map(inv => inv.id === iid ? { ...inv, [key]: val } : inv) } : c));
    const removeInvoice = (cid, iid) => setCustomerBlocks(prev => prev.map(c => c.id === cid ? { ...c, invoices: c.invoices.filter(inv => inv.id !== iid) } : c));
    const removeCustomer = (cid) => setCustomerBlocks(prev => prev.filter(c => c.id !== cid));

    const handleSave = () => {
        if (!depositOfficer || !depositAmount) return alert('Deposit Officer and Amount are required');
        onSave({
            officer: depositOfficer, amount: parseFloat(depositAmount) || 0,
            type: paymentType || 'Bank', bankName: accountReceive || '-',
            txnId: '-', receivedBy: 'Agrivision International',
            receivedDate: FMT_DATE(depositDate), status: 'Pending',
            customers: customerBlocks.filter(c => c.customer).map((c, idx) => ({
                id: idx + 1,
                name: c.customer,
                address: '-', mrn: c.mrn, date: c.payDate, invoice: '', amount: parseFloat(c.amount) || 0,
            })),
        });
    };

    const inp = { padding: '8px 12px', border: '1px solid #ced4da', borderRadius: 5, fontSize: 13, width: '100%', boxSizing: 'border-box' };
    const lbl = { display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: '#444' };

    return (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>
            <div style={{ marginBottom: 16 }}>
                <h2 style={{ color: '#0d6efd', margin: 0 }}>👤 Add Payment Amount</h2>
            </div>
            <div style={{ background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                {/* Row 1 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
                    <div>
                        <label style={lbl}>Deposit Officer <span style={{ color: '#dc3545' }}>*</span></label>
                        <select value={depositOfficer} onChange={e => setDepositOfficer(e.target.value)} style={inp}>
                            <option value="">Select Officer</option>
                            {OFFICERS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Deposit Amount <span style={{ color: '#dc3545' }}>*</span></label>
                        <input type="number" placeholder="Enter Deposit Amount" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} style={inp} />
                    </div>
                    <div>
                        <label style={lbl}>Deposit Date <span style={{ color: '#dc3545' }}>*</span></label>
                        <input type="date" value={depositDate} onChange={e => setDepositDate(e.target.value)} style={{ ...inp, background: '#f8f9fa' }} />
                    </div>
                    <div>
                        <label style={lbl}>Account Receive <span style={{ color: '#dc3545' }}>*</span></label>
                        <select value={accountReceive} onChange={e => setAccountReceive(e.target.value)} style={inp}>
                            <option value="">Please select</option>
                            {ACCOUNTS.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                    <label style={lbl}>Payment Type <span style={{ color: '#dc3545' }}>*</span></label>
                    <select value={paymentType} onChange={e => setPaymentType(e.target.value)} style={{ ...inp, maxWidth: 260 }}>
                        <option value="">Please select</option>
                        {PAYMENT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>

                {/* Collection Section */}
                <div style={{ border: '1px solid #e0e0e0', borderRadius: 7, padding: 16, marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: '#1a2035' }}>Collection</div>
                    {customerBlocks.map((cblock, ci) => (
                        <div key={cblock.id} style={{ border: '1px solid #eee', borderRadius: 6, padding: 14, marginBottom: 14, background: '#fafafa' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <span style={{ fontWeight: 600, fontSize: 13 }}>{ci + 1}. Customer</span>
                                {customerBlocks.length > 1 && (
                                    <button onClick={() => removeCustomer(cblock.id)}
                                        style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: 12 }}>Remove</button>
                                )}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
                                <div>
                                    <label style={lbl}>{ci + 1}. Customer <span style={{ color: '#dc3545' }}>*</span></label>
                                    <select value={cblock.customer} onChange={e => updateCustomer(cblock.id, 'customer', e.target.value)} style={inp}>
                                        <option value="">Select Customer</option>
                                        {CUSTOMERS.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={lbl}>Money Receive Number <span style={{ color: '#dc3545' }}>*</span></label>
                                    <input placeholder="Enter Money Receive Number" value={cblock.mrn} onChange={e => updateCustomer(cblock.id, 'mrn', e.target.value)} style={inp} />
                                </div>
                                <div>
                                    <label style={lbl}>Payment Date <span style={{ color: '#dc3545' }}>*</span></label>
                                    <input type="date" value={cblock.payDate} onChange={e => updateCustomer(cblock.id, 'payDate', e.target.value)} style={{ ...inp, background: '#f8f9fa' }} />
                                </div>
                                <div>
                                    <label style={lbl}>Amount <span style={{ color: '#dc3545' }}>*</span></label>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <input type="number" placeholder="Enter Amount" value={cblock.amount} onChange={e => updateCustomer(cblock.id, 'amount', e.target.value)} style={{ ...inp, flex: 1 }} />
                                        <button onClick={() => removeCustomer(cblock.id)}
                                            style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: 4, padding: '0 8px', cursor: 'pointer', fontSize: 14 }}>🗑</button>
                                    </div>
                                </div>
                            </div>

                            {/* Invoices */}
                            {cblock.invoices.map((inv, ii) => (
                                <div key={inv.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10, marginBottom: 10, paddingLeft: 16 }}>
                                    <div>
                                        <label style={lbl}>{ci + 1}.{ii + 1} Invoice <span style={{ color: '#dc3545' }}>*</span></label>
                                        <select value={inv.invoice} onChange={e => updateInvoice(cblock.id, inv.id, 'invoice', e.target.value)} style={inp}>
                                            <option value="">Select Invoice</option>
                                            <option>AINV-2026-07-0034687</option>
                                            <option>AINV-2026-07-0034686</option>
                                            <option>AINV-2026-07-0034310</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={lbl}>Status <span style={{ color: '#dc3545' }}>*</span></label>
                                        <select value={inv.status} onChange={e => updateInvoice(cblock.id, inv.id, 'status', e.target.value)} style={inp}>
                                            <option value="">Select Status</option>
                                            <option>Partial</option>
                                            <option>Full</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={lbl}>Amount <span style={{ color: '#dc3545' }}>*</span></label>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <input type="number" placeholder="Enter Amount" value={inv.amount} onChange={e => updateInvoice(cblock.id, inv.id, 'amount', e.target.value)} style={{ ...inp, flex: 1 }} />
                                            <button onClick={() => removeInvoice(cblock.id, inv.id)}
                                                style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: 4, padding: '0 8px', cursor: 'pointer', fontSize: 14 }}>🗑</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div style={{ textAlign: 'right', paddingRight: 4 }}>
                                <button onClick={() => addInvoice(cblock.id)}
                                    style={{ background: '#0d6efd', color: '#fff', border: 'none', borderRadius: 5, padding: '6px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                                    Add Invoice
                                </button>
                            </div>
                        </div>
                    ))}
                    <div style={{ textAlign: 'right' }}>
                        <button onClick={addCustomer}
                            style={{ background: '#28a745', color: '#fff', border: 'none', borderRadius: 5, padding: '7px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                            Add Customer
                        </button>
                    </div>
                </div>

                {/* Note */}
                <div style={{ marginBottom: 20 }}>
                    <label style={lbl}>Note</label>
                    <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                        style={{ ...inp, resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button onClick={onBack}
                        style={{ background: '#0d6efd', color: '#fff', border: 'none', borderRadius: 5, padding: '8px 24px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                        Back
                    </button>
                    <button onClick={handleSave}
                        style={{ background: '#28a745', color: '#fff', border: 'none', borderRadius: 5, padding: '8px 24px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

function CashCollection() {
    const [view, setView] = useState('list');
    const [rows, setRows] = useState(INITIAL_COLLECTIONS);
    const [expanded, setExpanded] = useState({});
    const [search, setSearch] = useState('');

    const toggleRow = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    const handleApprove = (id) => setRows(prev => prev.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
    const handleDelete = (id) => { if (!window.confirm('Delete this collection record?')) return; setRows(prev => prev.filter(r => r.id !== id)); };

    const handleAddSave = (data) => {
        const newId = Math.max(...rows.map(r => r.id)) + 1;
        setRows(prev => [{
            id: newId, code: `AICA-0${String(newId).padStart(5, '0')}`, ...data,
        }, ...prev]);
        setView('list');
    };

    if (view === 'add') return <AddCollectionForm onBack={() => setView('list')} onSave={handleAddSave} />;

    return (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>
            <div style={{ marginBottom: 16 }}>
                <h2 style={{ color: '#0d6efd', margin: 0 }}>👤 Manage Cash Collection</h2>
                <p style={{ color: '#6c757d', fontSize: 13, margin: '2px 0 0' }}>Detailed collection record</p>
            </div>

            {/* Filter Bar */}
            <div style={{ background: '#fff', borderRadius: 8, padding: '12px 14px', marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                {[
                    { ph: '🔍 Collection Code', w: 150 },
                    { ph: '🔍 MRN or Amount', w: 140 },
                    { ph: 'Deposit From', w: 120, type: 'date' },
                    { ph: 'Deposit To', w: 120, type: 'date' },
                ].map(f => (
                    <input key={f.ph} type={f.type || 'text'} placeholder={f.ph} value={f.ph === '🔍 Collection Code' ? search : ''}
                        onChange={f.ph === '🔍 Collection Code' ? e => setSearch(e.target.value) : undefined}
                        style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 5, fontSize: 12, width: f.w }} />
                ))}
                {[['Payment type', PAYMENT_TYPES], ['Select Officer', OFFICERS.slice(0, 5)], ['Select Office', ['Head Office', 'Dhaka Branch']]].map(([ph, opts]) => (
                    <select key={ph} style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 5, fontSize: 12 }}>
                        <option value="">🔍 {ph}</option>
                        {opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                ))}
                <button style={{ background: '#28a745', color: '#fff', border: 'none', borderRadius: 5, padding: '8px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>✔ Go</button>
                <button onClick={() => setSearch('')} style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: 5, padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>✕ Clear</button>
            </div>

            {/* Table */}
            <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                            <tr style={{ background: '#1a2035', color: '#fff' }}>
                                <th style={{ padding: '11px 10px', width: 30 }}>#</th>
                                <th style={{ padding: '11px 10px', textAlign: 'left', minWidth: 200 }}>Officer | Code</th>
                                <th style={{ padding: '11px 10px', textAlign: 'left', minWidth: 110 }}>Amount | Type</th>
                                <th style={{ padding: '11px 10px', textAlign: 'left', minWidth: 180 }}>Digital/ Bank Name</th>
                                <th style={{ padding: '11px 10px', textAlign: 'left', minWidth: 160 }}>Num / TxnID | Ac Name / NO</th>
                                <th style={{ padding: '11px 10px', textAlign: 'left', minWidth: 160 }}>Received By | Date</th>
                                <th style={{ padding: '11px 10px', textAlign: 'left', width: 80 }}>Status</th>
                                <th style={{ padding: '11px 10px', textAlign: 'left', width: 50 }}>Note</th>
                                <th style={{ padding: '11px 10px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        Action
                                        <button onClick={() => setView('add')}
                                            style={{ background: '#28a745', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontWeight: 700, fontSize: 11 }}>
                                            + Add
                                        </button>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.filter(r => r.code.toLowerCase().includes(search.toLowerCase()) || r.officer.toLowerCase().includes(search.toLowerCase())).map((row, i) => (
                                <React.Fragment key={row.id}>
                                    {/* Main row */}
                                    <tr style={{ borderBottom: '1px solid #eee', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>
                                            <button onClick={() => toggleRow(row.id)}
                                                style={{ background: expanded[row.id] ? '#dc3545' : '#6c757d', color: '#fff', border: 'none', borderRadius: 3, width: 20, height: 20, cursor: 'pointer', fontSize: 14, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {expanded[row.id] ? '−' : '+'}
                                            </button>
                                        </td>
                                        <td style={{ padding: '10px' }}>
                                            <div style={{ fontWeight: 600, color: '#1a2035' }}>{row.officer}</div>
                                            <div style={{ color: '#0d6efd', fontSize: 11 }}>{row.code}</div>
                                        </td>
                                        <td style={{ padding: '10px' }}>
                                            <div style={{ fontWeight: 700 }}>{row.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                                            <span style={{ background: '#28a745', color: '#fff', fontSize: 10, padding: '2px 7px', borderRadius: 3, fontWeight: 700 }}>{row.type}</span>
                                        </td>
                                        <td style={{ padding: '10px', fontSize: 11, color: '#555' }}>{row.bankName}</td>
                                        <td style={{ padding: '10px', fontSize: 11 }}>
                                            <div style={{ color: '#555', whiteSpace: 'pre-line' }}>{row.txnId}</div>
                                        </td>
                                        <td style={{ padding: '10px', fontSize: 11 }}>
                                            <div>{row.receivedDate}</div>
                                            <div style={{ color: '#888' }}>{row.receivedBy}</div>
                                        </td>
                                        <td style={{ padding: '10px' }}>
                                            <span style={{ background: row.status === 'Approved' ? '#28a745' : '#0dcaf0', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px' }}></td>
                                        <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>
                                            {row.status !== 'Approved' && (<>
                                                <button title="Edit" style={{ background: '#f0932b', color: '#fff', border: 'none', borderRadius: 3, width: 26, height: 26, cursor: 'pointer', fontSize: 12, margin: '0 2px' }}>✎</button>
                                                <button onClick={() => handleApprove(row.id)} title="Approve"
                                                    style={{ background: '#28a745', color: '#fff', border: 'none', borderRadius: 3, width: 26, height: 26, cursor: 'pointer', fontSize: 12, margin: '0 2px' }}>✓</button>
                                                <button onClick={() => handleDelete(row.id)} title="Delete"
                                                    style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: 3, width: 26, height: 26, cursor: 'pointer', fontSize: 12, margin: '0 2px' }}>🗑</button>
                                            </>)}
                                        </td>
                                    </tr>

                                    {/* Expanded sub-rows */}
                                    {expanded[row.id] && row.customers.length > 0 && (
                                        <tr>
                                            <td></td>
                                            <td colSpan={8} style={{ padding: '0 0 10px 20px', background: '#f0f4ff' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                                    <thead>
                                                        <tr style={{ background: '#2d3a5a', color: '#cdd' }}>
                                                            {['#', 'Customer', 'Address', 'Money Receive Number', 'Date', 'Invoice', 'Amount'].map(h => (
                                                                <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>{h}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {row.customers.map(c => (
                                                            <tr key={c.id} style={{ borderBottom: '1px solid #dde4ff' }}>
                                                                <td style={{ padding: '8px 10px' }}>{c.id}</td>
                                                                <td style={{ padding: '8px 10px', whiteSpace: 'pre-line', fontSize: 11 }}>{c.name}</td>
                                                                <td style={{ padding: '8px 10px', fontSize: 11, whiteSpace: 'pre-line', color: '#555' }}>{c.address}</td>
                                                                <td style={{ padding: '8px 10px' }}>{c.mrn}</td>
                                                                <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{c.date}</td>
                                                                <td style={{ padding: '8px 10px', fontSize: 11, color: '#0d6efd' }}>
                                                                    {c.invoice && c.invoice.split(',').map((inv, idx) => (
                                                                        <div key={idx}>{inv.trim()} <span style={{ background: '#0dcaf0', color: '#fff', fontSize: 9, padding: '1px 5px', borderRadius: 3, marginLeft: 4 }}>Partial</span></div>
                                                                    ))}
                                                                </td>
                                                                <td style={{ padding: '8px 10px', fontWeight: 600 }}>{c.amount.toFixed(2)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    )}
                                    {expanded[row.id] && row.customers.length === 0 && (
                                        <tr>
                                            <td></td>
                                            <td colSpan={8} style={{ padding: '10px 20px', background: '#f0f4ff', fontSize: 12, color: '#999' }}>
                                                No customer details available.
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div style={{ padding: '10px 14px', color: '#888', fontSize: 12, borderTop: '1px solid #eee' }}>
                    Showing {rows.length} records
                </div>
            </div>
        </div>
    );
}

export default CashCollection;
