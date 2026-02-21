const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Get all trips
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT t.*, v.name as vehicle_name, v.license_plate, d.full_name as driver_name
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN drivers d ON t.driver_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }

    query += ' ORDER BY t.created_at DESC';

    const [trips] = await db.query(query, params);
    res.json(trips);
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single trip
router.get('/:id', async (req, res) => {
  try {
    const [trips] = await db.query(`
      SELECT t.*, v.name as vehicle_name, v.license_plate, d.full_name as driver_name
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN drivers d ON t.driver_id = d.id
      WHERE t.id = ?
    `, [req.params.id]);
    
    if (trips.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json(trips[0]);
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create trip with validation
router.post('/', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { vehicle_id, driver_id, cargo_weight, origin, destination, scheduled_date, notes } = req.body;

    if (!vehicle_id || !driver_id || !cargo_weight || !origin || !destination) {
      await connection.rollback();
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    // Validate vehicle availability and capacity
    const [vehicles] = await connection.query('SELECT * FROM vehicles WHERE id = ?', [vehicle_id]);
    if (vehicles.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const vehicle = vehicles[0];
    if (vehicle.status !== 'Available') {
      await connection.rollback();
      return res.status(400).json({ error: `Vehicle is not available. Current status: ${vehicle.status}` });
    }

    if (parseFloat(cargo_weight) > parseFloat(vehicle.max_capacity)) {
      await connection.rollback();
      return res.status(400).json({ 
        error: `Cargo weight (${cargo_weight} kg) exceeds vehicle capacity (${vehicle.max_capacity} kg)` 
      });
    }

    // Validate driver availability and license
    const [drivers] = await connection.query('SELECT * FROM drivers WHERE id = ?', [driver_id]);
    if (drivers.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Driver not found' });
    }

    const driver = drivers[0];
    if (driver.status === 'Suspended') {
      await connection.rollback();
      return res.status(400).json({ error: 'Driver is suspended' });
    }

    if (driver.status === 'On Trip') {
      await connection.rollback();
      return res.status(400).json({ error: 'Driver is already on a trip' });
    }

    const today = new Date().toISOString().split('T')[0];
    if (driver.license_expiry < today) {
      await connection.rollback();
      return res.status(400).json({ error: 'Driver license has expired' });
    }

    // Create trip
    const [result] = await connection.query(
      'INSERT INTO trips (vehicle_id, driver_id, cargo_weight, origin, destination, scheduled_date, notes, start_odometer) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [vehicle_id, driver_id, cargo_weight, origin, destination, scheduled_date, notes, vehicle.odometer]
    );

    await connection.commit();
    res.status(201).json({ message: 'Trip created successfully', tripId: result.insertId });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating trip:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    connection.release();
  }
});

// Update trip status (Dispatch, Complete, Cancel)
router.put('/:id/status', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { status, end_odometer } = req.body;
    const tripId = req.params.id;

    const [trips] = await connection.query('SELECT * FROM trips WHERE id = ?', [tripId]);
    if (trips.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Trip not found' });
    }

    const trip = trips[0];

    if (status === 'Dispatched') {
      // Update vehicle and driver status to "On Trip"
      await connection.query('UPDATE vehicles SET status = ? WHERE id = ?', ['On Trip', trip.vehicle_id]);
      await connection.query('UPDATE drivers SET status = ? WHERE id = ?', ['On Trip', trip.driver_id]);
      await connection.query('UPDATE trips SET status = ? WHERE id = ?', ['Dispatched', tripId]);
    } 
    else if (status === 'Completed') {
      if (!end_odometer) {
        await connection.rollback();
        return res.status(400).json({ error: 'End odometer reading is required' });
      }

      const distance = parseFloat(end_odometer) - parseFloat(trip.start_odometer);
      
      // Update trip
      await connection.query(
        'UPDATE trips SET status = ?, end_odometer = ?, distance = ?, completed_date = NOW() WHERE id = ?',
        ['Completed', end_odometer, distance, tripId]
      );

      // Update vehicle odometer and status back to Available
      await connection.query('UPDATE vehicles SET odometer = ?, status = ? WHERE id = ?', [end_odometer, 'Available', trip.vehicle_id]);
      
      // Update driver status back to On Duty
      await connection.query('UPDATE drivers SET status = ? WHERE id = ?', ['On Duty', trip.driver_id]);
    }
    else if (status === 'Cancelled') {
      await connection.query('UPDATE trips SET status = ? WHERE id = ?', ['Cancelled', tripId]);
      
      // Only reset statuses if trip was dispatched
      if (trip.status === 'Dispatched') {
        await connection.query('UPDATE vehicles SET status = ? WHERE id = ?', ['Available', trip.vehicle_id]);
        await connection.query('UPDATE drivers SET status = ? WHERE id = ?', ['On Duty', trip.driver_id]);
      }
    }

    await connection.commit();
    res.json({ message: 'Trip status updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating trip status:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    connection.release();
  }
});

module.exports = router;

