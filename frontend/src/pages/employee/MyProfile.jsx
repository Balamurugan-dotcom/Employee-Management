import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Camera, Save, CheckCircle, Trash2, X, RefreshCw, AlertCircle } from 'lucide-react';

const MyProfile = () => {
  const { user, updateUser } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    gender: 'Not Specified',
  });
  const [profileImage, setProfileImage] = useState('');
  const [hasNewPhoto, setHasNewPhoto] = useState(false);
  const [saved, setSaved] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get('/auth/profile');
        if (res.data.success) {
          const emp = res.data.employee;
          setEmployee(emp);
          const currentImg = emp?.profileImage || res.data.user?.avatar || '';
          setProfileImage(currentImg);
          setFormData({
            phone: emp?.phone || '',
            address: emp?.address || '',
            gender: emp?.gender || 'Not Specified',
          });
        }
      } catch (e) {
        console.error('Failed to load profile:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Process & compress uploaded image using HTML Canvas
  const processImageFile = (file) => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Please select a valid image file (PNG, JPG, JPEG, WEBP).'));
        return;
      }
      if (file.size > 12 * 1024 * 1024) {
        reject(new Error('File size exceeds 12MB. Please select a smaller photo.'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_DIM = 400;
          const { width, height } = img;

          // Crop to square from center to avoid distortion
          const minDim = Math.min(width, height);
          const startX = (width - minDim) / 2;
          const startY = (height - minDim) / 2;

          canvas.width = MAX_DIM;
          canvas.height = MAX_DIM;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, MAX_DIM, MAX_DIM);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Failed to load image file.'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    try {
      const compressedDataUrl = await processImageFile(file);
      setProfileImage(compressedDataUrl);
      setHasNewPhoto(true);
    } catch (err) {
      setErrorMsg(err.message || 'Error processing selected photo.');
    } finally {
      // Clear file input so re-selecting same file triggers onChange
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCancelNewPhoto = () => {
    setProfileImage(employee?.profileImage || user?.avatar || '');
    setHasNewPhoto(false);
    setErrorMsg('');
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo and reset to the default avatar?')) {
      return;
    }
    setSavingPhoto(true);
    setErrorMsg('');
    try {
      const res = await api.put('/auth/profile', {
        ...formData,
        profileImage: '',
      });
      if (res.data.success) {
        setProfileImage('');
        setHasNewPhoto(false);
        setEmployee((prev) => ({ ...prev, profileImage: '' }));
        updateUser({ avatar: '' });
        setSuccessMsg('Profile photo removed successfully!');
        setSaved(true);
        setTimeout(() => setSaved(false), 3500);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to remove profile photo.');
    } finally {
      setSavingPhoto(false);
    }
  };

  const handleSavePhotoOnly = async () => {
    setSavingPhoto(true);
    setErrorMsg('');
    try {
      const res = await api.put('/auth/profile', {
        ...formData,
        profileImage,
      });
      if (res.data.success) {
        setHasNewPhoto(false);
        setEmployee((prev) => ({ ...prev, profileImage }));
        updateUser({ avatar: profileImage });
        setSuccessMsg('Profile photo updated successfully!');
        setSaved(true);
        setTimeout(() => setSaved(false), 3500);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile photo.');
    } finally {
      setSavingPhoto(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const payload = {
        ...formData,
        profileImage,
      };
      const res = await api.put('/auth/profile', payload);
      if (res.data.success) {
        setHasNewPhoto(false);
        setEmployee((prev) => ({ ...prev, ...formData, profileImage }));
        if (profileImage !== undefined) {
          updateUser({ avatar: profileImage });
        }
        setSuccessMsg('Profile updated successfully!');
        setSaved(true);
        setTimeout(() => setSaved(false), 3500);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || employee?.name || 'Staff'}`;
  const displayAvatar = profileImage || defaultAvatar;

  if (loading) {
    return <div className="spinner" style={{ margin: '60px auto' }}></div>;
  }

  return (
    <div style={{ maxWidth: '820px' }}>
      {saved && (
        <div className="alert alert-success" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={18} />
          <span>{successMsg || 'Changes saved successfully!'}</span>
        </div>
      )}

      {errorMsg && (
        <div className="alert alert-danger" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png,image/jpeg,image/jpg,image/webp"
        style={{ display: 'none' }}
      />

      {/* Header Profile Card */}
      <div className="table-card" style={{ padding: '28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          {/* Avatar with Interactive Camera Overlay */}
          <div style={{ position: 'relative', width: '92px', height: '92px', flexShrink: 0 }}>
            <img
              src={displayAvatar}
              alt={employee?.name || user?.name || 'Profile'}
              onClick={() => fileInputRef.current?.click()}
              title="Click to change profile photo"
              style={{
                width: '92px',
                height: '92px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: hasNewPhoto ? '3px solid #10b981' : '3px solid #4f46e5',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload new profile photo"
              style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                border: '2px solid #ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#4338ca'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#4f46e5'; }}
            >
              <Camera size={16} />
            </button>
          </div>

          {/* User Details & Photo Action Buttons */}
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>{employee?.name || user?.name}</h2>
              <span className="badge badge-active">{employee?.status || 'Active'}</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px', color: '#64748b', fontSize: '13px' }}>
              <span>ID: <strong style={{ color: '#1e293b' }}>{employee?.employeeId || user?.employeeId}</strong></span>
              <span>•</span>
              <span>{employee?.designation || 'Employee'}</span>
              <span>•</span>
              <span>{employee?.department || 'General'}</span>
            </div>

            {/* Profile Photo Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera size={14} /> Change Photo
              </button>

              {profileImage && (
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#ef4444',
                    borderColor: '#fca5a5',
                  }}
                  onClick={handleRemovePhoto}
                  disabled={savingPhoto}
                >
                  <Trash2 size={13} /> Remove Photo
                </button>
              )}

              {hasNewPhoto && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{
                      padding: '6px 14px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#10b981',
                      borderColor: '#10b981',
                    }}
                    onClick={handleSavePhotoOnly}
                    disabled={savingPhoto}
                  >
                    {savingPhoto ? <RefreshCw size={13} className="spin" /> : <Save size={13} />}
                    {savingPhoto ? 'Saving...' : 'Save Photo'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                    onClick={handleCancelNewPhoto}
                    title="Cancel changes"
                  >
                    <X size={14} />
                  </button>
                  <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>Unsaved photo preview</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Read-Only Organizational Metadata */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
          <div>
            <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Department</span>
            <strong style={{ fontSize: '14px', color: '#1e293b' }}>{employee?.department || 'N/A'}</strong>
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
            <strong style={{ fontSize: '14px', color: '#059669' }}>${employee?.salary?.toLocaleString() || '0'}/yr</strong>
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
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
