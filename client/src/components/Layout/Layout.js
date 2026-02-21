import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/vehicles', label: 'Vehicles', icon: '🚚' },
    { path: '/drivers', label: 'Drivers', icon: '👤' },
    { path: '/trips', label: 'Trips', icon: '🗺️' },
    { path: '/maintenance', label: 'Maintenance', icon: '🔧' },
    { path: '/fuel', label: 'Fuel Logs', icon: '⛽' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>🚛 FleetFlow</h2>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      
      <div className="main-content">
        <header className="header">
          <div className="header-left">
            <h1>{menuItems.find(item => item.path === location.pathname)?.label || 'FleetFlow'}</h1>
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="user-name">{user?.full_name}</span>
              <span className="user-role">{user?.role}</span>
            </div>
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>
        
        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

