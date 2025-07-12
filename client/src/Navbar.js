import React, { useContext, useState, useRef, useEffect } from 'react';
import { UserContext } from './UserContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaUser, FaSearch, FaClipboardList, FaDatabase,
  FaKey, FaBars, FaUserCircle, FaUsers, FaUserShield
} from 'react-icons/fa';
import './Navbar.css';

function Navbar() {
  const { user, setUser }           = useContext(UserContext);
  const [collapsed, setCollapsed]   = useState(false);
  const [showProfile, setShowProf]  = useState(false);
  const [adminOpen, setAdminOpen]   = useState(false);
  const navigate                    = useNavigate();
  const location                    = useLocation();
  const popupRef                    = useRef();

  /* ─────────── logout ─────────── */
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  /* ─────────── routes ─────────── */
  const mainRoutes = [
    { path: '/pips',          label: 'PIPs',         icon: <FaUser /> },
    { path: '/search',        label: 'Search PIPs',  icon: <FaSearch /> },
    { path: '/audit',         label: 'Audit Trail',  icon: <FaClipboardList /> },
    { path: '/datacapturer',  label: 'Data Capturer',icon: <FaDatabase /> },
  ];

  /* ─────────── outside-click for profile popup ─────────── */
  useEffect(() => {
    const clickOut = e => { if (popupRef.current && !popupRef.current.contains(e.target)) setShowProf(false); };
    document.addEventListener('mousedown', clickOut);
    return () => document.removeEventListener('mousedown', clickOut);
  }, []);

  if (!user) return null;

  /* ─────────── render ─────────── */
  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* header */}
      <div className="sidebar-header">
        <div className="toggle-btn" onClick={() => setCollapsed(!collapsed)}>
          <FaBars />
        </div>
        {!collapsed && (
          <div className="page-title">
            {mainRoutes.find(r => r.path === location.pathname)?.label ||
             (location.pathname.startsWith('/administrator') ? 'Administrator' : '')}
          </div>
        )}
      </div>

      {/* main menu */}
      <div className="menu">
        {mainRoutes.map(({ path, label, icon }) => (
          <div
            key={path}
            className={`menu-item ${location.pathname === path ? 'active' : ''}`}
            onClick={() => navigate(path)}
            title={collapsed ? label : ''}
          >
            <span className="menu-icon">{icon}</span>
            {!collapsed && <span className="menu-label">{label}</span>}
          </div>
        ))}

        {/* administrator dropdown */}
        <div
          className={`menu-item ${location.pathname.startsWith('/administrator') ? 'active' : ''}`}
          onClick={() => !collapsed && setAdminOpen(!adminOpen)}
          title="Administrator"
        >
          <span className="menu-icon"><FaKey /></span>
          {!collapsed && <span className="menu-label">Administrator</span>}
        </div>

        {/* sub-menu */}
        {adminOpen && !collapsed && (
          <div className="submenu">
            <div
              className={`submenu-item ${location.pathname === '/administrator/manageusers' ? 'active' : ''}`}
              onClick={() => navigate('/administrator/manageusers')}
            >
              <FaUsers className="submenu-icon" /> Manage Users
            </div>
            <div
              className={`submenu-item ${location.pathname === '/administrator/manageroles' ? 'active' : ''}`}
              onClick={() => navigate('/administrator/manageroles')}
            >
              <FaUserShield className="submenu-icon" /> Manage Roles
            </div>
          </div>
        )}
      </div>

      {/* collapsed profile icon */}
      {collapsed && (
        <div
          className="collapsed-profile"
          onClick={() => setShowProf(!showProfile)}
          title={user.email}
        >
          <FaUserCircle className="profile-icon" />
        </div>
      )}

      {/* profile pop-up */}
      {collapsed && showProfile && (
        <div className="profile-popup" ref={popupRef}>
          <div className="user-email">{user.email}</div>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}

      {/* footer */}
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
