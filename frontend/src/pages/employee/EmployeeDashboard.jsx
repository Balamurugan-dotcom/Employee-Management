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
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);
  const [punchMessage, setPunchMessage] = useState({ type: '', text: '' });

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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCheckIn = async () => {
    setPunchLoading(true);
    setPunchMessage({ type: '', text: '' });
    try {
      const res = await api.post('/attendance/checkin', { notes: 'Dashboard quick check-in' });
      if (res.data.success) {
        setPunchMessage({ type: 'success', text: 'Checked in successfully! Have a productive day.' });
        fetchDashboardData();
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
      const res = await api.post('/attendance/checkout');
      if (res.data.success) {
        setPunchMessage({ type: 'success', text: 'Checked out successfully! Shift logged.' });
        fetchDashboardData();
      }
    } catch (err) {
      setPunchMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Check-out failed.',
      });
    } finally {
      setPunchLoading(false);
    }
  };

  const handleBreakIn = async () => {
    setPunchLoading(true);
    setPunchMessage({ type: '', text: '' });
    try {
      const res = await api.post('/attendance/break-in');
      if (res.data.success) {
        setPunchMessage({ type: 'success', text: 'Break In recorded! Enjoy your break.' });
        fetchDashboardData();
      }
    } catch (err) {
      setPunchMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Break In failed.',
      });
    } finally {
      setPunchLoading(false);
    }
  };

  const handleBreakEnd = async () => {
    setPunchLoading(true);
    setPunchMessage({ type: '', text: '' });
    try {
      const res = await api.post('/attendance/break-end');
      if (res.data.success) {
        setPunchMessage({ type: 'success', text: 'Break End recorded! Welcome back.' });
        fetchDashboardData();
      }
    } catch (err) {
      setPunchMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Break End failed.',
      });
    } finally {
      setPunchLoading(false);
    }
  };

  const handleLunchIn = async () => {
    setPunchLoading(true);
    setPunchMessage({ type: '', text: '' });
    try {
      const res = await api.post('/attendance/lunch-in');
      if (res.data.success) {
        setPunchMessage({ type: 'success', text: 'Lunch In recorded! Enjoy your meal.' });
        fetchDashboardData();
      }
    } catch (err) {
      setPunchMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Lunch In failed.',
      });
    } finally {
      setPunchLoading(false);
    }
  };

  const handleLunchEnd = async () => {
    setPunchLoading(true);
    setPunchMessage({ type: '', text: '' });
    try {
      const res = await api.post('/attendance/lunch-end');
      if (res.data.success) {
        setPunchMessage({ type: 'success', text: 'Lunch End recorded! Welcome back.' });
        fetchDashboardData();
      }
    } catch (err) {
      setPunchMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Lunch End failed.',
      });
    } finally {
      setPunchLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const { cards, todayAttendance, myTasks = [], notifications = [], employee } = data || {};

  const hasCheckedIn = !!todayAttendance?.checkIn;
  const hasCheckedOut = !!todayAttendance?.checkOut;
  const isOnBreak = !!todayAttendance?.isOnBreak;
  const isOnLunch = !!todayAttendance?.isOnLunch;

  return (
    <div>
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
          <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a5b4fc', fontWeight: 700 }}>
            DAILY ATTENDANCE PUNCH
          </span>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px' }}>
            {hasCheckedOut
              ? 'Shift Finished for Today'
              : isOnLunch
              ? 'Currently on Lunch Break 🍽️'
              : isOnBreak
              ? 'Currently on Short Break ☕'
              : hasCheckedIn
              ? 'Currently On Duty (Checked In)'
              : 'Ready to Start Your Work Shift?'}
          </h2>
          <p style={{ fontSize: '13px', color: '#c7d2fe', marginTop: '4px' }}>
            {hasCheckedIn && todayAttendance?.checkIn
              ? `Clocked in at ${new Date(todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Log your arrival time accurately for payroll processing'}
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
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
          {!hasCheckedIn ? (
            <button
              className="btn btn-success"
              style={{ padding: '12px 24px', fontSize: '15px', fontWeight: 700, boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
              onClick={handleCheckIn}
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
        />
        <DashboardCard
          title="Leave Balance"
          value={`${cards?.leaveBalance ?? 14} Days`}
          icon={Clock}
          color="#0ea5e9"
          bg="#f0f9ff"
          subtitle="Remaining paid quota"
        />
        <DashboardCard
          title="Tasks Assigned"
          value={cards?.tasksAssigned ?? 0}
          icon={CheckSquare}
          color="#8b5cf6"
          bg="#f5f3ff"
          subtitle="Allocated to you"
        />
        <DashboardCard
          title="Tasks Completed"
          value={cards?.tasksCompleted ?? 0}
          icon={CheckCircle2}
          color="#10b981"
          bg="#ecfdf5"
          subtitle="Delivered successfully"
        />
        <DashboardCard
          title="Pending Tasks"
          value={cards?.pendingTasks ?? 0}
          icon={AlertCircle}
          color="#ef4444"
          bg="#fef2f2"
          subtitle="In pipeline"
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
    </div>
  );
};

export default EmployeeDashboard;
