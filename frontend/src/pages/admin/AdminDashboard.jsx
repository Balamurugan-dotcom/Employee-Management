import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardCard from '../../components/DashboardCard';
import {
  MonthlyAttendanceChart,
  DepartmentDistributionChart,
  LeaveStatsChart,
} from '../../components/Charts';
import {
  Users,
  UserCheck,
  Building2,
  CalendarCheck,
  UserX,
  Clock,
  FolderGit2,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/admin');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const { cards, charts, recentLeaves = [], recentEmployees = [] } = data || {};

  return (
    <div>
      {error && <div className="alert alert-danger">{error}</div>}

      {/* 7 Admin Dashboard Cards */}
      <div className="dashboard-grid">
        <DashboardCard
          title="Total Employees"
          value={cards?.totalEmployees ?? 0}
          icon={Users}
          color="#4f46e5"
          bg="#eef2ff"
          subtitle="Registered staff"
        />
        <DashboardCard
          title="Total Managers"
          value={cards?.totalManagers ?? 0}
          icon={UserCheck}
          color="#0ea5e9"
          bg="#f0f9ff"
          subtitle="Department leads"
        />
        <DashboardCard
          title="Total Departments"
          value={cards?.totalDepartments ?? 0}
          icon={Building2}
          color="#8b5cf6"
          bg="#f5f3ff"
          subtitle="Operational units"
        />
        <DashboardCard
          title="Present Today"
          value={cards?.presentToday ?? 0}
          icon={CalendarCheck}
          color="#10b981"
          bg="#ecfdf5"
          subtitle="Logged in"
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
          title="Pending Leaves"
          value={cards?.pendingLeaveRequests ?? 0}
          icon={Clock}
          color="#f59e0b"
          bg="#fffbeb"
          subtitle="Awaiting action"
        />
        <DashboardCard
          title="Active Projects"
          value={cards?.activeProjects ?? 0}
          icon={FolderGit2}
          color="#ec4899"
          bg="#fdf2f8"
          subtitle="Underway"
        />
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Monthly Attendance</h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Attendance trends</span>
          </div>
          <MonthlyAttendanceChart data={charts?.monthlyAttendance} />
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Employee Distribution</h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>By Department</span>
          </div>
          <DepartmentDistributionChart data={charts?.departmentDistribution} />
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Leave Statistics</h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Status Breakdown</span>
          </div>
          <LeaveStatsChart data={charts?.leaveStats} />
        </div>
      </div>

      {/* Quick Tables: Recent Leaves & Recent Hires */}
      <div className="dashboard-tables-grid">
        {/* Pending / Recent Leaves */}
        <div className="table-card">
          <div className="table-toolbar">
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Recent Leave Applications</h3>
            <Link to="/admin/leaves" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentLeaves.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>
                      No recent leave applications
                    </td>
                  </tr>
                ) : (
                  recentLeaves.map((l) => (
                    <tr key={l._id}>
                      <td>
                        <div className="user-cell">
                          <img
                            src={l.employee?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${l.employee?.name}`}
                            alt=""
                          />
                          <div className="user-cell-meta">
                            <div className="name">{l.employee?.name || 'Staff'}</div>
                            <div className="email">{l.employee?.department}</div>
                          </div>
                        </div>
                      </td>
                      <td>{l.leaveType}</td>
                      <td>
                        {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                      </td>
                      <td>
                        <span className={`badge badge-${l.status.toLowerCase().replace(/\s+/g, '')}`}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recently Added Employees */}
        <div className="table-card">
          <div className="table-toolbar">
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Recently Joined Employees</h3>
            <Link to="/admin/employees" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
              Manage All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee</th>
                  <th>Designation</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>
                      No employees added yet
                    </td>
                  </tr>
                ) : (
                  recentEmployees.map((emp) => (
                    <tr key={emp._id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{emp.employeeId}</td>
                      <td>
                        <div className="user-cell">
                          <img src={emp.profileImage} alt="" />
                          <div className="user-cell-meta">
                            <div className="name">{emp.name}</div>
                            <div className="email">{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{emp.designation}</td>
                      <td>
                        <span className={`badge badge-${emp.status.toLowerCase()}`}>{emp.status}</span>
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

export default AdminDashboard;
