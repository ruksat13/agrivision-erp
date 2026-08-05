import React, { useState } from 'react';

const PUBLISH = 'Publish';
const UNPUBLISH = 'Un-publish';

// parentId === null means the row is a top-level ("Parent") category
const initialData = {
  'Categories': [
    { id: 1, name: 'Gift', url: 'gift', icon: '', banner: '', parentId: null, status: UNPUBLISH },
    { id: 2, name: 'Machinerys', url: 'machinerys', icon: '🧴', banner: 'machinery-banner.jpg', parentId: null, status: PUBLISH },
    { id: 3, name: 'Fisheries Products', url: 'fisheries products', icon: '🐠', banner: '', parentId: null, status: PUBLISH },
    { id: 4, name: 'Plant Growth Regulator', url: 'plant growth regulator', icon: '🌱', banner: '', parentId: null, status: PUBLISH },
    { id: 5, name: 'Herbicides', url: 'herbicides', icon: '🌲', banner: '', parentId: null, status: PUBLISH },
    { id: 6, name: 'Fertilisers', url: 'fertilisers', icon: '🌾', banner: '', parentId: null, status: PUBLISH },
    { id: 7, name: 'Fungicides', url: 'fungicides', icon: '🌿', banner: '', parentId: null, status: PUBLISH },
    { id: 8, name: 'Insecticides', url: 'insecticides', icon: '🦟', banner: '', parentId: null, status: PUBLISH },
  ],
  'Brand': [
    { id: 1, name: 'ACI', origin: 'Bangladesh', totalProduct: 20, status: PUBLISH },
    { id: 2, name: 'Syngenta', origin: 'Switzerland', totalProduct: 15, status: PUBLISH },
    { id: 3, name: 'BASF', origin: 'Germany', totalProduct: 12, status: PUBLISH },
    { id: 4, name: 'Bayer', origin: 'Germany', totalProduct: 8, status: UNPUBLISH },
  ],
  'Unit': [
    { id: 1, name: 'KG', fullName: 'Kilogram', type: 'Weight', status: PUBLISH },
    { id: 2, name: 'GM', fullName: 'Gram', type: 'Weight', status: PUBLISH },
    { id: 3, name: 'LTR', fullName: 'Liter', type: 'Volume', status: PUBLISH },
    { id: 4, name: 'ML', fullName: 'Milliliter', type: 'Volume', status: PUBLISH },
    { id: 5, name: 'PCS', fullName: 'Pieces', type: 'Count', status: PUBLISH },
  ],
  'Product Type': [
    { id: 1, name: 'Liquid', description: 'Liquid form products', status: PUBLISH },
    { id: 2, name: 'Powder', description: 'Powder form products', status: PUBLISH },
    { id: 3, name: 'Granule', description: 'Granule form products', status: PUBLISH },
    { id: 4, name: 'Tablet', description: 'Tablet form products', status: UNPUBLISH },
  ],
  'Origin': [
    { id: 1, country: 'Bangladesh', code: 'BD', totalProduct: 45, status: PUBLISH },
    { id: 2, country: 'India', code: 'IN', totalProduct: 30, status: PUBLISH },
    { id: 3, country: 'China', code: 'CN', totalProduct: 25, status: PUBLISH },
    { id: 4, country: 'Germany', code: 'DE', totalProduct: 15, status: UNPUBLISH },
  ],
};

// Columns per screen. `type` on Categories is derived (Parent vs Sub), not stored.
const COLUMNS = {
  'Categories': [
    { key: 'name', label: 'Name' },
    { key: 'url', label: 'URL' },
    { key: 'icon', label: 'Icon' },
    { key: 'banner', label: 'Banner' },
    { key: 'type', label: 'Type' },
    { key: 'status', label: 'Status' },
  ],
  'Brand': [
    { key: 'name', label: 'Name' },
    { key: 'origin', label: 'Origin' },
    { key: 'totalProduct', label: 'Total Product' },
    { key: 'status', label: 'Status' },
  ],
  'Unit': [
    { key: 'name', label: 'Name' },
    { key: 'fullName', label: 'Full Name' },
    { key: 'type', label: 'Type' },
    { key: 'status', label: 'Status' },
  ],
  'Product Type': [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status' },
  ],
  'Origin': [
    { key: 'country', label: 'Country' },
    { key: 'code', label: 'Code' },
    { key: 'totalProduct', label: 'Total Product' },
    { key: 'status', label: 'Status' },
  ],
};

const TITLES = {
  'Categories': 'Manage Category',
  'Brand': 'Manage Brand',
  'Unit': 'Manage Unit',
  'Product Type': 'Manage Product Type',
  'Origin': 'Manage Origin',
};

const cardStyle = {
  backgroundColor: 'white',
  borderRadius: '4px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

const badge = (bg) => ({
  backgroundColor: bg,
  color: 'white',
  padding: '3px 9px',
  borderRadius: '3px',
  fontSize: '10px',
  fontWeight: 'bold',
  whiteSpace: 'nowrap',
});

const actionBtn = (bg) => ({
  backgroundColor: bg,
  color: 'white',
  border: 'none',
  width: '30px',
  height: '26px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '12px',
  lineHeight: 1,
  marginRight: '5px',
});

const inputStyle = {
  padding: '8px 12px',
  borderRadius: '4px',
  border: '1px solid #ced4da',
  fontSize: '13px',
  width: '100%',
  boxSizing: 'border-box',
};

const slugify = (name) => name.trim().toLowerCase();

function Categories({ type = 'Categories' }) {
  const isCategory = type === 'Categories';
  const columns = COLUMNS[type] || COLUMNS['Categories'];

  const [data, setData] = useState(initialData[type] || []);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // row being edited, or a draft for a new row

  const blankRow = () => (isCategory
    ? { name: '', url: '', icon: '', banner: '', parentId: null, status: PUBLISH }
    : columns.reduce((acc, c) => ({ ...acc, [c.key]: c.key === 'status' ? PUBLISH : '' }), {}));

  // Categories are listed parent-first with their sub-categories directly beneath.
  const ordered = isCategory
    ? data.filter(r => r.parentId === null).flatMap(p => [p, ...data.filter(r => r.parentId === p.id)])
    : data;

  const filtered = ordered.filter(row =>
    columns.some(c => String(row[c.key] ?? '').toLowerCase().includes(search.toLowerCase()))
  );

  const togglePublish = (id) => {
    setData(data.map(r => r.id === id ? { ...r, status: r.status === PUBLISH ? UNPUBLISH : PUBLISH } : r));
  };

  const handleSave = () => {
    if (!editing) return;
    const name = editing.name || editing.country;
    if (!name || !name.trim()) return;

    const row = isCategory ? { ...editing, url: editing.url.trim() || slugify(editing.name) } : editing;

    if (row.id) {
      setData(data.map(r => (r.id === row.id ? row : r)));
    } else {
      setData([...data, { ...row, id: Math.max(0, ...data.map(r => r.id)) + 1 }]);
    }
    setEditing(null);
  };

  const handleDelete = (id) => {
    // dropping a parent drops its sub-categories too
    setData(data.filter(r => r.id !== id && r.parentId !== id));
    setEditing(null);
  };

  const renderCell = (row, key) => {
    if (key === 'status') {
      return <span style={badge(row.status === PUBLISH ? '#28a745' : '#17a2b8')}>{row.status}</span>;
    }
    if (isCategory) {
      if (key === 'type') {
        return <span style={badge(row.parentId === null ? '#28a745' : '#6c757d')}>
          {row.parentId === null ? 'Parent Category' : 'Sub Category'}
        </span>;
      }
      if (key === 'icon') {
        return row.icon
          ? <span style={{ fontSize: '34px', lineHeight: 1 }}>{row.icon}</span>
          : <span style={{ color: '#6c757d' }}>No Icon</span>;
      }
      if (key === 'banner') {
        return row.banner
          ? <div title={row.banner} style={{
            width: '95px', height: '16px', borderRadius: '2px',
            background: 'linear-gradient(90deg,#c8d6a0,#e8c9a0,#a8c78a,#d8b98a)',
          }} />
          : <span style={{ color: '#6c757d' }}>No Banner</span>;
      }
      if (key === 'name' && row.parentId !== null) {
        return <span style={{ paddingLeft: '18px', color: '#495057' }}>↳ {row.name}</span>;
      }
    }
    return row[key];
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>

      {/* Title bar + search */}
      <div style={{
        ...cardStyle,
        padding: '16px 20px',
        marginBottom: '14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
      }}>
        <h3 style={{ margin: 0, color: '#1a2035', fontSize: '20px', fontWeight: 'normal' }}>
          <span style={{ color: '#adb5bd' }}>›</span>{TITLES[type] || `Manage ${type}`}
        </h3>
        <input
          placeholder="Search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, maxWidth: '490px' }}
        />
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, padding: '10px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#1a2035', color: 'white' }}>
              {columns.map(c => (
                <th key={c.key} style={{ padding: '13px 12px', textAlign: 'left', fontSize: '13px' }}>{c.label}</th>
              ))}
              <th style={{ padding: '13px 12px', textAlign: 'left', fontSize: '13px', width: '150px' }}>
                Action
                <button
                  onClick={() => setEditing(blankRow())}
                  style={{
                    marginLeft: '10px', backgroundColor: '#28a745', color: 'white', border: 'none',
                    padding: '3px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '12px',
                  }}>
                  Add
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={row.id} style={{
                borderBottom: '1px solid #e9ecef',
                backgroundColor: i % 2 === 0 ? '#f4f7fa' : 'white',
              }}>
                {columns.map(c => (
                  <td key={c.key} style={{ padding: '12px', fontWeight: c.key === 'name' ? 'bold' : 'normal' }}>
                    {renderCell(row, c.key)}
                  </td>
                ))}
                <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                  <button title="Edit" onClick={() => setEditing(row)} style={actionBtn('#0d6efd')}>✏️</button>
                  <button
                    title={row.status === PUBLISH ? 'Un-publish' : 'Publish'}
                    onClick={() => togglePublish(row.id)}
                    style={actionBtn(row.status === PUBLISH ? '#dc3545' : '#0d6efd')}>
                    {row.status === PUBLISH ? '👎' : '👍'}
                  </button>
                  {isCategory && row.parentId === null && (
                    <button
                      title="Add sub-category"
                      onClick={() => setEditing({ ...blankRow(), parentId: row.id })}
                      style={actionBtn('#dc3545')}>
                      ➕
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: '#adb5bd', padding: '24px' }}>No data found</p>
        )}
      </div>

      {editing && (
        <EditModal
          type={type}
          isCategory={isCategory}
          columns={columns}
          parents={data.filter(r => r.parentId === null && r.id !== editing.id)}
          row={editing}
          onChange={setEditing}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function EditModal({ type, isCategory, columns, parents, row, onChange, onSave, onDelete, onClose }) {
  const set = (key, value) => onChange({ ...row, [key]: value });
  const editableKeys = columns.map(c => c.key).filter(k => k !== 'type' && k !== 'status' && k !== 'icon' && k !== 'banner');

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '40px 20px',
      }}>
      <div style={{ background: '#fff', borderRadius: '6px', width: '520px', maxWidth: '98%' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 20px', background: '#1a2035', color: 'white', borderRadius: '6px 6px 0 0',
        }}>
          <span style={{ fontSize: '15px', fontWeight: 'bold' }}>
            {row.id ? `Edit ${type}` : `Add ${row.parentId ? 'Sub Category' : type}`}
          </span>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ padding: '20px', display: 'grid', gap: '14px' }}>
          {editableKeys.map(key => (
            <div key={key}>
              <label style={{ display: 'block', fontSize: '12px', color: '#495057', marginBottom: '5px', textTransform: 'capitalize' }}>
                {columns.find(c => c.key === key).label}
              </label>
              <input
                value={row[key] ?? ''}
                placeholder={isCategory && key === 'url' ? 'auto-generated from name' : ''}
                onChange={e => set(key, e.target.value)}
                style={inputStyle}
              />
            </div>
          ))}

          {isCategory && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#495057', marginBottom: '5px' }}>Icon (emoji)</label>
                <input value={row.icon} onChange={e => set('icon', e.target.value)} placeholder="e.g. 🌾" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#495057', marginBottom: '5px' }}>Banner (file name)</label>
                <input value={row.banner} onChange={e => set('banner', e.target.value)} placeholder="leave empty for No Banner" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#495057', marginBottom: '5px' }}>Parent Category</label>
                <select
                  value={row.parentId ?? ''}
                  onChange={e => set('parentId', e.target.value ? Number(e.target.value) : null)}
                  style={inputStyle}>
                  <option value="">— None (Parent Category) —</option>
                  {parents.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#495057', marginBottom: '5px' }}>Status</label>
            <select value={row.status} onChange={e => set('status', e.target.value)} style={inputStyle}>
              <option>{PUBLISH}</option>
              <option>{UNPUBLISH}</option>
            </select>
          </div>
        </div>

        <div style={{
          padding: '14px 20px', borderTop: '1px solid #e9ecef',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          {row.id ? (
            <button
              onClick={() => onDelete(row.id)}
              style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
              Delete
            </button>
          ) : <span />}
          <div>
            <button onClick={onClose}
              style={{ background: '#6c757d', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', marginRight: '8px' }}>
              Cancel
            </button>
            <button onClick={onSave}
              style={{ background: '#28a745', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Categories;
