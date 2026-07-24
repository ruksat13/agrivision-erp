import React, { useState } from 'react';

const INITIAL_ROWS = [
    { id: 1, product: 'Green Charge 5 Ltr (label) [SA-000218]', serial: 'G R Repaking', buyPrice: 13.00, damageQat: 14.00, totalPrice: 182.00 },
    { id: 2, product: 'Green Charge 100 Ml (label) [SA-000222]', serial: 'G R Repaking', buyPrice: 1.90, damageQat: 96.00, totalPrice: 182.40 },
    { id: 3, product: 'Green Charge Carton 100 Ml (carton) [SA-000180]', serial: 'G R Repaking', buyPrice: 23.00, damageQat: 4.00, totalPrice: 92.00 },
    { id: 4, product: 'Green Charge 500 Ml (label) [SA-000221]', serial: 'G R Repaking', buyPrice: 3.00, damageQat: 36.00, totalPrice: 108.00 },
    { id: 5, product: 'Green Charge Carton 500 Ml (carton) [SA-000179]', serial: 'G R repaking', buyPrice: 22.00, damageQat: 4.00, totalPrice: 88.00 },
    { id: 6, product: 'Green Charge 1 Ltr (label) [SA-000219]', serial: 'G R Repaking', buyPrice: 4.80, damageQat: 84.00, totalPrice: 403.20 },
    { id: 7, product: 'Green Charge Carton 1 Ltr (carton) [SA-000178]', serial: 'G R Repaking', buyPrice: 33.00, damageQat: 14.00, totalPrice: 462.00 },
    { id: 8, product: 'Primithyl 50ec 500 Ml (label) [SA-000437]', serial: 'G R Repaking', buyPrice: 3.00, damageQat: 91.00, totalPrice: 273.00 },
    { id: 9, product: 'Memory Plus 32.5sc 100 Ml [SA-000054]', serial: 'G R repaking', buyPrice: 320.00, damageQat: 1.00, totalPrice: 320.00 },
    { id: 10, product: 'Kepnar 3gr (fipronil 3%) 1 Kg (carton) [SA-000453]', serial: 'G R Repaking', buyPrice: 30.00, damageQat: 11.00, totalPrice: 330.00 },
    { id: 11, product: 'Green Chili 20 Gm (label) [SA-000240]', serial: 'G R Repaking', buyPrice: 4.00, damageQat: 9.00, totalPrice: 36.00 },
    { id: 12, product: 'Green Chili Cartoon 20 Gm [SA-000548]', serial: 'G R Repaking', buyPrice: 15.00, damageQat: 9.00, totalPrice: 135.00 },
    { id: 13, product: 'Hundred Plus 300 Gm (label) [SA-000356]', serial: 'G R Repaking', buyPrice: 4.00, damageQat: 5.00, totalPrice: 20.00 },
    { id: 14, product: 'Egsul 80 Wg 1 Kg [SA-000044]', serial: 'G R Repaking', buyPrice: 325.00, damageQat: 5.00, totalPrice: 1.00, highlight: true },
    { id: 15, product: 'Smart Solubor 100 Gm (carton) [SA-000208]', serial: 'G R Repaking', buyPrice: 39.00, damageQat: 2.00, totalPrice: 78.00 },
    { id: 16, product: 'Smart Solubor 500 Gm (label) [SA-000247]', serial: 'G R Repaking', buyPrice: 3.00, damageQat: 3.00, totalPrice: 9.00 },
    { id: 17, product: 'Smart Solubor 500 Gm (carton) [SA-000207]', serial: 'G R Repaking', buyPrice: 46.00, damageQat: 3.00, totalPrice: 138.00 },
    { id: 18, product: 'Agrivit Plus 500ml [AI-000101]', serial: 'G R Repaking', buyPrice: 120.00, damageQat: 6.00, totalPrice: 720.00 },
    { id: 19, product: 'Smartzeb 80 Wp 100 Gm (blue) [AI-000102]', serial: 'G R Repaking', buyPrice: 85.00, damageQat: 12.00, totalPrice: 1020.00 },
    { id: 20, product: 'Cupertino 72wp Blue 100 Gm [AI-000103]', serial: 'G R repaking', buyPrice: 110.00, damageQat: 8.00, totalPrice: 880.00 },
];

function Damage() {
    const [rows, setRows] = useState(INITIAL_ROWS);
    const [panelOpen, setPanelOpen] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [form, setForm] = useState({ product: '', serial: 'G R Repaking', buyPrice: '', damageQat: '' });

    const handleAdd = () => {
        const bp = parseFloat(form.buyPrice) || 0;
        const dq = parseFloat(form.damageQat) || 0;
        if (!form.product) return alert('Product name is required');
        setRows(prev => [...prev, {
            id: Date.now(),
            product: form.product,
            serial: form.serial || 'G R Repaking',
            buyPrice: bp,
            damageQat: dq,
            totalPrice: parseFloat((bp * dq).toFixed(2)),
        }]);
        setForm({ product: '', serial: 'G R Repaking', buyPrice: '', damageQat: '' });
        setShowAddModal(false);
    };

    return (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>
            {/* Page title */}
            <div style={{ marginBottom: 16 }}>
                <h2 style={{ color: '#0d6efd', margin: 0 }}>⚠️ Damage</h2>
                <p style={{ color: '#6c757d', fontSize: 13, margin: '2px 0 0' }}>Manage product damage records</p>
            </div>

            {/* Collapsible panel */}
            <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                {/* Panel header */}
                <div onClick={() => setPanelOpen(o => !o)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '14px 20px', cursor: 'pointer', background: '#f8f9fa', borderBottom: panelOpen ? '1px solid #eee' : 'none', fontWeight: 700, fontSize: 15, color: '#1a2035' }}>
                    <span style={{ fontSize: 12, display: 'inline-block', transition: 'transform 0.2s', transform: panelOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                    Manage Damage
                </div>

                {panelOpen && (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ background: '#1a2035', color: '#fff' }}>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Product name</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Serial</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Buy price</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Damage qat</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                            <span>Total price</span>
                                            <button onClick={() => setShowAddModal(true)}
                                                style={{ background: '#28a745', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>
                                                Add Damage
                                            </button>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, i) => (
                                    <tr key={row.id} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                        <td style={{ padding: '10px 16px', color: '#0d6efd' }}>{row.product}</td>
                                        <td style={{ padding: '10px 16px', color: '#495057' }}>{row.serial}</td>
                                        <td style={{ padding: '10px 16px' }}>{row.buyPrice.toFixed(2)}</td>
                                        <td style={{ padding: '10px 16px' }}>{row.damageQat.toFixed(2)}</td>
                                        <td style={{ padding: '10px 16px', color: row.highlight ? '#dc3545' : 'inherit', fontWeight: row.highlight ? 700 : 400 }}>
                                            {row.totalPrice.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Damage Modal */}
            {showAddModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => e.target === e.currentTarget && setShowAddModal(false)}>
                    <div style={{ background: '#fff', borderRadius: 8, padding: 28, width: 440, maxWidth: '95%' }}>
                        <h3 style={{ marginTop: 0, marginBottom: 18, fontSize: 16, color: '#1a2035' }}>⚠️ Add Damage Record</h3>
                        {[
                            { label: 'Product Name', key: 'product', type: 'text' },
                            { label: 'Serial / Batch', key: 'serial', type: 'text' },
                            { label: 'Buy Price', key: 'buyPrice', type: 'number' },
                            { label: 'Damage Quantity', key: 'damageQat', type: 'number' },
                        ].map(f => (
                            <div key={f.key} style={{ marginBottom: 12 }}>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#555' }}>{f.label}</label>
                                <input type={f.type} value={form[f.key]}
                                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 5, fontSize: 13, boxSizing: 'border-box' }} />
                            </div>
                        ))}
                        {form.buyPrice && form.damageQat && (
                            <div style={{ background: '#f0f7ff', border: '1px solid #0d6efd', borderRadius: 5, padding: '8px 12px', marginBottom: 14, fontSize: 13 }}>
                                <strong>Total Price:</strong> {(parseFloat(form.buyPrice || 0) * parseFloat(form.damageQat || 0)).toFixed(2)}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowAddModal(false)}
                                style={{ padding: '8px 20px', border: '1px solid #ddd', borderRadius: 5, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                            <button onClick={handleAdd}
                                style={{ padding: '8px 20px', background: '#28a745', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Damage;
