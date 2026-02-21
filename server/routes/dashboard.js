const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Get dashboard KPIs
router.get('/kpis', async (req, res) => {
  try {
    // Active Fleet (On Trip)
    const [activeFleet] = await db.query(
      'SELECT COUNT(*) as count FROM vehicles WHERE status = ?',
      ['On Trip']
    );

    // Maintenance Alerts (In Shop)
    const [maintenanceAlerts] = await db.query(
      'SELECT COUNT(*) as count FROM vehicles WHERE status = ?',
      ['In Shop']
    );

    // Total vehicles
    const [totalVehicles] = await db.query(
      'SELECT COUNT(*) as count FROM vehicles WHERE status != ?',
      ['Out of Service']
    );

    // Utilization Rate
    const utilizationRate = totalVehicles[0].count > 0
      ? ((activeFleet[0].count / totalVehicles[0].count) * 100).toFixed(2)
      : 0;

    // Pending Cargo (Draft trips)
    const [pendingCargo] = await db.query(
      'SELECT COUNT(*) as count FROM trips WHERE status = ?',
      ['Draft']
    );

    // Available vehicles
    const [availableVehicles] = await db.query(
      'SELECT COUNT(*) as count FROM vehicles WHERE status = ?',
      ['Available']
    );

    // Available drivers
    const [availableDrivers] = await db.query(
      'SELECT COUNT(*) as count FROM drivers WHERE status IN (?, ?)',
      ['On Duty', 'Off Duty']
    );

    // Expired licenses
    const today = new Date().toISOString().split('T')[0];
    const [expiredLicenses] = await db.query(
      'SELECT COUNT(*) as count FROM drivers WHERE license_expiry < ?',
      [today]
    );

    res.json({
      active_fleet: activeFleet[0].count,
      maintenance_alerts: maintenanceAlerts[0].count,
      utilization_rate: parseFloat(utilizationRate),
      pending_cargo: pendingCargo[0].count,
      available_vehicles: availableVehicles[0].count,
      available_drivers: availableDrivers[0].count,
      expired_licenses: expiredLicenses[0].count,
      total_vehicles: totalVehicles[0].count
    });
  } catch (error) {
    console.error('Error fetching dashboard KPIs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get analytics data
router.get('/analytics', async (req, res) => {
  try {
    // Total fuel cost
    const [fuelCost] = await db.query('SELECT SUM(cost) as total FROM fuel_logs');

    // Total maintenance cost
    const [maintenanceCost] = await db.query('SELECT SUM(cost) as total FROM maintenance_logs');

    // Total trips
    const [totalTrips] = await db.query('SELECT COUNT(*) as count FROM trips WHERE status = ?', ['Completed']);

    // Total distance
    const [totalDistance] = await db.query('SELECT SUM(distance) as total FROM trips WHERE status = ?', ['Completed']);

    // Total fuel liters
    const [totalFuel] = await db.query('SELECT SUM(liters) as total FROM fuel_logs');

    // Fuel efficiency (km/L)
    const fuelEfficiency = totalFuel[0].total > 0
      ? ((totalDistance[0].total || 0) / totalFuel[0].total).toFixed(2)
      : 0;

    // Vehicle type distribution
    const [vehicleTypes] = await db.query(`
      SELECT vehicle_type, COUNT(*) as count 
      FROM vehicles 
      WHERE status != 'Out of Service'
      GROUP BY vehicle_type
    `);

    // Recent trips
    const [recentTrips] = await db.query(`
      SELECT t.*, v.name as vehicle_name, d.full_name as driver_name
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN drivers d ON t.driver_id = d.id
      ORDER BY t.created_at DESC
      LIMIT 10
    `);

    res.json({
      total_fuel_cost: fuelCost[0].total || 0,
      total_maintenance_cost: maintenanceCost[0].total || 0,
      total_operational_cost: (fuelCost[0].total || 0) + (maintenanceCost[0].total || 0),
      total_trips: totalTrips[0].count,
      total_distance: totalDistance[0].total || 0,
      fuel_efficiency: parseFloat(fuelEfficiency),
      vehicle_types: vehicleTypes,
      recent_trips: recentTrips
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

