import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './Pages.css';

function PIPs() {
  const [pips, setPips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('query')?.toLowerCase() || '';

  useEffect(() => {
    fetch('http://localhost:5000/api/pipsdata/pipsfetch')
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
  }, []);

  const filteredPips = query
    ? pips.filter(pip =>
        pip.full_name.toLowerCase().includes(query) ||
        (pip.national_id && pip.national_id.includes(query))
      )
    : pips;

  const totalPages = Math.ceil(filteredPips.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPips = filteredPips.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  if (loading) return <div className="page-container">Loading PIPs...</div>;
  if (error) return <div className="page-container">Error: {error}</div>;

  return (
    <div className="page-container">

      {query && (
        <p>
          Showing results for <strong>"{query}"</strong> ({filteredPips.length} match{filteredPips.length !== 1 ? 'es' : ''})
        </p>
      )}

      <div className="table-container">
        <table className="pips-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Full Name</th>
              <th>National ID</th>
              <th>Type</th>
              <th>Reason</th>
              <th>Is Foreign?</th>
            </tr>
          </thead>
          <tbody>
            {currentPips.map((pip, index) => (
              <React.Fragment key={pip.id}>
                <tr className="pip-row">
                  <td>{startIndex + index + 1}</td>
                  <td>{pip.full_name}</td>
                  <td>{pip.national_id || 'N/A'}</td>
                  <td>{pip.pip_type}</td>
                  <td>{pip.reason}</td>
                  <td>{pip.is_foreign ? 'Yes' : 'No'}</td>
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
        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>← Prev</button>
        {[...Array(totalPages)].map((_, idx) => (
          <button
            key={idx + 1}
            onClick={() => handlePageChange(idx + 1)}
            className={currentPage === idx + 1 ? 'active' : ''}
          >
            {idx + 1}
          </button>
        ))}
        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Next →</button>
      </div>
    </div>
  );
}

export default PIPs;
