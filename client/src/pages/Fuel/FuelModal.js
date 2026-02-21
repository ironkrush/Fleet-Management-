import React, { useState, useEffect } from 'react';
import { fuelAPI, vehiclesAPI } from '../../services/api';
import '../Common/Common.css';

const FuelModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    vehicle_id: '',
    liters: '',
    cost: '',
    fuel_date: new Date().toISOString().split('T')[0],
    odometer_reading: '',
  });
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await vehiclesAPI.getAll();
      setVehicles(response.data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await fuelAPI.create(formData);
      onClose(true);
    } catch (error) {
      setError(error.response?.data?.error || 'Error creating fuel log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => onClose(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add Fuel Log</h2>
          <button className="modal-close" onClick={() => onClose(false)}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Vehicle *</label>
            <select
              name="vehicle_id"
              className="form-select"
              value={formData.vehicle_id}
              onChange={handleChange}
              required
            >
              <option value="">Select Vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name} - {vehicle.license_plate}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Liters *</label>
            <input
              type="number"
              name="liters"
              className="form-input"
              value={formData.liters}
              onChange={handleChange}
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Cost ($) *</label>
            <input
              type="number"
              name="cost"
              className="form-input"
              value={formData.cost}
              onChange={handleChange}
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Fuel Date *</label>
            <input
              type="date"
              name="fuel_date"
              className="form-input"
              value={formData.fuel_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Odometer Reading (km)</label>
            <input
              type="number"
              name="odometer_reading"
              className="form-input"
              value={formData.odometer_reading}
              onChange={handleChange}
              step="0.01"
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

export default FuelModal;

