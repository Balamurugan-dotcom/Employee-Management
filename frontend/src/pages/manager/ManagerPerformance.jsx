import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Award, Star, MessageSquare } from 'lucide-react';

const ManagerPerformance = () => {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/employees/my-team').then((res) => {
      if (res.data.success) setTeam(res.data.team);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <div className="table-toolbar" style={{ borderRadius: '12px', marginBottom: '24px', background: '#fff', border: '1px solid #e2e8f0' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Team Performance Appraisals</h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>Quarterly review ratings and managerial feedback records</p>
        </div>
      </div>

      <div className="responsive-cards-grid">
        {loading ? (
          <div className="spinner" style={{ margin: '40px auto' }}></div>
        ) : team.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No team members to evaluate.</p>
        ) : (
          team.map((emp) => (
            <div key={emp._id} className="table-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                <img
                  src={emp.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.name}`}
                  alt=""
                  style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{emp.name}</h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{emp.designation}</span>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', marginBottom: '6px' }}>
                  <Star size={16} fill="#f59e0b" />
                  <Star size={16} fill="#f59e0b" />
                  <Star size={16} fill="#f59e0b" />
                  <Star size={16} fill="#f59e0b" />
                  <Star size={16} fill="#f59e0b" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginLeft: '6px' }}>4.8 / 5.0</span>
                </div>
                <p style={{ fontSize: '12.5px', color: '#475569', fontStyle: 'italic' }}>
                  "Consistently delivers clean modules and displays initiative in architectural meetings."
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                <span>KPI Fulfillment: 94%</span>
                <span className="badge badge-approved">On Track</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManagerPerformance;
