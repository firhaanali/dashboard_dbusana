// Quick API Restore - Immediately disable all anti-polling systems if they're blocking legitimate requests

export const quickApiRestore = () => {
  console.log('🔄 Quick API Restore - Disabling all anti-polling systems...');
  
  const results: string[] = [];
  
  try {
    // 1. Restore original fetch if it was overridden
    if ((window as any).originalFetch) {
      window.fetch = (window as any).originalFetch;
      results.push('✅ Restored original fetch');
    }
    
    // 2. Disable emergency polling fix
    if ((window as any).emergencyFix && typeof (window as any).emergencyFix.deactivate === 'function') {
      (window as any).emergencyFix.deactivate();
      results.push('✅ Deactivated emergency polling fix');
    }
    
    // 3. Disable polling detector emergency mode
    if ((window as any).pollingDetector && typeof (window as any).pollingDetector.emergency?.disable === 'function') {
      (window as any).pollingDetector.emergency.disable();
      results.push('✅ Disabled polling detector emergency mode');
    }
    
    // 4. Disable anti-polling system emergency mode
    if ((window as any).antiPollingSystem && typeof (window as any).antiPollingSystem.emergency?.disable === 'function') {
      (window as any).antiPollingSystem.emergency.disable();
      results.push('✅ Disabled anti-polling system emergency mode');
    }
    
    // 5. Clear all caches
    if ((window as any).antiPollingSystem && typeof (window as any).antiPollingSystem.clearCache === 'function') {
      (window as any).antiPollingSystem.clearCache();
      results.push('✅ Cleared anti-polling cache');
    }
    
    // 6. Reset component tracking
    if ((window as any).componentPollingFixer && typeof (window as any).componentPollingFixer.clear === 'function') {
      (window as any).componentPollingFixer.clear();
      results.push('✅ Cleared component tracking');
    }
    
    // 7. Clear localStorage entries that might be interfering
    try {
      const keys = Object.keys(localStorage);
      let clearedCount = 0;
      keys.forEach(key => {
        if (key.includes('polling') || key.includes('emergency') || key.includes('rateLimit')) {
          localStorage.removeItem(key);
          clearedCount++;
        }
      });
      if (clearedCount > 0) {
        results.push(`✅ Cleared ${clearedCount} localStorage entries`);
      }
    } catch (e) {
      results.push('⚠️ Could not clear localStorage');
    }
    
    console.log('✅ Quick API Restore completed:');
    results.forEach(result => console.log(`   ${result}`));
    
    // Show toast if available
    if ((window as any).toast) {
      (window as any).toast.success('🔄 API Restored', {
        description: 'All anti-polling systems have been disabled. API calls should work normally now.',
        duration: 5000
      });
    }
    
    return {
      success: true,
      actions: results,
      message: 'All anti-polling systems disabled. You can now make API calls normally.'
    };
    
  } catch (error) {
    console.error('❌ Error during quick API restore:', error);
    return {
      success: false,
      actions: results,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Some anti-polling systems may still be active. Try refreshing the page.'
    };
  }
};

// Add to window for easy access
if (typeof window !== 'undefined') {
  (window as any).quickApiRestore = quickApiRestore;
  (window as any).restoreApi = quickApiRestore; // Short alias
  
  console.log('🔄 Quick API Restore available:');
  console.log('   window.quickApiRestore() - Disable all anti-polling systems');
  console.log('   window.restoreApi() - Short alias for the same function');
}

export default quickApiRestore;