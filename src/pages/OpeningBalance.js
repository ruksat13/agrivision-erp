import React, { useState, useEffect, useCallback } from 'react';
import {
    listOpeningBalances, createOpeningBalance, cancelOpeningBalance,
    customerOptions, supplierOptions, formatDate, ENTRY_TYPE,
} from '../services';
import { Notice, useFlash, useCollection } from '../components/Notice';

// Opening balances for a customer or a supplier — ONE component, two modes,
// following the Categories.js pattern SCREEN-AUDIT.md §5.2 calls the best-built
// screen in the app, and decision 3's treatment of License.js.
//
// The two screens were byte-for-byte the same apart from the word "Supplier"
// and the list of names. They read one `opening_balances` collection separated
// by `party`, exactly as `licences` uses `scope` (D4).
//
// Two things changed while wiring Save (SCREEN-AUDIT.md §2.1):
//
//   · The form asked for a PAYMENT TYPE — Cash / bKash / Nagad. An opening
//     balance has no payment type; the column the table renders is Debit or
//     Credit. Saving would have produced a row with a blank Type badge, which
//     is the §2.3 defect. The form collects the entry type now.
//   · The supplier and customer name lists were hardcoded arrays with no code
//     behind them, so nothing could be posted against a real party. Both read
//     their master.
//
// Posting an entry moves the party's balance in the same batch. Which
// direction depends on the party — see signedDelta() in openingBalances.js.

const thS = { padding: '10px 12px', color: 'white', fontWeight: '600', fontSize: '13px', textAlign: 'left' };
const tdS = { padding: '9px 12px', fontSize: '12px', color: '#333', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' };
const inp = { width: '100%', padding: '9px 12px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' };
const lbl = { fontSize: '13px', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '5px' };

const Badge = ({ color, children }) => (
    <span style={{ background: color, color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>{children}</span>
);

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = formatDate(new Date());

const MODES = {
    customer: { title: 'Customer Opening Balance', who: 'Customer', options: customerOptions },
    supplier: { title: 'Supplier Opening Balance', who: 'Supplier', options: supplierOptions },
};

// Which way a Debit and a Credit push this party's balance, in words, so the
// person entering it can see what they are about to do.
const EFFECT = {
    customer: { Debit: 'raises what the dealer owes us', Credit: 'reduces what the dealer owes us' },
    supplier: { Debit: 'reduces what we owe them', Credit: 'raises what we owe them' },
};

function AddForm({ party, parties, busy, onBack, onSave }) {
    const mode = MODES[party];
    const [form, setForm] = useState({ partyId: '', type: 'Credit', amount: '', date: today, note: '' });
    const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
    const ready = Boolean(form.partyId && form.type && Number(form.amount) > 0 && form.date) && !busy;

    return (
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                Add {mode.title}
            </div>
            <div style={{ padding: '24px 32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                        <label style={lbl}>{mode.who} <span style={{ color: '#dc3545' }}>*</span></label>
                        <select value={form.partyId} onChange={set('partyId')} style={inp}>
                            <option value="">Select {mode.who}</option>
                            {parties.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Type <span style={{ color: '#dc3545' }}>*</span></label>
                        <select value={form.type} onChange={set('type')} style={inp}>
                            {ENTRY_TYPE.map(t => <option key={t}>{t}</option>)}
                        </select>
                        <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px' }}>
                            {EFFECT[party][form.type]}
                        </div>
                    </div>
                    <div>
                        <label style={lbl}>Amount <span style={{ color: '#dc3545' }}>*</span></label>
                        <input type="number" step="0.01" min="0" placeholder="Enter Amount" value={form.amount} onChange={set('amount')} style={inp} />
                    </div>
                    <div>
                        <label style={lbl}>Date <span style={{ color: '#dc3545' }}>*</span></label>
                        <input type="date" value={form.date} onChange={set('date')} style={{ ...inp, background: '#f8f9fa' }} />
                    </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={lbl}>Note</label>
                    <textarea value={form.note} onChange={set('note')} style={{ ...inp, height: '80px', resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={onBack} style={{ padding: '8px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Back</button>
                    <button onClick={() => onSave(form)} disabled={!ready}
                        style={{ padding: '8px 24px', background: ready ? '#28a745' : '#adb5bd', color: 'white', border: 'none', borderRadius: '6px', cursor: ready ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: '600' }}>
                        {busy ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function OpeningBalance({ party = 'supplier' }) {
    const mode = MODES[party];
    const [view, setView] = useState('list');
    const [parties, setParties] = useState([]);

    const emptyF = { search: '', date: '' };
    const [draft, setDraft] = useState(emptyF);
    const [applied, setApplied] = useState(emptyF);

    const load = useCallback(() => listOpeningBalances({ party }), [party]);
    const { rows: records, loading, error, reload } = useCollection(load, { what: `${party} opening balances` });
    const { flash, say, busy, run } = useFlash();

    useEffect(() => { mode.options().then(setParties).catch(() => setParties([])); }, [mode]);

    const handleGo = () => setApplied(draft);
    const handleClear = () => { setDraft(emptyF); setApplied(emptyF); };

    const handleSave = (form) => run(async () => {
        await createOpeningBalance({ ...form, party });
        say('ok', `Opening balance saved. The ${mode.who.toLowerCase()}'s balance has moved with it.`);
        setView('list');
        await reload();
    });

    const handleCancel = (r) => {
        const reason = window.prompt(`Why is this ${r.type} of ${fmt(r.amount)} for ${r.partyName} being cancelled?`);
        if (!reason) return;
        run(async () => {
            await cancelOpeningBalance(r.id, reason);
            say('ok', 'Entry cancelled and the balance put back.');
            await reload();
        });
    };

    const filtered = records.filter(r => {
        if (applied.search) {
            const k = applied.search.toLowerCase();
            const hay = `${r.partyName || ''} ${r.partyCode || ''} ${r.note || ''}`.toLowerCase();
            if (!hay.includes(k)) return false;
        }
        if (applied.date && formatDate(r.date) !== applied.date) return false;
        return true;
    });

    const notices = (
        <>
            {loading && view === 'list' && <Notice tone="info">Loading…</Notice>}
            {error && <Notice tone="warn">{error}</Notice>}
            {flash && <Notice tone={flash.tone}>{flash.text}</Notice>}
        </>
    );

    if (view === 'add') {
        return (
            <div>
                {notices}
                <AddForm party={party} parties={parties} busy={busy} onBack={() => setView('list')} onSave={handleSave} />
            </div>
        );
    }

    return (
        <div>
            {notices}

            <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                    &gt; {mode.title} <span style={{ fontWeight: 400, color: '#6c757d' }}>({records.length})</span>
                </div>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input placeholder="Search" value={draft.search} onChange={e => setDraft(p => ({ ...p, search: e.target.value }))} style={{ padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', width: '160px' }} />
                    <input type="date" value={draft.date} onChange={e => setDraft(p => ({ ...p, date: e.target.value }))} style={{ padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px' }} />
                    <button onClick={handleGo} style={{ padding: '7px 18px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Go</button>
                    <button onClick={handleClear} style={{ padding: '7px 18px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Clear</button>
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
                                <th style={{ ...thS, textAlign: 'right' }}>
                                    Action&nbsp;
                                    <button onClick={() => setView('add')} style={{ padding: '3px 10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>🌿 Add</button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={8} style={{ ...tdS, textAlign: 'center', padding: '30px', color: '#6c757d' }}>
                                    {loading ? 'Loading…' : 'No data found'}
                                </td></tr>
                            ) : filtered.map((r, i) => (
                                <tr key={r.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa', opacity: r.status === 'Cancel' ? 0.55 : 1 }}>
                                    <td style={{ ...tdS, textAlign: 'center' }}>{i + 1}</td>
                                    <td style={tdS}>
                                        <div style={{ fontWeight: '600', color: '#1a2035' }}>{r.partyName}</div>
                                        <div style={{ color: '#6c757d', fontSize: '11px' }}>[{r.partyCode}]</div>
                                    </td>
                                    <td style={tdS}>
                                        <Badge color={r.type === 'Debit' ? '#fd7e14' : '#28a745'}>{r.type}</Badge>
                                    </td>
                                    <td style={{ ...tdS, textAlign: 'right', fontWeight: '600', textDecoration: r.status === 'Cancel' ? 'line-through' : 'none' }}>{fmt(r.amount)}</td>
                                    <td style={{ ...tdS, whiteSpace: 'nowrap' }}>{formatDate(r.date)}</td>
                                    <td style={tdS}>
                                        <Badge color={r.status === 'Approved' ? '#28a745' : '#dc3545'}>{r.status}</Badge>
                                    </td>
                                    <td style={{ ...tdS, fontSize: '11px', maxWidth: '220px' }}>{r.note}</td>
                                    <td style={{ ...tdS, textAlign: 'right' }}>
                                        {r.status === 'Approved' && (
                                            <button onClick={() => handleCancel(r)} disabled={busy} title="Cancel and reverse"
                                                style={{ padding: '4px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                                                ✕
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default OpeningBalance;
