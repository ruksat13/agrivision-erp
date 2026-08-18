import React from 'react';

// The licence status bands, and the badge that paints one.
//
// Two screens show a dealer's licence position — the compliance report and the
// customer master — and the status STRINGS they paint already come from one
// place: licenceStatus() in src/services/licences.js, which derives them and
// never stores them (decision D5). The COLOURS were about to be decided twice.
// They live here for the same reason HAZARD lives in SafetyPanel.js: one
// concept, one palette, changed in one place.
//
// `rank` orders the bands worst first. 'No licence' sits above 'Expired' on
// purpose — a lapsed licence at least existed and can be renewed, whereas a
// dealer with nothing on record has never been checked, and the sale rule can
// only refuse what it can see.

export const LICENCE_BAND = {
    'No licence': { row: '#f6eaf7', border: '#8b1a89', bg: '#e7d3ea', fg: '#5b0b59', rank: -1 },
    'Expired': { row: '#fdf2f2', border: '#dc3545', bg: '#f8d7da', fg: '#721c24', rank: 0 },
    'Expiring (7)': { row: '#fff6ef', border: '#fd7e14', bg: '#ffe5d0', fg: '#7a3e00', rank: 1 },
    'Expiring (30)': { row: '#fffdf3', border: '#ffc107', bg: '#fff3cd', fg: '#856404', rank: 2 },
    'Expiring (60)': { row: '#fffef8', border: '#ffe082', bg: '#fff8e1', fg: '#8a6d3b', rank: 3 },
    'Active': { row: null, border: 'transparent', bg: '#d4edda', fg: '#155724', rank: 4 },
    'Unknown': { row: null, border: 'transparent', bg: '#e9ecef', fg: '#495057', rank: 5 },
};

export const bandOf = (status) => LICENCE_BAND[status] || LICENCE_BAND.Unknown;

/**
 * The worst status among a dealer's licences — what a single summary badge on
 * a customer row has to say. A dealer holding nothing at all is 'No licence',
 * which is the worst case in Feature 1 and not an absence to be quiet about.
 */
export function worstStatus(licences) {
    if (!licences || licences.length === 0) return 'No licence';
    return licences.reduce(
        (worst, l) => (bandOf(l.status).rank < bandOf(worst).rank ? l.status : worst),
        licences[0].status,
    );
}

/** One status pill. `label` overrides the text without changing the colour. */
export function LicenceBadge({ status, label, title, style }) {
    const band = bandOf(status);
    return (
        <span title={title} style={{
            background: band.bg, color: band.fg, padding: '3px 9px', borderRadius: 20,
            fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', display: 'inline-block', ...style,
        }}>{label ?? status}</span>
    );
}

export default LicenceBadge;
