import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { CheckSquare, Plus, Trash2, Edit2, Filter } from 'lucide-react';

const AdminTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'Medium',
    dueDate: '',
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

  useEffect(() => {
    fetchTasks();
    api.get('/employees').then((res) => {
      if (res.data.success) setEmployees(res.data.employees);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/tasks', formData);
      if (res.data.success) {
        setModalOpen(false);
        setFormData({ title: '', description: '', assignedTo: '', priority: 'Medium', dueDate: '' });
        fetchTasks();
      }
    } catch (e) {
      alert('Failed to assign task');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      fetchTasks();
    } catch (e) {
      alert('Failed to delete task');
    }
  };

  return (
    <div>
      <div className="table-card">
        <div className="table-toolbar">
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Company Tasks</h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>Cross-department task allocation and completion status</p>
          </div>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={18} />
            <span>Assign New Task</span>
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Assigned To</th>
                <th>Assigned By</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Status</th>
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
                    No tasks assigned yet.
                  </td>
                </tr>
              ) : (
                tasks.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <strong style={{ display: 'block', color: '#1e293b' }}>{t.title}</strong>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{t.description}</span>
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
                    <td>{t.assignedBy?.name || 'System Admin'}</td>
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
                    <td>
                      <button className="btn-icon delete" onClick={() => handleDelete(t._id)}>
                        <Trash2 size={15} />
                      </button>
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
              <h3>Assign Task</h3>
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
                  <label>Assignee Employee *</label>
                  <select
                    className="form-control"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} ({emp.department} - {emp.employeeId})
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
                <button type="submit" className="btn btn-primary">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTasks;
