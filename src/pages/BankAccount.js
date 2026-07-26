import React, { useState } from 'react';

const thS = { padding: '10px 12px', color: 'white', fontWeight: '600', fontSize: '13px', textAlign: 'left', whiteSpace: 'nowrap' };
const tdS = { padding: '9px 12px', fontSize: '12px', color: '#333', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' };

const initialAccounts = [
    { id: 1, name: 'Agrivision International (Banani BRAC)', number: '10293847560182736', bank: 'BRAC Bank Limited (Banani)', branch: 'Banani' },
    { id: 2, name: 'Agrivision International (C C)', number: '15872093641250', bank: 'City Bank PLC', branch: 'Dhaka' },
    { id: 3, name: 'Agrivision International (Gulshan SME)', number: '20481956370029', bank: 'Bank Asia Limited (Gulshan)', branch: 'Gulshan' },
    { id: 4, name: 'Md. Shafirul Islam', number: '30561278094411', bank: 'Prime Bank Limited (Personal)', branch: 'Banani' },
    { id: 5, name: 'Agrivision International (DBBL)', number: '40297183650074', bank: 'Dutch-Bangla Bank (Dhaka)', branch: 'Dhaka' },
];

const bankOptions = ['BRAC Bank Limited', 'City Bank PLC', 'Bank Asia Limited', 'Prime Bank Limited', 'Dutch-Bangla Bank', 'Eastern Bank PLC'];

function AddForm({ onBack }) {
    const [form, setForm] = useState({ name: '', number: '', bank: '', branch: '' });
    const inp = { width: '100%', padding: '9px 12px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' };
    const lbl = { fontSize: '13px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '5px' };

    return (
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                Add Bank Account
            </div>
            <div style={{ padding: '24px 32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>
                    <div>
                        <label style={lbl}>Account Name <span style={{ color: '#dc3545' }}>*</span></label>
                        <input placeholder="Enter Account Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={inp} />
                    </div>
                    <div>
                        <label style={lbl}>Account Number <span style={{ color: '#dc3545' }}>*</span></label>
                        <input placeholder="Enter Account Number" value={form.number} onChange={e => setForm(p => ({ ...p, number: e.target.value }))} style={inp} />
                    </div>
                    <div>
                        <label style={lbl}>Bank Name <span style={{ color: '#dc3545' }}>*</span></label>
                        <select value={form.bank} onChange={e => setForm(p => ({ ...p, bank: e.target.value }))} style={inp}>
                            <option value="">Select Bank</option>
                            {bankOptions.map(b => <option key={b}>{b}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Branch <span style={{ color: '#dc3545' }}>*</span></label>
                        <input placeholder="Enter Branch" value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))} style={inp} />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={onBack} style={{ padding: '8px 24px', background: '#0d6efd', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Back</button>
                    <button style={{ padding: '8px 24px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Save</button>
                </div>
            </div>
        </div>
    );
}

function BankAccount() {
    const [view, setView] = useState('list');
    const [accounts] = useState(initialAccounts);

    if (view === 'add') return <AddForm onBack={() => setView('list')} />;

    return (
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                &gt; Bank Account
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#1a2035' }}>
                            <th style={{ ...thS, width: '50px' }}>ID</th>
                            <th style={thS}>Account Name</th>
                            <th style={thS}>Account Number</th>
                            <th style={thS}>Bank Name</th>
                            <th style={thS}>Branch</th>
                            <th style={{ ...thS, textAlign: 'right' }}>
                                Action&nbsp;
                                <button onClick={() => setView('add')} style={{ padding: '3px 10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>🌿 Add</button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {accounts.map((a, i) => (
                            <tr key={a.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                <td style={{ ...tdS, textAlign: 'center' }}>{a.id}</td>
                                <td style={{ ...tdS, fontWeight: '600', color: '#1a2035' }}>{a.name}</td>
                                <td style={tdS}>{a.number}</td>
                                <td style={tdS}>{a.bank}</td>
                                <td style={tdS}>{a.branch}</td>
                                <td style={{ ...tdS, textAlign: 'right' }}>
                                    <button title="Edit" onClick={() => setView('add')} style={{ padding: '4px 10px', background: '#4e73df', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>✎</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default BankAccount;
