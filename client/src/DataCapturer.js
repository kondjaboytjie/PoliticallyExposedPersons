import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CSVLink } from 'react-csv';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Pages.css';

function PIPs() {
  const [pips, setPips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState('full_name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 5;

  const location = useLocation();
  const queryParam = new URLSearchParams(location.search).get('query');
  const query = queryParam?.toLowerCase() || '';

  useEffect(() => {
    setSearchTerm(query);
  }, [query]);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:5000/api/pipsdata/pipsfetch?query=${query}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch PIPs');
        return res.json();
      })
      .then(data => {
        setPips(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [query]);

  const handleSort = (col) => {
    const order = sortColumn === col && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortColumn(col);
    setSortOrder(order);
  };

  const filtered = searchTerm
    ? pips.filter(pip => {
        const term = searchTerm.toLowerCase();
        return (
          pip.full_name.toLowerCase().includes(term) ||
          (pip.national_id && pip.national_id.includes(term)) ||
          pip.associates.some(assoc =>
            assoc.associate_name.toLowerCase().includes(term) ||
            (assoc.national_id && assoc.national_id.includes(term))
          )
        );
      })
    : pips;

  const sorted = filtered.sort((a, b) => {
    const valA = a[sortColumn] || '';
    const valB = b[sortColumn] || '';
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const currentPips = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(pips.map(p => ({
      'Full Name': p.full_name,
      'National ID': p.national_id,
      'Type': p.pip_type,
      'Reason': p.reason,
      'Country': p.is_foreign ? (p.foreign?.country || 'Unknown') : 'Namibia'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PIPs');
    XLSX.writeFile(wb, 'pips.xlsx');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Full Name', 'National ID', 'Type', 'Reason', 'Country']],
      body: pips.map(p => [
        p.full_name,
        p.national_id || 'N/A',
        p.pip_type,
        p.reason,
        p.is_foreign ? (p.foreign?.country || 'Unknown') : 'Namibia'
      ]),
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
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <CSVLink
          data={pips.map(p => ({
            full_name: p.full_name,
            national_id: p.national_id,
            pip_type: p.pip_type,
            reason: p.reason,
            country: p.is_foreign ? (p.foreign?.country || 'Unknown') : 'Namibia'
          }))}
          filename="pips.csv"
          className="export-button"
        >
          Export CSV
        </CSVLink>
        <button className="export-button" onClick={exportExcel}>Export Excel</button>
        <button className="export-button" onClick={exportPDF}>Export PDF</button>
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
                  <td>{pip.is_foreign ? (pip.foreign?.country || 'Unknown') : 'Namibia'}</td>
                </tr>

                {pip.associates.length > 0 && (
                  <>
                    <tr className="associate-header-row">
                      <td></td>
                      <td colSpan="5"><strong>Associates:</strong></td>
                    </tr>
                    {pip.associates.map((assoc) => (
                      <tr className="associate-row" key={assoc.id}>
                        <td></td>
                        <td colSpan="2">{assoc.associate_name}</td>
                        <td colSpan="2">{assoc.relationship_type}</td>
                        <td>ID: {assoc.national_id || 'N/A'}</td>
                      </tr>
                    ))}
                  </>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
          ← Prev
        </button>
        {[...Array(totalPages)].map((_, idx) => (
          <button
            key={idx + 1}
            onClick={() => setCurrentPage(idx + 1)}
            className={currentPage === idx + 1 ? 'active' : ''}
          >
            {idx + 1}
          </button>
        ))}
        <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
          Next →
        </button>
      </div>
    </div>
  );
}

export default PIPs;
