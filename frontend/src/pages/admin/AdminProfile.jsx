import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Camera,
  Save,
  CheckCircle,
  Trash2,
  X,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  KeyRound,
  User,
} from 'lucide-react';

const AdminProfile = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [hasNewPhoto, setHasNewPhoto] = useState(false);
  const [saved, setSaved] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/profile');
      if (res.data.success) {
        const u = res.data.user || user;
        const emp = res.data.employee;
        setProfile(emp || u);
        setName(u?.name || emp?.name || '');
        setPhone(emp?.phone || u?.phone || '');
        setAddress(emp?.address || '');
        setProfileImage(emp?.profileImage || u?.avatar || '');
      }
    } catch (err) {
      console.error('Failed to load admin profile:', err);
      setErrorMsg('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  const processImageFile = (file) => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Please select a valid image file (PNG, JPG, JPEG, WEBP).'));
        return;
      }
      if (file.size > 12 * 1024 * 1024) {
        reject(new Error('File size exceeds 12MB. Please choose a smaller image.'));
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
        img.onerror = () => reject(new Error('Failed to parse the image file.'));
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
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCancelNewPhoto = () => {
    setProfileImage(profile?.profileImage || user?.avatar || '');
    setHasNewPhoto(false);
    setErrorMsg('');
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo and reset to initial badge?')) {
      return;
    }
    setSavingPhoto(true);
    setErrorMsg('');
    try {
      const res = await api.put('/auth/profile', { name, phone, address, profileImage: '' });
      if (res.data.success) {
        setProfileImage('');
        setHasNewPhoto(false);
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
      const res = await api.put('/auth/profile', { name, phone, address, profileImage });
      if (res.data.success) {
        setHasNewPhoto(false);
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

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setSavingDetails(true);
    setErrorMsg('');
    try {
      const res = await api.put('/auth/profile', { name, phone, address, profileImage });
      if (res.data.success) {
        setHasNewPhoto(false);
        updateUser({ name: name.trim(), avatar: profileImage });
        setSuccessMsg('Administrator profile updated successfully!');
        setSaved(true);
        setTimeout(() => setSaved(false), 3500);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update administrator profile.');
    } finally {
      setSavingDetails(false);
    }
  };

  const hasCustomPhoto = profileImage && !profileImage.includes('dicebear.com');

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Toast Feedback */}
      {saved && (
        <div className="alert alert-success" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={18} />
          <span>{successMsg || 'Profile updated successfully!'}</span>
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

      {/* Admin Executive Header Card */}
      <div
        className="table-card"
        style={{
          padding: '28px',
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          color: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          {/* Avatar with Interactive Camera Overlay */}
          <div style={{ position: 'relative', width: '92px', height: '92px', flexShrink: 0 }}>
            {hasCustomPhoto ? (
              <img
                src={profileImage}
                alt={name || 'Admin'}
                onClick={() => fileInputRef.current?.click()}
                title="Click to change profile photo"
                style={{
                  width: '92px',
                  height: '92px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: hasNewPhoto ? '3px solid #10b981' : '3px solid #6366f1',
                  cursor: 'pointer',
                  boxShadow: '0 6px 18px rgba(99, 102, 241, 0.35)',
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              />
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                title="Click to upload profile photo"
                style={{
                  width: '92px',
                  height: '92px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '34px',
                  border: hasNewPhoto ? '3px solid #10b981' : '3px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  boxShadow: '0 6px 18px rgba(79, 70, 229, 0.35)',
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {(name || user?.name || 'A').charAt(0).toUpperCase()}
              </div>
            )}

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
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }}
            >
              <Camera size={16} />
            </button>
          </div>

          <div style={{ flex: 1, minWidth: '240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                {name || user?.name || 'System Administrator'}
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '20px',
                  background: 'rgba(99, 102, 241, 0.25)',
                  color: '#a5b4fc',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ShieldCheck size={12} />
                ROOT ADMINISTRATOR
              </span>
            </div>

            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '6px 0 14px 0' }}>
              {user?.email} • {user?.employeeId || 'ADM001'} • Executive Workforce Operations
            </p>

            {/* Photo Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn"
                style={{
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera size={14} /> Change Photo
              </button>

              {profileImage && (
                <button
                  type="button"
                  className="btn"
                  style={{
                    padding: '7px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#fca5a5',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                  }}
                  onClick={handleRemovePhoto}
                  disabled={savingPhoto}
                >
                  <Trash2 size={13} /> Remove
                </button>
              )}

              {hasNewPhoto && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn"
                    style={{
                      padding: '7px 14px',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                    }}
                    onClick={handleSavePhotoOnly}
                    disabled={savingPhoto}
                  >
                    {savingPhoto ? <RefreshCw size={13} className="spin" /> : <Save size={13} />}
                    {savingPhoto ? 'Saving...' : 'Save Photo'}
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{
                      padding: '7px 10px',
                      fontSize: '12px',
                      background: 'rgba(255,255,255,0.1)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                    }}
                    onClick={handleCancelNewPhoto}
                    title="Cancel changes"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Stat Quick Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="table-card" style={{ padding: '18px 20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginBottom: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Account Status</span>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>Active & Verified</div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Full Organization Access</span>
        </div>

        <div className="table-card" style={{ padding: '18px 20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4f46e5', marginBottom: '6px' }}>
            <KeyRound size={14} />
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Security Level</span>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>Tier 1 Super Admin</div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>HRMS Policy Governance</span>
        </div>

        <div className="table-card" style={{ padding: '18px 20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0ea5e9', marginBottom: '6px' }}>
            <Building size={14} />
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Department</span>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>Executive Board</div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Headquarters Operations</span>
        </div>
      </div>

      {/* Profile Details Edit Form */}
      <div className="table-card" style={{ padding: '28px', borderRadius: '14px' }}>
        <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '22px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
            Administrator Profile Information
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Update your public display name, direct phone line, and operational address
          </p>
        </div>

        <form onSubmit={handleSaveDetails}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', marginBottom: '18px' }}>
            {/* Display Name */}
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                <User size={14} color="#4f46e5" />
                <span>Full Name *</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Administrator Name"
                required
              />
            </div>

            {/* Email Address (System Managed) */}
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                <Mail size={14} color="#64748b" />
                <span>Work Email (System Managed)</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={user?.email || ''}
                disabled
                style={{ background: '#f8fafc', color: '#64748b' }}
              />
            </div>

            {/* Phone Number */}
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                <Phone size={14} color="#4f46e5" />
                <span>Direct Contact Phone</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            {/* Employee ID Reference */}
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                <ShieldCheck size={14} color="#64748b" />
                <span>Administrator ID</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={user?.employeeId || 'ADM001'}
                disabled
                style={{ background: '#f8fafc', color: '#64748b' }}
              />
            </div>
          </div>

          {/* Office Address */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
              <MapPin size={14} color="#4f46e5" />
              <span>Office Location / Primary Headquarters Address</span>
            </label>
            <textarea
              className="form-control"
              rows="3"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Suite 500, Innovation Tower, Corporate Headquarters"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingDetails}
              style={{
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
              }}
            >
              {savingDetails ? <RefreshCw size={15} className="spin" /> : <Save size={15} />}
              <span>{savingDetails ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProfile;
