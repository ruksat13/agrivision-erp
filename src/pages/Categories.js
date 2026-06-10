import React, { useState } from 'react';

const initialData = {
  'Categories': [
    { id: 1, name: 'Fertilizer', description: 'All types of fertilizer products', totalProduct: 25, status: 'Active' },
    { id: 2, name: 'Pesticide', description: 'Insecticide and fungicide', totalProduct: 18, status: 'Active' },
    { id: 3, name: 'Seeds', description: 'All types of seeds', totalProduct: 32, status: 'Active' },
    { id: 4, name: 'Equipment', description: 'Farming equipment', totalProduct: 10, status: 'Inactive' },
  ],
  'Brand': [
    { id: 1, name: 'ACI', origin: 'Bangladesh', totalProduct: 20, status: 'Active' },
    { id: 2, name: 'Syngenta', origin: 'Switzerland', totalProduct: 15, status: 'Active' },
    { id: 3, name: 'BASF', origin: 'Germany', totalProduct: 12, status: 'Active' },
    { id: 4, name: 'Bayer', origin: 'Germany', totalProduct: 8, status: 'Active' },
  ],
  'Unit': [
    { id: 1, name: 'KG', fullName: 'Kilogram', type: 'Weight', status: 'Active' },
    { id: 2, name: 'GM', fullName: 'Gram', type: 'Weight', status: 'Active' },
    { id: 3, name: 'LTR', fullName: 'Liter', type: 'Volume', status: 'Active' },
    { id: 4, name: 'ML', fullName: 'Milliliter', type: 'Volume', status: 'Active' },
    { id: 5, name: 'PCS', fullName: 'Pieces', type: 'Count', status: 'Active' },
  ],
  'Product Type': [
    { id: 1, name: 'Liquid', description: 'Liquid form products', status: 'Active' },
    { id: 2, name: 'Powder', description: 'Powder form products', status: 'Active' },
    { id: 3, name: 'Granule', description: 'Granule form products', status: 'Active' },
    { id: 4, name: 'Tablet', description: 'Tablet form products', status: 'Active' },
  ],
  'Origin': [
    { id: 1, country: 'Bangladesh', code: 'BD', totalProduct: 45, status: 'Active' },
    { id: 2, country: 'India', code: 'IN', totalProduct: 30, status: 'Active' },
    { id: 3, country: 'China', code: 'CN', totalProduct: 25, status: 'Active' },
    { id: 4, country: 'Germany', code: 'DE', totalProduct: 15, status: 'Active' },
  ],
};

const cardStyle = {
  backgroundColor: 'white',
  borderRadius: '10px',
  padding: '20px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

const icons = {
  'Categories': '🏷️',
  'Brand': '🏢',
  'Unit': '📏',
  'Product Type': '🧪',
  'Origin': '🌍',
};

function Categories({ type = 'Categories' }) {
  const [data, setData] = useState(initialData[type] || []);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', status: 'Active' });

  const filtered = data.filter(d =>
    Object.values(d).some(v => v.toString().toLowerCase().includes(search.toLowerCase()))
  );

  const handleAdd = () => {
    if (!form.name) return;
    setData([...data, { ...form, id: data.length + 1 }]);
    setForm({ name: '', description: '', status: 'Active' });
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
            <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
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

export default Categories;