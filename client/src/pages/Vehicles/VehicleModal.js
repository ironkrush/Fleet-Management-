import React, { useState } from 'react';
import { vehiclesAPI } from '../../services/api';
import '../Common/Common.css';

const VehicleModal = ({ vehicle, onClose }) => {
  const [formData, setFormData] = useState({
    name: vehicle?.name || '',
    model: vehicle?.model || '',
    license_plate: vehicle?.license_plate || '',
    vehicle_type: vehicle?.vehicle_type || 'Truck',
    max_capacity: vehicle?.max_capacity || '',
    odometer: vehicle?.odometer || 0,
    status: vehicle?.status || 'Available',
    region: vehicle?.region || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (vehicle) {
        await vehiclesAPI.update(vehicle.id, formData);
      } else {
        await vehiclesAPI.create(formData);
      }
      onClose(true);
    } catch (error) {
      setError(error.response?.data?.error || 'Error saving vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => onClose(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{vehicle ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
          <button className="modal-close" onClick={() => onClose(false)}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Name *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Model *</label>
            <input
              type="text"
              name="model"
              className="form-input"
              value={formData.model}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">License Plate *</label>
            <input
              type="text"
              name="license_plate"
              className="form-input"
              value={formData.license_plate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Vehicle Type *</label>
            <select
              name="vehicle_type"
              className="form-select"
              value={formData.vehicle_type}
              onChange={handleChange}
              required
            >
              <option value="Truck">Truck</option>
              <option value="Van">Van</option>
              <option value="Bike">Bike</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Max Capacity (kg) *</label>
            <input
              type="number"
              name="max_capacity"
              className="form-input"
              value={formData.max_capacity}
              onChange={handleChange}
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Odometer (km)</label>
            <input
              type="number"
              name="odometer"
              className="form-input"
              value={formData.odometer}
              onChange={handleChange}
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              name="status"
              className="form-select"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="In Shop">In Shop</option>
              <option value="Out of Service">Out of Service</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Region</label>
            <input
              type="text"
              name="region"
              className="form-input"
              value={formData.region}
              onChange={handleChange}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => onClose(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehicleModal;

