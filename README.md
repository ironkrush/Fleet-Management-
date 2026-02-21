# 🚛 FleetFlow - Fleet & Logistics Management System

A comprehensive, modular fleet management system built with **Node.js**, **Express**, **MySQL**, and **React**.

## ✨ Features

- **Dashboard**: Real-time KPIs and fleet overview
- **Vehicle Registry**: Complete asset management with status tracking
- **Driver Management**: License tracking, safety scores, and compliance
- **Trip Dispatcher**: Smart trip creation with validation rules
- **Maintenance Logs**: Service tracking with automatic status updates
- **Fuel Logs**: Fuel consumption and cost tracking
- **Analytics**: Operational metrics and financial reports

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm run install-all
```

### 2. Configure Database
Edit `.env` file with your MySQL credentials:
```
DB_PASSWORD=your_mysql_password
```

### 3. Setup Database
```bash
npm run setup-db
```

### 4. Run Application
```bash
npm run dev
```

### 5. Access Application
Open `http://localhost:3000` and login with:
- **Email**: admin@fleetflow.com
- **Password**: admin123

## 📖 Full Documentation

See [SETUP.md](SETUP.md) for complete setup instructions and feature documentation.

## 🏗️ Tech Stack

**Backend:**
- Node.js + Express
- MySQL (local database)
- JWT Authentication
- bcryptjs for password hashing

**Frontend:**
- React 18
- React Router v6
- Axios for API calls
- CSS3 (no external UI libraries)

## 📁 Project Structure

```
Fleet/
├── server/          # Backend API
├── client/          # React frontend
├── .env            # Environment variables
├── SETUP.md        # Detailed setup guide
└── README.md       # This file
```

## 🎯 Key Business Logic

1. **Trip Validation**: Cargo weight must not exceed vehicle capacity
2. **License Compliance**: Expired licenses block driver assignment
3. **Auto Status Updates**: Maintenance automatically sets vehicles to "In Shop"
4. **Trip Lifecycle**: Draft → Dispatched → Completed/Cancelled
5. **Cost Tracking**: Automatic expense recording for fuel and maintenance

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Protected API routes

## 📊 Database Schema

- **users**: Authentication and roles
- **vehicles**: Fleet assets
- **drivers**: Driver profiles and compliance
- **trips**: Trip management and tracking
- **maintenance_logs**: Service history
- **fuel_logs**: Fuel consumption
- **expenses**: Financial tracking

## 🛠️ Available Scripts

- `npm run dev` - Run both server and client
- `npm run server` - Run backend only
- `npm run client` - Run frontend only
- `npm run setup-db` - Initialize database
- `npm run install-all` - Install all dependencies

## 📝 License

MIT

---

**Built by Krushil Patel for efficient fleet management**

