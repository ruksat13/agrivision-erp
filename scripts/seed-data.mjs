// Seed data, lifted from the sample arrays already in the pages.
//
//   dealers   ← src/pages/CustomerLedger.js:7   (30 dealers, real codes and territories)
//   invoices  ← src/pages/CancelSales.js:15     (17 invoices *with real line items*)
//   products  ← the line items above, plus ProductDemand.js:17, Repacking.js:21,
//               CentralStockReport.js:7 and Offers.js:14 for the codes
//
// Shapes follow docs/FIRESTORE-SCHEMA.md. This file is plain data — no imports,
// so it runs under Node without any build step.
//
// ─────────────────────────────────────────────────────────────────────────
// TWO THINGS ARE DELIBERATELY NOT INVENTED HERE — see §9 of the schema doc:
//
//   1. Safety data (whoClass, phiDays, firstAidBn, dosageBn …) is null on
//      eighteen of the twenty products, and PLACEHOLDER on the two that carry
//      any — see SAFETY_DATA near the bottom of this file. Filling it in from
//      memory would put unverifiable agricultural safety claims in front of an
//      examiner. Photograph the labels and use SAFETY_TEMPLATE.
//
//   2. The `bannedAuthority` strings below are PLACEHOLDERS. Replace them with
//      a real DAE / gazette notification reference before submission —
//      UNIQUE-FEATURES.md §7 asks for exactly this.
// ─────────────────────────────────────────────────────────────────────────

const slug = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ══ Offices ══════════════════════════════════════════════════════════════
export const OFFICES = ['head', 'jessore', 'jamalpur'];

// ══ Products ═════════════════════════════════════════════════════════════
// `category` is the field Feature 1 gates on — it is on every row (schema D1).
// Codes come from the pages where they exist; the eight products that appear
// only as invoice line text were given codes in the same AI-000xxx series.

export const PRODUCTS = [
    // ── Pesticides ───────────────────────────────────────────────────────
    { code: 'AI-000101', name: 'Jassquate 61sl 100 Ml', category: 'Pesticide', unitId: 'ML', packSize: '100 Ml', packQty: 100, cartonQty: 24, type: 'Finished', mrp: 170.44, buyPrice: 120.00, brandId: 'agrivision', originId: 'bangladesh' },
    { code: 'AI-000102', name: 'Smartzeb 80 Wp 100 Gm', category: 'Pesticide', unitId: 'GM', packSize: '100 Gm', packQty: 100, cartonQty: 24, type: 'Finished', mrp: 112.00, buyPrice: 78.00, brandId: 'agrivision', originId: 'bangladesh' },
    { code: 'AI-000103', name: 'Smartzeb 80 Wp 100 Gm (blue)', category: 'Pesticide', unitId: 'GM', packSize: '100 Gm', packQty: 100, cartonQty: 24, type: 'Finished', mrp: 102.00, buyPrice: 72.00, brandId: 'agrivision', originId: 'bangladesh' },
    { code: 'AI-000104', name: 'Cupertino 72wp Blue 100 Gm', category: 'Pesticide', unitId: 'GM', packSize: '100 Gm', packQty: 100, cartonQty: 24, type: 'Finished', mrp: 171.00, buyPrice: 118.00, brandId: 'agrivision', originId: 'china' },
    { code: 'AI-000105', name: 'Blue Sundari 72wp 100gm', category: 'Pesticide', unitId: 'GM', packSize: '100 Gm', packQty: 100, cartonQty: 24, type: 'Finished', mrp: 192.75, buyPrice: 134.00, brandId: 'agrivision', originId: 'china' },
    { code: 'AI-000044', name: 'Egsul 80 Wg 1 Kg', category: 'Pesticide', unitId: 'KG', packSize: '1 KG', packQty: 1, cartonQty: 10, type: 'Finished', mrp: 325.00, buyPrice: 240.00, brandId: 'agrivision', originId: 'china' },
    { code: 'AI-000452', name: 'Kepnar 3gr (fipronil 3%) 1 Kg', category: 'Pesticide', unitId: 'KG', packSize: '1 KG', packQty: 1, cartonQty: 10, type: 'Finished', mrp: 268.00, buyPrice: 195.00, brandId: 'agrivision', originId: 'china' },
    { code: 'AI-000716', name: 'New Churanto 1.8ec 100 Ml', category: 'Pesticide', unitId: 'ML', packSize: '100 Ml', packQty: 100, cartonQty: 24, type: 'Finished', mrp: 148.00, buyPrice: 104.00, brandId: 'agrivision', originId: 'china' },
    { code: 'AI-000054', name: 'Memory Plus 32.5sc 100 Ml', category: 'Pesticide', unitId: 'ML', packSize: '100 Ml', packQty: 100, cartonQty: 24, type: 'Finished', mrp: 320.00, buyPrice: 232.00, brandId: 'agrivision', originId: 'china' },
    { code: 'AI-000642', name: 'Tetop 100 ml', category: 'Pesticide', unitId: 'ML', packSize: '100 Ml', packQty: 100, cartonQty: 24, type: 'Finished', mrp: 252.00, buyPrice: 180.00, brandId: 'agrivision', originId: 'china' },
    { code: 'AI-000006', name: 'Porbot 2.5ec 50 Ml', category: 'Pesticide', unitId: 'ML', packSize: '50 Ml', packQty: 50, cartonQty: 24, type: 'Finished', mrp: 96.00, buyPrice: 66.00, brandId: 'agrivision', originId: 'bangladesh' },
    { code: 'AI-000025', name: 'Hundred Plus 40wdg 100gm', category: 'Pesticide', unitId: 'GM', packSize: '100 Gm', packQty: 100, cartonQty: 24, type: 'Finished', mrp: 410.00, buyPrice: 298.00, brandId: 'agrivision', originId: 'china' },

    // ── Plant growth regulators ──────────────────────────────────────────
    { code: 'AI-000535', name: 'Super Green 25sc (paclobutrazol 25%) 1 Ltr', category: 'PGR', unitId: 'LTR', packSize: '1 Ltr', packQty: 1, cartonQty: 6, type: 'Finished', mrp: 4500.00, buyPrice: 3300.00, brandId: 'agrivision', originId: 'china' },
    { code: 'AI-000092', name: 'Shikor Hormon 1kg', category: 'PGR', unitId: 'KG', packSize: '1 KG', packQty: 1, cartonQty: 20, type: 'Finished', mrp: 210.00, buyPrice: 148.00, brandId: 'agrivision', originId: 'bangladesh' },
    { code: 'AI-000049', name: 'Green Charge 1 Ltr', category: 'PGR', unitId: 'LTR', packSize: '1 Ltr', packQty: 1, cartonQty: 6, type: 'Finished', mrp: 463.00, buyPrice: 330.00, brandId: 'agrivision', originId: 'china' },

    // ── Fertilisers / micronutrients ─────────────────────────────────────
    { code: 'AI-000730', name: 'Agri Zink 1KG', category: 'Fertilizer', unitId: 'KG', packSize: '1 KG', packQty: 1, cartonQty: 20, type: 'Finished', mrp: 190.00, buyPrice: 132.00, brandId: 'agrivision', originId: 'bangladesh' },
    { code: 'AI-000099', name: 'Noorzink Mono 1 Kg', category: 'Fertilizer', unitId: 'KG', packSize: '1 KG', packQty: 1, cartonQty: 10, type: 'Finished', mrp: 240.00, buyPrice: 170.00, brandId: 'agrivision', originId: 'bangladesh' },
    { code: 'AI-000098', name: 'Turki Boron 500 Gm', category: 'Fertilizer', unitId: 'GM', packSize: '500 Gm', packQty: 500, cartonQty: 20, type: 'Finished', mrp: 320.00, buyPrice: 228.00, brandId: 'agrivision', originId: 'turkey' },
    { code: 'AI-000106', name: 'Agrivit Plus 500ml', category: 'Fertilizer', unitId: 'ML', packSize: '500 Ml', packQty: 500, cartonQty: 12, type: 'Finished', mrp: 220.42, buyPrice: 152.00, brandId: 'agrivision', originId: 'bangladesh' },
    { code: 'AI-000107', name: 'GreenMax Fertilizer 1kg', category: 'Fertilizer', unitId: 'KG', packSize: '1 KG', packQty: 1, cartonQty: 12, type: 'Finished', mrp: 336.67, buyPrice: 240.00, brandId: 'agrivision', originId: 'bangladesh' },
    { code: 'AI-000108', name: 'GreenMax Super 1kg', category: 'Fertilizer', unitId: 'KG', packSize: '1 KG', packQty: 1, cartonQty: 12, type: 'Finished', mrp: 508.46, buyPrice: 362.00, brandId: 'agrivision', originId: 'bangladesh' },

    // ── Gift items (no licence required — exercises LICENCE_FOR_CATEGORY) ─
    { code: 'AI-000738', name: 'Bucket 10 LTR', category: 'Gift', unitId: 'PCS', packSize: '10 Ltr', packQty: 1, cartonQty: 1, type: 'Finished', mrp: 0, buyPrice: 210.00, brandId: null, originId: 'bangladesh' },

    // ── The two banned products (Feature 2) ──────────────────────────────
    // Brand names invented for the demonstration. The active ingredients are
    // the reason a withdrawal is plausible; `bannedAuthority` is a PLACEHOLDER
    // and must be replaced with a real notification reference.
    {
        code: 'AI-000905', name: 'Farmguard 35ec (endosulfan 35%) 250 Ml', category: 'Pesticide',
        unitId: 'ML', packSize: '250 Ml', packQty: 250, cartonQty: 20, type: 'Finished',
        mrp: 285.00, buyPrice: 198.00, brandId: 'agrivision', originId: 'china',
        bannedFrom: '2026-06-01',
        bannedReason: 'Registration withdrawn — active ingredient de-registered for agricultural use',
        bannedAuthority: 'PLACEHOLDER — replace with the real DAE notification reference',
    },
    {
        code: 'AI-000906', name: 'Cropsafe 5g (carbofuran 5%) 1 Kg', category: 'Pesticide',
        unitId: 'KG', packSize: '1 KG', packQty: 1, cartonQty: 10, type: 'Finished',
        mrp: 175.00, buyPrice: 122.00, brandId: 'agrivision', originId: 'china',
        bannedFrom: '2026-07-15',
        bannedReason: 'Registration withdrawn — active ingredient de-registered for agricultural use',
        bannedAuthority: 'PLACEHOLDER — replace with the real DAE notification reference',
    },
];

// Line items on the seeded invoices name products in prose. This resolves them.
export const PRODUCT_BY_NAME = PRODUCTS.reduce((m, p) => ({ ...m, [p.name]: p.code }), {});

// ══ Sales officers ═══════════════════════════════════════════════════════
// Codes and names taken from the officer field on the CancelSales invoices.
// NOTE: the document ID should be the Firebase Auth uid. Auth accounts do not
// exist yet, so the officer code is used as a placeholder — step 5 of the
// migration order in the schema doc replaces these.

export const OFFICERS = [
    { code: 'AIO-000010', name: 'Md. Sales Officer', email: 'officer10@agrivision.com', areaId: 'dhaka', territoryId: 'mohammadpur' },
    { code: 'AIO-000025', name: 'Md. Moynul Hasan Shadik', email: 'officer25@agrivision.com', areaId: 'naogaon', territoryId: 'naogaon-sadar' },
    { code: 'AIO-000034', name: 'Md. Ariful Islam', email: 'officer34@agrivision.com', areaId: 'fulbari', territoryId: 'parbotipur-dinajpur' },
    { code: 'AIO-000058', name: 'Md. Faruk Islam', email: 'officer58@agrivision.com', areaId: 'panchagarh', territoryId: 'tetulia-panchagarh' },
    { code: 'AIO-000083', name: 'Md. Mahedi Hasan Antor', email: 'officer83@agrivision.com', areaId: 'bogura', territoryId: 'bogura-sadar' },
    { code: 'AIO-000106', name: 'Rozob Ali', email: 'officer106@agrivision.com', areaId: 'rajshahi', territoryId: 'tanore' },
    { code: 'AIO-000195', name: 'Bimol Kumar', email: 'officer195@agrivision.com', areaId: 'rangpur', territoryId: 'rangpur-sadar' },
];

// The password every seeded account is created with. Demo data in a throwaway
// emulator — it is not a secret, and it is stated in the README so the account
// list and the password cannot drift apart.
export const DEMO_PASSWORD = '123456';

/**
 * Page access for a Sales Officer. Includes `/sales-entry`, because raising the
 * order that Feature 1 blocks is the officer's own job — step 2 of the demo
 * script in INTERNAL-PLAN.md §7. It does NOT include `/audit-log`: Security
 * Rules let only an admin, an Area Manager or an Accountant read that
 * collection, so offering the page to an officer would open a screen that can
 * only show an error. The officer is the person a block is aimed at, not one
 * of the people who may waive it, so there is nothing of theirs to audit.
 *
 * Nor `/compliance-report`. Licence upkeep is the Area Manager's and the
 * Accountant's — firestore.rules grants create/update on `licences` to exactly
 * those two plus a Super Admin, so page access is matched to the authority to
 * act on what the page shows. An officer who cannot renew a licence has no use
 * for the register of them.
 */
export const OFFICER_PERMISSIONS = [
    '/', '/sales-entry', '/sales', '/customer', '/customer-ledger',
    '/sales-report', '/stock-report',
];

// Non-officer accounts. Roles come from ROLE in src/services/constants.js —
// the same vocabulary firestore.rules reads out of users/{uid}.
export const STAFF = [
    { code: 'AIU-000001', name: 'Md. Ruksat Hasan Akib', email: 'akib@agrivision.com', role: 'Super Admin', permissions: 'all' },
    { code: 'AIU-000002', name: 'Nazmul Islam', email: 'nazmul@agrivision.com', role: 'Managing Director', permissions: 'all' },
    // Needs /sales-entry to perform the step-4 override, and /cancel-sales
    // because PROJECT-OUTLINE.md §3.4 makes cancellation their decision.
    // areaId is 'bogura-sadar', not 'bogura': firestore.rules scopes a manager
    // with myArea(resource.data.areaId), an exact string match against the
    // dealer's own areaId. 21 of the 30 seeded dealers are 'bogura-sadar' and
    // none is 'bogura', so the old value matched nothing and this manager would
    // have seen an empty dealer list the moment the real rules were deployed.
    // /audit-log is here because this is the role that authorises an override.
    // Steps 4 and 5 of the demo script are the same person waiving a block and
    // then reading the record of it; without this the sequence needed a third
    // login, and more importantly an override its author cannot audit is a
    // weaker control. firestore.rules grants the matching read.
    { code: 'AIU-000003', name: 'Sadia Akter', email: 'sadia@agrivision.com', role: 'Area Manager', areaId: 'bogura-sadar', permissions: ['/', '/sales-entry', '/sales', '/cancel-sales', '/customer', '/license', '/compliance-report', '/sales-report', '/audit-log'] },
    // The Accountant gets /audit-log because firestore.rules already grants
    // that role the read (see the audit_log match block), and
    // /compliance-report for the same reason as the Area Manager below.
    { code: 'AIU-000004', name: 'Rahim Uddin', email: 'rahim@agrivision.com', role: 'Accountant', permissions: ['/', '/customer-ledger', '/cash-collection', '/expense', '/audit-log', '/compliance-report'] },
    { code: 'AIU-000005', name: 'Karim Hossain', email: 'karim@agrivision.com', role: 'Storekeeper', permissions: ['/', '/purchase', '/batch', '/stock-report', '/product-demand'] },
];

// ══ Dealers ══════════════════════════════════════════════════════════════
// Lifted verbatim from CustomerLedger.js:7-35.
//
// `bal` is that file's debit − credit. In this schema `balance` is a
// receivable, so the magnitude is used as the opening balance — otherwise
// almost every dealer would seed with a negative balance and the Due report
// would be empty.

const D = (code, name, phone, territory, area, bal) => ({
    code, name, phone,
    territoryId: slug(territory.split(',')[0]),
    areaId: slug(area.split(',')[0]),
    address: territory,
    openingBalance: Math.abs(bal),
});

export const DEALERS = [
    D('AIC-000001', 'M/S Bhai Bhai Traders', '01746604015', 'Mohastan Bazar, Shibganj, Bogura', 'Bogura Sadar, Bogura', 430330),
    D('AIC-000002', 'M/S A T Z R Traders', '01783835493', 'Aliarhat, Shibganj, Bogura', 'Bogura Sadar, Bogura', 0),
    D('AIC-000003', 'M/S Rabbi Traders', '01712676397', 'Chondihara Bazar, Shibganj, Bogura', 'Bogura Sadar, Bogura', 56040),
    D('AIC-000004', 'M/S Zim Traders', '01746498640', 'Mohastan Bazar, Shibganj, Bogura', 'Bogura Sadar, Bogura', 3267),
    D('AIC-000005', 'M/S Bulbul Traders', '01714923971', 'Sharpukur, Dupchachia, Bogura', 'Adamdighi, Bogura', 9897),
    D('AIC-000006', 'M/S Bismillah Krishi Sheba', '01734833502', 'Mokamtola, Shibganj, Bogura', 'Bogura Sadar, Bogura', 0),
    D('AIC-000007', 'M/S Rehena Traders', '01729940386', 'Malipara Bazar, Sajahanpur, Bogura', 'Bogura Sadar, Bogura', 204408),
    D('AIC-000008', 'M/S Bhai Bon Traders', '01729314155', 'Kolma Bazar, Kahaloo, Bogura', 'Bogura Sadar, Bogura', 27449),
    D('AIC-000009', 'M/S Tasin Traders', '01723093002', 'Atmul Bazar, Shibganj, Bogura', 'Bogura Sadar, Bogura', 0),
    D('AIC-000010', 'M/S Tasin Traders (Zamlola)', '01728140735', 'Zamlola Bazar, Shibganj, Bogura', 'Bogura Sadar, Bogura', 6320),
    D('AIC-000011', 'M/S Bhai Bhai Traders (Paglajir)', '01718695690', 'Paglajir Bazar, Kahaloo, Bogura', 'Bogura Sadar, Bogura', 0),
    D('AIC-000012', 'M/S Tarikul Traders', '01706068634', 'Kachari Hat, Sonatola, Bogura', 'Bogura Sadar, Bogura', 782601),
    D('AIC-000013', 'M/S Shohan Traders', '01712956451', 'Ucholbari, Kahaloo, Bogura', 'Bogura Sadar, Bogura', 37921),
    D('AIC-000014', 'M/S Moshiur Traders', '01721464284', 'Kagoll Bazar, Gabtoli, Bogura', 'Bogura Sadar, Bogura', 29445),
    D('AIC-000015', 'M/S Islam Traders', '01714550213', 'Dinerbari, Kahaloo, Bogura', 'Bogura Sadar, Bogura', 0),
    D('AIC-000016', 'M/s Bhai Bhai Traders (Pirgasa)', '01721418283', 'Pirgasa Bazar, Bogura Sadar, Bogura', 'Bogura Sadar, Bogura', 70678),
    D('AIC-000017', 'M/S Shoriful Traders', '01725243764', 'Shibganj, Bogura', 'Bogura Sadar, Bogura', 0),
    D('AIC-000018', 'M/S Himu Krishi Bitan', '01714768313', 'Raymaghira, Bogura Sadar, Bogura', 'Bogura Sadar, Bogura', 2200),
    D('AIC-000019', 'M/S Bhai Bhai Traders (Jangarm)', '01721234083', 'Jangarm, Shibganj, Bogura', 'Bogura Sadar, Bogura', 98654),
    D('AIC-000020', 'M/S Sadia Traders', '01744418536', 'Majhihotto, Shibganj, Bogura', 'Bogura Sadar, Bogura', 111770),
    D('AIC-000021', 'M/S Sumon Traders', '01725013735', 'Tangamagur, Shajahanpur, Bogura', 'Bogura Sadar, Bogura', 4307),
    D('AIC-000022', 'M/S Bonna And Bristi Traders', '01719025120', 'Kadamtoli Bazar, Gabtoli, Bogura', 'Bogura Sadar, Bogura', 4486),
    D('AIC-000029', 'M/s- Imtias Traders', '01721840961', 'Kalai, Joypurhat, Bogura', 'Kalai Joypurhat, Bogura', 23603),
    D('AIC-000030', 'M/S Salota Traders', '01713566749', 'Chanpara, Panchbibi, Joypurhat', 'Kalai Joypurhat, Bogura', 1201598),
    D('AIC-000041', 'M/S- Arzu Krishi Bitan', '01710054574', 'Jamadarpukur, Shajahanpur, Bogura', 'Nandigram, Sherpur', 274350),
    D('AIC-000046', 'M/s- Susmoy Traders', '01725637498', 'Hatkoi Bazar, Nandigram', 'Nandigram, Sherpur', 255707),
    D('AIC-000048', 'M/s- Osoke Traders', '01733129109', 'Ranbagha Bazar, Nandigram', 'Nandigram, Sherpur', 41997),
    D('AIC-000049', 'M/S Bhai Bhai Traders (Sapahar)', '01763603319', 'Nichinfapur More, Sapahar Naogaon', 'Sapahar, Naogaon', 0),
    D('AIC-000050', 'M/s- Mehedi Hasan Traders', '01793130068', 'Chowmohoni Bazar, Nandigram', 'Nandigram, Sherpur', 19846),
    // From the invoices below, so every invoice resolves to a dealer
    D('AIC-000167', 'M/s- Tin Bhai Traders', '01717758070', 'Choupoti Bazar, Parbotipur Dinajpur', 'Fulbari, Dinajpur', 0),
];

// ══ Invoices ═════════════════════════════════════════════════════════════
// The 17 rows from CancelSales.js:15-31, which are the only sample invoices in
// the codebase carrying real line items. Dealer names there are shortened
// forms; `customerId` maps each onto a seeded dealer.
//
// `status` is assigned here so both the Sales screen and the Cancel Sales
// screen have something to show.

export const INVOICES = [
    { no: 'AINV-2026-07-0034675', customerId: 'AIC-000167', officer: 'AIO-000034', date: '2026-07-23', due: '2026-07-30', pay: 'Credit', status: 'Cancelled', cancelReason: 'Dealer refused delivery — wrong pack size ordered', items: [['Jassquate 61sl 100 Ml', 48, 65.00]] },
    { no: 'AINV-2026-07-0034622', customerId: 'AIC-000001', officer: 'AIO-000195', date: '2026-07-22', due: '2026-07-29', pay: 'Cash', status: 'Delivered', items: [['Smartzeb 80 Wp 100 Gm', 48, 112.00]] },
    { no: 'AINV-2026-07-0034621', customerId: 'AIC-000001', officer: 'AIO-000195', date: '2026-07-22', due: '2026-07-29', pay: 'Credit', status: 'Delivered', items: [['Cupertino 72wp Blue 100 Gm', 48, 85.00]] },
    { no: 'AINV-2026-07-0034610', customerId: 'AIC-000003', officer: 'AIO-000106', date: '2026-07-22', due: '2026-07-29', pay: 'Credit', status: 'Delivered', items: [['GreenMax Fertilizer 1kg', 48, 210.00], ['Blue Sundari 72wp 100gm', 24, 138.58]] },
    { no: 'AINV-2026-07-0034605', customerId: 'AIC-000030', officer: 'AIO-000058', date: '2026-07-22', due: '2026-07-29', pay: 'Credit', status: 'Delivered', items: [['Smartzeb 80 Wp 100 Gm (blue)', 240, 102.00], ['Agrivit Plus 500ml', 96, 153.75], ['GreenMax Super 1kg', 360, 506.62]] },
    { no: 'AINV-2026-07-0034519', customerId: 'AIC-000007', officer: 'AIO-000010', date: '2026-07-21', due: '2026-07-28', pay: 'Cash', status: 'Delivered', items: [['Cupertino 72wp Blue 100 Gm', 144, 171.00], ['Jassquate 61sl 100 Ml', 96, 170.44]] },
    { no: 'AINV-2026-07-0034457', customerId: 'AIC-000012', officer: 'AIO-000106', date: '2026-07-20', due: '2026-07-27', pay: 'Credit', status: 'Cancelled', cancelReason: 'Duplicate of AINV-2026-07-0034458', items: [['Smartzeb 80 Wp 100 Gm (blue)', 120, 102.00], ['GreenMax Fertilizer 1kg', 48, 336.67]] },
    { no: 'AINV-2026-07-0034433', customerId: 'AIC-000020', officer: 'AIO-000058', date: '2026-07-20', due: '2026-07-27', pay: 'Cash', status: 'Delivered', items: [['Blue Sundari 72wp 100gm', 96, 192.75]] },
    { no: 'AINV-2026-07-0034424', customerId: 'AIC-000013', officer: 'AIO-000083', date: '2026-07-19', due: '2026-07-26', pay: 'Credit', status: 'Delivered', items: [['Cupertino 72wp Blue 100 Gm', 120, 171.00], ['Jassquate 61sl 100 Ml', 72, 257.17]] },
    { no: 'AINV-2026-07-0034362', customerId: 'AIC-000046', officer: 'AIO-000025', date: '2026-07-18', due: '2026-07-25', pay: 'Credit', status: 'Delivered', items: [['GreenMax Super 1kg', 240, 508.46], ['Smartzeb 80 Wp 100 Gm (blue)', 72, 107.78]] },
    { no: 'AINV-2026-07-0034341', customerId: 'AIC-000014', officer: 'AIO-000106', date: '2026-07-18', due: '2026-07-25', pay: 'Cash', status: 'Delivered', items: [['Agrivit Plus 500ml', 24, 153.75], ['GreenMax Fertilizer 1kg', 24, 220.83]] },
    { no: 'AINV-2026-07-0034303', customerId: 'AIC-000021', officer: 'AIO-000010', date: '2026-07-17', due: '2026-07-24', pay: 'Credit', status: 'Shipped', items: [['Smartzeb 80 Wp 100 Gm (blue)', 192, 102.00], ['Cupertino 72wp Blue 100 Gm', 144, 132.00], ['Blue Sundari 72wp 100gm', 96, 165.97]] },
    { no: 'AINV-2026-07-0034293', customerId: 'AIC-000041', officer: 'AIO-000058', date: '2026-07-17', due: '2026-07-24', pay: 'Cash', status: 'Delivered', items: [['GreenMax Super 1kg', 72, 508.46], ['Jassquate 61sl 100 Ml', 24, 82.80]] },
    { no: 'AINV-2026-07-0034169', customerId: 'AIC-000048', officer: 'AIO-000083', date: '2026-07-16', due: '2026-07-23', pay: 'Credit', status: 'Picked', items: [['Smartzeb 80 Wp 100 Gm (blue)', 120, 102.00], ['Agrivit Plus 500ml', 96, 220.42]] },
    { no: 'AINV-2026-07-0034151', customerId: 'AIC-000005', officer: 'AIO-000195', date: '2026-07-16', due: '2026-07-23', pay: 'Cash', status: 'Confirm', items: [['Cupertino 72wp Blue 100 Gm', 120, 139.17]] },
    { no: 'AINV-2026-07-0034150', customerId: 'AIC-000018', officer: 'AIO-000034', date: '2026-07-16', due: '2026-07-23', pay: 'Credit', status: 'Confirm', items: [['GreenMax Fertilizer 1kg', 72, 210.00], ['Smartzeb 80 Wp 100 Gm (blue)', 192, 111.40]] },
    { no: 'AINV-2026-07-0034138', customerId: 'AIC-000020', officer: 'AIO-000058', date: '2026-07-15', due: '2026-07-22', pay: 'Cash', status: 'Pending', items: [['Blue Sundari 72wp 100gm', 48, 141.50]] },
];

// ══ Licences ═════════════════════════════════════════════════════════════
// Company licences from License.js:5-8. Dealer licences generated below so
// that five dealers have a problem, which is what Feature 1 demonstrates.

export const COMPANY_LICENCES = [
    { licenceType: 'Trade', licenceNo: 'TL-2026-001', issuingAuthority: 'DNCC', issueDate: '2026-01-01', expiryDate: '2026-12-31' },
    { licenceType: 'VAT', licenceNo: 'VAT-2026-002', issuingAuthority: 'NBR', issueDate: '2026-01-15', expiryDate: '2027-01-14' },
    { licenceType: 'Import', licenceNo: 'IL-2025-004', issuingAuthority: 'MOC', issueDate: '2025-06-01', expiryDate: '2026-05-31' },
];

/**
 * Dealer licences, relative to the run date so the demonstration always has a
 * lapsed licence regardless of when it is run.
 *
 *   3 expired · 2 expiring within a week · 1 dealer with no pesticide licence
 *   at all · the rest valid for a year
 */
export function dealerLicences(dealers, today = new Date()) {
    // Local YYYY-MM-DD, deliberately not toISOString().slice(0, 10) — the same
    // bug that was fixed in SalesEntry.js. toISOString() converts to UTC first,
    // so seeding between 00:00 and 06:00 local at UTC+6 would move every expiry
    // back a day. These offsets are what the whole Feature 1 demonstration is
    // measured against ("expired a fortnight ago"), so a silent one-day drift
    // depending on the hour the seed ran is not acceptable.
    //
    // This mirrors formatDate() in src/services/core.js. It is repeated rather
    // than imported because this script is deliberately self-contained — see
    // the header of seed.mjs.
    const pad = (n) => String(n).padStart(2, '0');
    const plus = (days) => {
        const d = new Date(today);
        d.setDate(d.getDate() + days);
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };

    const problems = {
        0: -14,   // expired a fortnight ago  → the headline demo case
        1: -3,    // expired three days ago
        2: -60,   // long expired
        3: 5,     // expires in five days
        4: 21,    // expires in three weeks
    };

    const out = [];
    dealers.slice(0, 15).forEach((dealer, i) => {
        if (i === 5) return;                       // no pesticide licence at all

        const offset = problems[i] ?? 365;
        out.push({
            scope: 'dealer',
            holderId: dealer.code,
            holderName: dealer.name,
            licenceType: 'Pesticide',
            licenceNo: `PL-2026-${String(1000 + i)}`,
            issuingAuthority: 'DAE',
            issueDate: plus(offset - 365),
            expiryDate: plus(offset),
        });

        // Fertiliser registration for the first ten, all in date — so a blocked
        // pesticide line and an allowed fertiliser line can be shown together.
        if (i < 10) {
            out.push({
                scope: 'dealer',
                holderId: dealer.code,
                holderName: dealer.name,
                licenceType: 'Fertilizer',
                licenceNo: `FR-2026-${String(2000 + i)}`,
                issuingAuthority: 'DAE',
                issueDate: plus(-200),
                expiryDate: plus(200),
            });
        }
    });
    return out;
}

// ══ Opening stock ════════════════════════════════════════════════════════
// One opening movement per product per office, so Stock Report has data and
// the seeded sales do not drive stock negative.

export function openingStock(products) {
    const rows = [];
    products.forEach((p, i) => {
        OFFICES.forEach((officeId, o) => {
            const qty = officeId === 'head' ? 2000 + (i % 7) * 500 : 400 + (i % 5) * 120;
            rows.push({ product: p, officeId, qty, unitCost: p.buyPrice ?? 0 });
        });
    });
    return rows;
}

// ══ Safety data (Feature 3) ══════════════════════════════════════════════
//
//   ██  EVERYTHING IN SAFETY_DATA BELOW IS A PLACEHOLDER.  ██
//
// Two products, and only two, carry safety figures. They are here so the
// invoice panel and its hazard-class colour coding can be SEEN — nothing else.
// They were not read off a label, they were not checked against the WHO
// classification, and they must not be quoted, screenshotted as fact, or left
// in place when the real data arrives.
//
// Every one of them carries `safetySource: PLACEHOLDER_SOURCE`, which the
// invoice panel prints verbatim underneath the figures. That is deliberate: it
// means a printed copy of one of these invoices says on its face that its
// safety figures are demonstration data, so a page that escapes into a slide
// deck or a report cannot be mistaken for the real thing.
//
// The other twenty products stay null and print
// "নিরাপত্তা তথ্য সংরক্ষিত নেই". That is not a gap to apologise for — it is
// Feature 3's own third requirement, and FIRESTORE-SCHEMA.md §9.3 rates it a
// stronger demonstration than twenty products of plausible-looking numbers.
//
// TO REPLACE THIS WITH REAL DATA: photograph the container labels (one shop
// visit; a single label carries hazard class, signal word, PHI, re-entry, first
// aid and approved crops), then either edit the entries here or use the
// ⚕ Safety button on the Product page, which writes the same fields through
// setSafetyData(). Set `safetySource` to where you got it and the PLACEHOLDER
// line stops printing.

export const PLACEHOLDER_SOURCE = 'PLACEHOLDER — demonstration data, not from a product label';

// Bengali, and it says so in Bengali as well as in the source line, because the
// dealer reading the invoice reads Bengali and the examiner reads the source.
const PLACEHOLDER_FIRST_AID = 'নমুনা তথ্য — প্রদর্শনের জন্য; লেবেল থেকে নেওয়া হয়নি। প্রকৃত নির্দেশনার জন্য কৌটার গায়ের লেবেল দেখুন।';
const PLACEHOLDER_DOSE = 'নমুনা তথ্য — প্রদর্শনের জন্য; প্রকৃত মাত্রা লেবেল দেখে নিন।';

/**
 * The two are chosen so that one invoice shows both hazard colours and another
 * shows a panel beside a marker:
 *
 *   AINV-2026-07-0034519  Cupertino (II, amber) + Jassquate (Ib, red)
 *   AINV-2026-07-0034303  Cupertino (II, amber) + two products with nothing
 *
 * `signalWordBn` follows the conventional mapping recorded in
 * FIRESTORE-SCHEMA.md §9.2 (Ia/Ib → অতি বিষাক্ত · II → বিষাক্ত · III/U →
 * সতর্কতা) rather than being made up here. The hazard classes and the two
 * numbers are not derived from anything and are the reason this block is
 * labelled as loudly as it is.
 */
export const SAFETY_DATA = {
    'AI-000101': {                        // Jassquate 61sl 100 Ml
        whoClass: 'Ib',
        signalWordBn: 'অতি বিষাক্ত',
        phiDays: 21,
        reentryHours: 48,
        firstAidBn: PLACEHOLDER_FIRST_AID,
        dosageBn: PLACEHOLDER_DOSE,
        approvedCropsBn: null,
        safetySource: PLACEHOLDER_SOURCE,
    },
    'AI-000104': {                        // Cupertino 72wp Blue 100 Gm
        whoClass: 'II',
        signalWordBn: 'বিষাক্ত',
        phiDays: 14,
        reentryHours: 24,
        firstAidBn: PLACEHOLDER_FIRST_AID,
        dosageBn: PLACEHOLDER_DOSE,
        approvedCropsBn: null,
        safetySource: PLACEHOLDER_SOURCE,
    },
};

/** The shape written to products, and copied onto each sale line. Nulls, not
 *  omissions — "unknown" has to be distinguishable from "field missing". */
export const EMPTY_SAFETY = {
    whoClass: null,
    signalWordBn: null,
    phiDays: null,
    reentryHours: null,
    firstAidBn: null,
    dosageBn: null,
    approvedCropsBn: null,
    safetySource: null,
};

/** Mirrors safetySnapshot() in src/services/products.js. */
export function safetyFor(code) {
    return SAFETY_DATA[code] || null;
}

// ══ Suppliers ════════════════════════════════════════════════════════════
// Lifted from the sample arrays in the three supplier screens — the codes are
// the ones those pages already used:
//
//   SupplierPayment.js:17          AIS-000002 … AIS-000088
//   SupplierOpeningBalance.js:12   AIS-000021 … AIS-000085
//   Purchase.js:33                 AIS-000055, AIS-000065, AIS-000089
//
// Seeded because Supplier Opening Balance, Supplier Payment, Supplier
// Commission, Purchase and Purchase Return all select from this master. An
// empty dropdown on any of those reads as a broken feature rather than an
// empty database (SCREEN-AUDIT.md §2.1.1 group B).
//
// `balance` is a PAYABLE — what the company owes them. The opening figures are
// the amounts those same sample rows carried.

const S = (code, name, phone, area, address, openingBalance) => ({
    code, name, phone, area, address, openingBalance,
    email: null,
    contactPerson: null,
});

export const SUPPLIERS = [
    S('AIS-000002', 'Hasan Polymer Industries', '01711-200002', 'Dhaka', 'Tongi I/A, Gazipur', 500000),
    S('AIS-000003', 'Madina Printing Pack', '01711-200003', 'Bogura', 'Boroghola, Bogura', 2500000),
    S('AIS-000004', 'Mitali Offset Press and Computer', '01711-200004', 'Bogura', 'Sherpur Road, Bogura', 1000000),
    S('AIS-000005', 'Saba Packaging BD', '01711-200005', 'Dhaka', 'Savar, Dhaka', 3300000),
    S('AIS-000006', 'Sufola Agro Chemicals Industries', '01711-200006', 'Dhaka', 'Keraniganj, Dhaka', 580000),
    S('AIS-000008', 'Digital Poly Pack', '01711-200008', 'Dhaka', 'Demra, Dhaka', 4000000),
    S('AIS-000015', 'AR Khan and CO.', '01711-200015', 'Dhaka', 'Motijheel, Dhaka', 1951500),
    S('AIS-000019', 'Shahin Screen Printer', '01711-200019', 'Bogura', 'Mohasthangor, Bogura', 68400),
    S('AIS-000021', 'Need Agro Industries', '01711-200021', 'Rajshahi', 'Katakhali, Rajshahi', 1728750),
    S('AIS-000024', 'CANARY AGRO CHEMICALS PRIVATE LIMITED', '01711-200024', 'Dhaka', 'Gulshan, Dhaka', 654463),
    S('AIS-000027', 'Fasal Agro Industries', '01711-200027', 'Dhaka', 'Ashulia, Dhaka', 779000),
    S('AIS-000032', 'Rana Motors', '01711-200032', 'Bogura', 'Station Road, Bogura', 547000),
    S('AIS-000041', 'Agrivision International (BRAC)', '01711-200041', 'Dhaka', 'Banani, Dhaka', 74191510),
    S('AIS-000044', 'Raha Trade International', '01711-200044', 'Dhaka', 'Uttara, Dhaka', 153330),
    S('AIS-000053', 'Nanjing Ecofarm Biotechnology Co., Ltd', '01711-200053', 'Dhaka', 'Nanjing, China (agent: Banani, Dhaka)', 3686400),
    S('AIS-000055', 'Shafirul Islam (Agrivision International)', '01711-200055', 'Bogura', 'Mohasthangor, Bogura', 0),
    S('AIS-000056', 'AGROIRIS (BD) LTD (RAINBOW)', '01711-200056', 'Dhaka', 'Tejgaon I/A, Dhaka', 4551500),
    S('AIS-000058', 'Pyramid Printing Pack', '01711-200058', 'Bogura', 'Mohasthangor, Bogura', 1200000),
    S('AIS-000063', 'M F Fashion', '01711-200063', 'Dhaka', 'Mirpur, Dhaka', 70900),
    S('AIS-000088', 'Bongshe Moharaj & Agro Tecnology', '01711-200088', 'Dhaka', 'Savar, Dhaka', 1790000),
];

// The next generated code continues the series rather than colliding with it.
export const SUPPLIER_COUNTER = Math.max(...SUPPLIERS.map(s => Number(s.code.split('-')[1])));

// ══ Expense heads ════════════════════════════════════════════════════════
// The twenty-four heads that used to be a module-level const in
// ExpenseHead.js:6. Seeded because the Expense screen selects from them and
// `expenseByHead()` — the Head Wise Expense report — groups by them.
//
// Auto-ID, not a code: a head is renamed often enough that the name is not a
// safe document key, and `expenses.headId` has to survive a rename.

export const EXPENSE_HEADS = [
    'Advance Expense', 'Bank Charge', 'Boundary Update Expense', 'Bus Delivery Expense',
    'Campaign Expense', 'Car Expense', 'Cable Expense', 'Courier Expense',
    'Electricity Bill', 'Entertainment Expense', 'Fuel Expense', 'Internet Bill',
    'Labour Cost', 'Labour Delivery Expense', 'Labour Breakfast', 'Meeting Expense',
    'Manager Expense', 'Office Expense', 'Office Rent', 'Printing Expense',
    'Rent Expense', 'Salary Expense', 'Stationery Expense', 'Travel Allowance',
];

/** The shape to fill in from a photographed label, for reference. */
export const SAFETY_TEMPLATE = {
    'AI-000102': {
        whoClass: null,           // 'Ia' | 'Ib' | 'II' | 'III' | 'U'  ← from the WHO classification
        signalWordBn: null,       // 'অতি বিষাক্ত' | 'বিষাক্ত' | 'সতর্কতা'  ← from the label
        phiDays: null,            // pre-harvest interval, days        ← from the label
        reentryHours: null,       // re-entry period, hours            ← from the label
        firstAidBn: null,         // first-aid note, Bengali           ← from the label
        dosageBn: null,           // dose per decimal / bigha          ← from the label
        approvedCropsBn: null,    // ['ধান', 'আলু', …]                  ← from the label
        safetySource: null,       // where the six above came from — printed on the invoice
    },
};
