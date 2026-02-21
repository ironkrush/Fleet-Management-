const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Get all fuel logs
router.get('/', async (req, res) => {
  try {
    const { vehicle_id } = req.query;
    let query = `
      SELECT f.*, v.name as vehicle_name, v.license_plate
      FROM fuel_logs f
      JOIN vehicles v ON f.vehicle_id = v.id
      WHERE 1=1
    `;
    const params = [];

    if (vehicle_id) {
      query += ' AND f.vehicle_id = ?';
      params.push(vehicle_id);
    }

    query += ' ORDER BY f.fuel_date DESC';

    const [logs] = await db.query(query, params);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching fuel logs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create fuel log
router.post('/', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { vehicle_id, trip_id, liters, cost, fuel_date, odometer_reading } = req.body;

    if (!vehicle_id || !liters || !cost || !fuel_date) {
      await connection.rollback();
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    // Create fuel log
    const [result] = await connection.query(
      'INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, fuel_date, odometer_reading) VALUES (?, ?, ?, ?, ?, ?)',
      [vehicle_id, trip_id, liters, cost, fuel_date, odometer_reading]
    );

    // Add to expenses table
    await connection.query(
      'INSERT INTO expenses (vehicle_id, expense_type, amount, description, expense_date) VALUES (?, ?, ?, ?, ?)',
      [vehicle_id, 'Fuel', cost, `Fuel: ${liters}L`, fuel_date]
    );

    await connection.commit();
    res.status(201).json({ message: 'Fuel log created successfully', logId: result.insertId });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating fuel log:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    connection.release();
  }
});

// Delete fuel log
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM fuel_logs WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Fuel log not found' });
    }

    res.json({ message: 'Fuel log deleted successfully' });
  } catch (error) {
    console.error('Error deleting fuel log:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

