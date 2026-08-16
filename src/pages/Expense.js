import React, { useState, useEffect, useCallback } from 'react';
import {
    listExpenses, createExpense, updateExpense, approveExpense, cancelExpense,
    expenseHeadOptions, listUsers, formatDate, EXPENSE_TYPE,
} from '../services';
import { Notice, useFlash, useCollection } from '../components/Notice';

// Expenses, backed by Firestore.
//
// Tenth of the fourteen screens in SCREEN-AUDIT.md §2.1, and the reason
// §2.1.1 puts Expense Head in group A and this in group C: the head selector
// was a hardcoded twelve-name array with nothing behind it, so an expense could
// not reference a real head and Head Wise Expense could never be built.
//
// "Received By" was three hardcoded names; it reads the `users` collection.
//
// Approve and delete already worked on local state and were lost on refresh.
// Both go through the service layer now, and delete cancels rather than
// removing — an approved expense is part of the month's figures.

const thS = { padding: '10px 12px', color: 'white', fontWeight: '600', fontSize: '13px', textAlign: 'left', whiteSpace: 'nowrap' };
const tdS = { padding: '9px 12px', fontSize: '12px', color: '#333', borderBottom: '1px solid #f0f0f0', verticalAlign: 'top' };
const inp = { width: '100%', padding: '9px 12px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' };

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = formatDate(new Date());

const Badge = ({ color, children }) => (
    <span style={{ background: color, color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '600', display: 'inline-block' }}>{children}</span>
);

const IBtn = ({ bg, onClick, title, children, disabled }) => (
    <button onClick={onClick} title={title} disabled={disabled}
        style={{ padding: '4px 8px', background: disabled ? '#adb5bd' : bg, color: 'white', border: 'none', borderRadius: '4px', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '13px', marginRight: '3px' }}>{children}</button>
);

const statusColour = (s) => ({ Approved: '#28a745', Pending: '#fd7e14', Cancelled: '#dc3545' }[s] || '#6c757d');

const EMPTY = { type: 'Expense', headId: '', receivedById: '', date: today, amount: '', note: '' };

function AddForm({ editing, heads, people, busy, onBack, onSave }) {
    const [form, setForm] = useState(editing
        ? {
            type: editing.type, headId: editing.headId, receivedById: editing.receivedById || '',
            date: formatDate(editing.date), amount: editing.amount, note: editing.note || '',
        }
        : EMPTY);
    const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
    const row = { display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'flex-start' };
    const lbl = { width: '150px', flexShrink: 0, fontWeight: '600', fontSize: '13px', color: '#495057', paddingTop: '10px' };
    const ready = Boolean(form.type && form.headId && form.date && Number(form.amount) > 0) && !busy;

    return (
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                &gt; {editing ? `Edit Transaction — ${editing.code}` : 'Add Transaction'}
            </div>
            <div style={{ padding: '24px 32px', maxWidth: '800px' }}>
                <div style={row}>
                    <span style={lbl}>Type <span style={{ color: '#dc3545' }}>*</span></span>
                    <select value={form.type} onChange={set('type')} style={inp}>
                        {EXPENSE_TYPE.map(t => <option key={t}>{t}</option>)}
                    </select>
                </div>
                <div style={row}>
                    <span style={lbl}>Expense Head <span style={{ color: '#dc3545' }}>*</span></span>
                    <div style={{ flex: 1 }}>
                        <select value={form.headId} onChange={set('headId')} style={inp}>
                            <option value="">Select Expense Head</option>
                            {heads.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                        </select>
                        {heads.length === 0 && (
                            <div style={{ fontSize: '12px', color: '#856404', marginTop: '5px' }}>
                                No expense heads recorded yet — add one on the Expense Head screen first.
                            </div>
                        )}
                    </div>
                </div>
                <div style={row}>
                    <span style={lbl}>Received By</span>
                    <select value={form.receivedById} onChange={set('receivedById')} style={inp}>
                        <option value="">Select Officer</option>
                        {people.map(p => <option key={p.id} value={p.id}>{p.name} — {p.role}</option>)}
                    </select>
                </div>
                <div style={row}>
                    <span style={lbl}>Date <span style={{ color: '#dc3545' }}>*</span></span>
                    <input type="date" value={form.date} onChange={set('date')} style={{ ...inp, background: '#f8f9fa' }} />
                </div>
                <div style={row}>
                    <span style={lbl}>Amount <span style={{ color: '#dc3545' }}>*</span></span>
                    <input type="number" step="0.01" min="0" placeholder="Enter Amount" value={form.amount} onChange={set('amount')} style={inp} />
                </div>
                <div style={row}>
                    <span style={lbl}>Note</span>
                    <textarea value={form.note} onChange={set('note')} style={{ ...inp, height: '70px', resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', gap: '10px', paddingLeft: '166px' }}>
                    <button onClick={() => onSave(form)} disabled={!ready}
                        style={{ padding: '8px 24px', background: ready ? '#28a745' : '#adb5bd', color: 'white', border: 'none', borderRadius: '6px', cursor: ready ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: '600' }}>
                        {busy ? 'Saving…' : 'Save'}
                    </button>
                    <button onClick={onBack} style={{ padding: '8px 24px', background: '#0d6efd', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Go Back</button>
                </div>
            </div>
        </div>
    );
}

const emptyF = { search: '', date: '', status: '' };

function Expense() {
    const [view, setView] = useState('list');
    const [editing, setEditing] = useState(null);
    const [open, setOpen] = useState(true);
    const [draft, setDraft] = useState(emptyF);
    const [applied, setApplied] = useState(emptyF);
    const [heads, setHeads] = useState([]);
    const [people, setPeople] = useState([]);

    const load = useCallback(() => listExpenses(), []);
    const { rows: expenses, loading, error, reload } = useCollection(load, { what: 'expenses' });
    const { flash, say, busy, run } = useFlash();

    useEffect(() => {
        expenseHeadOptions().then(setHeads).catch(() => setHeads([]));
        listUsers({ status: 'Active' }).then(setPeople).catch(() => setPeople([]));
    }, []);

    const handleGo = () => setApplied(draft);
    const handleClear = () => { setDraft(emptyF); setApplied(emptyF); };

    const handleSave = (form) => run(async () => {
        if (editing) {
            await updateExpense(editing.code, form);
            say('ok', `${editing.code} updated.`);
        } else {
            const saved = await createExpense(form);
            say('ok', `${saved.type} ${saved.code} (${saved.voucherNo}) saved as Pending.`);
        }
        setEditing(null);
        setView('list');
        await reload();
    });

    const handleApprove = (e) => run(async () => {
        await approveExpense(e.code);
        say('ok', `${e.code} approved.`);
        await reload();
    });

    const handleCancel = (e) => {
        const reason = window.prompt(`Why is ${e.code} (৳ ${fmt(e.amount)}, ${e.headName}) being cancelled?`);
        if (!reason) return;
        run(async () => {
            await cancelExpense(e.code, reason);
            say('ok', `${e.code} cancelled.`);
            await reload();
        });
    };

    const filtered = expenses.filter(e => {
        if (applied.search) {
            const k = applied.search.toLowerCase();
            const hay = `${e.headName || ''} ${e.code} ${e.voucherNo || ''} ${e.receivedByName || ''} ${e.note || ''}`.toLowerCase();
            if (!hay.includes(k)) return false;
        }
        if (applied.date && formatDate(e.date) !== applied.date) return false;
        if (applied.status && e.status !== applied.status) return false;
        return true;
    });

    // Only approved rows count towards the total — a pending expense has not
    // been accepted yet, and a cancelled one never happened.
    const approvedTotal = filtered
        .filter(e => e.status === 'Approved')
        .reduce((s, e) => s + (e.type === 'Income' ? -1 : 1) * Number(e.amount || 0), 0);

    const notices = (
        <>
            {loading && view === 'list' && <Notice tone="info">Loading expenses…</Notice>}
            {error && <Notice tone="warn">{error}</Notice>}
            {flash && <Notice tone={flash.tone}>{flash.text}</Notice>}
        </>
    );

    if (view === 'add') {
        return (
            <div>
                {notices}
                <AddForm key={editing ? editing.code : 'new'} editing={editing}
                    heads={heads} people={people} busy={busy}
                    onBack={() => { setEditing(null); setView('list'); }} onSave={handleSave} />
            </div>
        );
    }

    const filterInput = { padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px' };

    return (
        <div>
            {notices}

            <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                <div onClick={() => setOpen(!open)} style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: '700', fontSize: '14px', color: '#333', cursor: 'pointer', userSelect: 'none' }}>
                    {open ? '∨' : '>'} Manage Expense <span style={{ fontWeight: 400, color: '#6c757d' }}>({expenses.length})</span>
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
                                <option>Cancelled</option>
                            </select>
                            <button onClick={handleGo} style={{ padding: '7px 18px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Go</button>
                            <button onClick={handleClear} style={{ padding: '7px 18px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Clear</button>
                            <div style={{ marginLeft: 'auto', fontSize: '13px', color: '#495057' }}>
                                Approved total: <strong style={{ color: '#1a2035' }}>৳ {fmt(approvedTotal)}</strong>
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#1a2035' }}>
                                        <th style={{ ...thS, width: '36px', textAlign: 'center' }}>#</th>
                                        <th style={thS}>Voucher | Code</th>
                                        <th style={thS}>Received By</th>
                                        <th style={thS}>Expense Head</th>
                                        <th style={thS}>Date</th>
                                        <th style={{ ...thS, textAlign: 'right' }}>Amount</th>
                                        <th style={thS}>Note</th>
                                        <th style={thS}>Status</th>
                                        <th style={{ ...thS, textAlign: 'right' }}>
                                            Action&nbsp;
                                            <button onClick={() => { setEditing(null); setView('add'); }} style={{ padding: '3px 10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>🌿 Add</button>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr><td colSpan={9} style={{ ...tdS, textAlign: 'center', padding: '30px', color: '#6c757d' }}>
                                            {loading ? 'Loading…' : 'No data found'}
                                        </td></tr>
                                    ) : filtered.map((e, i) => (
                                        <tr key={e.code} style={{ background: i % 2 === 0 ? 'white' : '#fafafa', opacity: e.status === 'Cancelled' ? 0.55 : 1 }}>
                                            <td style={{ ...tdS, textAlign: 'center' }}>{i + 1}</td>
                                            <td style={tdS}>
                                                <Badge color={e.type === 'Income' ? '#0d6efd' : '#28a745'}>{e.type}</Badge>
                                                <div style={{ fontSize: '11px', marginTop: '3px' }}>{e.voucherNo}</div>
                                                <div style={{ color: '#6c757d', fontSize: '11px' }}>{e.code}</div>
                                            </td>
                                            <td style={tdS}>{e.receivedByName}</td>
                                            <td style={{ ...tdS, fontWeight: '500' }}>{e.headName}</td>
                                            <td style={{ ...tdS, whiteSpace: 'nowrap' }}>{formatDate(e.date)}</td>
                                            <td style={{ ...tdS, textAlign: 'right', fontWeight: '600', textDecoration: e.status === 'Cancelled' ? 'line-through' : 'none' }}>{fmt(e.amount)}</td>
                                            <td style={{ ...tdS, fontSize: '11px', maxWidth: '200px' }}>{e.note}</td>
                                            <td style={tdS}>
                                                <Badge color={statusColour(e.status)}>{e.status}</Badge>
                                            </td>
                                            <td style={{ ...tdS, whiteSpace: 'nowrap' }}>
                                                {e.status === 'Pending' && (
                                                    <>
                                                        <IBtn bg="#4e73df" disabled={busy} onClick={() => { setEditing(e); setView('add'); }} title="Edit">✎</IBtn>
                                                        <IBtn bg="#1cc88a" disabled={busy} onClick={() => handleApprove(e)} title="Approve">✔</IBtn>
                                                    </>
                                                )}
                                                {e.status !== 'Cancelled' && (
                                                    <IBtn bg="#e74a3b" disabled={busy} onClick={() => handleCancel(e)} title="Cancel">🗑</IBtn>
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

export default Expense;
