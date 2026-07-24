import React, { useState } from 'react';

const today = new Date().toISOString().split('T')[0];
const thS = { padding: '10px 12px', color: 'white', fontWeight: '600', fontSize: '13px', textAlign: 'left' };
const tdS = { padding: '9px 12px', fontSize: '12px', color: '#333', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' };

const Badge = ({ color, children }) => (
    <span style={{ background: color, color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>{children}</span>
);

const initialRecords = [
    { id: 1, name: 'M/s- Sukmar', code: 'AIC-000923', type: 'Credit', amount: '60,000.00', date: '26-02-2025', status: 'Approved', note: 'Motorcycle Advance', posting: 'Md. Abdul Mohaimenum\n26-02-2025 12:43PM' },
    { id: 2, name: 'M/s- Ariful Islam Traders', code: 'AIC-000988', type: 'Credit', amount: '20,000.00', date: '26-02-2025', status: 'Approved', note: '', posting: 'Md. Abdul Mohaimenum\n26-02-2025 12:40PM' },
    { id: 3, name: 'M/s-Rafikul Traders', code: 'AIC-000595', type: 'Credit', amount: '50,000.00', date: '26-02-2025', status: 'Approved', note: 'Motorcycle Advance', posting: 'Md. Abdul Mohaimenum\n26-02-2025 12:37PM' },
    { id: 4, name: 'China Agro Ltd', code: 'AIC-000484', type: 'Credit', amount: '39,00,172.00', date: '01-02-2024', status: 'Approved', note: '', posting: 'Md. Abdul Mohaimenum\n03-10-2024 17:17PM' },
    { id: 5, name: 'M/s-Joynal Abedin Traders', code: 'AIC-000594', type: 'Credit', amount: '40,000.00', date: '01-02-2024', status: 'Approved', note: 'Motorcycle Advance', posting: 'Md. Abdul Mohaimenum\n20-08-2024 16:13PM' },
    { id: 6, name: 'M/s- Arif Billah Traders', code: 'AIC-000644', type: 'Credit', amount: '4,500.00', date: '01-02-2024', status: 'Approved', note: '', posting: 'Md. Abdul Mohaimenum\n20-08-2024 16:12PM' },
    { id: 7, name: 'M/s- Dui Bhai Traders', code: 'AIC-000671', type: 'Credit', amount: '500.00', date: '01-02-2024', status: 'Approved', note: '', posting: 'Md. Abdul Mohaimenum\n20-08-2024 16:10PM' },
    { id: 8, name: 'M/s- Safirul Islam Traders', code: 'AIC-000598', type: 'Credit', amount: '98,29,900.00', date: '01-06-2024', status: 'Approved', note: 'Lc Back money 2023 December', posting: 'Md. Abdul Mohaimenum\n20-08-2024 16:05PM' },
    { id: 9, name: 'M/s- Abdus Safi Traders', code: 'AIC-000596', type: 'Credit', amount: '78,000.00', date: '22-02-2024', status: 'Approved', note: 'Motorcycle Payment', posting: 'Md. Rakib Hasan\n04-05-2024 17:41PM' },
    { id: 10, name: 'M/s- Tens Agro Ltd', code: 'AIC-000487', type: 'Credit', amount: '12,11,742.00', date: '01-02-2024', status: 'Approved', note: '', posting: 'Md. Abdul Mohaimenum\n07-03-2024 15:30PM' },
    { id: 11, name: 'Fasol Agro Industrial', code: 'AIC-000583', type: 'Credit', amount: '4,56,600.00', date: '01-02-2024', status: 'Approved', note: '31/01/24 invoice no 2186', posting: 'Md. Abdul Mohaimenum\n26-02-2024 14:01PM' },
    { id: 12, name: 'M/s- Towha traders', code: 'AIC-000542', type: 'Credit', amount: '10,975.00', date: '01-02-2024', status: 'Approved', note: '', posting: 'Md. Abdul Mohaimenum\n11-02-2024 18:16PM' },
    { id: 13, name: 'M/s- Al Hamas Traders', code: 'AIC-000541', type: 'Credit', amount: '32,412.00', date: '01-02-2024', status: 'Approved', note: '', posting: 'Md. Abdul Mohaimenum\n11-02-2024 18:15PM' },
    { id: 14, name: 'M/s- Bhai Bhai Traders', code: 'AIC-000540', type: 'Credit', amount: '12,061.00', date: '01-02-2024', status: 'Approved', note: '', posting: 'Md. Abdul Mohaimenum\n11-02-2024 18:15PM' },
    { id: 15, name: 'M/s- Nazmul Traders', code: 'AIC-000539', type: 'Credit', amount: '22,987.00', date: '01-02-2024', status: 'Approved', note: '', posting: 'Md. Abdul Mohaimenum\n11-02-2024 18:15PM' },
    { id: 16, name: 'M/s- Imran Ali Noyon', code: 'AIC-000538', type: 'Credit', amount: '12,810.00', date: '01-02-2024', status: 'Approved', note: '', posting: 'Md. Abdul Mohaimenum\n11-02-2024 18:14PM' },
    { id: 17, name: 'M/s- Maharin Traders', code: 'AIC-000537', type: 'Credit', amount: '20,952.00', date: '01-02-2024', status: 'Approved', note: '', posting: 'Md. Abdul Mohaimenum\n11-02-2024 18:14PM' },
    { id: 18, name: 'M/s- Mondol Traders', code: 'AIC-000536', type: 'Credit', amount: '6,044.00', date: '01-02-2024', status: 'Approved', note: '', posting: 'Md. Abdul Mohaimenum\n11-02-2024 18:13PM' },
    { id: 19, name: 'M/s- Hasinur Traders', code: 'AIC-000535', type: 'Credit', amount: '7,248.00', date: '01-02-2024', status: 'Approved', note: '', posting: 'Md. Abdul Mohaimenum\n11-02-2024 18:13PM' },
    { id: 20, name: 'M/S Bhai Bhai Traders', code: 'AIC-000534', type: 'Credit', amount: '7,400.00', date: '01-02-2024', status: 'Approved', note: '', posting: 'Md. Abdul Mohaimenum\n11-02-2024 18:12PM' },
    { id: 21, name: 'M/S Bhai Bhai Traders', code: 'AIC-000533', type: 'Credit', amount: '11,728.00', date: '01-02-2024', status: 'Approved', note: '', posting: 'Md. Abdul Mohaimenum\n11-02-2024 18:12PM' },
];

const customerOptions = ['M/s- Sukmar', 'M/s- Ariful Islam Traders', 'M/s-Rafikul Traders', 'China Agro Ltd', 'Fasol Agro Industrial', 'M/s- Towha traders'];
const paymentTypes = ['Cash', 'bKash', 'Nagad', 'Bank Transfer', 'Cheque'];

function AddForm({ onBack }) {
    const [form, setForm] = useState({ customer: '', paymentType: '', amount: '', date: today, note: '' });
    const inp = { width: '100%', padding: '9px 12px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' };

    return (
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                Add Customer Opening Balance
            </div>
            <div style={{ padding: '24px 32px' }}>
                {/* 4-column top row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '5px' }}>Customer <span style={{ color: '#dc3545' }}>*</span></label>
                        <select value={form.customer} onChange={e => setForm(p => ({ ...p, customer: e.target.value }))} style={inp}>
                            <option value="">Select Customer</option>
                            {customerOptions.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '5px' }}>Payment Type <span style={{ color: '#dc3545' }}>*</span></label>
                        <select value={form.paymentType} onChange={e => setForm(p => ({ ...p, paymentType: e.target.value }))} style={inp}>
                            <option value="">🔍 Please select</option>
                            {paymentTypes.map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '5px' }}>Amount <span style={{ color: '#dc3545' }}>*</span></label>
                        <input placeholder="Enter Amount" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} style={inp} />
                    </div>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '5px' }}>Date <span style={{ color: '#dc3545' }}>*</span></label>
                        <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={{ ...inp, background: '#f8f9fa' }} />
                    </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '5px' }}>Note</label>
                    <textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                        style={{ ...inp, height: '80px', resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={onBack} style={{ padding: '8px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Back</button>
                    <button style={{ padding: '8px 24px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Save</button>
                </div>
            </div>
        </div>
    );
}

function CustomerOpeningBalance() {
    const [view, setView] = useState('list');
    const [records] = useState(initialRecords);

    if (view === 'add') return <AddForm onBack={() => setView('list')} />;

    return (
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                &gt; Customer Opening Balance
            </div>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input placeholder="Search" style={{ padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', width: '160px' }} />
                <input type="date" style={{ padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px' }} />
                <button style={{ padding: '7px 18px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Go</button>
                <button style={{ padding: '7px 18px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Clear</button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#1a2035' }}>
                            <th style={{ ...thS, width: '40px', textAlign: 'center' }}>#</th>
                            <th style={thS}>Name</th>
                            <th style={thS}>Type</th>
                            <th style={{ ...thS, textAlign: 'right' }}>Amount</th>
                            <th style={thS}>Date</th>
                            <th style={thS}>Status</th>
                            <th style={thS}>Note</th>
                            <th style={thS}>Posting</th>
                            <th style={{ ...thS, textAlign: 'right' }}>
                                Action&nbsp;
                                <button onClick={() => setView('add')} style={{ padding: '3px 10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>🌿 Add</button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((r, i) => (
                            <tr key={r.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                <td style={{ ...tdS, textAlign: 'center' }}>{i + 1}</td>
                                <td style={tdS}>
                                    <div style={{ fontWeight: '600', color: '#1a2035' }}>{r.name}</div>
                                    <div style={{ color: '#6c757d', fontSize: '11px' }}>[{r.code}]</div>
                                </td>
                                <td style={tdS}><Badge color="#28a745">{r.type}</Badge></td>
                                <td style={{ ...tdS, textAlign: 'right', fontWeight: '600' }}>{r.amount}</td>
                                <td style={tdS}>{r.date}</td>
                                <td style={tdS}><Badge color="#28a745">{r.status}</Badge></td>
                                <td style={{ ...tdS, fontSize: '11px', maxWidth: '150px' }}>{r.note}</td>
                                <td style={{ ...tdS, fontSize: '11px', color: '#6c757d', whiteSpace: 'pre-line' }}>{r.posting}</td>
                                <td style={tdS}></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default CustomerOpeningBalance;
