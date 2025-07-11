import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { UserContext } from './UserContext';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/search');
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
      });

      const token = res.data.token;
      localStorage.setItem('token', token);
      const user = { email };
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));

      navigate('/search');
    } catch (err) {
      const error = err.response?.data?.error || 'Server error. Please try again.';
      if (error.includes('inactive')) {
        setErrorMsg('❌ Your account is disabled. Contact an administrator.');
      } else if (error.includes('Invalid credentials')) {
        setErrorMsg('❌ Invalid email or password.');
      } else {
        setErrorMsg('❌ ' + error);
      }
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Politically Exposed Persons (PIP)</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>

        {errorMsg && <div className="login-error">{errorMsg}</div>}
      </form>
    </div>
  );
}

export default Login;
