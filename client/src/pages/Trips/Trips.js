import React, { useState, useEffect } from 'react';
import { tripsAPI } from '../../services/api';
import TripModal from './TripModal';
import TripStatusModal from './TripStatusModal';
import '../Common/Common.css';

const Trips = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [filters, setFilters] = useState({ status: '' });

  useEffect(() => {
    fetchTrips();
  }, [filters]);

  const fetchTrips = async () => {
    try {
      const response = await tripsAPI.getAll(filters);
      setTrips(response.data);
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setShowModal(true);
  };

  const handleUpdateStatus = (trip) => {
    setSelectedTrip(trip);
    setShowStatusModal(true);
  };

  const handleModalClose = (refresh) => {
    setShowModal(false);
    setShowStatusModal(false);
    setSelectedTrip(null);
    if (refresh) {
      fetchTrips();
    }
  };

  if (loading) {
    return <div className="loading">Loading trips...</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Trip Management</h3>
          <button className="btn btn-primary" onClick={handleAdd}>
            + Create Trip
          </button>
        </div>

        <div className="filters">
          <div className="filter-group">
            <label className="filter-label">Status</label>
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Route</th>
                <th>Cargo Weight</th>
                <th>Distance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => (
                <tr key={trip.id}>
                  <td>#{trip.id}</td>
                  <td>
                    <strong>{trip.vehicle_name}</strong>
                    <br />
                    <small>{trip.license_plate}</small>
                  </td>
                  <td>{trip.driver_name}</td>
                  <td>
                    {trip.origin} → {trip.destination}
                  </td>
                  <td>{trip.cargo_weight} kg</td>
                  <td>{trip.distance ? `${trip.distance} km` : '-'}</td>
                  <td>
                    <span className={`status-pill status-${trip.status.toLowerCase()}`}>
                      {trip.status}
                    </span>
                  </td>
                  <td>
                    {trip.status === 'Draft' && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleUpdateStatus(trip)}
                      >
                        Dispatch
                      </button>
                    )}
                    {trip.status === 'Dispatched' && (
                      <>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleUpdateStatus(trip)}
                        >
                          Complete
                        </button>
                        {' '}
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleUpdateStatus(trip)}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {trips.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: '#64748b' }}>
                    No trips found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <TripModal onClose={handleModalClose} />}
      {showStatusModal && (
        <TripStatusModal trip={selectedTrip} onClose={handleModalClose} />
      )}
    </div>
  );
};

export default Trips;

