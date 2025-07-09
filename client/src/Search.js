import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Search.css';

function Search() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/pips?query=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="search-container">
      <form className="search-box" onSubmit={handleSearch}>
        <h2>PIP Search</h2>
        <input
          type="text"
          placeholder="Enter PIP Name or National ID..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>
    </div>
  );
}

export default Search;
