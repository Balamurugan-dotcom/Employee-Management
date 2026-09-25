import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { User, Phone, MapPin, Mail, Save, CheckCircle } from 'lucide-react';

const ManagerProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/profile').then((res) => {
      if (res.data.success) {
        setProfile(res.data.employee || res.data.user);
        setPhone(res.data.employee?.phone || '');
        setAddress(res.data.employee?.address || '');
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.put('/auth/profile', { phone, address });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      alert('Failed to update profile');
    }
  };

  if (loading) return <div className="spinner" style={{ margin: '60px auto' }}></div>;

  return (
    <div style={{ maxWidth: '680px' }}>
      {saved && (
        <div className="alert alert-success" style={{ marginBottom: '20px' }}>
          <CheckCircle size={18} />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      <div className="table-card" style={{ padding: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
            alt=""
            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #4f46e5' }}
          />
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{user?.name}</h2>
            <p style={{ color: '#64748b', fontSize: '14px' }}>{user?.role?.toUpperCase()} • {user?.employeeId}</p>
            <span className="badge badge-active" style={{ marginTop: '6px' }}>Active Staff</span>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label>Work Email (Managed by Admin)</label>
            <input type="text" className="form-control" value={user?.email || ''} disabled />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label>Contact Phone Number</label>
            <input
              type="text"
              className="form-control"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>Primary Office / Residential Location</label>
            <textarea
              className="form-control"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px' }}>
            <Save size={16} /> Save Contact Details
          </button>
        </form>
      </div>
    </div>
  );
};

export default ManagerProfile;
