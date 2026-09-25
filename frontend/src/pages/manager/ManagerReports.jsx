import React, { useState } from 'react';
import { Download, FileSpreadsheet, BarChart } from 'lucide-react';

const ManagerReports = () => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = (name) => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      alert(`${name} CSV generated and ready for inspection.`);
    }, 700);
  };

  return (
    <div>
      <div className="table-toolbar" style={{ borderRadius: '12px', marginBottom: '24px', background: '#fff', border: '1px solid #e2e8f0' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Team Analytics & Export</h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>Download reports for your direct engineering reports</p>
        </div>
      </div>

      <div className="responsive-cards-grid">
        <div className="table-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Team Attendance Roll</h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Punch-in timings & daily coverage</span>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={() => handleDownload('Team_Attendance')} disabled={downloading}>
            <Download size={14} /> Export Team Attendance
          </button>
        </div>

        <div className="table-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Task Completion Velocity</h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Sprint task closure metrics</span>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={() => handleDownload('Task_Completion_Report')} disabled={downloading}>
            <Download size={14} /> Export Task Velocity
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManagerReports;
