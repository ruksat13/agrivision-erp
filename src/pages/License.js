import React, { useState } from 'react';

const initialData = {
  'License': [
    { id: 1, name: 'Trade License', number: 'TL-2026-001', issueDate: '2026-01-01', expireDate: '2026-12-31', issuedBy: 'DNCC', status: 'Active' },
    { id: 2, name: 'VAT Registration', number: 'VAT-2026-002', issueDate: '2026-01-15', expireDate: '2027-01-14', issuedBy: 'NBR', status: 'Active' },
    { id: 3, name: 'Pesticide License', number: 'PL-2026-003', issueDate: '2026-02-01', expireDate: '2026-07-31', issuedBy: 'DAE', status: 'Expiring Soon' },
    { id: 4, name: 'Import License', number: 'IL-2025-004', issueDate: '2025-06-01', expireDate: '2026-05-31', issuedBy: 'MOC', status: 'Expired' },
  ],
  'Category': [
    { id: 1, name: 'Trade License', description: 'Business trade license', totalLicense: 1, status: 'Active' },
    { id: 2, name: 'VAT Registration', description: 'VAT registration certificate', totalLicense: 1, status: 'Active' },
    { id: 3, name: 'Pesticide License', description: 'License for pesticide trading', totalLicense: 1, status: 'Active' },
    { id: 4, name: 'Import License', description: 'License for importing goods', totalLicense: 1, status: 'Active' },
  ],
};

const cardStyle = {
  backgroundColor: 'white',
  borderRadius: '10px',
  padding: '20px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

const statusColors = {
  'Active': { bg: '#d4edda', color: '#155724' },
  'Expiring Soon': { bg: '#fff3cd', color: '#856404' },
  'Expired': { bg: '#f8d7da', color: '#721c24' },
};

function License({ type = 'License' }) {
  const [data, setData] = useState(initialData[type] || []);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', number: '', issueDate: '', expireDate: '', issuedBy: '', status: 'Active' });

  const filtered = data.filter(d =>
    Object.values(d).some(v => v.toString().toLowerCase().includes(search.toLowerCase()))
  );

  const handleAdd = () => {
    if (!form.name) return;
    setData([...data, { ...form, id: data.length + 1 }]);
    setForm({ name: '', number: '', issueDate: '', expireDate: '', issuedBy: '', status: 'Active' });
    setShowForm(false);
  };

  const handleDelete = (id) => {
    setData(data.filter(d => d.id !== id));
  };

  const keys = Object.keys(filtered[0] || {}).filter(k => k !== 'id');

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#1a2035', margin: 0 }}>🪪 {type}</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ backgroundColor: '#0d6efd', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
          + New {type}
        </button>
      </div>

      {type === 'License' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
          <div style={{ ...cardStyle, textAlign: 'center', borderTop: '4px solid #28a745' }}>
            <p style={{ color: '#6c757d', fontSize: '13px', margin: '0 0 8px' }}>Active</p>
            <p style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#28a745' }}>{data.filter(d => d.status === 'Active').length}</p>
          </div>
          <div style={{ ...cardStyle, textAlign: 'center', borderTop: '4px solid #fd7e14' }}>
            <p style={{ color: '#6c757d', fontSize: '13px', margin: '0 0 8px' }}>Expiring Soon</p>
            <p style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#fd7e14' }}>{data.filter(d => d.status === 'Expiring Soon').length}</p>
          </div>
          <div style={{ ...cardStyle, textAlign: 'center', borderTop: '4px solid #dc3545' }}>
            <p style={{ color: '#6c757d', fontSize: '13px', margin: '0 0 8px' }}>Expired</p>
            <p style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#dc3545' }}>{data.filter(d => d.status === 'Expired').length}</p>
          </div>
        </div>
      )}

      {showForm && (
        <div style={{ ...cardStyle, marginBottom: '20px', borderLeft: '4px solid #0d6efd' }}>
          <h4 style={{ marginTop: 0, color: '#1a2035' }}>Add New {type}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <input placeholder="License Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
            <input placeholder="License Number" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
            <input placeholder="Issued By" value={form.issuedBy} onChange={e => setForm({ ...form, issuedBy: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
            <div>
              <label style={{ fontSize: '12px', color: '#6c757d', display: 'block', marginBottom: '4px' }}>Issue Date</label>
              <input type="date" value={form.issueDate} onChange={e => setForm({ ...form, issueDate: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px', width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6c757d', display: 'block', marginBottom: '4px' }}>Expire Date</label>
              <input type="date" value={form.expireDate} onChange={e => setForm({ ...form, expireDate: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px', width: '100%' }} />
            </div>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }}>
              <option>Active</option>
              <option>Expiring Soon</option>
              <option>Expired</option>
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
                        backgroundColor: statusColors[row[k]]?.bg || '#f8f9fa',
                        color: statusColors[row[k]]?.color || '#495057',
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

export default License;