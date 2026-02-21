import React, { useState, useEffect } from 'react';
import { fuelAPI } from '../../services/api';
import FuelModal from './FuelModal';
import '../Common/Common.css';

const Fuel = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fuelAPI.getAll();
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching fuel logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this fuel log?')) {
      try {
        await fuelAPI.delete(id);
        fetchLogs();
      } catch (error) {
        alert(error.response?.data?.error || 'Error deleting log');
      }
    }
  };

  const handleModalClose = (refresh) => {
    setShowModal(false);
    if (refresh) {
      fetchLogs();
    }
  };

  if (loading) {
    return <div className="loading">Loading fuel logs...</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Fuel Logs</h3>
          <button className="btn btn-primary" onClick={handleAdd}>
            + Add Fuel Log
          </button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Liters</th>
                <th>Cost</th>
                <th>Cost per Liter</th>
                <th>Fuel Date</th>
                <th>Odometer</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <strong>{log.vehicle_name}</strong>
                    <br />
                    <small>{log.license_plate}</small>
                  </td>
                  <td>{log.liters} L</td>
                  <td>${log.cost}</td>
                  <td>${(log.cost / log.liters).toFixed(2)}/L</td>
                  <td>{new Date(log.fuel_date).toLocaleDateString()}</td>
                  <td>{log.odometer_reading ? `${log.odometer_reading} km` : '-'}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(log.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: '#64748b' }}>
                    No fuel logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <FuelModal onClose={handleModalClose} />}
    </div>
  );
};

export default Fuel;

