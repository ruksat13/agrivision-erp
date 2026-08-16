import React, { useCallback, useState } from 'react';
import {
  listSuppliers, createSupplier, deactivateSupplier, nextSupplierCode,
} from '../services';
import { Notice, useFlash, useCollection } from '../components/Notice';

// Supplier master, backed by Firestore.
//
// Not one of the fourteen dead Save buttons — this Save already worked, it just
// wrote to local state, exactly as Product.js did. It is here because
// SCREEN-AUDIT.md §2.1.1 puts `suppliers` before all three group B screens:
// Supplier Opening Balance, Supplier Payment and Supplier Commission each need
// a supplier to point at, and all three were choosing from their own hardcoded
// list of names with no code behind them.
//
// `balance` is a PAYABLE — what we owe. It is not editable here; it moves when
// an opening balance is posted or a payment is approved.

const cardStyle = {
  backgroundColor: 'white',
  borderRadius: '10px',
  padding: '20px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

const inp = { padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' };
const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const EMPTY = { code: '', name: '', phone: '', email: '', area: '', address: '', openingBalance: '' };

function Supplier() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);

  // status: null → an inactive supplier stays visible; a payment made to them
  // last month must still resolve.
  const load = useCallback(() => listSuppliers({ status: null }), []);
  const { rows: data, loading, error, reload } = useCollection(load, { what: 'suppliers' });
  const { flash, say, busy, run } = useFlash();

  const filtered = data.filter(d => {
    const k = search.toLowerCase();
    return !k
      || d.name.toLowerCase().includes(k)
      || d.code.toLowerCase().includes(k)
      || (d.phone || '').includes(search)
      || (d.area || '').toLowerCase().includes(k);
  });

  const openForm = () => run(async () => {
    // Show the code that will be used, so it is on the form rather than a
    // surprise after saving.
    if (!showForm) setForm({ ...EMPTY, code: await nextSupplierCode() });
    setShowForm(!showForm);
  });

  const handleAdd = () => run(async () => {
    const saved = await createSupplier({
      ...form,
      openingBalance: form.openingBalance || 0,
      email: form.email || null,
      area: form.area || null,
      address: form.address || null,
    });
    setForm(EMPTY);
    setShowForm(false);
    say('ok', `Supplier ${saved.name} [${saved.code}] saved.`);
    await reload();
  });

  const handleDeactivate = (row) => {
    if (!window.confirm(`Deactivate ${row.name}? Past payments keep it; it stops being offered on new ones.`)) return;
    run(async () => {
      await deactivateSupplier(row.code, 'Deactivated from the supplier master');
      say('ok', `${row.name} deactivated.`);
      await reload();
    });
  };

  const totalBalance = data.reduce((sum, d) => sum + Number(d.balance || 0), 0);
  const activeCount = data.filter(d => d.status === 'Active').length;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#1a2035', margin: 0 }}>🏭 Supplier</h2>
        <button onClick={openForm} disabled={busy}
          style={{ backgroundColor: '#0d6efd', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
          + New Supplier
        </button>
      </div>

      {loading && <Notice tone="info">Loading suppliers…</Notice>}
      {error && <Notice tone="warn">{error}</Notice>}
      {flash && <Notice tone={flash.tone}>{flash.text}</Notice>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <div style={{ ...cardStyle, textAlign: 'center', borderTop: '4px solid #0d6efd' }}>
          <p style={{ color: '#6c757d', fontSize: '13px', margin: '0 0 8px' }}>Total Suppliers</p>
          <p style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#0d6efd' }}>{data.length}</p>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center', borderTop: '4px solid #28a745' }}>
          <p style={{ color: '#6c757d', fontSize: '13px', margin: '0 0 8px' }}>Active Suppliers</p>
          <p style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#28a745' }}>{activeCount}</p>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center', borderTop: '4px solid #dc3545' }}>
          <p style={{ color: '#6c757d', fontSize: '13px', margin: '0 0 8px' }}>Total Payable</p>
          <p style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#dc3545' }}>৳ {fmt(totalBalance)}</p>
        </div>
      </div>

      {showForm && (
        <div style={{ ...cardStyle, marginBottom: '20px', borderLeft: '4px solid #0d6efd' }}>
          <h4 style={{ marginTop: 0, color: '#1a2035' }}>Add New Supplier</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <input placeholder="Supplier code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} style={inp} />
            <input placeholder="Supplier Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inp} />
            <input placeholder="Phone Number *" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inp} />
            <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} />
            <input placeholder="Area" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} style={inp} />
            <input placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={inp} />
            <input placeholder="Opening Balance (payable)" type="number" value={form.openingBalance}
              onChange={e => setForm({ ...form, openingBalance: e.target.value })} style={inp} />
            <div />
            <button onClick={handleAdd} disabled={busy || !form.name.trim() || !form.phone.trim()}
              style={{ backgroundColor: busy || !form.name.trim() || !form.phone.trim() ? '#adb5bd' : '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', padding: '8px' }}>
              {busy ? 'Saving…' : 'Save Supplier'}
            </button>
          </div>
        </div>
      )}

      <div style={cardStyle}>
        <div style={{ marginBottom: '16px' }}>
          <input
            placeholder="Search by name, code, phone or area..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inp, width: '320px' }}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                {['#', 'Code', 'Name', 'Phone', 'Email', 'Area', 'Payable', 'Status', 'Action'].map(h => (
                  <th key={h} style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={row.code} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa', opacity: row.status === 'Active' ? 1 : 0.55 }}>
                  <td style={{ padding: '10px 12px' }}>{i + 1}</td>
                  <td style={{ padding: '10px 12px', color: '#0d6efd', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{row.code}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#1a2035' }}>{row.name}</td>
                  <td style={{ padding: '10px 12px' }}>{row.phone}</td>
                  <td style={{ padding: '10px 12px', color: '#0d6efd' }}>{row.email}</td>
                  <td style={{ padding: '10px 12px' }}>{row.area}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 'bold', whiteSpace: 'nowrap', color: Number(row.balance) > 0 ? '#dc3545' : '#28a745' }}>
                    ৳ {fmt(row.balance)}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      backgroundColor: row.status === 'Active' ? '#d4edda' : '#f8d7da',
                      color: row.status === 'Active' ? '#155724' : '#721c24',
                      padding: '3px 10px', borderRadius: '20px', fontSize: '12px'
                    }}>{row.status}</span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {row.status === 'Active' && (
                      <button onClick={() => handleDeactivate(row)} disabled={busy}
                        style={{ backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: '#adb5bd', padding: '20px' }}>
            {data.length === 0 ? 'No suppliers yet. Press + New Supplier to create the first one.' : 'No data found'}
          </p>
        )}
      </div>
    </div>
  );
}

export default Supplier;
