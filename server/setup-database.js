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

    // Insert default admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await connection.query(`
      INSERT IGNORE INTO users (email, password, full_name, role) 
      VALUES ('admin@fleetflow.com', ?, 'System Administrator', 'Manager')
    `, [hashedPassword]);
    console.log('Default admin user created (email: admin@fleetflow.com, password: admin123)');

    console.log('\n✅ Database setup completed successfully!');
    console.log('\nDefault Login Credentials:');
    console.log('Email: admin@fleetflow.com');
    console.log('Password: admin123');
    
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

