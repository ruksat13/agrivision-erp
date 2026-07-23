import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// ---- Stat cards (top grid) ----
const stats = [
    { label: 'Total Customers', value: '2,074', color: 'blue', icon: '👥' },
    { label: 'Total Sales', value: '1,359,235,751.04', color: 'green', icon: '🛒' },
    { label: 'Total Orders', value: '32,507', color: 'blue', icon: '🧾' },
    { label: 'Purchases', value: '758,269,804.67', color: 'amber', icon: '🚜' },
    { label: 'Office Loan', value: '0.00', color: 'red', icon: '🏦' },
    { label: 'Office Loan Pay', value: '0.00', color: 'green', icon: '🤝' },

    { label: 'Employee Loan', value: '0.00', color: 'blue', icon: '💼' },
    { label: 'Employee Loan Pay', value: '0.00', color: 'green', icon: '💸' },
    { label: 'Total Collection', value: '1,010,999,808.00', color: 'blue', icon: '⬇️' },
    { label: 'Supplier Payment', value: '643,007,256.00', color: 'amber', icon: '💳' },
    { label: 'Total Return', value: '59,445,274.36', color: 'red', icon: '🔄' },
    { label: 'Damage Amount', value: '2,205,347.84', color: 'red', icon: '⚠️' },

    { label: 'Total Expense', value: '337,322,173.40', color: 'red', icon: '💰' },
    { label: 'Total Commission', value: '246,281,246.55', color: 'green', icon: '🏆' },
    { label: 'Total Supplier', value: '88', color: 'blue', icon: '🏭' },
    { label: 'Total Due', value: '197,305,917.35', color: 'red', icon: '⬆️' },
    { label: 'Payable Amount', value: '67,292,210.39', color: 'amber', icon: '📥' },
    { label: 'Approximate Profit', value: '-44,288,095.78', color: 'green', icon: '📊' },
];

const cardColors = {
    blue: 'linear-gradient(135deg, #4a90e2, #0d6efd)',
    green: 'linear-gradient(135deg, #5cb85c, #28a745)',
    amber: 'linear-gradient(135deg, #f5b544, #f0932b)',
    red: 'linear-gradient(135deg, #e2564d, #dc3545)',
};

// ---- 12 months chart ----
const monthlyData = [
    { month: 'Jan-2026', Sales: 220000, Collection: 180000, Expense: 90000, Return: 12000 },
    { month: 'Feb-2026', Sales: 210000, Collection: 175000, Expense: 88000, Return: 9000 },
    { month: 'Mar-2026', Sales: 270000, Collection: 220000, Expense: 105000, Return: 15000 },
    { month: 'Apr-2026', Sales: 290000, Collection: 240000, Expense: 115000, Return: 11000 },
    { month: 'May-2026', Sales: 310000, Collection: 260000, Expense: 120000, Return: 18000 },
    { month: 'Jun-2026', Sales: 250000, Collection: 210000, Expense: 98000, Return: 10000 },
    { month: 'Jul-2026', Sales: 0, Collection: 0, Expense: 0, Return: 0 },
    { month: 'Aug-2026', Sales: 0, Collection: 0, Expense: 0, Return: 0 },
    { month: 'Sep-2026', Sales: 0, Collection: 0, Expense: 0, Return: 0 },
    { month: 'Oct-2026', Sales: 0, Collection: 0, Expense: 0, Return: 0 },
    { month: 'Nov-2026', Sales: 0, Collection: 0, Expense: 0, Return: 0 },
    { month: 'Dec-2026', Sales: 0, Collection: 0, Expense: 0, Return: 0 },
];

// ---- Daily report chart ----
const dailyData = Array.from({ length: 31 }, (_, i) => {
    const seed = (i * 37) % 100;
    return {
        day: `Day ${i + 1}`,
        Sales: Math.round((seed + 10) * 300),
        Collection: Math.round((seed + 5) * 260),
        Expense: Math.round((seed % 40 + 5) * 200),
        Return: Math.round((seed % 20 + 1) * 120),
    };
});

const recentTransactions = [
    { time: '10 mins ago', type: 'Receive', amount: '৳ 1,200', detail: 'Invoice #125', color: '#28a745' },
    { time: '1 hr ago', type: 'Payment', amount: '৳ 5,000', detail: 'Supplier SUP-102', color: '#dc3545' },
    { time: '3 hrs ago', type: 'Receive', amount: '৳ 2,370', detail: 'Invoice #124', color: '#28a745' },
    { time: '1 day ago', type: 'Expense', amount: '৳ 450', detail: 'Stationery', color: '#fd7e14' },
    { time: '2 days ago', type: 'Receive', amount: '৳ 12,000', detail: 'Invoice #120', color: '#28a745' },
];

const recentActivities = [
    { time: '5 minutes ago', text: 'Rakibur Rahman logged in.' },
    { time: '30 minutes ago', text: 'Nazmul Islam created an order #INV-2025-00125.' },
    { time: '2 hours ago', text: 'Sadia updated supplier payment.' },
    { time: '1 day ago', text: 'Admin created product SKU-T100.' },
];

const latestOrders = [
    { time: '8 hrs ago', invoice: 'SAINV-2026-07-0034690', amount: '৳ 21,830' },
    { time: '10 hrs ago', invoice: 'SAINV-2026-07-0034689', amount: '৳ 23,718' },
    { time: '11 hrs ago', invoice: 'SAINV-2026-07-0034688', amount: '৳ 40,571' },
    { time: '11 hrs ago', invoice: 'SAINV-2026-07-0034687', amount: '৳ 0' },
    { time: '11 hrs ago', invoice: 'SAINV-2026-07-0034686', amount: '৳ 100,856' },
];

const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

const years = ['2026', '2025', '2024'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const weekDays = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function StatCard({ label, value, color, icon }) {
    return (
        <div style={{
            background: cardColors[color],
            borderRadius: '8px',
            padding: '16px 12px',
            textAlign: 'center',
            color: 'white',
            boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
        }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', lineHeight: 1.2, wordBreak: 'break-word' }}>{value}</div>
            <div style={{ fontSize: '12px', marginTop: '6px', opacity: 0.95 }}>{icon} {label}</div>
        </div>
    );
}

// ---- Panel with colored header ----
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

// ---- Monthly calendar ----
function Calendar() {
    const [current, setCurrent] = useState(new Date(2026, 6, 1)); // July 2026
    const year = current.getFullYear();
    const month = current.getMonth();
    const monthName = current.toLocaleString('en-US', { month: 'long' });

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const lead = (new Date(year, month, 1).getDay() + 1) % 7; // Saturday-first week

    const cells = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const btn = (active) => ({
        padding: '5px 12px', fontSize: '12px', cursor: 'pointer',
        border: '1px solid #dee2e6',
        background: active ? '#1a2035' : 'white',
        color: active ? 'white' : '#495057',
    });

    return (
        <div style={{ ...cardStyle, marginTop: '16px' }}>
            {/* Calendar toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button onClick={() => setCurrent(new Date(year, month - 1, 1))} style={{ ...btn(false), borderRadius: '6px' }}>‹</button>
                    <button onClick={() => setCurrent(new Date(year, month + 1, 1))} style={{ ...btn(false), borderRadius: '6px' }}>›</button>
                    <button onClick={() => setCurrent(new Date())} style={{ ...btn(false), borderRadius: '6px' }}>today</button>
                </div>
                <h3 style={{ margin: 0, color: '#1a2035' }}>{monthName} {year}</h3>
                <div style={{ display: 'flex' }}>
                    <span style={{ ...btn(true), borderRadius: '6px 0 0 6px' }}>month</span>
                    <span style={btn(false)}>week</span>
                    <span style={btn(false)}>day</span>
                    <span style={{ ...btn(false), borderRadius: '0 6px 6px 0' }}>list</span>
                </div>
            </div>

            {/* Week header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 'bold', color: '#0d6efd', fontSize: '13px', borderBottom: '1px solid #dee2e6', paddingBottom: '6px' }}>
                {weekDays.map(w => <div key={w}>{w}</div>)}
            </div>

            {/* Day cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {cells.map((d, i) => {
                    const isFriday = i % 7 === 6;
                    const alerts = d ? (isFriday ? 0 : Math.min(4, (d % 4) + 2)) : 0;
                    const more = d && !isFriday ? ((d * 7) % 48) + 3 : 0;
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
                                    {Array.from({ length: alerts }).map((_, k) => (
                                        <div key={k} style={{
                                            background: '#dc3545', color: 'white', fontSize: '9px',
                                            padding: '2px 4px', borderRadius: '3px', marginBottom: '2px',
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        }}>
                                            ⚠️ Payment Alert: Invoice SAINV
                                        </div>
                                    ))}
                                    {more > 0 && (
                                        <div style={{ fontSize: '10px', color: '#0d6efd', cursor: 'pointer' }}>+{more} more</div>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function Dashboard() {
    const [showNotice, setShowNotice] = useState(true);
    const [chartYear, setChartYear] = useState('2026');
    const [dailyYear, setDailyYear] = useState('2026');
    const [dailyMonth, setDailyMonth] = useState('July');

    return (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>

            {/* Notice Banner */}
            {showNotice && (
                <div style={{
                    backgroundColor: '#dc3545', color: 'white', padding: '10px 0', marginBottom: '20px',
                    borderRadius: '8px', overflow: 'hidden', whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                    <span style={{
                        backgroundColor: '#b02a37', padding: '4px 12px', borderRadius: '4px',
                        fontSize: '12px', fontWeight: 'bold', marginLeft: '10px', whiteSpace: 'nowrap',
                    }}>🔔 জরুরী নোটিশ</span>
                    {/* eslint-disable-next-line jsx-a11y/no-distracting-elements */}
                    <marquee behavior="scroll" direction="left" scrollamount="5" style={{ flex: 1 }}>
                        আগামী ১৫ জুলাই ২০২৬ তারিখে Head Office এ মাসিক সেলস মিটিং অনুষ্ঠিত হবে — সকল অফিসারদের উপস্থিত থাকার অনুরোধ করা হচ্ছে। &nbsp;&nbsp;&nbsp;🔔&nbsp;&nbsp;&nbsp; জুন মাসের বকেয়া কালেকশন ৩১ জুলাইয়ের মধ্যে জমা দিতে হবে। &nbsp;&nbsp;&nbsp;🔔&nbsp;&nbsp;&nbsp; নতুন প্রোডাক্ট লিস্ট আপডেট করা হয়েছে — Product পেজ দেখুন।
                    </marquee>
                    <button onClick={() => setShowNotice(false)}
                        style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer', padding: '0 14px', lineHeight: 1 }}
                        aria-label="Close notice">×</button>
                </div>
            )}

            {/* Stat Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {stats.map((s) => <StatCard key={s.label} {...s} />)}
            </div>

            {/* Charts (left) + Right panels */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>

                {/* LEFT COLUMN */}
                <div style={{ flex: '1 1 600px', minWidth: 0 }}>

                    {/* Last 12 Months */}
                    <div style={{ ...cardStyle, marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                            <h4 style={{ margin: 0, color: '#1a2035' }}>📊 Last 12 Months Data</h4>
                            <div>
                                <label style={{ fontSize: '12px', color: '#6c757d', marginRight: '6px' }}>Select Year:</label>
                                <select value={chartYear} onChange={e => setChartYear(e.target.value)}
                                    style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }}>
                                    {years.map(y => <option key={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Sales" fill="#0d6efd" />
                                <Bar dataKey="Collection" fill="#28a745" />
                                <Bar dataKey="Expense" fill="#fd7e14" />
                                <Bar dataKey="Return" fill="#dc3545" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Daily Report */}
                    <div style={cardStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                            <h4 style={{ margin: 0, color: '#1a2035' }}>📈 Daily Report for {dailyMonth}-{dailyYear}</h4>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <select value={dailyYear} onChange={e => setDailyYear(e.target.value)}
                                    style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }}>
                                    {years.map(y => <option key={y}>{y}</option>)}
                                </select>
                                <select value={dailyMonth} onChange={e => setDailyMonth(e.target.value)}
                                    style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }}>
                                    {months.map(m => <option key={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={dailyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" tick={{ fontSize: 9 }} interval={0} angle={-45} textAnchor="end" height={50} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Sales" fill="#0d6efd" />
                                <Bar dataKey="Collection" fill="#28a745" />
                                <Bar dataKey="Expense" fill="#fd7e14" />
                                <Bar dataKey="Return" fill="#dc3545" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div style={{ flex: '1 1 320px', minWidth: 0 }}>

                    {/* Accounts Overview */}
                    <Panel title="📊 Accounts Overview" headerColor="linear-gradient(135deg, #5cb85c, #28a745)" badge="UP">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '18px', borderBottom: '1px solid #f0f0f0' }}>
                            {[
                                { k: 'Income', v: '৳ 1,20,000', c: '#28a745' },
                                { k: 'Expense', v: '৳ 32,000', c: '#dc3545' },
                                { k: 'Profit', v: '৳ 88,000', c: '#0d6efd' },
                            ].map(x => (
                                <div key={x.k} style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a2035' }}>{x.k}</div>
                                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: x.c, margin: '4px 0' }}>{x.v}</div>
                                    <div style={{ fontSize: '10px', color: '#adb5bd' }}>This Month</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ padding: '18px' }}>
                            <div style={{ fontWeight: 'bold', color: '#1a2035', marginBottom: '10px', fontSize: '14px' }}>Account Balances</div>
                            {[
                                { k: 'Cash', v: '৳ 82,000' },
                                { k: 'Bank (BRAC)', v: '৳ 5,20,000' },
                                { k: 'Mobile (Bkash)', v: '৳ 64,500' },
                            ].map(b => (
                                <div key={b.k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
                                    <span style={{ color: '#495057' }}>{b.k}</span>
                                    <span style={{ fontWeight: 'bold', color: '#1a2035' }}>{b.v}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ padding: '18px', borderTop: '1px solid #f0f0f0' }}>
                            <div style={{ fontWeight: 'bold', color: '#1a2035', marginBottom: '10px', fontSize: '14px' }}>Last 5 Transactions</div>
                            {recentTransactions.map((t, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < recentTransactions.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                                    <div>
                                        <span style={{ color: t.color, fontWeight: 'bold', fontSize: '12px' }}>{t.type}</span>
                                        <span style={{ color: '#6c757d', fontSize: '12px' }}> — {t.amount}</span>
                                        <div style={{ fontSize: '11px', color: '#adb5bd' }}>{t.detail}</div>
                                    </div>
                                    <span style={{ fontSize: '11px', color: '#adb5bd' }}>{t.time}</span>
                                </div>
                            ))}
                        </div>
                    </Panel>

                    {/* Recent Activities */}
                    <Panel title="🕐 Recent Activities" headerColor="linear-gradient(135deg, #7b6ef0, #6f42c1)">
                        <div style={{ padding: '10px 18px' }}>
                            {recentActivities.map((a, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < recentActivities.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                                    <div style={{ fontSize: '12px', color: '#495057' }}>
                                        <span style={{ color: '#adb5bd' }}>{a.time} </span>{a.text}
                                    </div>
                                    <button style={{ background: '#6f42c1', color: 'white', border: 'none', borderRadius: '4px', padding: '3px 10px', fontSize: '11px', cursor: 'pointer', flexShrink: 0, marginLeft: '8px' }}>More</button>
                                </div>
                            ))}
                        </div>
                    </Panel>

                    {/* Latest Orders */}
                    <Panel title="🧾 Latest Orders" headerColor="linear-gradient(135deg, #ff9f45, #fd7e14)">
                        <div style={{ padding: '10px 18px' }}>
                            {latestOrders.map((o, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < latestOrders.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                                    <div style={{ fontSize: '12px' }}>
                                        <div style={{ color: '#adb5bd', fontSize: '11px' }}>{o.time}</div>
                                        <span style={{ fontWeight: 'bold', color: '#1a2035' }}>{o.invoice}</span> — <span style={{ color: '#28a745', fontWeight: 'bold' }}>{o.amount}</span>
                                    </div>
                                    <button style={{ background: '#fd7e14', color: 'white', border: 'none', borderRadius: '4px', padding: '3px 10px', fontSize: '11px', cursor: 'pointer', flexShrink: 0, marginLeft: '8px' }}>View</button>
                                </div>
                            ))}
                        </div>
                    </Panel>
                </div>
            </div>

            {/* Calendar */}
            <Calendar />

        </div>
    );
}

export default Dashboard;
