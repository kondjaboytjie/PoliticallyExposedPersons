import React, { useEffect, useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // ✅ Correct way for ESM
import '../Pages.css';

export default function ManageRoles() {
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [roleName, roleNameSet] = useState('');
  const [roleDesc, roleDescSet] = useState('');
  const [msg, msgSet] = useState('');
  const [showMsg, showMsgSet] = useState(false);

  const fetchRoles = async () => {
    try {
      const res = await fetch(
        'http://localhost:5000/api/users/rolesfetch',
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setRoles(await res.json());
    } catch (e) {
      console.error('Error fetching roles:', e);
    }
  };

  useEffect(() => { fetchRoles(); }, []);

  const addRole = async e => {
    e.preventDefault();
    msgSet('');
    showMsgSet(false);

    if (!roleName.trim()) {
      msgSet('❌ Role name required');
      showMsgSet(true);
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/users/roleadd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: roleName.trim(),
          description: roleDesc.trim() || null
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to add role');

      msgSet('✅ Role added');
      showMsgSet(true);
      roleNameSet('');
      roleDescSet('');
      setShowForm(false);
      fetchRoles();
    } catch (e) {
      msgSet('❌ ' + e.message);
      showMsgSet(true);
    }
  };

  const list = search
    ? roles.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    : roles;

  // ────── Export Handlers ──────
  const handleExportCSV = () => {
    const csvRows = [['#', 'Role', 'Description'], ...list.map((r, i) => [i + 1, r.name, r.description || '-'])];
    const csv = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
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
      {/* Top Controls */}
      <div className="table-controls">
        <input
          placeholder="Search roles…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="button-group">
          <button className="export-button" onClick={() => setShowForm(true)}>
            <FaPlus style={{ marginRight: 5 }} /> Add Role
          </button>
          <button className="export-button" onClick={handleExportCSV}>Export CSV</button>
          <button className="export-button" onClick={handleExportExcel}>Export Excel</button>
          <button className="export-button" onClick={handleExportPDF}>Export PDF</button>
        </div>
      </div>

      {/* Add Role Form */}
      {showForm && (
        <form className="table-container" onSubmit={addRole}>
          <h3>Add New Role</h3>
          <div className="form-group">
            <input
              placeholder="Role Name"
              required
              value={roleName}
              onChange={e => roleNameSet(e.target.value)}
            />
            <input
              placeholder="Description (optional)"
              value={roleDesc}
              onChange={e => roleDescSet(e.target.value)}
            />
          </div>
          <button type="submit" className="export-button">Submit</button>
          <button
            type="button"
            className="export-button"
            style={{ marginLeft: '1rem', background: '#ccc' }}
            onClick={() => {
              setShowForm(false);
              roleNameSet('');
              roleDescSet('');
            }}
          >
            Cancel
          </button>
        </form>
      )}

      {/* Message Popup */}
      {showMsg && (
        <div className="message-popup">
          <div className="message-popup-content">
            <p>{msg}</p>
            <button className="close-popup-button" onClick={() => showMsgSet(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Role Table */}
      <div className="table-container">
        <table className="pips-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Role</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r, i) => (
              <tr key={r.id}>
                <td>{i + 1}</td>
                <td>{r.name}</td>
                <td>{r.description || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
