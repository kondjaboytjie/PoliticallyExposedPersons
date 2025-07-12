import React, { useEffect, useState } from 'react';
import { FaPlus, FaEdit, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../Pages.css';

export default function ManageRoles() {
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [msg, setMsg] = useState('');
  const [showMsg, setShowMsg] = useState(false);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/users/rolesfetch', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        setRoles(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Error fetching roles:', e);
      }
    };
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/users/rolesfetch', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setRoles(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching roles:', e);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg('');
    setShowMsg(false);

    if (!roleName.trim()) {
      setMsg('❌ Role name required');
      setShowMsg(true);
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/users/${editRole ? 'roleupdate' : 'roleadd'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          id: editRole?.id,
          name: roleName.trim(),
          description: roleDesc.trim() || null
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Request failed');

      setMsg(`✅ Role ${editRole ? 'updated' : 'added'}`);
      setShowMsg(true);
      setRoleName('');
      setRoleDesc('');
      setShowForm(false);
      setEditRole(null);
      fetchRoles();
    } catch (e) {
      setMsg('❌ ' + e.message);
      setShowMsg(true);
    }
  };

  const toggleStatus = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/users/roletoggle/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update');
      fetchRoles();
    } catch (e) {
      setMsg('❌ ' + e.message);
      setShowMsg(true);
    }
  };

  const handleEdit = role => {
    setRoleName(role.name);
    setRoleDesc(role.description || '');
    setEditRole(role);
    setShowForm(true);
  };

  const list = search
    ? roles.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    : roles;

  // Export handlers
  const handleExportCSV = () => {
    const csvRows = [['#', 'Role', 'Description'], ...list.map((r, i) => [i + 1, r.name, r.description || '-'])];
    const csv = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'roles.csv';
    a.click();
  };

  const handleExportExcel = () => {
    const ws = utils.json_to_sheet(list.map((r, i) => ({
      '#': i + 1,
      Role: r.name,
      Description: r.description || '-'
    })));
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Roles');
    writeFile(wb, 'roles.xlsx');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Roles List', 14, 16);
    const tableData = list.map((r, i) => [i + 1, r.name, r.description || '-']);
    autoTable(doc, {
      startY: 20,
      head: [['#', 'Role', 'Description']],
      body: tableData,
    });
    doc.save('roles.pdf');
  };

  return (
    <div className="page-container">
      <div className="table-controls">
        <input
          placeholder="Search roles…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="button-group">
          <button className="export-button" onClick={() => { setShowForm(true); setEditRole(null); }}>
            <FaPlus style={{ marginRight: 5 }} /> Add Role
          </button>
          <button className="export-button" onClick={handleExportCSV}>Export CSV</button>
          <button className="export-button" onClick={handleExportExcel}>Export Excel</button>
          <button className="export-button" onClick={handleExportPDF}>Export PDF</button>
        </div>
      </div>

      {showForm && (
        <form className="table-container" onSubmit={handleSubmit}>
          <h3>{editRole ? 'Edit Role' : 'Add New Role'}</h3>
          <div className="form-group">
            <input
              placeholder="Role Name"
              required
              value={roleName}
              onChange={e => setRoleName(e.target.value)}
            />
            <input
              placeholder="Description (optional)"
              value={roleDesc}
              onChange={e => setRoleDesc(e.target.value)}
            />
          </div>
          <button type="submit" className="export-button">Submit</button>
          <button
            type="button"
            className="export-button"
            style={{ marginLeft: '1rem', background: '#ccc' }}
            onClick={() => { setShowForm(false); setRoleName(''); setRoleDesc(''); setEditRole(null); }}
          >
            Cancel
          </button>
        </form>
      )}

      {showMsg && (
        <div className="message-popup">
          <div className="message-popup-content">
            <p>{msg}</p>
            <button className="close-popup-button" onClick={() => setShowMsg(false)}>Close</button>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="pips-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Role</th>
              <th>Description</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r, i) => (
              <tr key={r.id}>
                <td>{i + 1}</td>
                <td>{r.name}</td>
                <td>{r.description || '-'}</td>
                <td>{r.is_active ? 'Active' : 'Inactive'}</td>
                <td>
                  <button onClick={() => handleEdit(r)} title="Edit"><FaEdit /></button>
                  <button onClick={() => toggleStatus(r.id)} title="Toggle Active">
                    {r.is_active ? <FaToggleOn /> : <FaToggleOff />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
