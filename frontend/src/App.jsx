import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

// Pages
import Login from './pages/Login';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import Employees from './pages/admin/Employees';
import Managers from './pages/admin/Managers';
import Departments from './pages/admin/Departments';
import AdminAttendance from './pages/admin/AdminAttendance';
import AdminLeaves from './pages/admin/AdminLeaves';
import AdminProjects from './pages/admin/AdminProjects';
import AdminTasks from './pages/admin/AdminTasks';
import AdminPayroll from './pages/admin/AdminPayroll';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';

// Manager Pages
import ManagerDashboard from './pages/manager/ManagerDashboard';
import MyTeam from './pages/manager/MyTeam';
import ManagerAttendance from './pages/manager/ManagerAttendance';
import ManagerLeaves from './pages/manager/ManagerLeaves';
import ManagerTasks from './pages/manager/ManagerTasks';
import ManagerProjects from './pages/manager/ManagerProjects';
import ManagerPerformance from './pages/manager/ManagerPerformance';
import ManagerReports from './pages/manager/ManagerReports';
import ManagerProfile from './pages/manager/ManagerProfile';

// Employee Pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import Attendance from './pages/employee/Attendance';
import Leave from './pages/employee/Leave';
import Tasks from './pages/employee/Tasks';
import MyProfile from './pages/employee/MyProfile';
import EmployeeProjects from './pages/employee/EmployeeProjects';
import EmployeePayslips from './pages/employee/EmployeePayslips';
import EmployeeNotifications from './pages/employee/EmployeeNotifications';

// Root redirector based on user role
const RootRedirect = () => {
  const { user, token, loading } = useAuth();
  if (loading) return null;
  if (!token || !user) return <Navigate to="/login" replace />;

  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'manager') return <Navigate to="/manager/dashboard" replace />;
  if (user.role === 'employee') return <Navigate to="/employee/dashboard" replace />;

  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Root Route */}
          <Route path="/" element={<RootRedirect />} />

          {/* Admin Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<DashboardLayout title="Admin Portal" subtitle="Executive Workforce Operations" />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/employees" element={<Employees />} />
              <Route path="/admin/managers" element={<Managers />} />
              <Route path="/admin/departments" element={<Departments />} />
              <Route path="/admin/attendance" element={<AdminAttendance />} />
              <Route path="/admin/leaves" element={<AdminLeaves />} />
              <Route path="/admin/projects" element={<AdminProjects />} />
              <Route path="/admin/tasks" element={<AdminTasks />} />
              <Route path="/admin/payroll" element={<AdminPayroll />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>
          </Route>

          {/* Manager Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['manager']} />}>
            <Route element={<DashboardLayout title="Manager Portal" subtitle="Team Leadership & Project Delivery" />}>
              <Route path="/manager/dashboard" element={<ManagerDashboard />} />
              <Route path="/manager/my-team" element={<MyTeam />} />
              <Route path="/manager/attendance" element={<ManagerAttendance />} />
              <Route path="/manager/leaves" element={<ManagerLeaves />} />
              <Route path="/manager/tasks" element={<ManagerTasks />} />
              <Route path="/manager/projects" element={<ManagerProjects />} />
              <Route path="/manager/performance" element={<ManagerPerformance />} />
              <Route path="/manager/reports" element={<ManagerReports />} />
              <Route path="/manager/profile" element={<ManagerProfile />} />
            </Route>
          </Route>

          {/* Employee Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
            <Route element={<DashboardLayout title="Employee Portal" subtitle="Self-Service & Productivity Center" />}>
              <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
              <Route path="/employee/profile" element={<MyProfile />} />
              <Route path="/employee/attendance" element={<Attendance />} />
              <Route path="/employee/leave" element={<Leave />} />
              <Route path="/employee/tasks" element={<Tasks />} />
              <Route path="/employee/projects" element={<EmployeeProjects />} />
              <Route path="/employee/payslips" element={<EmployeePayslips />} />
              <Route path="/employee/notifications" element={<EmployeeNotifications />} />
            </Route>
          </Route>

          {/* Catch-all 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
