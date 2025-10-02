// Backend Startup Guide for D'Busana Dashboard
// This file provides instructions and utilities for starting the backend server

export interface BackendStatus {
  isRunning: boolean;
  error?: string;
  instructions: string[];
}

export const BACKEND_URL = 'http://localhost:3001';

/**
 * Check if backend server is running
 */
export async function checkBackendStatus(): Promise<BackendStatus> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`${BACKEND_URL}/health`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-development-only': 'true'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      return {
        isRunning: true,
        instructions: [
          '✅ Backend server is running successfully!',
          '🔗 Connected to: ' + BACKEND_URL,
          '📊 Dashboard is ready to use'
        ]
      };
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    return {
      isRunning: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      instructions: [
        '❌ Backend server is not running on localhost:3001',
        '',
        '🚀 To start the backend server:',
        '1. Open a terminal in the project root directory',
        '2. Navigate to backend folder: cd backend',
        '3. Install dependencies: npm install',
        '4. Start the server: npm start',
        '',
        '🔧 Alternative commands:',
        '• Development mode: npm run dev',
        '• Check package.json for other scripts',
        '',
        '📋 Requirements:',
        '• Node.js (v16 or higher)',
        '• PostgreSQL database running',
        '• Environment variables configured (.env file)',
        '',
        '🔍 Common issues:',
        '• Port 3001 already in use',
        '• Database connection failed', 
        '• Missing environment variables',
        '• Node modules not installed',
        '',
        '⚡ Quick fix: Try running these commands:',
        '  cd backend && npm install && npm start'
      ]
    };
  }
}

/**
 * Display backend startup instructions in console
 */
export function logBackendInstructions(): void {
  console.log(`
🏗️  D'BUSANA DASHBOARD - BACKEND STARTUP GUIDE
================================================

❌ Backend server is not running on localhost:3001

🚀 TO START THE BACKEND SERVER:
1. Open a terminal in the project root directory
2. Navigate to backend: cd backend
3. Install dependencies: npm install  
4. Start server: npm start

🔧 ALTERNATIVE COMMANDS:
• Development mode: npm run dev
• Production mode: npm run prod

📋 REQUIREMENTS:
• Node.js (v16 or higher)
• PostgreSQL database running
• Environment variables configured

⚡ QUICK FIX:
cd backend && npm install && npm start

================================================
  `);
}

/**
 * Auto-detect and provide specific startup guidance  
 */
export async function getStartupGuidance(): Promise<{
  status: BackendStatus;
  quickActions: string[];
}> {
  const status = await checkBackendStatus();
  
  if (status.isRunning) {
    return {
      status,
      quickActions: [
        'Backend is running ✅',
        'Dashboard is ready to use',
        'All API calls should work normally'
      ]
    };
  }

  // Backend is not running - provide guidance
  const quickActions = [
    '1. Open terminal in project root',
    '2. Run: cd backend',  
    '3. Run: npm install',
    '4. Run: npm start',
    '5. Refresh this page'
  ];

  return {
    status,
    quickActions
  };
}

export default {
  checkBackendStatus,
  logBackendInstructions,
  getStartupGuidance,
  BACKEND_URL
};