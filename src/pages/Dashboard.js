import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const chartData = [
    { month: 'Jul-25', Sales: 180000, Collection: 150000, Expense: 80000 },
    { month: 'Aug-25', Sales: 220000, Collection: 180000, Expense: 90000 },
    { month: 'Sep-25', Sales: 200000, Collection: 170000, Expense: 85000 },
    { month: 'Oct-25', Sales: 280000, Collection: 230000, Expense: 100000 },
    { month: 'Nov-25', Sales: 260000, Collection: 210000, Expense: 95000 },
    { month: 'Dec-25', Sales: 300000, Collection: 250000, Expense: 110000 },
    { month: 'Jan-26', Sales: 240000, Collection: 200000, Expense: 92000 },
    { month: 'Feb-26', Sales: 210000, Collection: 180000, Expense: 88000 },
    { month: 'Mar-26', Sales: 270000, Collection: 220000, Expense: 105000 },
    { month: 'Apr-26', Sales: 290000, Collection: 240000, Expense: 115000 },
    { month: 'May-26', Sales: 310000, Collection: 260000, Expense: 120000 },
    { month: 'Jun-26', Sales: 250000, Collection: 210000, Expense: 98000 },
];

const recentTransactions = [
    { time: '10 mins ago', type: 'Receive', amount: '৳ 1,200', detail: 'Invoice #125', color: '#28a745' },
    { time: '1 hr ago', type: 'Payment', amount: '৳ 5,000', detail: 'Supplier SUP-102', color: '#dc3545' },
    { time: '3 hrs ago', type: 'Receive', amount: '৳ 2,370', detail: 'Invoice #124', color: '#28a745' },
    { time: '1 day ago', type: 'Expense', amount: '৳ 450', detail: 'Stationery', color: '#fd7e14' },
    { time: '2 days ago', type: 'Receive', amount: '৳ 12,000', detail: 'Invoice #120', color: '#28a745' },
];

const latestOrders = [
    { time: '22 mins ago', invoice: 'AINV-2026-06-001', amount: '৳ 5,555' },
    { time: '27 mins ago', invoice: 'AINV-2026-06-002', amount: '৳ 17,472' },
    { time: '1 hr ago', invoice: 'AINV-2026-06-003', amount: '৳ 7,031' },
    { time: '1 hr ago', invoice: 'AINV-2026-06-004', amount: '৳ 7,031' },
    { time: '2 hrs ago', invoice: 'AINV-2026-06-005', amount: '৳ 5,750' },
];

const recentActivities = [
    { time: '5 mins ago', text: 'Rakibur Rahman logged in.' },
    { time: '30 mins ago', text: 'Nazmul Islam created an order #INV-2025-00125.' },
    { time: '2 hours ago', text: 'Sadia updated supplier payment.' },
    { time: '1 day ago', text: 'Admin created product SKU-T100.' },
];

const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

function StatCard({ label, value, color }) {
    return (
        <div style={{ ...cardStyle, borderTop: `4px solid ${color}`, textAlign: 'center' }}>
            <p style={{ color: '#6c757d', fontSize: '13px', margin: '0 0 8px' }}>{label}</p>
            <p style={{ color: color, fontSize: '22px', fontWeight: 'bold', margin: 0 }}>{value}</p>
        </div>
    );
}

function Dashboard() {
    return (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>

            {/* Scrolling Announcement Banner */}
            <div style={{
                backgroundColor: '#dc3545',
                color: 'white',
                padding: '10px 0',
                marginBottom: '20px',
                borderRadius: '8px',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
            }}>
                <span style={{
                    backgroundColor: '#b02a37',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    marginLeft: '10px',
                    whiteSpace: 'nowrap',
                }}>🔔 নোটিশ</span>
                <marquee behavior="scroll" direction="left" scrollamount="5" style={{ flex: 1 }}>
                    আগামী ১৫ জুলাই ২০২৬ তারিখে Head Office এ মাসিক সেলস মিটিং অনুষ্ঠিত হবে — সকল অফিসারদের উপস্থিত থাকার অনুরোধ করা হচ্ছে। &nbsp;&nbsp;&nbsp;🔔&nbsp;&nbsp;&nbsp; জুন মাসের বকেয়া কালেকশন ৩১ জুলাইয়ের মধ্যে জমা দিতে হবে। &nbsp;&nbsp;&nbsp;🔔&nbsp;&nbsp;&nbsp; নতুন প্রোডাক্ট লিস্ট আপডেট করা হয়েছে — Product পেজ দেখুন।
                </marquee>
            </div>

            <h2 style={{ marginBottom: '20px', color: '#1a2035' }}>📊 Dashboard — Agrivision International</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <StatCard label="Income This Month" value="৳ 1,20,000" color="#0d6efd" />
                <StatCard label="Expense This Month" value="৳ 32,000" color="#dc3545" />
                <StatCard label="Profit This Month" value="৳ 88,000" color="#28a745" />
                <StatCard label="Due Amount" value="৳ 45,000" color="#fd7e14" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <StatCard label="Cash Balance" value="৳ 82,000" color="#6f42c1" />
                <StatCard label="Bank (BRAC)" value="৳ 5,20,000" color="#0dcaf0" />
                <StatCard label="Mobile (Bkash)" value="৳ 64,500" color="#e91e8c" />
            </div>

            <div style={{ ...cardStyle, marginBottom: '24px' }}>
                <h4 style={{ marginBottom: '16px', color: '#1a2035' }}>📅 Last 12 Months Overview</h4>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Sales" fill="#0d6efd" />
                        <Bar dataKey="Collection" fill="#28a745" />
                        <Bar dataKey="Expense" fill="#dc3545" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>

                <div style={cardStyle}>
                    <h4 style={{ marginBottom: '16px', color: '#1a2035' }}>💳 Last 5 Transactions</h4>
                    {recentTransactions.map((t, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                            <div>
                                <span style={{ color: t.color, fontWeight: 'bold', fontSize: '13px' }}>{t.type}</span>
                                <span style={{ color: '#6c757d', fontSize: '12px' }}> — {t.amount}</span>
                                <p style={{ margin: 0, fontSize: '11px', color: '#adb5bd' }}>{t.detail}</p>
                            </div>
                            <span style={{ fontSize: '11px', color: '#adb5bd' }}>{t.time}</span>
                        </div>
                    ))}
                </div>

                <div style={cardStyle}>
                    <h4 style={{ marginBottom: '16px', color: '#1a2035' }}>🧾 Latest Orders</h4>
                    {latestOrders.map((o, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                            <div>
                                <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#0d6efd' }}>{o.invoice}</p>
                                <p style={{ margin: 0, fontSize: '11px', color: '#adb5bd' }}>{o.time}</p>
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#28a745' }}>{o.amount}</span>
                        </div>
                    ))}
                </div>

            </div>

            <div style={cardStyle}>
                <h4 style={{ marginBottom: '16px', color: '#1a2035' }}>🕐 Recent Activities</h4>
                {recentActivities.map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <span style={{ fontSize: '11px', color: '#adb5bd', minWidth: '80px' }}>{a.time}</span>
                        <span style={{ fontSize: '13px', color: '#495057' }}>{a.text}</span>
                    </div>
                ))}
            </div>

        </div>
    );
}

export default Dashboard;