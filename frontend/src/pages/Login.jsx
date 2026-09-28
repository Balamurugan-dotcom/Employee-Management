import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Eye,
  EyeOff,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Phone,
  KeyRound,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  MapPinOff,
  X,
} from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { verifyAttendanceLocation } from '../utils/locationService';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState('phone'); // 'phone' | 'otp' | 'password' | 'success'
  const [forgotId, setForgotId] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [showEmailFallback, setShowEmailFallback] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState({ success: false, message: '' });
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [verifyingLocation, setVerifyingLocation] = useState(false);
  const [loginNoticeModal, setLoginNoticeModal] = useState({
    open: false,
    title: '',
    subtitle: '',
    reason: '',
    type: 'geofence', // 'geofence' | 'permission' | 'credentials' | 'error'
    locDetails: null,
  });

  const { login, logout, user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect automatically based on role
  useEffect(() => {
    if (user && user.role) {
      if (user.role === 'admin') navigate('/admin/dashboard', { replace: true });
      else if (user.role === 'manager') navigate('/manager/dashboard', { replace: true });
      else if (user.role === 'employee') navigate('/employee/dashboard', { replace: true });
    }

    const savedId = localStorage.getItem('ems_remembered_identifier');
    if (savedId) {
      setIdentifier(savedId);
      setRememberMe(true);
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim() || !password) {
      setErrorMessage('Please enter both your Email / Employee ID and password.');
      return;
    }

    setLoading(true);

    const isEmployeeAttempt =
      selectedRole === 'employee' ||
      /^EMP/i.test(identifier.trim()) ||
      (!selectedRole && !identifier.toLowerCase().includes('admin') && !identifier.toLowerCase().includes('manager'));

    // Verify employee location before allowing access
    setVerifyingLocation(true);
    let locationData = null;
    let locCheck = null;

    try {
      locCheck = await verifyAttendanceLocation();
      if (locCheck.success) {
        locationData = {
          latitude: locCheck.latitude,
          longitude: locCheck.longitude,
        };
      } else {
        locationData = {
          locationError: locCheck.code === 'PERMISSION_DENIED' ? 'PERMISSION_DENIED' : 'LOCATION_OUTSIDE',
          latitude: locCheck.latitude,
          longitude: locCheck.longitude,
        };
      }
    } catch {
      locationData = { locationError: 'PERMISSION_DENIED' };
    }

    // If an employee attempts to log in and location verification fails
    if (isEmployeeAttempt && (!locCheck || !locCheck.success)) {
      setLoading(false);
      setVerifyingLocation(false);

      const isPermissionDenied =
        !locCheck ||
        locCheck.code === 'PERMISSION_DENIED' ||
        locCheck.message?.includes('Location access is required') ||
        locCheck.message?.toLowerCase().includes('permission');

      const msg = isPermissionDenied
        ? 'Location access is required. Please enable your location to continue.'
        : 'Access denied. You are currently outside the authorized office location.';

      setErrorMessage(msg);
      setLoginNoticeModal({
        open: true,
        title: isPermissionDenied ? 'Location Access Required' : 'Access Denied: Outside Authorized Office',
        subtitle: isPermissionDenied
          ? 'Device location access was not granted by your browser.'
          : 'Physical presence within the authorized office location is required to continue.',
        reason: msg,
        type: isPermissionDenied ? 'permission' : 'geofence',
        locDetails: locCheck,
      });
      return;
    }

    // Call login with credentials and locationData
    const result = await login(identifier, password, rememberMe, locationData);

    setLoading(false);
    setVerifyingLocation(false);

    if (result.success) {
      const loggedUser = result.user;
      if (loggedUser.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (loggedUser.role === 'manager') {
        navigate('/manager/dashboard', { replace: true });
      } else {
        // Employee Role - location verification completed and allowed
        navigate('/employee/dashboard', { replace: true });
      }
    } else {
      // Backend rejected login
      const failMsg = result.message || 'Login failed. Please check your credentials.';
      const isLocReq =
        result.code === 'LOCATION_REQUIRED' ||
        failMsg.includes('Location access is required') ||
        failMsg.toLowerCase().includes('location permission');
      const isLocOutside =
        result.code === 'LOCATION_OUTSIDE' ||
        failMsg.includes('outside the authorized office location') ||
        failMsg.toLowerCase().includes('outside the authorized');

      const displayMsg = isLocReq
        ? 'Location access is required. Please enable your location to continue.'
        : isLocOutside
        ? 'Access denied. You are currently outside the authorized office location.'
        : failMsg;

      setErrorMessage(displayMsg);
      setLoginNoticeModal({
        open: true,
        title: isLocReq
          ? 'Location Access Required'
          : isLocOutside
          ? 'Access Denied: Outside Authorized Office'
          : 'Login Unsuccessful',
        subtitle: isLocReq
          ? 'Location access is required. Please enable your location to continue.'
          : isLocOutside
          ? 'Access denied. You are currently outside the authorized office location.'
          : 'Account authentication failed.',
        reason: displayMsg,
        type: isLocReq ? 'permission' : isLocOutside ? 'geofence' : 'credentials',
        locDetails: result.data || null,
      });
    }
  };

  // Timer for OTP resend countdown
  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const openForgotModal = () => {
    setForgotModal(true);
    setForgotStep('phone');
    setForgotId(identifier.trim());
    setForgotPhone('');
    setForgotEmail(identifier.includes('@') ? identifier : '');
    setShowEmailFallback(false);
    setOtpCode('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setVerifiedUser('');
    setForgotStatus({ success: false, message: '' });
    setResendCountdown(0);
  };

  const closeForgotModal = () => {
    setForgotModal(false);
    setForgotStatus({ success: false, message: '' });
  };

  // Step 1: Send OTP with Employee ID & Phone Number verification
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!forgotId.trim() && !forgotPhone.trim()) {
      setForgotStatus({ success: false, message: 'Please enter your registered Work Email, Employee ID, or Phone Number.' });
      return;
    }

    setForgotLoading(true);
    setForgotStatus({ success: false, message: '' });

    try {
      const res = await api.post('/auth/send-otp', {
        employeeId: forgotId.trim(),
        identifier: forgotId.trim(),
        phone: forgotPhone.trim(),
      });

      setVerifiedUser(res.data.userName || '');
      setVerifiedEmail(res.data.email || '');
      setForgotStep('otp');
      setResendCountdown(30);
      setForgotStatus({
        success: true,
        message: res.data.message || 'Identity verified! OTP sent.',
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Error verifying credentials.';
      setForgotStatus({ success: false, message: msg });
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setForgotStatus({ success: false, message: 'Please enter the complete 6-digit OTP.' });
      return;
    }

    setForgotLoading(true);
    setForgotStatus({ success: false, message: '' });

    try {
      const res = await api.post('/auth/verify-otp', {
        phone: forgotPhone.trim(),
        email: forgotEmail.trim(),
        otp: otpCode.trim(),
      });

      setResetToken(res.data.resetToken);
      setForgotStep('password');
      setForgotStatus({
        success: true,
        message: 'OTP verified! Now create your new password.',
      });
    } catch (err) {
      setForgotStatus({
        success: false,
        message: err.response?.data?.message || 'Invalid or expired OTP. Please try again.',
      });
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 3: Set New Password
  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();

    const hasMinLen = newPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(newPassword);

    if (!hasMinLen || !hasUpper || !hasLower || !hasNumber || !hasSymbol) {
      setForgotStatus({
        success: false,
        message: 'Password must have at least 8 characters and include uppercase, lowercase, a number, and a special character (!@#$%^&*).',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotStatus({ success: false, message: 'Passwords do not match.' });
      return;
    }

    setForgotLoading(true);
    setForgotStatus({ success: false, message: '' });

    try {
      const res = await api.post('/auth/reset-password', {
        resetToken,
        newPassword,
        confirmPassword,
      });

      setForgotStep('success');
      setForgotStatus({
        success: true,
        message: res.data.message || 'Password reset successfully.',
      });

      if (res.data.email) {
        setIdentifier(res.data.email);
      } else if (forgotPhone) {
        setIdentifier(forgotPhone);
      }
    } catch (err) {
      setForgotStatus({
        success: false,
        message: err.response?.data?.message || 'Error updating password. Please try again.',
      });
    } finally {
      setForgotLoading(false);
    }
  };

  // Quick autofill helper for easy demonstration
  const handleQuickFill = (role) => {
    setSelectedRole(role);
    if (role === 'admin') {
      setIdentifier('admin@ems.com');
      setPassword('Admin@123');
    } else if (role === 'manager') {
      setIdentifier('manager@ems.com');
      setPassword('Manager@123');
    } else if (role === 'employee') {
      setIdentifier('employee@ems.com');
      setPassword('Employee@123');
    }
    setErrorMessage('');
  };

  const handleIdentifierChange = (e) => {
    const val = e.target.value;
    setIdentifier(val);
    const upper = val.toUpperCase().trim();
    if (upper.startsWith('ADM') || val.toLowerCase().includes('admin')) {
      setSelectedRole('admin');
    } else if (upper.startsWith('MGR') || val.toLowerCase().includes('manager')) {
      setSelectedRole('manager');
    } else if (upper.startsWith('EMP') || val.toLowerCase().includes('employee')) {
      setSelectedRole('employee');
    }
  };

  return (
    <div className="login-container">
      <div className="login-glass-card">
        <div className="login-brand-header">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <BrandLogo size={68} />
          </div>
          <h2>TalentFlow EMS</h2>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#4f46e5', marginTop: '4px' }}>Login Page</p>
        </div>

        {errorMessage && (
          <div
            className="alert alert-danger"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '14px 16px',
              borderRadius: '10px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              marginBottom: '20px',
            }}
          >
            <div style={{ marginTop: '2px', flexShrink: 0 }}>
              {errorMessage.includes('Location') || errorMessage.includes('office') || errorMessage.includes('geofence') || errorMessage.includes('Access Denied') ? (
                <MapPinOff size={20} color="#dc2626" />
              ) : (
                <AlertCircle size={20} color="#dc2626" />
              )}
            </div>
            <div style={{ flex: 1, fontSize: '13px', lineHeight: 1.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                <strong style={{ fontSize: '13.5px', color: '#7f1d1d' }}>
                  {errorMessage.includes('Location access is required')
                    ? 'Location Permission Required'
                    : errorMessage.includes('outside the authorized office location') || errorMessage.includes('Access denied')
                    ? 'Workplace Geofence Restriction'
                    : 'Authentication Notice'}
                </strong>
                <button
                  type="button"
                  onClick={() => setLoginNoticeModal((prev) => ({ ...prev, open: true }))}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#dc2626',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: '0 4px',
                  }}
                >
                  View Full Notice ↗
                </button>
              </div>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label htmlFor="identifier">
              {selectedRole === 'admin'
                ? 'Admin ID or Email'
                : selectedRole === 'manager'
                ? 'Manager ID or Email'
                : selectedRole === 'employee'
                ? 'Employee ID or Email'
                : 'Email or Employee ID'}
            </label>
            <div className="password-input-wrapper">
              <input
                id="identifier"
                type="text"
                className="form-control"
                placeholder={
                  selectedRole === 'admin'
                    ? 'e.g. admin@ems.com or ADM001'
                    : selectedRole === 'manager'
                    ? 'e.g. manager@ems.com or MGR101'
                    : selectedRole === 'employee'
                    ? 'e.g. employee@ems.com or EMP201'
                    : 'e.g. admin@ems.com or EMP201'
                }
                value={identifier}
                onChange={handleIdentifierChange}
                autoFocus
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Enter your account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="eye-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="login-helpers">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember Me</span>
            </label>

            <button
              type="button"
              className="forgot-link"
              onClick={openForgotModal}
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '15px' }}
            disabled={loading || verifyingLocation}
          >
            {verifyingLocation ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={16} className="animate-spin" />
                <span>Verifying Workplace Geofence...</span>
              </span>
            ) : loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="demo-accounts-box">
          <div className="demo-buttons-grid">
            <button
              type="button"
              className={`demo-btn ${selectedRole === 'admin' ? 'active' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => handleQuickFill('admin')}
            >
              🛡️ Admin
            </button>
            <button
              type="button"
              className={`demo-btn ${selectedRole === 'manager' ? 'active' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => handleQuickFill('manager')}
            >
              💼 Manager
            </button>
            <button
              type="button"
              className={`demo-btn ${selectedRole === 'employee' ? 'active' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => handleQuickFill('employee')}
            >
              👨‍💻 Employee
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password OTP Modal */}
      {forgotModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px', padding: '24px' }}>
            {/* Header */}
            <div className="modal-header" style={{ paddingBottom: '14px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#eef2ff',
                    color: '#4f46e5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                    {forgotStep === 'phone' && 'Reset Password'}
                    {forgotStep === 'otp' && 'Verify Phone OTP'}
                    {forgotStep === 'password' && 'Create New Password'}
                    {forgotStep === 'success' && 'Password Updated!'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                    {forgotStep === 'phone' && 'Step 1 of 3: Phone Verification'}
                    {forgotStep === 'otp' && 'Step 2 of 3: Enter 6-digit OTP'}
                    {forgotStep === 'password' && 'Step 3 of 3: Set Password'}
                    {forgotStep === 'success' && 'Process Completed'}
                  </p>
                </div>
              </div>
              <button
                className="btn-icon"
                onClick={closeForgotModal}
                style={{ fontSize: '18px', cursor: 'pointer', background: 'transparent', border: 'none', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            {/* Stepper Progress Bar */}
            {forgotStep !== 'success' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  margin: '18px 0 16px',
                  padding: '8px 12px',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: forgotStep === 'phone' ? '#4f46e5' : '#10b981' }}>
                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: forgotStep === 'phone' ? '#4f46e5' : '#10b981',
                      color: '#fff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                    }}
                  >
                    1
                  </span>
                  <span>Phone</span>
                </div>
                <div style={{ flex: 1, height: '2px', background: forgotStep !== 'phone' ? '#10b981' : '#e2e8f0', margin: '0 8px' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: forgotStep === 'otp' ? '#4f46e5' : forgotStep === 'password' ? '#10b981' : '#94a3b8' }}>
                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: forgotStep === 'otp' ? '#4f46e5' : forgotStep === 'password' ? '#10b981' : '#cbd5e1',
                      color: '#fff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                    }}
                  >
                    2
                  </span>
                  <span>OTP</span>
                </div>
                <div style={{ flex: 1, height: '2px', background: forgotStep === 'password' ? '#4f46e5' : '#e2e8f0', margin: '0 8px' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: forgotStep === 'password' ? '#4f46e5' : '#94a3b8' }}>
                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: forgotStep === 'password' ? '#4f46e5' : '#cbd5e1',
                      color: '#fff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                    }}
                  >
                    3
                  </span>
                  <span>Password</span>
                </div>
              </div>
            )}

            {/* Alert Status Banner (shown on non-OTP steps or if error occurs on OTP step) */}
            {forgotStatus.message && (forgotStep !== 'otp' || !forgotStatus.success) && (
              <div
                className={`alert ${forgotStatus.success ? 'alert-success' : 'alert-danger'}`}
                style={{ marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px' }}
              >
                {forgotStatus.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{forgotStatus.message}</span>
              </div>
            )}

            {/* STEP 1: ENTER EMPLOYEE ID THEN PHONE NUMBER */}
            {forgotStep === 'phone' && (
              <form onSubmit={handleSendOtp}>
                <div className="modal-body" style={{ padding: '0 0 16px' }}>
                  <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '16px' }}>
                    Enter your Employee ID (or Work Email) followed by your registered Phone Number to verify your identity.
                  </p>

                  {/* 1. Employee ID / Work Email Input */}
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                      <User size={15} color="#4f46e5" />
                      <span>1. Enter Employee ID or Work Email</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. ADM001, MAN908, or name@ems.com"
                      value={forgotId}
                      onChange={(e) => setForgotId(e.target.value)}
                      required
                      autoFocus={!forgotId}
                    />
                  </div>

                  {/* 2. Registered Phone Number Input */}
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                      <Phone size={15} color="#4f46e5" />
                      <span>2. Registered Phone Number (Optional if using Email)</span>
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="Enter registered mobile number"
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value)}
                      required={!forgotId.trim()}
                      autoFocus={!!forgotId}
                    />
                    <small style={{ color: '#64748b', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>
                      🔒 If provided, must match the registered phone for this account.
                    </small>
                  </div>
                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={closeForgotModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={forgotLoading}>
                    {forgotLoading ? 'Verifying...' : 'Verify & Send OTP'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: VERIFY OTP */}
            {forgotStep === 'otp' && (
              <form onSubmit={handleVerifyOtp}>
                <div className="modal-body" style={{ padding: '0 0 16px' }}>
                  {verifiedUser && (
                    <div
                      style={{
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        marginBottom: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <CheckCircle2 size={16} color="#16a34a" />
                      <span style={{ fontSize: '13px', color: '#15803d', fontWeight: 600 }}>
                        Verified Profile: {verifiedUser}
                      </span>
                    </div>
                  )}

                  <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '18px', lineHeight: 1.5 }}>
                    A 6-digit verification code has been dispatched to your registered email{' '}
                    <strong style={{ color: '#0f172a' }}>{verifiedEmail || 'inbox'}</strong>.
                  </p>

                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', textAlign: 'center', display: 'block' }}>
                      Enter 6-Digit OTP
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      style={{
                        fontSize: '24px',
                        fontWeight: 700,
                        letterSpacing: '10px',
                        textAlign: 'center',
                        padding: '12px',
                        fontFamily: 'monospace',
                        color: '#4f46e5',
                      }}
                      autoFocus
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                    <button
                      type="button"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      onClick={() => setForgotStep('phone')}
                    >
                      <ArrowLeft size={14} />
                      <span>Change Phone</span>
                    </button>

                    <button
                      type="button"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: resendCountdown > 0 ? '#94a3b8' : '#4f46e5',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: resendCountdown > 0 ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      disabled={resendCountdown > 0 || forgotLoading}
                      onClick={handleSendOtp}
                    >
                      <RefreshCw size={13} className={forgotLoading ? 'spin' : ''} />
                      <span>{resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend OTP'}</span>
                    </button>
                  </div>
                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={closeForgotModal}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={forgotLoading || otpCode.length !== 6}
                  >
                    {forgotLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: CREATE NEW PASSWORD */}
            {forgotStep === 'password' && (
              <form onSubmit={handleResetPassword}>
                <div className="modal-body" style={{ padding: '0 0 16px' }}>
                  <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '16px' }}>
                    OTP verified successfully. Create a new strong password for your account.
                  </p>

                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>New Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        className="form-control"
                        placeholder="Min 8 characters (e.g. Secret@123)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoFocus
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        className="eye-toggle-btn"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        tabIndex="-1"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px', marginTop: '6px' }}>
                      <span style={{ fontSize: '11px', color: newPassword.length >= 8 ? '#16a34a' : '#94a3b8' }}>
                        {newPassword.length >= 8 ? '✓' : '•'} 8+ characters
                      </span>
                      <span style={{ fontSize: '11px', color: /[A-Z]/.test(newPassword) ? '#16a34a' : '#94a3b8' }}>
                        {/[A-Z]/.test(newPassword) ? '✓' : '•'} Uppercase (A-Z)
                      </span>
                      <span style={{ fontSize: '11px', color: /[a-z]/.test(newPassword) ? '#16a34a' : '#94a3b8' }}>
                        {/[a-z]/.test(newPassword) ? '✓' : '•'} Lowercase (a-z)
                      </span>
                      <span style={{ fontSize: '11px', color: /[0-9]/.test(newPassword) ? '#16a34a' : '#94a3b8' }}>
                        {/[0-9]/.test(newPassword) ? '✓' : '•'} Number (0-9)
                      </span>
                      <span style={{ fontSize: '11px', color: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(newPassword) ? '#16a34a' : '#94a3b8' }}>
                        {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(newPassword) ? '✓' : '•'} Special char (!@#$)
                      </span>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Confirm New Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="form-control"
                        placeholder="Re-enter your new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="eye-toggle-btn"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        tabIndex="-1"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={closeForgotModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={forgotLoading}>
                    {forgotLoading ? 'Updating Password...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4: SUCCESS STATE */}
            {forgotStep === 'success' && (
              <div style={{ textAlign: 'center', padding: '16px 8px 8px' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: '#ecfdf5',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <ShieldCheck size={36} />
                </div>
                <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                  Password Changed Successfully!
                </h4>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: 1.5 }}>
                  Your password has been securely updated. You can now sign in using your new credentials.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', fontSize: '15px' }}
                  onClick={closeForgotModal}
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* MODAL 2: WHY WAS LOGIN RESTRICTED / NOT LOGGING IN NOTIFICATION MODAL */}
      {loginNoticeModal.open && (
        <div className="modal-overlay" style={{ zIndex: 120 }}>
          <div
            className="modal-content"
            style={{
              maxWidth: '540px',
              width: '100%',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #fee2e2',
              animation: 'slideUp 0.25s ease-out',
            }}
          >
            {/* Modal Header */}
            <div
              className="modal-header"
              style={{
                background: loginNoticeModal.type === 'geofence' ? '#fef2f2' : '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                padding: '18px 24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: loginNoticeModal.type === 'geofence' ? '#fee2e2' : '#f1f5f9',
                    color: loginNoticeModal.type === 'geofence' ? '#dc2626' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {loginNoticeModal.type === 'geofence' ? (
                    <MapPinOff size={20} />
                  ) : loginNoticeModal.type === 'permission' ? (
                    <AlertCircle size={20} color="#f59e0b" />
                  ) : (
                    <Lock size={20} />
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {loginNoticeModal.title}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                    {loginNoticeModal.subtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLoginNoticeModal((prev) => ({ ...prev, open: false }))}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body" style={{ padding: '24px' }}>
              <div
                style={{
                  background: '#fff1f2',
                  border: '1px solid #fecdd3',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '20px',
                }}
              >
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, color: '#be123c', display: 'block', marginBottom: '4px' }}>
                  Root Cause Diagnosis
                </span>
                <p style={{ fontSize: '13px', color: '#881337', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                  {loginNoticeModal.reason}
                </p>
              </div>

              {/* Location Telemetry Breakdown if Geofence or Permission */}
              {loginNoticeModal.type === 'geofence' && loginNoticeModal.locDetails && (
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px',
                    fontSize: '12.5px',
                    marginBottom: '20px',
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', display: 'block', marginBottom: '10px' }}>
                    Live GPS Telemetry vs Office Geofence
                  </span>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#64748b' }}>Designated Workplace:</span>
                    <strong style={{ color: '#0f172a' }}>{loginNoticeModal.locDetails.officeName || 'Main Office'}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#64748b' }}>Permitted Geofence Radius:</span>
                    <strong style={{ color: '#16a34a' }}>Within {loginNoticeModal.locDetails.allowedRadius || 750} meters</strong>
                  </div>

                  {loginNoticeModal.locDetails.distance !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ color: '#64748b' }}>Your Detected Distance:</span>
                      <strong style={{ color: '#dc2626' }}>
                        {loginNoticeModal.locDetails.distance > 1000
                          ? `${(loginNoticeModal.locDetails.distance / 1000).toFixed(2)} km away`
                          : `${loginNoticeModal.locDetails.distance} meters away`}
                      </strong>
                    </div>
                  )}

                  {loginNoticeModal.locDetails.latitude && loginNoticeModal.locDetails.longitude && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                      <span style={{ color: '#64748b' }}>Your Device Coordinates:</span>
                      <span style={{ fontFamily: 'monospace', color: '#475569' }}>
                        {loginNoticeModal.locDetails.latitude.toFixed(5)}, {loginNoticeModal.locDetails.longitude.toFixed(5)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Troubleshooting Guidance */}
              <div style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.5, background: '#f8fafc', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <strong style={{ display: 'block', color: '#1e293b', marginBottom: '6px' }}>How to resolve:</strong>
                <ul style={{ paddingLeft: '18px', margin: 0 }}>
                  <li style={{ marginBottom: '4px' }}>
                    <strong>On-site employee:</strong> Enable high-accuracy location in your device settings and allow browser location access in the URL bar (click the 📍 or 🔒 lock icon).
                  </li>
                  <li>
                    <strong>Administrator / Testing:</strong> Log in using the <strong>Admin</strong> account to adjust the office coordinates or perimeter radius in <em>Settings → Workplace Geofence</em>.
                  </li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '13px', padding: '8px 16px' }}
                onClick={() => {
                  setLoginNoticeModal((prev) => ({ ...prev, open: false }));
                  handleQuickFill('admin');
                }}
              >
                Switch to Admin Account
              </button>

              <button
                type="button"
                className="btn btn-primary"
                style={{ fontSize: '13px', padding: '8px 20px' }}
                onClick={() => setLoginNoticeModal((prev) => ({ ...prev, open: false }))}
              >
                Dismiss Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;

