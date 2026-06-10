import React, { useState } from 'react';

const initialData = {
    'Office Mapping': [
        { id: 1, officeName: 'Head Office', region: 'Dhaka', area: 'Mirpur', address: 'Mirpur-10, Dhaka', manager: 'Nazmul Hasan', status: 'Active' },
        { id: 2, officeName: 'Chittagong Branch', region: 'Chittagong', area: 'Agrabad', address: 'Agrabad, Chittagong', manager: 'Karim Ahmed', status: 'Active' },
        { id: 3, officeName: 'Sylhet Branch', region: 'Sylhet', area: 'Zindabazar', address: 'Zindabazar, Sylhet', manager: 'Sadia Islam', status: 'Active' },
    ],
    'Region Mapping': [
        { id: 1, regionName: 'Dhaka Region', totalArea: 5, totalOfficer: 8, manager: 'Nazmul Hasan', status: 'Active' },
        { id: 2, regionName: 'Chittagong Region', totalArea: 4, totalOfficer: 6, manager: 'Karim Ahmed', status: 'Active' },
        { id: 3, regionName: 'Sylhet Region', totalArea: 3, totalOfficer: 4, manager: 'Sadia Islam', status: 'Active' },
        { id: 4, regionName: 'Rajshahi Region', totalArea: 3, totalOfficer: 3, manager: 'Rahim Uddin', status: 'Inactive' },
    ],
    'Area Mapping': [
        { id: 1, areaName: 'Mirpur', region: 'Dhaka', officer: 'Karim Ahmed', totalCustomer: 45, status: 'Active' },
        { id: 2, areaName: 'Gulshan', region: 'Dhaka', officer: 'Suma Begum', totalCustomer: 32, status: 'Active' },
        { id: 3, areaName: 'Agrabad', region: 'Chittagong', officer: 'Nazmul Hasan', totalCustomer: 28, status: 'Active' },
        { id: 4, areaName: 'Zindabazar', region: 'Sylhet', officer: 'Sadia Islam', totalCustomer: 19, status: 'Active' },
    ],
};

const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

const icons = {
    'Office Mapping': '🏢',
    'Region Mapping': '🗺️',
    'Area Mapping': '📍',
};

function Mapping({ type = 'Office Mapping' }) {
    const [data, setData] = useState(initialData[type] || []);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', manager: '', status: 'Active' });

    const filtered = data.filter(d =>
        Object.values(d).some(v => v.toString().toLowerCase().includes(search.toLowerCase()))
    );

    const handleAdd = () => {
        if (!form.name) return;
        setData([...data, { ...form, id: data.length + 1 }]);
        setForm({ name: '', manager: '', status: 'Active' });
        setShowForm(false);
    };

    const handleDelete = (id) => {
        setData(data.filter(d => d.id !== id));
    };

    const keys = Object.keys(filtered[0] || {}).filter(k => k !== 'id');

    return (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#1a2035', margin: 0 }}>{icons[type]} {type}</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{ backgroundColor: '#0d6efd', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    + New {type}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                <div style={{ ...cardStyle, textAlign: 'center', borderTop: '4px solid #0d6efd' }}>
                    <p style={{ color: '#6c757d', fontSize: '13px', margin: '0 0 8px' }}>Total</p>
                    <p style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#0d6efd' }}>{data.length}</p>
                </div>
                <div style={{ ...cardStyle, textAlign: 'center', borderTop: '4px solid #28a745' }}>
                    <p style={{ color: '#6c757d', fontSize: '13px', margin: '0 0 8px' }}>Active</p>
                    <p style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#28a745' }}>{data.filter(d => d.status === 'Active').length}</p>
                </div>
                <div style={{ ...cardStyle, textAlign: 'center', borderTop: '4px solid #dc3545' }}>
                    <p style={{ color: '#6c757d', fontSize: '13px', margin: '0 0 8px' }}>Inactive</p>
                    <p style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#dc3545' }}>{data.filter(d => d.status === 'Inactive').length}</p>
                </div>
            </div>

            {showForm && (
                <div style={{ ...cardStyle, marginBottom: '20px', borderLeft: '4px solid #0d6efd' }}>
                    <h4 style={{ marginTop: 0, color: '#1a2035' }}>Add New {type}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
                        <input placeholder="Manager" value={form.manager} onChange={e => setForm({ ...form, manager: e.target.value })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }}>
                            <option>Active</option>
                            <option>Inactive</option>
                        </select>
                        <button onClick={handleAdd}
                            style={{ backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', padding: '8px' }}>
                            Save
                        </button>
                    </div>
                </div>
            )}

            <div style={cardStyle}>
                <div style={{ marginBottom: '16px' }}>
                    <input
                        placeholder="Search..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px', width: '300px' }}
                    />
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>#</th>
                            {keys.map(k => (
                                <th key={k} style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', textTransform: 'capitalize' }}>{k}</th>
                            ))}
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((row, i) => (
                            <tr key={row.id} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                <td style={{ padding: '10px 12px' }}>{i + 1}</td>
                                {keys.map(k => (
                                    <td key={k} style={{ padding: '10px 12px' }}>
                                        {k === 'status' ? (
                                            <span style={{
                                                backgroundColor: row[k] === 'Active' ? '#d4edda' : '#f8d7da',
                                                color: row[k] === 'Active' ? '#155724' : '#721c24',
                                                padding: '3px 10px', borderRadius: '20px', fontSize: '12px'
                                            }}>{row[k]}</span>
                                        ) : row[k]}
                                    </td>
                                ))}
                                <td style={{ padding: '10px 12px' }}>
                                    <button onClick={() => handleDelete(row.id)}
                                        style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filtered.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#adb5bd', padding: '20px' }}>কোনো ডেটা পাওয়া যায়নি</p>
                )}
            </div>
        </div>
    );
}

export default Mapping;