import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Calendar, Filter, Clock } from 'lucide-react';

const AdminAttendance = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState('All');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get('/departments');
        if (res.data.success) setDepartments(res.data.departments);
      } catch (e) {}
    };
    fetchDepts();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.get('/attendance', {
        params: { date, department: department !== 'All' ? department : undefined },
      });
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
  }, [date, department]);

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

            <Filter size={16} color="#64748b" />
            <select
              className="select-filter"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d.departmentName}>
                  {d.departmentName}
                </option>
              ))}
            </select>
          </div>

          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
            Total Logged: {records.length} Staff
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Hours Worked</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                    No attendance records for {date}.
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
                          <div className="email">{r.employee?.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td>{r.employee?.department || '-'}</td>
                    <td>
                      {r.checkIn ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: '#059669' }}>
                          <Clock size={13} />
                          {new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      {r.checkOut ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: '#2563eb' }}>
                          <Clock size={13} />
                          {new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Active</span>
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

export default AdminAttendance;
