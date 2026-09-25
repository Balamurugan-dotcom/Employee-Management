import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Check, X, Calendar } from 'lucide-react';

const ManagerLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleApprove = async (id) => {
    try {
      await api.put(`/leaves/${id}/approve`);
      fetchLeaves();
    } catch (e) {
      alert('Approval failed');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Provide reason for declining this request:');
    try {
      await api.put(`/leaves/${id}/reject`, { rejectionReason: reason });
      fetchLeaves();
    } catch (e) {
      alert('Rejection failed');
    }
  };

  return (
    <div>
      <div className="table-card">
        <div className="table-toolbar">
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Team Leave Requests</h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>Authorize or reject planned team absence</p>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Team Member</th>
                <th>Leave Type</th>
                <th>From - To</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Action</th>
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
                    No pending leave requests from your team.
                  </td>
                </tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l._id}>
                    <td>
                      <div className="user-cell">
                        <img
                          src={l.employee?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${l.employee?.name}`}
                          alt=""
                        />
                        <div className="user-cell-meta">
                          <div className="name">{l.employee?.name}</div>
                          <div className="email">{l.employee?.designation}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{l.leaveType}</td>
                    <td>
                      {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                    </td>
                    <td style={{ maxWidth: '240px', color: '#475569' }}>{l.reason}</td>
                    <td>
                      <span className={`badge badge-${l.status.toLowerCase()}`}>{l.status}</span>
                    </td>
                    <td>
                      {l.status === 'Pending' ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn btn-success"
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            onClick={() => handleApprove(l._id)}
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            onClick={() => handleReject(l._id)}
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#64748b' }}>Decided</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagerLeaves;
