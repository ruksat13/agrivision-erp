import React, { useState } from 'react';

const thS = { padding: '10px 12px', color: 'white', fontWeight: '600', fontSize: '13px', textAlign: 'left' };
const tdS = { padding: '9px 12px', fontSize: '12px', color: '#333', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' };

const suppliers = [
    { id: 1, name: 'M/S- Haque Traders', code: 'AIS-000073', phone: '01719126228', debit: '4,59,900.00', credit: '4,59,900.00', balance: '0.00' },
    { id: 2, name: 'A. N. S corporation', code: 'AIS-000067', phone: '01706994572', debit: '0.00', credit: '0.00', balance: '0.00' },
    { id: 3, name: 'Agro Dragon CO. Ltd.', code: 'AIS-000025', phone: '00862150586321', debit: '13,76,91,000.00', credit: '16,90,80,000.00', balance: '-3,13,89,000.00' },
    { id: 4, name: 'Agro Export bd Ltd', code: 'AIS-000077', phone: '000000000012', debit: '0.00', credit: '0.00', balance: '0.00' },
    { id: 5, name: 'Agro Villa', code: 'AIS-000072', phone: '01712484700', debit: '83,27,200.00', credit: '83,27,200.00', balance: '0.00' },
    { id: 6, name: 'Agro Winner Ltd', code: 'AIS-000020', phone: '01911234862', debit: '13,70,000.00', credit: '13,70,000.00', balance: '0.00' },
    { id: 7, name: 'AGROIRIS (BD) LTD (RAINBOW)', code: 'AIS-000056', phone: '01713523926', debit: '5,38,61,500.00', credit: '7,02,36,250.00', balance: '-1,63,74,750.00' },
    { id: 8, name: 'Ak Azad', code: 'AIS-000030', phone: '01318313055', debit: '1,37,000.00', credit: '1,37,000.00', balance: '0.00' },
    { id: 9, name: 'Allwells Marketing Ltd', code: 'AIS-000060', phone: '01700000000', debit: '14,31,430.00', credit: '14,31,430.00', balance: '0.00' },
    { id: 10, name: 'Anika Agro Industries', code: 'AIS-000023', phone: '01717911925', debit: '0.00', credit: '0.00', balance: '0.00' },
    { id: 11, name: 'AR Khan and CO.', code: 'AIS-000015', phone: '91102140213', debit: '1,07,66,030.00', credit: '1,44,13,905.00', balance: '-36,47,875.00' },
    { id: 12, name: 'Babylon Agro And Dairy Ltd', code: 'AIS-000001', phone: '01713758580', debit: '0.00', credit: '0.00', balance: '0.00' },
    { id: 13, name: 'Bohigh zinc Product co L t d', code: 'AIS-000068', phone: '+16188879966808', debit: '29,60,000.00', credit: '29,60,000.00', balance: '0.00' },
    { id: 14, name: 'Bohigh ZINC Product Co., LTD', code: 'AIS-000064', phone: '154789636248', debit: '26,14,955.00', credit: '26,14,955.00', balance: '0.00' },
    { id: 15, name: 'Bongshe Moharaj & Agro Tecnology', code: 'AIS-000088', phone: '01723002558', debit: '17,90,000.00', credit: '17,90,000.00', balance: '0.00' },
    { id: 16, name: 'Brac Bank Ltd', code: 'AIS-000036', phone: '01958379648', debit: '2,00,45,500.00', credit: '2,00,45,500.00', balance: '0.00' },
    { id: 17, name: 'CANARY AGRO CHEMICALS PRIVATE LIMITED', code: 'AIS-000024', phone: '+9101141251904', debit: '9,90,33,200.00', credit: '9,85,33,200.00', balance: '5,00,000.00' },
    { id: 18, name: 'Chemist Crop Care', code: 'AIS-000017', phone: '01711101605', debit: '0.00', credit: '0.00', balance: '0.00' },
    { id: 19, name: 'Cormandel India', code: 'AIS-000048', phone: '+919830140811', debit: '1,40,01,548.00', credit: '1,40,01,548.00', balance: '0.00' },
    { id: 20, name: 'Digital Poly Pack', code: 'AIS-000008', phone: '01782681199', debit: '1,61,96,727.00', credit: '1,92,96,775.50', balance: '-31,00,048.50' },
    { id: 21, name: 'Elahi Electric (Bogura)', code: 'AIS-000062', phone: '01765000000', debit: '10,97,262.00', credit: '10,97,262.00', balance: '0.00' },
    { id: 22, name: 'Emkay Enterprise Limited', code: 'AIS-000043', phone: '01727000000', debit: '11,37,386.00', credit: '11,37,386.00', balance: '0.00' },
    { id: 29, name: 'Joypur para Bosta bitan', code: 'AIS-000071', phone: '01408850534', debit: '0.00', credit: '0.00', balance: '0.00' },
    { id: 30, name: 'Joypurpara Bosta Bitan', code: 'AIS-000045', phone: '01976399386', debit: '2,68,160.00', credit: '2,68,160.00', balance: '0.00' },
    { id: 31, name: 'Karatoa Traders', code: 'AIS-000014', phone: '01711715064', debit: '0.00', credit: '0.00', balance: '0.00' },
    { id: 32, name: 'Lanka Bangla Bank ltd', code: 'AIS-000034', phone: '01313795949', debit: '1,00,68,000.00', credit: '1,00,68,000.00', balance: '0.00' },
    { id: 33, name: 'M F Fashion', code: 'AIS-000063', phone: '01750971093', debit: '5,62,782.00', credit: '5,62,782.00', balance: '0.00' },
    { id: 34, name: 'M/s Agrivision Intermasnal', code: 'AIS-000070', phone: '01313130078', debit: '9,00,115.00', credit: '9,00,115.00', balance: '0.00' },
    { id: 35, name: 'M/S C P C Trading', code: 'AIS-000074', phone: '01711429924', debit: '55,04,000.00', credit: '55,04,000.00', balance: '0.00' },
    { id: 36, name: 'M/S Home Pest Control', code: 'AIS-000059', phone: '01737558788', debit: '47,70,000.00', credit: '47,70,000.00', balance: '0.00' },
    { id: 37, name: 'M/s Jakirul Islam', code: 'AIS-000085', phone: '01747018954', debit: '1,50,000.00', credit: '2,59,337.00', balance: '-1,09,337.00' },
    { id: 38, name: 'M/s Naba Crop Care', code: 'AIS-000078', phone: '01711111112', debit: '0.00', credit: '0.00', balance: '0.00' },
    { id: 39, name: 'M/S Unique Refrigiregition', code: 'AIS-000082', phone: '01711164801', debit: '57,000.00', credit: '57,000.00', balance: '0.00' },
    { id: 40, name: 'M/s- Akondho Gift Please', code: 'AIS-000065', phone: '01713109456', debit: '3,03,270.00', credit: '3,03,270.00', balance: '0.00' },
    { id: 41, name: 'M/s- Sumon Steel & Wooden Furniture', code: 'AIS-000066', phone: '01716212869', debit: '82,500.00', credit: '82,500.00', balance: '0.00' },
    { id: 42, name: 'Madina Printing Pack', code: 'AIS-000003', phone: '01722465593', debit: '1,06,45,403.00', credit: '1,12,59,139.03', balance: '-6,13,736.03' },
    { id: 43, name: 'Maruti Mineral Industries India', code: 'AIS-000083', phone: '01777246757', debit: '13,29,750.00', credit: '13,29,750.00', balance: '0.00' },
    { id: 44, name: 'Masum Cloth Store', code: 'AIS-000061', phone: '01733117540', debit: '4,78,559.00', credit: '4,78,559.00', balance: '0.00' },
    { id: 45, name: 'Md. Anisur Rahman (Sir Mama)', code: 'AIS-000031', phone: '01751848463', debit: '4,00,000.00', credit: '4,00,000.00', balance: '0.00' },
    { id: 46, name: 'Md. Nafizur Rahman', code: 'AIS-000038', phone: '01318313011', debit: '10,00,000.00', credit: '10,00,000.00', balance: '0.00' },
    { id: 47, name: 'Md. Nazrul Islam', code: 'AIS-000039', phone: '01718709017', debit: '35,00,000.00', credit: '35,00,000.00', balance: '0.00' },
    { id: 48, name: 'Md. Ripple', code: 'AIS-000042', phone: '01727852802', debit: '70,000.00', credit: '70,000.00', balance: '0.00' },
    { id: 49, name: 'Mitali Offset Press and Computer', code: 'AIS-000004', phone: '01727852390', debit: '66,88,905.00', credit: '71,26,540.00', balance: '-4,37,635.00' },
    { id: 50, name: 'Mridha Traders', code: 'AIS-000026', phone: '01722236509', debit: '74,91,130.60', credit: '88,50,680.60', balance: '-13,59,550.00' },
];

const PAGE_SIZE = 25;

function SupplierLedger() {
    const [page, setPage] = useState(1);
    const [draft, setDraft] = useState('');
    const [applied, setApplied] = useState('');
    const handleGo = () => { setApplied(draft); setPage(1); };
    const handleClear = () => { setDraft(''); setApplied(''); setPage(1); };

    const filteredSuppliers = suppliers.filter(s => {
        if (!applied) return true;
        const k = applied.toLowerCase();
        return s.name.toLowerCase().includes(k) || s.code.toLowerCase().includes(k) || s.phone.includes(applied);
    });

    const totalPages = Math.max(1, Math.ceil(filteredSuppliers.length / PAGE_SIZE));
    const paged = filteredSuppliers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                &gt; Supplier Ledger
            </div>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input placeholder="Search name & code" value={draft} onChange={e => setDraft(e.target.value)} style={{ padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', width: '200px' }} />
                <button onClick={handleGo} style={{ padding: '7px 18px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Go</button>
                <button onClick={handleClear} style={{ padding: '7px 18px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Clear</button>
                <button style={{ padding: '7px 10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>🖨️</button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#1a2035' }}>
                            <th style={{ ...thS, width: '40px', textAlign: 'center' }}>#</th>
                            <th style={thS}>Supplier</th>
                            <th style={{ ...thS, textAlign: 'right' }}>Debit</th>
                            <th style={{ ...thS, textAlign: 'right' }}>Credit</th>
                            <th style={{ ...thS, textAlign: 'right' }}>Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paged.length === 0 ? (
                            <tr><td colSpan={5} style={{ ...tdS, textAlign: 'center', padding: '30px', color: '#6c757d' }}>No data found</td></tr>
                        ) : paged.map((s, i) => (
                            <tr key={s.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                <td style={{ ...tdS, textAlign: 'center' }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                                <td style={tdS}>
                                    <div style={{ color: '#0d6efd', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>{s.name} [{s.code}]</div>
                                    <div style={{ color: '#6c757d', fontSize: '11px' }}>{s.phone}</div>
                                </td>
                                <td style={{ ...tdS, textAlign: 'right', background: '#f5f0e8' }}>{s.debit}</td>
                                <td style={{ ...tdS, textAlign: 'right' }}>{s.credit}</td>
                                <td style={{ ...tdS, textAlign: 'right', color: s.balance.startsWith('-') ? '#dc3545' : s.balance === '0.00' ? '#333' : '#28a745', fontWeight: '600' }}>{s.balance}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr style={{ background: '#f8f9fa', fontWeight: '700' }}>
                            <td colSpan={2} style={{ ...tdS, textAlign: 'right', fontWeight: '700', color: '#1a2035' }}>Total</td>
                            <td style={{ ...tdS, textAlign: 'right', fontWeight: '700' }}>0.00</td>
                            <td style={{ ...tdS, textAlign: 'right', fontWeight: '700' }}>0.00</td>
                            <td style={{ ...tdS, textAlign: 'right', fontWeight: '700', color: '#dc3545' }}>-59,79,681,553</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Pagination */}
            <div style={{ padding: '14px 20px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)} style={{ padding: '4px 10px', background: p === page ? '#1a2035' : 'white', color: p === page ? 'white' : '#333', border: '1px solid #dee2e6', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>{p}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} style={{ padding: '4px 10px', background: 'white', border: '1px solid #dee2e6', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>&gt;</button>
            </div>
        </div>
    );
}

export default SupplierLedger;
