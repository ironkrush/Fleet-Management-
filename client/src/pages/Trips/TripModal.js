import React, { useState, useEffect } from 'react';
import { tripsAPI, vehiclesAPI, driversAPI } from '../../services/api';
import '../Common/Common.css';

const TripModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    vehicle_id: '',
    driver_id: '',
    cargo_weight: '',
    origin: '',
    destination: '',
    scheduled_date: '',
    notes: '',
  });
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vehiclesRes, driversRes] = await Promise.all([
        vehiclesAPI.getAvailable(),
        driversAPI.getAvailable(),
      ]);
      setVehicles(vehiclesRes.data);
      setDrivers(driversRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'vehicle_id') {
      const vehicle = vehicles.find((v) => v.id === parseInt(value));
      setSelectedVehicle(vehicle);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate cargo weight
    if (selectedVehicle && parseFloat(formData.cargo_weight) > parseFloat(selectedVehicle.max_capacity)) {
      setError(`Cargo weight exceeds vehicle capacity of ${selectedVehicle.max_capacity} kg`);
      return;
    }

    setLoading(true);

    try {
      await tripsAPI.create(formData);
      onClose(true);
    } catch (error) {
      setError(error.response?.data?.error || 'Error creating trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => onClose(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New Trip</h2>
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
                  {vehicle.name} - {vehicle.license_plate} (Max: {vehicle.max_capacity} kg)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Driver *</label>
            <select
              name="driver_id"
              className="form-select"
              value={formData.driver_id}
              onChange={handleChange}
              required
            >
              <option value="">Select Driver</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.full_name} - License: {driver.license_number}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Cargo Weight (kg) *</label>
            <input
              type="number"
              name="cargo_weight"
              className="form-input"
              value={formData.cargo_weight}
              onChange={handleChange}
              step="0.01"
              required
            />
            {selectedVehicle && (
              <small style={{ color: '#64748b' }}>
                Max capacity: {selectedVehicle.max_capacity} kg
              </small>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Origin *</label>
            <input
              type="text"
              name="origin"
              className="form-input"
              value={formData.origin}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Destination *</label>
            <input
              type="text"
              name="destination"
              className="form-input"
              value={formData.destination}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Scheduled Date</label>
            <input
              type="datetime-local"
              name="scheduled_date"
              className="form-input"
              value={formData.scheduled_date}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              name="notes"
              className="form-textarea"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => onClose(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TripModal;

