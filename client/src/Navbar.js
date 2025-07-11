import React, { useContext, useState, useRef, useEffect } from 'react';
import { UserContext } from './UserContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaUser,
  FaSearch,
  FaClipboardList,
  FaDatabase,
  FaKey,
  FaBars,
  FaUserCircle
} from 'react-icons/fa';
import './Navbar.css';

function Navbar() {
  const { user, setUser } = useContext(UserContext);
  const [collapsed, setCollapsed] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const popupRef = useRef();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const routes = [
    { path: '/pips', label: 'PIPs', icon: <FaUser /> },
    { path: '/search', label: 'Search PIPs', icon: <FaSearch /> },
    { path: '/audit', label: 'Audit Trail', icon: <FaClipboardList /> },
    { path: '/datacapturer', label: 'Data Capturer', icon: <FaDatabase /> },
    { path: '/administrator', label: 'Administrator', icon: <FaKey /> },
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setShowProfilePopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="toggle-btn" onClick={() => setCollapsed(!collapsed)}>
          <FaBars />
        </div>
        {!collapsed && (
          <div className="page-title">
            {routes.find(r => r.path === location.pathname)?.label || ''}
          </div>
        )}
      </div>

      <div className="menu">
        {routes.map(({ path, label, icon }) => (
          <div
            key={path}
            className={`menu-item ${location.pathname === path ? 'active' : ''}`}
            onClick={() => navigate(path)}
            title={collapsed ? label : ''}  // Tooltip on hover when collapsed
          >
            <span className="menu-icon">{icon}</span>
            {!collapsed && <span className="menu-label">{label}</span>}
          </div>
        ))}
      </div>

      {/* Collapsed profile icon */}
      {collapsed && (
        <div
          className="collapsed-profile"
          onClick={() => setShowProfilePopup(!showProfilePopup)}
          title={user.email}  // Tooltip on hover
        >
          <FaUserCircle className="profile-icon" />
        </div>
      )}

      {/* Popout for collapsed profile */}
      {collapsed && showProfilePopup && (
        <div className="profile-popup" ref={popupRef}>
          <div className="user-email">{user.email}</div>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}

      {/* Full footer when expanded */}
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
