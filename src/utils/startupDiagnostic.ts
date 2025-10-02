// Startup diagnostic for D'Busana Dashboard
import { checkBackendAndShowInstructions } from './quickStartupGuide';

export async function runStartupDiagnostic(): Promise<void> {
  console.log(`
🏗️  D'BUSANA DASHBOARD - STARTUP DIAGNOSTIC
===========================================
`);

  // Check backend connection and show instructions
  console.log('🔍 Checking backend connection...');
  await checkBackendAndShowInstructions();
}

// Auto-run diagnostic in development
if (process.env.NODE_ENV === 'development') {
  runStartupDiagnostic();
}

export default {
  runStartupDiagnostic
};