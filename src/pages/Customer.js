import React, { useState } from 'react';

const initialCustomers = [
  { id: 1, name: 'Mr. Rahim Uddin', phone: '01711-123456', email: 'rahim@email.com', area: 'Mirpur', balance: 15000, status: 'Active' },
  { id: 2, name: 'Ms. Suma Akter', phone: '01812-234567', email: 'suma@email.com', area: 'Gulshan', balance: 8500, status: 'Active' },
  { id: 3, name: 'ABC Agency', phone: '01911-345678', email: 'abc@email.com', area: 'Agrabad', balance: 0, status: 'Inactive' },
  { id: 4, name: 'XYZ Ltd.', phone: '01611-456789', email: 'xyz@email.com', area: 'Zindabazar', balance: 22000, status: 'Active' },
  { id: 5, name: 'Karim Traders', phone: '01511-567890', email: 'karim@email.com', area: 'Rajshahi', balance: 5000, status: 'Active' },
];

const cardStyle = {
  backgroundColor: 'white',
  borderRadius: '10px',
  padding: '20px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

function Customer() {
  const [data, setData] = useState(initialCustomers);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', area: '', balance: '', status: 'Active' });

  const filtered = data.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.phone.includes(search) ||
    d.area.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!form.name || !form.phone) return;
    setData([...data, { ...form, id: data.length + 1, balance: parseFloat(form.balance || 0) }]);
    setForm({ name: '', phone: '', email: '', area: '', balance: '', status: 'Active' });
    setShowForm(false);
  };

  const handleDelete = (id) => {
    setData(data.filter(d => d.id !== id));
  };

  const totalBalance = data.reduce((sum, d) => sum + d.balance, 0);
  const activeCount = data.filter(d => d.status === 'Active').length;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#1a2035', margin: 0 }}>🤝 Customer</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ backgroundColor: '#0d6efd', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
          + New Customer
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <div style={{ ...cardStyle, textAlign: 'center', borderTop: '4px solid #0d6efd' }}>
          <p style={{ color: '#6c757d', fontSize: '13px', margin: '0 0 8px' }}>Total Customers</p>
          <p style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#0d6efd' }}>{data.length}</p>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center', borderTop: '4px solid #28a745' }}>
          <p style={{ color: '#6c757d', fontSize: '13px', margin: '0 0 8px' }}>Active Customers</p>
          <p style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#28a745' }}>{activeCount}</p>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center', borderTop: '4px solid #fd7e14' }}>
          <p style={{ color: '#6c757d', fontSize: '13px', margin: '0 0 8px' }}>Total Due Balance</p>
          <p style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#fd7e14' }}>৳ {totalBalance.toLocaleString()}</p>
        </div>
      </div>

      {showForm && (
        <div style={{ ...cardStyle, marginBottom: '20px', borderLeft: '4px solid #0d6efd' }}>
          <h4 style={{ marginTop: 0, color: '#1a2035' }}>Add New Customer</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <input placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
            <input placeholder="Phone Number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
            <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
            <input placeholder="Area" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
            <input placeholder="Opening Balance" type="number" value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
            <button onClick={handleAdd}
              style={{ backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', padding: '8px' }}>
              Save Customer
            </button>
          </div>
        </div>
      )}

      <div style={cardStyle}>
        <div style={{ marginBottom: '16px' }}>
          <input
            placeholder="Search by name, phone or area..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px', width: '300px' }}
          />
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              {['#', 'Name', 'Phone', 'Email', 'Area', 'Balance', 'Status', 'Action'].map(h => (
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
                <td style={{ padding: '10px 12px' }}>{row.area}</td>
                <td style={{ padding: '10px 12px', fontWeight: 'bold', color: row.balance > 0 ? '#dc3545' : '#28a745' }}>
                  ৳ {row.balance.toLocaleString()}
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

export default Customer;