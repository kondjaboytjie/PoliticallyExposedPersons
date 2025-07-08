import React, { useContext, useState } from 'react';
import { UserContext } from './UserContext';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const { user, setUser } = useContext(UserContext);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="navbar">
      <div className="navbar-user" onClick={() => setShowMenu(!showMenu)}>
        <img
          src="https://www.svgrepo.com/show/382106/logo.svg"
          alt="User Icon"
        />
      </div>

      {showMenu && (
        <div className="logout-menu">
          <div className="user-email">{user.email}</div>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
}

export default Navbar;
