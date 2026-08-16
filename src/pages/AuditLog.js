import React, { useState, useCallback, useRef, useEffect } from 'react';
import { listAudit, listOverrides, formatDate, AUDIT_ACTION } from '../services';
import { Notice, useCollection } from '../components/Notice';

// The reader for `audit_log`. Step 5 of the demo script in
// docs/INTERNAL-PLAN.md §7: "open the audit log → the override, the reason, the
// user, the timestamp."
//
// Every one of the fourteen wired collections writes here and nothing read it
// back until now, which made the log a control nobody could inspect.
//
// This screen is read-only by construction. It calls listAudit() and
// listOverrides() from services/audit.js and has no write path at all —
// audit_log is append-only (schema §7), and Security Rules refuse update and
// delete on it even to a Super Admin.
//
// Rule overrides are the reason the screen exists, so they are styled apart
// from the ordinary create/update/delete traffic and their reason is printed in
// full. A reason that has been shortened to fit a column is not evidence.

const thS = { padding: '10px 12px', color: 'white', fontWeight: '600', fontSize: '13px', textAlign: 'left' };
const tdS = { padding: '9px 12px', fontSize: '13px', color: '#333', borderBottom: '1px solid #f0f0f0', verticalAlign: 'top' };
const mono = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: '12px' };

// One badge colour per action. rule_override is the only red one — it should be
// findable by eye in a page of ordinary traffic.
const ACTION_TONE = {
    create: { bg: '#d4edda', fg: '#155724' },
    update: { bg: '#e7f1ff', fg: '#084298' },
    delete: { bg: '#f8d7da', fg: '#721c24' },
    approve: { bg: '#d1ecf1', fg: '#0c5460' },
    rule_override: { bg: '#dc3545', fg: '#ffffff' },
    login: { bg: '#e9ecef', fg: '#495057' },
    logout: { bg: '#e9ecef', fg: '#495057' },
    seed: { bg: '#ede7f6', fg: '#4527a0' },
};

const pad = (n) => String(n).padStart(2, '0');

// The clock half of the stamp. formatDate() supplies the date half in local
// time — core.js:101 explains why the UTC form is banned everywhere in this
// codebase — and these are the matching local getters, so a row's date and its
// time cannot end up on opposite sides of midnight.
const timeOf = (d) => (d ? `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` : '');

function ActionBadge({ action }) {
    const t = ACTION_TONE[action] || ACTION_TONE.login;
    return (
        <span style={{
            background: t.bg, color: t.fg, padding: '3px 9px', borderRadius: 20,
            fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
            textTransform: action === 'rule_override' ? 'uppercase' : 'none',
            letterSpacing: action === 'rule_override' ? '0.4px' : 0,
        }}>
            {action === 'rule_override' ? '⚖ override' : action}
        </span>
    );
}

/**
 * The reason and the rule code.
 *
 * Printed in full and never truncated — `pre-wrap` keeps the manager's own line
 * breaks, `break-word` stops a long word forcing the table wide. For an
 * override the rule code comes from `after.code` and the rule's own refusal
 * text from `after.message`, both written by createSale() in sales.js.
 */
function Detail({ row }) {
    const isOverride = row.action === 'rule_override';
    const code = row.after?.code || null;
    const message = row.after?.message || null;

    if (!isOverride && !row.reason) {
        return <span style={{ color: '#adb5bd', fontSize: 12 }}>—</span>;
    }

    return (
        <div style={{ maxWidth: 520 }}>
            {code && (
                <div style={{ marginBottom: 6 }}>
                    <span style={{ ...mono, background: '#1a2035', color: '#ffd54f', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                        {code}
                    </span>
                    {row.after?.productId && (
                        <span style={{ ...mono, color: '#6c757d', marginLeft: 8 }}>{row.after.productId}</span>
                    )}
                </div>
            )}

            {message && (
                <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 6, lineHeight: 1.5 }}>
                    Rule said: {message}
                </div>
            )}

            {row.reason && (
                <div style={{
                    background: isOverride ? '#fff' : '#f8f9fa',
                    border: `1px solid ${isOverride ? '#f5c6cb' : '#e9ecef'}`,
                    borderRadius: 6, padding: '8px 10px', fontSize: 13, color: '#333',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.55,
                }}>
                    <span style={{ fontWeight: 700, color: isOverride ? '#721c24' : '#495057' }}>
                        {isOverride ? 'Written reason: ' : 'Reason: '}
                    </span>
                    {row.reason}
                </div>
            )}
        </div>
    );
}

function AuditLog() {
    // The one-click override filter. `true` swaps the query for listOverrides().
    const [onlyOverrides, setOnlyOverrides] = useState(false);
    const [limit, setLimit] = useState(100);

    const load = useCallback(
        () => (onlyOverrides ? listOverrides(limit) : listAudit({ limit })),
        [onlyOverrides, limit],
    );

    const { rows, loading, error, reload } = useCollection(load, { what: 'the audit log' });

    // useCollection loads on mount and holds the loader in a ref, so changing
    // the filter does not re-fetch on its own. This effect does it, skipping the
    // first pass so the mount does not fetch twice.
    const first = useRef(true);
    useEffect(() => {
        if (first.current) { first.current = false; return; }
        reload();
    }, [onlyOverrides, limit, reload]);

    const overrideCount = rows.filter(r => r.action === 'rule_override').length;

    const tab = (active) => ({
        padding: '7px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        border: `1px solid ${active ? '#dc3545' : '#dee2e6'}`,
        background: active ? '#dc3545' : 'white',
        color: active ? 'white' : '#495057',
    });

    return (
        <div>
            {loading && <Notice tone="info">Loading the audit log…</Notice>}
            {error && <Notice tone="warn">{error}</Notice>}

            <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#333' }}>
                        &gt; Audit Log <span style={{ fontWeight: 400, color: '#6c757d' }}>({rows.length})</span>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center' }}>
                        <button onClick={() => setOnlyOverrides(false)} style={tab(!onlyOverrides)}>
                            All entries
                        </button>
                        <button onClick={() => setOnlyOverrides(true)} style={tab(onlyOverrides)}>
                            ⚖ Rule overrides only
                        </button>
                        <select value={limit} onChange={e => setLimit(Number(e.target.value))}
                            style={{ padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: 6, fontSize: 13 }}>
                            <option value={100}>Last 100</option>
                            <option value={250}>Last 250</option>
                            <option value={500}>Last 500</option>
                        </select>
                    </div>
                </div>

                {!onlyOverrides && overrideCount > 0 && (
                    <div style={{ padding: '10px 20px', background: '#fff8e1', borderBottom: '1px solid #ffe082', fontSize: 13, color: '#856404' }}>
                        <b>{overrideCount}</b> rule {overrideCount === 1 ? 'override' : 'overrides'} in this page.
                        {' '}Every one carries a written reason — a block cannot be waived without it.
                    </div>
                )}

                {/* minWidth, so the six narrow columns cannot squeeze the reason
                    column to nothing on a laptop — the wrapper scrolls instead.
                    The reason is the column this screen exists for. */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: 1120, borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#1a2035' }}>
                                <th style={{ ...thS, width: '44px' }}>#</th>
                                <th style={{ ...thS, width: '116px' }}>Timestamp</th>
                                <th style={{ ...thS, width: '168px' }}>User</th>
                                <th style={{ ...thS, width: '104px' }}>Role</th>
                                <th style={{ ...thS, width: '104px' }}>Action</th>
                                <th style={{ ...thS, width: '196px' }}>Record</th>
                                <th style={{ ...thS, minWidth: '380px' }}>Rule code &amp; reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, i) => {
                                const isOverride = r.action === 'rule_override';
                                return (
                                    <tr key={r.id} style={{
                                        background: isOverride ? '#fff5f5' : (i % 2 === 0 ? 'white' : '#fafafa'),
                                        borderLeft: isOverride ? '4px solid #dc3545' : '4px solid transparent',
                                    }}>
                                        <td style={{ ...tdS, textAlign: 'center', color: '#adb5bd' }}>{i + 1}</td>
                                        <td style={tdS}>
                                            <div style={{ fontWeight: 600 }}>{formatDate(r.at) || '—'}</div>
                                            <div style={{ ...mono, color: '#6c757d' }}>{timeOf(r.at)}</div>
                                        </td>
                                        <td style={tdS}>
                                            <div style={{ fontWeight: 500 }}>{r.userName || <span style={{ color: '#adb5bd' }}>unnamed</span>}</div>
                                            <div style={{ ...mono, color: '#6c757d' }}>{r.userId}</div>
                                        </td>
                                        <td style={tdS}>{r.userRole || <span style={{ color: '#adb5bd' }}>—</span>}</td>
                                        <td style={tdS}><ActionBadge action={r.action} /></td>
                                        <td style={tdS}>
                                            <div style={{ fontWeight: 500 }}>{r.collection}</div>
                                            <div style={{ ...mono, color: '#6c757d', wordBreak: 'break-all' }}>{r.docId}</div>
                                        </td>
                                        <td style={tdS}><Detail row={r} /></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {!loading && rows.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#adb5bd', padding: 24, fontSize: 13 }}>
                        {onlyOverrides
                            ? 'No rule overrides recorded. Nothing has been waived.'
                            : 'The audit log is empty.'}
                    </p>
                )}
            </div>

            <p style={{ fontSize: 12, color: '#6c757d', marginTop: 12, lineHeight: 1.6 }}>
                Append-only. Entries are written in the same batch as the change they describe, so a
                record and its log entry cannot disagree. Nothing on this screen can edit or remove
                an entry, and Security Rules refuse both — including for a Super Admin.
                Recognised actions: {AUDIT_ACTION.join(', ')}.
            </p>
        </div>
    );
}

export default AuditLog;
