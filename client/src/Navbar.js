import React, { useContext, useState } from 'react';
import { UserContext } from './UserContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const { user, setUser } = useContext(UserContext);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const routeTitles = {
    '/pips': 'Politically Exposed Persons',
    '/search': 'Search PIPs',
    '/audit': 'System Audit Trail',
    '/datacapturer': 'Data Capturer',
    '/administrator': 'Admin Panel',
  };

  const pageTitle = routeTitles[location.pathname] || '';

  if (!user) return null;

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="toggle-btn" onClick={() => setCollapsed(!collapsed)}>
          ☰
        </div>
        {!collapsed && <div className="page-title">{pageTitle}</div>}
      </div>

      {!collapsed && (
        <div className="menu">
          <div
            className={location.pathname === '/pips' ? 'active' : ''}
            onClick={() => navigate('/pips')}
          >
            <span role="img" aria-label="person">👤</span> PIPs
          </div>
          <div
            className={location.pathname === '/search' ? 'active' : ''}
            onClick={() => navigate('/search')}
          >
            <span role="img" aria-label="search">🔍</span> Search PIPs
          </div>
          <div
            className={location.pathname === '/audit' ? 'active' : ''}
            onClick={() => navigate('/audit')}
          >
            <span role="img" aria-label="clipboard">📋</span> Audit Trail
          </div>
          <div
            className={location.pathname === '/datacapturer' ? 'active' : ''}
            onClick={() => navigate('/datacapturer')}
          >
            <span role="img" aria-label="pencil">✏️</span> Data Capturer
          </div>
          <div
            className={location.pathname === '/administrator' ? 'active' : ''}
            onClick={() => navigate('/administrator')}
          >
            <span role="img" aria-label="gear">⚙️</span> Administrator
          </div>
        </div>
      )}

      {!collapsed && (
        <div className="sidebar-footer">
          <div className="user-email">{user.email}</div>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
}

export default Navbar;
