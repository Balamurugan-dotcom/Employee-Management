import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Eye, EyeOff, Lock, User, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
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
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState({ success: false, message: '' });
  const [forgotLoading, setForgotLoading] = useState(false);

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

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setForgotStatus({ success: false, message: '' });

    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotStatus({ success: true, message: res.data.message });
    } catch (err) {
      setForgotStatus({
        success: false,
        message: err.response?.data?.message || 'Error requesting password reset.',
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
              onClick={() => {
                setForgotModal(true);
                setForgotEmail(identifier.includes('@') ? identifier : '');
                setForgotStatus({ success: false, message: '' });
              }}
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

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>Reset Password</h3>
              <button
                className="btn-icon"
                onClick={() => setForgotModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleForgotSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '16px' }}>
                  Enter your registered work email address. We will verify your account and provide reset instructions.
                </p>

                {forgotStatus.message && (
                  <div
                    className={`alert ${forgotStatus.success ? 'alert-success' : 'alert-danger'}`}
                    style={{ marginBottom: '16px' }}
                  >
                    {forgotStatus.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span>{forgotStatus.message}</span>
                  </div>
                )}

                <div className="form-group">
                  <label>Work Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="name@ems.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setForgotModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
