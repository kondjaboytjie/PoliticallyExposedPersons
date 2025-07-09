import React, { useContext, useState, useEffect, useRef } from 'react';
import { UserContext } from './UserContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const { user, setUser } = useContext(UserContext);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBurgerMenu, setShowBurgerMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const userMenuRef = useRef();
  const burgerMenuRef = useRef();

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

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target) &&
        !e.target.closest('.navbar-user')
      ) {
        setShowUserMenu(false);
      }

      if (
        burgerMenuRef.current &&
        !burgerMenuRef.current.contains(e.target) &&
        !e.target.closest('.burger-icon')
      ) {
        setShowBurgerMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="navbar">
      {/* Left: Burger Icon */}
      <div className="burger-icon" onClick={() => setShowBurgerMenu(!showBurgerMenu)}>
        &#9776;
      </div>

      {/* Center: Page Title */}
      <div className="navbar-title">{pageTitle}</div>

      {/* Right: User Icon */}
      <div className="navbar-user" onClick={() => setShowUserMenu(!showUserMenu)}>
        <img
          src="https://www.svgrepo.com/show/382106/logo.svg"
          alt="User Icon"
        />
      </div>

      {/* Burger Dropdown */}
      {showBurgerMenu && (
        <div className="main-menu" ref={burgerMenuRef}>
          <div onClick={() => { navigate('/pips'); setShowBurgerMenu(false); }}>PIPs</div>
          <div onClick={() => { navigate('/search'); setShowBurgerMenu(false); }}>Search PIPs</div>
          <div onClick={() => { navigate('/audit'); setShowBurgerMenu(false); }}>Audit Trail</div>
          <div onClick={() => { navigate('/datacapturer'); setShowBurgerMenu(false); }}>Data Capturer</div>
          <div onClick={() => { navigate('/administrator'); setShowBurgerMenu(false); }}>Administrator</div>
        </div>
      )}

      {/* User Dropdown */}
      {showUserMenu && (
        <div className="logout-menu" ref={userMenuRef}>
          <div className="user-email">{user.email}</div>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
}

export default Navbar;
