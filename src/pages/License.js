import React, { useState, useCallback, useMemo } from 'react';
import {
    listLicences, createLicence, updateLicence, renewLicence,
    customerOptions, formatDate, actorScope,
    LICENCE_TYPE, LICENCE_TYPE_FOR_SCOPE, LICENCE_FOR_CATEGORY, LICENCE_WRITE_ROLES,
} from '../services';
import { useAuth } from '../context/AuthContext';
import { Notice, useFlash, useCollection } from '../components/Notice';
import { LicenceBadge, LICENCE_BAND, bandOf } from '../components/LicenceBadge';

// The licence register, backed by Firestore.
//
// SCREEN-AUDIT.md §7 decision 3: one component with a `type` prop giving two
// modes — the company's own licences and dealers' — both reading the single
// `licences` collection and distinguished by `scope` (schema D4), following the
// Categories.js pattern of one component behind several routes.
//
// What was here: four hardcoded rows, of which "Pesticide License PL-2026-003 ·
// DAE · Expiring Soon" was a literal string that never changed. It sat directly
// above the Compliance Report in the menu and contradicted it — the report
// derives every status from `expiryDate` at read time (decision D5) and this
// screen STORED one, so the same licence could be Expiring Soon here and
// Expired there. §3 defect 2 also recorded the deeper problem: a screen named
// for dealer licences that only ever held the company's own.
//
// Three things this screen is careful about:
//
//   · Status is never stored and never recomputed here. licences.js derives it
//     (withStatus/licenceStatus) and LicenceBadge.js paints it, so this screen,
//     the Compliance Report, the Customer master and the Dashboard panel cannot
//     show the same licence in four different colours.
//   · There is no Delete. firestore.rules refuses delete on `licences`
//     outright, and the collection has no soft-delete status of its own — a
//     licence is renewed, not removed. The old Delete button was a control the
//     server would have refused (CLAUDE.md §6).
//   · The Category mode has no Add form, and that is the fix rather than an
//     omission — see MODES.Category below.
//
// ── The create/edit UI ────────────────────────────────────────────────────
// There was none anywhere in the app: dealer licences existed only because the
// seed wrote them, so "add a licence for this dealer" had no answer. It lives
// here. Who may press Save is LICENCE_WRITE_ROLES, which is the same list
// firestore.rules enforces on the server — the list here only decides whether
// the button is offered.

const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

const thS = { padding: '10px 12px', color: 'white', fontWeight: '600', fontSize: '13px', textAlign: 'left' };
const tdS = { padding: '9px 12px', fontSize: '13px', color: '#333', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' };
const mono = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: '12px' };
const inp = { padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px', width: '100%', boxSizing: 'border-box' };
const lbl = { fontSize: '12px', fontWeight: 600, color: '#495057', display: 'block', marginBottom: '5px' };

const btn = (bg, extra = {}) => ({
    backgroundColor: bg, color: 'white', border: 'none', borderRadius: '6px',
    padding: '9px 18px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, ...extra,
});

// The company's own name, as the seed writes it onto its three licences
// (scripts/seed.mjs seedLicences) and as Sales.js prints it on an invoice.
// It is a prefill for the holder field, not a stored constant: there is no
// `settings` collection yet (schema §10), and when there is, this comes from it.
const COMPANY_NAME = 'Agrivision International';

/** The three routes this component serves, and what differs between them. */
const MODES = {
    Company: {
        scope: 'company',
        title: 'Company Licence',
        icon: '🏢',
        blurb: "Agrivision's own trading papers — the licences that authorise the business itself. Nothing here gates a sale; the Feature 1 rule reads the DEALER's licence.",
        holderLabel: 'Licence holder',
        empty: 'No company licence on record.',
    },
    Dealer: {
        scope: 'dealer',
        title: 'Dealer Licence',
        icon: '🤝',
        blurb: 'The register Feature 1 enforces. A dealer whose licence for a product category has lapsed — or who holds none — is refused that line at the point of sale.',
        holderLabel: 'Dealer',
        empty: 'No dealer licence on record.',
    },
    // Not a licence list at all. The old "Category" screen opened the LICENCE
    // form, so "+ New Category" appended a row with every column blank —
    // SCREEN-AUDIT.md §2.3, the third of the three wrong-shape forms.
    //
    // The fix is not a second form. Licence types are LICENCE_TYPE in
    // services/constants.js, and adding one is a schema decision that also
    // changes LICENCE_FOR_CATEGORY and the Feature 1 rule — CLAUDE.md's rule
    // for a value not in an enum is to raise it, not to type a string into a
    // screen. So this mode is a read-only reference: the enumeration, what each
    // type authorises, and how many are on record against it. There is no Add
    // button, which is why no blank row can be appended any more.
    Category: {
        scope: null,
        title: 'Licence Type',
        icon: '🏷️',
        blurb: 'Reference. The licence types are an enumeration in the code, not a collection — see the note below the table.',
    },
};

/** "15 days ago" reads better than "-15" — the wording the Compliance Report uses. */
function daysLabel(days) {
    if (days === null || days === undefined) return '—';
    if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`;
    if (days === 0) return 'expires today';
    return `${days} day${days === 1 ? '' : 's'}`;
}

const EMPTY_FORM = {
    holderId: '', holderName: '', licenceType: '', licenceNo: '',
    issuingAuthority: '', issueDate: '', expiryDate: '', note: '',
};

function StatCard({ label, value, tone, hint }) {
    return (
        <div style={{
            background: tone.bg, color: tone.fg, borderRadius: 8, padding: '12px 16px',
            minWidth: 110, flex: '1 1 110px', border: `1px solid ${tone.border === 'transparent' ? tone.bg : tone.border}`,
        }}>
            <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.1 }}>{value}</div>
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>{label}</div>
            {hint && <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{hint}</div>}
        </div>
    );
}

/**
 * Create, edit or renew.
 *
 * `mode` is 'create' | 'edit' | 'renew'. Renew is its own mode because it is
 * the action the Compliance Report sends you here to perform, and it should not
 * invite editing the holder or the type at the same time — a renewal is a new
 * number and new dates on the same permission. It goes through renewLicence(),
 * which is updateLicence() restricted to exactly those three fields.
 */
function LicenceForm({ mode, scope, editing, dealers, busy, onCancel, onSave }) {
    const [form, setForm] = useState(() => {
        if (!editing) return { ...EMPTY_FORM, holderName: scope === 'company' ? COMPANY_NAME : '' };
        return {
            holderId: editing.holderId || '',
            holderName: editing.holderName || '',
            licenceType: editing.licenceType || '',
            licenceNo: mode === 'renew' ? '' : (editing.licenceNo || ''),
            issuingAuthority: editing.issuingAuthority || '',
            issueDate: mode === 'renew' ? '' : formatDate(editing.issueDate),
            expiryDate: mode === 'renew' ? '' : formatDate(editing.expiryDate),
            note: editing.note || '',
        };
    });

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
    const types = LICENCE_TYPE_FOR_SCOPE[scope] || LICENCE_TYPE;
    const isDealer = scope === 'dealer';

    // The holder is fixed once the licence exists: moving a licence to another
    // dealer would silently change who the sale rule lets through, with nothing
    // on screen to say a permission had been reassigned.
    const holderLocked = mode !== 'create';

    const ready = Boolean(
        form.licenceNo.trim() && form.issuingAuthority.trim() && form.issueDate && form.expiryDate
        && (mode === 'renew' || form.licenceType)
        && (mode === 'renew' || !isDealer || form.holderId)
        && (mode === 'renew' || isDealer || form.holderName.trim()),
    ) && !busy;

    const datesWrong = form.issueDate && form.expiryDate && form.expiryDate < form.issueDate;

    const heading = mode === 'renew'
        ? `Renew ${editing.licenceType} licence — ${editing.holderName}`
        : mode === 'edit'
            ? `Edit ${editing.licenceType} licence — ${editing.holderName}`
            : `Add ${isDealer ? 'Dealer' : 'Company'} Licence`;

    return (
        <div style={{ ...cardStyle, marginBottom: 20, borderLeft: '4px solid #0d6efd' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: 700, fontSize: 14, color: '#333' }}>
                {heading}
            </div>
            <div style={{ padding: '20px 24px' }}>
                {mode === 'renew' && (
                    <Notice tone="info">
                        A renewal keeps the same record and replaces the number and the dates, so the
                        licence keeps its history. The status is not typed in — it is derived from the
                        new expiry date every time the row is read (decision D5).
                    </Notice>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>

                    {/* Holder */}
                    <div>
                        <label style={lbl}>{isDealer ? 'Dealer' : 'Licence holder'} <span style={{ color: '#dc3545' }}>*</span></label>
                        {holderLocked ? (
                            <div style={{ ...inp, background: '#f8f9fa', color: '#495057' }}>
                                {form.holderName}{isDealer && form.holderId ? ` [${form.holderId}]` : ''}
                            </div>
                        ) : isDealer ? (
                            <select value={form.holderId} style={inp}
                                onChange={(e) => {
                                    const d = dealers.find(o => o.value === e.target.value);
                                    setForm(f => ({ ...f, holderId: e.target.value, holderName: d ? d.customer.name : '' }));
                                }}>
                                <option value="">— select a dealer —</option>
                                {dealers.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        ) : (
                            <input value={form.holderName} onChange={set('holderName')} style={inp} placeholder="Company name" />
                        )}
                    </div>

                    {/* Type */}
                    <div>
                        <label style={lbl}>Licence type <span style={{ color: '#dc3545' }}>*</span></label>
                        {mode === 'renew' ? (
                            <div style={{ ...inp, background: '#f8f9fa', color: '#495057' }}>{form.licenceType}</div>
                        ) : (
                            <select value={form.licenceType} onChange={set('licenceType')} style={inp}>
                                <option value="">— select —</option>
                                {types.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        )}
                        {isDealer && form.licenceType && (
                            <div style={{ fontSize: 11, color: '#6c757d', marginTop: 4 }}>
                                Authorises: {Object.entries(LICENCE_FOR_CATEGORY)
                                    .filter(([, v]) => v === form.licenceType).map(([k]) => k).join(', ') || '—'}
                            </div>
                        )}
                    </div>

                    <div>
                        <label style={lbl}>Licence number <span style={{ color: '#dc3545' }}>*</span></label>
                        <input value={form.licenceNo} onChange={set('licenceNo')} style={inp} placeholder="e.g. PL-2026-1042" />
                    </div>

                    <div>
                        <label style={lbl}>Issuing authority <span style={{ color: '#dc3545' }}>*</span></label>
                        {/* Read-only on a renewal, because renewLicence() writes the
                            number and the two dates and nothing else. An editable
                            field whose value the save discards is the §2.3 defect in
                            miniature — it looks like it worked. Change the authority
                            through Edit. */}
                        {mode === 'renew' ? (
                            <div style={{ ...inp, background: '#f8f9fa', color: '#495057' }}>{form.issuingAuthority}</div>
                        ) : (
                            <input value={form.issuingAuthority} onChange={set('issuingAuthority')} style={inp}
                                placeholder="as printed on the licence" />
                        )}
                        <div style={{ fontSize: 11, color: '#6c757d', marginTop: 4 }}>
                            {mode === 'renew'
                                ? 'A renewal changes the number and the dates. Use Edit to correct the authority.'
                                : 'Copy it from the document. It is printed on the compliance report.'}
                        </div>
                    </div>

                    <div>
                        <label style={lbl}>Issue date <span style={{ color: '#dc3545' }}>*</span></label>
                        <input type="date" value={form.issueDate} onChange={set('issueDate')} style={inp} />
                    </div>

                    <div>
                        <label style={lbl}>Expiry date <span style={{ color: '#dc3545' }}>*</span></label>
                        <input type="date" value={form.expiryDate} onChange={set('expiryDate')} style={inp} />
                        <div style={{ fontSize: 11, color: '#6c757d', marginTop: 4 }}>
                            The field the sale rule reads.
                        </div>
                    </div>

                    {mode !== 'renew' && (
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={lbl}>Note</label>
                            <input value={form.note} onChange={set('note')} style={inp} placeholder="optional" />
                        </div>
                    )}
                </div>

                {datesWrong && (
                    <p style={{ color: '#721c24', fontSize: 12, margin: '12px 0 0' }}>
                        The expiry date is before the issue date.
                    </p>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                    <button disabled={!ready || datesWrong} onClick={() => onSave(form)}
                        style={btn(ready && !datesWrong ? '#28a745' : '#adb5bd',
                            { cursor: ready && !datesWrong ? 'pointer' : 'not-allowed' })}>
                        {busy ? 'Saving…' : mode === 'renew' ? 'Save renewal' : 'Save'}
                    </button>
                    <button onClick={onCancel} style={btn('#6c757d')}>Cancel</button>
                </div>
            </div>
        </div>
    );
}

/**
 * The Licence Type reference. Counts come from the licences actually on record,
 * so the "On record" column cannot claim a type nobody holds.
 */
function TypeTable({ licences }) {
    const rows = LICENCE_TYPE.map(t => {
        const held = licences.filter(l => l.licenceType === t);
        const scope = LICENCE_TYPE_FOR_SCOPE.dealer.includes(t) ? 'dealer'
            : LICENCE_TYPE_FOR_SCOPE.company.includes(t) ? 'company' : '—';
        return {
            type: t,
            scope,
            authorises: Object.entries(LICENCE_FOR_CATEGORY).filter(([, v]) => v === t).map(([k]) => k),
            onRecord: held.length,
            expired: held.filter(l => l.status === 'Expired').length,
            soon: held.filter(l => bandOf(l.status).rank >= 1 && bandOf(l.status).rank <= 3).length,
            inDate: held.filter(l => l.status === 'Active').length,
        };
    });

    return (
        <div style={cardStyle}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: 700, fontSize: 14, color: '#333' }}>
                &gt; Licence Type <span style={{ fontWeight: 400, color: '#6c757d' }}>({rows.length})</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: 820, borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#1a2035' }}>
                            <th style={{ ...thS, width: 44 }}>#</th>
                            <th style={{ ...thS, width: 130 }}>Type</th>
                            <th style={{ ...thS, width: 100 }}>Held by</th>
                            <th style={{ ...thS, minWidth: 200 }}>Authorises product category</th>
                            <th style={{ ...thS, width: 100 }}>On record</th>
                            <th style={{ ...thS, width: 90 }}>Expired</th>
                            <th style={{ ...thS, width: 110 }}>Expiring ≤ 60</th>
                            <th style={{ ...thS, width: 90 }}>In date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => (
                            <tr key={r.type} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                <td style={{ ...tdS, textAlign: 'center', color: '#adb5bd' }}>{i + 1}</td>
                                <td style={{ ...tdS, fontWeight: 600 }}>{r.type}</td>
                                <td style={tdS}>{r.scope}</td>
                                <td style={tdS}>
                                    {r.authorises.length
                                        ? r.authorises.join(', ')
                                        : <span style={{ color: '#adb5bd' }}>nothing — this type gates no sale</span>}
                                </td>
                                <td style={{ ...tdS, fontWeight: 700 }}>{r.onRecord}</td>
                                <td style={{ ...tdS, color: r.expired ? '#721c24' : '#adb5bd', fontWeight: r.expired ? 700 : 400 }}>{r.expired || '—'}</td>
                                <td style={{ ...tdS, color: r.soon ? '#7a3e00' : '#adb5bd', fontWeight: r.soon ? 700 : 400 }}>{r.soon || '—'}</td>
                                <td style={tdS}>{r.inDate || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function License({ type = 'Company' }) {
    const { currentUser } = useAuth();
    const mode = MODES[type] || MODES.Company;
    const isCategory = type === 'Category';

    const [search, setSearch] = useState('');
    const [form, setForm] = useState(null);      // { mode, editing } | null
    const [dealers, setDealers] = useState([]);

    const { flash, say, busy, run } = useFlash();

    // The Category mode reads every licence, both scopes, because it counts
    // types across the register. The two list modes read their own scope.
    const load = useCallback(
        () => listLicences(isCategory ? {} : { scope: mode.scope }),
        [isCategory, mode.scope],
    );
    const { rows, loading, error, reload } = useCollection(load, { what: 'licences' });

    const scope = actorScope();
    const restricted = Boolean(scope.areaId || scope.officerId);
    const mayWrite = LICENCE_WRITE_ROLES.includes(currentUser?.role);

    const filtered = useMemo(() => {
        const k = search.trim().toLowerCase();
        if (!k) return rows;
        return rows.filter(l => `${l.holderName || ''} ${l.holderId || ''} ${l.licenceNo || ''} ${l.licenceType || ''} ${l.issuingAuthority || ''} ${l.status}`
            .toLowerCase().includes(k));
    }, [rows, search]);

    const counts = useMemo(() => ({
        expired: rows.filter(l => l.status === 'Expired').length,
        soon: rows.filter(l => bandOf(l.status).rank >= 1 && bandOf(l.status).rank <= 3).length,
        active: rows.filter(l => l.status === 'Active').length,
    }), [rows]);

    // ── Actions ──────────────────────────────────────────────────────────

    const openCreate = () => run(async () => {
        // The dealer selector is loaded only when it is needed, and through
        // customerOptions() → listCustomers(), which carries the caller's own
        // scope: an Area Manager can only file a licence against a dealer they
        // can read back afterwards.
        if (mode.scope === 'dealer' && dealers.length === 0) setDealers(await customerOptions());
        setForm({ mode: 'create', editing: null });
    });

    const handleSave = (values) => run(async () => {
        const state = form;
        if (state.mode === 'create') {
            await createLicence({
                scope: mode.scope,
                holderId: mode.scope === 'dealer' ? values.holderId : null,
                holderName: values.holderName,
                licenceType: values.licenceType,
                licenceNo: values.licenceNo.trim(),
                issuingAuthority: values.issuingAuthority.trim(),
                issueDate: values.issueDate,
                expiryDate: values.expiryDate,
                note: values.note.trim() || null,
            });
            say('ok', `${values.licenceType} licence ${values.licenceNo.trim()} saved for ${values.holderName}. Its status is derived from the expiry date, so the Compliance Report and the Dashboard show it immediately.`);
        } else if (state.mode === 'renew') {
            await renewLicence(state.editing.id, {
                licenceNo: values.licenceNo.trim(),
                issueDate: values.issueDate,
                expiryDate: values.expiryDate,
            });
            say('ok', `Renewed to ${values.licenceNo.trim()}, expiring ${values.expiryDate}.`);
        } else {
            await updateLicence(state.editing.id, {
                licenceType: values.licenceType,
                licenceNo: values.licenceNo.trim(),
                issuingAuthority: values.issuingAuthority.trim(),
                issueDate: values.issueDate,
                expiryDate: values.expiryDate,
                note: values.note.trim() || null,
            });
            say('ok', `${values.licenceNo.trim()} updated.`);
        }
        setForm(null);
        await reload();
    });

    // ── Render ───────────────────────────────────────────────────────────

    const notices = (
        <>
            {loading && <Notice tone="info">Loading licences…</Notice>}
            {error && <Notice tone="warn">{error}</Notice>}
            {flash && <Notice tone={flash.tone}>{flash.text}</Notice>}
        </>
    );

    if (isCategory) {
        return (
            <div style={{ fontFamily: 'Arial, sans-serif' }}>
                <div style={{ marginBottom: 20 }}>
                    <h2 style={{ color: '#1a2035', margin: 0 }}>{mode.icon} {mode.title}</h2>
                    <p style={{ color: '#6c757d', fontSize: 13, margin: '4px 0 0' }}>{mode.blurb}</p>
                </div>

                {notices}
                <TypeTable licences={rows} />

                <p style={{ fontSize: 12, color: '#6c757d', marginTop: 12, lineHeight: 1.6 }}>
                    <b>There is no Add button here, and that is the point.</b> A licence type is not a
                    record somebody types in — it is <code>LICENCE_TYPE</code> in{' '}
                    <code>src/services/constants.js</code>, and adding one also means deciding what
                    product category it authorises in <code>LICENCE_FOR_CATEGORY</code>, which is what
                    the point-of-sale rule reads. That mapping lives in code deliberately (schema
                    §4.3): a rule, not data. This screen used to open the <i>licence</i> form, so
                    "+ New Category" appended a row with every column blank — SCREEN-AUDIT.md §2.3.
                    <br />
                    The four counts come from the {rows.length} licences on record, both the company's
                    and dealers'. Expiry bands are derived at read time (decision D5).
                </p>
            </div>
        );
    }

    return (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                <div>
                    <h2 style={{ color: '#1a2035', margin: 0 }}>{mode.icon} {mode.title}</h2>
                    <p style={{ color: '#6c757d', fontSize: 13, margin: '4px 0 0', maxWidth: 640 }}>{mode.blurb}</p>
                </div>
                {mayWrite ? (
                    <button onClick={() => (form ? setForm(null) : openCreate())}
                        style={btn('#0d6efd', { padding: '10px 20px', fontSize: 14 })}>
                        {form ? 'Close' : `+ New ${mode.title}`}
                    </button>
                ) : (
                    <span title={`firestore.rules grants create and update on licences to: ${LICENCE_WRITE_ROLES.join(', ')}`}
                        style={{ fontSize: 12, color: '#856404', background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 6, padding: '8px 12px' }}>
                        Read-only for a {currentUser?.role || 'signed-in user'} — {LICENCE_WRITE_ROLES.join(', ')} may add or renew a licence.
                    </span>
                )}
            </div>

            {notices}

            {/* A dealer list is scoped, so the register a scoped caller can act
                on is too. Saying so matters here for the reason it matters on
                the Compliance Report: "3 expired" out of an area and out of the
                company are different statements. */}
            {mode.scope === 'dealer' && restricted && !loading && (
                <Notice tone="info">
                    <b>Every dealer licence in the company is listed below</b> — <code>licences</code> is
                    readable by anyone signed in, so this table is not scoped. The dealers you may file
                    a <i>new</i> licence against are, to{' '}
                    {scope.areaId ? <>your area — <b>{scope.areaId}</b></> : 'the dealers you are responsible for'}.
                    The Compliance Report and the Dashboard panel show the scoped figures.
                </Notice>
            )}

            {form && (
                <LicenceForm
                    key={`${form.mode}:${form.editing?.id || 'new'}`}
                    mode={form.mode}
                    scope={mode.scope}
                    editing={form.editing}
                    dealers={dealers}
                    busy={busy}
                    onCancel={() => setForm(null)}
                    onSave={handleSave}
                />
            )}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
                <StatCard label="Expired" value={counts.expired} tone={LICENCE_BAND.Expired} hint="supplying is a penalty" />
                <StatCard label="Expiring ≤ 60 days" value={counts.soon} tone={LICENCE_BAND['Expiring (30)']} hint="renew before it lapses" />
                <StatCard label="In date" value={counts.active} tone={LICENCE_BAND.Active} hint="more than 60 days" />
            </div>

            <div style={cardStyle}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#333' }}>
                        &gt; {mode.title} <span style={{ fontWeight: 400, color: '#6c757d' }}>({filtered.length})</span>
                    </div>
                    <input placeholder="🔍 Holder, number, type, authority…" value={search} onChange={e => setSearch(e.target.value)}
                        style={{ ...inp, width: 280, marginLeft: 'auto' }} />
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: 1080, borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#1a2035' }}>
                                <th style={{ ...thS, width: 44 }}>#</th>
                                <th style={{ ...thS, minWidth: 220 }}>{mode.holderLabel}</th>
                                <th style={{ ...thS, width: 110 }}>Type</th>
                                <th style={{ ...thS, width: 150 }}>Licence no.</th>
                                <th style={{ ...thS, minWidth: 160 }}>Issuing authority</th>
                                <th style={{ ...thS, width: 110 }}>Issued</th>
                                <th style={{ ...thS, width: 110 }}>Expires</th>
                                <th style={{ ...thS, width: 120 }}>Days remaining</th>
                                <th style={{ ...thS, width: 130 }}>Status</th>
                                <th style={{ ...thS, width: 130, textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((l, i) => {
                                const band = bandOf(l.status);
                                return (
                                    <tr key={l.id} style={{
                                        background: band.row || (i % 2 === 0 ? 'white' : '#fafafa'),
                                        borderLeft: `4px solid ${band.border}`,
                                    }}>
                                        <td style={{ ...tdS, textAlign: 'center', color: '#adb5bd' }}>{i + 1}</td>
                                        <td style={tdS}>
                                            <div style={{ fontWeight: 600, color: '#1a2035' }}>{l.holderName}</div>
                                            {l.holderId && <div style={{ ...mono, color: '#6c757d' }}>{l.holderId}</div>}
                                        </td>
                                        <td style={tdS}>{l.licenceType}</td>
                                        <td style={{ ...tdS, ...mono, fontWeight: 600 }}>{l.licenceNo}</td>
                                        <td style={{ ...tdS, fontSize: 12, color: '#495057' }}>{l.issuingAuthority}</td>
                                        <td style={{ ...tdS, ...mono }}>{formatDate(l.issueDate) || '—'}</td>
                                        <td style={{ ...tdS, ...mono }}>{formatDate(l.expiryDate) || '—'}</td>
                                        <td style={{ ...tdS, fontWeight: band.rank <= 3 ? 700 : 400, color: band.rank <= 3 ? band.fg : '#495057' }}>
                                            {daysLabel(l.daysRemaining)}
                                        </td>
                                        <td style={tdS}><LicenceBadge status={l.status} /></td>
                                        <td style={{ ...tdS, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                            {mayWrite ? (
                                                <>
                                                    <button title="Edit" disabled={busy}
                                                        onClick={() => setForm({ mode: 'edit', editing: l })}
                                                        style={{ ...btn('#4e73df'), padding: '4px 10px' }}>✎</button>
                                                    <button title="Renew — new number and new dates" disabled={busy}
                                                        onClick={() => setForm({ mode: 'renew', editing: l })}
                                                        style={{ ...btn('#28a745'), padding: '4px 10px', marginLeft: 5 }}>↻</button>
                                                </>
                                            ) : <span style={{ color: '#adb5bd', fontSize: 12 }}>—</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {!loading && filtered.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#adb5bd', padding: 24, fontSize: 13 }}>
                        {rows.length === 0 ? mode.empty : 'No licence matches that search.'}
                    </p>
                )}
            </div>

            <p style={{ fontSize: 12, color: '#6c757d', marginTop: 12, lineHeight: 1.6 }}>
                One collection holds both registers, separated by <code>scope</code> (decision D4), and
                this component serves both modes from a <code>type</code> prop — SCREEN-AUDIT.md §7
                decision 3. Status and days remaining are <b>derived from the expiry date at read
                time and never stored</b> (decision D5), by the same <code>licenceStatus()</code> the
                sale rule calls, so this screen and the Compliance Report cannot disagree about a
                licence.
                <br />
                There is no Delete: <code>firestore.rules</code> refuses it on this collection, and a
                licence that has lapsed is renewed rather than removed — the record of the lapse is
                what the compliance report is for.
            </p>
        </div>
    );
}

export default License;
