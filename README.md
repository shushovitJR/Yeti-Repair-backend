# Yeti Repair Management - Backend API

A comprehensive REST API backend for managing device repairs, requests, vendors, and maintenance workflows. Built with **Express.js** and **TypeScript**, this backend provides secure authentication, role-based access control, and integration with SQL Server databases.

## Overview

This backend service powers the Yeti Repair Management application, enabling organizations to track device repairs, manage repair requests, monitor repair status, generate reports, and manage vendor relationships.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control (RBAC)
- **Device Management**: Track devices, their details, and repair history
- **Repair Management**: Create, update, and monitor repair requests and statuses
- **Request Management**: Handle device repair requests with status tracking
- **Vendor Management**: Manage vendor information and repair partnerships
- **Department Management**: Organize repairs by department
- **Reporting**: Generate repair statistics and reports
- **Status Tracking**: Real-time status updates for repairs and requests
- **Password Security**: Bcrypt encryption for user passwords
- **CORS Support**: Configured for secure cross-origin requests

## Tech Stack

- **Runtime**: Node.js with ES Modules
- **Language**: TypeScript 5.9+
- **Framework**: Express.js 5.x
- **Database**: SQL Server (MSSQL)
- **Authentication**: JWT (JSON Web Tokens) & Bcrypt
- **Build Tools**: tsx, TypeScript Compiler
- **Security**: CORS, bcryptjs

## Prerequisites

- Node.js 18+ and npm
- SQL Server database instance
- Environment variables configured (see Configuration section)

## Installation

### 1. Clone and Navigate

```bash
cd Yeti-Repair-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Database Configuration
DB_SERVER=your-server-address
DB_NAME=yeti_repair_db
DB_USER=your-username
DB_PASSWORD=your-password
DB_PORT=1433

# JWT Configuration
JWT_SECRET=your-secret-key-here

# API Configuration
REACT_APP_API_URL=http://localhost
PORT=5000
```

**Required Variables**:
- `DB_SERVER`: SQL Server host (supports `HOST\INSTANCE` format for named instances)
- `DB_NAME`: Database name
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `JWT_SECRET`: Secret key for JWT signing (min 32 characters recommended)
- `REACT_APP_API_URL`: Base URL for API (used for CORS configuration)

**Optional Variables**:
- `DB_PORT`: Database port (defaults to 1433)

## Available Scripts

### Development

```bash
npm run dev
```
Starts the server in watch mode with hot reload (uses tsx with --watch flag)

### Production

```bash
npm start
```
Runs the compiled server in production mode

### Build

```bash
npm run build
```
Compiles TypeScript to JavaScript

## Project Structure

```
src/
├── index.ts              # Express app configuration and route setup
├── server.ts             # Server entry point and database connection
├── config/
│   └── db.ts            # MSSQL database connection setup
├── controllers/          # Business logic for each feature
│   ├── authController.ts
│   ├── deviceController.ts
│   ├── repairController.ts
│   ├── requestController.ts
│   ├── vendorController.ts
│   ├── departmentController.ts
│   ├── repairStatusController.ts
│   ├── requestStatusController.ts
│   └── reportController.ts
├── routes/              # API endpoint definitions
│   ├── authRoutes.ts
│   ├── deviceRoutes.ts
│   ├── repairRoutes.ts
│   ├── requestRoutes.ts
│   ├── vendorRoutes.ts
│   ├── departmentRoutes.ts
│   ├── repairStatusRoutes.ts
│   ├── requestStatusRoutes.ts
│   └── reportRoutes.ts
└── middlewares/         # Express middleware
    └── authMiddleware.ts
```

## API Endpoints

### Authentication
- `POST /auth/login` - User login and JWT token generation

### Devices
- `GET /api/device` - List all devices
- `POST /api/device` - Create new device
- `GET /api/device/:id` - Get device details
- `PUT /api/device/:id` - Update device
- `DELETE /api/device/:id` - Delete device

### Repairs
- `GET /api/repair` - List all repairs
- `POST /api/repair` - Create repair record
- `GET /api/repair/:id` - Get repair details
- `PUT /api/repair/:id` - Update repair
- `DELETE /api/repair/:id` - Delete repair

### Repair Requests
- `GET /api/request` - List all repair requests
- `POST /api/request` - Create repair request
- `GET /api/request/:id` - Get request details
- `PUT /api/request/:id` - Update request
- `DELETE /api/request/:id` - Delete request

### Vendors
- `GET /api/vendor` - List all vendors
- `POST /api/vendor` - Create vendor
- `GET /api/vendor/:id` - Get vendor details
- `PUT /api/vendor/:id` - Update vendor
- `DELETE /api/vendor/:id` - Delete vendor

### Departments
- `GET /api/department` - List all departments
- `POST /api/department` - Create department
- `GET /api/department/:id` - Get department details
- `PUT /api/department/:id` - Update department
- `DELETE /api/department/:id` - Delete department

### Status Management
- `GET /api/repairStatus` - List repair statuses
- `POST /api/repairStatus` - Create repair status
- `GET /api/requestStatus` - List request statuses
- `POST /api/requestStatus` - Create request status

### Reports
- `GET /api/report` - Generate repair reports
- `GET /api/report/analytics` - Get analytics data

## Authentication & Authorization

### How It Works

1. **Login**: User submits credentials to `/auth/login`
2. **Token Generation**: Server verifies credentials and generates a JWT token (valid for 30 days)
3. **Token Usage**: Client includes token in Authorization header: `Authorization: Bearer <token>`
4. **Verification**: Middleware verifies token validity before allowing access

### Password Security

- Passwords are hashed using **bcrypt** (10 salt rounds)
- Plain-text passwords are automatically re-hashed on first login
- Password comparisons use bcrypt's secure comparison methods

## Database Connection

The backend uses **MSSQL** with the following features:

- **Named Instance Support**: Automatically handles `HOST\INSTANCE` format
- **Port Configuration**: Supports explicit port specification
- **Connection Pooling**: Efficient connection management
- **Error Handling**: Comprehensive validation of connection parameters

### Connection Configuration

The database connection validates all required environment variables on startup and provides detailed error messages if any are missing.

## CORS Configuration

The server is configured to accept requests from:
- `http://localhost:3000` (local development)
- `${REACT_APP_API_URL}:3000` (configured API URL)

Modify `src/index.ts` to add additional allowed origins for different environments.

## Error Handling

The backend implements consistent error handling:

- **401 Unauthorized**: Invalid or missing authentication
- **403 Forbidden**: Insufficient permissions for the resource
- **404 Not Found**: Resource does not exist
- **500 Internal Server Error**: Unexpected server errors

All error responses include a descriptive message.

## Development Workflow

### Running in Development

```bash
npm run dev
```

The server will:
1. Connect to the MSSQL database
2. Start listening on port 5000
3. Reload automatically when files change
4. Log all requests and activities

### Testing Endpoints

Use tools like:
- **Postman** - Visual API testing

## TypeScript Configuration

The project uses strict TypeScript settings for better type safety:

- **Strict Mode**: Enabled for rigorous type checking
- **Module Resolution**: Uses "bundler" strategy for ES modules
- **Target**: ES Next for modern JavaScript features
- **Source Maps**: Enabled for debugging
