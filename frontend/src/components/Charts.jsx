import React from 'react';

// Monthly Attendance Bar Chart
export const MonthlyAttendanceChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>No attendance data available</div>;
  }

  const maxVal = Math.max(...data.map((d) => (d.present || 0) + (d.absent || 0)), 25);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginBottom: '16px', fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#4f46e5' }}></span>
          <span>Present Days</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f87171' }}></span>
          <span>Absent Days</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '24px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
        {data.map((item, idx) => {
          const presentH = Math.min(180, (item.present / maxVal) * 180);
          const absentH = Math.min(180, (item.absent / maxVal) * 180);

          return (
            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', width: '100%', justifyContent: 'center' }}>
                <div
                  title={`Present: ${item.present}`}
                  style={{
                    width: '40%',
                    height: `${Math.max(12, presentH)}px`,
                    background: 'linear-gradient(180deg, #6366f1, #4f46e5)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.5s ease',
                  }}
                ></div>
                <div
                  title={`Absent: ${item.absent}`}
                  style={{
                    width: '40%',
                    height: `${Math.max(6, absentH)}px`,
                    background: '#f87171',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.5s ease',
                  }}
                ></div>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', fontWeight: 600 }}>{item.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Department Distribution Progress Bar Chart
export const DepartmentDistributionChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>No department data</div>;
  }

  const total = data.reduce((sum, d) => sum + (d.count || 0), 0) || 1;
  const colors = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {data.map((dept, idx) => {
        const pct = Math.round(((dept.count || 0) / total) * 100);
        const color = colors[idx % colors.length];

        return (
          <div key={idx}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px', fontWeight: 500 }}>
              <span style={{ color: '#1e293b' }}>{dept.department}</span>
              <span style={{ color: '#64748b', fontWeight: 600 }}>
                {dept.count} members ({pct}%)
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: color,
                  borderRadius: '4px',
                  transition: 'width 0.6s ease',
                }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Leave Statistics Card Breakdown
export const LeaveStatsChart = ({ data = [] }) => {
  const getStatusCount = (status) => {
    const item = data.find((d) => d.status?.toLowerCase() === status.toLowerCase());
    return item ? item.count : 0;
  };

  const approved = getStatusCount('Approved');
  const pending = getStatusCount('Pending');
  const rejected = getStatusCount('Rejected');
  const total = approved + pending + rejected || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <div className="leave-stat-pill approved" style={{ background: '#ecfdf5', padding: '14px', borderRadius: '10px', textAlign: 'center', border: '1px solid #a7f3d0' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#059669' }}>{approved}</div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#047857' }}>Approved</div>
        </div>

        <div className="leave-stat-pill pending" style={{ background: '#fffbeb', padding: '14px', borderRadius: '10px', textAlign: 'center', border: '1px solid #fde68a' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#d97706' }}>{pending}</div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#b45309' }}>Pending</div>
        </div>

        <div className="leave-stat-pill rejected" style={{ background: '#fef2f2', padding: '14px', borderRadius: '10px', textAlign: 'center', border: '1px solid #fecaca' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#dc2626' }}>{rejected}</div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#b91c1c' }}>Rejected</div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px', fontWeight: 600 }}>Approval Ratio</div>
        <div style={{ display: 'flex', height: '10px', borderRadius: '5px', overflow: 'hidden', width: '100%', background: '#e2e8f0' }}>
          <div style={{ width: `${(approved / total) * 100}%`, background: '#10b981' }} title="Approved"></div>
          <div style={{ width: `${(pending / total) * 100}%`, background: '#f59e0b' }} title="Pending"></div>
          <div style={{ width: `${(rejected / total) * 100}%`, background: '#ef4444' }} title="Rejected"></div>
        </div>
      </div>
    </div>
  );
};
