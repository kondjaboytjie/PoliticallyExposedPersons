import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './UserContext';

import Login         from './Login';
import Search        from './Search';
import Navbar        from './Navbar';
import PIPs          from './Pips';
import AuditTrail    from './AuditTrail';
import DataCapturer  from './DataCapturer';

import ManageUsers   from './Administrator/ManageUsers';
import ManageRoles   from './Administrator/ManageRoles';

import PrivateRoute  from './PrivateRoute'; // ✅ import this

function App() {
  return (
    <UserProvider>
      <Router>
        <div className="app-layout">
          <Navbar />
          <div className="content-wrapper">
            <Routes>
              <Route path="/" element={<Login />} />
              
              {/* ✅ Protected Routes */}
              <Route
                path="/search"
                element={
                  <PrivateRoute>
                    <Search />
                  </PrivateRoute>
                }
              />
              <Route
                path="/pips"
                element={
                  <PrivateRoute>
                    <PIPs />
                  </PrivateRoute>
                }
              />
              <Route
                path="/audit"
                element={
                  <PrivateRoute>
                    <AuditTrail />
                  </PrivateRoute>
                }
              />
              <Route
                path="/datacapturer"
                element={
                  <PrivateRoute>
                    <DataCapturer />
                  </PrivateRoute>
                }
              />
              <Route
                path="/administrator/manageusers"
                element={
                  <PrivateRoute>
                    <ManageUsers />
                  </PrivateRoute>
                }
              />
              <Route
                path="/administrator/manageroles"
                element={
                  <PrivateRoute>
                    <ManageRoles />
                  </PrivateRoute>
                }
              />
            </Routes>
          </div>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;
