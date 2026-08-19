import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
    listCustomers, listSales, listLicences, expirySummary,
    listSuppliers, listPurchases, listExpenses, listCommissions, listSupplierPayments,
    listAudit, actorScope, formatDate, toDate, money,
} from '../services';
import { useAuth } from '../context/AuthContext';
import { Notice, useCollection } from '../components/Notice';
import { LicenceBadge, LICENCE_BAND, bandOf } from '../components/LicenceBadge';

// The first screen after every login, backed by Firestore.
//
// SCREEN-AUDIT.md §4: every figure here was a hardcoded string. Three different
// dealer counts existed in one app — this screen said 2,074, the Customer master
// said 30, and the database held 30 — and the activity feed named "SKU-T100", a
// product that has never been in the catalogue. A dashboard that invents its own
// numbers is worse than an empty one, because it is the screen people quote.
//
// ── The three treatments ──────────────────────────────────────────────────
// Every tile, chart and panel below is one of:
//
//   WIRED    a service function already answers it honestly.
//   BLANK    the layout is worth keeping and there is no honest source yet, so
//            it shows a dash and says why. More screens land later and the
//            placeholder marks where. A tile showing a dash is honest; a tile
//            showing 2,074 is not.
//   REMOVED  nothing in this system can ever back it. Three went: the scrolling
//            notice (fabricated announcements, with dates already past, and no
//            `notices` collection to ever hold one), the "Account Balances"
//            block (`bank_accounts` carries name/number/bank/branch and NO
//            balance field — schema §10 — so the column could never be filled),
//            and the calendar's week/day/list view switcher (three spans with no
//            handler and no second view behind them). CLAUDE.md §7: a control
//            that cannot be backed is removed, not left dead.
//
// ── Why this screen asks who you are before it reads anything ─────────────
// The dashboard is the one page every role lands on, and the collections behind
// it are not all readable by all of them. A refused read is a permission error
// in the console and a card that cannot say why it is empty, so CAN_READ below
// gates each query on the caller's role. That is CLAUDE.md §6 read forwards:
// never send a query the server will refuse, and never show a figure the role
// is not entitled to as though it were zero.

// ── Which collections a role may READ ────────────────────────────────────
// Transcribed from firestore.rules; the match block each line comes from is
// named. Like OVERRIDE_ROLES and canOverrideRules(), this is one decision
// written twice because Security Rules cannot import JavaScript — but unlike
// that pair, NOTHING here is a control. The server refuses regardless; this map
// only decides whether a query is worth sending. Widen a rule and this may
// safely lag; narrow one and this must follow, or the card comes back empty
// with a console error behind it.
const ADMIN = ['Super Admin', 'Managing Director'];
const CAN_READ = {
    // allow read: if active() — the point-of-sale rule needs it, so everyone has it
    licences: () => true,
    // isAdmin() || myArea() || mine() || Accountant  — row-scoped, see actorScope()
    customers: (r) => [...ADMIN, 'Area Manager', 'Sales Officer', 'Accountant'].includes(r),
    sales: (r) => [...ADMIN, 'Area Manager', 'Sales Officer', 'Accountant'].includes(r),
    // isAdmin() || Storekeeper
    suppliers: (r) => [...ADMIN, 'Storekeeper'].includes(r),
    purchases: (r) => [...ADMIN, 'Storekeeper'].includes(r),
    // isAdmin() || Accountant
    expenses: (r) => [...ADMIN, 'Accountant'].includes(r),
    // isAdmin() only
    commissions: (r) => ADMIN.includes(r),
    supplier_payments: (r) => ADMIN.includes(r),
    // isAdmin() || Area Manager || Accountant
    audit_log: (r) => [...ADMIN, 'Area Manager', 'Accountant'].includes(r),
};

// listSales caps at this many invoices, and the charts say so rather than
// letting a silent cap understate a total. Sales.js uses the same shape.
const SALES_LIMIT = 1000;

const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

const cardColors = {
    blue: 'linear-gradient(135deg, #4a90e2, #0d6efd)',
    green: 'linear-gradient(135deg, #5cb85c, #28a745)',
    amber: 'linear-gradient(135deg, #f5b544, #f0932b)',
    red: 'linear-gradient(135deg, #e2564d, #dc3545)',
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
const weekDays = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const taka = (n) => `৳ ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const count = (n) => Number(n || 0).toLocaleString('en-US');

// The two reasons a tile has no figure, kept short enough for a card.
const notBuilt = (what) => `not yet connected — ${what}`;
const article = (w) => (/^[AEIOU]/i.test(w || '') ? 'an' : 'a');
const notYours = (role) => `not visible to ${role ? `${article(role)} ${role}` : 'your role'}`;

/**
 * One stat card. `value === null` is the BLANK case: a dash, a muted card and a
 * one-line reason. The colour is dropped deliberately — a wall of blue and
 * green with dashes in it still reads as a populated dashboard from across a
 * room, which is the impression this screen is being fixed for.
 */
function StatCard({ label, value, note, color, icon }) {
    const blank = value === null || value === undefined;
    return (
        <div style={{
            background: blank ? '#eef0f4' : cardColors[color],
            borderRadius: '8px',
            padding: '16px 12px',
            textAlign: 'center',
            color: blank ? '#6c757d' : 'white',
            border: blank ? '1px dashed #c6ccd6' : 'none',
            boxShadow: blank ? 'none' : '0 2px 6px rgba(0,0,0,0.12)',
        }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', lineHeight: 1.2, wordBreak: 'break-word' }}>
                {blank ? '—' : value}
            </div>
            <div style={{ fontSize: '12px', marginTop: '6px', opacity: 0.95 }}>{icon} {label}</div>
            {blank && <div style={{ fontSize: '10px', marginTop: '4px', fontStyle: 'italic', lineHeight: 1.35 }}>{note}</div>}
        </div>
    );
}

function Panel({ title, headerColor, children, badge }) {
    return (
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ background: headerColor, color: 'white', padding: '14px 18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {title}
                {badge && <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '4px', padding: '1px 6px', fontSize: '10px' }}>{badge}</span>}
            </div>
            {children}
        </div>
    );
}

/** The "nothing behind this yet" body a kept-but-blank panel shows. */
function BlankBody({ children }) {
    return (
        <div style={{ padding: '18px', fontSize: 12, color: '#6c757d', fontStyle: 'italic', lineHeight: 1.6 }}>
            — {children}
        </div>
    );
}

// ── Feature 1 part 3 — the licence expiry panel ──────────────────────────
//
// docs/UNIQUE-FEATURES.md §5 Feature 1 lists six parts. Part 3 is "Dashboard
// panel: licences expiring in 60 / 30 / 7 days, and those already expired", and
// it is the one thing that document promises which the app did not have —
// expirySummary() has been sitting in src/services/licences.js with no caller.
//
// It agrees with the Compliance Report by construction, in both halves:
//
//   the BANDS  both go through countByBand() in licences.js — one definition
//   the ROWS   expirySummary({ holderIds }) is passed the dealers this caller's
//              own scoped listCustomers() returned, which is the same set
//              complianceReport() narrows its table to. Without that argument
//              an Area Manager would read 23 licences here and 21 there.
//
// 'No licence' counts DEALERS, not licences — a dealer holding nothing has no
// document to be counted in, and that is the worst case in the whole feature.
function LicencePanel({ summary, uncovered, restricted, scopeLabel, mayOpen, onOpen }) {
    const B = LICENCE_BAND;
    const cards = [
        { label: 'No licence', value: uncovered, tone: B['No licence'], hint: 'dealers, nothing on record' },
        { label: 'Expired', value: summary.expired, tone: B.Expired, hint: 'supplying is a penalty' },
        { label: 'Within 7 days', value: summary.within7, tone: B['Expiring (7)'] },
        { label: 'Within 30 days', value: summary.within30, tone: B['Expiring (30)'] },
        { label: 'Within 60 days', value: summary.within60, tone: B['Expiring (60)'] },
        { label: 'In date', value: summary.active, tone: B.Active, hint: 'more than 60 days' },
    ];
    const urgent = summary.expired + (uncovered || 0);

    return (
        <div style={{ ...cardStyle, marginBottom: '20px', borderLeft: `5px solid ${urgent > 0 ? '#dc3545' : '#28a745'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1a2035' }}>🪪 Dealer licence expiry</div>
                <span style={{ fontSize: 12, color: '#6c757d' }}>
                    {summary.total} licence{summary.total === 1 ? '' : 's'} on record
                    {restricted && scopeLabel ? ` · ${scopeLabel}` : ''}
                </span>
                {urgent > 0 && (
                    <LicenceBadge status="Expired" label={`${urgent} need attention now`} style={{ fontSize: 11 }} />
                )}
                {mayOpen && (
                    <button onClick={onOpen} style={{
                        marginLeft: 'auto', background: '#1a2035', color: 'white', border: 'none',
                        borderRadius: 6, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}>
                        Open the Compliance Report →
                    </button>
                )}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {cards.map(c => (
                    <div key={c.label} style={{
                        background: c.tone.bg, color: c.tone.fg, borderRadius: 8, padding: '12px 16px',
                        minWidth: 118, flex: '1 1 118px',
                        border: `1px solid ${c.tone.border === 'transparent' ? c.tone.bg : c.tone.border}`,
                    }}>
                        <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.1 }}>
                            {c.value === null ? '—' : c.value}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>{c.label}</div>
                        <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
                            {c.value === null ? 'dealers are not visible to your role' : c.hint}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ fontSize: 11, color: '#6c757d', marginTop: 10, lineHeight: 1.6 }}>
                The day bands <b>nest</b>, as <code>expirySummary()</code> counts them: a licence with 5
                days left is inside all three of 7, 30 and 60. Only <b>Expired</b> and <b>In date</b> are
                exclusive. Every figure is derived from <code>expiryDate</code> at read time and never
                stored (decision D5), so this panel cannot go stale.
            </div>
        </div>
    );
}

// ── The calendar ─────────────────────────────────────────────────────────
//
// It used to draw two to four "⚠️ Payment Alert: Invoice SAINV" chips per day
// from `(d % 4) + 2`, and a "+N more" from `(d * 7) % 48 + 3`. Nothing was
// behind any of it.
//
// What a calendar in this system can honestly show is licence expiry: every
// licence has a date, and the day one lapses is the day a dealer stops being
// suppliable. It shows BOTH scopes — the company's own Trade, VAT and Import
// papers expire too, and those are the dates that stop the business rather
// than one dealer.
function Calendar({ licences, onOpenLicence }) {
    const [current, setCurrent] = useState(() => new Date());
    const year = current.getFullYear();
    const month = current.getMonth();
    const monthName = current.toLocaleString('en-US', { month: 'long' });

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const lead = (new Date(year, month, 1).getDay() + 1) % 7; // Saturday-first week

    // Local getters throughout — CLAUDE.md §2. A UTC conversion here would put
    // an expiry on the wrong square for every licence dated before 06:00.
    const byDay = useMemo(() => {
        const m = new Map();
        licences.forEach(l => {
            const d = toDate(l.expiryDate);
            if (!d || d.getFullYear() !== year || d.getMonth() !== month) return;
            const key = d.getDate();
            if (!m.has(key)) m.set(key, []);
            m.get(key).push(l);
        });
        return m;
    }, [licences, year, month]);

    const inMonth = [...byDay.values()].reduce((n, a) => n + a.length, 0);

    const cells = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const navBtn = {
        padding: '5px 12px', fontSize: '12px', cursor: 'pointer', borderRadius: '6px',
        border: '1px solid #dee2e6', background: 'white', color: '#495057',
    };

    return (
        <div style={{ ...cardStyle, marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button onClick={() => setCurrent(new Date(year, month - 1, 1))} style={navBtn}>‹</button>
                    <button onClick={() => setCurrent(new Date(year, month + 1, 1))} style={navBtn}>›</button>
                    <button onClick={() => setCurrent(new Date())} style={navBtn}>today</button>
                </div>
                <h3 style={{ margin: 0, color: '#1a2035' }}>🪪 Licence expiry — {monthName} {year}</h3>
                <span style={{ fontSize: 12, color: '#6c757d' }}>
                    {inMonth} licence{inMonth === 1 ? '' : 's'} expire{inMonth === 1 ? 's' : ''} this month
                    {' · '}company-wide
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 'bold', color: '#0d6efd', fontSize: '13px', borderBottom: '1px solid #dee2e6', paddingBottom: '6px' }}>
                {weekDays.map(w => <div key={w}>{w}</div>)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {cells.map((d, i) => {
                    const isFriday = i % 7 === 6;
                    const expiring = d ? (byDay.get(d) || []) : [];
                    return (
                        <div key={i} style={{
                            minHeight: '110px', border: '1px solid #f0f0f0', padding: '4px',
                            background: d ? 'white' : '#fafafa', overflow: 'hidden',
                        }}>
                            {d && (
                                <>
                                    <div style={{ textAlign: 'right', fontSize: '12px', color: '#adb5bd', marginBottom: '2px' }}>{d}</div>
                                    {isFriday && (
                                        <div style={{ background: '#ffc107', color: '#333', fontSize: '10px', padding: '2px 4px', borderRadius: '3px', marginBottom: '2px' }}>
                                            🌙 Weekend
                                        </div>
                                    )}
                                    {expiring.map(l => {
                                        const band = bandOf(l.status);
                                        return (
                                            <div key={l.id}
                                                onClick={onOpenLicence ? () => onOpenLicence(l) : undefined}
                                                title={`${l.holderName} — ${l.licenceType} ${l.licenceNo}, issued by ${l.issuingAuthority}`}
                                                style={{
                                                    background: band.bg, color: band.fg, fontSize: '9px',
                                                    padding: '2px 4px', borderRadius: '3px', marginBottom: '2px',
                                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                    cursor: onOpenLicence ? 'pointer' : 'default', fontWeight: 600,
                                                }}>
                                                🪪 {l.licenceType} · {l.holderName}
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            <p style={{ fontSize: 11, color: '#6c757d', marginTop: 10, lineHeight: 1.6 }}>
                Every chip is a licence from the <code>licences</code> collection, on the day it lapses,
                coloured by the band it will be in — the same palette as the Compliance Report. Company
                licences are shown alongside dealers': a lapsed Trade or Import licence stops the
                business, not one dealer. Friday is the weekend.
                <br />
                <b>This calendar is not scoped, and the panel at the top of the page is.</b>{' '}
                <code>licences</code> is readable by anyone signed in — the sale rule has to check it —
                so every licence in the company appears here whoever is looking, including dealers who
                are not yours. The expiry panel counts only your own, which is why the two can show
                different numbers for the same month.
            </p>
        </div>
    );
}

// ── The screen ───────────────────────────────────────────────────────────

function Dashboard() {
    const { currentUser, hasAccess } = useAuth();
    const navigate = useNavigate();

    const [chartYear, setChartYear] = useState(String(new Date().getFullYear()));
    const [dailyYear, setDailyYear] = useState(String(new Date().getFullYear()));
    const [dailyMonth, setDailyMonth] = useState(MONTHS[new Date().getMonth()]);

    const role = currentUser?.role || null;
    const may = useCallback((c) => CAN_READ[c] !== undefined && CAN_READ[c](role) === true, [role]);

    /**
     * One load for the whole screen, and every query gated on the caller's role.
     *
     * Order matters once: the dealers are read FIRST, because the licence panel
     * has to count the licences of exactly the dealers this caller can see, or
     * it will not agree with the Compliance Report (see LicencePanel above).
     *
     * `licences` is read twice on purpose and it is not a duplicated query: the
     * panel is dealer-scope only and possibly restricted to this caller's
     * dealers, while the calendar shows every licence including the company's
     * own. Two different row sets, 26 documents in the seeded database, and the
     * panel goes through expirySummary() so the band definition stays shared
     * with the report.
     */
    const load = useCallback(async () => {
        const scope = actorScope();
        const restricted = Boolean(scope.areaId || scope.officerId);

        const dealers = may('customers') ? await listCustomers({ status: 'Active' }) : null;
        const holderIds = restricted && dealers ? new Set(dealers.map(d => d.code)) : null;

        const [sales, bands, licences, suppliers, purchases, expenses, commissions, payments, audit] =
            await Promise.all([
                may('sales') ? listSales({ ...scope, limit: SALES_LIMIT }) : null,
                expirySummary({ scope: 'dealer', holderIds }),
                listLicences({}),
                may('suppliers') ? listSuppliers({ status: 'Active' }) : null,
                may('purchases') ? listPurchases() : null,
                may('expenses') ? listExpenses() : null,
                may('commissions') ? listCommissions() : null,
                may('supplier_payments') ? listSupplierPayments() : null,
                may('audit_log') ? listAudit({ limit: 5 }) : null,
            ]);

        return [{
            scope, restricted, dealers, sales, bands, licences,
            suppliers, purchases, expenses, commissions, payments, audit,
        }];
    }, [may]);

    const { rows: wrapped, loading, error } = useCollection(load, { what: 'the dashboard' });
    const d = wrapped[0] || {};

    const {
        scope = {}, restricted = false, dealers = null, sales = null, bands = null,
        licences = [], suppliers = null, purchases = null, expenses = null,
        commissions = null, payments = null, audit = null,
    } = d;

    const scopeLabel = scope.areaId
        ? `your area — ${scope.areaId}`
        : scope.officerId ? 'the dealers you are responsible for' : null;

    // ── Derived figures. Every one of these is a sum over rows that were
    // actually read; nothing is a literal. ───────────────────────────────

    const liveSales = useMemo(() => (sales || []).filter(s => s.status !== 'Cancelled'), [sales]);
    const salesValue = useMemo(() => money(liveSales.reduce((t, s) => t + Number(s.grandTotal || 0), 0)), [liveSales]);
    const dueValue = useMemo(
        () => money((dealers || []).reduce((t, c) => t + Math.max(0, Number(c.balance || 0)), 0)),
        [dealers],
    );
    const payableValue = useMemo(
        () => money((suppliers || []).reduce((t, s) => t + Math.max(0, Number(s.balance || 0)), 0)),
        [suppliers],
    );
    const purchaseValue = useMemo(
        () => money((purchases || []).filter(p => p.status !== 'Cancelled')
            .reduce((t, p) => t + Number(p.grandTotal || 0), 0)),
        [purchases],
    );
    const expenseValue = useMemo(
        () => money((expenses || []).filter(e => e.type === 'Expense' && e.status !== 'Cancelled')
            .reduce((t, e) => t + Number(e.amount || 0), 0)),
        [expenses],
    );
    const commissionValue = useMemo(
        () => money((commissions || []).filter(c => c.status !== 'Cancelled')
            .reduce((t, c) => t + Number(c.amount || 0), 0)),
        [commissions],
    );
    const paymentValue = useMemo(
        () => money((payments || []).filter(p => p.status === 'Approved')
            .reduce((t, p) => t + Number(p.amount || 0), 0)),
        [payments],
    );

    // The licence panel's sixth figure: dealers with no licence document at
    // all. complianceReport() counts it exactly this way, off the same two
    // reads, which is why the two screens agree.
    const uncovered = useMemo(() => {
        if (!dealers) return null;
        const covered = new Set(licences.filter(l => l.scope === 'dealer').map(l => l.holderId));
        return dealers.filter(c => !covered.has(c.code)).length;
    }, [dealers, licences]);

    // ── The stat grid ────────────────────────────────────────────────────
    // Order and wording kept from the screen this replaces. `value: null` is a
    // blank tile and `note` is the reason printed on it.
    const stats = [
        {
            label: 'Total Customers', icon: '👥', color: 'blue',
            value: dealers ? count(dealers.length) : null,
            note: notYours(role),
        },
        {
            label: 'Total Sales', icon: '🛒', color: 'green',
            value: sales ? taka(salesValue) : null, note: notYours(role),
        },
        {
            label: 'Total Orders', icon: '🧾', color: 'blue',
            value: sales ? count(liveSales.length) : null, note: notYours(role),
        },
        {
            label: 'Purchases', icon: '🚜', color: 'amber',
            value: purchases ? taka(purchaseValue) : null, note: notYours(role),
        },
        {
            label: 'Office Loan', icon: '🏦', color: 'red',
            value: null, note: notBuilt('no loan ledger yet'),
        },
        {
            label: 'Office Loan Pay', icon: '🤝', color: 'green',
            value: null, note: notBuilt('no loan ledger yet'),
        },
        {
            label: 'Employee Loan', icon: '💼', color: 'blue',
            value: null, note: notBuilt('/employee-account is sample data'),
        },
        {
            label: 'Employee Loan Pay', icon: '💸', color: 'green',
            value: null, note: notBuilt('/employee-account is sample data'),
        },
        {
            label: 'Total Collection', icon: '⬇️', color: 'blue',
            value: null, note: notBuilt('/cash-collection is sample data'),
        },
        {
            label: 'Supplier Payment', icon: '💳', color: 'amber',
            value: payments ? taka(paymentValue) : null, note: notYours(role),
        },
        {
            label: 'Total Return', icon: '🔄', color: 'red',
            value: null, note: notBuilt('/sales-return is sample data'),
        },
        {
            label: 'Damage Amount', icon: '⚠️', color: 'red',
            value: null, note: notBuilt('/damage is sample data'),
        },
        {
            label: 'Total Expense', icon: '💰', color: 'red',
            value: expenses ? taka(expenseValue) : null, note: notYours(role),
        },
        {
            label: 'Total Commission', icon: '🏆', color: 'green',
            value: commissions ? taka(commissionValue) : null, note: notYours(role),
        },
        {
            label: 'Total Supplier', icon: '🏭', color: 'blue',
            value: suppliers ? count(suppliers.length) : null, note: notYours(role),
        },
        {
            label: 'Total Due', icon: '⬆️', color: 'red',
            value: dealers ? taka(dueValue) : null, note: notYours(role),
        },
        {
            label: 'Payable Amount', icon: '📥', color: 'amber',
            value: suppliers ? taka(payableValue) : null, note: notYours(role),
        },
        {
            // Deliberately blank even for a Super Admin who can read all three
            // of sales, purchases and expenses. Nothing in this system records
            // the COST of what was sold — sale_items carry a unit price, not a
            // unit cost — so "sales − purchases − expenses" on a database whose
            // purchases and expenses are empty would print the entire sales
            // figure as profit. That is the invention this screen is being
            // repaired for, one arithmetic step further away.
            label: 'Approximate Profit', icon: '📊', color: 'green',
            value: null, note: notBuilt('no cost of goods is recorded'),
        },
    ];

    // ── Charts ───────────────────────────────────────────────────────────
    // The Year and Month selects filter these. They used to filter nothing:
    // `monthlyData` was twelve literals and `dailyData` was `(i * 37) % 100`.

    // Offered years come from the data, plus this year — a select whose options
    // are ['2026','2025','2024'] regardless of what is in the database is the
    // same defect in a smaller frame.
    const years = useMemo(() => {
        const s = new Set([String(new Date().getFullYear())]);
        (sales || []).forEach(x => { const t = toDate(x.saleDate); if (t) s.add(String(t.getFullYear())); });
        (expenses || []).forEach(x => { const t = toDate(x.date); if (t) s.add(String(t.getFullYear())); });
        return [...s].sort().reverse();
    }, [sales, expenses]);

    const monthlyData = useMemo(() => {
        const y = Number(chartYear);
        const sale = new Array(12).fill(0);
        const spend = new Array(12).fill(0);
        liveSales.forEach(s => {
            const t = toDate(s.saleDate);
            if (t && t.getFullYear() === y) sale[t.getMonth()] += Number(s.grandTotal || 0);
        });
        (expenses || []).filter(e => e.type === 'Expense' && e.status !== 'Cancelled').forEach(e => {
            const t = toDate(e.date);
            if (t && t.getFullYear() === y) spend[t.getMonth()] += Number(e.amount || 0);
        });
        return MONTHS.map((m, i) => ({
            month: `${m.slice(0, 3)}-${chartYear}`,
            Sales: money(sale[i]),
            Expense: money(spend[i]),
        }));
    }, [liveSales, expenses, chartYear]);

    const dailyData = useMemo(() => {
        const y = Number(dailyYear);
        const m = MONTHS.indexOf(dailyMonth);
        const days = new Date(y, m + 1, 0).getDate();
        const sale = new Array(days + 1).fill(0);
        const spend = new Array(days + 1).fill(0);
        liveSales.forEach(s => {
            const t = toDate(s.saleDate);
            if (t && t.getFullYear() === y && t.getMonth() === m) sale[t.getDate()] += Number(s.grandTotal || 0);
        });
        (expenses || []).filter(e => e.type === 'Expense' && e.status !== 'Cancelled').forEach(e => {
            const t = toDate(e.date);
            if (t && t.getFullYear() === y && t.getMonth() === m) spend[t.getDate()] += Number(e.amount || 0);
        });
        return Array.from({ length: days }, (_, i) => ({
            day: String(i + 1),
            Sales: money(sale[i + 1]),
            Expense: money(spend[i + 1]),
        }));
    }, [liveSales, expenses, dailyYear, dailyMonth]);

    const monthlyTotal = monthlyData.reduce((t, r) => t + r.Sales, 0);
    const dailyTotal = dailyData.reduce((t, r) => t + r.Sales, 0);

    // ── The Accounts panel ───────────────────────────────────────────────
    // Income and Expense for the current calendar month, from `expenses`,
    // which posts both (schema §10: `type` is Expense | Income).
    const thisMonth = useMemo(() => {
        if (!expenses) return null;
        const now = new Date();
        const rows = expenses.filter(e => {
            if (e.status === 'Cancelled') return false;
            const t = toDate(e.date);
            return t && t.getFullYear() === now.getFullYear() && t.getMonth() === now.getMonth();
        });
        const income = money(rows.filter(r => r.type === 'Income').reduce((t, r) => t + Number(r.amount || 0), 0));
        const spend = money(rows.filter(r => r.type === 'Expense').reduce((t, r) => t + Number(r.amount || 0), 0));
        return { income, spend, profit: money(income - spend), n: rows.length };
    }, [expenses]);

    const latestOrders = (sales || []).slice(0, 5);
    const activities = audit || [];

    const selStyle = { padding: '6px 10px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' };

    return (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>

            {loading && <Notice tone="info">Loading the dashboard…</Notice>}
            {error && <Notice tone="warn">{error}</Notice>}

            {/* The same caption the Customer master and the Compliance Report
                carry, for the same reason: these totals mean two different
                things depending on who is signed in. */}
            {restricted && !loading && (
                <Notice tone="info">
                    <b>Scoped to {scopeLabel}.</b>{' '}
                    Dealer, sales and licence figures below cover <b>{dealers ? dealers.length : 0}</b>{' '}
                    dealer{dealers && dealers.length === 1 ? '' : 's'} — they are not company-wide
                    totals. Security Rules restrict what you may read to your own rows, so the
                    dashboard asks only for those.
                </Notice>
            )}

            {/* Feature 1 part 3 — the one panel docs/UNIQUE-FEATURES.md promises
                and the app did not have. */}
            {bands && (
                <LicencePanel
                    summary={bands}
                    uncovered={uncovered}
                    restricted={restricted}
                    scopeLabel={scopeLabel}
                    mayOpen={hasAccess('/compliance-report')}
                    onOpen={() => navigate('/compliance-report')}
                />
            )}

            {/* Stat Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '8px' }}>
                {stats.map((s) => <StatCard key={s.label} {...s} />)}
            </div>
            <p style={{ fontSize: 11, color: '#6c757d', margin: '0 0 24px', lineHeight: 1.6 }}>
                A dashed tile has no figure behind it yet and says why. Nothing here is a literal:
                every number is summed from documents this account is allowed to read, and a tile the
                rules refuse your role shows a dash rather than a zero — zero and "not permitted" are
                different statements.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>

                {/* LEFT COLUMN */}
                <div style={{ flex: '1 1 600px', minWidth: 0 }}>

                    <div style={{ ...cardStyle, marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                            <h4 style={{ margin: 0, color: '#1a2035' }}>📊 Last 12 Months Data</h4>
                            <div>
                                <label style={{ fontSize: '12px', color: '#6c757d', marginRight: '6px' }}>Select Year:</label>
                                <select value={chartYear} onChange={e => setChartYear(e.target.value)} style={selStyle}>
                                    {years.map(y => <option key={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>

                        {sales ? (
                            <>
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={monthlyData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                        <YAxis tick={{ fontSize: 10 }} />
                                        <Tooltip formatter={(v) => taka(v)} />
                                        <Legend />
                                        <Bar dataKey="Sales" fill="#0d6efd" />
                                        {expenses ? <Bar dataKey="Expense" fill="#fd7e14" /> : null}
                                    </BarChart>
                                </ResponsiveContainer>
                                <p style={{ fontSize: 11, color: '#6c757d', margin: '8px 0 0', lineHeight: 1.6 }}>
                                    {monthlyTotal > 0
                                        ? <>Sales in {chartYear}: <b>{taka(monthlyTotal)}</b> across {liveSales.length} invoice{liveSales.length === 1 ? '' : 's'} read (cancelled excluded, most recent {SALES_LIMIT}).</>
                                        : <>No sales recorded in {chartYear}. The Year select reads the invoices themselves — try a year that has some.</>}
                                    {' '}<b>Collection</b> and <b>Return</b> were series on this chart with nothing behind
                                    them: neither <code>collections</code> nor <code>sale_returns</code> exists yet.
                                    {!expenses && ' The Expense series needs a read of `expenses`, which your role does not have.'}
                                </p>
                            </>
                        ) : (
                            <BlankBody>
                                Sales are {notYours(role)}, so this chart has nothing to draw. It reads the
                                {' '}<code>sales</code> collection, which Security Rules restrict to the two admin
                                roles, an Accountant, and an Area Manager or Sales Officer's own rows.
                            </BlankBody>
                        )}
                    </div>

                    <div style={cardStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                            <h4 style={{ margin: 0, color: '#1a2035' }}>📈 Daily Report for {dailyMonth}-{dailyYear}</h4>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <select value={dailyYear} onChange={e => setDailyYear(e.target.value)} style={selStyle}>
                                    {years.map(y => <option key={y}>{y}</option>)}
                                </select>
                                <select value={dailyMonth} onChange={e => setDailyMonth(e.target.value)} style={selStyle}>
                                    {MONTHS.map(m => <option key={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>

                        {sales ? (
                            <>
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={dailyData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="day" tick={{ fontSize: 9 }} interval={0} height={30} />
                                        <YAxis tick={{ fontSize: 10 }} />
                                        <Tooltip formatter={(v) => taka(v)} />
                                        <Legend />
                                        <Bar dataKey="Sales" fill="#0d6efd" />
                                        {expenses ? <Bar dataKey="Expense" fill="#fd7e14" /> : null}
                                    </BarChart>
                                </ResponsiveContainer>
                                <p style={{ fontSize: 11, color: '#6c757d', margin: '8px 0 0', lineHeight: 1.6 }}>
                                    {dailyTotal > 0
                                        ? <>Sales in {dailyMonth} {dailyYear}: <b>{taka(dailyTotal)}</b>.</>
                                        : <>No sales recorded in {dailyMonth} {dailyYear}. Both selects filter the invoices actually read.</>}
                                </p>
                            </>
                        ) : (
                            <BlankBody>Sales are {notYours(role)} — same read as the chart above.</BlankBody>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div style={{ flex: '1 1 320px', minWidth: 0 }}>

                    <Panel title="📊 Accounts Overview" headerColor="linear-gradient(135deg, #5cb85c, #28a745)"
                        badge={thisMonth ? 'THIS MONTH' : null}>
                        {thisMonth ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '18px', borderBottom: '1px solid #f0f0f0' }}>
                                {[
                                    { k: 'Income', v: taka(thisMonth.income), c: '#28a745' },
                                    { k: 'Expense', v: taka(thisMonth.spend), c: '#dc3545' },
                                    { k: 'Profit', v: taka(thisMonth.profit), c: '#0d6efd' },
                                ].map(x => (
                                    <div key={x.k} style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a2035' }}>{x.k}</div>
                                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: x.c, margin: '4px 0', wordBreak: 'break-word' }}>{x.v}</div>
                                        <div style={{ fontSize: '10px', color: '#adb5bd' }}>This Month</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <BlankBody>
                                Income, Expense and Profit read the <code>expenses</code> collection, which posts
                                both directions. It is {notYours(role)}.
                            </BlankBody>
                        )}

                        {thisMonth && (
                            <div style={{ padding: '0 18px 14px', fontSize: 11, color: '#6c757d', lineHeight: 1.6 }}>
                                {thisMonth.n} entr{thisMonth.n === 1 ? 'y' : 'ies'} posted this month. Profit here is
                                income minus expense on the <code>expenses</code> book only — it is not a trading
                                profit, because no cost of goods is recorded.
                            </div>
                        )}

                        {/* "Account Balances" stood here — Cash ৳82,000, Bank (BRAC)
                            ৳5,20,000, Mobile (Bkash) ৳64,500. REMOVED: `bank_accounts`
                            holds name, number, bank, branch and status, and no balance
                            field (schema §10). There is nothing to read, and no screen
                            that would ever write one. */}

                        <div style={{ padding: '14px 18px', borderTop: '1px solid #f0f0f0' }}>
                            <div style={{ fontWeight: 'bold', color: '#1a2035', marginBottom: '4px', fontSize: '14px' }}>Last 5 Transactions</div>
                            <BlankBody>
                                not yet connected. Money movement lands in three places and only one exists:
                                <code> collections</code> (/cash-collection is still sample data) is the main one,
                                <code> supplier_payments</code> and <code>expenses</code> are the others and both are
                                empty. Merging two of the three under this heading would understate the list.
                            </BlankBody>
                        </div>
                    </Panel>

                    <Panel title="🕐 Recent Activities" headerColor="linear-gradient(135deg, #7b6ef0, #6f42c1)">
                        {audit ? (
                            <div style={{ padding: '10px 18px' }}>
                                {activities.map((a, i) => (
                                    <div key={a.id} style={{ padding: '10px 0', borderBottom: i < activities.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                                        <div style={{ fontSize: '12px', color: '#495057' }}>
                                            <b>{a.userName || a.userId}</b>
                                            {a.userRole ? <span style={{ color: '#adb5bd' }}> ({a.userRole})</span> : null}
                                            {' '}<span style={{
                                                background: a.action === 'rule_override' ? '#dc3545' : '#e9ecef',
                                                color: a.action === 'rule_override' ? 'white' : '#495057',
                                                borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 700,
                                            }}>{a.action}</span>
                                            {' '}<span style={{ color: '#6c757d' }}>{a.collection}</span>
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#adb5bd', fontFamily: 'ui-monospace, Menlo, Consolas, monospace', wordBreak: 'break-all' }}>
                                            {a.docId}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#adb5bd' }}>{formatDate(a.at)}</div>
                                    </div>
                                ))}
                                {activities.length === 0 && (
                                    <p style={{ fontSize: 12, color: '#adb5bd', padding: '8px 0' }}>The audit log is empty.</p>
                                )}
                                {/* One link, not five identical "More" buttons — every
                                    one of those went to the same place. */}
                                {hasAccess('/audit-log') && (
                                    <button onClick={() => navigate('/audit-log')} style={{
                                        marginTop: 8, background: '#6f42c1', color: 'white', border: 'none',
                                        borderRadius: 4, padding: '5px 12px', fontSize: 11, cursor: 'pointer',
                                    }}>
                                        Open the audit log →
                                    </button>
                                )}
                            </div>
                        ) : (
                            <BlankBody>
                                The audit log is {notYours(role)}. Security Rules grant <code>audit_log</code> read
                                to the two admin roles, an Area Manager and an Accountant — the roles that may
                                authorise an override, plus the ones who oversee them.
                            </BlankBody>
                        )}
                    </Panel>

                    <Panel title="🧾 Latest Orders" headerColor="linear-gradient(135deg, #ff9f45, #fd7e14)">
                        {sales ? (
                            <div style={{ padding: '10px 18px' }}>
                                {latestOrders.map((o, i) => (
                                    <div key={o.invoiceNo} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < latestOrders.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                                        <div style={{ fontSize: '12px', minWidth: 0 }}>
                                            <div style={{ color: '#adb5bd', fontSize: '11px' }}>
                                                {formatDate(o.saleDate)} · {o.status}
                                            </div>
                                            <span style={{ fontWeight: 'bold', color: '#1a2035' }}>{o.invoiceNo}</span>
                                            {' — '}
                                            <span style={{ color: o.status === 'Cancelled' ? '#adb5bd' : '#28a745', fontWeight: 'bold' }}>
                                                {taka(o.grandTotal)}
                                            </span>
                                            <div style={{ color: '#6c757d', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.customerName}</div>
                                        </div>
                                        {hasAccess('/sales') && (
                                            <button
                                                onClick={() => navigate('/sales', { state: { focusInvoice: o.invoiceNo, focusStatus: o.status } })}
                                                style={{ background: '#fd7e14', color: 'white', border: 'none', borderRadius: '4px', padding: '3px 10px', fontSize: '11px', cursor: 'pointer', flexShrink: 0, marginLeft: '8px' }}>
                                                View
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {latestOrders.length === 0 && (
                                    <p style={{ fontSize: 12, color: '#adb5bd', padding: '8px 0' }}>No invoices yet.</p>
                                )}
                            </div>
                        ) : (
                            <BlankBody>Invoices are {notYours(role)}.</BlankBody>
                        )}
                    </Panel>
                </div>
            </div>

            <Calendar
                licences={licences}
                onOpenLicence={hasAccess('/license-dealer') || hasAccess('/license')
                    ? (l) => navigate(l.scope === 'dealer' ? '/license-dealer' : '/license')
                    : null}
            />
        </div>
    );
}

export default Dashboard;
