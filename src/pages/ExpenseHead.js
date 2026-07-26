import React, { useState } from 'react';

const thS = { padding: '10px 12px', color: 'white', fontWeight: '600', fontSize: '13px', textAlign: 'left' };
const tdS = { padding: '9px 12px', fontSize: '13px', color: '#333', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' };

const initialHeads = [
    'Advance Expense', 'Bank Charge', 'Boundary Update Expense', 'Bus Delivery Expense',
    'Campaign Expense', 'Car Expense', 'Cable Expense', 'Courier Expense',
    'Electricity Bill', 'Entertainment Expense', 'Fuel Expense', 'Internet Bill',
    'Labour Cost', 'Labour Delivery Expense', 'Labour Breakfast', 'Meeting Expense',
    'Manager Expense', 'Office Expense', 'Office Rent', 'Printing Expense',
    'Rent Expense', 'Salary Expense', 'Stationery Expense', 'Travel Allowance',
].map((name, i) => ({ id: i + 1, name }));

function AddForm({ onBack }) {
    const [name, setName] = useState('');
    const inp = { width: '100%', padding: '9px 12px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' };

    return (
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                Add Expense Head
            </div>
            <div style={{ padding: '24px 32px' }}>
                <div style={{ marginBottom: '20px', maxWidth: '400px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '5px' }}>Expense Head Name <span style={{ color: '#dc3545' }}>*</span></label>
                    <input placeholder="Enter Expense Head" value={name} onChange={e => setName(e.target.value)} style={inp} />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button style={{ padding: '8px 24px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Save</button>
                    <button onClick={onBack} style={{ padding: '8px 24px', background: '#0d6efd', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Back</button>
                </div>
            </div>
        </div>
    );
}

function ExpenseHead() {
    const [view, setView] = useState('list');
    const [heads] = useState(initialHeads);

    if (view === 'add') return <AddForm onBack={() => setView('list')} />;

    return (
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                &gt; Expense Head
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#1a2035' }}>
                            <th style={{ ...thS, width: '60px' }}>#</th>
                            <th style={thS}>Name</th>
                            <th style={{ ...thS, textAlign: 'right' }}>
                                Action&nbsp;
                                <button onClick={() => setView('add')} style={{ padding: '3px 10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>🌿 Add</button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {heads.map((h, i) => (
                            <tr key={h.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                <td style={{ ...tdS, textAlign: 'center' }}>{h.id}</td>
                                <td style={{ ...tdS, fontWeight: '500' }}>{h.name}</td>
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

export default ExpenseHead;
