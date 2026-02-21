import React, { useState, useEffect } from 'react';
import { maintenanceAPI } from '../../services/api';
import MaintenanceModal from './MaintenanceModal';
import '../Common/Common.css';

const Maintenance = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await maintenanceAPI.getAll();
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching maintenance logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setShowModal(true);
  };

  const handleUpdateStatus = async (logId, newStatus) => {
    try {
      await maintenanceAPI.updateStatus(logId, { status: newStatus });
      fetchLogs();
    } catch (error) {
      alert(error.response?.data?.error || 'Error updating status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this maintenance log?')) {
      try {
        await maintenanceAPI.delete(id);
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
    return <div className="loading">Loading maintenance logs...</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Maintenance & Service Logs</h3>
          <button className="btn btn-primary" onClick={handleAdd}>
            + Add Maintenance Log
          </button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Service Type</th>
                <th>Description</th>
                <th>Cost</th>
                <th>Service Date</th>
                <th>Odometer</th>
                <th>Status</th>
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
                  <td>{log.service_type}</td>
                  <td>{log.description || '-'}</td>
                  <td>${log.cost}</td>
                  <td>{new Date(log.service_date).toLocaleDateString()}</td>
                  <td>{log.odometer_reading ? `${log.odometer_reading} km` : '-'}</td>
                  <td>
                    <span className={`status-pill status-${log.status.toLowerCase().replace(' ', '-')}`}>
                      {log.status}
                    </span>
                  </td>
                  <td>
                    {log.status === 'Scheduled' && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleUpdateStatus(log.id, 'In Progress')}
                      >
                        Start
                      </button>
                    )}
                    {log.status === 'In Progress' && (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleUpdateStatus(log.id, 'Completed')}
                      >
                        Complete
                      </button>
                    )}
                    {' '}
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
                  <td colSpan="8" style={{ textAlign: 'center', color: '#64748b' }}>
                    No maintenance logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <MaintenanceModal onClose={handleModalClose} />}
    </div>
  );
};

export default Maintenance;

