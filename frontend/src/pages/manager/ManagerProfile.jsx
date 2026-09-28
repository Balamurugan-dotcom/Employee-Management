import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Camera, Save, CheckCircle, Trash2, X, RefreshCw, AlertCircle } from 'lucide-react';

const ManagerProfile = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [hasNewPhoto, setHasNewPhoto] = useState(false);
  const [saved, setSaved] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.get('/auth/profile').then((res) => {
      if (res.data.success) {
        const empOrUser = res.data.employee || res.data.user;
        setProfile(empOrUser);
        setPhone(res.data.employee?.phone || res.data.user?.phone || '');
        setAddress(res.data.employee?.address || '');
        setProfileImage(res.data.employee?.profileImage || res.data.user?.avatar || '');
      }
      setLoading(false);
    }).catch((err) => {
      console.error('Failed to load profile:', err);
      setLoading(false);
    });
  }, []);

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
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCancelNewPhoto = () => {
    setProfileImage(profile?.profileImage || user?.avatar || '');
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
      const res = await api.put('/auth/profile', { phone, address, profileImage: '' });
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
      const res = await api.put('/auth/profile', { phone, address, profileImage });
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

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await api.put('/auth/profile', { phone, address, profileImage });
      if (res.data.success) {
        setHasNewPhoto(false);
        if (profileImage !== undefined) {
          updateUser({ avatar: profileImage });
        }
        setSuccessMsg('Profile changes saved successfully!');
        setSaved(true);
        setTimeout(() => setSaved(false), 3500);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  const hasCustomPhoto = profileImage && !profileImage.includes('dicebear.com');

  if (loading) return <div className="spinner" style={{ margin: '60px auto' }}></div>;

  return (
    <div style={{ maxWidth: '720px' }}>
      {saved && (
        <div className="alert alert-success" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={18} />
          <span>{successMsg || 'Profile changes saved successfully!'}</span>
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

      <div className="table-card" style={{ padding: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {/* Avatar with Interactive Camera Overlay */}
          <div style={{ position: 'relative', width: '84px', height: '84px', flexShrink: 0 }}>
            {hasCustomPhoto ? (
              <img
                src={profileImage}
                alt={user?.name || 'Profile'}
                onClick={() => fileInputRef.current?.click()}
                title="Click to change profile photo"
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: hasNewPhoto ? '3px solid #10b981' : '3px solid #4f46e5',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
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
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0ea5e9, #4f46e5)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '32px',
                  border: hasNewPhoto ? '3px solid #10b981' : '3px solid #4f46e5',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {(user?.name || 'M').charAt(0).toUpperCase()}
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
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                border: '2px solid #ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              }}
            >
              <Camera size={15} />
            </button>
          </div>

          <div style={{ flex: 1, minWidth: '220px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>{user?.name}</h2>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 8px 0' }}>
              {user?.role?.toUpperCase()} • {user?.employeeId}
            </p>

            {/* Profile Photo Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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
                  <Trash2 size={13} /> Remove
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
                </div>
              )}
            </div>
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
