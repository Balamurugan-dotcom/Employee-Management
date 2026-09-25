import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { User, Phone, MapPin, Mail, Save, CheckCircle, Building, Calendar, DollarSign } from 'lucide-react';

const MyProfile = () => {
  const { user, updateUser } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    gender: 'Not Specified',
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get('/auth/profile');
        if (res.data.success) {
          const emp = res.data.employee;
          setEmployee(emp);
          setFormData({
            phone: emp?.phone || '',
            address: emp?.address || '',
            gender: emp?.gender || 'Not Specified',
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/auth/profile', formData);
      if (res.data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      alert('Failed to update profile');
    }
  };

  if (loading) {
    return <div className="spinner" style={{ margin: '60px auto' }}></div>;
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      {saved && (
        <div className="alert alert-success" style={{ marginBottom: '20px' }}>
          <CheckCircle size={18} />
          <span>Profile updated successfully!</span>
        </div>
      )}

      {/* Header Profile Card */}
      <div className="table-card" style={{ padding: '28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <img
            src={employee?.profileImage || user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
            alt=""
            style={{ width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #4f46e5' }}
          />
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800 }}>{employee?.name || user?.name}</h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px', color: '#64748b', fontSize: '13px' }}>
              <span>ID: <strong style={{ color: '#1e293b' }}>{employee?.employeeId || user?.employeeId}</strong></span>
              <span>•</span>
              <span>{employee?.designation}</span>
              <span>•</span>
              <span className="badge badge-active">{employee?.status || 'Active'}</span>
            </div>
          </div>
        </div>

        {/* Read-Only Organizational Metadata */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
          <div>
            <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Department</span>
            <strong style={{ fontSize: '14px', color: '#1e293b' }}>{employee?.department}</strong>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Reporting Manager</span>
            <strong style={{ fontSize: '14px', color: '#1e293b' }}>{employee?.manager?.name || employee?.managerName || 'System Admin'}</strong>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Joining Date</span>
            <strong style={{ fontSize: '14px', color: '#1e293b' }}>
              {employee?.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : 'N/A'}
            </strong>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Annual Base Salary</span>
            <strong style={{ fontSize: '14px', color: '#059669' }}>${employee?.salary?.toLocaleString()}/yr</strong>
          </div>
        </div>
      </div>

      {/* Editable Permitted Information */}
      <div className="table-card" style={{ padding: '28px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Personal Contact Information</h3>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
          Employees are permitted to update contact phone number, address, and gender preferences.
        </p>

        <form onSubmit={handleSave}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label>Work Email Address (Locked by IT Policy)</label>
            <input type="text" className="form-control" value={employee?.email || user?.email || ''} disabled />
          </div>

          <div className="form-grid" style={{ marginBottom: '16px' }}>
            <div className="form-group">
              <label>Personal Mobile Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Gender Identification</label>
              <select
                className="form-control"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Not Specified">Prefer Not to Specify</option>
              </select>
            </div>

            <div className="form-group col-span-2">
              <label>Residential / Mailing Address</label>
              <textarea
                className="form-control"
                rows="3"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
              <Save size={16} /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MyProfile;
