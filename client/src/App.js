import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Search from './Search';
import Navbar from './Navbar';
import PIPs from './Pips';
import AuditTrail from './AuditTrail';
import DataCapturer from './DataCapturer';
import Administrator from './Administrator';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/search" element={<Search />} />
        <Route path="/pips" element={<PIPs />} />
        <Route path="/audit" element={<AuditTrail />}/>
        <Route path="/datacapturer" element={< DataCapturer />} />
        <Route path="/administrator" element={< Administrator/>} />
      </Routes>
    </Router>
  );
}

export default App;
