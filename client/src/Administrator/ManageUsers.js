import React, { useEffect, useState } from 'react';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import '../Pages.css';

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState('first_name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    roles: []
  });
  const [message, setMessage] = useState('');
  const [showMessagePopup, setShowMessagePopup] = useState(false);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/users/usersfetch', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching users', err);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/users/rolesfetch');
      const data = await res.json();
      setRoles(data);
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  const handleSort = (col) => {
    const order = sortColumn === col && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortColumn(col);
    setSortOrder(order);
  };

  const filtered = searchTerm
    ? users.filter(user =>
        Object.values(user).join(' ').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : users;

  const sorted = filtered.sort((a, b) => {
    const valA = (a[sortColumn] || '').toString().toLowerCase();
    const valB = (b[sortColumn] || '').toString().toLowerCase();
    return valA < valB ? (sortOrder === 'asc' ? -1 : 1) : valA > valB ? (sortOrder === 'asc' ? 1 : -1) : 0;
  });

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const currentUsers = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await fetch(`http://localhost:5000/api/users/userdelete${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user', err);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setShowMessagePopup(false);

    if (formData.roles.length === 0) {
      setMessage('❌ Please select at least one role');
      setShowMessagePopup(true);
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/users/useradd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to create user');

      setMessage('✅ User added successfully');
      setShowMessagePopup(true);
      setFormData({ first_name: '', last_name: '', email: '', password: '', roles: [] });
      fetchUsers();
      setShowForm(false);
    } catch (err) {
      setMessage('❌ ' + err.message);
      setShowMessagePopup(true);
    }
  };

  const toggleRole = (roleName) => {
    setFormData(prev => {
      const current = prev.roles.includes(roleName)
        ? prev.roles.filter(r => r !== roleName)
        : [...prev.roles, roleName];
      return { ...prev, roles: current };
    });
  };

  return (
    <div className="page-container">
      <div className="table-controls">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
        <div className="button-group">
          <button className="export-button" onClick={() => setShowForm(!showForm)}>
            <FaPlus style={{ marginRight: 5 }} />
            Add User
          </button>
        </div>
      </div>

      {showForm && (
        <form className="table-container" onSubmit={handleFormSubmit}>
          <h3>Add New User</h3>
          <div className="form-group name-group">
            <input
              type="text"
              placeholder="First Name"
              required
              value={formData.first_name}
              onChange={e => setFormData({ ...formData, first_name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Last Name"
              required
              value={formData.last_name}
              onChange={e => setFormData({ ...formData, last_name: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              placeholder="Password"
              required
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Assign Roles:</label>
            <div className="multi-select">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className={`role-chip ${formData.roles.includes(role.name) ? 'selected' : ''}`}
                  onClick={() => toggleRole(role.name)}
                >
                  {role.name}
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="export-button">Submit</button>
          <button
            type="button"
            className="export-button"
            style={{ marginLeft: '1rem', background: '#ccc' }}
            onClick={() => {
              setFormData({ first_name: '', last_name: '', email: '', password: '', roles: [] });
              setShowForm(false);
            }}
          >
            Cancel
          </button>
        </form>
      )}

      {showMessagePopup && (
        <div className="message-popup">
          <div className="message-popup-content">
            <p>{message}</p>
            <button onClick={() => setShowMessagePopup(false)} className="close-popup-button">Close</button>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="pips-table">
          <thead>
            <tr>
              <th>#</th>
              <th onClick={() => handleSort('first_name')}>First Name</th>
              <th onClick={() => handleSort('last_name')}>Last Name</th>
              <th onClick={() => handleSort('email')}>Email</th>
              <th>Roles</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user, index) => (
              <tr key={user.id}>
                <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                <td>{user.first_name}</td>
                <td>{user.last_name}</td>
                <td>{user.email}</td>
                <td>{user.roles?.join(', ') || '-'}</td>
                <td>{user.is_active ? 'Active' : 'Inactive'}</td>
                <td>
                  <button className="action-button" title="Edit"><FaEdit /></button>
                  <button
                    className="action-button"
                    title="Delete"
                    onClick={() => handleDelete(user.id)}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>← Prev</button>
        {[...Array(totalPages)].map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentPage(idx + 1)}
            className={currentPage === idx + 1 ? 'active' : ''}
          >
            {idx + 1}
          </button>
        ))}
        <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>Next →</button>
      </div>
    </div>
  );
}

export default ManageUsers;
