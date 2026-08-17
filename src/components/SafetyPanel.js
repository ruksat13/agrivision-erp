import React from 'react';

// Feature 3 — the Bengali safety and dosage panel printed on the invoice.
// UNIQUE-FEATURES.md §5 Feature 3, FIRESTORE-SCHEMA.md §9.3.
//
// Everything Feature 3 renders lives here, because it is rendered twice: once
// in the on-screen invoice modal and once — as a copy of that same DOM — in the
// print window. Sales.js `handlePrint()` takes `innerHTML` of the print area,
// so any styling that is not inline does not travel. Every rule below is
// therefore an inline style, and the injected print stylesheet only carries
// what inline styles cannot express (page breaks, and the document font).
//
// The panel prints what the SALE recorded, never what the product record says
// today: `sale_items.safetySnapshot` is a copy taken at the moment of sale
// (schema §9.3), so reprinting a July invoice shows July's advice.

/**
 * The print path opens a blank window and writes a document into it. Nothing
 * the application has loaded is available in there, so only fonts already
 * installed on the machine can be relied on — and Arial, which the template
 * asked for, has no Bengali glyphs at all.
 *
 * Every family below ships with an operating system: Nirmala UI on Windows,
 * Kohinoor Bangla / Bangla MN on macOS, Noto Sans Bengali or Lohit on Linux.
 * Deliberately no webfont: `window.print()` is called immediately after the
 * document is written, and a font still downloading at that moment prints as
 * empty boxes. That is the failure INTERNAL-PLAN.md §5 warns about, and the
 * cheapest way not to have it is to depend on nothing.
 */
export const BENGALI_FONT =
    "'Noto Sans Bengali', 'Nirmala UI', 'Shonar Bangla', Vrinda, " +
    "'Kohinoor Bangla', 'Bangla MN', 'Lohit Bengali', 'Mukti Narrow', sans-serif";

/**
 * What the printed document's <body> asks for. Latin comes from Arial, as the
 * invoice always has; the Bengali families sit behind it so that any glyph
 * Arial cannot draw falls through to a font that can, rather than to the
 * browser's last-resort face. Panels then override this with BENGALI_FONT so
 * Bengali runs — digits included — are drawn by one Bengali family throughout.
 */
export const PRINT_BODY_FONT = `Arial, ${BENGALI_FONT}`;

/** Bengali numerals. A Bengali panel that prints Latin digits is half-done. */
const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
export const bnNum = (n) => String(n).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);

/**
 * Colour by WHO hazard class, following the label colour band the WHO
 * classification itself uses: Ia/Ib red, II yellow, III blue, U green. The
 * class code is printed as text beside the colour as well, so the panel still
 * says which class it is on a monochrome printer.
 */
export const HAZARD = {
    Ia: { band: '#b3261e', ink: '#ffffff', tint: '#fdeceb', edge: '#b3261e' },
    Ib: { band: '#d93025', ink: '#ffffff', tint: '#fdeceb', edge: '#d93025' },
    II: { band: '#f2a600', ink: '#3d2c00', tint: '#fff9e6', edge: '#f2a600' },
    III: { band: '#1565c0', ink: '#ffffff', tint: '#eaf1fb', edge: '#1565c0' },
    U: { band: '#2e7d32', ink: '#ffffff', tint: '#eaf4eb', edge: '#2e7d32' },
};

/** Safety data recorded, but no hazard class among it. Neutral, not green. */
const UNCLASSED = { band: '#5f6368', ink: '#ffffff', tint: '#f4f5f6', edge: '#9aa0a6' };

const hazardOf = (whoClass) => HAZARD[whoClass] || UNCLASSED;

/**
 * The categories whose lines get a panel. Packaging, Gift and Seed are not
 * agrochemicals and carry no dosage or hazard advice, so printing a
 * "not recorded" marker against a plastic bucket would be noise that trains
 * the reader to ignore the marker where it matters.
 */
export const AGROCHEMICAL_CATEGORIES = ['Pesticide', 'PGR', 'Fertilizer'];
export const isAgrochemical = (line) => AGROCHEMICAL_CATEGORIES.includes(line?.category);

/**
 * Bengali wording. These are interface labels, not safety content — the safety
 * content is authored per product and comes out of `safetySnapshot`. The
 * "not recorded" string is the one FIRESTORE-SCHEMA.md §9.3 names verbatim.
 */
export const BN = {
    title: 'নিরাপত্তা ও মাত্রা নির্দেশিকা',
    signal: 'সতর্কবার্তা',
    phi: 'ফসল সংগ্রহের পূর্ব বিরতি',
    reentry: 'জমিতে পুনঃপ্রবেশের সময়',
    firstAid: 'প্রাথমিক চিকিৎসা',
    dose: 'প্রয়োগমাত্রা',
    crops: 'অনুমোদিত ফসল',
    source: 'তথ্যসূত্র',
    days: 'দিন',
    hours: 'ঘণ্টা',
    missing: 'নিরাপত্তা তথ্য সংরক্ষিত নেই',
    noSource: 'তথ্যসূত্র উল্লেখ নেই',
    notStated: 'উল্লেখ নেই',
};

/** True when there is something worth printing. Mirrors hasSafetyData(). */
export function snapshotHasContent(s) {
    return Boolean(s && (
        s.whoClass || s.signalWordBn || s.firstAidBn || s.dosageBn
        || s.phiDays != null || s.reentryHours != null
    ));
}

const bengali = (extra = {}) => ({ fontFamily: BENGALI_FONT, ...extra });

const cropList = (crops) => {
    if (!crops) return null;
    const arr = Array.isArray(crops) ? crops : String(crops).split(',');
    const clean = arr.map(c => String(c).trim()).filter(Boolean);
    return clean.length ? clean.join(', ') : null;
};

// ── One line's panel ──────────────────────────────────────────────────────

function Fact({ label, value }) {
    return (
        <div style={{ minWidth: 150, flex: '1 1 150px' }}>
            <div style={bengali({ fontSize: 10, color: '#5f6368', lineHeight: 1.5 })}>{label}</div>
            <div style={bengali({ fontSize: 13, fontWeight: 700, color: '#1a2035', lineHeight: 1.6 })}>{value}</div>
        </div>
    );
}

/**
 * The marker for a product with nothing recorded. Requirement 3 of Feature 3,
 * and — until the safety data is authored — the path almost every line takes,
 * so it is built to be read rather than to be tucked away. Bengali first
 * because the dealer is the reader; English underneath because the examiner is.
 */
function MissingSafety({ name, code }) {
    return (
        <div className="safety-panel safety-panel--missing" style={{
            border: '1px dashed #9aa0a6', borderLeft: '5px solid #9aa0a6', borderRadius: 4,
            background: '#f7f7f8', padding: '8px 12px', margin: '0 0 8px',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1a2035' }}>
                    {name} {code && <span style={{ color: '#6c757d', fontWeight: 400 }}>[{code}]</span>}
                </div>
                <div style={bengali({ fontSize: 13, fontWeight: 700, color: '#5f6368' })}>
                    ⚠ {BN.missing}
                </div>
            </div>
            <div style={{ fontSize: 10, color: '#6c757d', marginTop: 2 }}>
                Safety data not recorded for this product — ask the supplier for the label before advising the farmer.
            </div>
        </div>
    );
}

export function SafetyPanel({ line }) {
    const snapshot = line?.safetySnapshot || null;
    const name = line?.productName || line?.name || '';
    const code = line?.productCode || line?.productId || '';

    if (!snapshotHasContent(snapshot)) return <MissingSafety name={name} code={code} />;

    const h = hazardOf(snapshot.whoClass);
    const crops = cropList(snapshot.approvedCropsBn);

    return (
        <div className="safety-panel" style={{
            border: `1px solid ${h.edge}`, borderLeft: `5px solid ${h.band}`, borderRadius: 4,
            background: h.tint, padding: '8px 12px', margin: '0 0 8px',
        }}>
            {/* Product, hazard class and signal word */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                        background: h.band, color: h.ink, borderRadius: 3, padding: '2px 8px',
                        fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                    }}>
                        WHO {snapshot.whoClass || '—'}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1a2035' }}>
                        {name} {code && <span style={{ color: '#6c757d', fontWeight: 400 }}>[{code}]</span>}
                    </span>
                </div>
                {snapshot.signalWordBn && (
                    <div style={bengali({ fontSize: 15, fontWeight: 700, color: h.band, whiteSpace: 'nowrap' })}>
                        {BN.signal}: {snapshot.signalWordBn}
                    </div>
                )}
            </div>

            {/* The numbers a dealer has to pass on */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginTop: 6 }}>
                <Fact
                    label={BN.phi}
                    value={snapshot.phiDays == null ? BN.notStated : `${bnNum(snapshot.phiDays)} ${BN.days}`}
                />
                <Fact
                    label={BN.reentry}
                    value={snapshot.reentryHours == null ? BN.notStated : `${bnNum(snapshot.reentryHours)} ${BN.hours}`}
                />
                {snapshot.dosageBn && <Fact label={BN.dose} value={snapshot.dosageBn} />}
                {crops && <Fact label={BN.crops} value={crops} />}
            </div>

            {/* First aid, given its own box — it is the line read under pressure */}
            {snapshot.firstAidBn && (
                <div style={{
                    marginTop: 6, background: '#ffffff', border: `1px solid ${h.edge}`,
                    borderRadius: 3, padding: '5px 9px',
                }}>
                    <span style={bengali({ fontSize: 10, color: '#5f6368' })}>{BN.firstAid}: </span>
                    <span style={bengali({ fontSize: 12, color: '#1a2035', lineHeight: 1.7 })}>{snapshot.firstAidBn}</span>
                </div>
            )}

            {/* Where the figures came from. Printed always, including when it is
                unflattering — the whole risk in this feature is provenance
                (schema §9), and a panel that hides it is worse than no panel. */}
            <div style={bengali({ fontSize: 10, color: '#5f6368', marginTop: 5 })}>
                {BN.source}: <span style={{ fontWeight: 700 }}>{snapshot.safetySource || BN.noSource}</span>
            </div>
        </div>
    );
}

// ── The whole section on an invoice ───────────────────────────────────────

/**
 * One panel per agrochemical line. Renders nothing at all when the document has
 * no agrochemical on it — an empty bordered box headed "safety guidance" would
 * read as a fault.
 */
export function InvoiceSafetySection({ items = [] }) {
    const lines = items.filter(isAgrochemical);
    if (lines.length === 0) return null;

    return (
        <div className="safety-section" style={{
            border: '1px solid #1a2035', borderRadius: 5, padding: '10px 12px', margin: '0 0 12px',
        }}>
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                gap: 10, flexWrap: 'wrap', marginBottom: 8,
                borderBottom: '1px solid #dee2e6', paddingBottom: 5,
            }}>
                <div style={bengali({ fontSize: 14, fontWeight: 700, color: '#1a2035' })}>
                    ⚕ {BN.title}
                </div>
                <div style={{ fontSize: 10, color: '#6c757d' }}>
                    Safety and dosage guidance · colour band = WHO hazard class
                </div>
            </div>

            {lines.map((line, i) => (
                <SafetyPanel key={line.id || line.lineNo || i} line={line} />
            ))}

            <div style={{ fontSize: 10, color: '#6c757d', lineHeight: 1.6 }}>
                <span style={bengali({})}>ব্যবহারের আগে কৌটার গায়ের লেবেল পড়ুন। শিশুদের নাগালের বাইরে রাখুন।</span>
                <span> · Read the container label before use. The label, not this invoice, is the legal instruction.</span>
            </div>
        </div>
    );
}

/**
 * The one rule the print stylesheet has to carry. Everything else about the
 * panel is inline and travels with `innerHTML`; a panel split across a page
 * break is the one thing that cannot be expressed that way and the one thing
 * that would make the printed advice hard to read. Injected by `handlePrint()`.
 */
export const SAFETY_PRINT_CSS = `
  .safety-section, .safety-panel { break-inside: avoid; page-break-inside: avoid; }
`;

export default SafetyPanel;
