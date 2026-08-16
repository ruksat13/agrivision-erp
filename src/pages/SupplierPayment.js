import React, { useState, useEffect, useCallback } from 'react';
import {
    listSupplierPayments, createSupplierPayment, updateSupplierPayment,
    approveSupplierPayment, cancelSupplierPayment,
    supplierOptions, bankAccountOptions, formatDate, PAY_METHOD,
} from '../services';
import { Notice, useFlash, useCollection } from '../components/Notice';

// Supplier payments, backed by Firestore.
//
// Sixth of the fourteen screens in SCREEN-AUDIT.md §2.1 — and one of the three
// where the audit notes that edit, approve and delete already worked. They
// worked on local state, so they were lost on refresh like everything else;
// all three go through the service layer now.
//
// The payable moves on APPROVE, not on save. A pending payment is somebody's
// claim that money went out; posting it immediately would understate what is
// still owed. Cancelling an already-approved payment puts the payable back.
//
// The "Account Expense" selector was a hardcoded list of the company's own
// bank accounts, so it reads `bank_accounts` — the collection built for the
// Bank Account screen earlier in this same pass.

const thS = { padding: '10px 12px', color: 'white', fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap', textAlign: 'left' };
const tdS = { padding: '9px 12px', fontSize: '12px', color: '#333', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' };
const inp = { width: '100%', padding: '9px 12px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' };

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = formatDate(new Date());

const Badge = ({ color, children }) => (
    <span style={{ background: color, color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>{children}</span>
);

const IBtn = ({ bg, onClick, title, children, disabled }) => (
    <button onClick={onClick} title={title} disabled={disabled}
        style={{ padding: '4px 8px', background: disabled ? '#adb5bd' : bg, color: 'white', border: 'none', borderRadius: '4px', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '13px', marginRight: '3px' }}>{children}</button>
);

const statusColour = (s) => ({ Approved: '#28a745', Pending: '#0dcaf0', Cancelled: '#dc3545' }[s] || '#6c757d');

function EditModal({ row, busy, onClose, onSave }) {
    const [form, setForm] = useState({
        amount: row.amount, bankName: row.bankName || '', txnId: row.txnId || '',
        payMethod: row.payMethod, payDate: formatDate(row.payDate), note: row.note || '',
    });
    const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
    const lbl = { fontSize: '13px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '5px' };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'white', borderRadius: '10px', padding: '28px', width: '520px', maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto' }}>
                <h5 style={{ margin: '0 0 20px', color: '#1a2035' }}>Edit Supplier Payment</h5>

                <div style={{ marginBottom: '14px' }}>
                    <label style={lbl}>Supplier</label>
                    <input value={`${row.supplierName} [${row.supplierCode}]`} readOnly style={{ ...inp, background: '#f8f9fa' }} />
                </div>
                <div style={{ marginBottom: '14px' }}>
                    <label style={lbl}>Amount</label>
                    <input type="number" step="0.01" value={form.amount} onChange={set('amount')} style={inp} />
                </div>
                <div style={{ marginBottom: '14px' }}>
                    <label style={lbl}>Bank / Digital Name</label>
                    <input value={form.bankName} onChange={set('bankName')} style={inp} />
                </div>
                <div style={{ marginBottom: '14px' }}>
                    <label style={lbl}>TxnID / Account Name</label>
                    <input value={form.txnId} onChange={set('txnId')} style={inp} />
                </div>
                <div style={{ marginBottom: '14px' }}>
                    <label style={lbl}>Payment Type</label>
                    <select value={form.payMethod} onChange={set('payMethod')} style={inp}>
                        {PAY_METHOD.map(t => <option key={t}>{t}</option>)}
                    </select>
                </div>
                <div style={{ marginBottom: '14px' }}>
                    <label style={lbl}>Pay Date</label>
                    <input type="date" value={form.payDate} onChange={set('payDate')} style={inp} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={lbl}>Note</label>
                    <textarea value={form.note} onChange={set('note')} style={{ ...inp, height: '70px', resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ padding: '8px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                    <button onClick={() => onSave(form)} disabled={busy}
                        style={{ padding: '8px 20px', background: busy ? '#adb5bd' : '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: busy ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
                        {busy ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const EMPTY = { supplierId: '', amount: '', payDate: today, payMethod: '', bankAccountId: '', bankName: '', txnId: '', note: '' };

function AddForm({ suppliers, accounts, busy, onBack, onSave }) {
    const [form, setForm] = useState(EMPTY);
    const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
    const row = { display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'flex-start' };
    const lbl = { width: '160px', flexShrink: 0, fontWeight: '600', fontSize: '13px', color: '#495057', paddingTop: '10px' };
    const ready = Boolean(form.supplierId && Number(form.amount) > 0 && form.payDate && form.payMethod) && !busy;

    const supplier = suppliers.find(s => s.value === form.supplierId)?.supplier;

    return (
        <div style={{ background: 'white', borderRadius: '10px', padding: '0', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                &gt; Add Supplier Payment
            </div>
            <div style={{ padding: '24px 32px' }}>
                <div style={row}>
                    <span style={lbl}>Supplier <span style={{ color: '#dc3545' }}>*</span></span>
                    <div style={{ flex: 1 }}>
                        <select value={form.supplierId} onChange={set('supplierId')} style={inp}>
                            <option value="">Select Supplier</option>
                            {suppliers.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        {supplier && (
                            <div style={{ fontSize: '12px', color: Number(supplier.balance) > 0 ? '#dc3545' : '#28a745', marginTop: '5px' }}>
                                Currently payable: ৳ {fmt(supplier.balance)}
                            </div>
                        )}
                    </div>
                </div>
                <div style={row}>
                    <span style={lbl}>Pay amount <span style={{ color: '#dc3545' }}>*</span></span>
                    <input type="number" step="0.01" min="0" placeholder="Pay Amount" value={form.amount} onChange={set('amount')} style={inp} />
                </div>
                <div style={row}>
                    <span style={lbl}>Pay date <span style={{ color: '#dc3545' }}>*</span></span>
                    <input type="date" value={form.payDate} onChange={set('payDate')} style={{ ...inp, background: '#f8f9fa' }} />
                </div>
                <div style={row}>
                    <span style={lbl}>Payment Type <span style={{ color: '#dc3545' }}>*</span></span>
                    <select value={form.payMethod} onChange={set('payMethod')} style={inp}>
                        <option value="">🔍 Please select</option>
                        {PAY_METHOD.map(t => <option key={t}>{t}</option>)}
                    </select>
                </div>
                <div style={row}>
                    <span style={lbl}>Paid from account</span>
                    <div style={{ flex: 1 }}>
                        <select value={form.bankAccountId} onChange={set('bankAccountId')} style={inp}>
                            <option value="">🔍 Please select</option>
                            {accounts.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                        </select>
                        {accounts.length === 0 && (
                            <div style={{ fontSize: '12px', color: '#856404', marginTop: '5px' }}>
                                No bank accounts recorded yet — add one on the Bank Account screen.
                            </div>
                        )}
                    </div>
                </div>
                <div style={row}>
                    <span style={lbl}>Bank / Digital name</span>
                    <input placeholder="e.g. BRAC Bank" value={form.bankName} onChange={set('bankName')} style={inp} />
                </div>
                <div style={row}>
                    <span style={lbl}>TxnID / Cheque no</span>
                    <input placeholder="e.g. cheque 8897433" value={form.txnId} onChange={set('txnId')} style={inp} />
                </div>
                <div style={row}>
                    <span style={lbl}>Note</span>
                    <textarea value={form.note} onChange={set('note')} style={{ ...inp, height: '80px', resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px', paddingLeft: '176px' }}>
                    <button onClick={() => onSave(form)} disabled={!ready}
                        style={{ padding: '8px 24px', background: ready ? '#28a745' : '#adb5bd', color: 'white', border: 'none', borderRadius: '6px', cursor: ready ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: '600' }}>
                        {busy ? 'Saving…' : 'Save'}
                    </button>
                    <button onClick={onBack} style={{ padding: '8px 24px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Go Back</button>
                </div>
            </div>
        </div>
    );
}

function SupplierPayment() {
    const [view, setView] = useState('list');
    const [editRow, setEditRow] = useState(null);
    const [open, setOpen] = useState(true);
    const [suppliers, setSuppliers] = useState([]);
    const [accounts, setAccounts] = useState([]);

    const emptyF = { supplierId: '', search: '', date: '', status: '' };
    const [draft, setDraft] = useState(emptyF);
    const [applied, setApplied] = useState(emptyF);

    const load = useCallback(() => listSupplierPayments(), []);
    const { rows: payments, loading, error, reload } = useCollection(load, { what: 'supplier payments' });
    const { flash, say, busy, run } = useFlash();

    useEffect(() => {
        supplierOptions().then(setSuppliers).catch(() => setSuppliers([]));
        bankAccountOptions().then(setAccounts).catch(() => setAccounts([]));
    }, []);

    const handleGo = () => setApplied(draft);
    const handleClear = () => { setDraft(emptyF); setApplied(emptyF); };

    const handleAdd = (form) => run(async () => {
        const account = accounts.find(a => a.value === form.bankAccountId);
        await createSupplierPayment({ ...form, bankAccountLabel: account?.label ?? null });
        say('ok', 'Payment saved as Pending. Approve it to reduce the payable.');
        setView('list');
        await reload();
    });

    const handleEditSave = (form) => run(async () => {
        await updateSupplierPayment(editRow.id, form);
        say('ok', 'Payment updated.');
        setEditRow(null);
        await reload();
    });

    const handleApprove = (p) => run(async () => {
        await approveSupplierPayment(p.id);
        say('ok', `Approved. ${p.supplierName}'s payable is down by ৳ ${fmt(p.amount)}.`);
        // The supplier list carries the balance shown on the add form, so it is
        // refetched too rather than going stale behind the payment list.
        supplierOptions().then(setSuppliers).catch(() => {});
        await reload();
    });

    const handleCancel = (p) => {
        const reason = window.prompt(`Why is this ৳ ${fmt(p.amount)} payment to ${p.supplierName} being cancelled?`);
        if (!reason) return;
        run(async () => {
            await cancelSupplierPayment(p.id, reason);
            say('ok', p.status === 'Approved'
                ? 'Payment cancelled and the payable put back.'
                : 'Payment cancelled.');
            supplierOptions().then(setSuppliers).catch(() => {});
            await reload();
        });
    };

    const filtered = payments.filter(p => {
        if (applied.supplierId && p.supplierId !== applied.supplierId) return false;
        if (applied.search) {
            const k = applied.search.toLowerCase();
            const hay = `${p.supplierName || ''} ${p.supplierCode || ''} ${p.note || ''}`.toLowerCase();
            if (!hay.includes(k)) return false;
        }
        if (applied.date && formatDate(p.payDate) !== applied.date) return false;
        if (applied.status && p.status !== applied.status) return false;
        return true;
    });

    const notices = (
        <>
            {loading && view === 'list' && <Notice tone="info">Loading payments…</Notice>}
            {error && <Notice tone="warn">{error}</Notice>}
            {flash && <Notice tone={flash.tone}>{flash.text}</Notice>}
        </>
    );

    if (view === 'add') {
        return (
            <div>
                {notices}
                <AddForm suppliers={suppliers} accounts={accounts} busy={busy}
                    onBack={() => setView('list')} onSave={handleAdd} />
            </div>
        );
    }

    return (
        <div>
            {notices}
            {editRow && <EditModal row={editRow} busy={busy} onClose={() => setEditRow(null)} onSave={handleEditSave} />}

            <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                <div onClick={() => setOpen(!open)} style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: '700', fontSize: '14px', color: '#333', cursor: 'pointer', userSelect: 'none' }}>
                    {open ? '∨' : '>'} Payment History <span style={{ fontWeight: 400, color: '#6c757d' }}>({payments.length})</span>
                </div>

                {open && (
                    <>
                        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <select value={draft.supplierId} onChange={e => setDraft(p => ({ ...p, supplierId: e.target.value }))} style={{ padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', minWidth: '200px' }}>
                                <option value="">🔍 Please select</option>
                                {suppliers.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                            <input placeholder="Search" value={draft.search} onChange={e => setDraft(p => ({ ...p, search: e.target.value }))} style={{ padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', width: '140px' }} />
                            <input type="date" value={draft.date} onChange={e => setDraft(p => ({ ...p, date: e.target.value }))} style={{ padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px' }} />
                            <select value={draft.status} onChange={e => setDraft(p => ({ ...p, status: e.target.value }))} style={{ padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', minWidth: '130px' }}>
                                <option value="">🔍 Please select</option>
                                <option>Pending</option>
                                <option>Approved</option>
                                <option>Cancelled</option>
                            </select>
                            <button onClick={handleGo} style={{ padding: '7px 18px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Go</button>
                            <button onClick={handleClear} style={{ padding: '7px 18px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Clear</button>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#1a2035' }}>
                                        <th style={{ ...thS, width: '40px' }}>No</th>
                                        <th style={thS}>Supplier name</th>
                                        <th style={{ ...thS, textAlign: 'right' }}>Amount | Type</th>
                                        <th style={thS}>Digital/Bank Name</th>
                                        <th style={thS}>Num/TxnID</th>
                                        <th style={thS}>Paid from | Date</th>
                                        <th style={thS}>Status</th>
                                        <th style={thS}>Note</th>
                                        <th style={{ ...thS, textAlign: 'right' }}>
                                            Action&nbsp;
                                            <button onClick={() => setView('add')} style={{ padding: '3px 10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>🌿 Add</button>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr><td colSpan={9} style={{ ...tdS, textAlign: 'center', padding: '30px', color: '#6c757d' }}>
                                            {loading ? 'Loading…' : 'No data found'}
                                        </td></tr>
                                    ) : filtered.map((p, i) => (
                                        <tr key={p.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa', opacity: p.status === 'Cancelled' ? 0.55 : 1 }}>
                                            <td style={{ ...tdS, textAlign: 'center' }}>{i + 1}</td>
                                            <td style={tdS}>
                                                <div style={{ fontWeight: '600', color: '#1a2035' }}>{p.supplierName}</div>
                                                <div style={{ color: '#6c757d', fontSize: '11px' }}>[{p.supplierCode}]</div>
                                            </td>
                                            <td style={{ ...tdS, textAlign: 'right' }}>
                                                <div style={{ fontWeight: '600', textDecoration: p.status === 'Cancelled' ? 'line-through' : 'none' }}>{fmt(p.amount)}</div>
                                                <Badge color="#28a745">{p.payMethod}</Badge>
                                            </td>
                                            <td style={tdS}>{p.bankName}</td>
                                            <td style={tdS}>{p.txnId}</td>
                                            <td style={tdS}>
                                                <div style={{ fontSize: '11px', color: '#333' }}>{p.bankAccountLabel}</div>
                                                <div style={{ fontSize: '11px', color: '#6c757d' }}>{formatDate(p.payDate)}</div>
                                            </td>
                                            <td style={tdS}>
                                                <Badge color={statusColour(p.status)}>{p.status}</Badge>
                                            </td>
                                            <td style={{ ...tdS, maxWidth: '200px', fontSize: '11px' }}>{p.note}</td>
                                            <td style={{ ...tdS, whiteSpace: 'nowrap' }}>
                                                {p.status === 'Pending' && (
                                                    <>
                                                        <IBtn bg="#4e73df" disabled={busy} onClick={() => setEditRow(p)} title="Edit">✎</IBtn>
                                                        <IBtn bg="#1cc88a" disabled={busy} onClick={() => handleApprove(p)} title="Approve — reduces the payable">✔</IBtn>
                                                    </>
                                                )}
                                                {p.status !== 'Cancelled' && (
                                                    <IBtn bg="#e74a3b" disabled={busy} onClick={() => handleCancel(p)} title="Cancel">🗑</IBtn>
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
