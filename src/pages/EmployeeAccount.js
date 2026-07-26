import React, { useState } from 'react';

const thS = { padding: '10px 10px', color: 'white', fontWeight: '600', fontSize: '12px', textAlign: 'right', whiteSpace: 'nowrap' };
const tdS = { padding: '8px 10px', fontSize: '12px', color: '#333', borderBottom: '1px solid #f0f0f0', textAlign: 'right', whiteSpace: 'nowrap' };

// pastel column backgrounds (matching saerp look)
const colBg = ['#f3f0fa', '#eef7ef', '#eaf3fb', '#fbf6ea', '#f7f0ef', '#eef7ef', '#fbf6ea', '#eaf3fb'];

const columns = ['Balance', 'Collection', 'Received', 'Expense', 'Transfer', 'Payment', 'Give Loan', 'Get Loan'];

const employees = [
    { id: 1, name: 'Md. Ruksat Hasan Akib', code: 'AIE-000057', vals: ['0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00'] },
    { id: 2, name: 'Aktaruzzaman Monir', code: 'AIE-000036', vals: ['0.00', '2,57,91,280.00', '2,57,78,992.00', '12,288.00', '0.00', '0.00', '0.00', '0.00'] },
    { id: 3, name: 'Md. Shafirul Islam', code: 'AIE-000054', vals: ['0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00'] },
    { id: 4, name: 'Abdullah', code: 'AIE-000181', vals: ['0.00', '0.00', '0.00', '0.00', '0.00', '70,00,000.00', '0.00', '0.00'] },
    { id: 5, name: 'Md. Rakib Hasan', code: 'AIE-000112', vals: ['0.00', '2,00,70,320.00', '0.00', '0.00', '1,00,00,000.00', '0.00', '0.00', '0.00'] },
    { id: 6, name: 'Md. Abul Kalam', code: 'AIE-000024', vals: ['0.00', '2,42,80,3000.00', '2,83,73,812.00', '80,70,000.00', '1,19,62,4374.00', '0.00', '0.00', '0.00'] },
    { id: 7, name: 'Nazmul Islam', code: 'AIE-000073', vals: ['0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00'] },
    { id: 8, name: 'Sadia Afrin', code: 'AIE-000090', vals: ['0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00'] },
    { id: 9, name: 'Md. Yusuf Ali', code: 'AIE-000102', vals: ['0.00', '15,20,000.00', '15,20,000.00', '0.00', '0.00', '0.00', '0.00', '0.00'] },
    { id: 10, name: 'Md. Zahadur Rahman', code: 'AIE-000054', vals: ['0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00'] },
];

function EmployeeAccount() {
    const [search, setSearch] = useState('');
    const [applied, setApplied] = useState('');

    const handleGo = () => setApplied(search);
    const handleClear = () => { setSearch(''); setApplied(''); };

    const filtered = employees.filter(e => {
        if (!applied) return true;
        const k = applied.toLowerCase();
        return e.name.toLowerCase().includes(k) || e.code.toLowerCase().includes(k);
    });

    return (
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                &gt; Employee Account
            </div>

            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input placeholder="🔍 Search Employee" value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', width: '200px' }} />
                <button onClick={handleGo} style={{ padding: '7px 18px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Go</button>
                <button onClick={handleClear} style={{ padding: '7px 18px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Clear</button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#1a2035' }}>
                            <th style={{ ...thS, textAlign: 'left', position: 'sticky', left: 0, background: '#1a2035' }}>Employee</th>
                            {columns.map(c => <th key={c} style={thS}>{c}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={columns.length + 1} style={{ ...tdS, textAlign: 'center', padding: '30px', color: '#6c757d' }}>No data found</td></tr>
                        ) : filtered.map((e, ri) => (
                            <tr key={e.id} style={{ background: ri % 2 === 0 ? 'white' : '#fafafa' }}>
                                <td style={{ ...tdS, textAlign: 'left', position: 'sticky', left: 0, background: ri % 2 === 0 ? 'white' : '#fafafa' }}>
                                    <div style={{ fontWeight: '600', color: '#1a2035' }}>{e.name}</div>
                                    <div style={{ color: '#6c757d', fontSize: '11px' }}>[{e.code}]</div>
                                </td>
                                {e.vals.map((v, ci) => (
                                    <td key={ci} style={{ ...tdS, background: colBg[ci], fontWeight: v !== '0.00' ? '600' : '400', color: v !== '0.00' ? '#1a2035' : '#999' }}>{v}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default EmployeeAccount;
