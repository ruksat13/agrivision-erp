import React, { useState } from 'react';

const initialProducts = [
    { id: 1, sku: 'SKU-T100', name: 'Urea Fertilizer', category: 'Fertilizer', brand: 'ACI', unit: 'KG', type: 'Granule', origin: 'Bangladesh', price: 45, stock: 500, status: 'Active' },
    { id: 2, sku: 'SKU-T101', name: 'DAP Fertilizer', category: 'Fertilizer', brand: 'BASF', unit: 'KG', type: 'Granule', origin: 'Germany', price: 85, stock: 300, status: 'Active' },
    { id: 3, sku: 'SKU-T102', name: 'Imidacloprid', category: 'Pesticide', brand: 'Bayer', unit: 'ML', type: 'Liquid', origin: 'Germany', price: 350, stock: 150, status: 'Active' },
    { id: 4, sku: 'SKU-T103', name: 'Chlorpyrifos', category: 'Pesticide', brand: 'Syngenta', unit: 'LTR', type: 'Liquid', origin: 'Switzerland', price: 420, stock: 80, status: 'Active' },
    { id: 5, sku: 'SKU-T104', name: 'Hybrid Rice Seed', category: 'Seeds', brand: 'ACI', unit: 'KG', type: 'Granule', origin: 'Bangladesh', price: 280, stock: 200, status: 'Inactive' },
];

const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

function Product() {
    const [data, setData] = useState(initialProducts);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        sku: '', name: '', category: '', brand: '', unit: 'KG', type: 'Granule', origin: '', price: '', stock: '', status: 'Active'
    });

    const filtered = data.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.sku.toLowerCase().includes(search.toLowerCase()) ||
        d.category.toLowerCase().includes(search.toLowerCase()) ||
        d.brand.toLowerCase().includes(search.toLowerCase())
    );

    const handleAdd = () => {
        if (!form.sku || !form.name) return;
        setData([...data, { ...form, id: data.length + 1, price: parseFloat(form.price || 0), stock: parseInt(form.stock || 0) }]);
        setForm({ sku: '', name: '', category: '', brand: '', unit: 'KG', type: 'Granule', origin: '', price: '', stock: '', status: 'Active' });
        setShowForm(false);
    };

    const handleDelete = (id) => {
        setData(data.filter(d => d.id !== id));
    };

    const totalProducts = data.length;
    const activeProducts = data.filter(d => d.status === 'Active').length;
    const lowStock = data.filter(d => d.stock < 100).length;
    const totalValue = data.reduce((sum, d) => sum + (d.price * d.stock), 0);

    return (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#1a2035', margin: 0 }}>🌿 Product</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{ backgroundColor: '#0d6efd', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    + New Product
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
                <div style={{ ...cardStyle, textAlign: 'center', borderTop: '4px solid #0d6efd' }}>
                    <p style={{ color: '#6c757d', fontSize: '13px', margin: '0 0 8px' }}>Total Products</p>
                    <p style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#0d6efd' }}>{totalProducts}</p>
                </div>
                <div style={{ ...cardStyle, textAlign: 'center', borderTop: '4px solid #28a745' }}>
                    <p style={{ color: '#6c757d', fontSize: '13px', margin: '0 0 8px' }}>Active</p>
                    <p style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#28a745' }}>{activeProducts}</p>
                </div>
                <div style={{ ...cardStyle, textAlign: 'center', borderTop: '4px solid #dc3545' }}>
                    <p style={{ color: '#6c757d', fontSize: '13px', margin: '0 0 8px' }}>Low Stock</p>
                    <p style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#dc3545' }}>{lowStock}</p>
                </div>
                <div style={{ ...cardStyle, textAlign: 'center', borderTop: '4px solid #6f42c1' }}>
                    <p style={{ color: '#6c757d', fontSize: '13px', margin: '0 0 8px' }}>Total Value</p>
                    <p style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#6f42c1' }}>৳ {totalValue.toLocaleString()}</p>
                </div>
            </div>

            {showForm && (
                <div style={{ ...cardStyle, marginBottom: '20px', borderLeft: '4px solid #0d6efd' }}>
                    <h4 style={{ marginTop: 0, color: '#1a2035' }}>Add New Product</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        <input placeholder="SKU Code" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
                        <input placeholder="Product Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
                        <input placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
                        <input placeholder="Brand" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
                        <input placeholder="Origin" value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
                        <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }}>
                            <option>KG</option>
                            <option>GM</option>
                            <option>LTR</option>
                            <option>ML</option>
                            <option>PCS</option>
                        </select>
                        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }}>
                            <option>Granule</option>
                            <option>Liquid</option>
                            <option>Powder</option>
                            <option>Tablet</option>
                        </select>
                        <input placeholder="Price (৳)" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
                        <input placeholder="Stock Quantity" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }}>
                            <option>Active</option>
                            <option>Inactive</option>
                        </select>
                        <button onClick={handleAdd}
                            style={{ backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', padding: '8px' }}>
                            Save Product
                        </button>
                    </div>
                </div>
            )}

            <div style={cardStyle}>
                <div style={{ marginBottom: '16px' }}>
                    <input
                        placeholder="Search by name, SKU, category or brand..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px', width: '350px' }}
                    />
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                            {['#', 'SKU', 'Name', 'Category', 'Brand', 'Unit', 'Price', 'Stock', 'Status', 'Action'].map(h => (
                                <th key={h} style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((row, i) => (
                            <tr key={row.id} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                <td style={{ padding: '10px 12px' }}>{i + 1}</td>
                                <td style={{ padding: '10px 12px', color: '#0d6efd', fontWeight: 'bold' }}>{row.sku}</td>
                                <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#1a2035' }}>{row.name}</td>
                                <td style={{ padding: '10px 12px' }}>{row.category}</td>
                                <td style={{ padding: '10px 12px' }}>{row.brand}</td>
                                <td style={{ padding: '10px 12px' }}>{row.unit}</td>
                                <td style={{ padding: '10px 12px', fontWeight: 'bold' }}>৳ {row.price}</td>
                                <td style={{ padding: '10px 12px' }}>
                                    <span style={{ color: row.stock < 100 ? '#dc3545' : '#28a745', fontWeight: 'bold' }}>{row.stock}</span>
                                </td>
                                <td style={{ padding: '10px 12px' }}>
                                    <span style={{
                                        backgroundColor: row.status === 'Active' ? '#d4edda' : '#f8d7da',
                                        color: row.status === 'Active' ? '#155724' : '#721c24',
                                        padding: '3px 10px', borderRadius: '20px', fontSize: '12px'
                                    }}>{row.status}</span>
                                </td>
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
                    <p style={{ textAlign: 'center', color: '#adb5bd', padding: '20px' }}>No data found</p>
                )}
            </div>
        </div>
    );
}

export default Product;