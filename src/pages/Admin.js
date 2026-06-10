import React, { useState } from 'react';

const initialAdmins = [
  { id: 1, name: 'Md. Ruksat Hasan Akib', phone: '01711-000001', email: 'ruksat@agrivision.com', role: 'Super Admin', status: 'Active', lastLogin: '2026-06-10 09:00' },
  { id: 2, name: 'Nazmul Islam', phone: '01811-000002', email: 'nazmul@agrivision.com', role: 'Admin', status: 'Active', lastLogin: '2026-06-10 08:45' },
  { id: 3, name: 'Sadia Akter', phone: '01911-000003', email: 'sadia@agrivision.com', role: 'Manager', status: 'Active', lastLogin: '2026-06-09 17:30' },
  { id: 4, name: 'Rahim Uddin', phone: '01611-000004', email: 'rahim@agrivision.com', role: 'Staff', status: 'Inactive', lastLogin: '2026-06-01 10:00' },
];

const cardStyle = {
  backgroundColor: 'white',
  borderRadius: '10px',
  padding: '20px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

const roleColors = {
  'Super Admin': { bg: '#cff4fc', color: '#055160' },
  'Admin': { bg: '#d4edda', color: '#155724' },
  'Manager': { bg: '#fff3cd', color: '#856404' },
  'Staff': { bg: '#f8f9fa', color: '#495057' },
};

function Admin() {
  const [data, setData] = useState(initialAdmins);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', role: 'Staff', status: 'Active' });

  const filtered = data.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.role.toLowerCase().includes(search.toLowerCase()) ||
    d.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!form.name || !form.email) return;
    setData([...data, { ...form, id: data.length + 1, lastLogin: 'Never' }]);
    setForm({ name: '', phone: '', email: '', role: 'Staff', status: 'Active' });
    setShowForm(false);
  };

  const handleDelete = (id) => {
    setData(data.filter(d => d.id !== id));
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#1a2035', margin: 0 }}>🔑 Admin Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ backgroundColor: '#0d6efd', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
          + New Admin
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
        {['Super Admin', 'Admin', 'Manager', 'Staff'].map(role => (
          <div key={role} style={{ ...cardStyle, textAlign: 'center', borderTop: `4px solid ${roleColors[role].color}` }}>
            <p style={{ color: '#6c757d', fontSize: '13px', margin: '0 0 8px' }}>{role}</p>
            <p style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: roleColors[role].color }}>
              {data.filter(d => d.role === role).length}
            </p>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ ...cardStyle, marginBottom: '20px', borderLeft: '4px solid #0d6efd' }}>
          <h4 style={{ marginTop: 0, color: '#1a2035' }}>Add New Admin User</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <input placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
            <input placeholder="Phone Number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
            <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }}>
              <option>Super Admin</option>
              <option>Admin</option>
              <option>Manager</option>
              <option>Staff</option>
            </select>
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
            placeholder="Search by name, role or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px', width: '300px' }}
          />
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              {['#', 'Name', 'Phone', 'Email', 'Role', 'Last Login', 'Status', 'Action'].map(h => (
                <th key={h} style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={row.id} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                <td style={{ padding: '10px 12px' }}>{i + 1}</td>
                <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#1a2035' }}>{row.name}</td>
                <td style={{ padding: '10px 12px' }}>{row.phone}</td>
                <td style={{ padding: '10px 12px', color: '#0d6efd' }}>{row.email}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    backgroundColor: roleColors[row.role]?.bg,
                    color: roleColors[row.role]?.color,
                    padding: '3px 10px', borderRadius: '20px', fontSize: '12px'
                  }}>{row.role}</span>
                </td>
                <td style={{ padding: '10px 12px', color: '#6c757d', fontSize: '12px' }}>{row.lastLogin}</td>
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
          <p style={{ textAlign: 'center', color: '#adb5bd', padding: '20px' }}>কোনো ডেটা পাওয়া যায়নি</p>
        )}
      </div>
    </div>
  );
}

export default Admin;