import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FolderGit2, Plus, Calendar, CheckCircle2 } from 'lucide-react';

const AdminProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [managers, setManagers] = useState([]);
  const [formData, setFormData] = useState({
    projectName: '',
    description: '',
    deadline: '',
    manager: '',
    status: 'In Progress',
    progress: 25,
  });

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/projects');
      if (res.data.success) setProjects(res.data.projects);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    api.get('/employees/managers').then((res) => {
      if (res.data.success) setManagers(res.data.managers);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/projects', formData);
      if (res.data.success) {
        setModalOpen(false);
        setFormData({ projectName: '', description: '', deadline: '', manager: '', status: 'In Progress', progress: 25 });
        fetchProjects();
      }
    } catch (err) {
      alert('Failed to create project');
    }
  };

  return (
    <div>
      <div className="table-toolbar" style={{ borderRadius: '12px', marginBottom: '24px', background: '#fff', border: '1px solid #e2e8f0' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Active Projects</h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>Enterprise milestone tracking & manager supervision</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={18} />
          <span>New Project</span>
        </button>
      </div>

      <div className="responsive-cards-grid">
        {loading ? (
          <div className="spinner" style={{ margin: '40px auto' }}></div>
        ) : projects.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No projects registered yet.</p>
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
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Lead: {p.manager?.name || 'Assigned Lead'}</span>
                  </div>
                </div>
                <span className={`badge badge-${p.status === 'Completed' ? 'completed' : 'inprogress'}`}>{p.status}</span>
              </div>

              <p style={{ fontSize: '13px', color: '#475569', minHeight: '36px' }}>{p.description || 'Project initiative'}</p>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px', fontWeight: 600 }}>
                  <span>Progress</span>
                  <span style={{ color: '#4f46e5' }}>{p.progress || 0}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${p.progress || 0}%`, height: '100%', background: '#4f46e5' }}></div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '12px', fontSize: '12px', color: '#64748b' }}>
                <span>Due: {new Date(p.deadline).toLocaleDateString()}</span>
                <span>{p.teamMembers?.length || 0} Members</span>
              </div>
            </div>
          ))
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Create New Project</h3>
              <button className="btn-icon" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Project Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Lead Manager</label>
                  <select
                    className="form-control"
                    value={formData.manager}
                    onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  >
                    <option value="">Select Manager</option>
                    {managers.map((m) => (
                      <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Deadline Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    className="form-control"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProjects;
