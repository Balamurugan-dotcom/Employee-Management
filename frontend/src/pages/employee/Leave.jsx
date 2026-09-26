import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { CalendarDays, Plus, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const Leave = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: 'Casual Leave',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState({ type: '', text: '' });

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await api.get('/leaves');
      if (res.data.success) {
        setLeaves(res.data.leaves);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setNotification({ type: '', text: '' });

    try {
      const res = await api.post('/leaves', formData);
      if (res.data.success) {
        setNotification({ type: 'success', text: 'Leave application submitted successfully for manager review.' });
        setModalOpen(false);
        setFormData({ leaveType: 'Casual Leave', startDate: '', endDate: '', reason: '' });
        fetchLeaves();
      }
    } catch (err) {
      setNotification({ type: 'danger', text: err.response?.data?.message || 'Failed to submit leave.' });
    } finally {
      setSubmitting(false);
    }
  };

  const approvedLeaves = leaves.filter((l) => l.status === 'Approved').length;
  const remainingDays = Math.max(0, 20 - approvedLeaves);

  return (
    <div>
      {notification.text && (
        <div className={`alert alert-${notification.type}`} style={{ marginBottom: '20px' }}>
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Quota Banner */}
      <div className="leave-quota-grid">
        <div className="leave-quota-card quota-allotted">
          <span className="quota-label">TOTAL ALLOTTED</span>
          <div className="quota-value">20 Days</div>
        </div>
        <div className="leave-quota-card quota-consumed">
          <span className="quota-label">LEAVES CONSUMED</span>
          <div className="quota-value">{approvedLeaves} Days</div>
        </div>
        <div className="leave-quota-card quota-remaining">
          <span className="quota-label">REMAINING BALANCE</span>
          <div className="quota-value">{remainingDays} Days</div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>My Leave Requests</h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>Track approval status of time-off applications</p>
          </div>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={18} />
            <span>Apply for Leave</span>
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>From Date</th>
                <th>To Date</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Reviewed By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                    You have not submitted any leave requests yet.
                  </td>
                </tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l._id}>
                    <td style={{ fontWeight: 600 }}>{l.leaveType}</td>
                    <td>{new Date(l.startDate).toLocaleDateString()}</td>
                    <td>{new Date(l.endDate).toLocaleDateString()}</td>
                    <td style={{ maxWidth: '240px', color: '#475569' }}>{l.reason}</td>
                    <td>
                      <span className={`badge badge-${l.status.toLowerCase()}`}>{l.status}</span>
                    </td>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                      {l.approvedBy?.name || 'Pending Review'}
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
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3>Apply for Leave</h3>
              <button className="btn-icon" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Leave Category *</label>
                  <select
                    className="form-control"
                    value={formData.leaveType}
                    onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                    required
                  >
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Paid Leave">Paid Leave</option>
                    <option value="Maternity/Paternity Leave">Maternity / Paternity Leave</option>
                    <option value="Unpaid Leave">Unpaid Leave</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Start Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>End Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Reason for Leave *</label>
                  <textarea
                    className="form-control"
                    placeholder="Provide specific reason..."
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leave;
