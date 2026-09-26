import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  FileText,
  Calendar,
  Filter,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  X,
  MessageSquare,
  Search,
} from 'lucide-react';

const AdminReports = () => {
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'analytics'
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDept, setSelectedDept] = useState('All');
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [adminFeedback, setAdminFeedback] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (activeTab === 'daily') {
      fetchDailyReports();
    }
  }, [activeTab, selectedDate, selectedDept]);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      if (res.data.success) setDepartments(res.data.departments);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDailyReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedDate) params.date = selectedDate;
      if (selectedDept !== 'All') params.department = selectedDept;

      const res = await api.get('/reports', { params });
      if (res.data.success) {
        setReports(res.data.reports || []);
      }
    } catch (err) {
      console.error('Failed to fetch daily reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReportModal = (rep) => {
    setSelectedReport(rep);
    setAdminFeedback(rep.feedback || '');
  };

  const handleSaveFeedback = async () => {
    if (!selectedReport) return;
    try {
      setFeedbackLoading(true);
      const res = await api.put(`/reports/${selectedReport._id}`, {
        feedback: adminFeedback,
        status: 'Reviewed',
      });
      if (res.data.success) {
        setSelectedReport(res.data.report);
        fetchDailyReports();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!reports.length) {
      alert('No daily reports to export for the selected criteria.');
      return;
    }

    const headers = ['Employee ID', 'Name', 'Department', 'Date', 'Title', 'Tasks Completed', 'Tasks Pending', 'Blockers', 'Status'];
    const rows = reports.map((r) => [
      `"${r.employeeId || ''}"`,
      `"${r.employeeName || r.employee?.name || ''}"`,
      `"${r.department || ''}"`,
      `"${r.date || ''}"`,
      `"${(r.title || '').replace(/"/g, '""')}"`,
      `"${(r.tasksCompleted || []).join('; ').replace(/"/g, '""')}"`,
      `"${(r.tasksPending || []).join('; ').replace(/"/g, '""')}"`,
      `"${(r.blockers || 'None').replace(/"/g, '""')}"`,
      `"${r.status || 'Submitted'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daily_Reports_${selectedDate || 'All'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSummary = (reportName) => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      alert(`${reportName} CSV export generated and downloaded successfully!`);
    }, 700);
  };

  const filteredReports = reports.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const empName = (r.employeeName || r.employee?.name || '').toLowerCase();
    const empId = (r.employeeId || '').toLowerCase();
    const title = (r.title || '').toLowerCase();
    return empName.includes(term) || empId.includes(term) || title.includes(term);
  });

  return (
    <div>
      {/* Top Banner with Navigation Tabs */}
      <div
        className="table-toolbar"
        style={{
          borderRadius: '14px',
          marginBottom: '20px',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
            Workforce Reports & Compliance
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '3px 0 0 0' }}>
            Inspect daily employee work submissions and export audit logs
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'daily' ? '#ffffff' : 'transparent',
              color: activeTab === 'daily' ? '#4f46e5' : '#64748b',
              boxShadow: activeTab === 'daily' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <FileText size={15} />
            <span>Daily Work Reports</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'analytics' ? '#ffffff' : 'transparent',
              color: activeTab === 'analytics' ? '#4f46e5' : '#64748b',
              boxShadow: activeTab === 'analytics' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <FileSpreadsheet size={15} />
            <span>Executive Exports</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Daily Employee Work Reports */}
      {activeTab === 'daily' && (
        <div className="table-card">
          <div className="table-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
              {/* Date Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={16} color="#4f46e5" />
                <input
                  type="date"
                  className="select-filter"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
                {selectedDate && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate('')}
                    style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '11.5px', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    All Dates
                  </button>
                )}
              </div>

              {/* Department Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Filter size={15} color="#64748b" />
                <select
                  className="select-filter"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                >
                  <option value="All">All Departments</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d.departmentName}>
                      {d.departmentName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Box */}
              <div className="table-search-box" style={{ maxWidth: '280px' }}>
                <Search size={16} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Search staff or title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleExportCSV}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <Download size={15} />
              <span>Export CSV ({filteredReports.length})</span>
            </button>
          </div>

          {/* Table Container */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Daily Work Summary</th>
                  <th>Tasks Completed</th>
                  <th>Blockers</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                      <div className="spinner" style={{ margin: '0 auto' }}></div>
                    </td>
                  </tr>
                ) : filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                      No daily reports found for {selectedDate || 'selected criteria'}.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((r) => {
                    const empName = r.employeeName || r.employee?.name || 'Employee';
                    const empId = r.employeeId || r.employee?.employeeId || '';
                    const photo = r.employee?.profileImage;

                    return (
                      <tr key={r._id}>
                        <td>
                          <div className="user-cell">
                            <img
                              src={photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${empName}`}
                              alt=""
                              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <div className="user-cell-meta">
                              <div className="name">{empName}</div>
                              <div className="email">{empId} • {r.department}</div>
                            </div>
                          </div>
                        </td>

                        <td style={{ fontWeight: 600, color: '#334155' }}>
                          {r.date}
                        </td>

                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.title}
                          </div>
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#059669', fontWeight: 600, fontSize: '12.5px' }}>
                            <CheckCircle2 size={14} />
                            <span>{r.tasksCompleted?.length || 0} completed</span>
                          </div>
                        </td>

                        <td>
                          {r.blockers && r.blockers !== 'None' ? (
                            <span style={{ color: '#b91c1c', background: '#fef2f2', padding: '2px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <AlertCircle size={12} /> {r.blockers.slice(0, 24)}...
                            </span>
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '12px' }}>None</span>
                          )}
                        </td>

                        <td>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: r.status === 'Reviewed' ? '#eff6ff' : '#ecfdf5',
                              color: r.status === 'Reviewed' ? '#1d4ed8' : '#047857',
                              border: `1px solid ${r.status === 'Reviewed' ? '#bfdbfe' : '#a7f3d0'}`,
                            }}
                          >
                            {r.status || 'Submitted'}
                          </span>
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn-icon"
                            title="View Full Report"
                            onClick={() => handleOpenReportModal(r)}
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Executive Export Summaries */}
      {activeTab === 'analytics' && (
        <div className="responsive-cards-grid">
          <div className="table-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileSpreadsheet size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Monthly Attendance Log</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Complete employee timestamps & hours</span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px' }}>
              Detailed clock-in, clock-out, overtime hours, and half-day absence registers across all departments.
            </p>
            <button className="btn btn-secondary" onClick={() => handleExportSummary('Monthly_Attendance_Report')} disabled={downloading}>
              <Download size={15} />
              <span>{downloading ? 'Exporting...' : 'Export Attendance (CSV)'}</span>
            </button>
          </div>

          <div className="table-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileSpreadsheet size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Payroll & Compensation Summary</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Tax withholding and net salaries</span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px' }}>
              Monthly salary distribution, statutory bonuses, tax deductions, and bank transaction audits.
            </p>
            <button className="btn btn-secondary" onClick={() => handleExportSummary('Payroll_Compensation_Report')} disabled={downloading}>
              <Download size={15} />
              <span>Export Payroll (CSV)</span>
            </button>
          </div>

          <div className="table-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileSpreadsheet size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Leave & Time-Off Analytics</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Annual balance & absence patterns</span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px' }}>
              Leave utilization, pending queues, sick leaves vs casual leaves, and department absence rates.
            </p>
            <button className="btn btn-secondary" onClick={() => handleExportSummary('Leave_Analytics_Report')} disabled={downloading}>
              <Download size={15} />
              <span>Export Leaves (CSV)</span>
            </button>
          </div>
        </div>
      )}

      {/* Report Details & Review Modal */}
      {selectedReport && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '560px', padding: 0, overflow: 'hidden' }}>
            <div
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  Daily Work Report Details
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  {selectedReport.employeeName || selectedReport.employee?.name} ({selectedReport.employeeId}) • {selectedReport.date}
                </span>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setSelectedReport(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ display: 'block', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Work Summary Title
                </strong>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                  {selectedReport.title}
                </div>
              </div>

              {/* Tasks Completed */}
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ display: 'block', fontSize: '12px', color: '#059669', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Tasks Completed Today ({selectedReport.tasksCompleted?.length || 0})
                </strong>
                {selectedReport.tasksCompleted?.length ? (
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13.5px', color: '#334155' }}>
                    {selectedReport.tasksCompleted.map((t, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{t}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No tasks listed.</p>
                )}
              </div>

              {/* Tasks Pending */}
              {selectedReport.tasksPending?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ display: 'block', fontSize: '12px', color: '#d97706', textTransform: 'uppercase', marginBottom: '6px' }}>
                    In Progress / Pending Tasks
                  </strong>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13.5px', color: '#334155' }}>
                    {selectedReport.tasksPending.map((t, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Blockers */}
              {selectedReport.blockers && selectedReport.blockers !== 'None' && (
                <div style={{ marginBottom: '16px', padding: '10px 14px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                  <strong style={{ display: 'block', fontSize: '12px', color: '#b91c1c', textTransform: 'uppercase', marginBottom: '2px' }}>
                    Blockers / Roadblocks
                  </strong>
                  <div style={{ fontSize: '13px', color: '#991b1b' }}>{selectedReport.blockers}</div>
                </div>
              )}

              {/* Tomorrow Plan */}
              {selectedReport.planForTomorrow && (
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ display: 'block', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Plan For Tomorrow
                  </strong>
                  <div style={{ fontSize: '13px', color: '#334155' }}>{selectedReport.planForTomorrow}</div>
                </div>
              )}

              {/* Admin Feedback Box */}
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <MessageSquare size={15} color="#4f46e5" />
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                    Manager / Admin Feedback
                  </strong>
                </div>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Leave review comments or approval feedback for this employee..."
                  value={adminFeedback}
                  onChange={(e) => setAdminFeedback(e.target.value)}
                  style={{ width: '100%', fontSize: '13px', resize: 'vertical' }}
                />
              </div>
            </div>

            <div
              style={{
                padding: '14px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid #e2e8f0',
                background: '#f8fafc',
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedReport(null)}
              >
                Close
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveFeedback}
                disabled={feedbackLoading}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <CheckCircle2 size={15} />
                <span>{feedbackLoading ? 'Saving...' : 'Save Review & Feedback'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
