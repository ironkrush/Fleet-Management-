require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function setupDatabase() {
  let connection;
  
  try {
    // Connect to MySQL server (without database)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });

    console.log('Connected to MySQL server');

    // Create database
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'fleetflow'}`);
    console.log('Database created or already exists');

    // Use the database
    await connection.query(`USE ${process.env.DB_NAME || 'fleetflow'}`);

    // Create Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role ENUM('Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Users table created');

    // Create Vehicles table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        model VARCHAR(255) NOT NULL,
        license_plate VARCHAR(50) UNIQUE NOT NULL,
        vehicle_type ENUM('Truck', 'Van', 'Bike') NOT NULL,
        max_capacity DECIMAL(10, 2) NOT NULL,
        odometer DECIMAL(10, 2) DEFAULT 0,
        status ENUM('Available', 'On Trip', 'In Shop', 'Out of Service') DEFAULT 'Available',
        region VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Vehicles table created');

    // Create Drivers table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS drivers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        license_number VARCHAR(100) UNIQUE NOT NULL,
        license_expiry DATE NOT NULL,
        license_category VARCHAR(50) NOT NULL,
        status ENUM('On Duty', 'Off Duty', 'Suspended', 'On Trip') DEFAULT 'Off Duty',
        safety_score DECIMAL(5, 2) DEFAULT 100.00,
        trip_completion_rate DECIMAL(5, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Drivers table created');

    // Create Trips table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS trips (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vehicle_id INT NOT NULL,
        driver_id INT NOT NULL,
        cargo_weight DECIMAL(10, 2) NOT NULL,
        origin VARCHAR(255) NOT NULL,
        destination VARCHAR(255) NOT NULL,
        status ENUM('Draft', 'Dispatched', 'Completed', 'Cancelled') DEFAULT 'Draft',
        start_odometer DECIMAL(10, 2),
        end_odometer DECIMAL(10, 2),
        distance DECIMAL(10, 2),
        scheduled_date DATETIME,
        completed_date DATETIME,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
        FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
      )
    `);
    console.log('Trips table created');

    // Create Maintenance Logs table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS maintenance_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vehicle_id INT NOT NULL,
        service_type VARCHAR(255) NOT NULL,
        description TEXT,
        cost DECIMAL(10, 2) NOT NULL,
        service_date DATE NOT NULL,
        odometer_reading DECIMAL(10, 2),
        status ENUM('Scheduled', 'In Progress', 'Completed') DEFAULT 'Scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
      )
    `);
    console.log('Maintenance logs table created');

    // Create Fuel Logs table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS fuel_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vehicle_id INT NOT NULL,
        trip_id INT,
        liters DECIMAL(10, 2) NOT NULL,
        cost DECIMAL(10, 2) NOT NULL,
        fuel_date DATE NOT NULL,
        odometer_reading DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL
      )
    `);
    console.log('Fuel logs table created');

    // Create Expenses table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vehicle_id INT NOT NULL,
        expense_type ENUM('Fuel', 'Maintenance', 'Insurance', 'Other') NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        expense_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
      )
    `);
    console.log('Expenses table created');

    // Clear existing sample data (in reverse order due to foreign keys)
    console.log('\nClearing existing sample data...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE expenses');
    await connection.query('TRUNCATE TABLE fuel_logs');
    await connection.query('TRUNCATE TABLE maintenance_logs');
    await connection.query('TRUNCATE TABLE trips');
    await connection.query('TRUNCATE TABLE drivers');
    await connection.query('TRUNCATE TABLE vehicles');
    await connection.query('TRUNCATE TABLE users');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✓ Existing data cleared and auto-increment reset');

    // Insert sample users
    console.log('\nInserting sample users...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const managerPassword = await bcrypt.hash('manager123', 10);
    const dispatcherPassword = await bcrypt.hash('dispatcher123', 10);
    const safetyPassword = await bcrypt.hash('safety123', 10);
    const analystPassword = await bcrypt.hash('analyst123', 10);

    await connection.query(`
      INSERT INTO users (email, password, full_name, role) VALUES
      ('admin@fleetflow.com', ?, 'John Anderson', 'Manager'),
      ('manager@fleetflow.com', ?, 'Sarah Mitchell', 'Manager'),
      ('dispatcher@fleetflow.com', ?, 'Mike Rodriguez', 'Dispatcher'),
      ('safety@fleetflow.com', ?, 'Emily Chen', 'Safety Officer'),
      ('analyst@fleetflow.com', ?, 'David Thompson', 'Financial Analyst')
    `, [adminPassword, managerPassword, dispatcherPassword, safetyPassword, analystPassword]);
    console.log('✓ 5 sample users created');

    // Insert sample vehicles
    console.log('Inserting sample vehicles...');
    await connection.query(`
      INSERT INTO vehicles (name, model, license_plate, vehicle_type, max_capacity, odometer, status, region) VALUES
      ('Truck-01', 'Ford F-150 2022', 'ABC-1234', 'Truck', 1500.00, 45230.50, 'Available', 'North'),
      ('Truck-02', 'Chevrolet Silverado 2021', 'XYZ-5678', 'Truck', 1800.00, 62150.75, 'On Trip', 'South'),
      ('Van-01', 'Mercedes Sprinter 2023', 'VAN-2468', 'Van', 1200.00, 12450.25, 'Available', 'East'),
      ('Van-02', 'Ford Transit 2022', 'VAN-1357', 'Van', 1000.00, 38920.00, 'In Shop', 'West'),
      ('Van-03', 'Ram ProMaster 2023', 'VAN-9876', 'Van', 1100.00, 8750.50, 'Available', 'North'),
      ('Truck-03', 'GMC Sierra 2020', 'TRK-4321', 'Truck', 2000.00, 95430.00, 'Available', 'South'),
      ('Bike-01', 'Honda CB500X 2023', 'BKE-1111', 'Bike', 50.00, 3250.00, 'Available', 'East'),
      ('Bike-02', 'Yamaha MT-07 2022', 'BKE-2222', 'Bike', 45.00, 8920.00, 'Available', 'West'),
      ('Van-04', 'Nissan NV3500 2021', 'VAN-5555', 'Van', 1300.00, 71200.00, 'Available', 'North'),
      ('Truck-04', 'Toyota Tundra 2023', 'TRK-7777', 'Truck', 1600.00, 15680.00, 'Out of Service', 'South')
    `);
    console.log('✓ 10 sample vehicles created');

    // Insert sample drivers
    console.log('Inserting sample drivers...');
    const today = new Date();
    const futureDate = new Date(today.getFullYear() + 2, today.getMonth(), today.getDate());
    const soonExpiry = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
    const expiredDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());

    await connection.query(`
      INSERT INTO drivers (full_name, email, phone, license_number, license_expiry, license_category, status, safety_score, trip_completion_rate) VALUES
      ('Alex Johnson', 'alex.johnson@fleet.com', '555-0101', 'DL-2024-001', ?, 'Truck, Van', 'On Duty', 98.50, 95.00),
      ('Maria Garcia', 'maria.garcia@fleet.com', '555-0102', 'DL-2024-002', ?, 'Van', 'On Trip', 96.75, 92.50),
      ('James Wilson', 'james.wilson@fleet.com', '555-0103', 'DL-2024-003', ?, 'Truck', 'On Duty', 94.20, 88.00),
      ('Lisa Brown', 'lisa.brown@fleet.com', '555-0104', 'DL-2024-004', ?, 'Van, Bike', 'Off Duty', 99.10, 97.50),
      ('Robert Taylor', 'robert.taylor@fleet.com', '555-0105', 'DL-2024-005', ?, 'Truck, Van', 'On Duty', 91.50, 85.00),
      ('Jennifer Lee', 'jennifer.lee@fleet.com', '555-0106', 'DL-2024-006', ?, 'Bike', 'On Duty', 97.80, 94.00),
      ('Michael Davis', 'michael.davis@fleet.com', '555-0107', 'DL-2023-007', ?, 'Truck', 'Suspended', 75.00, 65.00),
      ('Amanda Martinez', 'amanda.martinez@fleet.com', '555-0108', 'DL-2024-008', ?, 'Van', 'On Duty', 95.60, 90.00)
    `, [
      futureDate.toISOString().split('T')[0],
      futureDate.toISOString().split('T')[0],
      futureDate.toISOString().split('T')[0],
      futureDate.toISOString().split('T')[0],
      soonExpiry.toISOString().split('T')[0],
      futureDate.toISOString().split('T')[0],
      expiredDate.toISOString().split('T')[0],
      futureDate.toISOString().split('T')[0]
    ]);
    console.log('✓ 8 sample drivers created (including 1 expired license, 1 expiring soon)');

    // Insert sample trips
    console.log('Inserting sample trips...');
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twentyDaysAgo = new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000);
    const tenDaysAgo = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000);

    await connection.query(`
      INSERT INTO trips (vehicle_id, driver_id, cargo_weight, origin, destination, status, start_odometer, end_odometer, distance, scheduled_date, completed_date, notes) VALUES
      (1, 1, 1200.00, 'New York, NY', 'Boston, MA', 'Completed', 44800.00, 45230.50, 430.50, ?, ?, 'Delivered electronics'),
      (3, 2, 950.00, 'Los Angeles, CA', 'San Francisco, CA', 'Completed', 12000.00, 12380.00, 380.00, ?, ?, 'Medical supplies'),
      (6, 3, 1750.00, 'Chicago, IL', 'Detroit, MI', 'Completed', 95000.00, 95280.00, 280.00, ?, ?, 'Auto parts delivery'),
      (5, 4, 850.00, 'Houston, TX', 'Dallas, TX', 'Completed', 8500.00, 8750.50, 250.50, ?, ?, 'Office furniture'),
      (7, 6, 35.00, 'Miami, FL', 'Fort Lauderdale, FL', 'Completed', 3200.00, 3250.00, 50.00, ?, ?, 'Document delivery'),
      (2, 2, 1600.00, 'Seattle, WA', 'Portland, OR', 'Dispatched', 62150.75, NULL, NULL, ?, NULL, 'Construction materials'),
      (1, 1, 1100.00, 'Phoenix, AZ', 'Las Vegas, NV', 'Draft', NULL, NULL, NULL, ?, NULL, 'Retail goods'),
      (3, 8, 900.00, 'Denver, CO', 'Salt Lake City, UT', 'Draft', NULL, NULL, NULL, ?, NULL, 'Food supplies'),
      (9, 5, 1250.00, 'Atlanta, GA', 'Charlotte, NC', 'Completed', 70800.00, 71050.00, 250.00, ?, ?, 'Textile shipment'),
      (8, 6, 40.00, 'Orlando, FL', 'Tampa, FL', 'Completed', 8850.00, 8920.00, 70.00, ?, ?, 'Express package'),
      (6, 3, 1900.00, 'Philadelphia, PA', 'Baltimore, MD', 'Cancelled', 95280.00, NULL, NULL, ?, NULL, 'Customer cancelled order'),
      (5, 4, 1050.00, 'San Diego, CA', 'Los Angeles, CA', 'Completed', 8750.50, 8870.50, 120.00, ?, ?, 'Pharmaceutical delivery'),
      (1, 1, 1300.00, 'Nashville, TN', 'Memphis, TN', 'Draft', NULL, NULL, NULL, ?, NULL, 'Music equipment'),
      (7, 6, 42.00, 'Austin, TX', 'San Antonio, TX', 'Completed', 3100.00, 3180.00, 80.00, ?, ?, 'Legal documents'),
      (9, 8, 1150.00, 'Minneapolis, MN', 'Milwaukee, WI', 'Completed', 71050.00, 71200.00, 150.00, ?, ?, 'Manufacturing parts')
    `, [
      thirtyDaysAgo.toISOString().split('T')[0], twentyDaysAgo.toISOString().split('T')[0],
      twentyDaysAgo.toISOString().split('T')[0], tenDaysAgo.toISOString().split('T')[0],
      tenDaysAgo.toISOString().split('T')[0], fiveDaysAgo.toISOString().split('T')[0],
      fiveDaysAgo.toISOString().split('T')[0], yesterday.toISOString().split('T')[0],
      yesterday.toISOString().split('T')[0], yesterday.toISOString().split('T')[0],
      today.toISOString().split('T')[0],
      today.toISOString().split('T')[0],
      today.toISOString().split('T')[0],
      fiveDaysAgo.toISOString().split('T')[0], yesterday.toISOString().split('T')[0],
      tenDaysAgo.toISOString().split('T')[0], fiveDaysAgo.toISOString().split('T')[0],
      yesterday.toISOString().split('T')[0],
      fiveDaysAgo.toISOString().split('T')[0],
      yesterday.toISOString().split('T')[0],
      today.toISOString().split('T')[0],
      yesterday.toISOString().split('T')[0], today.toISOString().split('T')[0],
      today.toISOString().split('T')[0],
      tenDaysAgo.toISOString().split('T')[0], fiveDaysAgo.toISOString().split('T')[0],
      fiveDaysAgo.toISOString().split('T')[0], yesterday.toISOString().split('T')[0]
    ]);
    console.log('✓ 15 sample trips created (Draft, Dispatched, Completed, Cancelled)');

    // Insert sample maintenance logs
    console.log('Inserting sample maintenance logs...');
    await connection.query(`
      INSERT INTO maintenance_logs (vehicle_id, service_type, description, cost, service_date, odometer_reading, status) VALUES
      (4, 'Oil Change', 'Regular oil change and filter replacement', 85.00, ?, 38920.00, 'In Progress'),
      (1, 'Tire Replacement', 'Replaced all four tires', 650.00, ?, 44500.00, 'Completed'),
      (6, 'Brake Service', 'Brake pad replacement and rotor resurfacing', 420.00, ?, 94800.00, 'Completed'),
      (3, 'Engine Tune-up', 'Complete engine tune-up and diagnostics', 380.00, ?, 12200.00, 'Completed'),
      (9, 'Transmission Service', 'Transmission fluid change and inspection', 275.00, ?, 70500.00, 'Completed'),
      (2, 'Air Conditioning Repair', 'AC compressor replacement', 890.00, ?, 61800.00, 'Completed'),
      (5, 'Battery Replacement', 'New battery installation', 165.00, ?, 8600.00, 'Completed'),
      (8, 'Chain and Sprocket', 'Motorcycle chain and sprocket replacement', 320.00, ?, 8500.00, 'Completed')
    `, [
      today.toISOString().split('T')[0],
      twentyDaysAgo.toISOString().split('T')[0],
      tenDaysAgo.toISOString().split('T')[0],
      fiveDaysAgo.toISOString().split('T')[0],
      fiveDaysAgo.toISOString().split('T')[0],
      tenDaysAgo.toISOString().split('T')[0],
      yesterday.toISOString().split('T')[0],
      fiveDaysAgo.toISOString().split('T')[0]
    ]);
    console.log('✓ 8 sample maintenance logs created');

    // Insert sample fuel logs
    console.log('Inserting sample fuel logs...');
    await connection.query(`
      INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, fuel_date, odometer_reading) VALUES
      (1, 1, 65.50, 196.50, ?, 45230.50),
      (3, 2, 52.30, 167.36, ?, 12380.00),
      (6, 3, 48.75, 151.13, ?, 95280.00),
      (5, 4, 45.20, 144.64, ?, 8750.50),
      (7, 5, 12.50, 43.75, ?, 3250.00),
      (2, 6, 70.00, 224.00, ?, 62150.75),
      (9, 9, 58.40, 181.04, ?, 71050.00),
      (8, 10, 10.80, 37.80, ?, 8920.00),
      (1, NULL, 68.00, 204.00, ?, 45100.00),
      (3, NULL, 50.00, 160.00, ?, 12300.00),
      (6, NULL, 72.50, 224.75, ?, 95100.00),
      (5, 12, 46.30, 148.16, ?, 8870.50)
    `, [
      twentyDaysAgo.toISOString().split('T')[0],
      tenDaysAgo.toISOString().split('T')[0],
      fiveDaysAgo.toISOString().split('T')[0],
      yesterday.toISOString().split('T')[0],
      yesterday.toISOString().split('T')[0],
      today.toISOString().split('T')[0],
      yesterday.toISOString().split('T')[0],
      yesterday.toISOString().split('T')[0],
      thirtyDaysAgo.toISOString().split('T')[0],
      tenDaysAgo.toISOString().split('T')[0],
      fiveDaysAgo.toISOString().split('T')[0],
      yesterday.toISOString().split('T')[0]
    ]);
    console.log('✓ 12 sample fuel logs created');

    // Insert sample expenses (from maintenance and fuel)
    console.log('Inserting sample expenses...');
    await connection.query(`
      INSERT INTO expenses (vehicle_id, expense_type, amount, description, expense_date) VALUES
      (4, 'Maintenance', 85.00, 'Oil Change: Regular oil change and filter replacement', ?),
      (1, 'Maintenance', 650.00, 'Tire Replacement: Replaced all four tires', ?),
      (6, 'Maintenance', 420.00, 'Brake Service: Brake pad replacement and rotor resurfacing', ?),
      (3, 'Maintenance', 380.00, 'Engine Tune-up: Complete engine tune-up and diagnostics', ?),
      (9, 'Maintenance', 275.00, 'Transmission Service: Transmission fluid change and inspection', ?),
      (2, 'Maintenance', 890.00, 'Air Conditioning Repair: AC compressor replacement', ?),
      (5, 'Maintenance', 165.00, 'Battery Replacement: New battery installation', ?),
      (8, 'Maintenance', 320.00, 'Chain and Sprocket: Motorcycle chain and sprocket replacement', ?),
      (1, 'Fuel', 196.50, 'Fuel: 65.5L', ?),
      (3, 'Fuel', 167.36, 'Fuel: 52.3L', ?),
      (6, 'Fuel', 151.13, 'Fuel: 48.75L', ?),
      (5, 'Fuel', 144.64, 'Fuel: 45.2L', ?),
      (7, 'Fuel', 43.75, 'Fuel: 12.5L', ?),
      (2, 'Fuel', 224.00, 'Fuel: 70.0L', ?),
      (9, 'Fuel', 181.04, 'Fuel: 58.4L', ?),
      (8, 'Fuel', 37.80, 'Fuel: 10.8L', ?),
      (1, 'Fuel', 204.00, 'Fuel: 68.0L', ?),
      (3, 'Fuel', 160.00, 'Fuel: 50.0L', ?),
      (6, 'Fuel', 224.75, 'Fuel: 72.5L', ?),
      (5, 'Fuel', 148.16, 'Fuel: 46.3L', ?)
    `, [
      today.toISOString().split('T')[0],
      twentyDaysAgo.toISOString().split('T')[0],
      tenDaysAgo.toISOString().split('T')[0],
      fiveDaysAgo.toISOString().split('T')[0],
      fiveDaysAgo.toISOString().split('T')[0],
      tenDaysAgo.toISOString().split('T')[0],
      yesterday.toISOString().split('T')[0],
      fiveDaysAgo.toISOString().split('T')[0],
      twentyDaysAgo.toISOString().split('T')[0],
      tenDaysAgo.toISOString().split('T')[0],
      fiveDaysAgo.toISOString().split('T')[0],
      yesterday.toISOString().split('T')[0],
      yesterday.toISOString().split('T')[0],
      today.toISOString().split('T')[0],
      yesterday.toISOString().split('T')[0],
      yesterday.toISOString().split('T')[0],
      thirtyDaysAgo.toISOString().split('T')[0],
      tenDaysAgo.toISOString().split('T')[0],
      fiveDaysAgo.toISOString().split('T')[0],
      yesterday.toISOString().split('T')[0]
    ]);
    console.log('✓ 20 sample expenses created');

    console.log('\n✅ Database setup completed successfully with sample data!');
    console.log('\n' + '='.repeat(70));
    console.log('📊 SAMPLE DATA SUMMARY');
    console.log('='.repeat(70));
    console.log('👥 Users:           5 (Admin, Manager, Dispatcher, Safety Officer, Analyst)');
    console.log('🚚 Vehicles:        10 (Trucks, Vans, Bikes - various statuses)');
    console.log('👤 Drivers:         8 (including 1 expired license for testing)');
    console.log('🗺️  Trips:          15 (Draft, Dispatched, Completed, Cancelled)');
    console.log('🔧 Maintenance:     8 logs (including 1 in progress)');
    console.log('⛽ Fuel Logs:       12 entries');
    console.log('💰 Expenses:        20 records (auto-generated from fuel & maintenance)');
    console.log('='.repeat(70));
    console.log('\n🔐 LOGIN CREDENTIALS:');
    console.log('='.repeat(70));
    console.log('Admin/Manager:      admin@fleetflow.com / admin123');
    console.log('Manager:            manager@fleetflow.com / manager123');
    console.log('Dispatcher:         dispatcher@fleetflow.com / dispatcher123');
    console.log('Safety Officer:     safety@fleetflow.com / safety123');
    console.log('Financial Analyst:  analyst@fleetflow.com / analyst123');
    console.log('='.repeat(70));
    console.log('\n💡 TESTING NOTES:');
    console.log('='.repeat(70));
    console.log('• Driver "Michael Davis" has an EXPIRED license (for validation testing)');
    console.log('• Driver "Robert Taylor" has a license expiring soon');
    console.log('• Vehicle "Van-02" is currently "In Shop" (maintenance in progress)');
    console.log('• Vehicle "Truck-02" is "On Trip" (Trip #6 is dispatched)');
    console.log('• Vehicle "Truck-04" is "Out of Service"');
    console.log('• Try creating a trip with cargo > vehicle capacity to test validation');
    console.log('• Dashboard shows real metrics calculated from this sample data');
    console.log('='.repeat(70));
    console.log('\n🚀 Ready to start! Run: npm run dev');
    console.log('');
    
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();

