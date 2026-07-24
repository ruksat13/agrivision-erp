import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const stats = [
    { label: 'Total Customers', value: '2,074', color: 'blue', icon: '👥' },
    { label: 'Total Sales', value: '1,35,92,35,751', color: 'green', icon: '🛒' },
    { label: 'Total Orders', value: '32,507', color: 'blue', icon: '🧾' },
    { label: 'Purchases', value: '75,82,69,804', color: 'amber', icon: '🚜' },
    { label: 'Office Loan', value: '0.00', color: 'red', icon: '🏦' },
    { label: 'Office Loan Pay', value: '0.00', color: 'green', icon: '🤝' },
    { label: 'Employee Loan', value: '0.00', color: 'blue', icon: '💼' },
    { label: 'Employee Loan Pay', value: '0.00', color: 'green', icon: '💸' },
    { label: 'Total Collection', value: '1,01,09,99,808', color: 'blue', icon: '⬇️' },
    { label: 'Supplier Payment', value: '64,30,07,256', color: 'amber', icon: '💳' },
    { label: 'Total Return', value: '5,94,45,274', color: 'red', icon: '🔄' },
    { label: 'Damage Amount', value: '22,05,347', color: 'red', icon: '⚠️' },
    { label: 'Total Expense', value: '33,73,22,173', color: 'red', icon: '💰' },
    { label: 'Total Commission', value: '24,62,81,246', color: 'green', icon: '🏆' },
    { label: 'Total Supplier', value: '88', color: 'blue', icon: '🏭' },
    { label: 'Total Due', value: '19,73,05,917', color: 'red', icon: '⬆️' },
    { label: 'Payable Amount', value: '6,72,92,210', color: 'amber', icon: '📥' },
    { label: 'Approx. Profit', value: '-4,42,88,095', color: 'green', icon: '📊' },
];

const cardColors = {
    blue:  { from: '#3b82f6', to: '#1d4ed8' },
    green: { from: '#22c55e', to: '#15803d' },
    amber: { from: '#f59e0b', to: '#b45309' },
    red:   { from: '#ef4444', to: '#b91c1c' },
};

const monthlyData = [
    { month: 'Jan', Sales: 220000, Collection: 180000, Expense: 90000, Return: 12000 },
    { month: 'Feb', Sales: 210000, Collection: 175000, Expense: 88000, Return: 9000 },
    { month: 'Mar', Sales: 270000, Collection: 220000, Expense: 105000, Return: 15000 },
    { month: 'Apr', Sales: 290000, Collection: 240000, Expense: 115000, Return: 11000 },
    { month: 'May', Sales: 310000, Collection: 260000, Expense: 120000, Return: 18000 },
    { month: 'Jun', Sales: 250000, Collection: 210000, Expense: 98000, Return: 10000 },
    { month: 'Jul', Sales: 0, Collection: 0, Expense: 0, Return: 0 },
    { month: 'Aug', Sales: 0, Collection: 0, Expense: 0, Return: 0 },
    { month: 'Sep', Sales: 0, Collection: 0, Expense: 0, Return: 0 },
    { month: 'Oct', Sales: 0, Collection: 0, Expense: 0, Return: 0 },
    { month: 'Nov', Sales: 0, Collection: 0, Expense: 0, Return: 0 },
    { month: 'Dec', Sales: 0, Collection: 0, Expense: 0, Return: 0 },
];

const dailyData = Array.from({ length: 31 }, (_, i) => {
    const seed = (i * 37) % 100;
    return {
        day: `${i + 1}`,
        Sales: Math.round((seed + 10) * 300),
        Collection: Math.round((seed + 5) * 260),
        Expense: Math.round((seed % 40 + 5) * 200),
        Return: Math.round((seed % 20 + 1) * 120),
    };
});

const recentTransactions = [
    { time: '10 mins ago', type: 'Receive', amount: '৳ 1,200', detail: 'Invoice #125', color: '#22c55e' },
    { time: '1 hr ago', type: 'Payment', amount: '৳ 5,000', detail: 'Supplier SUP-102', color: '#ef4444' },
    { time: '3 hrs ago', type: 'Receive', amount: '৳ 2,370', detail: 'Invoice #124', color: '#22c55e' },
    { time: '1 day ago', type: 'Expense', amount: '৳ 450', detail: 'Stationery', color: '#f59e0b' },
    { time: '2 days ago', type: 'Receive', amount: '৳ 12,000', detail: 'Invoice #120', color: '#22c55e' },
];

const recentActivities = [
    { time: '5 minutes ago', text: 'Rakibur Rahman logged in.' },
    { time: '30 minutes ago', text: 'Nazmul Islam created an order #INV-2025-00125.' },
    { time: '2 hours ago', text: 'Sadia updated supplier payment.' },
    { time: '1 day ago', text: 'Admin created product SKU-T100.' },
];

const latestOrders = [
    { time: '8 hrs ago', invoice: 'AINV-2026-07-0034690', amount: '৳ 21,830' },
    { time: '10 hrs ago', invoice: 'AINV-2026-07-0034689', amount: '৳ 23,718' },
    { time: '11 hrs ago', invoice: 'AINV-2026-07-0034688', amount: '৳ 40,571' },
    { time: '11 hrs ago', invoice: 'AINV-2026-07-0034687', amount: '৳ 0' },
    { time: '11 hrs ago', invoice: 'AINV-2026-07-0034686', amount: '৳ 1,00,856' },
];

const years = ['2026', '2025', '2024'];
const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
const weekDays = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const card = {
    backgroundColor: '#fff',
    borderRadius: '14px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
    border: '1px solid #f1f5f9',
};

function StatCard({ label, value, color, icon }) {
    const c = cardColors[color];
    return (
        <div style={{
            background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
            borderRadius: '14px',
            padding: '18px 14px 14px',
            color: 'white',
            boxShadow: `0 4px 14px ${c.from}55`,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            transition: 'transform 0.15s',
            cursor: 'default',
        }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
            <div style={{ fontSize: '22px' }}>{icon}</div>
            <div style={{ fontSize: '17px', fontWeight: '700', letterSpacing: '-0.3px', lineHeight: 1.2, wordBreak: 'break-word' }}>
                ৳ {value}
            </div>
            <div style={{ fontSize: '11px', opacity: 0.88, fontWeight: '500', marginTop: '2px' }}>{label}</div>
        </div>
    );
}

function SectionTitle({ children }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <div style={{ width: '4px', height: '18px', background: '#3b82f6', borderRadius: '4px' }} />
            <h4 style={{ margin: 0, color: '#1e293b', fontSize: '14px', fontWeight: '700' }}>{children}</h4>
        </div>
    );
}

function Panel({ title, accentColor, children }) {
    return (
        <div style={{ ...card, marginBottom: '16px', overflow: 'hidden' }}>
            <div style={{
                background: accentColor,
                color: 'white',
                padding: '13px 18px',
                fontWeight: '700',
                fontSize: '13px',
                letterSpacing: '0.2px',
            }}>
                {title}
            </div>
            {children}
        </div>
    );
}

function Calendar() {
    const [current, setCurrent] = useState(new Date(2026, 6, 1));
    const year = current.getFullYear();
    const month = current.getMonth();
    const monthName = current.toLocaleString('en-US', { month: 'long' });

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const lead = (new Date(year, month, 1).getDay() + 1) % 7;

    const cells = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const navBtn = {
        padding: '5px 12px', fontSize: '12px', cursor: 'pointer',
        border: '1px solid #e2e8f0', borderRadius: '6px',
        background: 'white', color: '#475569', fontWeight: '600',
    };

    return (
        <div style={{ ...card, marginTop: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button onClick={() => setCurrent(new Date(year, month - 1, 1))} style={navBtn}>‹</button>
                    <button onClick={() => setCurrent(new Date(year, month + 1, 1))} style={navBtn}>›</button>
                    <button onClick={() => setCurrent(new Date())} style={{ ...navBtn, color: '#3b82f6', borderColor: '#3b82f6' }}>Today</button>
                </div>
                <h3 style={{ margin: 0, color: '#1e293b', fontSize: '16px', fontWeight: '700' }}>{monthName} {year}</h3>
                <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    {['Month', 'Week', 'Day', 'List'].map((v, i) => (
                        <span key={v} style={{
                            padding: '5px 12px', fontSize: '12px', cursor: 'pointer',
                            background: i === 0 ? '#1e293b' : 'white',
                            color: i === 0 ? 'white' : '#64748b',
                            borderRight: i < 3 ? '1px solid #e2e8f0' : 'none',
                            fontWeight: '500',
                        }}>{v}</span>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: '700', color: '#3b82f6', fontSize: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', marginBottom: '4px' }}>
                {weekDays.map(w => <div key={w}>{w}</div>)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {cells.map((d, i) => {
                    const isFriday = i % 7 === 6;
                    const isToday = d === 24 && month === 6 && year === 2026;
                    const alerts = d && !isFriday ? Math.min(3, (d % 4) + 1) : 0;
                    const more = d && !isFriday ? ((d * 7) % 30) + 2 : 0;
                    return (
                        <div key={i} style={{
                            minHeight: '100px',
                            border: '1px solid #f1f5f9',
                            padding: '4px 5px',
                            background: isFriday ? '#fef9f0' : d ? 'white' : '#fafafa',
                            position: 'relative',
                        }}>
                            {d && (
                                <>
                                    <div style={{
                                        textAlign: 'right', fontSize: '12px', fontWeight: isToday ? '700' : '400',
                                        color: isToday ? 'white' : isFriday ? '#f59e0b' : '#94a3b8',
                                        background: isToday ? '#3b82f6' : 'transparent',
                                        borderRadius: '50%', width: '22px', height: '22px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginLeft: 'auto', marginBottom: '3px',
                                    }}>{d}</div>
                                    {isFriday && (
                                        <div style={{ background: '#fef3c7', color: '#92400e', fontSize: '9px', padding: '2px 4px', borderRadius: '4px', marginBottom: '2px', textAlign: 'center' }}>
                                            🌙 Weekend
                                        </div>
                                    )}
                                    {Array.from({ length: alerts }).map((_, k) => (
                                        <div key={k} style={{
                                            background: '#fee2e2', color: '#991b1b', fontSize: '9px',
                                            padding: '2px 4px', borderRadius: '4px', marginBottom: '2px',
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        }}>
                                            ⚠️ Payment Alert
                                        </div>
                                    ))}
                                    {more > 0 && (
                                        <div style={{ fontSize: '9px', color: '#3b82f6', cursor: 'pointer', fontWeight: '600' }}>+{more} more</div>
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

    const selectStyle = {
        padding: '6px 10px', borderRadius: '8px',
        border: '1px solid #e2e8f0', fontSize: '12px',
        color: '#475569', background: '#f8fafc', cursor: 'pointer',
        outline: 'none',
    };

    return (
        <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}>

            {/* Notice Banner */}
            {showNotice && (
                <div style={{
                    background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                    color: 'white', padding: '10px 0', marginBottom: '22px',
                    borderRadius: '12px', overflow: 'hidden',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
                }}>
                    <span style={{
                        background: 'rgba(0,0,0,0.2)', padding: '4px 14px',
                        fontSize: '11px', fontWeight: '700', marginLeft: '12px',
                        whiteSpace: 'nowrap', borderRadius: '6px', letterSpacing: '0.5px',
                    }}>🔔 জরুরী নোটিশ</span>
                    {/* eslint-disable-next-line jsx-a11y/no-distracting-elements */}
                    <marquee behavior="scroll" direction="left" scrollamount="5" style={{ flex: 1, fontSize: '13px' }}>
                        আগামী ১৫ জুলাই ২০২৬ তারিখে Head Office এ মাসিক সেলস মিটিং অনুষ্ঠিত হবে — সকল অফিসারদের উপস্থিত থাকার অনুরোধ করা হচ্ছে। &nbsp;&nbsp;&nbsp;🔔&nbsp;&nbsp;&nbsp; জুন মাসের বকেয়া কালেকশন ৩১ জুলাইয়ের মধ্যে জমা দিতে হবে। &nbsp;&nbsp;&nbsp;🔔&nbsp;&nbsp;&nbsp; নতুন প্রোডাক্ট লিস্ট আপডেট করা হয়েছে — Product পেজ দেখুন।
                    </marquee>
                    <button onClick={() => setShowNotice(false)} style={{
                        background: 'rgba(0,0,0,0.2)', border: 'none', color: 'white',
                        fontSize: '16px', cursor: 'pointer', padding: '4px 14px',
                        borderRadius: '6px', lineHeight: 1, marginRight: '8px',
                    }}>✕</button>
                </div>
            )}

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {stats.map(s => <StatCard key={s.label} {...s} />)}
            </div>

            {/* Main area */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px' }}>

                {/* LEFT */}
                <div style={{ flex: '1 1 600px', minWidth: 0 }}>

                    {/* 12 Months Chart */}
                    <div style={{ ...card, padding: '22px', marginBottom: '18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                            <SectionTitle>📊 Last 12 Months Data</SectionTitle>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <label style={{ fontSize: '12px', color: '#64748b' }}>Year:</label>
                                <select value={chartYear} onChange={e => setChartYear(e.target.value)} style={selectStyle}>
                                    {years.map(y => <option key={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={270}>
                            <BarChart data={monthlyData} barSize={14}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                <Bar dataKey="Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Collection" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Expense" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Return" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Daily Report Chart */}
                    <div style={{ ...card, padding: '22px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                            <SectionTitle>📈 Daily Report — {dailyMonth} {dailyYear}</SectionTitle>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <select value={dailyYear} onChange={e => setDailyYear(e.target.value)} style={selectStyle}>
                                    {years.map(y => <option key={y}>{y}</option>)}
                                </select>
                                <select value={dailyMonth} onChange={e => setDailyMonth(e.target.value)} style={selectStyle}>
                                    {months.map(m => <option key={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={dailyData} barSize={8}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={2} />
                                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                <Bar dataKey="Sales" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="Collection" fill="#22c55e" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="Expense" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="Return" fill="#ef4444" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* RIGHT */}
                <div style={{ flex: '1 1 300px', minWidth: 0 }}>

                    {/* Accounts Overview */}
                    <Panel title="📊 Accounts Overview" accentColor="linear-gradient(135deg, #22c55e, #15803d)">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', padding: '16px', borderBottom: '1px solid #f1f5f9', gap: '8px' }}>
                            {[
                                { k: 'Income', v: '৳ 1,20,000', c: '#22c55e' },
                                { k: 'Expense', v: '৳ 32,000', c: '#ef4444' },
                                { k: 'Profit', v: '৳ 88,000', c: '#3b82f6' },
                            ].map(x => (
                                <div key={x.k} style={{ textAlign: 'center', padding: '8px', background: '#f8fafc', borderRadius: '10px' }}>
                                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>{x.k}</div>
                                    <div style={{ fontSize: '13px', fontWeight: '800', color: x.c }}>{x.v}</div>
                                    <div style={{ fontSize: '9px', color: '#cbd5e1', marginTop: '2px' }}>This Month</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '10px' }}>Account Balances</div>
                            {[
                                { k: 'Cash', v: '৳ 82,000' },
                                { k: 'Bank (BRAC)', v: '৳ 5,20,000' },
                                { k: 'Mobile (Bkash)', v: '৳ 64,500' },
                            ].map((b, i) => (
                                <div key={b.k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: '12px', borderBottom: i < 2 ? '1px dashed #f1f5f9' : 'none' }}>
                                    <span style={{ color: '#64748b' }}>{b.k}</span>
                                    <span style={{ fontWeight: '700', color: '#1e293b' }}>{b.v}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ padding: '16px' }}>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '10px' }}>Last 5 Transactions</div>
                            {recentTransactions.map((t, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < recentTransactions.length - 1 ? '1px dashed #f1f5f9' : 'none' }}>
                                    <div>
                                        <span style={{ color: t.color, fontWeight: '700', fontSize: '11px' }}>{t.type}</span>
                                        <span style={{ color: '#64748b', fontSize: '11px' }}> — {t.amount}</span>
                                        <div style={{ fontSize: '10px', color: '#cbd5e1' }}>{t.detail}</div>
                                    </div>
                                    <span style={{ fontSize: '10px', color: '#cbd5e1', whiteSpace: 'nowrap' }}>{t.time}</span>
                                </div>
                            ))}
                        </div>
                    </Panel>

                    {/* Recent Activities */}
                    <Panel title="🕐 Recent Activities" accentColor="linear-gradient(135deg, #8b5cf6, #6d28d9)">
                        <div style={{ padding: '10px 16px' }}>
                            {recentActivities.map((a, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < recentActivities.length - 1 ? '1px dashed #f1f5f9' : 'none', gap: '8px' }}>
                                    <div style={{ fontSize: '12px', color: '#475569', flex: 1 }}>
                                        <span style={{ color: '#cbd5e1', fontSize: '10px' }}>{a.time} </span><br />{a.text}
                                    </div>
                                    <button style={{ background: '#ede9fe', color: '#6d28d9', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', flexShrink: 0, fontWeight: '600' }}>More</button>
                                </div>
                            ))}
                        </div>
                    </Panel>

                    {/* Latest Orders */}
                    <Panel title="🧾 Latest Orders" accentColor="linear-gradient(135deg, #f59e0b, #b45309)">
                        <div style={{ padding: '10px 16px' }}>
                            {latestOrders.map((o, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < latestOrders.length - 1 ? '1px dashed #f1f5f9' : 'none', gap: '8px' }}>
                                    <div style={{ fontSize: '12px', flex: 1, minWidth: 0 }}>
                                        <div style={{ color: '#cbd5e1', fontSize: '10px', marginBottom: '2px' }}>{o.time}</div>
                                        <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.invoice}</div>
                                        <div style={{ color: '#22c55e', fontWeight: '700', fontSize: '12px' }}>{o.amount}</div>
                                    </div>
                                    <button style={{ background: '#fef3c7', color: '#b45309', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', flexShrink: 0, fontWeight: '600' }}>View</button>
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
