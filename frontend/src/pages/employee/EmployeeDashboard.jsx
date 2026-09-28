import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardCard from '../../components/DashboardCard';
import {
  CalendarCheck,
  Calendar,
  Clock,
  CheckSquare,
  CheckCircle2,
  AlertCircle,
  LogIn,
  LogOut,
  Coffee,
  Utensils,
  Bell,
  ArrowRight,
  X,
  MapPin,
  MapPinOff,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FaceVerificationModal from '../../components/FaceVerificationModal';
import { verifyAttendanceLocation } from '../../utils/locationService';

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);
  const [punchMessage, setPunchMessage] = useState({ type: '', text: '' });
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [verifiedLocation, setVerifiedLocation] = useState(null);
  const [officeInfo, setOfficeInfo] = useState(null);
  const [userDistance, setUserDistance] = useState(null);
  const [checkingOfficeLoc, setCheckingOfficeLoc] = useState(false);
  const [locationStatus, setLocationStatus] = useState('checking'); // 'checking' | 'allowed' | 'denied'
  const [deniedDetails, setDeniedDetails] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/employee');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadOfficeLocation = async () => {
    setCheckingOfficeLoc(true);
    try {
      const locCheck = await verifyAttendanceLocation();
      setOfficeInfo(locCheck.officeLocation || { name: locCheck.officeName, radiusMeters: locCheck.allowedRadius });
      if (locCheck.distance !== undefined) {
        setUserDistance(locCheck.distance);
      }
      setVerifiedLocation(locCheck);

      if (locCheck.success) {
        setLocationStatus('allowed');
        setDeniedDetails(null);
      } else {
        setLocationStatus('denied');
        setDeniedDetails(locCheck);
      }
    } catch (err) {
      console.warn('Failed to load workplace location:', err);
      setLocationStatus('denied');
      setDeniedDetails({ message: err.message || 'Failed to verify GPS workplace location.' });
    } finally {
      setCheckingOfficeLoc(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    loadOfficeLocation();

    const handleLocationUpdate = () => {
      loadOfficeLocation();
    };

    window.addEventListener('office-location-updated', handleLocationUpdate);
    window.addEventListener('storage', handleLocationUpdate);
    return () => {
      window.removeEventListener('office-location-updated', handleLocationUpdate);
      window.removeEventListener('storage', handleLocationUpdate);
    };
  }, []);

  const handleOpenFaceModal = () => {
    setPunchMessage({ type: '', text: '' });
    setFaceModalOpen(true);
  };

  const handleFaceCheckInSuccess = async (faceData) => {
    setFaceModalOpen(false);
    setPunchLoading(true);
    setPunchMessage({ type: '', text: '' });
    try {
      const res = await api.post('/attendance/checkin', {
        notes: 'Photo & Location Verified Check-in',
        faceVerified: true,
        faceImage: faceData?.faceImage || '',
        latitude: faceData?.latitude,
        longitude: faceData?.longitude,
        distance: faceData?.distance,
      });
      if (res.data.success) {
        const isAbsent = res.data.attendance?.status === 'Absent' || res.data.status === 'Absent';
        const isHalfDay = res.data.attendance?.status === 'Half Day' || res.data.status === 'Half Day';
        setPunchMessage({
          type: isAbsent ? 'danger' : isHalfDay ? 'warning' : 'success',
          text: res.data.message || `Photo & Location verified! Checked in at ${faceData?.officeName || 'authorized office'}. Have a productive day.`,
        });
        fetchDashboardData();
        loadOfficeLocation();
      }
    } catch (err) {
      setPunchMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Check-in failed.',
      });
    } finally {
      setPunchLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setPunchLoading(true);
    setPunchMessage({ type: '', text: '' });
    try {
      const locCheck = await verifyAttendanceLocation();
      if (!locCheck.success) {
        setPunchMessage({ type: 'danger', text: locCheck.message });
        return;
      }
      const res = await api.post('/attendance/checkout', {
        latitude: locCheck.latitude,
        longitude: locCheck.longitude,
      });
      if (res.data.success) {
        setPunchMessage({ type: 'success', text: `Checked out successfully within ${locCheck.officeName}. Shift logged.` });
        fetchDashboardData();
      }
    } catch (err) {
      setPunchMessage({
        type: 'danger',
        text: err.response?.data?.message || err.message || 'Check-out failed.',
      });
    } finally {
      setPunchLoading(false);
    }
  };

  const handleBreakIn = async () => {
    setPunchLoading(true);
    setPunchMessage({ type: '', text: '' });
    try {
      const locCheck = await verifyAttendanceLocation();
      if (!locCheck.success) {
        setPunchMessage({ type: 'danger', text: locCheck.message });
        return;
      }
      const res = await api.post('/attendance/break-in', {
        latitude: locCheck.latitude,
        longitude: locCheck.longitude,
      });
      if (res.data.success) {
        setPunchMessage({ type: 'success', text: `Break In recorded at ${locCheck.officeName}! Enjoy your break.` });
        fetchDashboardData();
      }
    } catch (err) {
      setPunchMessage({
        type: 'danger',
        text: err.response?.data?.message || err.message || 'Break In failed.',
      });
    } finally {
      setPunchLoading(false);
    }
  };

  const handleBreakEnd = async () => {
    setPunchLoading(true);
    setPunchMessage({ type: '', text: '' });
    try {
      const locCheck = await verifyAttendanceLocation();
      if (!locCheck.success) {
        setPunchMessage({ type: 'danger', text: locCheck.message });
        return;
      }
      const res = await api.post('/attendance/break-end', {
        latitude: locCheck.latitude,
        longitude: locCheck.longitude,
      });
      if (res.data.success) {
        setPunchMessage({ type: 'success', text: `Break End recorded at ${locCheck.officeName}! Welcome back.` });
        fetchDashboardData();
      }
    } catch (err) {
      setPunchMessage({
        type: 'danger',
        text: err.response?.data?.message || err.message || 'Break End failed.',
      });
    } finally {
      setPunchLoading(false);
    }
  };

  const handleLunchIn = async () => {
    setPunchLoading(true);
    setPunchMessage({ type: '', text: '' });
    try {
      const locCheck = await verifyAttendanceLocation();
      if (!locCheck.success) {
        setPunchMessage({ type: 'danger', text: locCheck.message });
        return;
      }
      const res = await api.post('/attendance/lunch-in', {
        latitude: locCheck.latitude,
        longitude: locCheck.longitude,
      });
      if (res.data.success) {
        setPunchMessage({ type: 'success', text: `Lunch In recorded at ${locCheck.officeName}! Enjoy your meal.` });
        fetchDashboardData();
      }
    } catch (err) {
      setPunchMessage({
        type: 'danger',
        text: err.response?.data?.message || err.message || 'Lunch In failed.',
      });
    } finally {
      setPunchLoading(false);
    }
  };

  const handleLunchEnd = async () => {
    setPunchLoading(true);
    setPunchMessage({ type: '', text: '' });
    try {
      const locCheck = await verifyAttendanceLocation();
      if (!locCheck.success) {
        setPunchMessage({ type: 'danger', text: locCheck.message });
        return;
      }
      const res = await api.post('/attendance/lunch-end', {
        latitude: locCheck.latitude,
        longitude: locCheck.longitude,
      });
      if (res.data.success) {
        setPunchMessage({ type: 'success', text: `Lunch End recorded at ${locCheck.officeName}! Welcome back.` });
        fetchDashboardData();
      }
    } catch (err) {
      setPunchMessage({
        type: 'danger',
        text: err.response?.data?.message || err.message || 'Lunch End failed.',
      });
    } finally {
      setPunchLoading(false);
    }
  };

  // Loading & Geofence Verification Screens
  if (loading || locationStatus === 'checking') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '65vh', gap: '16px' }}>
        <div className="spinner"></div>
        <p style={{ color: '#64748b', fontSize: '14px', fontWeight: 600 }}>
          {checkingOfficeLoc ? 'Verifying authorized office geofence presence...' : 'Loading Employee Workspace...'}
        </p>
      </div>
    );
  }

  // Geofence Restriction: If employee is outside authorized office location -> Deny Access
  if (locationStatus === 'denied') {
    return (
      <div
        style={{
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            maxWidth: '560px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 45px -10px rgba(239, 68, 68, 0.18), 0 0 0 1px #fee2e2',
            padding: '36px 30px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: '#fef2f2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              border: '2px solid #fecaca',
            }}
          >
            <MapPinOff size={36} />
          </div>

          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#dc2626',
              background: '#fee2e2',
              padding: '4px 12px',
              borderRadius: '20px',
            }}
          >
            Geofence Security Policy
          </span>

          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', marginTop: '12px', marginBottom: '8px' }}>
            Access Denied: Outside Authorized Office
          </h1>

          <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.6, marginBottom: '22px' }}>
            {deniedDetails?.message ||
              'Access to the Employee Dashboard is denied because you are not physically present within the permitted workplace geofence.'}
          </p>

          {/* Location Telemetry Box */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px 18px',
              textAlign: 'left',
              marginBottom: '26px',
              fontSize: '13px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#64748b' }}>Authorized Workplace:</span>
              <strong style={{ color: '#0f172a' }}>{deniedDetails?.officeName || officeInfo?.name || 'Main Office'}</strong>
            </div>
            {deniedDetails?.allowedRadius && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Permitted Geofence:</span>
                <strong style={{ color: '#0f172a' }}>Within {deniedDetails.allowedRadius} meters</strong>
              </div>
            )}
            {deniedDetails?.distance !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Current Detected Distance:</span>
                <strong style={{ color: '#dc2626' }}>{deniedDetails.distance} meters away</strong>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Policy Requirement:</span>
              <span style={{ color: '#dc2626', fontWeight: 700 }}>Physical On-Premise Presence Required</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={loadOfficeLocation}
              disabled={checkingOfficeLoc}
              className="btn btn-primary"
              style={{ padding: '11px 22px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
            >
              <RefreshCw size={16} className={checkingOfficeLoc ? 'animate-spin' : ''} />
              <span>{checkingOfficeLoc ? 'Verifying GPS...' : 'Retry Location Check'}</span>
            </button>
            <button
              type="button"
              onClick={logout}
              className="btn btn-secondary"
              style={{ padding: '11px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { cards, todayAttendance, myTasks = [], notifications = [], employee } = data || {};

  const hasCheckedIn = !!todayAttendance?.checkIn;
  const hasCheckedOut = !!todayAttendance?.checkOut;
  const isOnBreak = !!todayAttendance?.isOnBreak;
  const isOnLunch = !!todayAttendance?.isOnLunch;

  const rawName = user?.name || user?.username || employee?.name || 'Employee';
  const userName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  return (
    <div>
      {/* Alert Notification Banner */}
      {punchMessage.text && (
        <div
          className={`alert alert-${punchMessage.type}`}
          style={{
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {punchMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span style={{ fontSize: '14px', fontWeight: 600 }}>{punchMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setPunchMessage({ type: '', text: '' })}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Interactive Daily Punch Banner */}
      <div
        className="table-card"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
          color: '#ffffff',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          marginBottom: '24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a5b4fc', fontWeight: 700 }}>
              DAILY ATTENDANCE PUNCH
            </span>
            {hasCheckedIn && (
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  fontWeight: 600,
                }}
              >
                {isOnLunch ? 'On Lunch' : isOnBreak ? 'On Break' : hasCheckedOut ? 'Shift Ended' : 'On Duty'}
              </span>
            )}
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px' }}>
            Welcome to {userName}
          </h2>
          {(hasCheckedIn || hasCheckedOut || isOnBreak || isOnLunch) && (
            <p style={{ fontSize: '13px', color: '#c7d2fe', marginTop: '4px' }}>
              {hasCheckedOut
                ? `Shift Finished for Today • Total: ${todayAttendance?.workingHours || 0} hrs worked`
                : isOnLunch
                ? 'Currently on Lunch Break 🍽️'
                : isOnBreak
                ? 'Currently on Short Break ☕'
                : hasCheckedIn && todayAttendance?.checkIn
                ? `Currently On Duty (Checked In at ${new Date(todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
                : ''}
              {isOnBreak && todayAttendance?.breakIn
                ? ` • Break started at ${new Date(todayAttendance.breakIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : ''}
              {isOnLunch && todayAttendance?.lunchIn
                ? ` • Lunch started at ${new Date(todayAttendance.lunchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : ''}
              {hasCheckedOut && todayAttendance?.workingHours
                ? ` • Total: ${todayAttendance.workingHours} hrs worked`
                : ''}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
          {!hasCheckedIn ? (
            <button
              className="btn btn-success"
              style={{ padding: '12px 24px', fontSize: '15px', fontWeight: 700, boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
              onClick={handleOpenFaceModal}
              disabled={punchLoading}
            >
              <LogIn size={18} />
              <span>{punchLoading ? 'Recording...' : 'Mark Check-In'}</span>
            </button>
          ) : !hasCheckedOut ? (
            <>
              {/* Break In / Break End button */}
              {isOnBreak ? (
                <button
                  className="btn"
                  style={{
                    padding: '11px 20px',
                    fontSize: '14px',
                    fontWeight: 700,
                    background: '#f59e0b',
                    color: '#ffffff',
                    border: 'none',
                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
                  }}
                  onClick={handleBreakEnd}
                  disabled={punchLoading}
                >
                  <Coffee size={17} />
                  <span>{punchLoading ? 'Recording...' : 'Break End'}</span>
                </button>
              ) : (
                <button
                  className="btn"
                  style={{
                    padding: '11px 20px',
                    fontSize: '14px',
                    fontWeight: 700,
                    background: 'rgba(255, 255, 255, 0.16)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    backdropFilter: 'blur(6px)',
                  }}
                  onClick={handleBreakIn}
                  disabled={punchLoading || isOnLunch}
                  title={isOnLunch ? 'Finish lunch before starting break' : 'Start break'}
                >
                  <Coffee size={17} />
                  <span>{punchLoading ? 'Recording...' : 'Break In'}</span>
                </button>
              )}

              {/* Lunch In / Lunch End button */}
              {isOnLunch ? (
                <button
                  className="btn"
                  style={{
                    padding: '11px 20px',
                    fontSize: '14px',
                    fontWeight: 700,
                    background: '#0ea5e9',
                    color: '#ffffff',
                    border: 'none',
                    boxShadow: '0 4px 14px rgba(14, 165, 233, 0.4)',
                  }}
                  onClick={handleLunchEnd}
                  disabled={punchLoading}
                >
                  <Utensils size={17} />
                  <span>{punchLoading ? 'Recording...' : 'Lunch End'}</span>
                </button>
              ) : (
                <button
                  className="btn"
                  style={{
                    padding: '11px 20px',
                    fontSize: '14px',
                    fontWeight: 700,
                    background: 'rgba(255, 255, 255, 0.16)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    backdropFilter: 'blur(6px)',
                  }}
                  onClick={handleLunchIn}
                  disabled={punchLoading || isOnBreak}
                  title={isOnBreak ? 'Finish break before starting lunch' : 'Start lunch'}
                >
                  <Utensils size={17} />
                  <span>{punchLoading ? 'Recording...' : 'Lunch In'}</span>
                </button>
              )}

              {/* Mark Check-Out button */}
              <button
                className="btn btn-danger"
                style={{ padding: '11px 22px', fontSize: '14px', fontWeight: 700, boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)' }}
                onClick={handleCheckOut}
                disabled={punchLoading}
              >
                <LogOut size={17} />
                <span>{punchLoading ? 'Recording...' : 'Mark Check-Out'}</span>
              </button>
            </>
          ) : (
            <span
              style={{
                background: 'rgba(255,255,255,0.15)',
                padding: '10px 18px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '13px',
              }}
            >
              ✓ Today's Punch Complete
            </span>
          )}
        </div>
      </div>


      {/* 6 Employee Dashboard Cards */}
      <div className="dashboard-grid">
        <DashboardCard
          title="Attendance Status"
          value={cards?.attendanceStatus || 'Not Checked In'}
          icon={CalendarCheck}
          color={hasCheckedIn ? '#10b981' : '#f59e0b'}
          bg={hasCheckedIn ? '#ecfdf5' : '#fffbeb'}
          subtitle={hasCheckedIn ? 'Logged for today' : 'Action needed'}
        />
        <DashboardCard
          title="Working Days"
          value={`${cards?.workingDays ?? 0} Days`}
          icon={Calendar}
          color="#4f46e5"
          bg="#eef2ff"
          subtitle="This billing cycle"
          to="/employee/attendance"
        />
        <DashboardCard
          title="Leave Balance"
          value={`${cards?.leaveBalance ?? 14} Days`}
          icon={Clock}
          color="#0ea5e9"
          bg="#f0f9ff"
          subtitle="Remaining paid quota"
          to="/employee/leave"
        />
        <DashboardCard
          title="Tasks Assigned"
          value={cards?.tasksAssigned ?? 0}
          icon={CheckSquare}
          color="#8b5cf6"
          bg="#f5f3ff"
          subtitle="Allocated to you"
          to="/employee/tasks"
        />
        <DashboardCard
          title="Tasks Completed"
          value={cards?.tasksCompleted ?? 0}
          icon={CheckCircle2}
          color="#10b981"
          bg="#ecfdf5"
          subtitle="Delivered successfully"
          to="/employee/tasks"
        />
        <DashboardCard
          title="Pending Tasks"
          value={cards?.pendingTasks ?? 0}
          icon={AlertCircle}
          color="#ef4444"
          bg="#fef2f2"
          subtitle="In pipeline"
          to="/employee/tasks"
        />
      </div>

      <div className="dashboard-tables-grid">
        {/* My Tasks preview */}
        <div className="table-card">
          <div className="table-toolbar">
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>My Assigned Tasks</h3>
            <Link to="/employee/tasks" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
              All Tasks <ArrowRight size={14} />
            </Link>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myTasks.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                      No tasks assigned at the moment.
                    </td>
                  </tr>
                ) : (
                  myTasks.map((t) => (
                    <tr
                      key={t._id}
                      onClick={() => navigate('/employee/tasks')}
                      style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                      title="Click to view task details in My Tasks"
                    >
                      <td>
                        <strong style={{ color: '#1e293b' }}>{t.title}</strong>
                        <span style={{ display: 'block', fontSize: '12px', color: '#64748b' }}>{t.project?.projectName}</span>
                      </td>
                      <td>
                        <span className={`badge badge-priority-${t.priority.toLowerCase()}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td>{new Date(t.dueDate).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge badge-${t.status.toLowerCase().replace(/\s+/g, '')}`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Company Announcements & Notifications */}
        <div className="table-card">
          <div className="table-toolbar">
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Announcements & Notifications</h3>
            <Link to="/employee/notifications" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ marginTop: '2px', color: '#4f46e5' }}>
                  <Bell size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{n.title}</h4>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{n.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Biometric Face Verification Camera Modal */}
      <FaceVerificationModal
        isOpen={faceModalOpen}
        onClose={() => setFaceModalOpen(false)}
        onSuccess={handleFaceCheckInSuccess}
        employeeName={user?.name}
        employeePhoto={user?.avatar}
      />
    </div>
  );
};

export default EmployeeDashboard;
