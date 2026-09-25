import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { CreditCard, Download, CheckCircle, Printer } from 'lucide-react';

const EmployeePayslips = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState(null);

  useEffect(() => {
    api.get('/payroll').then((res) => {
      if (res.data.success) setPayrolls(res.data.payrolls);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <div className="table-card">
        <div className="table-toolbar">
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>My Monthly Payslips</h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>Salary statements, allowances, and tax withholding breakdowns</p>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Basic Pay</th>
                <th>Allowances</th>
                <th>Deductions</th>
                <th>Net Disbursed</th>
                <th>Status</th>
                <th>Statement</th>
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
                    No salary statements available for this period.
                  </td>
                </tr>
              ) : (
                payrolls.map((p) => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: 700, color: '#1e293b' }}>{p.month}</td>
                    <td>${p.basicSalary?.toLocaleString()}</td>
                    <td style={{ color: '#059669' }}>+${p.allowances?.toLocaleString()}</td>
                    <td style={{ color: '#dc2626' }}>-${p.deductions?.toLocaleString()}</td>
                    <td style={{ fontWeight: 800, color: '#4f46e5' }}>${p.netSalary?.toLocaleString()}</td>
                    <td>
                      <span className="badge badge-paid">
                        <CheckCircle size={12} /> {p.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '5px 12px', fontSize: '12px' }}
                        onClick={() => setSelectedSlip(p)}
                      >
                        View Slip
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payslip Modal */}
      {selectedSlip && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>Salary Statement - {selectedSlip.month}</h3>
              <button className="btn-icon" onClick={() => setSelectedSlip(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ background: '#fafafa' }}>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '14px', marginBottom: '14px' }}>
                  <div>
                    <strong style={{ fontSize: '16px', color: '#1e293b' }}>TalentFlow Global Inc.</strong>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Enterprise Payroll Slip</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Payment Date</div>
                    <strong style={{ fontSize: '13px' }}>{new Date(selectedSlip.paymentDate).toLocaleDateString()}</strong>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '13px', marginBottom: '16px' }}>
                  <div><strong>Employee:</strong> {selectedSlip.employee?.name}</div>
                  <div><strong>ID:</strong> {selectedSlip.employee?.employeeId}</div>
                  <div><strong>Department:</strong> {selectedSlip.employee?.department}</div>
                  <div><strong>Payment Method:</strong> Direct Deposit</div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', marginTop: '10px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Item Description</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px' }}>Basic Salary Component</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>${selectedSlip.basicSalary?.toLocaleString()}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px' }}>Allowances & Benefits</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#059669' }}>+${selectedSlip.allowances?.toLocaleString()}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px' }}>Statutory Deductions / Taxes</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#dc2626' }}>-${selectedSlip.deductions?.toLocaleString()}</td>
                    </tr>
                    <tr style={{ background: '#f0f9ff', fontWeight: 800 }}>
                      <td style={{ padding: '10px' }}>Total Net Disbursed</td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#0284c7', fontSize: '16px' }}>
                        ${selectedSlip.netSalary?.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedSlip(null)}>Close</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  window.print();
                }}
              >
                <Printer size={15} /> Print Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePayslips;
