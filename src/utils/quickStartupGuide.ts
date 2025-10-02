// Quick startup guide for D'Busana Dashboard
// Provides clear backend startup instructions without UI interruptions

interface StartupStatus {
  backendRunning: boolean;
  instructions: string[];
}

export async function checkBackendAndShowInstructions(): Promise<StartupStatus> {
  try {
    // Quick backend health check
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch('http://localhost:3001/health', {
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('✅ Backend server is running successfully on localhost:3001');
      return {
        backendRunning: true,
        instructions: ['Backend connected successfully']
      };
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    // Backend is not running - show clear instructions
    const instructions = [
      '',
      '🚀 D\'BUSANA DASHBOARD - BACKEND STARTUP REQUIRED',
      '================================================',
      '',
      '❌ Backend server is not running on localhost:3001',
      '',
      '🔧 TO START THE BACKEND SERVER:',
      '1. Open a new terminal window',
      '2. Navigate to backend directory: cd backend', 
      '3. Install dependencies: npm install',
      '4. Start the server: npm start',
      '',
      '⚡ QUICK COMMAND:',
      'cd backend && npm install && npm start',
      '',
      '✅ EXPECTED RESULT:',
      '• Server starts on localhost:3001',
      '• Dashboard will automatically connect',
      '• All API endpoints will work',
      '• Activity logs will show real data',
      '',
      '🔄 REFRESH THIS PAGE after starting the backend',
      '================================================',
      ''
    ];

    // Log instructions to console
    instructions.forEach(line => console.log(line));

    return {
      backendRunning: false,
      instructions
    };
  }
}

export function logQuickStartInstructions(): void {
  checkBackendAndShowInstructions();
}

export default {
  checkBackendAndShowInstructions,
  logQuickStartInstructions
};