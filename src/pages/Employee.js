import React, { useState } from 'react';

const initialEmployees = [
  { id: 1, name: 'Karim Ahmed', phone: '01711-111111', email: 'karim@agrivision.com', designation: 'Sales Officer', area: 'Dhaka', salary: 25000, target: 100000, status: 'Active' },
  { id: 2, name: 'Sadia Islam', phone: '01811-222222', email: 'sadia@agrivision.com', designation: 'Sales Officer', area: 'Chittagong', salary: 22000, target: 90000, status: 'Active' },
  { id: 3, name: 'Nazmul Hasan', phone: '01911-333333', email: 'nazmul@agrivision.com', designation: 'Area Manager', area: 'Sylhet', salary: 35000, target: 150000, status: 'Active' },
  { id: 4, name: 'Rahim Uddin', phone: '01611-444444', email: 'rahim@agrivision.com', designation: 'Delivery Man', area: 'Rajshahi', salary: 15000, target: 0, status: 'Active' },
  { id: 5, name: 'Suma Begum', phone: '01511-555555', email: 'suma@agrivision.com', designation: 'Accountant', area: 'Dhaka', salary: 20000, target: 0, status: 'Inactive' },
];

const cardStyle = {
  backgroundColor: 'white',
  borderRadius: '10px',
  padding: '20px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

function Employee({ type = 'List' }) {
  const [data, setData] = useState(initialEmployees);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', designation: '', area: '', salary: '', target: '', status: 'Active' });

  const filtered = data.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.designation.toLowerCase().includes(search.toLowerCase()) ||
    d.area.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!form.name || !form.phone) return;
    setData([...data, { ...form, id: data.length + 1, salary: parseFloat(form.salary || 0), target: parseFloat(form.target || 0) }]);
    setForm({ name: '', phone: '', email: '', designation: '', area: '', salary: '', target: '', status: 'Active' });
    setShowForm(false);
  };

  const handleDelete = (id) => {
    setData(data.filter(d => d.id !== id));
  };

  const activeCount = data.filter(d => d.status === 'Active').length;
  const totalSalary = data.reduce((sum, d) => sum + d.salary, 0);

  if (type === 'Target') {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif' }}>
        <h2 style={{ color: '#1a2035', marginBottom: '20px' }}>🎯 Employee Target</h2>
        <div style={cardStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                {['#', 'Name', 'Designation', 'Area', 'Target', 'Achieved', 'Progress', 'Status'].map(h => (
                  <th key={h} style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.filter(d => d.target > 0).map((row, i) => {
                const achieved = Math.floor(row.target * (0.7 + Math.random() * 0.4));
                const percent = Math.min(Math.round((achieved / row.target) * 100), 100);
                return (
                  <tr key={row.id} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '10px 12px' }}>{i + 1}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 'bold' }}>{row.name}</td>
                    <td style={{ padding: '10px 12px' }}>{row.designation}</td>
                    <td style={{ padding: '10px 12px' }}>{row.area}</td>
                    <td style={{ padding: '10px 12px' }}>৳ {row.target.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px' }}>৳ {achieved.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', width: '150px' }}>
                      <div style={{ backgroundColor: '#f0f0f0', borderRadius: '10px', height: '8px' }}>
                        <div style={{ backgroundColor: percent >= 100 ? '#28a745' : percent >= 70 ? '#fd7e14' : '#dc3545', width: `${percent}%`, height: '8px', borderRadius: '10px' }}></div>
                      </div>
                      <span style={{ fontSize: '11px', color: '#6c757d' }}>{percent}%</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        backgroundColor: percent >= 100 ? '#d4edda' : percent >= 70 ? '#fff3cd' : '#f8d7da',
                        color: percent >= 100 ? '#155724' : percent >= 70 ? '#856404' : '#721c24',
                        padding: '3px 10px', borderRadius: '20px', fontSize: '12px'
                      }}>
                        {percent >= 100 ? 'Achieved' : percent >= 70 ? 'On Track' : 'Behind'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#1a2035', margin: 0 }}>👤 Employee</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ backgroundColor: '#0d6efd', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
          + New Employee
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <div style={{ ...cardStyle, textAlign: 'center', borderTop: '4px solid #0d6efd' }}>
          <p style={{ color: '#6c757d', fontSize: '13px', margin: '0 0 8px' }}>Total Employees</p>
          <p style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#0d6efd' }}>{data.length}</p>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center', borderTop: '4px solid #28a745' }}>
          <p style={{ color: '#6c757d', fontSize: '13px', margin: '0 0 8px' }}>Active Employees</p>
          <p style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#28a745' }}>{activeCount}</p>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center', borderTop: '4px solid #6f42c1' }}>
          <p style={{ color: '#6c757d', fontSize: '13px', margin: '0 0 8px' }}>Total Salary</p>
          <p style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#6f42c1' }}>৳ {totalSalary.toLocaleString()}</p>
        </div>
      </div>

      {showForm && (
        <div style={{ ...cardStyle, marginBottom: '20px', borderLeft: '4px solid #0d6efd' }}>
          <h4 style={{ marginTop: 0, color: '#1a2035' }}>Add New Employee</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <input placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
            <input placeholder="Phone Number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
            <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
            <input placeholder="Designation" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
            <input placeholder="Area" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
            <input placeholder="Salary" type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
            <input placeholder="Monthly Target" type="number" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
            <button onClick={handleAdd}
              style={{ backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', padding: '8px' }}>
              Save Employee
            </button>
          </div>
        </div>
      )}

      <div style={cardStyle}>
        <div style={{ marginBottom: '16px' }}>
          <input
            placeholder="Search by name, designation or area..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px', width: '300px' }}
          />
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              {['#', 'Name', 'Phone', 'Designation', 'Area', 'Salary', 'Status', 'Action'].map(h => (
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
                <td style={{ padding: '10px 12px' }}>{row.designation}</td>
                <td style={{ padding: '10px 12px' }}>{row.area}</td>
                <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#6f42c1' }}>৳ {row.salary.toLocaleString()}</td>
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

export default Employee;