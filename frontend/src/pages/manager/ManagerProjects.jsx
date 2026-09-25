import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FolderGit2, Users } from 'lucide-react';

const ManagerProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/projects').then((res) => {
      if (res.data.success) setProjects(res.data.projects);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <div className="table-toolbar" style={{ borderRadius: '12px', marginBottom: '24px', background: '#fff', border: '1px solid #e2e8f0' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Supervised Projects</h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>Projects and deliverables under your managerial oversight</p>
        </div>
      </div>

      <div className="responsive-cards-grid">
        {loading ? (
          <div className="spinner" style={{ margin: '40px auto' }}></div>
        ) : projects.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No active projects under management.</p>
        ) : (
          projects.map((p) => (
            <div key={p._id} className="table-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FolderGit2 size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{p.projectName}</h3>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Due {new Date(p.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className={`badge badge-${p.status === 'Completed' ? 'completed' : 'inprogress'}`}>{p.status}</span>
              </div>

              <p style={{ fontSize: '13px', color: '#475569' }}>{p.description || 'Project deliverables'}</p>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px', fontWeight: 600 }}>
                  <span>Completion</span>
                  <span style={{ color: '#4f46e5' }}>{p.progress || 0}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${p.progress || 0}%`, height: '100%', background: '#4f46e5' }}></div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
                <Users size={14} />
                <span>{p.teamMembers?.length || 0} Team Engineers Assigned</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManagerProjects;
