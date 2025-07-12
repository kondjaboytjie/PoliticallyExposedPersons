import React, { useEffect, useState } from 'react';
import { FaEdit, FaPlus, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { CSVLink } from 'react-csv';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../Pages.css';

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState('first_name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
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
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
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
    ? users.filter(u =>
        Object.values(u).join(' ').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : users;

  const sorted = filtered.sort((a, b) => {
    const valA = (a[sortColumn] || '').toString().toLowerCase();
    const valB = (b[sortColumn] || '').toString().toLowerCase();
    return valA < valB ? (sortOrder === 'asc' ? -1 : 1) : valA > valB ? (sortOrder === 'asc' ? 1 : -1) : 0;
  });

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const currentUsers = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const renderPagination = () => {
    const pages = [];
    const total = totalPages;
    const current = currentPage;

    if (total <= 5) {
      for (let i = 1; i <= total; i++) {
        pages.push(
          <button key={i} className={current === i ? 'active' : ''} onClick={() => setCurrentPage(i)}>
            {i}
          </button>
        );
      }
    } else {
      pages.push(
        <button key={1} className={current === 1 ? 'active' : ''} onClick={() => setCurrentPage(1)}>
          1
        </button>
      );

      if (current > 3) pages.push(<span key="start-ellipsis">...</span>);

      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(
          <button key={i} className={current === i ? 'active' : ''} onClick={() => setCurrentPage(i)}>
            {i}
          </button>
        );
      }

      if (current < total - 2) pages.push(<span key="end-ellipsis">...</span>);

      pages.push(
        <button key={total} className={current === total ? 'active' : ''} onClick={() => setCurrentPage(total)}>
          {total}
        </button>
      );
    }

    return pages;
  };

  const toggleUserStatus = async (id, isActive) => {
    const action = isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      const res = await fetch(`http://localhost:5000/api/users/toggle-status/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update status');

      setMessage(`✅ User ${isActive ? 'deactivated' : 'activated'} successfully`);
      setShowMessagePopup(true);
      fetchUsers();
    } catch (err) {
      setMessage('❌ ' + err.message);
      setShowMessagePopup(true);
    }
  };

  const toggleRole = (roleName) => {
    setFormData(prev => {
      const roles = prev.roles.includes(roleName)
        ? prev.roles.filter(r => r !== roleName)
        : [...prev.roles, roleName];
      return { ...prev, roles };
    });
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
      const url = editMode
        ? `http://localhost:5000/api/users/userupdate/${editId}`
        : 'http://localhost:5000/api/users/useradd';
      const method = editMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to save user');

      setMessage(editMode ? '✅ User updated successfully' : '✅ User added successfully');
      setShowMessagePopup(true);
      resetForm();
      fetchUsers();
    } catch (err) {
      setMessage('❌ ' + err.message);
      setShowMessagePopup(true);
    }
  };

  const handleEdit = (u) => {
    setFormData({
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      password: '',
      roles: u.roles || []
    });
    setEditMode(true);
    setEditId(u.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ first_name: '', last_name: '', email: '', password: '', roles: [] });
    setEditMode(false);
    setEditId(null);
    setShowForm(false);
  };

  const flattenedForExport = users.map(u => ({
    'First Name': u.first_name,
    'Last Name': u.last_name,
    Email: u.email,
    Roles: (u.roles || []).join(', '),
    Status: u.is_active ? 'Active' : 'Inactive',
    'Created At': new Date(u.created_at).toLocaleString()
  }));

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(flattenedForExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, 'users.xlsx');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['First Name', 'Last Name', 'Email', 'Roles', 'Status', 'Created At']],
      body: flattenedForExport.map(o => Object.values(o))
    });
    doc.save('users.pdf');
  };

  return (
    <div className="page-container">
      <div className="table-controls">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
        />

        <div className="button-group">
          <button
            className="export-button"
            onClick={() => {
              setEditMode(false);
              setEditId(null);
              setShowForm(true);
              setFormData({ first_name: '', last_name: '', email: '', password: '', roles: [] });
            }}
          >
            <FaPlus style={{ marginRight: 5 }} /> Add User
          </button>

          <CSVLink filename="users.csv" data={flattenedForExport} className="export-button">
            Export CSV
          </CSVLink>
          <button className="export-button" onClick={exportExcel}>Export Excel</button>
          <button className="export-button" onClick={exportPDF}>Export PDF</button>
        </div>
      </div>

      {showForm && (
        <form className="table-container" onSubmit={handleFormSubmit}>
          <h3>{editMode ? 'Edit User' : 'Add New User'}</h3>
          <div className="form-group name-group">
            <input
              placeholder="First Name"
              required
              value={formData.first_name}
              onChange={e => setFormData({ ...formData, first_name: e.target.value })}
            />
            <input
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
              disabled={editMode}
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              required={!editMode}
            />
          </div>

          <div className="form-group">
            <label>Assign Roles:</label>
            <div className="multi-select">
              {roles.filter(r => r.is_active).map(r => (
                <div
                  key={r.id}
                  className={`role-chip ${formData.roles.includes(r.name) ? 'selected' : ''}`}
                  onClick={() => toggleRole(r.name)}
                >
                  {r.name}
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="export-button">{editMode ? 'Update' : 'Submit'}</button>
          <button type="button" className="export-button" style={{ marginLeft: '1rem', background: '#ccc' }} onClick={resetForm}>
            Cancel
          </button>
        </form>
      )}

      {showMessagePopup && (
        <div className="message-popup">
          <div className="message-popup-content">
            <p>{message}</p>
            <button className="close-popup-button" onClick={() => setShowMessagePopup(false)}>Close</button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '1rem', fontWeight: 'bold', fontSize: '1rem' }}>
        Showing {currentUsers.length} of {filtered.length} users {searchTerm ? `(filtered from ${users.length})` : ''}
      </div>

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
            {currentUsers.map((u, idx) => (
              <tr key={u.id}>
                <td>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                <td>{u.first_name}</td>
                <td>{u.last_name}</td>
                <td>{u.email}</td>
                <td>{u.roles?.join(', ') || '-'}</td>
                <td>{u.is_active ? 'Active' : 'Inactive'}</td>
                <td>
                  <button title="Edit" className="action-button" onClick={() => handleEdit(u)}><FaEdit /></button>
                  <button
                    title={u.is_active ? 'Disable' : 'Enable'}
                    className="action-button"
                    onClick={() => toggleUserStatus(u.id, u.is_active)}
                  >
                    {u.is_active ? <FaToggleOff /> : <FaToggleOn />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button onClick={() => setCurrentPage(c => c - 1)} disabled={currentPage === 1}>← Prev</button>
        {renderPagination()}
        <button onClick={() => setCurrentPage(c => c + 1)} disabled={currentPage === totalPages}>Next →</button>
      </div>
    </div>
  );
}

export default ManageUsers;
