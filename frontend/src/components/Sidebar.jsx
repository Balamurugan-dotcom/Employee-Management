import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandLogo from './BrandLogo';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  CalendarCheck,
  CalendarDays,
  FolderGit2,
  CheckSquare,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  User,
  Award,
  Bell,
  Briefcase,
  X,
  FileText,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const role = user?.role || 'employee';

  const adminNav = [
    { title: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { title: 'Employees', path: '/admin/employees', icon: Users },
    { title: 'Managers', path: '/admin/managers', icon: UserCheck },
    { title: 'Departments', path: '/admin/departments', icon: Building2 },
    { title: 'Attendance', path: '/admin/attendance', icon: CalendarCheck },
    { title: 'Leave Management', path: '/admin/leaves', icon: CalendarDays },
    { title: 'Projects', path: '/admin/projects', icon: FolderGit2 },
    { title: 'Tasks', path: '/admin/tasks', icon: CheckSquare },
    { title: 'Payroll', path: '/admin/payroll', icon: CreditCard },
    { title: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { title: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const managerNav = [
    { title: 'Dashboard', path: '/manager/dashboard', icon: LayoutDashboard },
    { title: 'My Team', path: '/manager/my-team', icon: Users },
    { title: 'Attendance', path: '/manager/attendance', icon: CalendarCheck },
    { title: 'Leave Requests', path: '/manager/leaves', icon: CalendarDays },
    { title: 'Tasks', path: '/manager/tasks', icon: CheckSquare },
    { title: 'Projects', path: '/manager/projects', icon: FolderGit2 },
    { title: 'Performance', path: '/manager/performance', icon: Award },
    { title: 'Reports', path: '/manager/reports', icon: BarChart3 },
    { title: 'Profile', path: '/manager/profile', icon: User },
  ];

  const employeeNav = [
    { title: 'Dashboard', path: '/employee/dashboard', icon: LayoutDashboard },
    { title: 'My Profile', path: '/employee/profile', icon: User },
    { title: 'Attendance', path: '/employee/attendance', icon: CalendarCheck },
    { title: 'Leave', path: '/employee/leave', icon: CalendarDays },
    { title: 'My Tasks', path: '/employee/tasks', icon: CheckSquare },
    { title: 'Projects', path: '/employee/projects', icon: Briefcase },
    { title: 'Payslips', path: '/employee/payslips', icon: CreditCard },
    { title: 'Notifications', path: '/employee/notifications', icon: Bell },
    { title: 'Daily Reports', path: '/employee/reports', icon: FileText },
  ];

  const currentNav = role === 'admin' ? adminNav : role === 'manager' ? managerNav : employeeNav;

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-badge">
            <BrandLogo size={38} />
            <div className="brand-name">
              TalentFlow
              <span>Enterprise HRMS</span>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              className="sidebar-close-btn"
              onClick={onClose}
              title="Close menu"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">
            {role.toUpperCase()} WORKSPACE
          </div>
          {currentNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon className="icon" />
                <span>{item.title}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-mini-card">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              <div className="user-avatar-placeholder" style={{ background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="user-mini-info">
              <div className="user-mini-name">{user?.name}</div>
              <div className="user-mini-role">{user?.role} • {user?.employeeId || 'ID'}</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="nav-item"
            style={{ marginTop: '10px', color: '#ef4444' }}
          >
            <LogOut className="icon" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
