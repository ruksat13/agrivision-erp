import { useState, useRef, useEffect, useCallback } from 'react';
import { ServiceError } from '../services';

// The banner and the two hooks every Firestore-backed screen needs.
//
// Extracted while wiring the fourteen dead Save buttons of SCREEN-AUDIT.md
// §2.1 — the same twenty lines of "loading / could not load / it saved / it
// did not save" were about to be written fourteen times. Product.js has its
// own copy from before this existed; it is the same component.

const TONES = {
    warn: { bg: '#fff8e1', border: '#ffc107', color: '#856404' },
    error: { bg: '#f8d7da', border: '#dc3545', color: '#721c24' },
    ok: { bg: '#d4edda', border: '#28a745', color: '#155724' },
    info: { bg: '#e7f1ff', border: '#0d6efd', color: '#084298' },
};

export function Notice({ tone = 'warn', children }) {
    const t = TONES[tone] || TONES.warn;
    return (
        <div style={{
            background: t.bg, border: `1px solid ${t.border}`, color: t.color,
            borderRadius: 6, padding: '10px 14px', fontSize: 13, margin: '0 0 16px', lineHeight: 1.6,
        }}>{children}</div>
    );
}

/**
 * A transient message, and the standard way to report a failed write.
 *
 *   const { flash, say, fail, busy, run } = useFlash();
 *   <button onClick={() => run(async () => { await createX(form); say('ok', 'Saved.'); })}>
 *
 * `run` sets busy for the duration and turns any ServiceError into a message
 * the user can read, so a screen never has to write its own try/catch.
 */
export function useFlash({ timeout = 6000 } = {}) {
    const [flash, setFlash] = useState(null);
    const [busy, setBusy] = useState(false);
    const timer = useRef(null);
    const alive = useRef(true);

    // alive.current is set on the way IN as well as cleared on the way out.
    // StrictMode mounts, unmounts and remounts in development; without the
    // assignment here the first cleanup leaves it false for good, and every
    // later `finally { setBusy(false) }` is skipped — the Save button sticks on
    // "Saving…" and the screen looks hung.
    useEffect(() => {
        alive.current = true;
        return () => { alive.current = false; clearTimeout(timer.current); };
    }, []);

    const say = useCallback((tone, text) => {
        if (!alive.current) return;
        setFlash({ tone, text });
        clearTimeout(timer.current);
        // Errors stay up: they are the reason the form is still on screen.
        if (tone !== 'error') timer.current = setTimeout(() => alive.current && setFlash(null), timeout);
    }, [timeout]);

    const fail = useCallback((err) => {
        // A ServiceError message is written for the user. Anything else is a
        // bug, so it is logged in full and only summarised on screen.
        if (!(err instanceof ServiceError)) console.error(err);
        say('error', err instanceof ServiceError ? err.message : `Unexpected error: ${err.message || err}`);
    }, [say]);

    const run = useCallback(async (fn) => {
        setBusy(true);
        try {
            return await fn();
        } catch (err) {
            fail(err);
            return undefined;
        } finally {
            if (alive.current) setBusy(false);
        }
    }, [fail]);

    return { flash, setFlash, say, fail, busy, run };
}

/**
 * The load half: calls `loader` on mount, holds the rows, and turns a failed
 * read into a notice rather than a blank screen. `reload` is stable, so it is
 * safe to call after a write.
 */
export function useCollection(loader, { what = 'data' } = {}) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fn = useRef(loader);
    fn.current = loader;

    const reload = useCallback(async () => {
        setLoading(true);
        try {
            setRows(await fn.current());
            setError(null);
        } catch (err) {
            setRows([]);
            setError(`Could not load ${what} (${err.code || err.message}). The page is shown but there is nothing to display.`);
        } finally {
            setLoading(false);
        }
    }, [what]);

    useEffect(() => { reload(); }, [reload]);

    return { rows, loading, error, reload, setRows };
}

export default Notice;
