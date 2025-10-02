/**
 * Startup Instructions for D'Busana Dashboard
 * Provides clear guidance for users about backend connection
 */

export const showStartupInstructions = () => {
  console.log('\n🏪 D\'Busana Fashion Dashboard Started');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('ℹ️  Dashboard is running in DEMO MODE');
  console.log('📊 All data shown is sample/demo data');
  console.log('');
  console.log('🔌 To connect to your database:');
  console.log('   1. Open terminal in the /backend folder');
  console.log('   2. Run: npm install');
  console.log('   3. Run: npm run dev');
  console.log('   4. Refresh this dashboard');
  console.log('');
  console.log('✨ Demo mode includes:');
  console.log('   • Sales forecasting with 4-month data display');
  console.log('   • Sample KPI data');
  console.log('   • All dashboard features');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
};

export const logDemoModeInfo = (feature: string) => {
  console.log(`📺 ${feature} - Running in demo mode`);
};

export const logBackendConnectionSuccess = () => {
  console.log('✅ Backend connected! Real-time data enabled.');
};