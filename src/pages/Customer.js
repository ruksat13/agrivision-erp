import React, { useState, useCallback, useMemo } from 'react';
import {
    listCustomers, createCustomer, deactivateCustomer,
    listLicences, actorScope, formatDate,
} from '../services';
import { useAuth } from '../context/AuthContext';
import { Notice, useFlash, useCollection } from '../components/Notice';
import { LicenceBadge, bandOf, worstStatus } from '../components/LicenceBadge';

// Dealer master, backed by Firestore.
//
// SCREEN-AUDIT.md §4.2: this screen held a five-row array of `Mr. Rahim Uddin`
// and `ABC Agency` while the seeded `customers` collection held 30 dealers
// under `AIC-xxxxxx`, and every transaction screen read the second set. It is
// the same change Product.js made on 15 August, so it is the same shape —
// service layer only, soft delete rather than splice, and every write carrying
// its own audit entry because createCustomer() and deactivateCustomer() go
// through createDoc()/softDelete(), which cannot commit without one.
//
// The loading and error handling comes from useCollection/useFlash rather than
// being written out a fifteenth time; Product.js has its own copy only because
// it predates them (see the header of src/components/Notice.js).
//
// ── The licence column ────────────────────────────────────────────────────
// Dealer licences are Feature 1 (UNIQUE-FEATURES.md §5, part 1) and they live
// in `licences` with scope 'dealer', not on the customer record (decision D4):
// a dealer may hold a pesticide, a fertiliser and a seed licence, each with its
// own number and expiry.
//
// This screen READS them and nothing more. No screen anywhere creates or edits
// a dealer licence — they exist because the seed writes them. Showing the
// status here earns its place on its own: the sale rule refuses a lapsed
// dealer, and the dealer master is where somebody looks to find out why. An
// editor is a separate decision and is deliberately not built here.

const card = {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

const inp = {
    padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6',
    fontSize: '13px', width: '100%', boxSizing: 'border-box',
};

const lbl = { fontSize: '12px', fontWeight: 600, color: '#495057', display: 'block', marginBottom: '5px' };
const th = { padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontSize: '13px' };
const td = { padding: '10px 12px', fontSize: '13px', verticalAlign: 'middle' };
const mono = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: '12px' };

const btn = (bg, extra = {}) => ({
    backgroundColor: bg, color: 'white', border: 'none', borderRadius: '6px',
    padding: '9px 18px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, ...extra,
});

const taka = (n) => `৳ ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const EMPTY_FORM = {
    code: '', name: '', phone: '', contactPerson: '', email: '', address: '',
    territoryId: '', areaId: '', officerId: '', openingBalance: '', creditLimit: '',
};

/**
 * The licence cell: one pill per licence the dealer holds, worst first — the
 * order the compliance report uses — or the 'No licence' band when they hold
 * none, which is the worst case in the whole feature and not an absence to be
 * quiet about.
 */
function LicenceCell({ licences }) {
    if (!licences.length) {
        return <LicenceBadge status="No licence" title="Nothing on record — a restricted product cannot be supplied" />;
    }
    const sorted = [...licences].sort((a, b) => bandOf(a.status).rank - bandOf(b.status).rank);
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {sorted.map(l => (
                <LicenceBadge key={l.id} status={l.status}
                    label={`${l.licenceType} · ${l.status}`}
                    title={`${l.licenceNo} — expires ${formatDate(l.expiryDate)}`} />
            ))}
        </div>
    );
}

function Customer() {
    const { currentUser } = useAuth();
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);

    const { flash, say, busy, run } = useFlash();

    // status: null → every status, so a deactivated dealer is still visible
    // here. Product.js reads its catalogue the same way and for the same
    // reason: this is the master screen, and the master is where you go to see
    // what was deactivated.
    //
    // listCustomers() applies the caller's own scope — an Area Manager gets
    // their area, a Sales Officer their own dealers — because Security Rules
    // refuse an unscoped LIST rather than narrowing it. Licences are readable
    // by anyone signed in, so the second read needs no scope of its own; it is
    // keyed onto the dealers this caller can actually see.
    const load = useCallback(async () => {
        const [dealers, licences] = await Promise.all([
            listCustomers({ status: null }),
            listLicences({ scope: 'dealer' }),
        ]);
        const byHolder = new Map();
        licences.forEach(l => {
            if (!byHolder.has(l.holderId)) byHolder.set(l.holderId, []);
            byHolder.get(l.holderId).push(l);
        });
        return dealers.map(d => ({ ...d, licences: byHolder.get(d.code) || [] }));
    }, []);

    const { rows: data, loading, error, reload } = useCollection(load, { what: 'dealers' });

    const scope = actorScope();
    const restricted = Boolean(scope.areaId || scope.officerId);

    const filtered = useMemo(() => {
        const k = search.toLowerCase();
        if (!k) return data;
        return data.filter(d =>
            d.name.toLowerCase().includes(k)
            || d.code.toLowerCase().includes(k)
            || (d.phone || '').includes(search)
            || (d.areaId || '').toLowerCase().includes(k)
            || (d.address || '').toLowerCase().includes(k));
    }, [data, search]);

    const activeCount = data.filter(d => d.status === 'Active').length;
    const totalBalance = data.reduce((sum, d) => sum + Number(d.balance || 0), 0);
    const atRisk = data.filter(d => bandOf(worstStatus(d.licences)).rank <= 0).length;

    // ── Actions ──────────────────────────────────────────────────────────

    const openForm = () => {
        // An officer can only read back their own dealers, so the form opens
        // pre-filled with their own scope rather than letting them create a
        // dealer that disappears on the next load.
        setForm({
            ...EMPTY_FORM,
            areaId: currentUser?.areaId || '',
            territoryId: currentUser?.territoryId || '',
            officerId: currentUser?.role === 'Sales Officer' ? (currentUser.id || '') : '',
        });
        setShowForm(true);
    };

    const handleAdd = () => run(async () => {
        await createCustomer({
            ...form,
            contactPerson: form.contactPerson || null,
            email: form.email || null,
            openingBalance: form.openingBalance || 0,
            creditLimit: form.creditLimit || 0,
        });
        setForm(EMPTY_FORM);
        setShowForm(false);
        say('ok', `Dealer ${form.code} added.`);
        await reload();
    });

    const handleDeactivate = (d) => {
        if (!window.confirm(`Deactivate ${d.name}? Their invoices and ledger stay; they can no longer be selected on a new order.`)) return;
        return run(async () => {
            await deactivateCustomer(d.code, 'Deactivated from the customer master');
            say('ok', `${d.name} deactivated.`);
            await reload();
        });
    };

    // ── Render ───────────────────────────────────────────────────────────

    return (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                <h2 style={{ color: '#1a2035', margin: 0 }}>🤝 Customer</h2>
                <button onClick={() => (showForm ? setShowForm(false) : openForm())}
                    style={btn('#0d6efd', { padding: '10px 20px', fontSize: 14 })}>
                    + New Customer
                </button>
            </div>

            {loading && <Notice tone="info">Loading dealers…</Notice>}
            {error && <Notice tone="warn">{error}</Notice>}
            {flash && <Notice tone={flash.tone}>{flash.text}</Notice>}

            {/* The caption the compliance report carries, for the same reason:
                this table means two different things depending on who is signed
                in, and "30 dealers" versus "5 dealers" is not a difference to
                leave the reader to work out for themselves. */}
            {restricted && !loading && (
                <Notice tone="info">
                    <b>Scoped to {scope.areaId ? `your area — ${scope.areaId}` : 'the dealers you are responsible for'}.</b>{' '}
                    You are seeing <b>{data.length}</b> dealer{data.length === 1 ? '' : 's'}, not the whole
                    company. Security Rules scope <code>customers</code> on <code>areaId</code> for an Area
                    Manager and on <code>officerId</code> for a Sales Officer.
                </Notice>
            )}

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
                {[
                    { label: 'Total Customers', value: data.length, colour: '#0d6efd' },
                    { label: 'Active Customers', value: activeCount, colour: '#28a745' },
                    { label: 'Total Due Balance', value: taka(totalBalance), colour: '#fd7e14', small: true },
                    { label: 'Licence problems', value: atRisk, colour: '#dc3545', hint: 'expired, or none on record' },
                ].map(c => (
                    <div key={c.label} style={{ ...card, textAlign: 'center', borderTop: `4px solid ${c.colour}` }}>
                        <p style={{ color: '#6c757d', fontSize: 13, margin: '0 0 8px' }}>{c.label}</p>
                        <p style={{ fontSize: c.small ? 17 : 22, fontWeight: 'bold', margin: 0, color: c.colour }}>{c.value}</p>
                        {c.hint && <p style={{ color: '#adb5bd', fontSize: 11, margin: '4px 0 0' }}>{c.hint}</p>}
                    </div>
                ))}
            </div>

            {/* Add form */}
            {showForm && (
                <div style={{ ...card, marginBottom: 20, borderLeft: '4px solid #0d6efd' }}>
                    <h4 style={{ marginTop: 0, color: '#1a2035' }}>Add New Customer</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                        <div>
                            <label style={lbl}>Dealer code *</label>
                            <input placeholder="AIC-002100" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Name *</label>
                            <input placeholder="M/s- New Traders" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Phone *</label>
                            <input placeholder="01711000000" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Contact person</label>
                            <input placeholder="Optional" value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Email</label>
                            <input placeholder="Optional" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Address *</label>
                            <input placeholder="Bazar Road, Bogura" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Territory *</label>
                            <input placeholder="bogura-sadar" value={form.territoryId} onChange={e => setForm({ ...form, territoryId: e.target.value })} style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Area *</label>
                            <input placeholder="bogura" value={form.areaId} onChange={e => setForm({ ...form, areaId: e.target.value })} style={inp} />
                            <div style={{ fontSize: 11, color: '#6c757d', marginTop: 4 }}>An Area Manager reads only their own area.</div>
                        </div>
                        <div>
                            <label style={lbl}>Sales officer *</label>
                            <input placeholder="AIO-000083" value={form.officerId} onChange={e => setForm({ ...form, officerId: e.target.value })} style={inp} />
                            <div style={{ fontSize: 11, color: '#6c757d', marginTop: 4 }}>The officer's user id — a Sales Officer reads only their own dealers.</div>
                        </div>
                        <div>
                            <label style={lbl}>Opening balance</label>
                            <input type="number" step="0.01" placeholder="0.00" value={form.openingBalance} onChange={e => setForm({ ...form, openingBalance: e.target.value })} style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Credit limit</label>
                            <input type="number" step="0.01" placeholder="0 = no limit" value={form.creditLimit} onChange={e => setForm({ ...form, creditLimit: e.target.value })} style={inp} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button onClick={handleAdd} disabled={busy} style={{ ...btn(busy ? '#adb5bd' : '#28a745'), width: '100%' }}>
                                {busy ? 'Saving…' : 'Save Customer'}
                            </button>
                        </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#6c757d', marginTop: 12, lineHeight: 1.6 }}>
                        A new dealer starts with no licence on record, and the sale rule refuses a
                        restricted product to a dealer it can see no cover for. Dealer licences are
                        seeded data today — there is no screen that creates one.
                    </div>
                </div>
            )}

            {/* Table */}
            <div style={card}>
                <div style={{ marginBottom: 16 }}>
                    <input placeholder="Search by name, code, phone or area…" value={search} onChange={e => setSearch(e.target.value)}
                        style={{ ...inp, width: 350 }} />
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8f9fa' }}>
                                {['#', 'Code', 'Name', 'Phone', 'Area', 'Balance', 'Credit limit', 'Licence', 'Status', 'Action'].map(h => (
                                    <th key={h} style={th}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((row, i) => (
                                <tr key={row.code} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                    <td style={{ ...td, color: '#adb5bd' }}>{i + 1}</td>
                                    <td style={{ ...td, ...mono, color: '#6c757d' }}>{row.code}</td>
                                    <td style={{ ...td, fontWeight: 'bold', color: '#1a2035' }}>
                                        {row.name}
                                        <div style={{ fontSize: 11, fontWeight: 400, color: '#adb5bd' }}>{row.address}</div>
                                    </td>
                                    <td style={td}>{row.phone}</td>
                                    <td style={td}>{row.areaId}</td>
                                    <td style={{ ...td, fontWeight: 'bold', color: Number(row.balance) > 0 ? '#dc3545' : '#28a745', whiteSpace: 'nowrap' }}>
                                        {taka(row.balance)}
                                    </td>
                                    <td style={{ ...td, whiteSpace: 'nowrap', color: '#6c757d' }}>
                                        {Number(row.creditLimit) > 0 ? taka(row.creditLimit) : 'no limit'}
                                    </td>
                                    <td style={{ ...td, minWidth: 210 }}><LicenceCell licences={row.licences} /></td>
                                    <td style={td}>
                                        <span style={{
                                            backgroundColor: row.status === 'Active' ? '#d4edda' : '#f8d7da',
                                            color: row.status === 'Active' ? '#155724' : '#721c24',
                                            padding: '3px 10px', borderRadius: 20, fontSize: 12,
                                        }}>{row.status}</span>
                                    </td>
                                    <td style={{ ...td, whiteSpace: 'nowrap' }}>
                                        {row.status === 'Active' && (
                                            <button onClick={() => handleDeactivate(row)} disabled={busy}
                                                style={btn('#6c757d', { padding: '4px 10px', fontSize: 12 })}>
                                                Deactivate
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {!loading && filtered.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#adb5bd', padding: 20 }}>No data found</p>
                )}
            </div>

            <p style={{ fontSize: 12, color: '#6c757d', marginTop: 12, lineHeight: 1.6 }}>
                Nothing here is hard-deleted (schema §2) — <b>Deactivate</b> sets the status to
                Inactive, so an invoice raised today still resolves next month. <b>Balance</b> is the
                running receivable moved by sales and collections; it is not editable from this
                screen, because the ledger owns it.
                <br />
                <b>Licence</b> is read from the <code>licences</code> collection, and its status is
                derived at read time from the expiry date rather than stored (decision D5), so it
                cannot go stale. This screen shows the position; it does not edit it. The full
                register is on <b>License → Compliance Report</b>.
            </p>
        </div>
    );
}

export default Customer;
