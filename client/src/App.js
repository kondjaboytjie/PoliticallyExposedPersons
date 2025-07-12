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
import ManagePIPs    from './Administrator/ManagePips';
import ManageRoles   from './Administrator/ManageRoles';   // NEW

function App() {
  return (
    <UserProvider>
      <Router>
        <div className="app-layout">
          <Navbar />
          <div className="content-wrapper">
            <Routes>
              <Route path="/"                                element={<Login />} />
              <Route path="/search"                          element={<Search />} />
              <Route path="/pips"                            element={<PIPs />} />
              <Route path="/audit"                           element={<AuditTrail />} />
              <Route path="/datacapturer"                    element={<DataCapturer />} />

              {/* administrator sub-routes */}
              <Route path="/administrator/manageusers"       element={<ManageUsers />} />
              <Route path="/administrator/managepips"        element={<ManagePIPs />} />
              <Route path="/administrator/manageroles"       element={<ManageRoles />} /> {/* NEW */}
            </Routes>
          </div>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;
