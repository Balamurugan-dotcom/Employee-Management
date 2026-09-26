import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Bell, CheckCircle2, AlertCircle, Sparkles, Building2, User, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ onToggleSidebar, title, subtitle }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notifRef = useRef(null);

  const getRoleNotifications = () => {
    if (user?.role === 'admin') {
      return [
        {
          id: 1,
          title: 'Staff Leave Requests Pending',
          time: '10 min ago',
          desc: 'New leave applications requiring administrative review.',
          unread: true,
          link: '/admin/leaves',
        },
        {
          id: 2,
          title: 'Attendance Auto-Synced',
          time: '1 hour ago',
          desc: 'Organization-wide daily attendance logs synchronized.',
          unread: true,
          link: '/admin/attendance',
        },
        {
          id: 3,
          title: 'Active Project Milestone',
          time: 'Yesterday',
          desc: 'Deliverables tracked across operational departments.',
          unread: false,
          link: '/admin/projects',
        },
      ];
    } else if (user?.role === 'manager') {
      return [
        {
          id: 1,
          title: 'Team Leave Application',
          time: '15 min ago',
          desc: 'A direct report submitted a leave request for approval.',
          unread: true,
          link: '/manager/leaves',
        },
        {
          id: 2,
          title: 'Team Attendance Overview',
          time: '1 hour ago',
          desc: 'Today’s check-in logs for your engineering team.',
          unread: true,
          link: '/manager/attendance',
        },
        {
          id: 3,
          title: 'Project Deliverable Update',
          time: 'Yesterday',
          desc: 'Sprint milestones updated for your assigned projects.',
          unread: false,
          link: '/manager/projects',
        },
      ];
    } else {
      return [
        {
          id: 1,
          title: 'Leave Status Notification',
          time: '30 min ago',
          desc: 'Your leave application was submitted and is pending review.',
          unread: true,
          link: '/employee/leave',
        },
        {
          id: 2,
          title: 'Daily Shift Tracker',
          time: '2 hours ago',
          desc: 'Remember to log your attendance punch for today’s shift.',
          unread: true,
          link: '/employee/attendance',
        },
        {
          id: 3,
          title: 'Assigned Project Update',
          time: 'Yesterday',
          desc: 'Check latest sprint tasks in your contributing projects.',
          unread: false,
          link: '/employee/projects',
        },
      ];
    }
  };

  const notifications = getRoleNotifications();

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (user?.role === 'admin') navigate('/admin/employees');
      else if (user?.role === 'manager') navigate('/manager/my-team');
      else navigate('/employee/tasks');
    }
  };

  const searchPlaceholder =
    user?.role === 'admin'
      ? 'Quick search staff, depts...'
      : user?.role === 'manager'
      ? 'Quick search team members...'
      : 'Quick search my tasks...';

  return (
    <header className="navbar">
      <div className="navbar-left">
        {onToggleSidebar && (
          <button
            type="button"
            className="toggle-sidebar-btn"
            onClick={onToggleSidebar}
            title="Toggle Sidebar Menu"
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="page-title-box">
          <h1>{title || 'Dashboard'}</h1>
          <p>{subtitle || 'Welcome back to your employee management portal'}</p>
        </div>
      </div>

      <div className="navbar-right-tools">
        {/* Global Quick Search Input */}
        <form onSubmit={handleSearchSubmit} className="nav-search-bar">
          <Search size={16} className="nav-search-icon" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="search-shortcut">⌘K</span>
        </form>

        {/* Live System Health Badge */}
        <div className="system-status-pill" title="MERN Backend & MongoDB Connected">
          <span className="status-dot-pulse"></span>
          <span>Cloud Active</span>
        </div>

        {/* Notifications Dropdown (Hidden only in Employee Portal) */}
        {!(user?.role === 'employee' || title === 'Employee Portal') && (
          <div className="notif-wrapper" ref={notifRef}>
            <button
              type="button"
              className="notif-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
            >
              <Bell size={18} />
              <span className="notif-badge">3</span>
            </button>

            {showNotifications && (
              <div className="notif-dropdown">
                <div className="notif-dropdown-header">
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Notifications</h4>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>3 new workforce alerts</span>
                  </div>
                  <button
                    type="button"
                    style={{ background: 'transparent', border: 'none', color: '#4f46e5', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => setShowNotifications(false)}
                  >
                    Mark all read
                  </button>
                </div>

                <div className="notif-dropdown-list">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="notif-dropdown-item"
                      onClick={() => {
                        setShowNotifications(false);
                        if (n.link) navigate(n.link);
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '13px', color: '#1e293b' }}>{n.title}</strong>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{n.time}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Mini Profile Badge */}
        <div className="nav-user-capsule">
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Staff'}`}
            alt=""
            className="nav-user-img"
          />
          <div className="nav-user-meta">
            <span className="nav-user-name">{user?.name?.split(' ')[0] || 'User'}</span>
            <span className="nav-user-role">{user?.role?.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
