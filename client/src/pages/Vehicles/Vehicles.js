import React, { useState, useEffect } from 'react';
import { vehiclesAPI } from '../../services/api';
import VehicleModal from './VehicleModal';
import '../Common/Common.css';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [filters, setFilters] = useState({ type: '', status: '' });

  useEffect(() => {
    fetchVehicles();
  }, [filters]);

  const fetchVehicles = async () => {
    try {
      const response = await vehiclesAPI.getAll(filters);
      setVehicles(response.data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedVehicle(null);
    setShowModal(true);
  };

  const handleEdit = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await vehiclesAPI.delete(id);
        fetchVehicles();
      } catch (error) {
        alert(error.response?.data?.error || 'Error deleting vehicle');
      }
    }
  };

  const handleModalClose = (refresh) => {
    setShowModal(false);
    setSelectedVehicle(null);
    if (refresh) {
      fetchVehicles();
    }
  };

  if (loading) {
    return <div className="loading">Loading vehicles...</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Vehicle Registry</h3>
          <button className="btn btn-primary" onClick={handleAdd}>
            + Add Vehicle
          </button>
        </div>

        <div className="filters">
          <div className="filter-group">
            <label className="filter-label">Type</label>
            <select
              className="form-select"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="Truck">Truck</option>
              <option value="Van">Van</option>
              <option value="Bike">Bike</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Status</label>
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="In Shop">In Shop</option>
              <option value="Out of Service">Out of Service</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Model</th>
                <th>License Plate</th>
                <th>Type</th>
                <th>Max Capacity</th>
                <th>Odometer</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td><strong>{vehicle.name}</strong></td>
                  <td>{vehicle.model}</td>
                  <td>{vehicle.license_plate}</td>
                  <td>{vehicle.vehicle_type}</td>
                  <td>{vehicle.max_capacity} kg</td>
                  <td>{vehicle.odometer} km</td>
                  <td>
                    <span className={`status-pill status-${vehicle.status.toLowerCase().replace(' ', '-')}`}>
                      {vehicle.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(vehicle)}>
                      Edit
                    </button>
                    {' '}
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(vehicle.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: '#64748b' }}>
                    No vehicles found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <VehicleModal
          vehicle={selectedVehicle}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default Vehicles;

