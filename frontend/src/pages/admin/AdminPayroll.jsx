import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { CreditCard, Plus, DollarSign, CheckCircle } from 'lucide-react';

const AdminPayroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    month: 'September 2026',
    basicSalary: 6000,
    allowances: 500,
    deductions: 300,
    paymentStatus: 'Paid',
  });

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payroll');
      if (res.data.success) setPayrolls(res.data.payrolls);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
    api.get('/employees').then((res) => {
      if (res.data.success) setEmployees(res.data.employees);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/payroll', formData);
      if (res.data.success) {
        setModalOpen(false);
        fetchPayrolls();
      }
    } catch (e) {
      alert('Failed to generate payroll record');
    }
  };

  return (
    <div>
      <div className="table-card">
        <div className="table-toolbar">
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Corporate Payroll Ledger</h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>Salary disbursements, tax withholdings, and pay slips</p>
          </div>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={18} />
            <span>Generate Payslip</span>
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Period</th>
                <th>Basic Salary</th>
                <th>Allowances</th>
                <th>Deductions</th>
                <th>Net Disbursed</th>
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
              ) : payrolls.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                    No payroll disbursements recorded yet.
                  </td>
                </tr>
              ) : (
                payrolls.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div className="user-cell">
                        <img
                          src={p.employee?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.employee?.name}`}
                          alt=""
                        />
                        <div className="user-cell-meta">
                          <div className="name">{p.employee?.name}</div>
                          <div className="email">{p.employee?.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{p.month}</td>
                    <td>${p.basicSalary?.toLocaleString()}</td>
                    <td style={{ color: '#059669' }}>+${p.allowances?.toLocaleString()}</td>
                    <td style={{ color: '#dc2626' }}>-${p.deductions?.toLocaleString()}</td>
                    <td style={{ fontWeight: 800, color: '#1e293b' }}>
                      ${p.netSalary?.toLocaleString()}
                    </td>
                    <td>
                      <span className="badge badge-paid">
                        <CheckCircle size={12} /> {p.paymentStatus}
                      </span>
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
              <h3>Disburse Payroll</h3>
              <button className="btn-icon" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Select Employee *</label>
                  <select
                    className="form-control"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} ({emp.department} - {emp.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Pay Period (Month & Year) *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Basic Pay ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.basicSalary}
                    onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Allowances ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.allowances}
                    onChange={(e) => setFormData({ ...formData, allowances: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Deductions ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.deductions}
                    onChange={(e) => setFormData({ ...formData, deductions: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save & Disburse</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayroll;
