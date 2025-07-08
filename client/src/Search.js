import React, { useState } from 'react';
import './Search.css';

function Search() {
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    alert(`Searching for: ${query}`);
    // You can replace this with actual search logic
  };

  return (
    <div className="search-container">
      <form className="search-box" onSubmit={handleSearch}>
        <h2>PIP Search</h2>
        <input
          type="text"
          placeholder="Enter PIP Name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>
    </div>
  );
}

export default Search;
