/**
 * Backend Connection Guide
 * Provides instructions for resolving backend connection issues
 */

export const BACKEND_TROUBLESHOOTING_STEPS = [
  {
    title: "Start Backend Server",
    description: "Ensure the Node.js backend server is running",
    commands: [
      "cd backend",
      "npm install",
      "npm start"
    ],
    expectedResult: "Server should start on http://localhost:3001"
  },
  {
    title: "Check Database Connection", 
    description: "Verify PostgreSQL database is running and accessible",
    commands: [
      "# Check if PostgreSQL is running",
      "sudo service postgresql status",
      "# Or on Windows/Mac with PostgreSQL app",
      "# Make sure PostgreSQL service is started"
    ],
    expectedResult: "PostgreSQL service should be active"
  },
  {
    title: "Verify Database Configuration",
    description: "Check if database credentials are correct",
    commands: [
      "# Check backend/.env file exists",
      "ls backend/.env",
      "# Verify DATABASE_URL is configured"
    ],
    expectedResult: "Environment variables should be properly set"
  },
  {
    title: "Test API Endpoint",
    description: "Manually test if backend API is responding",
    commands: [
      "curl http://localhost:3001/api/status",
      "# Or visit in browser: http://localhost:3001/api/status"
    ],
    expectedResult: "Should return JSON response with success: true"
  }
];

export const BACKEND_COMMON_ERRORS = {
  'Failed to fetch': {
    problem: "Frontend cannot reach backend server",
    solutions: [
      "Check if backend server is running on port 3001",
      "Verify no firewall is blocking the connection",
      "Make sure backend started without errors"
    ]
  },
  'Connection refused': {
    problem: "Backend server is not responding",
    solutions: [
      "Start the backend server: cd backend && npm start",
      "Check if port 3001 is available",
      "Look for backend startup errors in console"
    ]
  },
  'Database connection error': {
    problem: "Backend cannot connect to PostgreSQL database",
    solutions: [
      "Start PostgreSQL service",
      "Check database credentials in backend/.env",
      "Verify database exists and is accessible",
      "Run database migrations if needed"
    ]
  }
};

export const generateBackendSetupInstructions = (): string => {
  return `
# D'Busana Backend Setup Instructions

## Quick Start
1. Open terminal in project root
2. Navigate to backend directory: cd backend
3. Install dependencies: npm install
4. Start server: npm start
5. Verify: Open http://localhost:3001/api/status

## If you see connection errors:

### Step 1: Check Backend Server
- Terminal should show: "Server running on port 3001"
- No error messages during startup

### Step 2: Check Database
- PostgreSQL must be running
- Database credentials in backend/.env must be correct
- Database should be accessible

### Step 3: Test API
- Visit: http://localhost:3001/api/status
- Should return: {"success": true, "message": "D'Busana API is running"}

## Demo Mode
If backend is unavailable, dashboard automatically uses demo data.
All features work normally with realistic sample data.

## Need Help?
Check backend console for specific error messages.
Most common issues are:
- PostgreSQL not running
- Wrong database credentials
- Port 3001 already in use
`;
};

export const showBackendConnectionGuide = (): void => {
  console.log(generateBackendSetupInstructions());
};

export const checkBackendRequirements = async () => {
  const results = {
    nodeJs: false,
    npm: false,
    postgresql: false,
    port3001Available: false
  };

  try {
    // Check if we can reach backend (indicates Node.js and npm are working)
    const response = await fetch('http://localhost:3001/api/status', {
      method: 'GET',
      headers: { 'x-development-only': 'true' }
    });
    
    if (response.ok) {
      results.nodeJs = true;
      results.npm = true;
      results.port3001Available = true;
      
      // If we get here, PostgreSQL is likely working too
      const data = await response.json();
      if (data.success) {
        results.postgresql = true;
      }
    }
  } catch (error) {
    // Backend not available
  }

  return results;
};

export default {
  BACKEND_TROUBLESHOOTING_STEPS,
  BACKEND_COMMON_ERRORS,
  generateBackendSetupInstructions,
  showBackendConnectionGuide,
  checkBackendRequirements
};