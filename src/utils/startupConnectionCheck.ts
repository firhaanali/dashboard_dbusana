import { backendVerifier } from './backendConnectionVerifier';
import { dashboardApi } from './dashboardApiConnectionFix';

// ✅ Startup Connection Check for D'Busana Dashboard
export class StartupConnectionChecker {
  private static hasRun = false;

  public static async performStartupCheck(): Promise<void> {
    // Only run once per session
    if (this.hasRun) return;
    this.hasRun = true;

    console.log('🚀 D\'Busana Dashboard - Starting connection verification...');

    try {
      // Clear any cached status
      backendVerifier.clearCache();

      // Perform comprehensive backend check
      const status = await backendVerifier.checkBackendStatus();
      
      if (status.isRunning && status.isHealthy && status.hasData) {
        console.log('✅ All systems operational!');
        console.log('📊 Dashboard ready with live data from database');
        this.logDataSummary(status.details);
      } else if (status.isRunning && status.isHealthy) {
        console.log('⚠️ Backend is running but database is empty');
        console.log('💡 Import sales data to see live dashboard metrics');
        this.showImportInstructions();
      } else if (status.isRunning) {
        console.log('🔶 Backend is running but not fully healthy');
        console.log('⚠️ Some API endpoints may not be working correctly');
        this.showTroubleshootingTips();
      } else {
        console.log('❌ Backend server is not running');
        this.showBackendStartupInstructions();
      }

      // Log detailed status for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Detailed Status:', {
          serverRunning: status.isRunning,
          apiHealthy: status.isHealthy,
          hasData: status.hasData,
          errors: status.errors
        });
      }

    } catch (error) {
      console.error('❌ Startup connection check failed:', error);
      this.showBackendStartupInstructions();
    }
  }

  private static logDataSummary(details: any): void {
    if (details?.dataStatus) {
      const data = details.dataStatus;
      console.log('📈 Database Summary:', {
        'Orders': data.distinctOrders || 0,
        'Products': data.totalProducts || 0,
        'Revenue': data.totalRevenue ? `Rp ${data.totalRevenue.toLocaleString('id-ID')}` : 'Rp 0',
        'Sales Records': data.totalSales || 0
      });
    }
  }

  private static showBackendStartupInstructions(): void {
    console.log('\n🚨 Backend Setup Required:');
    console.log('1. Open a new terminal window');
    console.log('2. Navigate to backend folder: cd backend');
    console.log('3. Install dependencies: npm install');
    console.log('4. Start the server: npm start');
    console.log('5. Server should run on http://localhost:3001');
    console.log('\n✅ Once backend is running, refresh this page\n');
  }

  private static showImportInstructions(): void {
    console.log('\n📥 Import Data to See Dashboard Metrics:');
    console.log('1. Click "Import Data" in the sidebar');
    console.log('2. Upload your sales Excel/CSV files');
    console.log('3. Dashboard will show live metrics after import');
    console.log('4. Access detailed analytics and reports\n');
  }

  private static showTroubleshootingTips(): void {
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('1. Check backend console for error messages');
    console.log('2. Ensure PostgreSQL database is running');
    console.log('3. Verify database connection in backend/.env');
    console.log('4. Try restarting the backend server');
    console.log('5. Visit /diagnostic page for detailed analysis\n');
  }

  // ✅ Quick health check without full startup sequence
  public static async quickHealthCheck(): Promise<boolean> {
    try {
      const testResult = await dashboardApi.testConnection();
      return testResult.healthy;
    } catch (error) {
      return false;
    }
  }

  // ✅ Reset the startup check (for testing purposes)
  public static resetStartupCheck(): void {
    this.hasRun = false;
  }
}

// ✅ Auto-run startup check when module is imported
if (typeof window !== 'undefined' && !window.location.pathname.includes('/diagnostic')) {
  // Run after a short delay to ensure DOM is ready
  setTimeout(() => {
    StartupConnectionChecker.performStartupCheck();
  }, 1000);
}

// ✅ Export for manual usage
export const performStartupCheck = () => StartupConnectionChecker.performStartupCheck();
export const quickHealthCheck = () => StartupConnectionChecker.quickHealthCheck();
export const resetStartupCheck = () => StartupConnectionChecker.resetStartupCheck();