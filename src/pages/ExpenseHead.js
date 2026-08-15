import React, { useState, useCallback } from 'react';
import {
    listExpenseHeads, createExpenseHead, updateExpenseHead, deactivateExpenseHead,
} from '../services';
import { Notice, useFlash, useCollection } from '../components/Notice';

// Expense head master, backed by Firestore.
//
// First of the fourteen screens in SCREEN-AUDIT.md §2.1 whose Save button had
// no handler. The 24 heads that used to be a module-level const are gone; the
// list is whatever is in `expense_heads`. The shape to copy is Product.js.

const thS = { padding: '10px 12px', color: 'white', fontWeight: '600', fontSize: '13px', textAlign: 'left' };
const tdS = { padding: '9px 12px', fontSize: '13px', color: '#333', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' };
const inp = { width: '100%', padding: '9px 12px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' };

// `editing` is null for a new head, or the row being renamed.
function AddForm({ editing, busy, onBack, onSave }) {
    const [name, setName] = useState(editing ? editing.name : '');
    const ready = Boolean(name.trim()) && !busy;

    return (
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                {editing ? 'Rename Expense Head' : 'Add Expense Head'}
            </div>
            <div style={{ padding: '24px 32px' }}>
                <div style={{ marginBottom: '20px', maxWidth: '400px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '5px' }}>Expense Head Name <span style={{ color: '#dc3545' }}>*</span></label>
                    <input placeholder="Enter Expense Head" value={name} autoFocus
                        onChange={e => setName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && ready) onSave(name.trim()); }}
                        style={inp} />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => onSave(name.trim())} disabled={!ready}
                        style={{ padding: '8px 24px', background: ready ? '#28a745' : '#adb5bd', color: 'white', border: 'none', borderRadius: '6px', cursor: ready ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: '600' }}>
                        {busy ? 'Saving…' : 'Save'}
                    </button>
                    <button onClick={onBack} style={{ padding: '8px 24px', background: '#0d6efd', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Back</button>
                </div>
            </div>
        </div>
    );
}

function ExpenseHead() {
    const [view, setView] = useState('list');
    const [editing, setEditing] = useState(null);

    // status: null → deactivated heads stay visible, so a head referenced by an
    // old expense can still be found here.
    const load = useCallback(() => listExpenseHeads({ status: null }), []);
    const { rows: heads, loading, error, reload } = useCollection(load, { what: 'expense heads' });
    const { flash, say, busy, run } = useFlash();

    const handleSave = (name) => run(async () => {
        if (editing) {
            await updateExpenseHead(editing.id, { name });
            say('ok', `Renamed to "${name}".`);
        } else {
            await createExpenseHead({ name });
            say('ok', `Expense head "${name}" saved.`);
        }
        setEditing(null);
        setView('list');
        await reload();
    });

    const handleDeactivate = (h) => {
        if (!window.confirm(`Deactivate "${h.name}"? Existing expenses keep it; it stops being offered on new ones.`)) return;
        run(async () => {
            await deactivateExpenseHead(h.id, 'Deactivated from the expense head master');
            say('ok', `"${h.name}" deactivated.`);
            await reload();
        });
    };

    // The notices sit outside the view switch: a save that fails leaves you on
    // the form, and that is exactly when you need to be told why.
    const notices = (
        <>
            {loading && view === 'list' && <Notice tone="info">Loading expense heads…</Notice>}
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
                    &gt; Expense Head <span style={{ fontWeight: 400, color: '#6c757d' }}>({heads.length})</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#1a2035' }}>
                                <th style={{ ...thS, width: '60px' }}>#</th>
                                <th style={thS}>Name</th>
                                <th style={{ ...thS, width: '110px' }}>Status</th>
                                <th style={{ ...thS, textAlign: 'right' }}>
                                    Action&nbsp;
                                    <button onClick={() => { setEditing(null); setView('add'); }} style={{ padding: '3px 10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>🌿 Add</button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {heads.map((h, i) => (
                                <tr key={h.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa', opacity: h.status === 'Active' ? 1 : 0.55 }}>
                                    <td style={{ ...tdS, textAlign: 'center' }}>{i + 1}</td>
                                    <td style={{ ...tdS, fontWeight: '500' }}>{h.name}</td>
                                    <td style={tdS}>
                                        <span style={{
                                            backgroundColor: h.status === 'Active' ? '#d4edda' : '#f8d7da',
                                            color: h.status === 'Active' ? '#155724' : '#721c24',
                                            padding: '3px 10px', borderRadius: 20, fontSize: 12,
                                        }}>{h.status}</span>
                                    </td>
                                    <td style={{ ...tdS, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                        <button title="Rename" disabled={busy} onClick={() => { setEditing(h); setView('add'); }} style={{ padding: '4px 10px', background: '#4e73df', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>✎</button>
                                        {h.status === 'Active' && (
                                            <button title="Deactivate" disabled={busy} onClick={() => handleDeactivate(h)} style={{ padding: '4px 10px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', marginLeft: '5px' }}>✕</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {!loading && heads.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#adb5bd', padding: 24, fontSize: 13 }}>
                        No expense heads yet. Press <strong>Add</strong> to create the first one.
                    </p>
                )}
            </div>
        </div>
    );
}

export default ExpenseHead;
