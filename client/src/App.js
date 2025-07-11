import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Search from './Search';
import Navbar from './Navbar';
import PIPs from './Pips';
import AuditTrail from './AuditTrail';
import DataCapturer from './DataCapturer';
import { UserProvider } from './UserContext';
import ManageUsers from './Administrator/ManageUsers';
import ManagePIPs from './Administrator/ManagePips';

function App() {
  return (
    <UserProvider>
      <Router>
        <div className="app-layout">
          <Navbar />
          <div className="content-wrapper">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/search" element={<Search />} />
              <Route path="/pips" element={<PIPs />} />
              <Route path="/audit" element={<AuditTrail />} />
              <Route path="/datacapturer" element={<DataCapturer />} />
              <Route path="/administrator/manageusers" element={<ManageUsers />} />
              <Route path="/administrator/managepips" element={<ManagePIPs />} />
            </Routes>
          </div>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;
