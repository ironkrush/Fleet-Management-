const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Get all drivers
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM drivers WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY full_name';

    const [drivers] = await db.query(query, params);
    res.json(drivers);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get available drivers for dispatch
router.get('/available', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const [drivers] = await db.query(
      'SELECT * FROM drivers WHERE status IN (?, ?) AND license_expiry > ? ORDER BY full_name',
      ['On Duty', 'Off Duty', today]
    );
    res.json(drivers);
  } catch (error) {
    console.error('Error fetching available drivers:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single driver
router.get('/:id', async (req, res) => {
  try {
    const [drivers] = await db.query('SELECT * FROM drivers WHERE id = ?', [req.params.id]);
    
    if (drivers.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json(drivers[0]);
  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create driver
router.post('/', async (req, res) => {
  try {
    const { full_name, email, phone, license_number, license_expiry, license_category } = req.body;

    if (!full_name || !email || !license_number || !license_expiry || !license_category) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    const [result] = await db.query(
      'INSERT INTO drivers (full_name, email, phone, license_number, license_expiry, license_category) VALUES (?, ?, ?, ?, ?, ?)',
      [full_name, email, phone, license_number, license_expiry, license_category]
    );

    res.status(201).json({ message: 'Driver created successfully', driverId: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email or license number already exists' });
    }
    console.error('Error creating driver:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update driver
router.put('/:id', async (req, res) => {
  try {
    const { full_name, email, phone, license_number, license_expiry, license_category, status, safety_score } = req.body;

    const [result] = await db.query(
      'UPDATE drivers SET full_name = ?, email = ?, phone = ?, license_number = ?, license_expiry = ?, license_category = ?, status = ?, safety_score = ? WHERE id = ?',
      [full_name, email, phone, license_number, license_expiry, license_category, status, safety_score, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({ message: 'Driver updated successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email or license number already exists' });
    }
    console.error('Error updating driver:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete driver
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM drivers WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get driver performance stats
router.get('/:id/performance', async (req, res) => {
  try {
    const driverId = req.params.id;

    const [tripStats] = await db.query(
      'SELECT COUNT(*) as total_trips, SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as completed_trips FROM trips WHERE driver_id = ?',
      ['Completed', driverId]
    );

    const completionRate = tripStats[0].total_trips > 0 
      ? (tripStats[0].completed_trips / tripStats[0].total_trips * 100).toFixed(2)
      : 0;

    // Update completion rate
    await db.query(
      'UPDATE drivers SET trip_completion_rate = ? WHERE id = ?',
      [completionRate, driverId]
    );

    res.json({
      total_trips: tripStats[0].total_trips,
      completed_trips: tripStats[0].completed_trips,
      completion_rate: completionRate
    });
  } catch (error) {
    console.error('Error fetching driver performance:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

