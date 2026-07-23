import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';

function ChangePassword() {
    const { currentUser } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('Please fill in all fields.');
            return;
        }
        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters long.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('New password and confirm password do not match.');
            return;
        }
        if (newPassword === currentPassword) {
            setError('New password must be different from the current password.');
            return;
        }

        setLoading(true);
        try {
            // Firebase requires a recent login, so re-authenticate first
            const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updatePassword(auth.currentUser, newPassword);

            setSuccess('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('Current password is incorrect.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Too many attempts. Please try again later.');
            } else {
                setError('Failed to change password. Please try again.');
            }
        }
        setLoading(false);
    };

    const inputStyle = {
        width: '100%', padding: '10px 14px', borderRadius: '8px',
        border: '1px solid #dee2e6', fontSize: '14px',
        boxSizing: 'border-box', outline: 'none'
    };
    const labelStyle = {
        fontSize: '13px', fontWeight: '600', color: '#555',
        marginBottom: '5px', display: 'block'
    };

    return (
        <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ color: '#1a2035', margin: 0 }}>🔒 Change Password</h2>
            </div>

            <div style={{ maxWidth: '500px' }}>
                <div style={{ background: 'white', borderRadius: '12px', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>

                    {error && (
                        <div style={{ background: '#f8d7da', color: '#721c24', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                            ⚠️ {error}
                        </div>
                    )}
                    {success && (
                        <div style={{ background: '#d4edda', color: '#155724', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: '600' }}>
                            ✅ {success}
                        </div>
                    )}

                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Current Password</label>
                        <input type="password" style={inputStyle} placeholder="••••••••"
                            value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>New Password</label>
                        <input type="password" style={inputStyle} placeholder="At least 6 characters"
                            value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={labelStyle}>Confirm New Password</label>
                        <input type="password" style={inputStyle} placeholder="••••••••"
                            value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    </div>

                    <button onClick={handleSubmit} disabled={loading} style={{
                        width: '100%', padding: '12px',
                        background: '#0d6efd', color: 'white',
                        border: 'none', borderRadius: '8px',
                        fontSize: '15px', fontWeight: '700',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1
                    }}>
                        {loading ? 'Updating...' : '🔒 Update Password'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ChangePassword;
