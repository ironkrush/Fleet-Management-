import React, { useState, useEffect } from 'react';
import { driversAPI } from '../../services/api';
import DriverModal from './DriverModal';
import '../Common/Common.css';

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await driversAPI.getAll();
      setDrivers(response.data);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedDriver(null);
    setShowModal(true);
  };

  const handleEdit = (driver) => {
    setSelectedDriver(driver);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try {
        await driversAPI.delete(id);
        fetchDrivers();
      } catch (error) {
        alert(error.response?.data?.error || 'Error deleting driver');
      }
    }
  };

  const handleModalClose = (refresh) => {
    setShowModal(false);
    setSelectedDriver(null);
    if (refresh) {
      fetchDrivers();
    }
  };

  const isLicenseExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
  };

  if (loading) {
    return <div className="loading">Loading drivers...</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Driver Management</h3>
          <button className="btn btn-primary" onClick={handleAdd}>
            + Add Driver
          </button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>License Number</th>
                <th>License Expiry</th>
                <th>Status</th>
                <th>Safety Score</th>
                <th>Completion Rate</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => (
                <tr key={driver.id}>
                  <td><strong>{driver.full_name}</strong></td>
                  <td>{driver.email}</td>
                  <td>{driver.phone || '-'}</td>
                  <td>{driver.license_number}</td>
                  <td>
                    {new Date(driver.license_expiry).toLocaleDateString()}
                    {isLicenseExpired(driver.license_expiry) && (
                      <span style={{ color: 'red', marginLeft: '8px' }}>⚠️ Expired</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-pill status-${driver.status.toLowerCase().replace(' ', '-')}`}>
                      {driver.status}
                    </span>
                  </td>
                  <td>{driver.safety_score}/100</td>
                  <td>{driver.trip_completion_rate}%</td>
                  <td>
                    <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(driver)}>
                      Edit
                    </button>
                    {' '}
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(driver.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {drivers.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', color: '#64748b' }}>
                    No drivers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <DriverModal
          driver={selectedDriver}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default Drivers;

