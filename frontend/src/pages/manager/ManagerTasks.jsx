import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import UserAvatar from '../../components/UserAvatar';
import { CheckSquare, Plus, Trash2, Edit3, MessageSquare } from 'lucide-react';

const ManagerTasks = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'All';

  const [statusFilter, setStatusFilter] = useState(initialStatus);
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

  // Sync state if query param changes
  useEffect(() => {
    const qStatus = searchParams.get('status');
    if (qStatus && qStatus !== statusFilter) {
      setStatusFilter(qStatus);
    }
  }, [searchParams]);

  const handleStatusChange = (newStatus) => {
    setStatusFilter(newStatus);
    if (newStatus === 'All') {
      searchParams.delete('status');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ status: newStatus });
    }
  };

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

  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayStr = getTodayDateStr();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.dueDate < todayStr) {
      alert('Due date cannot be in the past. Please select today or a future date.');
      return;
    }

    try {
      if (editTask) {
        await api.put(`/tasks/${editTask._id}`, formData);
      } else {
        await api.post('/tasks', formData);
      }
      setModalOpen(false);
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Task operation failed');
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

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter === 'All') return true;
    if (statusFilter === 'Active') return t.status !== 'Completed';
    if (statusFilter === 'Completed') return t.status === 'Completed';
    return t.status?.toLowerCase() === statusFilter.toLowerCase();
  });

  const counts = {
    All: tasks.length,
    Active: tasks.filter((t) => t.status !== 'Completed').length,
    Completed: tasks.filter((t) => t.status === 'Completed').length,
  };

  return (
    <div>
      <div className="table-card">
        <div className="table-toolbar" style={{ flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Team Task Delegation</h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>Assign deliverables and provide actionable review notes</p>
          </div>

          {/* Task Status Filter Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { label: 'All Tasks', value: 'All', count: counts.All },
              { label: 'Active Tasks', value: 'Active', count: counts.Active },
              { label: 'Completed', value: 'Completed', count: counts.Completed },
            ].map((tab) => {
              const active = statusFilter.toLowerCase() === tab.value.toLowerCase();
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => handleStatusChange(tab.value)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: active ? '#4f46e5' : '#f1f5f9',
                    color: active ? '#ffffff' : '#64748b',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    style={{
                      background: active ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontSize: '11px',
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
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
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                    No {statusFilter !== 'All' ? `"${statusFilter}"` : ''} tasks found for your team.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <strong style={{ color: '#1e293b' }}>{t.title}</strong>
                      <span style={{ display: 'block', fontSize: '12px', color: '#64748b' }}>{t.description}</span>
                    </td>
                    <td>
                      <div className="user-cell">
                        <UserAvatar
                          src={t.assignedTo?.profileImage}
                          name={t.assignedTo?.name}
                          size={36}
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
                    min={todayStr}
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
