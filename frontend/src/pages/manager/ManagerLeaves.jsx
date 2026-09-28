import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import UserAvatar from '../../components/UserAvatar';
import { Check, X, Calendar } from 'lucide-react';

const ManagerLeaves = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'All';

  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const filteredLeaves = leaves.filter((l) => {
    if (statusFilter === 'All') return true;
    return l.status?.toLowerCase() === statusFilter.toLowerCase();
  });

  const counts = {
    All: leaves.length,
    Pending: leaves.filter((l) => l.status === 'Pending').length,
    Approved: leaves.filter((l) => l.status === 'Approved').length,
    Rejected: leaves.filter((l) => l.status === 'Rejected').length,
  };

  return (
    <div>
      <div className="table-card">
        <div className="table-toolbar" style={{ flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Team Leave Requests</h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>Authorize or reject planned team absence</p>
          </div>

          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { label: 'All', value: 'All', count: counts.All },
              { label: 'Pending Review', value: 'Pending', count: counts.Pending },
              { label: 'Approved', value: 'Approved', count: counts.Approved },
              { label: 'Rejected', value: 'Rejected', count: counts.Rejected },
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
              ) : filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                    No {statusFilter !== 'All' ? `"${statusFilter}"` : ''} leave requests found from your team.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((l) => (
                  <tr key={l._id}>
                    <td>
                      <div className="user-cell">
                        <UserAvatar
                          src={l.employee?.profileImage}
                          name={l.employee?.name}
                          size={36}
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
