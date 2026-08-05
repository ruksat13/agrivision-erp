import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Reachable by every logged-in user no matter what their permission list says:
// the app home, plus their own profile/password pages (these are not in the
// menu tree, so they never appear in a permission list).
const ALWAYS_ALLOWED = ['/', '/profile', '/change-password'];

const normalize = (path) => (path.length > 1 ? path.replace(/\/+$/, '') : path);

function AccessDenied() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    return (
        <div style={{
            background: '#fff',
            borderRadius: '8px',
            padding: '48px 24px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔒</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#1a2035', marginBottom: '8px' }}>
                Access Denied
            </div>
            <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '20px' }}>
                You do not have permission to view this page.
                {currentUser?.role && <> Your role is <b>{currentUser.role}</b>.</>}
                <br />
                Contact an administrator if you need access.
            </div>
            <button
                onClick={() => navigate('/')}
                style={{
                    padding: '8px 20px',
                    background: '#0d6efd',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                }}
            >
                ← Back to Dashboard
            </button>
        </div>
    );
}

/**
 * Login gate, and optionally a per-route permission gate.
 *
 * Without `requirePermission` it only checks that someone is logged in — use it
 * around the whole app shell. With `requirePermission` it also checks the
 * current path against the user's permissions; place that one *inside* the
 * shell so a denied user keeps the sidebar and can navigate away.
 */
function ProtectedRoute({ children, requirePermission = false }) {
    const { currentUser, hasAccess } = useAuth();
    const location = useLocation();

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (requirePermission) {
        const path = normalize(location.pathname);
        if (!ALWAYS_ALLOWED.includes(path) && !hasAccess(path)) {
            return <AccessDenied />;
        }
    }

    return children;
}

export default ProtectedRoute;
