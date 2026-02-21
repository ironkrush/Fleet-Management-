import React, { useState, useEffect } from 'react';
import { dashboardAPI, vehiclesAPI } from '../../services/api';
import '../Common/Common.css';
import './Analytics.css';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleStats, setVehicleStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [analyticsRes, vehiclesRes] = await Promise.all([
        dashboardAPI.getAnalytics(),
        vehiclesAPI.getAll()
      ]);
      setAnalytics(analyticsRes.data);
      setVehicles(vehiclesRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleSelect = async (vehicleId) => {
    if (!vehicleId) {
      setSelectedVehicle(null);
      setVehicleStats(null);
      return;
    }

    try {
      const vehicle = vehicles.find(v => v.id === parseInt(vehicleId));
      setSelectedVehicle(vehicle);
      
      const statsRes = await vehiclesAPI.getStats(vehicleId);
      setVehicleStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching vehicle stats:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Operational Analytics</h3>
        </div>

        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="analytics-label">Total Trips Completed</div>
            <div className="analytics-value">{analytics?.total_trips || 0}</div>
          </div>

          <div className="analytics-card">
            <div className="analytics-label">Total Distance Traveled</div>
            <div className="analytics-value">
              {analytics?.total_distance ? Number(analytics.total_distance).toFixed(0) : 0} km
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-label">Average Fuel Efficiency</div>
            <div className="analytics-value">
              {analytics?.fuel_efficiency ? Number(analytics.fuel_efficiency).toFixed(2) : 0} km/L
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-label">Total Fuel Cost</div>
            <div className="analytics-value">
              ${analytics?.total_fuel_cost ? Number(analytics.total_fuel_cost).toFixed(2) : '0.00'}
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-label">Total Maintenance Cost</div>
            <div className="analytics-value">
              ${analytics?.total_maintenance_cost ? Number(analytics.total_maintenance_cost).toFixed(2) : '0.00'}
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-label">Total Operational Cost</div>
            <div className="analytics-value">
              ${analytics?.total_operational_cost ? Number(analytics.total_operational_cost).toFixed(2) : '0.00'}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Vehicle Performance Analysis</h3>
        </div>

        <div className="form-group">
          <label className="form-label">Select Vehicle</label>
          <select
            className="form-select"
            onChange={(e) => handleVehicleSelect(e.target.value)}
            style={{ maxWidth: '400px' }}
          >
            <option value="">Choose a vehicle...</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.name} - {vehicle.license_plate}
              </option>
            ))}
          </select>
        </div>

        {selectedVehicle && vehicleStats && (
          <div className="vehicle-stats">
            <h4>{selectedVehicle.name} - {selectedVehicle.license_plate}</h4>
            
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">Total Trips</div>
                <div className="stat-value">{vehicleStats.total_trips || 0}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Total Distance</div>
                <div className="stat-value">
                  {vehicleStats.total_distance ? Number(vehicleStats.total_distance).toFixed(0) : 0} km
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Total Fuel Cost</div>
                <div className="stat-value">
                  ${vehicleStats.total_fuel_cost ? Number(vehicleStats.total_fuel_cost).toFixed(2) : '0.00'}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Total Maintenance Cost</div>
                <div className="stat-value">
                  ${vehicleStats.total_maintenance_cost ? Number(vehicleStats.total_maintenance_cost).toFixed(2) : '0.00'}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Total Operational Cost</div>
                <div className="stat-value">
                  ${vehicleStats.total_operational_cost ? Number(vehicleStats.total_operational_cost).toFixed(2) : '0.00'}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Cost per km</div>
                <div className="stat-value">
                  ${(vehicleStats.total_distance && vehicleStats.total_operational_cost && Number(vehicleStats.total_distance) > 0)
                    ? (Number(vehicleStats.total_operational_cost) / Number(vehicleStats.total_distance)).toFixed(2)
                    : '0.00'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Fleet Distribution</h3>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Vehicle Type</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {analytics?.vehicle_types?.map((type) => (
                <tr key={type.vehicle_type}>
                  <td>{type.vehicle_type}</td>
                  <td>{type.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

