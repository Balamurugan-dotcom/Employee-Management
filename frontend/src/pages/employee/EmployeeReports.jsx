import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Trash2,
  Edit3,
  X,
  ListOrdered,
  Sparkles,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Send,
  RefreshCw,
} from 'lucide-react';

const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const EmployeeReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().substring(0, 7)
  );

  // Today state
  const [todayReport, setTodayReport] = useState(null);
  const [todayDateStr, setTodayDateStr] = useState(getTodayStr());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Form State
  const [formData, setFormData] = useState({
    id: null,
    date: getTodayStr(),
    title: '',
    tasksCompleted: '',
    tasksPending: '',
    hoursWorked: 8,
    blockers: 'None',
    planForTomorrow: '',
    additionalNotes: '',
    status: 'Submitted',
  });

  // Re-sync today's date if day transitions
  useEffect(() => {
    setTodayDateStr(getTodayStr());
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/my-reports', {
        params: { month: selectedMonth !== 'all' ? selectedMonth : undefined },
      });
      if (res.data.success) {
        setReports(res.data.reports || []);
        setTodayReport(res.data.todayReport || null);
        if (res.data.todayStr) {
          setTodayDateStr(res.data.todayStr);
        }
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedMonth]);

  const handleOpenCreateModal = (targetDate = null) => {
    const dateToUse = targetDate || getTodayStr();

    // Check if report already exists for that date
    const existing = reports.find((r) => r.date === dateToUse);
    if (existing) {
      handleOpenEditModal(existing);
      return;
    }

    setFormData({
      id: null,
      date: dateToUse,
      title: `Daily Work Progress Report - ${formatDisplayDate(dateToUse)}`,
      tasksCompleted: '',
      tasksPending: '',
      hoursWorked: 8,
      blockers: 'None',
      planForTomorrow: '',
      additionalNotes: '',
      status: 'Submitted',
    });
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (report) => {
    setFormData({
      id: report._id,
      date: report.date,
      title: report.title || '',
      tasksCompleted: Array.isArray(report.tasksCompleted)
        ? report.tasksCompleted.join('\n')
        : report.tasksCompleted || '',
      tasksPending: Array.isArray(report.tasksPending)
        ? report.tasksPending.join('\n')
        : report.tasksPending || '',
      hoursWorked: report.hoursWorked ?? 8,
      blockers: report.blockers || 'None',
      planForTomorrow: report.planForTomorrow || '',
      additionalNotes: report.additionalNotes || '',
      status: report.status || 'Submitted',
    });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', text: '' });

    try {
      const payload = {
        date: formData.date,
        title: formData.title,
        tasksCompleted: formData.tasksCompleted,
        tasksPending: formData.tasksPending,
        hoursWorked: Number(formData.hoursWorked) || 8,
        blockers: formData.blockers,
        planForTomorrow: formData.planForTomorrow,
        additionalNotes: formData.additionalNotes,
        status: formData.status,
      };

      let res;
      if (formData.id) {
        res = await api.put(`/reports/${formData.id}`, payload);
      } else {
        res = await api.post('/reports', payload);
      }

      if (res.data.success) {
        setFeedback({
          type: 'success',
          text: res.data.message || 'Daily report saved successfully!',
        });
        setIsModalOpen(false);
        fetchReports();
      }
    } catch (err) {
      setFeedback({
        type: 'danger',
        text: err.response?.data?.message || err.message || 'Failed to save daily report.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReport = async (id, dateStr) => {
    if (!window.confirm(`Are you sure you want to delete the daily report for ${dateStr}?`)) {
      return;
    }
    try {
      const res = await api.delete(`/reports/${id}`);
      if (res.data.success) {
        setReports((prev) => prev.filter((r) => r._id !== id));
        if (todayReport && todayReport._id === id) {
          setTodayReport(null);
        }
        setFeedback({ type: 'success', text: 'Daily report deleted successfully.' });
      }
    } catch (err) {
      setFeedback({
        type: 'danger',
        text: err.response?.data?.message || 'Failed to delete report.',
      });
    }
  };

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    const q = searchQuery.toLowerCase();
    const titleMatch = r.title?.toLowerCase().includes(q);
    const dateMatch = r.date?.includes(q);
    const tasksMatch =
      Array.isArray(r.tasksCompleted) &&
      r.tasksCompleted.some((t) => t.toLowerCase().includes(q));
    const blockersMatch = r.blockers?.toLowerCase().includes(q);
    return titleMatch || dateMatch || tasksMatch || blockersMatch;
  });

  // Calculate quick summary metrics
  const totalReportsCount = reports.length;
  const totalHoursLogged = reports.reduce((acc, r) => acc + (r.hoursWorked || 0), 0);
  const avgHours = totalReportsCount > 0 ? (totalHoursLogged / totalReportsCount).toFixed(1) : '8.0';
  const totalTasksCompleted = reports.reduce(
    (acc, r) => acc + (Array.isArray(r.tasksCompleted) ? r.tasksCompleted.length : 0),
    0
  );

  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Alert Feedback */}
      {feedback.text && (
        <div
          className={`alert alert-${feedback.type}`}
          style={{
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback({ type: '', text: '' })}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
            Daily Work Reports
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: '4px 0 0 0' }}>
            Document daily accomplishments, project deliverables, and work hours each day
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => handleOpenCreateModal()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '11px 20px',
            fontSize: '14px',
            fontWeight: 700,
            borderRadius: '10px',
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
          }}
        >
          <Plus size={18} />
          <span>New Daily Report</span>
        </button>
      </div>

      {/* Top Overview Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* Today's Submission Status */}
        <div
          className="table-card"
          style={{
            padding: '18px 20px',
            borderLeft: todayReport ? '4px solid #10b981' : '4px solid #f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Today's Report Status
            </span>
            <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px', color: todayReport ? '#059669' : '#d97706' }}>
              {todayReport ? 'Submitted ✅' : 'Pending Submission ⏳'}
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Date: {formatDisplayDate(todayDateStr)}
            </span>
          </div>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: todayReport ? '#ecfdf5' : '#fef3c7',
              color: todayReport ? '#10b981' : '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Calendar size={20} />
          </div>
        </div>

        {/* Total Reports Logged */}
        <div
          className="table-card"
          style={{
            padding: '18px 20px',
            borderLeft: '4px solid #4f46e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Total Reports Filed
            </span>
            <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px', color: '#1e1b4b' }}>
              {totalReportsCount} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>days</span>
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Selected period entries</span>
          </div>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#eef2ff',
              color: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileText size={20} />
          </div>
        </div>

        {/* Consistency / On-Track Card */}
        <div
          className="table-card"
          style={{
            padding: '18px 20px',
            borderLeft: '4px solid #0ea5e9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Reporting Status
            </span>
            <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: '#0369a1' }}>
              {todayReport ? '100% Up to Date' : 'Pending Today'}
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Daily submission track</span>
          </div>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#f0f9ff',
              color: '#0ea5e9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TrendingUp size={20} />
          </div>
        </div>

        {/* Tasks Delivered */}
        <div
          className="table-card"
          style={{
            padding: '18px 20px',
            borderLeft: '4px solid #8b5cf6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Tasks Completed
            </span>
            <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px', color: '#6d28d9' }}>
              {totalTasksCompleted}
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Reported deliverables</span>
          </div>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#f5f3ff',
              color: '#8b5cf6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Spotlight: Today's Action Card */}
      <div
        className="table-card"
        style={{
          padding: '22px 26px',
          marginBottom: '24px',
          background: todayReport
            ? 'linear-gradient(135deg, #064e3b, #047857)'
            : 'linear-gradient(135deg, #1e1b4b, #312e81)',
          color: '#ffffff',
          borderRadius: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '3px 10px',
                borderRadius: '20px',
              }}
            >
              TODAY'S DAILY LOG • {formatDisplayDate(todayDateStr)}
            </span>
            {todayReport && (
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  background: '#10b981',
                  color: '#fff',
                  padding: '3px 10px',
                  borderRadius: '20px',
                }}
              >
                ✓ Logged
              </span>
            )}
          </div>

          <h3 style={{ fontSize: '19px', fontWeight: 800, margin: '6px 0 4px 0' }}>
            {todayReport
              ? todayReport.title
              : "Ready to file today's work deliverables?"}
          </h3>

          <p style={{ fontSize: '13px', color: '#c7d2fe', margin: 0 }}>
            {todayReport
              ? `${
                  Array.isArray(todayReport.tasksCompleted) ? todayReport.tasksCompleted.length : 0
                } deliverables reported today • Status: ${todayReport.status || 'Submitted'}`
              : 'Log what you accomplished, blockers faced, and priorities for the next shift.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {todayReport ? (
            <button
              className="btn"
              onClick={() => handleOpenEditModal(todayReport)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '9px 18px',
                fontSize: '13.5px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '8px',
              }}
            >
              <Edit3 size={15} />
              <span>Edit Today's Report</span>
            </button>
          ) : (
            <button
              className="btn btn-success"
              onClick={() => handleOpenCreateModal(todayDateStr)}
              style={{
                padding: '10px 22px',
                fontSize: '14px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
              }}
            >
              <Plus size={16} />
              <span>Submit Today's Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="table-card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <Search
              size={16}
              color="#94a3b8"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              className="form-control"
              placeholder="Search reports or tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px', fontSize: '13px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={15} color="#64748b" />
            <input
              type="month"
              className="form-control"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ fontSize: '13px', padding: '6px 12px' }}
            />
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchReports}
            disabled={loading}
            title="Refresh reports"
            style={{ padding: '7px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Daily Reports Feed / List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
          <span>Loading your daily reports...</span>
        </div>
      ) : filteredReports.length === 0 ? (
        <div
          className="table-card"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            color: '#64748b',
          }}
        >
          <FileText size={48} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#334155', margin: '0 0 6px 0' }}>
            No Daily Reports Found
          </h3>
          <p style={{ fontSize: '13px', maxWidth: '420px', margin: '0 auto 18px' }}>
            {searchQuery
              ? 'No reports matched your search query. Try clearing the filter.'
              : 'You have not submitted any daily reports for this period yet.'}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleOpenCreateModal()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13.5px' }}
          >
            <Plus size={16} />
            <span>Create First Report</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredReports.map((report) => {
            const isToday = report.date === todayDateStr;
            const completedList = Array.isArray(report.tasksCompleted) ? report.tasksCompleted : [];
            const pendingList = Array.isArray(report.tasksPending) ? report.tasksPending : [];

            return (
              <div
                key={report._id}
                className="table-card"
                style={{
                  padding: '22px 24px',
                  borderLeft: isToday ? '4px solid #10b981' : '4px solid #4f46e5',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Header row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '14px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          padding: '2px 10px',
                          borderRadius: '12px',
                          background: isToday ? '#ecfdf5' : '#f1f5f9',
                          color: isToday ? '#059669' : '#475569',
                          border: isToday ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                        }}
                      >
                        📅 {formatDisplayDate(report.date)}
                        {isToday ? ' (Today)' : ''}
                      </span>

                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: '#e0e7ff',
                          color: '#4338ca',
                        }}
                      >
                        📋 {completedList.length} deliverables
                      </span>

                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: '#ecfdf5',
                          color: '#047857',
                        }}
                      >
                        ✓ {report.status || 'Submitted'}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '8px 0 0 0', color: '#0f172a' }}>
                      {report.title}
                    </h3>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleOpenEditModal(report)}
                      style={{ padding: '6px 12px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => handleDeleteReport(report._id, report.date)}
                      style={{
                        padding: '6px 10px',
                        fontSize: '12.5px',
                        background: '#fef2f2',
                        color: '#ef4444',
                        border: '1px solid #fee2e2',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                      title="Delete report"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Report Content Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '16px',
                    background: '#f8fafc',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid #f1f5f9',
                  }}
                >
                  {/* Tasks Completed */}
                  <div>
                    <h4
                      style={{
                        fontSize: '12.5px',
                        fontWeight: 700,
                        color: '#059669',
                        textTransform: 'uppercase',
                        margin: '0 0 8px 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <CheckCircle2 size={14} />
                      Accomplished Deliverables ({completedList.length})
                    </h4>
                    {completedList.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#334155' }}>
                        {completedList.map((task, idx) => (
                          <li key={idx} style={{ marginBottom: '4px' }}>
                            {task}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span style={{ fontSize: '12.5px', color: '#94a3b8', fontStyle: 'italic' }}>
                        No specific deliverables listed
                      </span>
                    )}
                  </div>

                  {/* Tomorrow's Plan & Pending */}
                  <div>
                    <h4
                      style={{
                        fontSize: '12.5px',
                        fontWeight: 700,
                        color: '#4338ca',
                        textTransform: 'uppercase',
                        margin: '0 0 8px 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <TrendingUp size={14} />
                      Next Shift Priorities
                    </h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: 1.4 }}>
                      {report.planForTomorrow || 'Standard continuation of sprint deliverables.'}
                    </p>

                    {pendingList.length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b' }}>
                          In-progress:
                        </span>
                        <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px', fontSize: '12.5px', color: '#475569' }}>
                          {pendingList.map((task, idx) => (
                            <li key={idx}>{task}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Blockers / Notes */}
                  <div>
                    <h4
                      style={{
                        fontSize: '12.5px',
                        fontWeight: 700,
                        color: report.blockers && report.blockers !== 'None' ? '#dc2626' : '#64748b',
                        textTransform: 'uppercase',
                        margin: '0 0 8px 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <AlertTriangle size={14} />
                      Blockers & Challenges
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '13px',
                        color: report.blockers && report.blockers !== 'None' ? '#b91c1c' : '#64748b',
                        fontWeight: report.blockers && report.blockers !== 'None' ? 600 : 400,
                      }}
                    >
                      {report.blockers || 'None'}
                    </p>

                    {report.additionalNotes && (
                      <div style={{ marginTop: '8px' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b' }}>Notes:</span>
                        <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#475569' }}>
                          {report.additionalNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create or Edit Daily Report Entity */}
      {isModalOpen && (
        <div
          className="modal-overlay"
          style={{
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)',
          }}
        >
          <div
            className="modal-content"
            style={{
              maxWidth: '640px',
              width: '95%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              background: '#ffffff',
              borderRadius: '16px',
              overflow: 'hidden',
              padding: 0,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            }}
          >
            {/* Modal Header (Sticky Top) */}
            <div
              style={{
                padding: '18px 24px',
                background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#4f46e5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FileText size={18} color="#fff" />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>
                    {modalMode === 'edit' ? 'Edit Daily Work Report' : 'New Daily Report Entity'}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#c7d2fe' }}>
                    {modalMode === 'edit'
                      ? `Modifying entry for ${formatDisplayDate(formData.date)}`
                      : `Log deliverables for ${formatDisplayDate(formData.date)}`}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form with Scrollable Body */}
            <form
              onSubmit={handleSubmitReport}
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                overflowY: 'auto',
                minHeight: 0,
              }}
            >
              <div style={{ padding: '24px', flex: 1 }}>
                <div className="form-grid">
                  {/* Date selection (defaults to today and updates each day) */}
                  <div className="form-group col-span-2">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} color="#4f46e5" />
                      <span>Report Date (Auto-updates daily)</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          date: e.target.value,
                          title: formData.title.includes('Daily Work Progress Report')
                            ? `Daily Work Progress Report - ${formatDisplayDate(e.target.value)}`
                            : formData.title,
                        })
                      }
                      required
                    />
                    <span style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                      Defaults to today's active calendar date
                    </span>
                  </div>

                  {/* Title / Summary */}
                  <div className="form-group col-span-2">
                    <label>Work Summary / Report Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Daily Progress Report - Sprint deliverables & testing"
                      required
                    />
                  </div>

                  {/* Tasks Completed (Line by line) */}
                  <div className="form-group col-span-2">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={14} color="#10b981" />
                      <span>Accomplished Deliverables (One per line)</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={formData.tasksCompleted}
                      onChange={(e) => setFormData({ ...formData, tasksCompleted: e.target.value })}
                      placeholder="Completed user authentication module&#10;Tested facial recognition with device webcam&#10;Fixed workplace geofence radius calculation"
                      required
                    />
                  </div>

                  {/* Tasks Pending / In-progress */}
                  <div className="form-group col-span-2">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <TrendingUp size={14} color="#3b82f6" />
                      <span>In-Progress / Ongoing Deliverables (Optional)</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={formData.tasksPending}
                      onChange={(e) => setFormData({ ...formData, tasksPending: e.target.value })}
                      placeholder="Writing automated integration tests for check-in API"
                    />
                  </div>

                  {/* Blockers */}
                  <div className="form-group col-span-2">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={14} color="#f59e0b" />
                      <span>Blockers / Challenges</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.blockers}
                      onChange={(e) => setFormData({ ...formData, blockers: e.target.value })}
                      placeholder="None (or state any blocker)"
                    />
                  </div>

                  {/* Plan for Tomorrow */}
                  <div className="form-group col-span-2">
                    <label>Plan for Next Shift / Tomorrow</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.planForTomorrow}
                      onChange={(e) => setFormData({ ...formData, planForTomorrow: e.target.value })}
                      placeholder="e.g. Conduct QA verification on staging server"
                    />
                  </div>
                </div>
              </div>

              {/* Fixed / Sticky Modal Action Footer with Submit Button */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  padding: '16px 24px',
                  background: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  flexShrink: 0,
                  boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.03)',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  style={{ padding: '9px 18px', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 24px',
                    fontWeight: 700,
                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
                  }}
                >
                  <Send size={15} />
                  <span>{saving ? 'Saving...' : 'Save & Submit Report'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeReports;
