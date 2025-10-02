// Simple Startup Diagnostic
// Basic check to ensure backend is accessible and CORS is working

interface StartupResult {
  backendRunning: boolean;
  corsWorking: boolean;
  error?: string;
  timestamp: string;
}

class SimpleStartupDiagnostic {
  private readonly backendUrl = 'http://localhost:3001';

  async runQuickCheck(): Promise<StartupResult> {
    const timestamp = new Date().toISOString();
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch(`${this.backendUrl}/health`, {
        method: 'GET',
        mode: 'cors',
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (response.ok) {
        const corsHeaders = response.headers.get('access-control-allow-origin');
        
        return {
          backendRunning: true,
          corsWorking: !!corsHeaders,
          timestamp
        };
      } else {
        return {
          backendRunning: true,
          corsWorking: false,
          error: `Backend responded with ${response.status}`,
          timestamp
        };
      }
    } catch (error) {
      let errorMessage = 'Unknown error';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Connection timeout';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Backend not running';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        backendRunning: false,
        corsWorking: false,
        error: errorMessage,
        timestamp
      };
    }
  }

  async performStartupCheck(): Promise<void> {
    console.log('🔍 Running startup diagnostic...');
    
    const result = await this.runQuickCheck();
    
    if (result.backendRunning && result.corsWorking) {
      console.log('✅ Backend is running and CORS is working');
      return;
    }

    // Show issues
    console.group('⚠️ Startup Issues Detected');
    
    if (!result.backendRunning) {
      console.log('❌ Backend is not running');
      console.log('   Error:', result.error);
      console.log('');
      console.log('🔧 Start backend with:');
      console.log('   cd backend && npm run dev');
      console.log('   cd backend && npm run fix-cors');
    } else if (!result.corsWorking) {
      console.log('❌ Backend is running but CORS is not working');
      console.log('');
      console.log('🔧 Fix CORS with:');
      console.log('   cd backend && npm run emergency');
      console.log('   Or restart backend server');
    }
    
    console.log('');
    console.log('🧪 Test connection:');
    console.log('   window.checkBackend() - Test backend connection');
    console.log('   curl http://localhost:3001/health - Manual test');
    
    console.groupEnd();
  }

  // Auto-run check after app loads
  autoRun(): void {
    setTimeout(() => {
      this.performStartupCheck();
    }, 1000);
  }
}

// Initialize and run
const startupDiagnostic = new SimpleStartupDiagnostic();

if (typeof window !== 'undefined') {
  // Add to window for debugging
  (window as any).startupDiagnostic = startupDiagnostic;
  
  // Auto-run diagnostic
  startupDiagnostic.autoRun();
  
  console.log('🔍 Simple startup diagnostic loaded');
  console.log('   window.startupDiagnostic.performStartupCheck() - Run check');
}

export default startupDiagnostic;