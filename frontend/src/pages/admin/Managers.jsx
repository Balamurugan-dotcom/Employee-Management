import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  UserCheck,
  Mail,
  Building,
  Users,
  Plus,
  Phone,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  AlertTriangle,
  Calendar,
  DollarSign,
  BadgeCheck,
} from 'lucide-react';

const Managers = () => {
  const [managers, setManagers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedMgr, setSelectedMgr] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Delete confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // View modal
  const [viewMgr, setViewMgr] = useState(null);

  const initialForm = {
    name: '',
    email: '',
    username: '',
    employeeId: `MGR${Math.floor(100 + Math.random() * 900)}`,
    password: '',
    department: 'Engineering',
    designation: 'Engineering Team Lead & Manager',
    phone: '',
    salary: 95000,
    joiningDate: new Date().toISOString().split('T')[0],
    gender: 'Male',
    address: '',
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchManagers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employees/managers');
      if (res.data.success) {
        setManagers(res.data.managers);
      }
    } catch (e) {
      console.error('Failed to fetch managers', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      if (res.data.success && res.data.departments.length > 0) {
        setDepartments(res.data.departments);
        setFormData((prev) => ({
          ...prev,
          department: res.data.departments[0].departmentName || 'Engineering',
        }));
      }
    } catch (e) {
      console.error('Failed to load departments', e);
    }
  };

  useEffect(() => {
    fetchManagers();
    fetchDepartments();
  }, []);

  const showNotify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 5000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Open Add modal
  const openAddModal = () => {
    setModalMode('create');
    setSelectedMgr(null);
    setModalError('');
    setShowPassword(false);
    setFormData({
      ...initialForm,
      employeeId: `MGR${Math.floor(100 + Math.random() * 900)}`,
      department: departments[0]?.departmentName || 'Engineering',
    });
    setModalOpen(true);
  };

  // Open Edit modal
  const openEditModal = (m) => {
    setModalMode('edit');
    setSelectedMgr(m);
    setModalError('');
    setShowPassword(false);
    setFormData({
      name: m.name || '',
      email: m.email || '',
      username: m.username || '',
      employeeId: m.employeeId || '',
      password: '',
      department: m.department || 'Engineering',
      designation: m.designation || 'Team Manager',
      phone: m.phone || '',
      salary: m.salary || 95000,
      joiningDate: m.joiningDate ? m.joiningDate.split('T')[0] : new Date().toISOString().split('T')[0],
      gender: m.gender || 'Male',
      address: m.address || '',
    });
    setModalOpen(true);
  };

  // Submit handler for both create and edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!formData.name.trim() || !formData.email.trim()) {
      setModalError('Full name and email address are required.');
      return;
    }

    if (modalMode === 'create') {
      if (!formData.username.trim()) {
        setModalError('Username is required.');
        return;
      }
      if (!formData.employeeId.trim()) {
        setModalError('Manager Employee ID is required.');
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        setModalError('Password is required and must be at least 6 characters long.');
        return;
      }
    }

    try {
      setFormLoading(true);

      if (modalMode === 'create') {
        const res = await api.post('/employees', {
          ...formData,
          role: 'manager',
        });
        if (res.data.success) {
          showNotify('success', `Manager '${formData.name}' created successfully!`);
          setModalOpen(false);
          setFormData(initialForm);
          fetchManagers();
        }
      } else {
        // Edit: find the employee record by employeeId
        const payload = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          department: formData.department,
          designation: formData.designation,
          salary: formData.salary,
          joiningDate: formData.joiningDate,
          gender: formData.gender,
          address: formData.address,
        };
        if (formData.password && formData.password.trim().length >= 6) {
          payload.password = formData.password.trim();
        }

        // Find employee record by employeeId from selected manager
        const empRes = await api.get('/employees', { params: { role: 'manager' } });
        const empRecord = empRes.data.employees?.find(
          (e) => e.employeeId === selectedMgr.employeeId || e.user === selectedMgr._id
        );

        let updated = false;
        if (empRecord) {
          await api.put(`/employees/${empRecord._id}`, payload);
          updated = true;
        }

        if (!updated) {
          // fallback: search all employees
          const allEmp = await api.get('/employees', { params: { role: 'manager' } });
          const found = allEmp.data.employees?.find((e) => e.employeeId === selectedMgr.employeeId);
          if (found) {
            await api.put(`/employees/${found._id}`, payload);
          }
        }

        showNotify('success', `Manager '${formData.name}' updated successfully!`);
        setModalOpen(false);
        fetchManagers();
      }
    } catch (err) {
      setModalError(err.response?.data?.message || `Failed to ${modalMode === 'create' ? 'create' : 'update'} manager account.`);
    } finally {
      setFormLoading(false);
    }
  };

  // Delete manager
  const handleDelete = async (mgr) => {
    try {
      setDeleteLoading(true);
      // Find employee record for this manager to get _id
      const empRes = await api.get('/employees', { params: { role: 'manager' } });
      const empRecord = empRes.data.employees?.find(
        (e) => e.employeeId === mgr.employeeId
      );

      if (empRecord) {
        await api.delete(`/employees/${empRecord._id}`);
      } else {
        throw new Error('Manager employee record not found.');
      }

      showNotify('success', `Manager '${mgr.name}' has been removed.`);
      setDeleteConfirmId(null);
      fetchManagers();
    } catch (err) {
      showNotify('danger', err.response?.data?.message || err.message || 'Failed to delete manager.');
      setDeleteConfirmId(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      {notification.message && (
        <div className={`alert alert-${notification.type}`} style={{ marginBottom: '20px' }}>
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Action Header */}
      <div
        className="table-toolbar"
        style={{
          borderRadius: '12px',
          marginBottom: '24px',
          background: '#fff',
          border: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Management Leadership</h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>Designated Managers responsible for department teams</p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={openAddModal}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 700 }}
        >
          <Plus size={18} />
          <span>Add Manager</span>
        </button>
      </div>

      {/* Managers Grid Cards */}
      <div className="responsive-cards-grid">
        {loading ? (
          <div className="spinner" style={{ margin: '40px auto' }}></div>
        ) : managers.length === 0 ? (
          <div
            className="table-card"
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              gridColumn: '1 / -1',
              color: '#64748b',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#94a3b8',
              }}
            >
              <Users size={32} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
              No Managers Registered Yet
            </h3>
            <p style={{ fontSize: '14px', maxWidth: '420px', margin: '0 auto 20px', color: '#64748b' }}>
              Create your organization's first Department Manager to lead project deliverables and supervise team members.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={openAddModal}
              style={{ padding: '10px 22px', fontWeight: 600 }}
            >
              <Plus size={16} /> Add First Manager
            </button>
          </div>
        ) : (
          managers.map((m) => (
            <div
              key={m._id}
              className="table-card"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              {/* Card Header: Avatar + Name + Edit/Delete */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                {m.profileImage ? (
                  <img
                    src={m.profileImage}
                    alt={m.name}
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '12px',
                      objectFit: 'cover',
                      border: '2px solid #e2e8f0',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #0ea5e9, #4f46e5)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <UserCheck size={26} />
                  </div>
                )}

                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#0f172a',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {m.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        background: '#e0f2fe',
                        color: '#0369a1',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontWeight: 700,
                      }}
                    >
                      {m.employeeId || 'MGR-LEAD'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                      {m.designation || 'Team Manager'}
                    </span>
                  </div>
                </div>

                {/* View, Edit & Delete Buttons */}
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    type="button"
                    title="View Manager Details"
                    onClick={() => setViewMgr(m)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      color: '#0ea5e9',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f0f9ff';
                      e.currentTarget.style.borderColor = '#bae6fd';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    type="button"
                    title="Edit Manager"
                    onClick={() => openEditModal(m)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      color: '#4f46e5',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#eef2ff';
                      e.currentTarget.style.borderColor = '#c7d2fe';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    type="button"
                    title="Delete Manager"
                    onClick={() => setDeleteConfirmId(m._id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      color: '#ef4444',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#fef2f2';
                      e.currentTarget.style.borderColor = '#fecaca';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Card Body: Details */}
              <div
                style={{
                  fontSize: '13px',
                  color: '#475569',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building size={15} color="#64748b" />
                  <span style={{ fontWeight: 600, color: '#334155' }}>
                    {m.department || 'General Management'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={15} color="#64748b" />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.email}
                  </span>
                </div>
                {m.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={15} color="#64748b" />
                    <span>{m.phone}</span>
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '4px',
                    paddingTop: '10px',
                    borderTop: '1px dashed #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={15} color="#4f46e5" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#4f46e5' }}>
                      {m.teamCount ?? 0} Direct Reports
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      background: '#ecfdf5',
                      color: '#059669',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 600,
                    }}
                  >
                    Active Lead
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* View Manager Modal */}
      {viewMgr && (
        <div className="modal-overlay" onClick={() => setViewMgr(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            {/* Header */}
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {viewMgr.profileImage ? (
                  <img
                    src={viewMgr.profileImage}
                    alt={viewMgr.name}
                    style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', border: '2px solid #e2e8f0' }}
                  />
                ) : (
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #0ea5e9, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <UserCheck size={24} />
                  </div>
                )}
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>{viewMgr.name}</h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '3px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                      {viewMgr.employeeId || 'MGR'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{viewMgr.designation || 'Team Manager'}</span>
                  </div>
                </div>
              </div>
              <button type="button" className="btn-icon" onClick={() => setViewMgr(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="modal-body" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                {/* Department */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Department</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e293b', fontWeight: 600 }}>
                    <Building size={15} color="#64748b" />
                    {viewMgr.department || 'General Management'}
                  </div>
                </div>

                {/* Team Size */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Direct Reports</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4f46e5', fontWeight: 600 }}>
                    <Users size={15} />
                    {viewMgr.teamCount ?? 0} Members
                  </div>
                </div>

                {/* Email */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Email</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e293b' }}>
                    <Mail size={15} color="#64748b" />
                    {viewMgr.email}
                  </div>
                </div>

                {/* Phone */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Phone</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e293b' }}>
                    <Phone size={15} color="#64748b" />
                    {viewMgr.phone || '—'}
                  </div>
                </div>

                {/* Salary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Annual Salary</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e293b', fontWeight: 600 }}>
                    <DollarSign size={15} color="#64748b" />
                    {viewMgr.salary ? `$${Number(viewMgr.salary).toLocaleString()}` : '—'}
                  </div>
                </div>

                {/* Status */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Status</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BadgeCheck size={15} color="#16a34a" />
                    <span style={{ fontSize: '12px', fontWeight: 600, background: '#ecfdf5', color: '#059669', padding: '2px 10px', borderRadius: '6px' }}>
                      Active Lead
                    </span>
                  </div>
                </div>

                {/* Employee ID */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Employee ID</span>
                  <div style={{ fontWeight: 700, color: '#0369a1', fontSize: '14px' }}>
                    {viewMgr.employeeId || '—'}
                  </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setViewMgr(null)}
                style={{ padding: '9px 20px' }}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => { setViewMgr(null); openEditModal(viewMgr); }}
                style={{ padding: '9px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Edit2 size={14} /> Edit Manager
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deleteConfirmId && (
        <div className="modal-overlay" onClick={() => !deleteLoading && setDeleteConfirmId(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px', textAlign: 'center', padding: '32px 28px' }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#ef4444',
              }}
            >
              <AlertTriangle size={28} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              Remove Manager?
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
              This will permanently delete the manager account and all associated login credentials. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleteLoading}
                style={{ padding: '10px 20px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  const mgr = managers.find((m) => m._id === deleteConfirmId);
                  if (mgr) handleDelete(mgr);
                }}
                disabled={deleteLoading}
                style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Trash2 size={15} />
                {deleteLoading ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Manager */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => !formLoading && setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: modalMode === 'edit' ? '#f0fdf4' : '#e0f2fe',
                    color: modalMode === 'edit' ? '#16a34a' : '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {modalMode === 'edit' ? <Edit2 size={20} /> : <UserCheck size={20} />}
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
                    {modalMode === 'edit' ? `Edit Manager — ${selectedMgr?.name}` : 'Register New Manager'}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>
                    {modalMode === 'edit'
                      ? 'Update manager profile and department details'
                      : 'Create management account with team supervision access'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => !formLoading && setModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                {modalError && (
                  <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
                    <AlertCircle size={16} />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                  {/* Full Name */}
                  <div className="form-group col-span-2">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      placeholder="e.g. Robert Oppenheimer"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      placeholder="e.g. manager@ems.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      readOnly={modalMode === 'edit'}
                      style={modalMode === 'edit' ? { background: '#f8fafc', color: '#94a3b8' } : {}}
                    />
                  </div>

                  {/* Username — only for create */}
                  {modalMode === 'create' && (
                    <div className="form-group">
                      <label className="form-label">Username *</label>
                      <input
                        type="text"
                        name="username"
                        className="form-control"
                        placeholder="e.g. robertopp"
                        value={formData.username}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  )}

                  {/* Manager ID — only for create */}
                  {modalMode === 'create' && (
                    <div className="form-group">
                      <label className="form-label">Manager Employee ID *</label>
                      <input
                        type="text"
                        name="employeeId"
                        className="form-control"
                        placeholder="e.g. MGR101"
                        value={formData.employeeId}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  )}

                  {/* Password */}
                  <div className="form-group">
                    <label className="form-label">
                      {modalMode === 'edit' ? 'New Password (leave blank to keep)' : 'Password *'}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        className="form-control"
                        placeholder={modalMode === 'edit' ? 'Leave blank to keep current' : 'Min 6 characters'}
                        value={formData.password}
                        onChange={handleInputChange}
                        required={modalMode === 'create'}
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
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#64748b',
                        }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Department */}
                  <div className="form-group">
                    <label className="form-label">Supervised Department *</label>
                    <select
                      name="department"
                      className="form-control"
                      value={formData.department}
                      onChange={handleInputChange}
                      required
                    >
                      {departments.length > 0 ? (
                        departments.map((d) => (
                          <option key={d._id} value={d.departmentName}>
                            {d.departmentName}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Engineering">Engineering</option>
                          <option value="Design & UX">Design & UX</option>
                          <option value="Human Resources">Human Resources</option>
                          <option value="Marketing & Growth">Marketing & Growth</option>
                          <option value="Finance & Accounts">Finance & Accounts</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Designation */}
                  <div className="form-group">
                    <label className="form-label">Designation / Title *</label>
                    <input
                      type="text"
                      name="designation"
                      className="form-control"
                      placeholder="e.g. Engineering Lead / Manager"
                      value={formData.designation}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div className="form-group">
                    <label className="form-label">Contact Phone</label>
                    <input
                      type="text"
                      name="phone"
                      className="form-control"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Annual Salary */}
                  <div className="form-group">
                    <label className="form-label">Annual Salary ($)</label>
                    <input
                      type="number"
                      name="salary"
                      className="form-control"
                      value={formData.salary}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>

                  {/* Joining Date */}
                  <div className="form-group">
                    <label className="form-label">Joining Date</label>
                    <input
                      type="date"
                      name="joiningDate"
                      className="form-control"
                      value={formData.joiningDate}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Gender */}
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select
                      name="gender"
                      className="form-control"
                      value={formData.gender}
                      onChange={handleInputChange}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Address */}
                  <div className="form-group col-span-2">
                    <label className="form-label">Work / Office Address</label>
                    <input
                      type="text"
                      name="address"
                      className="form-control"
                      placeholder="e.g. Building B, Level 4, Tech Park"
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={formLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {formLoading
                    ? modalMode === 'edit' ? 'Saving...' : 'Registering...'
                    : modalMode === 'edit' ? 'Save Changes' : 'Create Manager Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Managers;
