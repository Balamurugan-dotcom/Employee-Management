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
} from 'lucide-react';
import BrandLogo from '../components/BrandLogo';

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

  const { login, user } = useAuth();
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

    const result = await login(identifier, password, rememberMe);
    setLoading(false);

    if (result.success) {
      const loggedUser = result.user;
      // Automatic role-based dashboard redirection
      if (loggedUser.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (loggedUser.role === 'manager') {
        navigate('/manager/dashboard', { replace: true });
      } else {
        navigate('/employee/dashboard', { replace: true });
      }
    } else {
      setErrorMessage(result.message || 'Login failed. Please check your credentials.');
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

    if (!newPassword || newPassword.length < 6) {
      setForgotStatus({ success: false, message: 'Password must be at least 6 characters long.' });
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
          <div className="alert alert-danger">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
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
            disabled={loading}
          >
            {loading ? (
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
                        placeholder="At least 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoFocus
                        required
                        minLength={6}
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
    </div>
  );
};

export default Login;

