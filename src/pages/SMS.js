import React, { useState } from 'react';

const initialData = {
  'Campaign': [
    { id: 1, title: 'Eid Special Offer', target: 'All Customers', totalSMS: 150, sent: 150, date: '2026-05-20', status: 'Completed' },
    { id: 2, title: 'New Product Launch', target: 'Dhaka Area', totalSMS: 45, sent: 45, date: '2026-06-01', status: 'Completed' },
    { id: 3, title: 'Payment Reminder', target: 'Due Customers', totalSMS: 30, sent: 18, date: '2026-06-10', status: 'Running' },
  ],
  'SMS': [
    { id: 1, recipient: 'Mr. Rahim', phone: '01711-123456', message: 'Your invoice #125 is ready.', date: '2026-06-10', status: 'Sent' },
    { id: 2, recipient: 'Ms. Suma', phone: '01812-234567', message: 'Payment due reminder.', date: '2026-06-10', status: 'Sent' },
    { id: 3, recipient: 'ABC Agency', phone: '01911-345678', message: 'New offer available.', date: '2026-06-09', status: 'Failed' },
  ],
  'SMS Log': [
    { id: 1, campaign: 'Eid Special Offer', recipient: 'Mr. Rahim', phone: '01711-123456', sentAt: '2026-05-20 10:00', status: 'Delivered' },
    { id: 2, campaign: 'Eid Special Offer', recipient: 'Ms. Suma', phone: '01812-234567', sentAt: '2026-05-20 10:01', status: 'Delivered' },
    { id: 3, campaign: 'New Product Launch', recipient: 'ABC Agency', phone: '01911-345678', sentAt: '2026-06-01 09:00', status: 'Failed' },
    { id: 4, campaign: 'Payment Reminder', recipient: 'XYZ Ltd.', phone: '01611-456789', sentAt: '2026-06-10 11:00', status: 'Delivered' },
  ],
};

const cardStyle = {
  backgroundColor: 'white',
  borderRadius: '10px',
  padding: '20px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

const icons = {
  'Campaign': '📢',
  'SMS': '💬',
  'SMS Log': '📋',
};

const statusColors = {
  'Completed': { bg: '#d4edda', color: '#155724' },
  'Delivered': { bg: '#d4edda', color: '#155724' },
  'Sent': { bg: '#d4edda', color: '#155724' },
  'Running': { bg: '#fff3cd', color: '#856404' },
  'Failed': { bg: '#f8d7da', color: '#721c24' },
};

function SMS({ type = 'SMS' }) {
  const [data, setData] = useState(initialData[type] || []);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ recipient: '', phone: '', message: '', date: '', status: 'Sent' });

  const filtered = data.filter(d =>
    Object.values(d).some(v => v.toString().toLowerCase().includes(search.toLowerCase()))
  );

  const handleAdd = () => {
    if (!form.recipient || !form.phone || !form.message) return;
    setData([...data, { ...form, id: data.length + 1 }]);
    setForm({ recipient: '', phone: '', message: '', date: '', status: 'Sent' });
    setShowForm(false);
  };

  const handleDelete = (id) => {
    setData(data.filter(d => d.id !== id));
  };

  const keys = Object.keys(filtered[0] || {}).filter(k => k !== 'id');

  const totalSent = type === 'Campaign' ? data.reduce((s, d) => s + (d.sent || 0), 0) : 0;
  const totalSMS = type === 'Campaign' ? data.reduce((s, d) => s + (d.totalSMS || 0), 0) : 0;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#1a2035', margin: 0 }}>{icons[type]} {type}</h2>
        {type !== 'SMS Log' && (
          <button
            onClick={() => setShowForm(!showForm)}
            style={{ backgroundColor: '#0d6efd', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
            + New {type}
          </button>
        )}
      </div>

      {type === 'Campaign' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
          <div style={{ ...cardStyle, textAlign: 'center', borderTop: '4px solid #0d6efd' }}>
            <p style={{ color: '#6c757d', fontSize: '13px', margin: '0 0 8px' }}>Total Campaigns</p>
            <p style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#0d6efd' }}>{data.length}</p>
          </div>
          <div style={{ ...cardStyle, textAlign: 'center', borderTop: '4px solid #28a745' }}>
            <p style={{ color: '#6c757d', fontSize: '13px', margin: '0 0 8px' }}>Total SMS Sent</p>
            <p style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#28a745' }}>{totalSent}</p>
          </div>
          <div style={{ ...cardStyle, textAlign: 'center', borderTop: '4px solid #6f42c1' }}>
            <p style={{ color: '#6c757d', fontSize: '13px', margin: '0 0 8px' }}>Total SMS</p>
            <p style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#6f42c1' }}>{totalSMS}</p>
          </div>
        </div>
      )}

      {showForm && (
        <div style={{ ...cardStyle, marginBottom: '20px', borderLeft: '4px solid #0d6efd' }}>
          <h4 style={{ marginTop: 0, color: '#1a2035' }}>Send New {type}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <input placeholder="Recipient Name" value={form.recipient} onChange={e => setForm({ ...form, recipient: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
            <input placeholder="Phone Number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
            <textarea placeholder="Message" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px', gridColumn: 'span 2', height: '80px', resize: 'none' }} />
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }} />
            <button onClick={handleAdd}
              style={{ backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', padding: '8px' }}>
              Send SMS
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
              {type !== 'SMS Log' && (
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Action</th>
              )}
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
                {type !== 'SMS Log' && (
                  <td style={{ padding: '10px 12px' }}>
                    <button onClick={() => handleDelete(row.id)}
                      style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                      Delete
                    </button>
                  </td>
                )}
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

export default SMS;