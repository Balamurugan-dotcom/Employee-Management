import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardCard from '../../components/DashboardCard';
import {
  Users,
  CalendarCheck,
  UserX,
  Clock,
  CheckSquare,
  CheckCircle2,
  ArrowRight,
  Check,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ManagerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchManagerData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/manager');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagerData();
  }, []);

  const handleApproveLeave = async (id) => {
    try {
      await api.put(`/leaves/${id}/approve`);
      fetchManagerData();
    } catch (e) {
      alert('Approval failed');
    }
  };

  const handleRejectLeave = async (id) => {
    try {
      await api.put(`/leaves/${id}/reject`, { rejectionReason: 'Declined by manager' });
      fetchManagerData();
    } catch (e) {
      alert('Rejection failed');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const { cards, recentTasks = [], pendingTeamLeaves = [] } = data || {};

  return (
    <div>
      {/* 6 Manager Dashboard Cards */}
      <div className="dashboard-grid">
        <DashboardCard
          title="Total Team Members"
          value={cards?.totalTeamMembers ?? 0}
          icon={Users}
          color="#4f46e5"
          bg="#eef2ff"
          subtitle="Assigned staff"
        />
        <DashboardCard
          title="Present Today"
          value={cards?.presentToday ?? 0}
          icon={CalendarCheck}
          color="#10b981"
          bg="#ecfdf5"
          subtitle="Checked in"
        />
        <DashboardCard
          title="Absent Today"
          value={cards?.absentToday ?? 0}
          icon={UserX}
          color="#ef4444"
          bg="#fef2f2"
          subtitle="Not logged in"
        />
        <DashboardCard
          title="Pending Leave Requests"
          value={cards?.pendingLeaveRequests ?? 0}
          icon={Clock}
          color="#f59e0b"
          bg="#fffbeb"
          subtitle="Needs review"
        />
        <DashboardCard
          title="Active Tasks"
          value={cards?.activeTasks ?? 0}
          icon={CheckSquare}
          color="#0ea5e9"
          bg="#f0f9ff"
          subtitle="In progress / pending"
        />
        <DashboardCard
          title="Completed Tasks"
          value={cards?.completedTasks ?? 0}
          icon={CheckCircle2}
          color="#8b5cf6"
          bg="#f5f3ff"
          subtitle="Finished"
        />
      </div>

      <div className="dashboard-tables-grid">
        {/* Pending Team Leaves */}
        <div className="table-card">
          <div className="table-toolbar">
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Team Leave Applications</h3>
            <Link to="/manager/leaves" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Team Member</th>
                  <th>Leave Type</th>
                  <th>Dates</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingTeamLeaves.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                      No pending leave requests from your team.
                    </td>
                  </tr>
                ) : (
                  pendingTeamLeaves.map((l) => (
                    <tr key={l._id}>
                      <td>
                        <div className="user-cell">
                          <img
                            src={l.employee?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${l.employee?.name}`}
                            alt=""
                          />
                          <div className="user-cell-meta">
                            <div className="name">{l.employee?.name}</div>
                            <div className="email">{l.employee?.designation}</div>
                          </div>
                        </div>
                      </td>
                      <td>{l.leaveType}</td>
                      <td style={{ fontSize: '12px' }}>
                        {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-success"
                            style={{ padding: '4px 8px', fontSize: '11.5px' }}
                            onClick={() => handleApproveLeave(l._id)}
                          >
                            <Check size={12} /> Approve
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '4px 8px', fontSize: '11.5px' }}
                            onClick={() => handleRejectLeave(l._id)}
                          >
                            <X size={12} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Team Tasks */}
        <div className="table-card">
          <div className="table-toolbar">
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Recent Team Tasks</h3>
            <Link to="/manager/tasks" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
              Manage Tasks <ArrowRight size={14} />
            </Link>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Assignee</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                      No tasks assigned yet.
                    </td>
                  </tr>
                ) : (
                  recentTasks.map((t) => (
                    <tr key={t._id}>
                      <td>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{t.title}</span>
                      </td>
                      <td>
                        <div className="user-cell">
                          <img
                            src={t.assignedTo?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${t.assignedTo?.name}`}
                            alt=""
                          />
                          <div className="user-cell-meta">
                            <div className="name">{t.assignedTo?.name}</div>
                          </div>
                        </div>
                      </td>
                      <td>{new Date(t.dueDate).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge badge-${t.status.toLowerCase().replace(/\s+/g, '')}`}>
                          {t.status}
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
    </div>
  );
};

export default ManagerDashboard;
