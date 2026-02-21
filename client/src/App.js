import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Vehicles from './pages/Vehicles/Vehicles';
import Drivers from './pages/Drivers/Drivers';
import Trips from './pages/Trips/Trips';
import Maintenance from './pages/Maintenance/Maintenance';
import Fuel from './pages/Fuel/Fuel';
import Analytics from './pages/Analytics/Analytics';
import './pages/Common/Common.css';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/vehicles"
        element={
          <PrivateRoute>
            <Layout>
              <Vehicles />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/drivers"
        element={
          <PrivateRoute>
            <Layout>
              <Drivers />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/trips"
        element={
          <PrivateRoute>
            <Layout>
              <Trips />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/maintenance"
        element={
          <PrivateRoute>
            <Layout>
              <Maintenance />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/fuel"
        element={
          <PrivateRoute>
            <Layout>
              <Fuel />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <PrivateRoute>
            <Layout>
              <Analytics />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;

