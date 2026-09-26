import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Calendar, Filter, Clock, Camera, X } from 'lucide-react';

const AdminAttendance = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState('All');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [photoPreview, setPhotoPreview] = useState(null); // { photo, name, checkIn, employeeId }

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
                <th>Check-In Photo</th>
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
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                    No attendance records for {date}.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const checkInPhoto = r.faceImage || r.employee?.profileImage;
                  return (
                    <tr key={r._id}>
                      <td>
                        <div className="user-cell">
                          <img
                            src={checkInPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.employee?.name}`}
                            alt=""
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: checkInPhoto ? '2px solid #10b981' : '1px solid #e2e8f0',
                            }}
                          />
                          <div className="user-cell-meta">
                            <div className="name">{r.employee?.name}</div>
                            <div className="email">{r.employee?.employeeId}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        {checkInPhoto ? (
                          <div
                            onClick={() =>
                              setPhotoPreview({
                                photo: checkInPhoto,
                                name: r.employee?.name,
                                checkIn: r.checkIn,
                                employeeId: r.employee?.employeeId,
                              })
                            }
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                              background: '#ecfdf5',
                              padding: '3px 8px',
                              borderRadius: '8px',
                              border: '1px solid #a7f3d0',
                              transition: 'transform 0.15s ease',
                            }}
                            title="Click to view full captured check-in photo"
                          >
                            <img
                              src={checkInPhoto}
                              alt=""
                              style={{ width: '26px', height: '26px', borderRadius: '4px', objectFit: 'cover' }}
                            />
                            <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#047857' }}>
                              View Photo
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>-</span>
                        )}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Captured Photo Preview Modal */}
      {photoPreview && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '440px', padding: 0, overflow: 'hidden' }}>
            <div
              style={{
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} color="#10b981" />
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                  Captured Check-In Photo
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPhotoPreview(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#64748b',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '18px', textAlign: 'center', background: '#0f172a' }}>
              <img
                src={photoPreview.photo}
                alt="Captured Check-In"
                style={{
                  width: '100%',
                  maxHeight: '340px',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  border: '2px solid #10b981',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}
              />
            </div>

            <div style={{ padding: '14px 18px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                    {photoPreview.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {photoPreview.employeeId}
                  </div>
                </div>
                {photoPreview.checkIn && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Check-In Time</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#059669' }}>
                      {new Date(photoPreview.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAttendance;
