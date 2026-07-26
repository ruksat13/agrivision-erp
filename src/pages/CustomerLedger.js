import React, { useState } from 'react';

const thS = { padding: '10px 12px', color: 'white', fontWeight: '600', fontSize: '13px', textAlign: 'left' };
const tdS = { padding: '9px 12px', fontSize: '12px', color: '#333', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' };

const customers = [
    { id: 1, name: 'M/S Bhai Bhai Traders', code: 'AIC-000001', phone: '01746604015', territory: 'Mohastan Bazar, Shibganj, Bogura', area: 'Bogura Sadar, Bogura', debit: '1,19,75,676.40', credit: '1,24,06,006.40', balance: '-4,30,330.00' },
    { id: 2, name: 'M/S A T Z R Traders', code: 'AIC-000002', phone: '01783835493', territory: 'Aliarhat, Shibganj, Bogura', area: 'Bogura Sadar, Bogura', debit: '4,14,451.00', credit: '4,14,451.00', balance: '0.00' },
    { id: 3, name: 'M/S Rabbi Traders', code: 'AIC-000003', phone: '01712676397', territory: 'Chondihara Bazar, Shibganj, Bogura', area: 'Bogura Sadar, Bogura', debit: '1,05,000.00', credit: '1,61,040.00', balance: '-56,040.00' },
    { id: 4, name: 'M/S Zim Traders', code: 'AIC-000004', phone: '01746498640', territory: 'Mohastan Bazar, Shibganj, Bogura', area: 'Bogura Sadar, Bogura', debit: '0.00', credit: '3,267.00', balance: '-3,267.00' },
    { id: 5, name: 'M/S Bulbul Traders', code: 'AIC-000005', phone: '01714923971', territory: 'Sharpukur, Dupchachia, Bogura', area: 'Adamdighi, Bogura', debit: '11,11,913.00', credit: '11,21,810.00', balance: '-9,897.00' },
    { id: 6, name: 'M/S Bismillah Krishi Sheba', code: 'AIC-000006', phone: '01734833502', territory: 'Mokamtola, Shibganj, Bogura', area: 'Bogura Sadar, Bogura', debit: '1,01,993.00', credit: '1,01,993.00', balance: '0.00' },
    { id: 7, name: 'M/S Rehena Traders', code: 'AIC-000007', phone: '01729940386', territory: 'Malipara Bazar, Sajahanpur, Bogura', area: 'Bogura Sadar, Bogura', debit: '7,34,142.00', credit: '9,38,550.00', balance: '-2,04,408.00' },
    { id: 8, name: 'M/S Bhai Bon Traders', code: 'AIC-000008', phone: '01729314155', territory: 'Kolma Bazar, Kahaloo, Bogura', area: 'Bogura Sadar, Bogura', debit: '25,03,412.00', credit: '25,30,861.00', balance: '-27,449.00' },
    { id: 9, name: 'M/S Tasin Traders', code: 'AIC-000009', phone: '01723093002', territory: 'Atmul Bazar, Shibganj, Bogura', area: 'Bogura Sadar, Bogura', debit: '3,33,904.00', credit: '3,33,904.40', balance: '-0.40' },
    { id: 10, name: 'M/S Tasin Traders', code: 'AIC-000010', phone: '01728140735', territory: 'Zamlola Bazar, Shibganj, Bogura', area: 'Bogura Sadar, Bogura', debit: '3,82,863.00', credit: '3,89,183.00', balance: '-6,320.00' },
    { id: 11, name: 'M/S Bhai Bhai Traders', code: 'AIC-000011', phone: '01718695690', territory: 'Paglajir Bazar, Kahaloo, Bogura', area: 'Bogura Sadar, Bogura', debit: '1,70,409.00', credit: '1,70,409.00', balance: '0.00' },
    { id: 12, name: 'M/S Tarikul Traders', code: 'AIC-000012', phone: '01706068634', territory: 'Kachari Hat, Sonatola, Bogura', area: 'Bogura Sadar, Bogura', debit: '36,18,587.00', credit: '44,01,188.00', balance: '-7,82,601.00' },
    { id: 13, name: 'M/S Shohan Traders', code: 'AIC-000013', phone: '01712956451', territory: 'Ucholbari, Kahaloo, Bogura', area: 'Bogura Sadar, Bogura', debit: '6,46,459.00', credit: '6,84,380.00', balance: '-37,921.00' },
    { id: 14, name: 'M/S Moshiur Traders', code: 'AIC-000014', phone: '01721464284', territory: 'Kagoll Bazar, Gabtoli, Bogura', area: 'Bogura Sadar, Bogura', debit: '7,95,231.00', credit: '8,24,676.40', balance: '-29,445.40' },
    { id: 15, name: 'M/S Islam Traders', code: 'AIC-000015', phone: '01714550213', territory: 'Dinerbari, Kahaloo, Bogura', area: 'Bogura Sadar, Bogura', debit: '5,93,055.00', credit: '5,93,055.00', balance: '0.00' },
    { id: 16, name: 'M/s Bhai Bhai Traders', code: 'AIC-000016', phone: '01721418283', territory: 'Pirgasa Bazar, Bogura Sadar, Bogura', area: 'Bogura Sadar, Bogura', debit: '1,12,377.00', credit: '1,83,055.00', balance: '-70,678.00' },
    { id: 17, name: 'M/S Shoriful Traders', code: 'AIC-000017', phone: '01725243764', territory: 'Shibganj, Bogura', area: 'Bogura Sadar, Bogura', debit: '0.00', credit: '0.00', balance: '0.00' },
    { id: 18, name: 'M/S Himu Krishi Bitan', code: 'AIC-000018', phone: '01714768313', territory: 'Raymaghira, Bogura Sadar, Bogura', area: 'Bogura Sadar, Bogura', debit: '1,15,886.00', credit: '1,18,086.00', balance: '-2,200.00' },
    { id: 19, name: 'M/S Bhai Bhai Traders', code: 'AIC-000019', phone: '01721234083', territory: 'Jangarm, Shibganj, Bogura', area: 'Bogura Sadar, Bogura', debit: '18,72,788.00', credit: '19,71,442.84', balance: '-98,654.84' },
    { id: 20, name: 'M/S Sadia Traders', code: 'AIC-000020', phone: '01744418536', territory: 'Majhihotto, Shibganj, Bogura', area: 'Bogura Sadar, Bogura', debit: '10,06,800.00', credit: '11,18,570.00', balance: '-1,11,770.00' },
    { id: 21, name: 'M/S Sumon Traders', code: 'AIC-000021', phone: '01725013735', territory: 'Tangamagur, Shajahanpur, Bogura', area: 'Bogura Sadar, Bogura', debit: '2,22,652.00', credit: '2,28,959.00', balance: '-4,307.00' },
    { id: 22, name: 'M/S Bonna And Bristi Traders', code: 'AIC-000022', phone: '01719025120', territory: 'Kadamtoli Bazar, Gabtoli, Bogura', area: 'Bogura Sadar, Bogura', debit: '2,76,309.00', credit: '2,80,795.52', balance: '-4,486.52' },
    { id: 29, name: 'M/s- Imtias Traders', code: 'AIC-000029', phone: '01721840961', territory: 'Kalai, Joypurhat, Bogura', area: 'Kalai Joypurhat, Bogura', debit: '26,37,600.00', credit: '20,02,331.48', balance: '-23,603.48' },
    { id: 30, name: 'M/S Salota Traders', code: 'AIC-000030', phone: '01713566749', territory: 'Chanpara, Panchbibi, Joypurhat', area: 'Kalai Joypurhat, Bogura', debit: '69,25,502.00', credit: '81,27,100.60', balance: '-12,01,598.60' },
    { id: 40, name: 'M/S- Arzu Krishi Bitan', code: 'AIC-000041', phone: '01710054574', territory: 'Jamadarpukur, Shajahanpur, Bogura', area: 'Nandigram, Sherpur', debit: '22,63,003.00', credit: '25,37,353.96', balance: '-2,74,350.96' },
    { id: 46, name: 'M/s- Susmoy Traders', code: 'AIC-000046', phone: '01725637498', territory: 'Hatkoi Bazar, Nandigram', area: 'Nandigram, Sherpur', debit: '60,17,809.00', credit: '62,73,516.92', balance: '-2,55,707.92' },
    { id: 48, name: 'M/s- Osoke Traders', code: 'AIC-000048', phone: '01733129109', territory: 'Ranbagha Bazar, Nandigram', area: 'Nandigram, Sherpur', debit: '1,12,76,493.24', credit: '1,13,18,490.56', balance: '-41,997.32' },
    { id: 49, name: 'M/S Bhai Bhai Traders', code: 'AIC-000049', phone: '01763603319', territory: 'Nichinfapur More, Sapahar Naogaon', area: 'Sapahar, Naogaon', debit: '17,51,746.00', credit: '17,51,746.00', balance: '0.00' },
    { id: 50, name: 'M/s- Mehedi Hasan Traders', code: 'AIC-000050', phone: '01793130068', territory: 'Chowmohoni Bazar, Nandigram', area: 'Nandigram, Sherpur', debit: '6,19,051.00', credit: '6,38,897.00', balance: '-19,846.00' },
];

const ledgerRows = [
    { id: 1, date: '01-02-2024', desc: 'Opening balance', descType: 'opening', debit: '', credit: '', balance: '-88,974.00' },
    { id: 2, date: '03-02-2024', desc: 'Invoice', inv: 'AINV-2024-02-0000008', invType: 'Cash', debit: '', credit: '13,056.00', balance: '-1,02,030.00' },
    { id: 3, date: '06-02-2024', desc: 'Cash collection | MRN : 6881', debit: '80,000.00', credit: '', balance: '-22,030.00' },
    { id: 4, date: '08-02-2024', desc: 'Invoice', inv: 'AINV-2024-02-0000182', invType: 'Cash', debit: '', credit: '33,926.00', balance: '-55,956.00' },
    { id: 5, date: '10-02-2024', desc: 'Invoice', inv: 'AINV-2024-02-0000190', invType: 'Cash', debit: '', credit: '13,680.00', balance: '-69,636.00' },
    { id: 6, date: '11-02-2024', desc: 'Cash collection | MRN : 6882', debit: '25,000.00', credit: '', balance: '-44,636.00' },
    { id: 7, date: '11-02-2024', desc: 'Invoice', inv: 'AINV-2024-02-0000202', invType: 'Cash', debit: '', credit: '16,542.00', balance: '-61,178.00' },
    { id: 8, date: '11-02-2024', desc: 'Invoice commission |', debit: '30,054.00', credit: '', balance: '-31,124.00' },
    { id: 9, date: '12-02-2024', desc: 'Invoice', inv: 'AINV-2024-02-0000221', invType: 'Cash', debit: '', credit: '6,528.00', balance: '-37,652.00' },
    { id: 10, date: '15-02-2024', desc: 'Cash collection | MRN : 6883', debit: '13,000.00', credit: '', balance: '-24,652.00' },
    { id: 11, date: '15-02-2024', desc: 'Invoice', inv: 'AINV-2024-02-0000303', invType: 'Cash', debit: '', credit: '15,400.00', balance: '-40,052.00' },
    { id: 12, date: '18-02-2024', desc: 'Invoice', inv: 'AINV-2024-02-0000367', invType: 'Cash', debit: '', credit: '9,282.00', balance: '-49,334.00' },
    { id: 13, date: '21-02-2024', desc: 'Invoice', inv: 'AINV-2024-02-0000420', invType: 'Cash', debit: '', credit: '66,626.00', balance: '-1,15,960.00' },
    { id: 14, date: '22-02-2024', desc: 'Cash collection | MRN : 6885', debit: '10,000.00', credit: '', balance: '-1,05,960.00' },
    { id: 15, date: '24-02-2024', desc: 'Invoice', inv: 'AINV-2024-02-0000457', invType: 'Cash', debit: '', credit: '18,240.00', balance: '-1,24,200.00' },
    { id: 16, date: '25-02-2024', desc: 'Invoice', inv: 'AINV-2024-02-0000521', invType: 'Cash', debit: '', credit: '9,120.00', balance: '-1,33,320.00' },
    { id: 17, date: '25-02-2024', desc: 'Cash collection | MRN : 6886', debit: '20,000.00', credit: '', balance: '-1,13,320.00' },
    { id: 18, date: '27-02-2024', desc: 'Invoice commission |', debit: '34,017.00', credit: '', balance: '-79,303.00' },
    { id: 605, date: '01-06-2026', desc: 'Invoice', inv: 'AINV-2026-06-0033127', invType: 'Cash', debit: '', credit: '49,048.00', balance: '-9,66,840.08' },
    { id: 606, date: '03-06-2026', desc: 'Invoice', inv: 'AINV-2026-06-0033203', invType: 'Cash', debit: '', credit: '6,942.00', balance: '-9,73,782.08' },
    { id: 607, date: '03-06-2026', desc: 'Cash collection | MRN : 32834', debit: '1,00,000.00', credit: '', balance: '-8,73,782.08' },
    { id: 608, date: '04-06-2026', desc: 'Cash collection | MRN : 32837', debit: '70,000.00', credit: '', balance: '-8,03,782.08' },
    { id: 611, date: '08-06-2026', desc: 'Invoice commission | কাশ কমিশন বাবদ দেওয়া হয়', debit: '56,382.00', credit: '', balance: '-7,54,414.08' },
    { id: 614, date: '14-06-2026', desc: 'Product wise commission | ইনভয়েস নং ৩৩১২৭ এর নিউ এগ্রিপ্লাস বাবদ ১০০০ টাকা কমিশন', debit: '1,000.00', credit: '', balance: '-6,53,414.08' },
    { id: 620, date: '30-06-2026', desc: 'Travel allowance | ১ বছরের ৫৩,২২,৩৬৫ টাকা বিক্রির অতিরিক্ত কমিশন বাবদ দেওয়া হয়', debit: '1,50,000.00', credit: '', balance: '-2,12,299.00' },
    { id: 622, date: '01-07-2026', desc: 'Invoice', inv: 'AINV-2026-07-0033811', invType: 'Cash', debit: '', credit: '14,760.00', balance: '-1,27,059.00' },
    { id: 623, date: '02-07-2026', desc: 'Invoice', inv: 'AINV-2026-07-0033833', invType: 'Cash', debit: '', credit: '77,283.00', balance: '-2,04,342.00' },
    { id: 624, date: '05-07-2026', desc: 'Invoice', inv: 'AINV-2026-07-0033926', invType: 'Cash', debit: '', credit: '97,761.00', balance: '-3,02,103.00' },
    { id: 625, date: '06-07-2026', desc: 'Invoice', inv: 'AINV-2026-07-0034007', invType: 'Cash', debit: '', credit: '26,880.00', balance: '-3,26,983.00' },
    { id: 626, date: '08-07-2026', desc: 'Invoice', inv: 'AINV-2026-07-0034078', invType: 'Cash', debit: '', credit: '9,214.00', balance: '-3,38,197.00' },
    { id: 627, date: '14-07-2026', desc: 'Invoice', inv: 'AINV-2026-07-0034240', invType: 'Cash', debit: '', credit: '37,080.00', balance: '-3,75,277.00' },
    { id: 628, date: '22-07-2026', desc: 'Invoice', inv: 'AINV-2026-07-0034593', invType: 'Cash', debit: '', credit: '47,025.00', balance: '-4,22,302.00' },
    { id: 629, date: '22-07-2026', desc: 'Invoice', inv: 'AINV-2026-07-0034596', invType: 'Cash', debit: '', credit: '8,028.00', balance: '-4,30,330.00' },
];

const PAGE_SIZE = 20;

function CustomerLedger() {
    const [view, setView] = useState('list');
    const [selected, setSelected] = useState(null);
    const [page, setPage] = useState(1);

    const emptyF = { search: '', area: '', territory: '' };
    const [draft, setDraft] = useState(emptyF);
    const [applied, setApplied] = useState(emptyF);
    const handleGo = () => { setApplied(draft); setPage(1); };
    const handleClear = () => { setDraft(emptyF); setApplied(emptyF); setPage(1); };

    const filteredCustomers = customers.filter(c => {
        if (applied.search) {
            const k = applied.search.toLowerCase();
            if (!c.name.toLowerCase().includes(k) && !c.code.toLowerCase().includes(k) && !c.phone.includes(applied.search)) return false;
        }
        if (applied.area && c.area !== applied.area) return false;
        if (applied.territory && !c.territory.includes(applied.territory)) return false;
        return true;
    });

    const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
    const paged = filteredCustomers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const openDetail = (c) => { setSelected(c); setView('detail'); };

    if (view === 'detail' && selected) {
        return (
            <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: '0' }}>
                {/* Detail header */}
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span onClick={() => setView('list')} style={{ cursor: 'pointer', color: '#333', fontWeight: '700', fontSize: '14px' }}>&gt; Customer Ledger Details</span>
                    <button style={{ padding: '4px 10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '13px', cursor: 'pointer' }} onClick={() => window.print()}>🖨️</button>
                </div>

                {/* Company + Customer header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 28px', borderBottom: '1px solid #f0f0f0', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#0d6efd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '18px', fontWeight: '800', flexShrink: 0 }}>AI</div>
                        <div>
                            <div style={{ fontSize: '18px', fontWeight: '800', color: '#1a2035' }}>AGRIVISION INTERNATIONAL</div>
                            <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>📍 : House # 42, Road # 11, Block-C, Banani, Dhaka-1213</div>
                            <div style={{ fontSize: '12px', color: '#555' }}>📞 : 01700-123456 &nbsp; ✉ : info@agrivisionbd.com &nbsp; 🌐 : www.agrivisionbd.com</div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '12px', color: '#333' }}>
                        <div style={{ fontWeight: '800', fontSize: '14px', color: '#1a2035', marginBottom: '6px' }}>CUSTOMER LEDGER</div>
                        <div style={{ fontWeight: '600' }}>{selected.name} [{selected.code}]</div>
                        <div>{selected.phone}</div>
                        <div>{selected.territory}</div>
                        <div>{selected.area}</div>
                    </div>
                </div>

                {/* Ledger table */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#1a2035' }}>
                                <th style={{ ...thS, width: '40px', textAlign: 'center' }}>#</th>
                                <th style={thS}>Date</th>
                                <th style={thS}>Description</th>
                                <th style={{ ...thS, textAlign: 'right' }}>Debit</th>
                                <th style={{ ...thS, textAlign: 'right' }}>Credit</th>
                                <th style={{ ...thS, textAlign: 'right' }}>Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ledgerRows.map((r, i) => (
                                <tr key={r.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                    <td style={{ ...tdS, textAlign: 'center' }}>{i + 1}</td>
                                    <td style={{ ...tdS, whiteSpace: 'nowrap' }}>{r.date}</td>
                                    <td style={tdS}>
                                        {r.inv ? (
                                            <>
                                                <div>Invoice</div>
                                                <span style={{ color: '#0d6efd', fontWeight: '600', fontSize: '11px', marginRight: '6px' }}>{r.inv}</span>
                                                <span style={{ background: '#28a745', color: 'white', padding: '1px 6px', borderRadius: '3px', fontSize: '10px' }}>{r.invType}</span>
                                            </>
                                        ) : r.desc}
                                    </td>
                                    <td style={{ ...tdS, textAlign: 'right', background: r.debit ? '#f5f0e8' : 'inherit' }}>{r.debit}</td>
                                    <td style={{ ...tdS, textAlign: 'right' }}>{r.credit}</td>
                                    <td style={{ ...tdS, textAlign: 'right', color: r.balance.startsWith('-') ? '#dc3545' : '#28a745', fontWeight: '600' }}>{r.balance}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ background: '#f8f9fa', fontWeight: '700' }}>
                                <td colSpan={3} style={{ ...tdS, textAlign: 'right', fontWeight: '700' }}>Total</td>
                                <td style={{ ...tdS, textAlign: 'right', fontWeight: '700' }}>{selected.debit}</td>
                                <td style={{ ...tdS, textAlign: 'right', fontWeight: '700' }}>{selected.credit}</td>
                                <td style={{ ...tdS, textAlign: 'right', fontWeight: '700', color: '#dc3545' }}>{selected.balance}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        );
    }

    const totDebit = '9,05,55,048.04';
    const totCredit = '9,75,83,697.04';
    const totBalance = '-70,28,649.00';

    return (
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: '700', fontSize: '14px', color: '#333' }}>
                &gt; Customer Ledger
            </div>

            {/* Filter */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input placeholder="Search" value={draft.search} onChange={e => setDraft(p => ({ ...p, search: e.target.value }))} style={{ padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', width: '160px' }} />
                <select value={draft.area} onChange={e => setDraft(p => ({ ...p, area: e.target.value }))} style={{ padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', minWidth: '140px' }}>
                    <option value="">Select Area</option>
                    <option>Bogura Sadar, Bogura</option>
                    <option>Adamdighi, Bogura</option>
                    <option>Kalai Joypurhat, Bogura</option>
                    <option>Nandigram, Sherpur</option>
                    <option>Sapahar, Naogaon</option>
                </select>
                <select value={draft.territory} onChange={e => setDraft(p => ({ ...p, territory: e.target.value }))} style={{ padding: '7px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', minWidth: '160px' }}>
                    <option value="">Select Territory</option>
                    <option>Mohastan Bazar</option>
                    <option>Kalai</option>
                    <option>Nandigram</option>
                </select>
                <button onClick={handleGo} style={{ padding: '7px 18px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Go</button>
                <button onClick={handleClear} style={{ padding: '7px 18px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Clear</button>
                <button style={{ padding: '7px 10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>🖨️</button>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#1a2035' }}>
                            <th style={{ ...thS, width: '40px', textAlign: 'center' }}>#</th>
                            <th style={thS}>Customer</th>
                            <th style={thS}>Territory</th>
                            <th style={{ ...thS, textAlign: 'right' }}>Debit</th>
                            <th style={{ ...thS, textAlign: 'right' }}>Credit</th>
                            <th style={{ ...thS, textAlign: 'right' }}>Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paged.length === 0 ? (
                            <tr><td colSpan={6} style={{ ...tdS, textAlign: 'center', padding: '30px', color: '#6c757d' }}>No data found</td></tr>
                        ) : paged.map((c, i) => (
                            <tr key={c.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                <td style={{ ...tdS, textAlign: 'center' }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                                <td style={tdS}>
                                    <div onClick={() => openDetail(c)} style={{ color: '#0d6efd', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
                                        {c.name} [{c.code}]
                                    </div>
                                    <div style={{ color: '#6c757d', fontSize: '11px' }}>{c.phone}</div>
                                </td>
                                <td style={tdS}>
                                    <div style={{ fontSize: '12px' }}>{c.territory}</div>
                                    <div style={{ fontSize: '11px', color: '#6c757d' }}>{c.area}</div>
                                </td>
                                <td style={{ ...tdS, textAlign: 'right', background: '#f5f0e8' }}>{c.debit}</td>
                                <td style={{ ...tdS, textAlign: 'right' }}>{c.credit}</td>
                                <td style={{ ...tdS, textAlign: 'right', color: c.balance.startsWith('-') ? '#dc3545' : '#28a745', fontWeight: '600' }}>{c.balance}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr style={{ background: '#f8f9fa', fontWeight: '700' }}>
                            <td colSpan={3} style={{ ...tdS, textAlign: 'right', fontWeight: '700', color: '#1a2035' }}>Total</td>
                            <td style={{ ...tdS, textAlign: 'right', fontWeight: '700' }}>{totDebit}</td>
                            <td style={{ ...tdS, textAlign: 'right', fontWeight: '700' }}>{totCredit}</td>
                            <td style={{ ...tdS, textAlign: 'right', fontWeight: '700', color: '#dc3545' }}>{totBalance}</td>
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
                <button onClick={() => setPage(totalPages)} style={{ padding: '4px 10px', background: 'white', border: '1px solid #dee2e6', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>Last›</button>
            </div>
        </div>
    );
}

export default CustomerLedger;
