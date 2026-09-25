import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, Mail, Phone, Calendar, Award, Eye, MessageSquare, CheckCircle } from 'lucide-react';

const MyTeam = () => {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [viewModal, setViewModal] = useState(false);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employees/my-team');
      if (res.data.success) {
        setTeam(res.data.team);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleOpenFeedback = (emp) => {
    setSelectedMember(emp);
    setFeedbackText('');
    setFeedbackSent(false);
    setFeedbackModal(true);
  };

  const handleSendFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    // Simulate sending performance review feedback
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackModal(false);
      alert(`Performance feedback successfully recorded for ${selectedMember.name}`);
    }, 800);
  };

  return (
    <div>
      <div className="table-toolbar" style={{ borderRadius: '12px', marginBottom: '24px', background: '#fff', border: '1px solid #e2e8f0' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>My Assigned Team</h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>Staff reporting directly to your managerial supervision</p>
        </div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#4f46e5' }}>
          Total Direct Reports: {team.length} Members
        </div>
      </div>

      <div className="responsive-cards-grid">
        {loading ? (
          <div className="spinner" style={{ margin: '40px auto' }}></div>
        ) : team.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No team members currently assigned under your account.</p>
        ) : (
          team.map((emp) => (
            <div key={emp._id} className="table-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img
                  src={emp.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.name}`}
                  alt=""
                  style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #4f46e5' }}
                />
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{emp.name}</h3>
                  <div style={{ fontSize: '12px', color: '#4f46e5', fontWeight: 600 }}>{emp.designation}</div>
                  <span className={`badge badge-${emp.status.toLowerCase()}`} style={{ marginTop: '4px' }}>
                    {emp.status}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: '13px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={15} color="#94a3b8" />
                  <span>{emp.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={15} color="#94a3b8" />
                  <span>{emp.phone || 'Phone not set'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={15} color="#94a3b8" />
                  <span>Joined: {new Date(emp.joiningDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '7px', fontSize: '12.5px' }}
                  onClick={() => {
                    setSelectedMember(emp);
                    setViewModal(true);
                  }}
                >
                  <Eye size={14} /> Profile
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '7px', fontSize: '12.5px' }}
                  onClick={() => handleOpenFeedback(emp)}
                >
                  <Award size={14} /> Feedback
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Member Details Modal */}
      {viewModal && selectedMember && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Team Member Dossier</h3>
              <button className="btn-icon" onClick={() => setViewModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <img
                  src={selectedMember.profileImage}
                  alt=""
                  style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <h3 style={{ marginTop: '10px' }}>{selectedMember.name}</h3>
                <p style={{ color: '#64748b', fontSize: '13px' }}>{selectedMember.designation} • {selectedMember.department}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', fontSize: '13.5px' }}>
                <div>
                  <strong style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>Employee ID</strong>
                  <span>{selectedMember.employeeId}</span>
                </div>
                <div>
                  <strong style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>Email</strong>
                  <span>{selectedMember.email}</span>
                </div>
                <div>
                  <strong style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>Gender</strong>
                  <span>{selectedMember.gender}</span>
                </div>
                <div>
                  <strong style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>Joining Date</strong>
                  <span>{new Date(selectedMember.joiningDate).toLocaleDateString()}</span>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <strong style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>Address</strong>
                  <span>{selectedMember.address || 'Address on file'}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Performance Feedback Modal */}
      {feedbackModal && selectedMember && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Employee Performance Feedback</h3>
              <button className="btn-icon" onClick={() => setFeedbackModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSendFeedback}>
              <div className="modal-body">
                <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '14px' }}>
                  Provide constructive performance review and feedback for <strong>{selectedMember.name}</strong>.
                </p>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Evaluation Rating</label>
                  <select className="form-control">
                    <option value="5">⭐⭐⭐⭐⭐ Exceeds Expectations (Outstanding)</option>
                    <option value="4">⭐⭐⭐⭐ Meets & Often Exceeds Goals</option>
                    <option value="3">⭐⭐⭐ Meets Required Performance Standards</option>
                    <option value="2">⭐⭐ Needs Improvement</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Managerial Comments & Guidance *</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    placeholder="Describe achievements, project delivery speed, teamwork..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setFeedbackModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={feedbackSent}>
                  {feedbackSent ? 'Submitting...' : 'Submit Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTeam;
