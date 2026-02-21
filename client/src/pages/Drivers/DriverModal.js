import React, { useState } from 'react';
import { driversAPI } from '../../services/api';
import '../Common/Common.css';

const DriverModal = ({ driver, onClose }) => {
  const [formData, setFormData] = useState({
    full_name: driver?.full_name || '',
    email: driver?.email || '',
    phone: driver?.phone || '',
    license_number: driver?.license_number || '',
    license_expiry: driver?.license_expiry?.split('T')[0] || '',
    license_category: driver?.license_category || '',
    status: driver?.status || 'Off Duty',
    safety_score: driver?.safety_score || 100,
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
      if (driver) {
        await driversAPI.update(driver.id, formData);
      } else {
        await driversAPI.create(formData);
      }
      onClose(true);
    } catch (error) {
      setError(error.response?.data?.error || 'Error saving driver');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => onClose(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{driver ? 'Edit Driver' : 'Add Driver'}</h2>
          <button className="modal-close" onClick={() => onClose(false)}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              name="full_name"
              className="form-input"
              value={formData.full_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email *</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              type="tel"
              name="phone"
              className="form-input"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">License Number *</label>
            <input
              type="text"
              name="license_number"
              className="form-input"
              value={formData.license_number}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">License Expiry *</label>
            <input
              type="date"
              name="license_expiry"
              className="form-input"
              value={formData.license_expiry}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">License Category *</label>
            <input
              type="text"
              name="license_category"
              className="form-input"
              value={formData.license_category}
              onChange={handleChange}
              placeholder="e.g., Van, Truck, Bike"
              required
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
              <option value="On Duty">On Duty</option>
              <option value="Off Duty">Off Duty</option>
              <option value="Suspended">Suspended</option>
              <option value="On Trip">On Trip</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Safety Score (0-100)</label>
            <input
              type="number"
              name="safety_score"
              className="form-input"
              value={formData.safety_score}
              onChange={handleChange}
              min="0"
              max="100"
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

export default DriverModal;

