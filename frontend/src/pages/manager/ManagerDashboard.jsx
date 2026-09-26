import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardCard from '../../components/DashboardCard';
import {
  Users,
  CalendarCheck,
  UserX,
  Clock,
  CheckSquare,
  CheckCircle2,
  ArrowRight,
  Check,
  X,
  LogIn,
  LogOut,
  MapPin,
  RefreshCw,
  AlertCircle,
  Camera,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import FaceVerificationModal from '../../components/FaceVerificationModal';
import { verifyAttendanceLocation } from '../../utils/locationService';

const ManagerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Manager Attendance Punch States (Check-in & Check-out only)
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [punchLoading, setPunchLoading] = useState(false);
  const [punchMessage, setPunchMessage] = useState({ type: '', text: '' });
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [officeInfo, setOfficeInfo] = useState(null);
  const [userDistance, setUserDistance] = useState(null);
  const [checkingOfficeLoc, setCheckingOfficeLoc] = useState(false);

  const fetchManagerData = async () => {
    try {
      setLoading(true);
      const [mgrRes, attRes] = await Promise.all([
        api.get('/dashboard/manager'),
        api.get('/attendance/today').catch(() => ({ data: { attendance: null } })),
      ]);

      if (mgrRes.data?.success) {
        setData(mgrRes.data);
        if (mgrRes.data.todayAttendance) {
          setTodayAttendance(mgrRes.data.todayAttendance);
        }
      }

      if (attRes.data?.success && attRes.data.attendance) {
        setTodayAttendance(attRes.data.attendance);
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
    } catch (err) {
      console.warn('Could not retrieve office location info:', err);
    } finally {
      setCheckingOfficeLoc(false);
    }
  };

  useEffect(() => {
    fetchManagerData();
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
        notes: 'Photo & Location Verified Check-in (Manager)',
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
          text: res.data.message || `Photo & Location verified! Checked in at ${faceData?.officeName || 'authorized office'}.`,
        });
        setTodayAttendance(res.data.attendance);
        fetchManagerData();
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
        setPunchMessage({
          type: 'success',
          text: `Checked out successfully within ${locCheck.officeName}. Shift logged.`,
        });
        setTodayAttendance(res.data.attendance);
        fetchManagerData();
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

  const handleApproveLeave = async (id) => {
    try {
      await api.put(`/leaves/${id}/approve`);
      fetchManagerData();
    } catch (e) {
      alert('Approval failed');
    }
  };

  const handleRejectLeave = async (id) => {
    try {
      await api.put(`/leaves/${id}/reject`, { rejectionReason: 'Declined by manager' });
      fetchManagerData();
    } catch (e) {
      alert('Rejection failed');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const { cards, recentTasks = [], pendingTeamLeaves = [] } = data || {};
  const hasCheckedIn = Boolean(todayAttendance && todayAttendance.checkIn);
  const hasCheckedOut = Boolean(todayAttendance && todayAttendance.checkOut);

  return (
    <div>
      {/* Alert Punch Feedback Messages */}
      {punchMessage.text && (
        <div className={`alert alert-${punchMessage.type}`} style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} />
              <span>{punchMessage.text}</span>
            </div>
            <button
              onClick={() => setPunchMessage({ type: '', text: '' })}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Interactive Manager Daily Punch Banner (Check-In & Check-Out with Photo & Location) */}
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
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(30, 27, 75, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
          {/* Check-In Captured Photo Thumbnail (if checked in) */}
          {hasCheckedIn && todayAttendance?.faceImage && (
            <div style={{ position: 'relative' }}>
              <img
                src={todayAttendance.faceImage}
                alt="Captured Check-in"
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #10b981',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  background: '#10b981',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #1e1b4b',
                }}
                title="Verified Photo Check-in"
              >
                <Camera size={10} color="#ffffff" />
              </span>
            </div>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a5b4fc', fontWeight: 700 }}>
                MANAGER ATTENDANCE PUNCH
              </span>
              {todayAttendance?.status && (
                <span
                  className={`badge badge-${todayAttendance.status.toLowerCase().replace(/\s+/g, '')}`}
                  style={{ fontSize: '11px', padding: '2px 8px' }}
                >
                  {todayAttendance.status}
                </span>
              )}
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px', marginBottom: '2px' }}>
              {hasCheckedOut
                ? 'Shift Finished for Today'
                : hasCheckedIn
                ? 'Currently On Duty (Checked In)'
                : 'Ready to Start Your Manager Shift?'}
            </h2>

            <p style={{ fontSize: '13px', color: '#c7d2fe', margin: '4px 0 0 0' }}>
              {hasCheckedIn && todayAttendance?.checkIn
                ? `Clocked in at ${new Date(todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Log your arrival time accurately with verified photo & authorized workplace location'}
              {hasCheckedOut && todayAttendance?.checkOut
                ? ` • Clocked out at ${new Date(todayAttendance.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : ''}
              {hasCheckedOut && todayAttendance?.workingHours
                ? ` • Total: ${todayAttendance.workingHours} hrs worked`
                : ''}
            </p>
          </div>
        </div>

        {/* Action Buttons: Only Check-in and Check-out (no lunch or break buttons) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
          {!hasCheckedIn ? (
            <button
              className="btn btn-success"
              style={{
                padding: '12px 24px',
                fontSize: '15px',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onClick={handleOpenFaceModal}
              disabled={punchLoading}
            >
              <LogIn size={18} />
              <span>{punchLoading ? 'Recording...' : 'Mark Check-In'}</span>
            </button>
          ) : !hasCheckedOut ? (
            <button
              className="btn btn-danger"
              style={{
                padding: '12px 24px',
                fontSize: '15px',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onClick={handleCheckOut}
              disabled={punchLoading}
            >
              <LogOut size={18} />
              <span>{punchLoading ? 'Recording...' : 'Mark Check-Out'}</span>
            </button>
          ) : (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: 'rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#e2e8f0',
              }}
            >
              <CheckCircle2 size={16} color="#10b981" />
              <span>Attendance Completed</span>
            </div>
          )}
        </div>
      </div>

      {/* Workplace Location Status Indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 18px',
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          marginBottom: '24px',
          fontSize: '13px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
          <MapPin size={17} color="#4f46e5" />
          <span>
            Authorized Workplace Geofence:{' '}
            <strong>{officeInfo?.name || 'Main Office Headquarters'}</strong>
            {officeInfo?.radiusMeters ? ` (${officeInfo.radiusMeters}m perimeter)` : ''}
          </span>
          {userDistance !== null && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                background: userDistance <= (officeInfo?.radiusMeters || 500) ? '#ecfdf5' : '#fef2f2',
                color: userDistance <= (officeInfo?.radiusMeters || 500) ? '#059669' : '#dc2626',
              }}
            >
              Distance: {userDistance}m
            </span>
          )}
        </div>

        <button
          onClick={loadOfficeLocation}
          disabled={checkingOfficeLoc}
          className="btn btn-secondary"
          style={{ padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          title="Verify your current workplace location distance"
        >
          <RefreshCw size={13} className={checkingOfficeLoc ? 'spin' : ''} />
          <span>{checkingOfficeLoc ? 'Checking GPS...' : 'Refresh Location'}</span>
        </button>
      </div>

      {/* 6 Manager Dashboard Cards */}
      <div className="dashboard-grid">
        <DashboardCard
          title="Total Team Members"
          value={cards?.totalTeamMembers ?? 0}
          icon={Users}
          color="#4f46e5"
          bg="#eef2ff"
          subtitle="Assigned staff"
        />
        <DashboardCard
          title="Present Today"
          value={cards?.presentToday ?? 0}
          icon={CalendarCheck}
          color="#10b981"
          bg="#ecfdf5"
          subtitle="Checked in"
        />
        <DashboardCard
          title="Absent Today"
          value={cards?.absentToday ?? 0}
          icon={UserX}
          color="#ef4444"
          bg="#fef2f2"
          subtitle="Not logged in"
        />
        <DashboardCard
          title="Pending Leave Requests"
          value={cards?.pendingLeaveRequests ?? 0}
          icon={Clock}
          color="#f59e0b"
          bg="#fffbeb"
          subtitle="Needs review"
        />
        <DashboardCard
          title="Active Tasks"
          value={cards?.activeTasks ?? 0}
          icon={CheckSquare}
          color="#0ea5e9"
          bg="#f0f9ff"
          subtitle="In progress / pending"
        />
        <DashboardCard
          title="Completed Tasks"
          value={cards?.completedTasks ?? 0}
          icon={CheckCircle2}
          color="#8b5cf6"
          bg="#f5f3ff"
          subtitle="Finished"
        />
      </div>

      <div className="dashboard-tables-grid">
        {/* Pending Team Leaves */}
        <div className="table-card">
          <div className="table-toolbar">
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Team Leave Applications</h3>
            <Link to="/manager/leaves" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Team Member</th>
                  <th>Leave Type</th>
                  <th>Dates</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingTeamLeaves.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                      No pending leave requests from your team.
                    </td>
                  </tr>
                ) : (
                  pendingTeamLeaves.map((l) => (
                    <tr key={l._id}>
                      <td>
                        <div className="user-cell">
                          <img
                            src={l.employee?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${l.employee?.name}`}
                            alt=""
                          />
                          <div className="user-cell-meta">
                            <div className="name">{l.employee?.name}</div>
                            <div className="email">{l.employee?.designation}</div>
                          </div>
                        </div>
                      </td>
                      <td>{l.leaveType}</td>
                      <td style={{ fontSize: '12px' }}>
                        {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-success"
                            style={{ padding: '4px 8px', fontSize: '11.5px' }}
                            onClick={() => handleApproveLeave(l._id)}
                          >
                            <Check size={12} /> Approve
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '4px 8px', fontSize: '11.5px' }}
                            onClick={() => handleRejectLeave(l._id)}
                          >
                            <X size={12} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Team Tasks */}
        <div className="table-card">
          <div className="table-toolbar">
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Recent Team Tasks</h3>
            <Link to="/manager/tasks" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
              Manage Tasks <ArrowRight size={14} />
            </Link>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Assignee</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                      No tasks assigned yet.
                    </td>
                  </tr>
                ) : (
                  recentTasks.map((t) => (
                    <tr key={t._id}>
                      <td>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{t.title}</span>
                      </td>
                      <td>
                        <div className="user-cell">
                          <img
                            src={t.assignedTo?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${t.assignedTo?.name}`}
                            alt=""
                          />
                          <div className="user-cell-meta">
                            <div className="name">{t.assignedTo?.name}</div>
                          </div>
                        </div>
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
      </div>

      {/* Captured Photo Verification Modal for Manager Check-In */}
      <FaceVerificationModal
        isOpen={faceModalOpen}
        onClose={() => setFaceModalOpen(false)}
        onVerified={handleFaceCheckInSuccess}
      />
    </div>
  );
};

export default ManagerDashboard;
