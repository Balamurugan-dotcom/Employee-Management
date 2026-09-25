import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Calendar, Clock, CheckCircle2 } from 'lucide-react';

const ManagerAttendance = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      <div className="table-card">
        <div className="table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Calendar size={18} color="#4f46e5" />
            <input
              type="date"
              className="select-filter"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Team Punches: {records.length} Recorded
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
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                    No team attendance recorded for {date}.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <div className="user-cell">
                        <img
                          src={r.employee?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.employee?.name}`}
                          alt=""
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
