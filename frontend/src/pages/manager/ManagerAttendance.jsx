import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import UserAvatar from '../../components/UserAvatar';
import { Calendar, Clock, CheckCircle2, Filter } from 'lucide-react';

const ManagerAttendance = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'All';

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [records, setRecords] = useState([]);
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

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.get('/attendance', { params: { date } });
      if (res.data.success) {
        setRecords(res.data.records);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [date]);

  const filteredRecords = records.filter((r) => {
    if (statusFilter === 'All') return true;
    return r.status?.toLowerCase() === statusFilter.toLowerCase();
  });

  const counts = {
    All: records.length,
    Present: records.filter((r) => r.status?.toLowerCase() === 'present').length,
    HalfDay: records.filter((r) => r.status?.toLowerCase().includes('half')).length,
    Absent: records.filter((r) => r.status?.toLowerCase() === 'absent').length,
  };

  return (
    <div>
      <div className="table-card">
        <div className="table-toolbar" style={{ flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Calendar size={18} color="#4f46e5" />
            <input
              type="date"
              className="select-filter"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { label: 'All', value: 'All', count: counts.All },
              { label: 'Present', value: 'Present', count: counts.Present },
              { label: 'Half Day', value: 'Half Day', count: counts.HalfDay },
              { label: 'Absent', value: 'Absent', count: counts.Absent },
            ].map((tab) => {
              const active = statusFilter.toLowerCase() === tab.value.toLowerCase();
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => handleStatusChange(tab.value)}
                  style={{
                    padding: '6px 12px',
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

          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Showing {filteredRecords.length} of {records.length} Punches
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Team Member</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Working Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                    No team attendance recorded matching "{statusFilter}" for {date}.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <div className="user-cell">
                        <UserAvatar
                          src={r.employee?.profileImage}
                          name={r.employee?.name}
                          size={36}
                        />
                        <div className="user-cell-meta">
                          <div className="name">{r.employee?.name}</div>
                          <div className="email">{r.employee?.designation}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {r.checkIn ? (
                        <span style={{ color: '#059669', fontWeight: 600 }}>
                          {new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      {r.checkOut ? (
                        <span style={{ color: '#2563eb', fontWeight: 600 }}>
                          {new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>On Duty</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>{r.workingHours ? `${r.workingHours} hrs` : '-'}</td>
                    <td>
                      <span className={`badge badge-${r.status.toLowerCase().replace(/\s+/g, '')}`}>
                        {r.status}
                      </span>
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

export default ManagerAttendance;
