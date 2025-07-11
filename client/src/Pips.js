import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CSVLink } from 'react-csv';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Pages.css';

function PIPs() {
  const [allPips, setAllPips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState('full_name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 5;

  const location = useLocation();
  const queryParam = new URLSearchParams(location.search).get('query');
  const initialQuery = queryParam?.toLowerCase() || '';

  const getAssociateName = (assoc) =>
    [assoc.first_name, assoc.middle_name, assoc.last_name].filter(Boolean).join(' ');

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:5000/api/pipsdata/pipsfetch')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch PIPs');
        return res.json();
      })
      .then(data => {
        setAllPips(data);
        setSearchTerm(initialQuery);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [initialQuery]);

  const handleSort = (col) => {
    const order = sortColumn === col && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortColumn(col);
    setSortOrder(order);
  };

  const filtered = searchTerm
    ? allPips.filter(pip => {
        const term = searchTerm.toLowerCase();
        return (
          (pip.full_name && pip.full_name.toLowerCase().includes(term)) ||
          (pip.national_id && pip.national_id.includes(term)) ||
          pip.associates.some(assoc =>
            getAssociateName(assoc).toLowerCase().includes(term) ||
            (assoc.national_id && assoc.national_id.includes(term))
          )
        );
      })
    : allPips;

  const sorted = filtered.sort((a, b) => {
    const valA = (a[sortColumn] || '').toString().toLowerCase();
    const valB = (b[sortColumn] || '').toString().toLowerCase();
    return valA < valB ? (sortOrder === 'asc' ? -1 : 1) : valA > valB ? (sortOrder === 'asc' ? 1 : -1) : 0;
  });

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const currentPips = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      allPips.flatMap(p => [
        {
          'Full Name': p.full_name,
          'National ID': p.national_id,
          'Type': p.pip_type,
          'Reason': p.reason,
          'Country': p.country || 'Namibia',
          'Associate Name': '',
          'Relationship': '',
          'Associate National ID': ''
        },
        ...p.associates.map(a => ({
          'Full Name': '',
          'National ID': '',
          'Type': '',
          'Reason': '',
          'Country': '',
          'Associate Name': getAssociateName(a),
          'Relationship': a.relationship_type,
          'Associate National ID': a.national_id || 'N/A'
        }))
      ])
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PIPs');
    XLSX.writeFile(wb, 'pips.xlsx');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Full Name', 'National ID', 'Type', 'Reason', 'Country', 'Associate Name', 'Relationship', 'Associate National ID']],
      body: allPips.flatMap(p => [
        [
          p.full_name,
          p.national_id || 'N/A',
          p.pip_type,
          p.reason,
          p.country || 'Namibia',
          '', '', ''
        ],
        ...p.associates.map(a => [
          '', '', '', '', '',
          getAssociateName(a),
          a.relationship_type,
          a.national_id || 'N/A'
        ])
      ])
    });
    doc.save('pips.pdf');
  };

  if (loading) return <div className="page-container">Loading PIPs...</div>;
  if (error) return <div className="page-container">Error: {error}</div>;

  return (
    <div className="page-container">
      <div className="table-controls">
        <input
          type="text"
          placeholder="Search by name or ID..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
        <div className="button-group">
          <CSVLink
            data={allPips.flatMap(p => [
              {
                full_name: p.full_name,
                national_id: p.national_id,
                pip_type: p.pip_type,
                reason: p.reason,
                country: p.country || 'Namibia',
                associate_name: '',
                relationship_type: '',
                associate_id: ''
              },
              ...p.associates.map(a => ({
                full_name: '',
                national_id: '',
                pip_type: '',
                reason: '',
                country: '',
                associate_name: getAssociateName(a),
                relationship_type: a.relationship_type,
                associate_id: a.national_id || 'N/A'
              }))
            ])}
            filename="pips.csv"
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
              <th onClick={() => handleSort('full_name')}>
                Full Name {sortColumn === 'full_name' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort('national_id')}>
                National ID {sortColumn === 'national_id' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort('pip_type')}>
                Type {sortColumn === 'pip_type' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort('reason')}>
                Reason {sortColumn === 'reason' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th>Country</th>
              <th>Associate Name</th>
              <th>Relationship</th>
              <th>Associate National ID</th>
            </tr>
          </thead>
          <tbody>
            {currentPips.map((pip, index) => (
              <React.Fragment key={pip.id}>
                <tr className="pip-row">
                  <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td>{pip.full_name}</td>
                  <td>{pip.national_id || 'N/A'}</td>
                  <td>{pip.pip_type}</td>
                  <td>{pip.reason}</td>
                  <td>{pip.country || 'Namibia'}</td>
                  <td></td><td></td><td></td>
                </tr>
                {pip.associates.map((assoc) => (
                  <tr className="associate-row" key={assoc.id || `${assoc.first_name}-${assoc.last_name}`}>
                    <td></td><td></td><td></td><td></td><td></td><td></td>
                    <td>{getAssociateName(assoc)}</td>
                    <td>{assoc.relationship_type}</td>
                    <td>{assoc.national_id || 'N/A'}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>← Prev</button>
        {[...Array(totalPages)].map((_, idx) => (
          <button
            key={idx + 1}
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

export default PIPs;
