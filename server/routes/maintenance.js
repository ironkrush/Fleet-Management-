const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Get all maintenance logs
router.get('/', async (req, res) => {
  try {
    const { vehicle_id, status } = req.query;
    let query = `
      SELECT m.*, v.name as vehicle_name, v.license_plate
      FROM maintenance_logs m
      JOIN vehicles v ON m.vehicle_id = v.id
      WHERE 1=1
    `;
    const params = [];

    if (vehicle_id) {
      query += ' AND m.vehicle_id = ?';
      params.push(vehicle_id);
    }
    if (status) {
      query += ' AND m.status = ?';
      params.push(status);
    }

    query += ' ORDER BY m.service_date DESC';

    const [logs] = await db.query(query, params);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching maintenance logs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single maintenance log
router.get('/:id', async (req, res) => {
  try {
    const [logs] = await db.query(`
      SELECT m.*, v.name as vehicle_name, v.license_plate
      FROM maintenance_logs m
      JOIN vehicles v ON m.vehicle_id = v.id
      WHERE m.id = ?
    `, [req.params.id]);
    
    if (logs.length === 0) {
      return res.status(404).json({ error: 'Maintenance log not found' });
    }

    res.json(logs[0]);
  } catch (error) {
    console.error('Error fetching maintenance log:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create maintenance log
router.post('/', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { vehicle_id, service_type, description, cost, service_date, odometer_reading, status } = req.body;

    if (!vehicle_id || !service_type || !cost || !service_date) {
      await connection.rollback();
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    // Create maintenance log
    const [result] = await connection.query(
      'INSERT INTO maintenance_logs (vehicle_id, service_type, description, cost, service_date, odometer_reading, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [vehicle_id, service_type, description, cost, service_date, odometer_reading, status || 'Scheduled']
    );

    // If status is "In Progress", update vehicle status to "In Shop"
    if (status === 'In Progress') {
      await connection.query('UPDATE vehicles SET status = ? WHERE id = ?', ['In Shop', vehicle_id]);
    }

    // Add to expenses table
    await connection.query(
      'INSERT INTO expenses (vehicle_id, expense_type, amount, description, expense_date) VALUES (?, ?, ?, ?, ?)',
      [vehicle_id, 'Maintenance', cost, `${service_type}: ${description}`, service_date]
    );

    await connection.commit();
    res.status(201).json({ message: 'Maintenance log created successfully', logId: result.insertId });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating maintenance log:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    connection.release();
  }
});

// Update maintenance log status
router.put('/:id/status', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { status } = req.body;
    const logId = req.params.id;

    const [logs] = await connection.query('SELECT * FROM maintenance_logs WHERE id = ?', [logId]);
    if (logs.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Maintenance log not found' });
    }

    const log = logs[0];

    // Update maintenance log status
    await connection.query('UPDATE maintenance_logs SET status = ? WHERE id = ?', [status, logId]);

    // Update vehicle status based on maintenance status
    if (status === 'In Progress') {
      await connection.query('UPDATE vehicles SET status = ? WHERE id = ?', ['In Shop', log.vehicle_id]);
    } else if (status === 'Completed') {
      // Check if there are other in-progress maintenance for this vehicle
      const [otherMaintenance] = await connection.query(
        'SELECT COUNT(*) as count FROM maintenance_logs WHERE vehicle_id = ? AND status = ? AND id != ?',
        [log.vehicle_id, 'In Progress', logId]
      );

      // Only set to Available if no other maintenance is in progress
      if (otherMaintenance[0].count === 0) {
        await connection.query('UPDATE vehicles SET status = ? WHERE id = ?', ['Available', log.vehicle_id]);
      }
    }

    await connection.commit();
    res.json({ message: 'Maintenance status updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating maintenance status:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    connection.release();
  }
});

// Delete maintenance log
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM maintenance_logs WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Maintenance log not found' });
    }

    res.json({ message: 'Maintenance log deleted successfully' });
  } catch (error) {
    console.error('Error deleting maintenance log:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

