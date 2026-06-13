import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function Profile() {
    const { currentUser } = useAuth();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('Employee');
    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const docRef = doc(db, 'users', currentUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setName(data.name || '');
                setPhone(data.phone || '');
                setRole(data.role || 'Employee');
            }
            setLoading(false);
        };
        fetchProfile();
    }, [currentUser]);

    const handleSave = async () => {
        await setDoc(doc(db, 'users', currentUser.uid), {
            name,
            phone,
            role,
            email: currentUser.email,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    if (loading) return <div style={{ padding: '40px', color: '#555' }}>Loading...</div>;

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
                <h2 style={{ color: '#1a2035', margin: 0 }}>👤 My Profile</h2>
                {saved && (
                    <span style={{ background: '#d4edda', color: '#155724', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>
                        ✅ Saved successfully!
                    </span>
                )}
            </div>

            <div style={{ maxWidth: '500px' }}>
                <div style={{ background: 'white', borderRadius: '12px', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    {/* Avatar */}
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: '#0d6efd', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '32px', fontWeight: '700', margin: '0 auto 10px'
                        }}>
                            {name ? name.charAt(0).toUpperCase() : '👤'}
                        </div>
                        <div style={{ fontSize: '13px', color: '#888' }}>{currentUser.email}</div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Full Name</label>
                        <input style={inputStyle} placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Phone Number</label>
                        <input style={inputStyle} placeholder="01700-000000" value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={labelStyle}>Role</label>
                        <select style={inputStyle} value={role} onChange={e => setRole(e.target.value)}>
                            <option>Admin</option>
                            <option>Manager</option>
                            <option>Employee</option>
                            <option>Sales Officer</option>
                        </select>
                    </div>

                    <button onClick={handleSave} style={{
                        width: '100%', padding: '12px',
                        background: '#0d6efd', color: 'white',
                        border: 'none', borderRadius: '8px',
                        fontSize: '15px', fontWeight: '700', cursor: 'pointer'
                    }}>
                        💾 Save Profile
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Profile;