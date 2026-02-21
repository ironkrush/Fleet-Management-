import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';
import '../Common/Common.css';
import './Dashboard.css';

const Dashboard = () => {
  const [kpis, setKpis] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [kpisRes, analyticsRes] = await Promise.all([
        dashboardAPI.getKPIs(),
        dashboardAPI.getAnalytics()
      ]);
      setKpis(kpisRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="kpi-grid">
        <div className="kpi-card" style={{ borderLeftColor: '#3b82f6' }}>
          <div className="kpi-label">Active Fleet</div>
          <div className="kpi-value">{kpis?.active_fleet || 0}</div>
        </div>

        <div className="kpi-card" style={{ borderLeftColor: '#f59e0b' }}>
          <div className="kpi-label">Maintenance Alerts</div>
          <div className="kpi-value">{kpis?.maintenance_alerts || 0}</div>
        </div>

        <div className="kpi-card" style={{ borderLeftColor: '#10b981' }}>
          <div className="kpi-label">Utilization Rate</div>
          <div className="kpi-value">
            {kpis?.utilization_rate || 0}
            <span className="kpi-unit">%</span>
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeftColor: '#8b5cf6' }}>
          <div className="kpi-label">Pending Cargo</div>
          <div className="kpi-value">{kpis?.pending_cargo || 0}</div>
        </div>

        <div className="kpi-card" style={{ borderLeftColor: '#06b6d4' }}>
          <div className="kpi-label">Available Vehicles</div>
          <div className="kpi-value">{kpis?.available_vehicles || 0}</div>
        </div>

        <div className="kpi-card" style={{ borderLeftColor: '#14b8a6' }}>
          <div className="kpi-label">Available Drivers</div>
          <div className="kpi-value">{kpis?.available_drivers || 0}</div>
        </div>

        {kpis?.expired_licenses > 0 && (
          <div className="kpi-card" style={{ borderLeftColor: '#ef4444' }}>
            <div className="kpi-label">⚠️ Expired Licenses</div>
            <div className="kpi-value">{kpis.expired_licenses}</div>
          </div>
        )}
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Fleet Overview</h3>
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-label">Total Vehicles</div>
              <div className="stat-value">{kpis?.total_vehicles || 0}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Total Trips</div>
              <div className="stat-value">{analytics?.total_trips || 0}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Total Distance</div>
              <div className="stat-value">
                {analytics?.total_distance ? Number(analytics.total_distance).toFixed(0) : 0} km
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Fuel Efficiency</div>
              <div className="stat-value">
                {analytics?.fuel_efficiency ? Number(analytics.fuel_efficiency).toFixed(2) : 0} km/L
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Financial Summary</h3>
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-label">Fuel Cost</div>
              <div className="stat-value">
                ${analytics?.total_fuel_cost ? Number(analytics.total_fuel_cost).toFixed(2) : '0.00'}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Maintenance Cost</div>
              <div className="stat-value">
                ${analytics?.total_maintenance_cost ? Number(analytics.total_maintenance_cost).toFixed(2) : '0.00'}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Total Operational Cost</div>
              <div className="stat-value">
                ${analytics?.total_operational_cost ? Number(analytics.total_operational_cost).toFixed(2) : '0.00'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Trips</h3>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Route</th>
                <th>Status</th>
                <th>Distance</th>
              </tr>
            </thead>
            <tbody>
              {analytics?.recent_trips?.slice(0, 5).map((trip) => (
                <tr key={trip.id}>
                  <td>{trip.vehicle_name}</td>
                  <td>{trip.driver_name}</td>
                  <td>{trip.origin} → {trip.destination}</td>
                  <td>
                    <span className={`status-pill status-${trip.status.toLowerCase().replace(' ', '-')}`}>
                      {trip.status}
                    </span>
                  </td>
                  <td>{trip.distance ? `${trip.distance} km` : '-'}</td>
                </tr>
              ))}
              {(!analytics?.recent_trips || analytics.recent_trips.length === 0) && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#64748b' }}>
                    No trips found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

