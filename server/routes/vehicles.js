const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all vehicles
router.get('/', async (req, res) => {
  try {
    const { type, status, region } = req.query;
    let query = 'SELECT * FROM vehicles WHERE 1=1';
    const params = [];

    if (type) {
      query += ' AND vehicle_type = ?';
      params.push(type);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (region) {
      query += ' AND region = ?';
      params.push(region);
    }

    query += ' ORDER BY created_at DESC';

    const [vehicles] = await db.query(query, params);
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get available vehicles for dispatch
router.get('/available', async (req, res) => {
  try {
    const [vehicles] = await db.query(
      'SELECT * FROM vehicles WHERE status = ? ORDER BY name',
      ['Available']
    );
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching available vehicles:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single vehicle
router.get('/:id', async (req, res) => {
  try {
    const [vehicles] = await db.query('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
    
    if (vehicles.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(vehicles[0]);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create vehicle
router.post('/', async (req, res) => {
  try {
    const { name, model, license_plate, vehicle_type, max_capacity, region } = req.body;

    if (!name || !model || !license_plate || !vehicle_type || !max_capacity) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    const [result] = await db.query(
      'INSERT INTO vehicles (name, model, license_plate, vehicle_type, max_capacity, region) VALUES (?, ?, ?, ?, ?, ?)',
      [name, model, license_plate, vehicle_type, max_capacity, region]
    );

    res.status(201).json({ message: 'Vehicle created successfully', vehicleId: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'License plate already exists' });
    }
    console.error('Error creating vehicle:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update vehicle
router.put('/:id', async (req, res) => {
  try {
    const { name, model, license_plate, vehicle_type, max_capacity, odometer, status, region } = req.body;

    const [result] = await db.query(
      'UPDATE vehicles SET name = ?, model = ?, license_plate = ?, vehicle_type = ?, max_capacity = ?, odometer = ?, status = ?, region = ? WHERE id = ?',
      [name, model, license_plate, vehicle_type, max_capacity, odometer, status, region, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ message: 'Vehicle updated successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'License plate already exists' });
    }
    console.error('Error updating vehicle:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete vehicle
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM vehicles WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get vehicle statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const vehicleId = req.params.id;

    // Get total fuel cost
    const [fuelStats] = await db.query(
      'SELECT SUM(cost) as total_fuel_cost, SUM(liters) as total_liters FROM fuel_logs WHERE vehicle_id = ?',
      [vehicleId]
    );

    // Get total maintenance cost
    const [maintenanceStats] = await db.query(
      'SELECT SUM(cost) as total_maintenance_cost FROM maintenance_logs WHERE vehicle_id = ?',
      [vehicleId]
    );

    // Get trip count
    const [tripStats] = await db.query(
      'SELECT COUNT(*) as total_trips, SUM(distance) as total_distance FROM trips WHERE vehicle_id = ? AND status = ?',
      [vehicleId, 'Completed']
    );

    res.json({
      total_fuel_cost: fuelStats[0].total_fuel_cost || 0,
      total_liters: fuelStats[0].total_liters || 0,
      total_maintenance_cost: maintenanceStats[0].total_maintenance_cost || 0,
      total_trips: tripStats[0].total_trips || 0,
      total_distance: tripStats[0].total_distance || 0,
      total_operational_cost: (fuelStats[0].total_fuel_cost || 0) + (maintenanceStats[0].total_maintenance_cost || 0)
    });
  } catch (error) {
    console.error('Error fetching vehicle stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

