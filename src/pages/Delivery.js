import React, { useState } from 'react';

const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

const initialOrders = [
    { id: 1, orderId: 'ADO-2026-06-001', customer: 'Mr. Rahim', area: 'Dhaka', date: '2026-06-01', items: 5, amount: 12500, status: 'Pending' },
    { id: 2, orderId: 'ADO-2026-06-002', customer: 'Ms. Suma', area: 'Chittagong', date: '2026-06-02', items: 3, amount: 7800, status: 'Delivered' },
    { id: 3, orderId: 'ADO-2026-06-003', customer: 'Mr. Karim', area: 'Sylhet', date: '2026-06-03', items: 8, amount: 22000, status: 'In Transit' },
];

const initialChallans = [
    { id: 1, challanId: 'ADC-2026-06-001', doRef: 'ADO-2026-06-001', driver: 'Karim Ali', vehicle: 'Dhaka Metro-1234', date: '2026-06-01', status: 'Delivered' },
    { id: 2, challanId: 'ADC-2026-06-002', doRef: 'ADO-2026-06-003', driver: 'Rahim Hossain', vehicle: 'Sylhet Metro-5678', date: '2026-06-03', status: 'In Transit' },
];

const initialReturns = [
    { id: 1, returnId: 'ADR-2026-06-001', challanRef: 'ADC-2026-06-001', customer: 'Mr. Rahim', date: '2026-06-04', reason: 'Damaged goods', amount: 2500 },
];

const tabs = ['Delivery Order', 'Delivery Challan', 'Return Delivery'];

function Delivery() {
    const [activeTab, setActiveTab] = useState('Delivery Order');
    const [orders, setOrders] = useState(initialOrders);
    const [challans, setChallans] = useState(initialChallans);
    const [returns, setReturns] = useState(initialReturns);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);

    const [orderForm, setOrderForm] = useState({ orderId: '', customer: '', area: '', date: '', items: '', amount: '', status: 'Pending' });
    const [challanForm, setChallanForm] = useState({ challanId: '', doRef: '', driver: '', vehicle: '', date: '', status: 'In Transit' });
    const [returnForm, setReturnForm] = useState({ returnId: '', challanRef: '', customer: '', date: '', reason: '', amount: '' });

    const inputStyle = { padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' };

    const handleAddOrder = () => {
        if (!orderForm.customer || !orderForm.date) return;
        setOrders([...orders, { ...orderForm, id: orders.length + 1, items: Number(orderForm.items), amount: Number(orderForm.amount) }]);
        setOrderForm({ orderId: '', customer: '', area: '', date: '', items: '', amount: '', status: 'Pending' });
        setShowForm(false);
    };

    const handleAddChallan = () => {
        if (!challanForm.driver || !challanForm.date) return;
        setChallans([...challans, { ...challanForm, id: challans.length + 1 }]);
        setChallanForm({ challanId: '', doRef: '', driver: '', vehicle: '', date: '', status: 'In Transit' });
        setShowForm(false);
    };

    const handleAddReturn = () => {
        if (!returnForm.customer || !returnForm.date) return;
        setReturns([...returns, { ...returnForm, id: returns.length + 1, amount: Number(returnForm.amount) }]);
        setReturnForm({ returnId: '', challanRef: '', customer: '', date: '', reason: '', amount: '' });
        setShowForm(false);
    };

    const statusBadge = (status) => {
        const map = {
            'Delivered': { bg: '#d4edda', color: '#155724' },
            'In Transit': { bg: '#fff3cd', color: '#856404' },
            'Pending': { bg: '#cce5ff', color: '#004085' },
        };
        const s = map[status] || { bg: '#e2e3e5', color: '#383d41' };
        return <span style={{ backgroundColor: s.bg, color: s.color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px' }}>{status}</span>;
    };

    const filteredOrders = orders.filter(d =>
        d.customer.toLowerCase().includes(search.toLowerCase()) ||
        d.orderId.toLowerCase().includes(search.toLowerCase())
    );
    const filteredChallans = challans.filter(d =>
        d.driver.toLowerCase().includes(search.toLowerCase()) ||
        d.challanId.toLowerCase().includes(search.toLowerCase())
    );
    const filteredReturns = returns.filter(d =>
        d.customer.toLowerCase().includes(search.toLowerCase()) ||
        d.returnId.toLowerCase().includes(search.toLowerCase())
    );

    // Stats
    const pending = orders.filter(o => o.status === 'Pending').length;
    const inTransit = orders.filter(o => o.status === 'In Transit').length;
    const delivered = orders.filter(o => o.status === 'Delivered').length;
    const totalAmt = orders.reduce((s, o) => s + o.amount, 0);

    return (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#1a2035', margin: 0 }}>🚚 Delivery Management</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{ backgroundColor: '#0d6efd', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
                >
                    + New {activeTab}
                </button>
            </div>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
                {[
                    { label: 'Total Orders', value: orders.length, color: '#0d6efd', bg: '#cce5ff' },
                    { label: 'Pending', value: pending, color: '#856404', bg: '#fff3cd' },
                    { label: 'In Transit', value: inTransit, color: '#fd7e14', bg: '#ffe5d0' },
                    { label: 'Delivered', value: delivered, color: '#155724', bg: '#d4edda' },
                ].map((c, i) => (
                    <div key={i} style={{ ...cardStyle, borderLeft: `4px solid ${c.color}`, padding: '16px 20px' }}>
                        <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>{c.label}</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a2035' }}>{c.value}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {tabs.map(t => (
                    <button key={t} onClick={() => { setActiveTab(t); setSearch(''); setShowForm(false); }}
                        style={{
                            padding: '9px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            fontWeight: '600', fontSize: '13px',
                            backgroundColor: activeTab === t ? '#0d6efd' : 'white',
                            color: activeTab === t ? 'white' : '#555',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                        }}>
                        {t}
                    </button>
                ))}
            </div>

            {/* Form */}
            {showForm && activeTab === 'Delivery Order' && (
                <div style={{ ...cardStyle, marginBottom: '20px', borderLeft: '4px solid #0d6efd' }}>
                    <h4 style={{ marginTop: 0, color: '#1a2035' }}>Add Delivery Order</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        <input placeholder="Order ID" value={orderForm.orderId} onChange={e => setOrderForm({ ...orderForm, orderId: e.target.value })} style={inputStyle} />
                        <input placeholder="Customer Name" value={orderForm.customer} onChange={e => setOrderForm({ ...orderForm, customer: e.target.value })} style={inputStyle} />
                        <input placeholder="Area" value={orderForm.area} onChange={e => setOrderForm({ ...orderForm, area: e.target.value })} style={inputStyle} />
                        <input type="date" value={orderForm.date} onChange={e => setOrderForm({ ...orderForm, date: e.target.value })} style={inputStyle} />
                        <input placeholder="Items" type="number" value={orderForm.items} onChange={e => setOrderForm({ ...orderForm, items: e.target.value })} style={inputStyle} />
                        <input placeholder="Amount" type="number" value={orderForm.amount} onChange={e => setOrderForm({ ...orderForm, amount: e.target.value })} style={inputStyle} />
                        <select value={orderForm.status} onChange={e => setOrderForm({ ...orderForm, status: e.target.value })} style={inputStyle}>
                            <option>Pending</option><option>In Transit</option><option>Delivered</option>
                        </select>
                        <button onClick={handleAddOrder} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Save</button>
                    </div>
                </div>
            )}

            {showForm && activeTab === 'Delivery Challan' && (
                <div style={{ ...cardStyle, marginBottom: '20px', borderLeft: '4px solid #0d6efd' }}>
                    <h4 style={{ marginTop: 0, color: '#1a2035' }}>Add Delivery Challan</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        <input placeholder="Challan ID" value={challanForm.challanId} onChange={e => setChallanForm({ ...challanForm, challanId: e.target.value })} style={inputStyle} />
                        <input placeholder="Delivery Order Ref" value={challanForm.doRef} onChange={e => setChallanForm({ ...challanForm, doRef: e.target.value })} style={inputStyle} />
                        <input placeholder="Driver Name" value={challanForm.driver} onChange={e => setChallanForm({ ...challanForm, driver: e.target.value })} style={inputStyle} />
                        <input placeholder="Vehicle No" value={challanForm.vehicle} onChange={e => setChallanForm({ ...challanForm, vehicle: e.target.value })} style={inputStyle} />
                        <input type="date" value={challanForm.date} onChange={e => setChallanForm({ ...challanForm, date: e.target.value })} style={inputStyle} />
                        <select value={challanForm.status} onChange={e => setChallanForm({ ...challanForm, status: e.target.value })} style={inputStyle}>
                            <option>In Transit</option><option>Delivered</option>
                        </select>
                        <button onClick={handleAddChallan} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Save</button>
                    </div>
                </div>
            )}

            {showForm && activeTab === 'Return Delivery' && (
                <div style={{ ...cardStyle, marginBottom: '20px', borderLeft: '4px solid #0d6efd' }}>
                    <h4 style={{ marginTop: 0, color: '#1a2035' }}>Add Return Delivery</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        <input placeholder="Return ID" value={returnForm.returnId} onChange={e => setReturnForm({ ...returnForm, returnId: e.target.value })} style={inputStyle} />
                        <input placeholder="Challan Ref" value={returnForm.challanRef} onChange={e => setReturnForm({ ...returnForm, challanRef: e.target.value })} style={inputStyle} />
                        <input placeholder="Customer" value={returnForm.customer} onChange={e => setReturnForm({ ...returnForm, customer: e.target.value })} style={inputStyle} />
                        <input type="date" value={returnForm.date} onChange={e => setReturnForm({ ...returnForm, date: e.target.value })} style={inputStyle} />
                        <input placeholder="Reason" value={returnForm.reason} onChange={e => setReturnForm({ ...returnForm, reason: e.target.value })} style={inputStyle} />
                        <input placeholder="Amount" type="number" value={returnForm.amount} onChange={e => setReturnForm({ ...returnForm, amount: e.target.value })} style={inputStyle} />
                        <button onClick={handleAddReturn} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Save</button>
                    </div>
                </div>
            )}

            {/* Table Card */}
            <div style={cardStyle}>
                <div style={{ marginBottom: '16px' }}>
                    <input
                        placeholder="Search..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ ...inputStyle, width: '300px' }}
                    />
                </div>

                {/* Delivery Order Table */}
                {activeTab === 'Delivery Order' && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8f9fa' }}>
                                {['#', 'Order ID', 'Customer', 'Area', 'Date', 'Items', 'Amount', 'Status', 'Action'].map(h => (
                                    <th key={h} style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((row, i) => (
                                <tr key={row.id} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                    <td style={{ padding: '10px 12px' }}>{i + 1}</td>
                                    <td style={{ padding: '10px 12px', color: '#0d6efd', fontWeight: 'bold' }}>{row.orderId}</td>
                                    <td style={{ padding: '10px 12px' }}>{row.customer}</td>
                                    <td style={{ padding: '10px 12px' }}>{row.area}</td>
                                    <td style={{ padding: '10px 12px' }}>{row.date}</td>
                                    <td style={{ padding: '10px 12px' }}>{row.items}</td>
                                    <td style={{ padding: '10px 12px', fontWeight: 'bold' }}>৳ {row.amount.toLocaleString()}</td>
                                    <td style={{ padding: '10px 12px' }}>{statusBadge(row.status)}</td>
                                    <td style={{ padding: '10px 12px' }}>
                                        <button onClick={() => setOrders(orders.filter(d => d.id !== row.id))}
                                            style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Delivery Challan Table */}
                {activeTab === 'Delivery Challan' && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8f9fa' }}>
                                {['#', 'Challan ID', 'DO Ref', 'Driver', 'Vehicle', 'Date', 'Status', 'Action'].map(h => (
                                    <th key={h} style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredChallans.map((row, i) => (
                                <tr key={row.id} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                    <td style={{ padding: '10px 12px' }}>{i + 1}</td>
                                    <td style={{ padding: '10px 12px', color: '#0d6efd', fontWeight: 'bold' }}>{row.challanId}</td>
                                    <td style={{ padding: '10px 12px' }}>{row.doRef}</td>
                                    <td style={{ padding: '10px 12px' }}>{row.driver}</td>
                                    <td style={{ padding: '10px 12px' }}>{row.vehicle}</td>
                                    <td style={{ padding: '10px 12px' }}>{row.date}</td>
                                    <td style={{ padding: '10px 12px' }}>{statusBadge(row.status)}</td>
                                    <td style={{ padding: '10px 12px' }}>
                                        <button onClick={() => setChallans(challans.filter(d => d.id !== row.id))}
                                            style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Return Delivery Table */}
                {activeTab === 'Return Delivery' && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8f9fa' }}>
                                {['#', 'Return ID', 'Challan Ref', 'Customer', 'Date', 'Reason', 'Amount', 'Action'].map(h => (
                                    <th key={h} style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReturns.map((row, i) => (
                                <tr key={row.id} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                    <td style={{ padding: '10px 12px' }}>{i + 1}</td>
                                    <td style={{ padding: '10px 12px', color: '#0d6efd', fontWeight: 'bold' }}>{row.returnId}</td>
                                    <td style={{ padding: '10px 12px' }}>{row.challanRef}</td>
                                    <td style={{ padding: '10px 12px' }}>{row.customer}</td>
                                    <td style={{ padding: '10px 12px' }}>{row.date}</td>
                                    <td style={{ padding: '10px 12px' }}>{row.reason}</td>
                                    <td style={{ padding: '10px 12px', fontWeight: 'bold' }}>৳ {row.amount.toLocaleString()}</td>
                                    <td style={{ padding: '10px 12px' }}>
                                        <button onClick={() => setReturns(returns.filter(d => d.id !== row.id))}
                                            style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {((activeTab === 'Delivery Order' && filteredOrders.length === 0) ||
                    (activeTab === 'Delivery Challan' && filteredChallans.length === 0) ||
                    (activeTab === 'Return Delivery' && filteredReturns.length === 0)) && (
                        <p style={{ textAlign: 'center', color: '#adb5bd', padding: '20px' }}>কোনো ডেটা পাওয়া যায়নি</p>
                    )}
            </div>
        </div>
    );
}

export default Delivery;