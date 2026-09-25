import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  CheckSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
  Eye,
  Calendar,
  User,
  FolderGit2,
  MessageSquare,
  Flag,
  ArrowRight,
} from 'lucide-react';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tasks');
      if (res.data.success) {
        setTasks(res.data.tasks);
        // If a task is selected, keep its reference updated
        if (selectedTask) {
          const fresh = res.data.tasks.find((t) => t._id === selectedTask._id);
          if (fresh) setSelectedTask(fresh);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStatusChange = async (taskId, newStatus, e) => {
    if (e) e.stopPropagation();
    setUpdatingId(taskId);
    try {
      const res = await api.put(`/tasks/${taskId}`, { status: newStatus });
      if (res.data.success) {
        setTasks((prev) =>
          prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
        );
        if (selectedTask && selectedTask._id === taskId) {
          setSelectedTask((prev) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task status');
    } finally {
      setUpdatingId(null);
    }
  };

  const getPriorityBadgeClass = (priority) => {
    const p = (priority || 'medium').toLowerCase();
    if (p === 'high') return 'badge badge-priority-high';
    if (p === 'low') return 'badge badge-priority-low';
    return 'badge badge-priority-medium';
  };

  const isOverdue = (dueDate, status) => {
    if (status === 'Completed') return false;
    return new Date(dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
  };

  return (
    <div>
      <div className="table-card">
        <div className="table-toolbar">
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>My Assigned Tasks</h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Click any task row or the view button to inspect full details and progress
            </p>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#4f46e5' }}>
            {tasks.filter((t) => t.status === 'Completed').length} / {tasks.length} Completed
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Project</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Manager Feedback</th>
                <th>Update Progress</th>
                <th style={{ textAlign: 'center' }}>Action</th>
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
                    No tasks currently assigned to you.
                  </td>
                </tr>
              ) : (
                tasks.map((t) => (
                  <tr
                    key={t._id}
                    onClick={() => setSelectedTask(t)}
                    style={{
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                    title="Click to view full task details"
                  >
                    <td>
                      <strong style={{ color: '#1e293b' }}>{t.title}</strong>
                      <span
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          color: '#64748b',
                          marginTop: '2px',
                          maxWidth: '280px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {t.description || 'No description provided'}
                      </span>
                    </td>
                    <td>{t.project?.projectName || 'Core Operations'}</td>
                    <td>
                      <span className={getPriorityBadgeClass(t.priority)}>
                        {t.priority || 'Medium'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{new Date(t.dueDate).toLocaleDateString()}</span>
                        {isOverdue(t.dueDate, t.status) && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              color: '#ef4444',
                              backgroundColor: '#fee2e2',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            OVERDUE
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ maxWidth: '220px', fontSize: '12.5px' }}>
                      {t.feedback ? (
                        <span style={{ color: '#2563eb', fontStyle: 'italic' }}>
                          "{t.feedback}"
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>No review notes yet</span>
                      )}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <select
                        className="select-filter"
                        value={t.status}
                        onChange={(e) => handleStatusChange(t._id, e.target.value, e)}
                        disabled={updatingId === t._id}
                        style={{
                          fontWeight: 600,
                          cursor: 'pointer',
                          borderColor:
                            t.status === 'Completed'
                              ? '#a7f3d0'
                              : t.status === 'In Progress'
                              ? '#bfdbfe'
                              : '#fde68a',
                        }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setSelectedTask(t)}
                        style={{
                          padding: '5px 10px',
                          fontSize: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        title="View Full Task Details"
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px', width: '90%', borderRadius: '16px', overflow: 'hidden' }}
          >
            {/* Modal Header */}
            <div className="modal-header" style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 4px 10px rgba(79, 70, 229, 0.25)',
                  }}
                >
                  <CheckSquare size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Task Details
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#6366f1',
                        backgroundColor: '#eef2ff',
                        padding: '2px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      {selectedTask.project?.projectName || 'Core Operations'}
                    </span>
                    <span className={getPriorityBadgeClass(selectedTask.priority)}>
                      {selectedTask.priority} Priority
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn-icon"
                onClick={() => setSelectedTask(null)}
                aria-label="Close"
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Task Title */}
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#94a3b8',
                    letterSpacing: '0.05em',
                  }}
                >
                  Deliverable Title
                </span>
                <h4 style={{ fontSize: '17px', fontWeight: 700, color: '#1e293b', marginTop: '4px', lineHeight: 1.4 }}>
                  {selectedTask.title}
                </h4>
              </div>

              {/* Status Update Quick Bar */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Current Progress Status
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                    {selectedTask.status === 'Completed' ? (
                      <CheckCircle2 size={16} color="#10b981" />
                    ) : selectedTask.status === 'In Progress' ? (
                      <Clock size={16} color="#3b82f6" />
                    ) : (
                      <AlertCircle size={16} color="#f59e0b" />
                    )}
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '14px',
                        color:
                          selectedTask.status === 'Completed'
                            ? '#059669'
                            : selectedTask.status === 'In Progress'
                            ? '#2563eb'
                            : '#d97706',
                      }}
                    >
                      {selectedTask.status}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Change to:</span>
                  {['Pending', 'In Progress', 'Completed'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={updatingId === selectedTask._id || selectedTask.status === st}
                      onClick={() => handleStatusChange(selectedTask._id, st)}
                      style={{
                        padding: '5px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: '1px solid',
                        cursor: selectedTask.status === st ? 'default' : 'pointer',
                        borderColor:
                          selectedTask.status === st
                            ? '#4f46e5'
                            : '#cbd5e1',
                        background:
                          selectedTask.status === st
                            ? '#4f46e5'
                            : '#ffffff',
                        color:
                          selectedTask.status === st
                            ? '#ffffff'
                            : '#475569',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Task Description */}
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#94a3b8',
                    letterSpacing: '0.05em',
                  }}
                >
                  Full Description & Scope
                </span>
                <div
                  style={{
                    marginTop: '6px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    fontSize: '13.5px',
                    color: '#334155',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    minHeight: '60px',
                  }}
                >
                  {selectedTask.description || (
                    <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                      No detailed description provided for this task.
                    </span>
                  )}
                </div>
              </div>

              {/* Key Metadata Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '14px',
                }}
              >
                {/* Project */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #f1f5f9',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Project
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <FolderGit2 size={16} color="#6366f1" />
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b' }}>
                      {selectedTask.project?.projectName || 'Core Operations'}
                    </span>
                  </div>
                </div>

                {/* Assigned By */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #f1f5f9',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Assigned By
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <User size={16} color="#3b82f6" />
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b' }}>
                        {selectedTask.assignedBy?.name || 'Project Manager'}
                      </div>
                      {selectedTask.assignedBy?.email && (
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {selectedTask.assignedBy.email}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Start Date */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #f1f5f9',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Start Date
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <Calendar size={16} color="#10b981" />
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b' }}>
                      {selectedTask.startDate ? new Date(selectedTask.startDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Due Date */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #f1f5f9',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Due Date
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <Clock size={16} color={isOverdue(selectedTask.dueDate, selectedTask.status) ? '#ef4444' : '#64748b'} />
                    <span
                      style={{
                        fontSize: '13.5px',
                        fontWeight: 600,
                        color: isOverdue(selectedTask.dueDate, selectedTask.status) ? '#ef4444' : '#1e293b',
                      }}
                    >
                      {new Date(selectedTask.dueDate).toLocaleDateString()}
                    </span>
                    {isOverdue(selectedTask.dueDate, selectedTask.status) && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: '#ef4444',
                          backgroundColor: '#fee2e2',
                          padding: '1px 5px',
                          borderRadius: '4px',
                        }}
                      >
                        OVERDUE
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Manager Feedback / Evaluation */}
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#94a3b8',
                    letterSpacing: '0.05em',
                  }}
                >
                  Manager Feedback & Notes
                </span>
                <div
                  style={{
                    marginTop: '6px',
                    background: selectedTask.feedback ? '#eff6ff' : '#f8fafc',
                    border: `1px solid ${selectedTask.feedback ? '#bfdbfe' : '#e2e8f0'}`,
                    borderRadius: '10px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <MessageSquare
                    size={18}
                    color={selectedTask.feedback ? '#2563eb' : '#94a3b8'}
                    style={{ marginTop: '2px', flexShrink: 0 }}
                  />
                  <div>
                    {selectedTask.feedback ? (
                      <p style={{ margin: 0, fontSize: '13.5px', color: '#1e40af', fontStyle: 'italic', lineHeight: 1.5 }}>
                        "{selectedTask.feedback}"
                      </p>
                    ) : (
                      <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                        No review notes yet. Your manager will provide feedback here after reviewing progress.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className="modal-footer"
              style={{
                padding: '14px 24px',
                borderTop: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedTask(null)}
                style={{ padding: '8px 18px', fontSize: '13px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
