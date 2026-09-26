import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Clock,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Coffee,
  Utensils,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  X,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import FaceVerificationModal from '../../components/FaceVerificationModal';
import { verifyAttendanceLocation } from '../../utils/locationService';

const Attendance = () => {
  const { user } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().substring(0, 7)
  );
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'calendar'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [verifiedLocation, setVerifiedLocation] = useState(null);
  const [officeInfo, setOfficeInfo] = useState(null);
  const [userDistance, setUserDistance] = useState(null);
  const [checkingOfficeLoc, setCheckingOfficeLoc] = useState(false);

  const fetchAttendanceData = async (monthToFetch = selectedMonth) => {
    try {
      setLoading(true);
      const targetId = user?.employeeId || user?.employeeRecordId || user?._id;
      const [todayRes, histRes] = await Promise.all([
        api.get('/attendance/today'),
        api.get(`/attendance/${targetId}`, {
          params: { month: monthToFetch !== 'all' ? monthToFetch : undefined },
        }),
      ]);

      if (todayRes.data.success) {
        setTodayAttendance(todayRes.data.attendance);
      }
      if (histRes.data.success) {
        setHistory(histRes.data.records || []);
        setStats(histRes.data.stats || null);
        if (histRes.data.availableMonths?.length > 0) {
          setAvailableMonths(histRes.data.availableMonths);
        }
      }
    } catch (e) {
      console.error('Failed to load attendance', e);
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
    } catch (err) {
      console.warn('Failed to load workplace location:', err);
    } finally {
      setCheckingOfficeLoc(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAttendanceData(selectedMonth);
    }
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
  }, [user, selectedMonth]);

  const handleOpenFaceModal = () => {
    setFeedback({ type: '', text: '' });
    setFaceModalOpen(true);
  };

  const handleFaceCheckInSuccess = async (faceData) => {
    setFaceModalOpen(false);
    setActionLoading(true);
    setFeedback({ type: '', text: '' });
    try {
      const res = await api.post('/attendance/checkin', {
        faceVerified: true,
        faceImage: faceData?.faceImage || '',
        latitude: faceData?.latitude,
        longitude: faceData?.longitude,
        distance: faceData?.distance,
        notes: 'Photo & Location Verified Check-in',
      });
      if (res.data.success) {
        const isAbsent = res.data.attendance?.status === 'Absent' || res.data.status === 'Absent';
        const isHalfDay = res.data.attendance?.status === 'Half Day' || res.data.status === 'Half Day';
        setFeedback({
          type: isAbsent ? 'danger' : isHalfDay ? 'warning' : 'success',
          text: res.data.message || `Photo & Location verified! Checked in at ${faceData?.officeName || 'authorized office'}.`,
        });
        fetchAttendanceData();
        loadOfficeLocation();
      }
    } catch (err) {
      setFeedback({ type: 'danger', text: err.response?.data?.message || 'Check-in failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setFeedback({ type: '', text: '' });
    try {
      const locCheck = await verifyAttendanceLocation();
      if (!locCheck.success) {
        setFeedback({ type: 'danger', text: locCheck.message });
        return;
      }
      const res = await api.post('/attendance/checkout', {
        latitude: locCheck.latitude,
        longitude: locCheck.longitude,
      });
      if (res.data.success) {
        setFeedback({ type: 'success', text: `Clock-out registered successfully within ${locCheck.officeName}.` });
        fetchAttendanceData();
      }
    } catch (err) {
      setFeedback({ type: 'danger', text: err.response?.data?.message || err.message || 'Check-out failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBreakIn = async () => {
    setActionLoading(true);
    setFeedback({ type: '', text: '' });
    try {
      const locCheck = await verifyAttendanceLocation();
      if (!locCheck.success) {
        setFeedback({ type: 'danger', text: locCheck.message });
        return;
      }
      const res = await api.post('/attendance/break-in', {
        latitude: locCheck.latitude,
        longitude: locCheck.longitude,
      });
      if (res.data.success) {
        setFeedback({ type: 'success', text: `Break In recorded at ${locCheck.officeName}.` });
        fetchAttendanceData();
      }
    } catch (err) {
      setFeedback({ type: 'danger', text: err.response?.data?.message || err.message || 'Break In failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBreakEnd = async () => {
    setActionLoading(true);
    setFeedback({ type: '', text: '' });
    try {
      const locCheck = await verifyAttendanceLocation();
      if (!locCheck.success) {
        setFeedback({ type: 'danger', text: locCheck.message });
        return;
      }
      const res = await api.post('/attendance/break-end', {
        latitude: locCheck.latitude,
        longitude: locCheck.longitude,
      });
      if (res.data.success) {
        setFeedback({ type: 'success', text: `Break End recorded at ${locCheck.officeName}. Welcome back!` });
        fetchAttendanceData();
      }
    } catch (err) {
      setFeedback({ type: 'danger', text: err.response?.data?.message || err.message || 'Break End failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLunchIn = async () => {
    setActionLoading(true);
    setFeedback({ type: '', text: '' });
    try {
      const locCheck = await verifyAttendanceLocation();
      if (!locCheck.success) {
        setFeedback({ type: 'danger', text: locCheck.message });
        return;
      }
      const res = await api.post('/attendance/lunch-in', {
        latitude: locCheck.latitude,
        longitude: locCheck.longitude,
      });
      if (res.data.success) {
        setFeedback({ type: 'success', text: `Lunch In recorded at ${locCheck.officeName}. Enjoy your meal!` });
        fetchAttendanceData();
      }
    } catch (err) {
      setFeedback({ type: 'danger', text: err.response?.data?.message || err.message || 'Lunch In failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLunchEnd = async () => {
    setActionLoading(true);
    setFeedback({ type: '', text: '' });
    try {
      const locCheck = await verifyAttendanceLocation();
      if (!locCheck.success) {
        setFeedback({ type: 'danger', text: locCheck.message });
        return;
      }
      const res = await api.post('/attendance/lunch-end', {
        latitude: locCheck.latitude,
        longitude: locCheck.longitude,
      });
      if (res.data.success) {
        setFeedback({ type: 'success', text: `Lunch End recorded at ${locCheck.officeName}. Welcome back!` });
        fetchAttendanceData();
      }
    } catch (err) {
      setFeedback({ type: 'danger', text: err.response?.data?.message || err.message || 'Lunch End failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const hasCheckedIn = !!todayAttendance?.checkIn;
  const hasCheckedOut = !!todayAttendance?.checkOut;
  const isOnBreak = !!todayAttendance?.isOnBreak;
  const isOnLunch = !!todayAttendance?.isOnLunch;

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (selectedMonth === 'all') return;
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const newMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonthStr);
  };

  const handleNextMonth = () => {
    if (selectedMonth === 'all') return;
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(year, month, 1);
    const newMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonthStr);
  };

  const formatMonthTitle = (monthStr) => {
    if (!monthStr || monthStr === 'all') return 'All Time History';
    const [y, m] = monthStr.split('-').map(Number);
    const date = new Date(y, m - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Generate calendar days for calendar view
  const renderCalendarDays = () => {
    if (selectedMonth === 'all') return null;
    const [year, month] = selectedMonth.split('-').map(Number);
    const totalDays = new Date(year, month, 0).getDate();
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0 = Sunday, 6 = Saturday
    const recordsMap = new Map();
    history.forEach((r) => recordsMap.set(r.date, r));

    const days = [];
    const todayStr = new Date().toISOString().substring(0, 10);

    // Padding cells before the 1st of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({
        id: `pad-${i}`,
        isPadding: true,
      });
    }

    for (let day = 1; day <= totalDays; day++) {
      const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dateObj = new Date(year, month - 1, day);
      const dayOfWeek = dateObj.getDay(); // 0 is Sunday, 6 is Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const record = recordsMap.get(dayStr);
      const isToday = dayStr === todayStr;
      const isFuture = dayStr > todayStr;

      days.push({
        id: `day-${day}`,
        dayNumber: day,
        dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
        dateStr: dayStr,
        isWeekend,
        isToday,
        isFuture,
        record,
      });
    }

    return days;
  };

  const calendarDays = renderCalendarDays();

  return (
    <div>
      {/* Alert Feedback Banner */}
      {feedback.text && (
        <div
          className={`alert alert-${feedback.type}`}
          style={{
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span style={{ fontSize: '14px', fontWeight: 600 }}>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback({ type: '', text: '' })}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Daily Clock Action Card */}
      <div className="table-card" style={{ padding: '24px 28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 700 }}>
              PUNCH REGISTER • {new Date().toDateString()}
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px' }}>
              {hasCheckedOut
                ? 'Work Day Completed'
                : isOnLunch
                ? 'Currently on Lunch Break 🍽️'
                : isOnBreak
                ? 'Currently on Short Break ☕'
                : hasCheckedIn
                ? 'Currently Clocked In'
                : 'Not Clocked In Today'}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px', fontSize: '13px', color: '#475569' }}>
              <span>
                <strong>In Time:</strong>{' '}
                {hasCheckedIn
                  ? new Date(todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '--:--'}
              </span>
              <span>
                <strong>Out Time:</strong>{' '}
                {hasCheckedOut
                  ? new Date(todayAttendance.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '--:--'}
              </span>
              {isOnBreak && todayAttendance?.breakIn && (
                <span>
                  <strong>Break:</strong> {new Date(todayAttendance.breakIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {isOnLunch && todayAttendance?.lunchIn && (
                <span>
                  <strong>Lunch:</strong> {new Date(todayAttendance.lunchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <span>
                <strong>Hours Logged:</strong> {todayAttendance?.workingHours ? `${todayAttendance.workingHours} hrs` : '--'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            {!hasCheckedIn ? (
              <button
                className="btn btn-success"
                onClick={handleOpenFaceModal}
                disabled={actionLoading}
                style={{ padding: '10px 22px', fontWeight: 600 }}
              >
                <LogIn size={16} /> Check In
              </button>
            ) : !hasCheckedOut ? (
              <>
                {/* Break In / Break End button */}
                {isOnBreak ? (
                  <button
                    className="btn"
                    style={{
                      padding: '10px 18px',
                      fontWeight: 600,
                      background: '#f59e0b',
                      color: '#ffffff',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                    }}
                    onClick={handleBreakEnd}
                    disabled={actionLoading}
                  >
                    <Coffee size={16} /> Break End
                  </button>
                ) : (
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '10px 18px', fontWeight: 600 }}
                    onClick={handleBreakIn}
                    disabled={actionLoading || isOnLunch}
                    title={isOnLunch ? 'Finish lunch before taking a break' : 'Start break'}
                  >
                    <Coffee size={16} /> Break In
                  </button>
                )}

                {/* Lunch In / Lunch End button */}
                {isOnLunch ? (
                  <button
                    className="btn"
                    style={{
                      padding: '10px 18px',
                      fontWeight: 600,
                      background: '#0ea5e9',
                      color: '#ffffff',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
                    }}
                    onClick={handleLunchEnd}
                    disabled={actionLoading}
                  >
                    <Utensils size={16} /> Lunch End
                  </button>
                ) : (
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '10px 18px', fontWeight: 600 }}
                    onClick={handleLunchIn}
                    disabled={actionLoading || isOnBreak}
                    title={isOnBreak ? 'Finish break before taking lunch' : 'Start lunch'}
                  >
                    <Utensils size={16} /> Lunch In
                  </button>
                )}

                {/* Check Out button */}
                <button
                  className="btn btn-danger"
                  onClick={handleCheckOut}
                  disabled={actionLoading}
                  style={{ padding: '10px 22px', fontWeight: 600 }}
                >
                  <LogOut size={16} /> Check Out
                </button>
              </>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
                  background: '#ecfdf5',
                  color: '#059669',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '13px',
                  border: '1px solid #a7f3d0',
                }}
              >
                <CheckCircle2 size={16} />
                <span>Shift Completed</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MONTHLY ATTENDANCE EXPLORER & METRICS */}
      <div className="table-card" style={{ marginBottom: '24px' }}>
        {/* Month Selector Toolbar */}
        <div
          className="table-toolbar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            background: 'linear-gradient(to right, #ffffff, #f8fafc)',
            padding: '18px 24px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#4f46e5" />
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                Monthly Attendance Overview
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
              Monthly timesheets, shifts, and logged working hours
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Previous / Next Month Navigator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#f1f5f9',
                borderRadius: '10px',
                padding: '4px',
                border: '1px solid #e2e8f0',
              }}
            >
              <button
                type="button"
                onClick={handlePrevMonth}
                disabled={selectedMonth === 'all'}
                title="Previous Month"
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '6px 8px',
                  cursor: selectedMonth === 'all' ? 'not-allowed' : 'pointer',
                  color: selectedMonth === 'all' ? '#cbd5e1' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '6px',
                }}
              >
                <ChevronLeft size={16} />
              </button>

              <span style={{ fontSize: '13px', fontWeight: 700, padding: '0 12px', minWidth: '140px', textAlign: 'center', color: '#1e293b' }}>
                {formatMonthTitle(selectedMonth)}
              </span>

              <button
                type="button"
                onClick={handleNextMonth}
                disabled={selectedMonth === 'all'}
                title="Next Month"
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '6px 8px',
                  cursor: selectedMonth === 'all' ? 'not-allowed' : 'pointer',
                  color: selectedMonth === 'all' ? '#cbd5e1' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '6px',
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Quick Month Dropdown Picker */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="form-control"
              style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 600, width: 'auto', minWidth: '160px' }}
            >
              <option value={new Date().toISOString().substring(0, 7)}>Current Month</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthTitle(m)}
                </option>
              ))}
              <option value="all">View All Time</option>
            </select>

            {/* View Mode Switcher (Table vs Calendar) */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '3px' }}>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: viewMode === 'table' ? '#ffffff' : 'transparent',
                  color: viewMode === 'table' ? '#4f46e5' : '#64748b',
                  boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <List size={14} />
                <span>Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                disabled={selectedMonth === 'all'}
                title={selectedMonth === 'all' ? 'Calendar view requires a specific month' : 'Calendar View'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: selectedMonth === 'all' ? 'not-allowed' : 'pointer',
                  background: viewMode === 'calendar' ? '#ffffff' : 'transparent',
                  color: viewMode === 'calendar' ? '#4f46e5' : '#64748b',
                  boxShadow: viewMode === 'calendar' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  opacity: selectedMonth === 'all' ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                <LayoutGrid size={14} />
                <span>Month Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* Monthly Key Metrics Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            padding: '20px 24px',
            background: '#ffffff',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          {/* Present Days */}
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: '#047857' }}>
                Present Days
              </span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#065f46', marginTop: '2px' }}>
                {stats?.totalPresent ?? 0} <span style={{ fontSize: '13px', fontWeight: 600 }}>Days</span>
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={22} />
            </div>
          </div>

          {/* Half Days */}
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: '#fffbeb',
              border: '1px solid #fde68a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: '#b45309' }}>
                Half Days
              </span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#92400e', marginTop: '2px' }}>
                {stats?.totalHalfDay ?? 0} <span style={{ fontSize: '13px', fontWeight: 600 }}>Days</span>
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={22} />
            </div>
          </div>

          {/* Hours Logged */}
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: '#eef2ff',
              border: '1px solid #c7d2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: '#4338ca' }}>
                Total Hours Worked
              </span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#3730a3', marginTop: '2px' }}>
                {stats?.totalHours ?? 0} <span style={{ fontSize: '13px', fontWeight: 600 }}>Hrs</span>
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={22} />
            </div>
          </div>

          {/* Daily Average */}
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: '#64748b' }}>
                Avg Daily Hours
              </span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>
                {stats?.totalPresent || stats?.totalHalfDay
                  ? (+((stats?.totalHours || 0) / ((stats?.totalPresent || 0) + (stats?.totalHalfDay || 0))).toFixed(1))
                  : 0}{' '}
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Hrs / Shift</span>
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={20} />
            </div>
          </div>
        </div>

        {/* VIEW 1: TABLE VIEW */}
        {viewMode === 'table' ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Break Details</th>
                  <th>Check Out</th>
                  <th>Working Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                      <div className="spinner" style={{ margin: '0 auto' }}></div>
                    </td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                      No attendance logs recorded for {formatMonthTitle(selectedMonth)}.
                    </td>
                  </tr>
                ) : (
                  history.map((rec) => (
                    <tr key={rec._id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{rec.date}</div>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {new Date(rec.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                      </td>
                      <td>
                        {rec.checkIn ? (
                          <span style={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <LogIn size={14} />
                            {new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          '--'
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {rec.breakIn ? (
                            <span style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Coffee size={12} /> Break:{' '}
                              {new Date(rec.breakIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          ) : null}
                          {rec.lunchIn ? (
                            <span style={{ color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Utensils size={12} /> Lunch:{' '}
                              {new Date(rec.lunchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          ) : null}
                          {!rec.breakIn && !rec.lunchIn && <span style={{ color: '#94a3b8' }}>No breaks logged</span>}
                        </div>
                      </td>
                      <td>
                        {rec.checkOut ? (
                          <span style={{ color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <LogOut size={14} />
                            {new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          <span style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 600 }}>Shift in progress</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 700, color: '#334155' }}>
                        {rec.workingHours ? `${rec.workingHours} hrs` : '--'}
                      </td>
                      <td>
                        <span className={`badge badge-${rec.status.toLowerCase().replace(/\s+/g, '')}`}>
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* VIEW 2: MONTHLY CALENDAR GRID */
          <div style={{ padding: '24px', overflowX: 'auto' }}>
            <div style={{ minWidth: '640px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '10px',
                  marginBottom: '12px',
                }}
              >
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div
                    key={d}
                    style={{
                      textAlign: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#64748b',
                      padding: '8px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '10px',
                }}
              >
                {calendarDays?.map((d) => {
                  if (d.isPadding) {
                    return (
                      <div
                        key={d.id}
                        style={{
                          background: '#f8fafc',
                          border: '1px dashed #e2e8f0',
                          borderRadius: '10px',
                          minHeight: '85px',
                          opacity: 0.35,
                        }}
                      />
                    );
                  }

                  const rec = d.record;
                  let bg = '#ffffff';
                  let border = '#e2e8f0';
                  let statusLabel = 'Off';
                  let statusColor = '#94a3b8';

                  if (rec) {
                    if (rec.status === 'Present') {
                      bg = '#f0fdf4';
                      border = '#86efac';
                      statusLabel = 'Present';
                      statusColor = '#16a34a';
                    } else if (rec.status === 'Half Day') {
                      bg = '#fffbeb';
                      border = '#fde68a';
                      statusLabel = 'Half Day';
                      statusColor = '#d97706';
                    }
                  } else if (d.isWeekend) {
                    bg = '#f8fafc';
                    border = '#e2e8f0';
                    statusLabel = 'Weekend';
                    statusColor = '#94a3b8';
                  } else if (d.isFuture) {
                    bg = '#ffffff';
                    border = '#f1f5f9';
                    statusLabel = 'Upcoming';
                    statusColor = '#cbd5e1';
                  } else {
                    bg = '#fff1f2';
                    border = '#fecdd3';
                    statusLabel = 'Absent / Off';
                    statusColor = '#e11d48';
                  }

                  return (
                    <div
                      key={d.id || d.dayNumber}
                      style={{
                        background: bg,
                        border: `1px solid ${border}`,
                        borderRadius: '10px',
                        padding: '10px 8px',
                        minHeight: '85px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        boxShadow: d.isToday ? '0 0 0 2px #4f46e5' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: d.isToday ? 800 : 700,
                            color: d.isToday ? '#4f46e5' : '#1e293b',
                          }}
                        >
                          {d.dayNumber}
                        </span>
                        {d.isToday && (
                          <span
                            style={{
                              fontSize: '9px',
                              background: '#4f46e5',
                              color: '#ffffff',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              fontWeight: 700,
                            }}
                          >
                            Today
                          </span>
                        )}
                      </div>

                      <div style={{ marginTop: '4px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: statusColor }}>
                          {statusLabel}
                        </div>
                        {rec?.workingHours ? (
                          <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600, marginTop: '2px' }}>
                            ⏱️ {rec.workingHours} hrs
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
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

export default Attendance;
