import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import DriverRegister from './components/DriverRegister';
import UserLogin from './components/UserLogin';
import AdminLogin from './components/AdminLogin';
import Home from './components/Home';
import PrivateRoute from './components/PrivateRoute';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing token on initial load
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);
  }, []);

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('access_token');
    localStorage.removeItem('is_admin');
    setIsAuthenticated(false);
    navigate('/');
  };

  return (
    <div className="App">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            ELD Log App
          </Link>
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            
            {!isAuthenticated ? (
              <>
                <Link to="/user-login" className="nav-link">Driver Login</Link>
                <Link to="/admin-login" className="nav-link">Admin Login</Link>
              </>
            ) : (
              <>
                <button onClick={handleLogout} className="nav-link logout-btn">
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/user-login" element={<UserLogin setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/admin-login" element={<AdminLogin setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/driver-register" element={<DriverRegister />} />

        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/user-dashboard" element={<UserDashboard />} />
        </Route>
        
        <Route element={<PrivateRoute isAdmin={true} />}>
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </div>
  );
}

// Wrap App with Router
export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}