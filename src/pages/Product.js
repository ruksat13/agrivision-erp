import React, { useState, useEffect, useCallback } from 'react';
import {
    listProducts, createProduct, deactivateProduct,
    banProduct, unbanProduct, isBannedOn, formatDate,
    ServiceError, PRODUCT_CATEGORY, PRODUCT_TYPE, UNIT,
} from '../services';

// Product master, backed by Firestore.
//
// Carries the Feature 2 controls: a product can be marked as withdrawn from a
// stated date, with a reason and the authority that ordered it. Banning does
// NOT hide or deactivate the product — it stays selectable on the order screen
// so that adding it produces a visible refusal. Filtering it out of the
// dropdown would conceal the control instead of demonstrating it
// (UNIQUE-FEATURES.md §5).

const card = {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

const inp = {
    padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6',
    fontSize: '13px', width: '100%', boxSizing: 'border-box',
};

const lbl = { fontSize: '12px', fontWeight: 600, color: '#495057', display: 'block', marginBottom: '5px' };
const th = { padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontSize: '13px' };
const td = { padding: '10px 12px', fontSize: '13px' };

const btn = (bg, extra = {}) => ({
    backgroundColor: bg, color: 'white', border: 'none', borderRadius: '6px',
    padding: '9px 18px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, ...extra,
});

// formatDate() is local-timezone; toISOString() would show the previous day at UTC+6.
const iso = (v) => formatDate(v);
const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Notice({ tone = 'warn', children }) {
    const tones = {
        warn: { bg: '#fff8e1', border: '#ffc107', color: '#856404' },
        error: { bg: '#f8d7da', border: '#dc3545', color: '#721c24' },
        ok: { bg: '#d4edda', border: '#28a745', color: '#155724' },
        info: { bg: '#e7f1ff', border: '#0d6efd', color: '#084298' },
    };
    const t = tones[tone] || tones.warn;
    return (
        <div style={{
            background: t.bg, border: `1px solid ${t.border}`, color: t.color,
            borderRadius: 6, padding: '10px 14px', fontSize: 13, marginBottom: 16, lineHeight: 1.6,
        }}>{children}</div>
    );
}

// ── Ban dialog ────────────────────────────────────────────────────────────

function BanModal({ product, onCancel, onConfirm, busy }) {
    const [from, setFrom] = useState(iso(new Date()));
    const [reason, setReason] = useState('');
    const [authority, setAuthority] = useState('');
    const ready = from && reason.trim();

    return (
        <div onClick={e => e.target === e.currentTarget && onCancel()}
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000,
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '40px 20px',
            }}>
            <div style={{ background: 'white', borderRadius: 10, width: 560, maxWidth: '98%' }}>
                <div style={{ background: '#dc3545', color: 'white', padding: '14px 20px', borderRadius: '10px 10px 0 0' }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>⛔ Withdraw registration</div>
                    <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>{product.name} [{product.code}]</div>
                </div>

                <div style={{ padding: 20 }}>
                    <div style={{ marginBottom: 14 }}>
                        <label style={lbl}>Banned from <span style={{ color: '#dc3545' }}>*</span></label>
                        <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={inp} />
                        <div style={{ fontSize: 11, color: '#6c757d', marginTop: 4 }}>
                            Sales and purchases dated on or after this date are refused. Anything dated
                            earlier stays valid and still prints.
                        </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                        <label style={lbl}>Reason <span style={{ color: '#dc3545' }}>*</span></label>
                        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
                            placeholder="e.g. Registration withdrawn — active ingredient de-registered for agricultural use"
                            style={{ ...inp, resize: 'vertical' }} />
                    </div>

                    <div style={{ marginBottom: 6 }}>
                        <label style={lbl}>Issuing authority</label>
                        <input value={authority} onChange={e => setAuthority(e.target.value)}
                            placeholder="e.g. DAE notification 2026/14" style={inp} />
                        <div style={{ fontSize: 11, color: '#6c757d', marginTop: 4 }}>
                            Cite the gazette or DAE notification. Shown on the refusal message.
                        </div>
                    </div>

                    <div style={{ background: '#fff8e1', border: '1px solid #ffc107', borderRadius: 6, padding: '9px 12px', fontSize: 12, color: '#856404', marginTop: 14 }}>
                        The product stays <strong>active and selectable</strong>. It is refused at the point
                        of sale, visibly — it is not hidden from the catalogue, and existing invoices are
                        untouched.
                    </div>
                </div>

                <div style={{ padding: '14px 20px', borderTop: '1px solid #e9ecef', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button onClick={onCancel} style={btn('#6c757d')}>Cancel</button>
                    <button disabled={!ready || busy}
                        onClick={() => onConfirm({ from, reason: reason.trim(), authority: authority.trim() || null })}
                        style={{ ...btn(ready && !busy ? '#dc3545' : '#adb5bd'), cursor: ready && !busy ? 'pointer' : 'not-allowed' }}>
                        {busy ? 'Saving…' : 'Withdraw registration'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────

function Product() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notice, setNotice] = useState(null);
    const [flash, setFlash] = useState(null);

    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        code: '', name: '', category: 'Pesticide', brandId: '', originId: '',
        unitId: 'KG', packSize: '', packQty: '', type: 'Finished', cartonQty: '', mrp: '',
    });

    const [banTarget, setBanTarget] = useState(null);
    const [busy, setBusy] = useState(false);

    // status: null → every status, so a deactivated product is still visible here
    const load = useCallback(async () => {
        setLoading(true);
        try {
            setData(await listProducts({ status: null }));
            setNotice(null);
        } catch (err) {
            setData([]);
            setNotice({
                tone: 'warn',
                text: `Could not load products (${err.code || err.message}). The page is shown but there is nothing to display.`,
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const say = (tone, text) => {
        setFlash({ tone, text });
        setTimeout(() => setFlash(null), 6000);
    };

    const fail = (err) => say('error', err instanceof ServiceError ? err.message : String(err.message || err));

    const filtered = data.filter(d => {
        const k = search.toLowerCase();
        return !k
            || d.name.toLowerCase().includes(k)
            || d.code.toLowerCase().includes(k)
            || (d.category || '').toLowerCase().includes(k);
    });

    const banned = data.filter(p => p.bannedFrom);

    // ── Actions ──────────────────────────────────────────────────────────
    const handleAdd = async () => {
        setBusy(true);
        try {
            await createProduct({
                ...form,
                packQty: form.packQty || 1,
                cartonQty: form.cartonQty || 1,
                brandId: form.brandId || null,
                originId: form.originId || null,
            });
            setForm({
                code: '', name: '', category: 'Pesticide', brandId: '', originId: '',
                unitId: 'KG', packSize: '', packQty: '', type: 'Finished', cartonQty: '', mrp: '',
            });
            setShowForm(false);
            say('ok', 'Product added.');
            await load();
        } catch (err) { fail(err); } finally { setBusy(false); }
    };

    const handleBan = async ({ from, reason, authority }) => {
        setBusy(true);
        try {
            await banProduct(banTarget.code, { from, reason, authority });
            say('ok', `${banTarget.name} withdrawn from ${from}. It will now be refused on the order screen.`);
            setBanTarget(null);
            await load();
        } catch (err) { fail(err); } finally { setBusy(false); }
    };

    const handleUnban = async (p) => {
        if (!window.confirm(`Lift the ban on ${p.name}? It will become sellable again.`)) return;
        setBusy(true);
        try {
            await unbanProduct(p.code);
            say('ok', `Ban lifted on ${p.name}.`);
            await load();
        } catch (err) { fail(err); } finally { setBusy(false); }
    };

    const handleDeactivate = async (p) => {
        if (!window.confirm(`Deactivate ${p.name}? It stays in reports but cannot be selected.`)) return;
        setBusy(true);
        try {
            await deactivateProduct(p.code, 'Deactivated from the product master');
            say('ok', `${p.name} deactivated.`);
            await load();
        } catch (err) { fail(err); } finally { setBusy(false); }
    };

    // ── Render ───────────────────────────────────────────────────────────
    return (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                <h2 style={{ color: '#1a2035', margin: 0 }}>🌿 Product</h2>
                <button onClick={() => setShowForm(!showForm)} style={btn('#0d6efd', { padding: '10px 20px', fontSize: 14 })}>
                    + New Product
                </button>
            </div>

            {loading && <Notice tone="info">Loading products…</Notice>}
            {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
            {flash && <Notice tone={flash.tone}>{flash.text}</Notice>}

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
                {[
                    { label: 'Total Products', value: data.length, colour: '#0d6efd' },
                    { label: 'Active', value: data.filter(d => d.status === 'Active').length, colour: '#28a745' },
                    { label: 'Withdrawn / banned', value: banned.length, colour: '#dc3545' },
                    { label: 'Catalogue value (MRP)', value: `৳ ${fmt(data.reduce((s, d) => s + Number(d.mrp || 0), 0))}`, colour: '#6f42c1', small: true },
                ].map(c => (
                    <div key={c.label} style={{ ...card, textAlign: 'center', borderTop: `4px solid ${c.colour}` }}>
                        <p style={{ color: '#6c757d', fontSize: 13, margin: '0 0 8px' }}>{c.label}</p>
                        <p style={{ fontSize: c.small ? 17 : 22, fontWeight: 'bold', margin: 0, color: c.colour }}>{c.value}</p>
                    </div>
                ))}
            </div>

            {/* Add form */}
            {showForm && (
                <div style={{ ...card, marginBottom: 20, borderLeft: '4px solid #0d6efd' }}>
                    <h4 style={{ marginTop: 0, color: '#1a2035' }}>Add New Product</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
                        <div>
                            <label style={lbl}>Product code *</label>
                            <input placeholder="AI-000750" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Name *</label>
                            <input placeholder="Product name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Category *</label>
                            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inp}>
                                {PRODUCT_CATEGORY.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Type *</label>
                            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inp}>
                                {PRODUCT_TYPE.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Unit *</label>
                            <select value={form.unitId} onChange={e => setForm({ ...form, unitId: e.target.value })} style={inp}>
                                {UNIT.map(u => <option key={u}>{u}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Pack size *</label>
                            <input placeholder="100 Ml" value={form.packSize} onChange={e => setForm({ ...form, packSize: e.target.value })} style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Pack qty</label>
                            <input type="number" placeholder="100" value={form.packQty} onChange={e => setForm({ ...form, packQty: e.target.value })} style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Carton qty</label>
                            <input type="number" placeholder="24" value={form.cartonQty} onChange={e => setForm({ ...form, cartonQty: e.target.value })} style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>MRP *</label>
                            <input type="number" step="0.01" placeholder="0.00" value={form.mrp} onChange={e => setForm({ ...form, mrp: e.target.value })} style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Brand</label>
                            <input placeholder="agrivision" value={form.brandId} onChange={e => setForm({ ...form, brandId: e.target.value })} style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Origin</label>
                            <input placeholder="bangladesh" value={form.originId} onChange={e => setForm({ ...form, originId: e.target.value })} style={inp} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button onClick={handleAdd} disabled={busy} style={{ ...btn(busy ? '#adb5bd' : '#28a745'), width: '100%' }}>
                                {busy ? 'Saving…' : 'Save Product'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Banned summary */}
            {banned.length > 0 && (
                <div style={{ ...card, marginBottom: 20, borderLeft: '4px solid #dc3545', padding: '14px 20px' }}>
                    <div style={{ fontWeight: 700, color: '#dc3545', marginBottom: 6, fontSize: 14 }}>
                        ⛔ {banned.length} product{banned.length > 1 ? 's' : ''} with a withdrawn registration
                    </div>
                    <div style={{ fontSize: 12, color: '#495057' }}>
                        {banned.map(p => `${p.name} (from ${iso(p.bannedFrom)})`).join(' · ')}
                    </div>
                </div>
            )}

            {/* Table */}
            <div style={card}>
                <div style={{ marginBottom: 16 }}>
                    <input placeholder="Search by name, code or category…" value={search} onChange={e => setSearch(e.target.value)}
                        style={{ ...inp, width: 350 }} />
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8f9fa' }}>
                                {['#', 'Code', 'Name', 'Category', 'Pack', 'MRP', 'Status', 'Action'].map(h => (
                                    <th key={h} style={th}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((row, i) => {
                                const isBanned = Boolean(row.bannedFrom);
                                const bannedOn = iso(row.bannedFrom);
                                // A ban dated in the future is recorded but not yet biting —
                                // worth showing differently, since that is the whole point of
                                // the field being a date rather than a flag.
                                const inForce = isBanned && isBannedOn(row, new Date());
                                const inactive = row.status !== 'Active';
                                return (
                                    <tr key={row.code} style={{
                                        borderBottom: '1px solid #f0f0f0',
                                        // banned rows are tinted and edged so they read at a glance
                                        backgroundColor: isBanned ? (inForce ? '#fff5f5' : '#fffbf0') : i % 2 === 0 ? 'white' : '#fafafa',
                                        borderLeft: isBanned ? `3px solid ${inForce ? '#dc3545' : '#fd7e14'}` : '3px solid transparent',
                                        opacity: inactive ? 0.55 : 1,
                                    }}>
                                        <td style={td}>{i + 1}</td>
                                        <td style={{ ...td, color: '#0d6efd', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{row.code}</td>
                                        <td style={td}>
                                            <div style={{ fontWeight: 'bold', color: '#1a2035', textDecoration: inForce ? 'line-through' : 'none' }}>
                                                {row.name}
                                            </div>
                                            {isBanned && (
                                                <div style={{ fontSize: 11, color: '#721c24', marginTop: 3, maxWidth: 420 }}>
                                                    {row.bannedReason}
                                                    {row.bannedAuthority && (
                                                        <span style={{ color: '#6c757d' }}> — {row.bannedAuthority}</span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td style={td}>{row.category}</td>
                                        <td style={{ ...td, whiteSpace: 'nowrap' }}>
                                            {row.packSize}
                                            <div style={{ fontSize: 11, color: '#6c757d' }}>carton {row.cartonQty}</div>
                                        </td>
                                        <td style={{ ...td, fontWeight: 'bold', whiteSpace: 'nowrap' }}>৳ {fmt(row.mrp)}</td>
                                        <td style={{ ...td, whiteSpace: 'nowrap' }}>
                                            {isBanned ? (
                                                <span title={inForce ? `Withdrawn from ${bannedOn}` : `Withdrawal takes effect on ${bannedOn}`}
                                                    style={{
                                                        backgroundColor: inForce ? '#dc3545' : '#fd7e14', color: 'white',
                                                        padding: '3px 9px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                                                    }}>
                                                    {inForce ? '⛔ BANNED' : '⏳ BAN FROM'} {bannedOn}
                                                </span>
                                            ) : (
                                                <span style={{
                                                    backgroundColor: row.status === 'Active' ? '#d4edda' : '#f8d7da',
                                                    color: row.status === 'Active' ? '#155724' : '#721c24',
                                                    padding: '3px 10px', borderRadius: 20, fontSize: 12,
                                                }}>{row.status}</span>
                                            )}
                                        </td>
                                        <td style={{ ...td, whiteSpace: 'nowrap' }}>
                                            {isBanned ? (
                                                <button onClick={() => handleUnban(row)} disabled={busy} title="Lift the ban"
                                                    style={btn('#28a745', { padding: '4px 10px', fontSize: 12 })}>
                                                    Lift ban
                                                </button>
                                            ) : (
                                                <button onClick={() => setBanTarget(row)} disabled={busy} title="Withdraw registration"
                                                    style={btn('#dc3545', { padding: '4px 10px', fontSize: 12 })}>
                                                    ⛔ Ban
                                                </button>
                                            )}
                                            {row.status === 'Active' && (
                                                <button onClick={() => handleDeactivate(row)} disabled={busy}
                                                    style={btn('#6c757d', { padding: '4px 10px', fontSize: 12, marginLeft: 5 })}>
                                                    Deactivate
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {!loading && filtered.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#adb5bd', padding: 20 }}>No data found</p>
                )}
            </div>

            {banTarget && (
                <BanModal product={banTarget} busy={busy}
                    onCancel={() => setBanTarget(null)} onConfirm={handleBan} />
            )}
        </div>
    );
}

export default Product;
