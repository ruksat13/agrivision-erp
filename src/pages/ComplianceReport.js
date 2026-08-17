import React, { useState, useCallback, useMemo } from 'react';
import { complianceReport, expirySummary, formatDate } from '../services';
import { Notice, useCollection } from '../components/Notice';

// Step 7 of the demo script in docs/INTERNAL-PLAN.md §7, and part 6 of
// Feature 1 in docs/UNIQUE-FEATURES.md §5. Both queries already existed in
// src/services/licences.js and nothing rendered them.
//
// Read-only. complianceReport() returns every DEALER licence with the derived
// status and daysRemaining attached, worst first; expirySummary() returns the
// counts for the 60 / 30 / 7 / expired bands that Feature 1 part 3 describes.
// Neither is recomputed here — the status is derived in one place (decision D5)
// and this screen only paints it.

const thS = { padding: '10px 12px', color: 'white', fontWeight: '600', fontSize: '13px', textAlign: 'left' };
const tdS = { padding: '9px 12px', fontSize: '13px', color: '#333', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' };
const mono = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: '12px' };

/**
 * The bands, worst first. `licenceStatus()` produces exactly these strings, so
 * the table and the rule engine cannot drift apart on what "expiring" means.
 */
const BAND = {
    'Expired': { row: '#fdf2f2', border: '#dc3545', bg: '#f8d7da', fg: '#721c24', rank: 0 },
    'Expiring (7)': { row: '#fff6ef', border: '#fd7e14', bg: '#ffe5d0', fg: '#7a3e00', rank: 1 },
    'Expiring (30)': { row: '#fffdf3', border: '#ffc107', bg: '#fff3cd', fg: '#856404', rank: 2 },
    'Expiring (60)': { row: '#fffef8', border: '#ffe082', bg: '#fff8e1', fg: '#8a6d3b', rank: 3 },
    'Active': { row: null, border: 'transparent', bg: '#d4edda', fg: '#155724', rank: 4 },
    'Unknown': { row: null, border: 'transparent', bg: '#e9ecef', fg: '#495057', rank: 5 },
};

const bandOf = (status) => BAND[status] || BAND.Unknown;

/** "15 days ago" reads better than "-15" in a column somebody has to act on. */
function daysLabel(days) {
    if (days === null || days === undefined) return { text: '—', strong: false };
    if (days < 0) return { text: `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`, strong: true };
    if (days === 0) return { text: 'expires today', strong: true };
    return { text: `${days} day${days === 1 ? '' : 's'}`, strong: days <= 30 };
}

function StatCard({ label, value, tone, hint }) {
    return (
        <div style={{
            background: tone.bg, color: tone.fg, borderRadius: 8, padding: '12px 16px',
            minWidth: 120, flex: '1 1 120px', border: `1px solid ${tone.border === 'transparent' ? tone.bg : tone.border}`,
        }}>
            <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.1 }}>{value}</div>
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>{label}</div>
            {hint && <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{hint}</div>}
        </div>
    );
}

function ComplianceReport() {
    const [problemsOnly, setProblemsOnly] = useState(false);
    const [search, setSearch] = useState('');

    // Both service calls in one loader, so the cards and the table are always
    // from the same read rather than two reads that can disagree.
    const load = useCallback(async () => {
        const [rows, summary] = await Promise.all([complianceReport(), expirySummary({ scope: 'dealer' })]);
        return [{ rows, summary }];
    }, []);

    const { rows: wrapped, loading, error } = useCollection(load, { what: 'the compliance report' });
    const { rows = [], summary = null } = wrapped[0] || {};

    const visible = useMemo(() => rows.filter(r => {
        if (problemsOnly && bandOf(r.status).rank > 3) return false;
        if (search) {
            const k = search.toLowerCase();
            const hay = `${r.holderName || ''} ${r.holderId || ''} ${r.licenceNo || ''} ${r.licenceType || ''} ${r.issuingAuthority || ''}`.toLowerCase();
            if (!hay.includes(k)) return false;
        }
        return true;
    }), [rows, problemsOnly, search]);

    const actionable = rows.filter(r => bandOf(r.status).rank <= 3).length;

    const toggle = (active) => ({
        padding: '7px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        border: `1px solid ${active ? '#dc3545' : '#dee2e6'}`,
        background: active ? '#dc3545' : 'white',
        color: active ? 'white' : '#495057',
    });

    return (
        <div>
            {loading && <Notice tone="info">Loading the compliance report…</Notice>}
            {error && <Notice tone="warn">{error}</Notice>}

            {summary && (
                <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: '16px 20px', marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#333', marginBottom: 12 }}>
                        🪪 Dealer licence position
                        <span style={{ fontWeight: 400, color: '#6c757d' }}> — {summary.total} licences on record</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <StatCard label="Expired" value={summary.expired} tone={BAND.Expired} hint="supplying is a penalty" />
                        <StatCard label="Within 7 days" value={summary.within7} tone={BAND['Expiring (7)']} />
                        <StatCard label="Within 30 days" value={summary.within30} tone={BAND['Expiring (30)']} />
                        <StatCard label="Within 60 days" value={summary.within60} tone={BAND['Expiring (60)']} />
                        <StatCard label="In date" value={summary.active} tone={BAND.Active} hint="more than 60 days" />
                    </div>
                    <div style={{ fontSize: 11, color: '#6c757d', marginTop: 10 }}>
                        The day bands nest, as <code>expirySummary()</code> counts them: a licence with 5 days left
                        is inside all three of 7, 30 and 60. Only <b>Expired</b> and <b>In date</b> are exclusive.
                    </div>
                </div>
            )}

            <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#333' }}>
                        &gt; Compliance Report <span style={{ fontWeight: 400, color: '#6c757d' }}>({visible.length})</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center' }}>
                        <input placeholder="🔍 Dealer, licence no…" value={search} onChange={e => setSearch(e.target.value)}
                            style={{ padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: 6, fontSize: 13, width: 200 }} />
                        <button onClick={() => setProblemsOnly(false)} style={toggle(!problemsOnly)}>All licences</button>
                        <button onClick={() => setProblemsOnly(true)} style={toggle(problemsOnly)}>
                            ⚠ Needs attention ({actionable})
                        </button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: 1080, borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#1a2035' }}>
                                <th style={{ ...thS, width: '44px' }}>#</th>
                                <th style={{ ...thS, minWidth: '230px' }}>Dealer</th>
                                <th style={{ ...thS, width: '150px' }}>Licence no.</th>
                                <th style={{ ...thS, width: '110px' }}>Type</th>
                                <th style={{ ...thS, minWidth: '200px' }}>Issuing authority</th>
                                <th style={{ ...thS, width: '120px' }}>Expiry</th>
                                <th style={{ ...thS, width: '130px' }}>Days remaining</th>
                                <th style={{ ...thS, width: '130px' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((r, i) => {
                                const band = bandOf(r.status);
                                const days = daysLabel(r.daysRemaining);
                                return (
                                    <tr key={r.id} style={{
                                        background: band.row || (i % 2 === 0 ? 'white' : '#fafafa'),
                                        borderLeft: `4px solid ${band.border}`,
                                    }}>
                                        <td style={{ ...tdS, textAlign: 'center', color: '#adb5bd' }}>{i + 1}</td>
                                        <td style={tdS}>
                                            <div style={{ fontWeight: 600, color: '#1a2035' }}>{r.holderName}</div>
                                            <div style={{ ...mono, color: '#6c757d' }}>{r.holderId}</div>
                                        </td>
                                        <td style={{ ...tdS, ...mono, fontWeight: 600 }}>{r.licenceNo}</td>
                                        <td style={tdS}>{r.licenceType}</td>
                                        <td style={{ ...tdS, fontSize: 12, color: '#495057' }}>{r.issuingAuthority}</td>
                                        <td style={{ ...tdS, ...mono }}>{formatDate(r.expiryDate) || '—'}</td>
                                        <td style={{ ...tdS, fontWeight: days.strong ? 700 : 400, color: days.strong ? band.fg : '#495057' }}>
                                            {days.text}
                                        </td>
                                        <td style={tdS}>
                                            <span style={{
                                                background: band.bg, color: band.fg, padding: '3px 10px',
                                                borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                                            }}>{r.status}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {!loading && visible.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#adb5bd', padding: 24, fontSize: 13 }}>
                        {rows.length === 0
                            ? 'No dealer licences on record.'
                            : 'No licence matches that filter.'}
                    </p>
                )}
            </div>

            <p style={{ fontSize: 12, color: '#6c757d', marginTop: 12, lineHeight: 1.6 }}>
                Status and days remaining are derived at read time, never stored (decision D5), so this
                page cannot go stale between runs. Rows are ordered worst first.
                <br />
                <b>Two things this report does not yet show.</b> First, <i>value sold under an expired
                licence</i>, which UNIQUE-FEATURES.md §5 Feature 1 part 6 asks for:
                <code> complianceReport()</code> reads only the <code>licences</code> collection and
                returns no sales figures, and computing it needs a join onto <code>sales</code> that
                does not exist yet. Second, a dealer holding <i>no licence at all</i> — there is no row
                here to carry them, and on the seeded data that is AIC-000006. Both are stated rather
                than quietly omitted.
            </p>
        </div>
    );
}

export default ComplianceReport;
