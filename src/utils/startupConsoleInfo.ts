/**
 * Startup Console Information
 * Provides clean, informative console messages for development
 */

export class StartupConsoleInfo {
  static showDashboardInfo(isBackendAvailable: boolean) {
    // Clean, minimal startup info
    console.log('%c🏪 D\'BUSANA DASHBOARD', 'color: #3b82f6; font-size: 16px; font-weight: bold');
    
    if (isBackendAvailable) {
      console.log('%c✅ Live Database Connected', 'color: #10b981; font-weight: bold');
    } else {
      console.log('%c📋 Demo Mode Active - Full Functionality', 'color: #f59e0b; font-weight: bold');
    }
    
    console.log('%c🚀 Dashboard Ready', 'color: #8b5cf6');
  }

  static showQuietStartup(isBackendAvailable: boolean) {
    console.log(`🏪 D'Busana Dashboard ${isBackendAvailable ? '(Live)' : '(Demo)'} - Ready at http://localhost:5173`);
  }
}

export const startupConsoleInfo = StartupConsoleInfo;