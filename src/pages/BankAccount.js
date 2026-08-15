import React, { useState, useCallback } from 'react';
import {
    listBankAccounts, createBankAccount, updateBankAccount, deactivateBankAccount,
} from '../services';
import { Notice, useFlash, useCollection } from '../components/Notice';

// The company's bank accounts, backed by Firestore.
//
// Second of the fourteen screens in SCREEN-AUDIT.md §2.1. The five accounts
// that used to be a module-level const are gone.
//
// `bankOptions` below stays a hardcoded list: it is the set of banks operating
// in the country, not master data this business owns, and the schema defines no
// `banks` collection. It is not one of the hardcoded master arrays §4.2 objects
// to — those are products, customers and employees, which do have collections.

const thS = { padding: '10px 12px', color: 'white', fontWeight: '600', fontSize: '13px', textAlign: 'left', whiteSpace: 'nowrap' };
const tdS = { padding: '9px 12px', fontSize: '12px', color: '#333', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' };
const inp = { width: '100%', padding: '9px 12px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' };
const lbl = { fontSize: '13px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '5px' };

const bankOptions = ['BRAC Bank Limited', 'City Bank PLC', 'Bank Asia Limited', 'Prime Bank Limited', 'Dutch-Bangla Bank', 'Eastern Bank PLC'];

const EMPTY = { name: '', number: '', bank: '', branch: '' };

function AddForm({ editing, busy, onBack, onSave }) {
    const [form, setForm] = useState(editing
        ? { name: editing.name, number: editing.number, bank: editing.bank, branch: editing.branch }
        : EMPTY);

    const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
    const ready = Boolean(form.name.trim() && form.number.trim() && form.bank && form.branch.trim()) && !busy;

    return (
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                {editing ? 'Edit Bank Account' : 'Add Bank Account'}
            </div>
            <div style={{ padding: '24px 32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>
                    <div>
                        <label style={lbl}>Account Name <span style={{ color: '#dc3545' }}>*</span></label>
                        <input placeholder="Enter Account Name" value={form.name} onChange={set('name')} style={inp} />
                    </div>
                    <div>
                        <label style={lbl}>Account Number <span style={{ color: '#dc3545' }}>*</span></label>
                        <input placeholder="Enter Account Number" value={form.number} onChange={set('number')} style={inp} />
                    </div>
                    <div>
                        <label style={lbl}>Bank Name <span style={{ color: '#dc3545' }}>*</span></label>
                        <select value={form.bank} onChange={set('bank')} style={inp}>
                            <option value="">Select Bank</option>
                            {bankOptions.map(b => <option key={b}>{b}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Branch <span style={{ color: '#dc3545' }}>*</span></label>
                        <input placeholder="Enter Branch" value={form.branch} onChange={set('branch')} style={inp} />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={onBack} style={{ padding: '8px 24px', background: '#0d6efd', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Back</button>
                    <button onClick={() => onSave(form)} disabled={!ready}
                        style={{ padding: '8px 24px', background: ready ? '#28a745' : '#adb5bd', color: 'white', border: 'none', borderRadius: '6px', cursor: ready ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: '600' }}>
                        {busy ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function BankAccount() {
    const [view, setView] = useState('list');
    const [editing, setEditing] = useState(null);

    // status: null → a closed account stays visible; a payment made from it last
    // month must still resolve.
    const load = useCallback(() => listBankAccounts({ status: null }), []);
    const { rows: accounts, loading, error, reload } = useCollection(load, { what: 'bank accounts' });
    const { flash, say, busy, run } = useFlash();

    const handleSave = (form) => run(async () => {
        if (editing) {
            await updateBankAccount(editing.id, form);
            say('ok', `"${form.name}" updated.`);
        } else {
            await createBankAccount(form);
            say('ok', `Bank account "${form.name}" saved.`);
        }
        setEditing(null);
        setView('list');
        await reload();
    });

    const handleDeactivate = (a) => {
        if (!window.confirm(`Close "${a.name}"? Past payments keep it; it stops being offered on new ones.`)) return;
        run(async () => {
            await deactivateBankAccount(a.id, 'Closed from the bank account master');
            say('ok', `"${a.name}" closed.`);
            await reload();
        });
    };

    const notices = (
        <>
            {loading && view === 'list' && <Notice tone="info">Loading bank accounts…</Notice>}
            {error && <Notice tone="warn">{error}</Notice>}
            {flash && <Notice tone={flash.tone}>{flash.text}</Notice>}
        </>
    );

    if (view === 'add') {
        return (
            <div>
                {notices}
                <AddForm
                    key={editing ? editing.id : 'new'}
                    editing={editing}
                    busy={busy}
                    onBack={() => { setEditing(null); setView('list'); }}
                    onSave={handleSave}
                />
            </div>
        );
    }

    return (
        <div>
            {notices}

            <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                    &gt; Bank Account <span style={{ fontWeight: 400, color: '#6c757d' }}>({accounts.length})</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#1a2035' }}>
                                <th style={{ ...thS, width: '50px' }}>#</th>
                                <th style={thS}>Account Name</th>
                                <th style={thS}>Account Number</th>
                                <th style={thS}>Bank Name</th>
                                <th style={thS}>Branch</th>
                                <th style={{ ...thS, width: '100px' }}>Status</th>
                                <th style={{ ...thS, textAlign: 'right' }}>
                                    Action&nbsp;
                                    <button onClick={() => { setEditing(null); setView('add'); }} style={{ padding: '3px 10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>🌿 Add</button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map((a, i) => (
                                <tr key={a.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa', opacity: a.status === 'Active' ? 1 : 0.55 }}>
                                    <td style={{ ...tdS, textAlign: 'center' }}>{i + 1}</td>
                                    <td style={{ ...tdS, fontWeight: '600', color: '#1a2035' }}>{a.name}</td>
                                    <td style={tdS}>{a.number}</td>
                                    <td style={tdS}>{a.bank}</td>
                                    <td style={tdS}>{a.branch}</td>
                                    <td style={tdS}>
                                        <span style={{
                                            backgroundColor: a.status === 'Active' ? '#d4edda' : '#f8d7da',
                                            color: a.status === 'Active' ? '#155724' : '#721c24',
                                            padding: '3px 10px', borderRadius: 20, fontSize: 12,
                                        }}>{a.status === 'Active' ? 'Active' : 'Closed'}</span>
                                    </td>
                                    <td style={{ ...tdS, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                        <button title="Edit" disabled={busy} onClick={() => { setEditing(a); setView('add'); }} style={{ padding: '4px 10px', background: '#4e73df', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>✎</button>
                                        {a.status === 'Active' && (
                                            <button title="Close account" disabled={busy} onClick={() => handleDeactivate(a)} style={{ padding: '4px 10px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', marginLeft: '5px' }}>✕</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {!loading && accounts.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#adb5bd', padding: 24, fontSize: 13 }}>
                        No bank accounts yet. Press <strong>Add</strong> to create the first one.
                    </p>
                )}
            </div>
        </div>
    );
}

export default BankAccount;
