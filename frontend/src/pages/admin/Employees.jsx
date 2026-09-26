import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Filter,
  UserCheck,
  AlertTriangle,
  Camera,
  List,
  LayoutGrid,
  Maximize2,
  X,
} from 'lucide-react';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [managers, setManagers] = useState([]);
  const [departments, setDepartments] = useState([]);

  // View mode & Photo preview states
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'gallery'
  const [previewPhotoModal, setPreviewPhotoModal] = useState(null);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'view'
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Form input state
  const initialForm = {
    employeeId: '',
    username: '',
    name: '',
    email: '',
    phone: '',
    department: 'Engineering',
    designation: '',
    manager: '',
    salary: 60000,
    joiningDate: new Date().toISOString().split('T')[0],
    gender: 'Male',
    address: '',
    password: '',
    role: 'employee',
    status: 'Active',
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employees', {
        params: {
          search: search || undefined,
          department: selectedDept !== 'All' ? selectedDept : undefined,
          status: selectedStatus !== 'All' ? selectedStatus : undefined,
        },
      });
      if (res.data.success) {
        setEmployees(res.data.employees);
      }
    } catch (err) {
      showNotify('danger', err.response?.data?.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [mgrRes, deptRes] = await Promise.all([
        api.get('/employees/managers'),
        api.get('/departments'),
      ]);
      if (mgrRes.data.success) setManagers(mgrRes.data.managers);
      if (deptRes.data.success) setDepartments(deptRes.data.departments);
    } catch (e) {
      console.error('Failed to load managers/departments', e);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchEmployees();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [search, selectedDept, selectedStatus]);

  const showNotify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 4000);
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData(initialForm);
    setModalError('');
    setShowPassword(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setModalMode('edit');
    setSelectedEmp(emp);
    setModalError('');
    setShowPassword(false);
    setFormData({
      employeeId: emp.employeeId,
      username: emp.username || '',
      name: emp.name,
      email: emp.email,
      phone: emp.phone || '',
      department: emp.department || 'Engineering',
      designation: emp.designation || '',
      manager: emp.manager?._id || '',
      salary: emp.salary || 50000,
      joiningDate: emp.joiningDate ? emp.joiningDate.split('T')[0] : '',
      gender: emp.gender || 'Not Specified',
      address: emp.address || '',
      status: emp.status || 'Active',
      role: emp.user?.role || 'employee',
      password: '',
    });
    setModalOpen(true);
  };

  const handleOpenView = (emp) => {
    setModalMode('view');
    setSelectedEmp(emp);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setModalError('');

    try {
      if (modalMode === 'create') {
        const res = await api.post('/employees', formData);
        if (res.data.success) {
          showNotify('success', `Employee ${res.data.employee?.name || ''} created successfully.`);
          setModalOpen(false);
          fetchEmployees();
        }
      } else if (modalMode === 'edit') {
        const res = await api.put(`/employees/${selectedEmp._id}`, formData);
        if (res.data.success) {
          showNotify('success', 'Employee updated successfully.');
          setModalOpen(false);
          fetchEmployees();
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Operation failed. Please verify employee details.';
      setModalError(errorMsg);
      showNotify('danger', errorMsg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await api.delete(`/employees/${id}`);
      if (res.data.success) {
        showNotify('success', 'Employee removed permanently.');
        setDeleteConfirmId(null);
        fetchEmployees();
      }
    } catch (err) {
      showNotify('danger', err.response?.data?.message || 'Delete failed');
    }
  };

  const handleToggleStatus = async (emp) => {
    const newStatus = emp.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await api.put(`/employees/${emp._id}`, { status: newStatus });
      if (res.data.success) {
        showNotify('success', `Employee status changed to ${newStatus}.`);
        fetchEmployees();
      }
    } catch (err) {
      showNotify('danger', 'Failed to toggle status.');
    }
  };

  return (
    <div>
      {notification.message && (
        <div className={`alert alert-${notification.type}`} style={{ marginBottom: '20px' }}>
          {notification.message}
        </div>
      )}

      <div className="table-card">
        {/* Table Toolbar with Search, Filters, and Add Button */}
        <div className="table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', flex: 1 }}>
            <div className="table-search-box">
              <Search size={18} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search by ID, name, email, designation..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={16} color="#64748b" />
              <select
                className="select-filter"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="All">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d.departmentName}>
                    {d.departmentName}
                  </option>
                ))}
              </select>

              <select
                className="select-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* View Mode Toggle: Table vs Captured Photos Gallery */}
            <div
              style={{
                display: 'flex',
                background: '#f1f5f9',
                padding: '3px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode('table')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: viewMode === 'table' ? '#ffffff' : 'transparent',
                  color: viewMode === 'table' ? '#4f46e5' : '#64748b',
                  boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <List size={14} />
                <span>Table</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('gallery')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: viewMode === 'gallery' ? '#ffffff' : 'transparent',
                  color: viewMode === 'gallery' ? '#4f46e5' : '#64748b',
                  boxShadow: viewMode === 'gallery' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Camera size={14} />
                <span>
                  Captured Photos ({employees.filter((e) => e.todayAttendance?.faceImage || e.lastCheckInPhoto).length})
                </span>
              </button>
            </div>

            <button className="btn btn-primary" onClick={handleOpenCreate}>
              <Plus size={18} />
              <span>Add Employee</span>
            </button>
          </div>
        </div>

        {/* View Mode: Table View */}
        {viewMode === 'table' ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Profile</th>
                  <th>Captured Photo</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Manager</th>
                  <th>Joining Date</th>
                  <th>Attendance & Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="11" style={{ textAlign: 'center', padding: '40px' }}>
                      <div className="spinner" style={{ margin: '0 auto' }}></div>
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan="11" style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                      No employees found matching the filters.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => {
                    const capturedImg = emp.todayAttendance?.faceImage || emp.lastCheckInPhoto;
                    const captureTime = emp.todayAttendance?.checkIn || emp.lastCheckInTime;

                    return (
                      <tr key={emp._id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#4f46e5' }}>
                          <div>{emp.employeeId}</div>
                          {emp.username && (
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500, fontFamily: 'sans-serif' }}>
                              @{emp.username}
                            </div>
                          )}
                        </td>

                        {/* Separate Profile Avatar Column */}
                        <td>
                          <img
                            src={emp.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.name}`}
                            alt=""
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '1px solid #e2e8f0',
                            }}
                          />
                        </td>

                        {/* Separate Captured Photo Column */}
                        <td>
                          {capturedImg ? (
                            <div
                              onClick={() =>
                                setPreviewPhotoModal({
                                  photo: capturedImg,
                                  name: emp.name,
                                  employeeId: emp.employeeId,
                                  department: emp.department,
                                  designation: emp.designation,
                                  time: captureTime,
                                  dutyStatus: emp.dutyStatus,
                                })
                              }
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '3px 8px',
                                borderRadius: '8px',
                                background: '#ecfdf5',
                                border: '1px solid #a7f3d0',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              title="Click to view full captured check-in photo"
                            >
                              <img
                                src={capturedImg}
                                alt="Check-in Photo"
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '6px',
                                  objectFit: 'cover',
                                  border: '1.5px solid #10b981',
                                }}
                              />
                              <div style={{ textAlign: 'left' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#047857', display: 'block', lineHeight: 1.2 }}>
                                  View Photo
                                </span>
                                <span style={{ fontSize: '9.5px', color: '#059669', display: 'block', lineHeight: 1.2 }}>
                                  {emp.todayAttendance?.checkIn
                                    ? new Date(emp.todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : 'Recorded'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span
                              style={{
                                fontSize: '11px',
                                color: '#94a3b8',
                                fontStyle: 'italic',
                                background: '#f8fafc',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                              }}
                            >
                              No photo
                            </span>
                          )}
                        </td>

                        <td style={{ fontWeight: 600 }}>{emp.name}</td>
                        <td style={{ color: '#475569' }}>{emp.email}</td>
                        <td>
                          <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 500 }}>
                            {emp.department}
                          </span>
                        </td>
                        <td>{emp.designation}</td>
                        <td>{emp.manager?.name || emp.managerName || 'None'}</td>
                        <td>{new Date(emp.joiningDate).toLocaleDateString()}</td>
                        <td>
                          {/* Live Today's Duty / Attendance Punch Status */}
                          <div style={{ marginBottom: '4px' }}>
                            {emp.dutyStatus === 'Checked Out' ? (
                              <span
                                style={{
                                  background: '#eff6ff',
                                  color: '#1d4ed8',
                                  border: '1px solid #bfdbfe',
                                  fontWeight: 600,
                                  fontSize: '11.5px',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                🏁 Checked Out
                                {emp.todayAttendance?.checkOut && (
                                  <span style={{ fontSize: '10px', opacity: 0.85, fontWeight: 500 }}>
                                    ({new Date(emp.todayAttendance.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                                  </span>
                                )}
                              </span>
                            ) : emp.dutyStatus === 'Checked In' ? (
                              <span
                                style={{
                                  background: '#ecfdf5',
                                  color: '#047857',
                                  border: '1px solid #a7f3d0',
                                  fontWeight: 600,
                                  fontSize: '11.5px',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                🟢 Checked In
                                {emp.todayAttendance?.checkIn && (
                                  <span style={{ fontSize: '10px', opacity: 0.85, fontWeight: 500 }}>
                                    ({new Date(emp.todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                                  </span>
                                )}
                              </span>
                            ) : emp.dutyStatus === 'On Break' ? (
                              <span
                                style={{
                                  background: '#fffbeb',
                                  color: '#b45309',
                                  border: '1px solid #fde68a',
                                  fontWeight: 600,
                                  fontSize: '11.5px',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                ☕ On Break
                              </span>
                            ) : (
                              <span
                                style={{
                                  background: '#f8fafc',
                                  color: '#64748b',
                                  border: '1px solid #e2e8f0',
                                  fontWeight: 500,
                                  fontSize: '11.5px',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                ⚪ Not In Yet
                              </span>
                            )}
                          </div>

                          {/* Employment Account Status */}
                          <span
                            className={`badge badge-${emp.status?.toLowerCase()}`}
                            style={{ cursor: 'pointer', fontSize: '10.5px', padding: '2px 6px' }}
                            title="Click to toggle account status (Active / Inactive)"
                            onClick={() => handleToggleStatus(emp)}
                          >
                            Account: {emp.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <button
                              className="btn-icon"
                              title="View Details"
                              onClick={() => handleOpenView(emp)}
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              className="btn-icon"
                              title="Edit Employee"
                              onClick={() => handleOpenEdit(emp)}
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              className="btn-icon delete"
                              title="Delete Employee"
                              onClick={() => setDeleteConfirmId(emp._id)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* View Mode: Captured Photos Gallery View */
          <div style={{ padding: '20px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                  All Employee Check-In Photos
                </h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                  Live webcam camera snapshots captured during attendance check-in
                </p>
              </div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#047857',
                  background: '#ecfdf5',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  border: '1px solid #a7f3d0',
                }}
              >
                📸 {employees.filter((e) => e.todayAttendance?.faceImage || e.lastCheckInPhoto).length} Photos Available
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
              </div>
            ) : employees.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
                No employees found matching the filters.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                  gap: '18px',
                }}
              >
                {employees.map((emp) => {
                  const capturedImg = emp.todayAttendance?.faceImage || emp.lastCheckInPhoto;
                  const captureTime = emp.todayAttendance?.checkIn || emp.lastCheckInTime;

                  return (
                    <div
                      key={emp._id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '14px',
                        border: capturedImg ? '1.5px solid #a7f3d0' : '1px solid #e2e8f0',
                        boxShadow: capturedImg
                          ? '0 4px 14px rgba(16, 185, 129, 0.1)'
                          : '0 2px 6px rgba(0, 0, 0, 0.03)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      {/* Photo Area */}
                      <div
                        style={{
                          position: 'relative',
                          width: '100%',
                          height: '170px',
                          background: '#0f172a',
                          overflow: 'hidden',
                        }}
                      >
                        {capturedImg ? (
                          <img
                            src={capturedImg}
                            alt={emp.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              cursor: 'pointer',
                            }}
                            onClick={() =>
                              setPreviewPhotoModal({
                                photo: capturedImg,
                                name: emp.name,
                                employeeId: emp.employeeId,
                                department: emp.department,
                                designation: emp.designation,
                                time: captureTime,
                                dutyStatus: emp.dutyStatus,
                              })
                            }
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: '#f8fafc',
                              color: '#94a3b8',
                            }}
                          >
                            <img
                              src={emp.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.name}`}
                              alt=""
                              style={{ width: '54px', height: '54px', borderRadius: '50%', marginBottom: '6px', opacity: 0.7 }}
                            />
                            <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>No Captured Photo</span>
                          </div>
                        )}

                        {capturedImg ? (
                          <span
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              background: 'rgba(16, 185, 129, 0.92)',
                              color: '#ffffff',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Camera size={11} /> Captured
                          </span>
                        ) : (
                          <span
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              background: 'rgba(148, 163, 184, 0.85)',
                              color: '#ffffff',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '10px',
                              fontWeight: 600,
                            }}
                          >
                            Pending
                          </span>
                        )}
                      </div>

                      {/* Card Meta */}
                      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                              {emp.name}
                            </h4>
                            <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: '#4f46e5' }}>
                              {emp.employeeId}
                            </span>
                          </div>
                          <p style={{ margin: '0 0 8px 0', fontSize: '11.5px', color: '#64748b' }}>
                            {emp.designation} • {emp.department}
                          </p>
                        </div>

                        <div>
                          <div style={{ padding: '6px 8px', background: '#f8fafc', borderRadius: '6px', fontSize: '11px', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                              <span>Status:</span>
                              <strong style={{ color: emp.dutyStatus === 'Checked In' ? '#059669' : '#334155' }}>
                                {emp.dutyStatus}
                              </strong>
                            </div>
                            {captureTime && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', marginTop: '2px' }}>
                                <span>Time:</span>
                                <strong>{new Date(captureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            {capturedImg && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewPhotoModal({
                                    photo: capturedImg,
                                    name: emp.name,
                                    employeeId: emp.employeeId,
                                    department: emp.department,
                                    designation: emp.designation,
                                    time: captureTime,
                                    dutyStatus: emp.dutyStatus,
                                  })
                                }
                                style={{
                                  flex: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px',
                                  padding: '6px',
                                  borderRadius: '6px',
                                  border: '1px solid #10b981',
                                  background: '#ecfdf5',
                                  color: '#047857',
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                <Maximize2 size={12} /> View Photo
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenView(emp)}
                              style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                padding: '6px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                background: '#ffffff',
                                color: '#475569',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              <Eye size={12} /> Dossier
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && modalMode !== 'view' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{modalMode === 'create' ? 'Add New Employee' : 'Edit Employee Details'}</h3>
              <button className="btn-icon" onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                {modalError && (
                  <div
                    style={{
                      padding: '12px 16px',
                      marginBottom: '16px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      color: '#b91c1c',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '13.5px',
                      fontWeight: 500,
                    }}
                  >
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="form-grid">
                  <div className="form-group">
                    <label>Employee ID *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. EMP205"
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value.toUpperCase().trim() })}
                      required
                      disabled={modalMode === 'edit'}
                    />
                    <small style={{ color: '#64748b', fontSize: '11px' }}>
                      Must be unique across all registered users.
                    </small>
                  </div>

                  <div className="form-group">
                    <label>Username *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. john_doe"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().trim() })}
                      required
                      disabled={modalMode === 'edit'}
                    />
                    <small style={{ color: '#64748b', fontSize: '11px' }}>
                      Unique login username (letters, numbers, underscores).
                    </small>
                  </div>

                  {modalMode === 'create' ? (
                    <div className="form-group">
                      <label>Password *</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="form-control"
                          placeholder="Min 6 characters (e.g. Secret@123)"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                          minLength={6}
                          style={{ paddingRight: '40px' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <small style={{ color: '#64748b', fontSize: '11px' }}>
                        At least 6 characters for secure authentication.
                      </small>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label>New Password (Optional)</label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Leave blank to keep existing"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        minLength={6}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Work Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g. jdoe@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      disabled={modalMode === 'edit'}
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Department *</label>
                    <select
                      className="form-control"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      required
                    >
                      {departments.map((d) => (
                        <option key={d._id} value={d.departmentName}>
                          {d.departmentName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Designation *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Senior Software Engineer"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Assign Manager</label>
                    <select
                      className="form-control"
                      value={formData.manager}
                      onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                    >
                      <option value="">None (Reports to Admin)</option>
                      {managers.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.name} ({m.employeeId || m.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Annual Salary ($)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Joining Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.joiningDate}
                      onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Gender</label>
                    <select
                      className="form-control"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Not Specified">Not Specified</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select
                      className="form-control"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="form-group col-span-2">
                    <label>Office / Residential Address</label>
                    <textarea
                      className="form-control"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalOpen(false)}
                  style={{ padding: '10px 18px', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={formLoading}
                  style={{ padding: '10px 24px', fontWeight: 700, fontSize: '14px' }}
                >
                  {formLoading ? 'Submitting...' : modalMode === 'create' ? 'Submit' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {modalOpen && modalMode === 'view' && selectedEmp && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>Employee Dossier</h3>
              <button className="btn-icon" onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              {(() => {
                const checkInPhoto = selectedEmp.todayAttendance?.faceImage || selectedEmp.lastCheckInPhoto || selectedEmp.profileImage;
                return (
                  <>
                    <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img
                          src={checkInPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedEmp.name}`}
                          alt={selectedEmp.name}
                          style={{
                            width: '88px',
                            height: '88px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: checkInPhoto ? '3.5px solid #10b981' : '3px solid #4f46e5',
                            boxShadow: checkInPhoto ? '0 0 16px rgba(16, 185, 129, 0.35)' : 'none',
                          }}
                        />
                        {checkInPhoto && (
                          <span
                            title="Verified Check-In Photo"
                            style={{
                              position: 'absolute',
                              bottom: '2px',
                              right: '2px',
                              background: '#10b981',
                              color: '#fff',
                              borderRadius: '50%',
                              width: '22px',
                              height: '22px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              border: '2px solid #fff',
                            }}
                          >
                            📷
                          </span>
                        )}
                      </div>
                      <h3 style={{ marginTop: '10px', marginBottom: '2px' }}>{selectedEmp.name}</h3>
                      <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
                        {selectedEmp.designation} • {selectedEmp.department}
                      </p>
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className={`badge badge-${selectedEmp.status?.toLowerCase()}`}>
                          Account: {selectedEmp.status}
                        </span>
                        {selectedEmp.todayAttendance ? (
                          <span
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 600,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: selectedEmp.dutyStatus === 'Checked Out' ? '#eff6ff' : '#ecfdf5',
                              color: selectedEmp.dutyStatus === 'Checked Out' ? '#1d4ed8' : '#047857',
                              border: `1px solid ${selectedEmp.dutyStatus === 'Checked Out' ? '#bfdbfe' : '#a7f3d0'}`,
                            }}
                          >
                            {selectedEmp.dutyStatus === 'Checked Out'
                              ? `🏁 Checked Out (${new Date(selectedEmp.todayAttendance.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
                              : `🟢 Checked In (${new Date(selectedEmp.todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '11.5px',
                              color: '#64748b',
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              padding: '3px 8px',
                              borderRadius: '6px',
                            }}
                          >
                            ⚪ Not Checked In Today
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dedicated Check-In Photo Card */}
                    {checkInPhoto && (
                      <div
                        style={{
                          marginBottom: '18px',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          background: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                        }}
                      >
                        <img
                          src={checkInPhoto}
                          alt="Check-in Photo"
                          style={{
                            width: '58px',
                            height: '58px',
                            borderRadius: '10px',
                            objectFit: 'cover',
                            border: '2px solid #10b981',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#047857', background: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>
                              📸 Check-In Captured Photo
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>
                            {selectedEmp.todayAttendance?.checkIn
                              ? `Captured today at ${new Date(selectedEmp.todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                              : selectedEmp.lastCheckInTime
                              ? `Captured on ${new Date(selectedEmp.lastCheckInTime).toLocaleString()}`
                              : 'Live Camera Capture Recorded'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#15803d' }}>
                            Verified employee camera capture during attendance check-in.
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', fontSize: '13.5px' }}>
                <div>
                  <strong style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>Employee ID</strong>
                  <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#4f46e5' }}>{selectedEmp.employeeId}</span>
                </div>
                <div>
                  <strong style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>Username</strong>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{selectedEmp.username ? `@${selectedEmp.username}` : 'Not assigned'}</span>
                </div>
                <div>
                  <strong style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>Email</strong>
                  <span>{selectedEmp.email}</span>
                </div>
                <div>
                  <strong style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>Phone</strong>
                  <span>{selectedEmp.phone || 'Not provided'}</span>
                </div>
                <div>
                  <strong style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>Reporting Manager</strong>
                  <span>{selectedEmp.manager?.name || selectedEmp.managerName || 'None'}</span>
                </div>
                <div>
                  <strong style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>Joining Date</strong>
                  <span>{new Date(selectedEmp.joiningDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <strong style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>Salary</strong>
                  <span>${selectedEmp.salary?.toLocaleString()}/yr</span>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <strong style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>Address</strong>
                  <span>{selectedEmp.address || 'No registered address'}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#dc2626' }}>
                <AlertTriangle size={22} />
                <h3>Confirm Deletion</h3>
              </div>
              <button className="btn-icon" onClick={() => setDeleteConfirmId(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '14px', color: '#475569' }}>
                Are you sure you want to permanently delete this employee? This will revoke system login credentials and remove attendance history.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(deleteConfirmId)}
              >
                Yes, Delete Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Full Size Captured Photo Modal */}
      {previewPhotoModal && (
        <div
          className="modal-overlay"
          style={{
            zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <div
            className="modal-content"
            style={{
              maxWidth: '460px',
              padding: 0,
              overflow: 'hidden',
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div
              style={{
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.7), transparent)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} color="#10b981" />
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                  Captured Check-In Photo
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhotoModal(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px', textAlign: 'center', background: '#020617' }}>
              <img
                src={previewPhotoModal.photo}
                alt="Captured Check-In"
                style={{
                  width: '100%',
                  maxHeight: '360px',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  border: '2px solid #10b981',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
                }}
              />
            </div>

            <div style={{ padding: '16px 20px', background: '#0f172a', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                    {previewPhotoModal.name}
                  </h4>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {previewPhotoModal.employeeId} • {previewPhotoModal.designation} ({previewPhotoModal.department})
                  </div>
                </div>
                {previewPhotoModal.dutyStatus && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#34d399',
                      background: 'rgba(16, 185, 129, 0.15)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    {previewPhotoModal.dutyStatus}
                  </span>
                )}
              </div>

              {previewPhotoModal.time && (
                <div style={{ fontSize: '12px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Recorded:</span>
                  <strong style={{ color: '#38bdf8' }}>
                    {new Date(previewPhotoModal.time).toLocaleString()}
                  </strong>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
