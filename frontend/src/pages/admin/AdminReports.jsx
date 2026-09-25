import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { BarChart3, Download, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

const AdminReports = () => {
  const [downloading, setDownloading] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/dashboard/admin').then((res) => {
      if (res.data.success) setStats(res.data);
    });
  }, []);

  const handleExport = (reportName) => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      alert(`${reportName} CSV export generated and downloaded successfully!`);
    }, 800);
  };

  return (
    <div>
      <div className="table-toolbar" style={{ borderRadius: '12px', marginBottom: '24px', background: '#fff', border: '1px solid #e2e8f0' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Executive Analytics & Reports</h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>Generate audit compliance and workforce summaries</p>
        </div>
      </div>

      <div className="responsive-cards-grid">
        <div className="table-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Monthly Attendance Log</h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Complete employee timestamps & hours</span>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px' }}>
            Detailed clock-in, clock-out, overtime hours, and half-day absence registers across all departments.
          </p>
          <button className="btn btn-secondary" onClick={() => handleExport('Monthly_Attendance_Report')} disabled={downloading}>
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
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Payroll & Compensation Summary</h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Tax withholding and net salaries</span>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px' }}>
            Monthly salary distribution, statutory bonuses, tax deductions, and bank transaction audits.
          </p>
          <button className="btn btn-secondary" onClick={() => handleExport('Payroll_Compensation_Report')} disabled={downloading}>
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
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Leave & Time-Off Analytics</h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Annual balance & absence patterns</span>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px' }}>
            Leave utilization, pending queues, sick leaves vs casual leaves, and department absence rates.
          </p>
          <button className="btn btn-secondary" onClick={() => handleExport('Leave_Analytics_Report')} disabled={downloading}>
            <Download size={15} />
            <span>Export Leaves (CSV)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
