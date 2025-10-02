// Startup Health Check - Automatically detect and fix common issues on app start

let hasRunStartupCheck = false;

export const runStartupHealthCheck = async () => {
  // Only run once per session
  if (hasRunStartupCheck) {
    return;
  }
  hasRunStartupCheck = true;

  console.log('🏥 Running startup health check...');

  try {
    // 1. Check if emergency fix is active
    const emergencyFixStatus = (window as any).emergencyFix?.status?.();
    if (emergencyFixStatus?.active) {
      console.log('⚠️ Emergency fix is active - this may block API calls');
      console.log('💡 Run window.quickApiRestore() if you need to make API calls');
    }

    // 2. Check if polling detector is in emergency mode
    const pollingDetectorStatus = (window as any).pollingDetector?.status?.();
    if (pollingDetectorStatus?.emergencyMode) {
      console.log('⚠️ Polling detector is in emergency mode');
      console.log('💡 Run window.quickApiRestore() to restore normal operation');
    }

    // 3. Check if anti-polling system is in emergency mode
    const antiPollingStatus = (window as any).antiPollingSystem?.emergency?.status?.();
    if (antiPollingStatus) {
      console.log('⚠️ Anti-polling system is in emergency mode');
    }

    // 4. Quick backend connectivity test
    try {
      const testResponse = await fetch('http://localhost:3001/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 3000
      } as any);
      
      if (testResponse.ok) {
        console.log('✅ Backend connectivity test passed');
      } else {
        console.log('⚠️ Backend returned non-OK status:', testResponse.status);
      }
    } catch (error) {
      console.log('⚠️ Backend connectivity test failed:', error instanceof Error ? error.message : 'Unknown error');
      console.log('💡 Make sure backend is running: cd backend && npm run dev');
    }

    // 5. Check for common localStorage issues
    try {
      const problematicKeys = Object.keys(localStorage).filter(key => 
        key.includes('emergency') || key.includes('polling') || key.includes('rateLimit')
      );
      
      if (problematicKeys.length > 0) {
        console.log(`⚠️ Found ${problematicKeys.length} potentially problematic localStorage entries`);
        console.log('💡 Run window.quickApiRestore() to clear them if experiencing issues');
      }
    } catch (e) {
      // localStorage not available
    }

    // 6. Auto-restore if multiple systems are in emergency mode
    const systemsInEmergencyMode = [
      emergencyFixStatus?.active,
      pollingDetectorStatus?.emergencyMode,
      antiPollingStatus
    ].filter(Boolean).length;

    if (systemsInEmergencyMode >= 2) {
      console.log('🚨 Multiple anti-polling systems are active - auto-restoring API functionality');
      
      // Wait a moment for everything to initialize
      setTimeout(() => {
        if ((window as any).quickApiRestore) {
          (window as any).quickApiRestore();
        }
      }, 2000);
    }

    console.log('✅ Startup health check completed');

  } catch (error) {
    console.error('❌ Error during startup health check:', error);
  }
};

// Auto-run on import (after a small delay to allow other systems to initialize)
if (typeof window !== 'undefined') {
  setTimeout(runStartupHealthCheck, 1000);
}

export default runStartupHealthCheck;