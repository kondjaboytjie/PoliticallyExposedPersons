import React, { useEffect, useState } from 'react';
import { CSVLink } from 'react-csv';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Pages.css';

function AuditTrail() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const itemsPerPage = 10;

  useEffect(() => {
    fetch('http://localhost:5000/api/audittrails/audittrailsfetch', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch audit logs');
        return res.json();
      })
      .then(data => {
        setLogs(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleSort = (col) => {
    const order = sortColumn === col && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortColumn(col);
    setSortOrder(order);
  };

  const filtered = searchTerm
    ? logs.filter(log =>
        Object.values(log)
          .join(' ')
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
    : logs;

  const sorted = filtered.sort((a, b) => {
    const valA = (a[sortColumn] || '').toString().toLowerCase();
    const valB = (b[sortColumn] || '').toString().toLowerCase();
    return valA < valB ? (sortOrder === 'asc' ? -1 : 1) : valA > valB ? (sortOrder === 'asc' ? 1 : -1) : 0;
  });

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const currentLogs = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(logs.map(log => ({
      Action: log.action_type,
      Module: log.module_name,
      Target: log.target,
      Summary: log.result_summary,
      Status: log.status,
      User: log.user_email || log.user_id || 'N/A',
      IP: log.ip_address,
      Time: new Date(log.timestamp).toLocaleString()
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Audit Logs');
    XLSX.writeFile(wb, 'audit_logs.xlsx');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Action', 'Module', 'Target', 'Summary', 'Status', 'User', 'IP', 'Time']],
      body: logs.map(log => [
        log.action_type,
        log.module_name,
        log.target,
        log.result_summary,
        log.status,
        log.user_email || log.user_id || 'N/A',
        log.ip_address,
        new Date(log.timestamp).toLocaleString()
      ])
    });
    doc.save('audit_logs.pdf');
  };

  if (loading) return <div className="page-container">Loading Audit Logs...</div>;
  if (error) return <div className="page-container">Error: {error}</div>;

  return (
    <div className="page-container">
      <h2>Audit Trail</h2>
      <div className="table-controls">
        <input
          type="text"
          placeholder="Search logs..."
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
        <div className="button-group">
          <CSVLink
            data={logs.map(log => ({
              Action: log.action_type,
              Module: log.module_name,
              Target: log.target,
              Summary: log.result_summary,
              Status: log.status,
              User: log.user_email || log.user_id || 'N/A',
              IP: log.ip_address,
              Time: new Date(log.timestamp).toLocaleString()
            }))}
            filename="audit_logs.csv"
            className="export-button"
          >
            Export CSV
          </CSVLink>
          <button className="export-button" onClick={exportExcel}>Export Excel</button>
          <button className="export-button" onClick={exportPDF}>Export PDF</button>
        </div>
      </div>

      <div className="table-container">
        <table className="pips-table">
          <thead>
            <tr>
              <th>#</th>
              <th onClick={() => handleSort('action_type')}>Action</th>
              <th onClick={() => handleSort('module_name')}>Module</th>
              <th onClick={() => handleSort('target')}>Target</th>
              <th onClick={() => handleSort('result_summary')}>Summary</th>
              <th onClick={() => handleSort('status')}>Status</th>
              <th>User</th>
              <th>IP</th>
              <th onClick={() => handleSort('timestamp')}>
                Time {sortColumn === 'timestamp' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
            </tr>
          </thead>
          <tbody>
            {currentLogs.map((log, index) => (
              <tr key={log.id}>
                <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                <td>{log.action_type}</td>
                <td>{log.module_name}</td>
                <td>{log.target}</td>
                <td>{log.result_summary}</td>
                <td>{log.status}</td>
                <td>{log.user_email || log.user_id || 'N/A'}</td>
                <td>{log.ip_address}</td>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button onClick={() => setCurrentPage(prev => prev - 1)} disabled={currentPage === 1}>
          ← Prev
        </button>
        {[...Array(totalPages)].map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentPage(idx + 1)}
            className={currentPage === idx + 1 ? 'active' : ''}
          >
            {idx + 1}
          </button>
        ))}
        <button onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage === totalPages}>
          Next →
        </button>
      </div>
    </div>
  );
}

export default AuditTrail;
