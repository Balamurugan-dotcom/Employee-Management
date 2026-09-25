import React from 'react';
import { Bell, CheckCircle2, AlertTriangle, Info, Calendar } from 'lucide-react';

const EmployeeNotifications = () => {
  const notifications = [
    {
      id: 1,
      title: 'Monthly Payroll Disbursed',
      desc: 'Your September 2026 salary slip has been processed and deposited into your account.',
      time: '1 hour ago',
      type: 'success',
    },
    {
      id: 2,
      title: 'Quarterly Team All-Hands Meeting',
      desc: 'Join the engineering townhall via Google Meet tomorrow morning at 10:00 AM.',
      time: '5 hours ago',
      type: 'info',
    },
    {
      id: 3,
      title: 'Annual Health Insurance Renewal',
      desc: 'Please verify family dependent details in the benefits portal before the 30th.',
      time: '1 day ago',
      type: 'warning',
    },
    {
      id: 4,
      title: 'Sprint Planning Deliverables',
      desc: 'Your manager updated the requirements for the Enterprise Cloud Migration task.',
      time: '2 days ago',
      type: 'info',
    },
  ];

  return (
    <div>
      <div className="table-toolbar" style={{ borderRadius: '12px', marginBottom: '24px', background: '#fff', border: '1px solid #e2e8f0' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Company Notices & Alerts</h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>Important announcements and workflow notifications</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '800px' }}>
        {notifications.map((n) => (
          <div
            key={n.id}
            className="table-card"
            style={{
              padding: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              marginBottom: 0,
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background:
                  n.type === 'success' ? '#ecfdf5' : n.type === 'warning' ? '#fffbeb' : '#eff6ff',
                color:
                  n.type === 'success' ? '#059669' : n.type === 'warning' ? '#d97706' : '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {n.type === 'success' ? (
                <CheckCircle2 size={20} />
              ) : n.type === 'warning' ? (
                <AlertTriangle size={20} />
              ) : (
                <Info size={20} />
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>{n.title}</h3>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{n.time}</span>
              </div>
              <p style={{ fontSize: '13.5px', color: '#475569', marginTop: '4px' }}>{n.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmployeeNotifications;
