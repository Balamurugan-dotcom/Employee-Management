import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { CheckSquare, Plus, Trash2, Edit3, MessageSquare } from 'lucide-react';

const ManagerTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'Medium',
    dueDate: '',
    feedback: '',
  });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tasks');
      if (res.data.success) setTasks(res.data.tasks);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeam = async () => {
    try {
      const res = await api.get('/employees/my-team');
      if (res.data.success) setTeam(res.data.team);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchTeam();
  }, []);

  const handleOpenCreate = () => {
    setEditTask(null);
    setFormData({
      title: '',
      description: '',
      assignedTo: team[0]?._id || '',
      priority: 'Medium',
      dueDate: '',
      feedback: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setEditTask(t);
    setFormData({
      title: t.title,
      description: t.description || '',
      assignedTo: t.assignedTo?._id || '',
      priority: t.priority || 'Medium',
      dueDate: t.dueDate ? t.dueDate.split('T')[0] : '',
      feedback: t.feedback || '',
      status: t.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editTask) {
        await api.put(`/tasks/${editTask._id}`, formData);
      } else {
        await api.post('/tasks', formData);
      }
      setModalOpen(false);
      fetchTasks();
    } catch (err) {
      alert('Task operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      fetchTasks();
    } catch (e) {
      alert('Delete failed');
    }
  };

  return (
    <div>
      <div className="table-card">
        <div className="table-toolbar">
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Team Task Delegation</h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>Assign deliverables and provide actionable review notes</p>
          </div>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} />
            <span>Create & Assign Task</span>
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Assigned Member</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Manager Feedback</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                    No tasks assigned to your team yet.
                  </td>
                </tr>
              ) : (
                tasks.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <strong style={{ color: '#1e293b' }}>{t.title}</strong>
                      <span style={{ display: 'block', fontSize: '12px', color: '#64748b' }}>{t.description}</span>
                    </td>
                    <td>
                      <div className="user-cell">
                        <img
                          src={t.assignedTo?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${t.assignedTo?.name}`}
                          alt=""
                        />
                        <div className="user-cell-meta">
                          <div className="name">{t.assignedTo?.name}</div>
                          <div className="email">{t.assignedTo?.designation}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-priority-${t.priority.toLowerCase()}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td>{new Date(t.dueDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge badge-${t.status.toLowerCase().replace(/\s+/g, '')}`}>
                        {t.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', maxWidth: '200px', color: '#475569' }}>
                      {t.feedback ? (
                        <span style={{ fontStyle: 'italic', color: '#2563eb' }}>"{t.feedback}"</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>No notes</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn-icon" onClick={() => handleOpenEdit(t)} title="Edit Task & Feedback">
                          <Edit3 size={15} />
                        </button>
                        <button className="btn-icon delete" onClick={() => handleDelete(t._id)} title="Delete Task">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>{editTask ? 'Edit Task & Feedback' : 'Create & Assign Task'}</h3>
              <button className="btn-icon" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Task Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Assignee (Team Member) *</label>
                  <select
                    className="form-control"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    required
                  >
                    <option value="">Select Member</option>
                    {team.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} ({m.designation})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Priority</label>
                  <select
                    className="form-control"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Due Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Description</label>
                  <textarea
                    className="form-control"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                {editTask && (
                  <div className="form-group">
                    <label>Manager Performance Feedback / Notes</label>
                    <textarea
                      className="form-control"
                      placeholder="e.g. Excellent speed; please add unit tests before marking done"
                      value={formData.feedback}
                      onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editTask ? 'Save Updates' : 'Assign Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerTasks;
