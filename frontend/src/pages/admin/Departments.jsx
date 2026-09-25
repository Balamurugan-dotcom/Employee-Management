import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Building2, Plus, Users, Trash2 } from 'lucide-react';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ departmentName: '', departmentCode: '', description: '' });

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/departments');
      if (res.data.success) {
        setDepartments(res.data.departments);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/departments', formData);
      if (res.data.success) {
        setModalOpen(false);
        setFormData({ departmentName: '', departmentCode: '', description: '' });
        fetchDepartments();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create department');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this department?')) return;
    try {
      await api.delete(`/departments/${id}`);
      fetchDepartments();
    } catch (err) {
      alert('Delete failed');
    }
  };

  return (
    <div>
      <div className="table-toolbar" style={{ borderRadius: '12px', marginBottom: '24px', background: '#fff', border: '1px solid #e2e8f0' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Company Departments</h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>Configure functional units and structure</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={18} />
          <span>Add Department</span>
        </button>
      </div>

      <div className="responsive-cards-grid">
        {loading ? (
          <div className="spinner" style={{ margin: '40px auto' }}></div>
        ) : (
          departments.map((dept) => (
            <div key={dept._id} className="table-card" style={{ padding: '24px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#f5f3ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building2 size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{dept.departmentName}</h3>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Code: {dept.departmentCode}</span>
                  </div>
                </div>
                <button className="btn-icon delete" onClick={() => handleDelete(dept._id)}>
                  <Trash2 size={15} />
                </button>
              </div>

              <p style={{ fontSize: '13px', color: '#475569', margin: '14px 0', minHeight: '38px' }}>
                {dept.description || 'Dedicated organizational branch'}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '14px', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>Team Size:</span>
                <span className="badge badge-active">
                  <Users size={12} /> {dept.employeeCount || 0} Staff
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>Create Department</h3>
              <button className="btn-icon" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Department Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Quality Assurance"
                    value={formData.departmentName}
                    onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Department Code *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. QA"
                    value={formData.departmentCode}
                    onChange={(e) => setFormData({ ...formData, departmentCode: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    className="form-control"
                    placeholder="Department mission and scope"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Department</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
