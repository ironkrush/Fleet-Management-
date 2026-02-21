import React, { useState } from 'react';
import { tripsAPI } from '../../services/api';
import '../Common/Common.css';

const TripStatusModal = ({ trip, onClose }) => {
  const [action, setAction] = useState(trip.status === 'Draft' ? 'Dispatched' : '');
  const [endOdometer, setEndOdometer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = { status: action };
      if (action === 'Completed') {
        if (!endOdometer) {
          setError('End odometer reading is required');
          setLoading(false);
          return;
        }
        data.end_odometer = endOdometer;
      }

      await tripsAPI.updateStatus(trip.id, data);
      onClose(true);
    } catch (error) {
      setError(error.response?.data?.error || 'Error updating trip status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => onClose(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Update Trip Status</h2>
          <button className="modal-close" onClick={() => onClose(false)}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error">{error}</div>}

          <div style={{ marginBottom: '20px' }}>
            <p><strong>Trip:</strong> {trip.origin} → {trip.destination}</p>
            <p><strong>Vehicle:</strong> {trip.vehicle_name}</p>
            <p><strong>Driver:</strong> {trip.driver_name}</p>
            <p><strong>Current Status:</strong> {trip.status}</p>
          </div>

          <div className="form-group">
            <label className="form-label">Action *</label>
            <select
              className="form-select"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              required
            >
              <option value="">Select Action</option>
              {trip.status === 'Draft' && <option value="Dispatched">Dispatch Trip</option>}
              {trip.status === 'Dispatched' && (
                <>
                  <option value="Completed">Complete Trip</option>
                  <option value="Cancelled">Cancel Trip</option>
                </>
              )}
            </select>
          </div>

          {action === 'Completed' && (
            <div className="form-group">
              <label className="form-label">End Odometer Reading (km) *</label>
              <input
                type="number"
                className="form-input"
                value={endOdometer}
                onChange={(e) => setEndOdometer(e.target.value)}
                step="0.01"
                required
              />
              <small style={{ color: '#64748b' }}>
                Start odometer: {trip.start_odometer} km
              </small>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => onClose(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !action}>
              {loading ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TripStatusModal;

