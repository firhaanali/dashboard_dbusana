// Enhanced Emergency Polling Fix - Comprehensive solution for infinite API polling

interface PollingFixOptions {
  clearIntervals?: boolean;
  blockMarketplaceEndpoint?: boolean;
  enableRateLimit?: boolean;
  activateDetector?: boolean;
  clearComponentRegistry?: boolean;
  timeout?: number;
  aggressive?: boolean;
}

interface PollingFixReport {
  timestamp: string;
  actions: string[];
  blocked: string[];
  cleared: string[];
  warnings: string[];
  success: boolean;
}

class EnhancedEmergencyPollingFix {
  private blockedEndpoints = new Set<string>();
  private originalFetch: typeof fetch;
  private isActive = false;
  private activationTime: Date | null = null;
  private fixHistory: PollingFixReport[] = [];

  constructor() {
    this.originalFetch = window.fetch;
    console.log('🛡️ Enhanced Emergency Polling Fix initialized');
  }

  // Activate comprehensive emergency polling fix
  activate(options: PollingFixOptions = {}): PollingFixReport {
    if (this.isActive) {
      console.log('🛑 Emergency polling fix already active');
      return this.generateReport(['Already active'], [], [], ['Fix already running']);
    }

    this.isActive = true;
    this.activationTime = new Date();
    console.log('🚨 ACTIVATING ENHANCED EMERGENCY POLLING FIX');

    const {
      clearIntervals = true,
      blockMarketplaceEndpoint = true,
      enableRateLimit = true,
      activateDetector = true,
      clearComponentRegistry = true,
      aggressive = true,
      timeout = 300000 // 5 minutes
    } = options;

    const actions: string[] = [];
    const blocked: string[] = [];
    const cleared: string[] = [];
    const warnings: string[] = [];

    try {
      // 1. Clear all intervals and timeouts
      if (clearIntervals) {
        const intervalCount = this.clearAllIntervals();
        cleared.push(`${intervalCount} intervals cleared`);
        actions.push('Cleared all intervals and timeouts');
      }

      // 2. Activate polling detection systems
      if (activateDetector) {
        try {
          // Import and activate polling detector dynamically
          import('./emergencyPollingDetector').then(({ emergencyPollingDetector }) => {
            emergencyPollingDetector.enableEmergencyMode();
          });
          actions.push('Activated polling detector emergency mode');
        } catch (err) {
          warnings.push('Could not activate polling detector');
        }
      }

      // 3. Enable anti-polling system emergency mode
      try {
        import('./antiPollingSystem').then(({ antiPollingSystem }) => {
          antiPollingSystem.enableEmergencyMode();
          antiPollingSystem.clearAllCache();
          cleared.push('All API caches');
        });
        actions.push('Activated anti-polling system emergency mode');
      } catch (err) {
        warnings.push('Could not activate anti-polling system');
      }

      // 4. Clear component registry
      if (clearComponentRegistry) {
        try {
          import('./componentPollingFixer').then(({ componentPollingFixer }) => {
            const componentStats = componentPollingFixer.getComponentStats();
            componentPollingFixer.clearAll();
            cleared.push(`${componentStats.totalComponents || 0} component registrations`);
          });
          actions.push('Cleared component polling registry');
        } catch (err) {
          warnings.push('Could not clear component registry');
        }
      }

      // 5. Block problematic endpoints
      if (blockMarketplaceEndpoint) {
        const endpoints = [
          'marketplace-analytics',
          'dashboard/marketplace-analytics',
          '/api/dashboard/marketplace-analytics',
          'analytics'
        ];
        
        for (const endpoint of endpoints) {
          this.blockEndpoint(endpoint);
          blocked.push(endpoint);
        }
        actions.push(`Blocked ${endpoints.length} problematic endpoints`);
      }

      // 6. Enable aggressive rate limiting
      if (enableRateLimit) {
        this.enableAggressiveRateLimit(aggressive);
        actions.push('Enabled aggressive rate limiting');
      }

      // 7. Clear browser storage
      this.clearBrowserStorage();
      cleared.push('Browser storage entries');
      actions.push('Cleared browser storage');

      // 8. Auto-deactivate after timeout
      setTimeout(() => {
        if (this.isActive) {
          this.deactivate();
        }
      }, timeout);

      this.showEmergencyNotification(actions.length);

      const report = this.generateReport(actions, blocked, cleared, warnings);
      this.fixHistory.push(report);

      return report;

    } catch (error) {
      console.error('❌ Error during emergency fix activation:', error);
      warnings.push(`Activation error: ${error instanceof Error ? error.message : 'Unknown'}`);
      
      const report = this.generateReport(actions, blocked, cleared, warnings);
      this.fixHistory.push(report);
      
      return report;
    }
  }

  // Deactivate emergency fix
  deactivate(): void {
    if (!this.isActive) return;

    this.isActive = false;
    this.activationTime = null;
    console.log('✅ Enhanced emergency polling fix deactivated');

    // Restore original fetch
    window.fetch = this.originalFetch;
    this.blockedEndpoints.clear();

    // Deactivate systems if they exist
    try {
      import('./emergencyPollingDetector').then(({ emergencyPollingDetector }) => {
        emergencyPollingDetector.disableEmergencyMode();
      });
    } catch (err) {
      console.warn('Could not deactivate polling detector');
    }

    try {
      import('./antiPollingSystem').then(({ antiPollingSystem }) => {
        antiPollingSystem.disableEmergencyMode();
      });
    } catch (err) {
      console.warn('Could not deactivate anti-polling system');
    }

    // Show deactivation notification
    if ((window as any).toast) {
      (window as any).toast.success('✅ Emergency Mode Deactivated', {
        description: 'All anti-polling systems have been restored to normal operation.'
      });
    }
  }

  // Clear all intervals and timeouts with comprehensive search
  private clearAllIntervals(): number {
    let clearedCount = 0;

    // Method 1: Clear numbered intervals/timeouts
    for (let i = 1; i <= 50000; i++) {
      try {
        clearInterval(i);
        clearTimeout(i);
        clearedCount++;
      } catch {
        // Interval/timeout doesn't exist
      }
    }

    // Method 2: Override interval/timeout functions temporarily
    const originalSetInterval = window.setInterval;
    const originalSetTimeout = window.setTimeout;
    
    let tempBlockCount = 0;
    window.setInterval = (...args: any[]) => {
      console.warn('🚫 Interval creation blocked by emergency fix');
      tempBlockCount++;
      return 0;
    };
    
    window.setTimeout = (...args: any[]) => {
      // Allow very short timeouts (they might be React related)
      const delay = args[1];
      if (typeof delay === 'number' && delay < 100) {
        return originalSetTimeout.apply(window, args);
      }
      console.warn('🚫 Timeout creation blocked by emergency fix');
      tempBlockCount++;
      return 0;
    };

    // Restore after 5 seconds
    setTimeout(() => {
      window.setInterval = originalSetInterval;
      window.setTimeout = originalSetTimeout;
      console.log(`✅ Timer functions restored after blocking ${tempBlockCount} attempts`);
    }, 5000);

    console.log(`🧹 Cleared ${clearedCount} potential intervals/timeouts`);
    return clearedCount;
  }

  // Block specific endpoint
  private blockEndpoint(endpoint: string): void {
    this.blockedEndpoints.add(endpoint);
    console.log(`🚫 Blocked endpoint: ${endpoint}`);
  }

  // Clear browser storage
  private clearBrowserStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('polling') || key.includes('analytics') || key.includes('marketplace')) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (e) {
      console.warn('Could not clear localStorage');
    }

    try {
      if (typeof sessionStorage !== 'undefined') {
        const keys = Object.keys(sessionStorage);
        keys.forEach(key => {
          if (key.includes('polling') || key.includes('analytics') || key.includes('marketplace')) {
            sessionStorage.removeItem(key);
          }
        });
      }
    } catch (e) {
      console.warn('Could not clear sessionStorage');
    }
  }

  // Enable ultra-aggressive rate limiting
  private enableAggressiveRateLimit(aggressive = false): void {
    const requestCounts = new Map<string, { count: number, firstRequest: number }>();
    const blockedUrls = new Set<string>();

    window.fetch = async (url: string | URL | Request, init?: RequestInit) => {
      const urlStr = typeof url === 'string' ? url : url.toString();
      
      // Check if endpoint is blocked
      for (const blocked of this.blockedEndpoints) {
        if (urlStr.includes(blocked)) {
          console.warn(`🚫 Request blocked by emergency fix: ${urlStr}`);
          
          // Return fake success response to prevent errors
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Request blocked by emergency polling fix',
            data: null 
          }), {
            status: 429,
            statusText: 'Too Many Requests',
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // Ultra-aggressive rate limiting
      const now = Date.now();
      const stats = requestCounts.get(urlStr) || { count: 0, firstRequest: now };
      
      // Different limits based on aggressiveness
      const maxRequests = aggressive ? 2 : 5;
      const timeWindow = aggressive ? 30000 : 60000; // 30s vs 1min
      
      if ((now - stats.firstRequest) < timeWindow && stats.count >= maxRequests) {
        blockedUrls.add(urlStr);
        console.warn(`🚫 Ultra-aggressive rate limit exceeded for: ${urlStr} (${stats.count} requests in ${(now - stats.firstRequest)/1000}s)`);
        
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Ultra-aggressive rate limit exceeded',
          data: null,
          retryAfter: Math.ceil((timeWindow - (now - stats.firstRequest)) / 1000)
        }), {
          status: 429,
          statusText: 'Too Many Requests',
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((timeWindow - (now - stats.firstRequest)) / 1000).toString()
          }
        });
      }

      // Update stats
      if ((now - stats.firstRequest) > timeWindow) {
        // Reset window
        requestCounts.set(urlStr, { count: 1, firstRequest: now });
      } else {
        // Increment in current window
        stats.count++;
        requestCounts.set(urlStr, stats);
      }

      return this.originalFetch(url, init);
    };

    console.log(`⚡ ${aggressive ? 'Ultra-aggressive' : 'Standard'} rate limiting enabled`);
  }

  // Generate comprehensive report
  private generateReport(actions: string[], blocked: string[], cleared: string[], warnings: string[]): PollingFixReport {
    return {
      timestamp: new Date().toISOString(),
      actions,
      blocked,
      cleared,
      warnings,
      success: warnings.length === 0
    };
  }

  // Show enhanced notification
  private showEmergencyNotification(actionCount: number): void {
    // Try to show toast if available
    if ((window as any).toast) {
      (window as any).toast.error('🚨 Enhanced Emergency Fix Activated', {
        description: `${actionCount} anti-polling measures activated. All systems secured.`,
        duration: 15000
      });
    }

    // Enhanced console output
    console.warn(`
🚨 ENHANCED EMERGENCY POLLING FIX ACTIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• ${actionCount} emergency measures activated
• All intervals and timeouts cleared
• Ultra-aggressive rate limiting enabled
• Problematic endpoints blocked
• All caches cleared
• Component registry reset
• Will auto-deactivate in 5 minutes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Quick commands:
• window.emergencyStop() - Stop all polling
• window.emergencyFix.status() - Check status
• window.emergencyFix.deactivate() - Manual stop
    `);
  }

  // Get comprehensive status
  getStatus() {
    return {
      active: this.isActive,
      activatedAt: this.activationTime?.toISOString() || null,
      blockedEndpoints: Array.from(this.blockedEndpoints),
      fixHistory: this.fixHistory,
      uptime: this.activationTime ? Date.now() - this.activationTime.getTime() : 0
    };
  }

  // Get fix history
  getHistory() {
    return this.fixHistory;
  }

  // Force full system reset
  forceFullReset(): PollingFixReport {
    console.log('🔄 Forcing full system reset...');
    
    const actions: string[] = [];
    const cleared: string[] = [];
    const warnings: string[] = [];

    try {
      // Deactivate current fix if active
      if (this.isActive) {
        this.deactivate();
        actions.push('Deactivated existing emergency fix');
      }

      // Clear browser storage
      this.clearBrowserStorage();
      cleared.push('All browser storage');
      
      // Clear the fix history
      this.fixHistory = [];
      cleared.push('Fix history');

      actions.push('Full system reset completed');

      const report = this.generateReport(actions, [], cleared, warnings);
      this.fixHistory = [report]; // Reset history with just this report

      if ((window as any).toast) {
        (window as any).toast.success('🔄 Full System Reset Complete', {
          description: 'All anti-polling systems have been reset to initial state.'
        });
      }

      return report;

    } catch (error) {
      console.error('❌ Error during full reset:', error);
      warnings.push(`Reset error: ${error instanceof Error ? error.message : 'Unknown'}`);
      
      const report = this.generateReport(actions, [], cleared, warnings);
      this.fixHistory.push(report);
      
      return report;
    }
  }
}

// Create enhanced singleton instance
const enhancedEmergencyPollingFix = new EnhancedEmergencyPollingFix();

// Legacy functions for backward compatibility
export const emergencyStopAllPolling = () => {
  return enhancedEmergencyPollingFix.activate({ aggressive: true });
};

export const quickDiagnosis = () => {
  return enhancedEmergencyPollingFix.getStatus();
};

export const enableAutoDetection = () => {
  console.log('🔍 Auto-detection replaced by enhanced emergency fix system');
  return enhancedEmergencyPollingFix.getStatus();
};

// Add comprehensive debugging to window
if (typeof window !== 'undefined') {
  // Main emergency functions (enhanced)
  (window as any).emergencyFix = {
    activate: (options?: PollingFixOptions) => enhancedEmergencyPollingFix.activate(options),
    deactivate: () => enhancedEmergencyPollingFix.deactivate(),
    status: () => enhancedEmergencyPollingFix.getStatus(),
    history: () => enhancedEmergencyPollingFix.getHistory(),
    forceReset: () => enhancedEmergencyPollingFix.forceFullReset(),
    
    // Quick fixes
    quick: {
      stopPolling: () => enhancedEmergencyPollingFix.activate({ aggressive: true }),
      blockMarketplace: () => enhancedEmergencyPollingFix.activate({ 
        blockMarketplaceEndpoint: true, 
        clearIntervals: false 
      }),
      clearAll: () => enhancedEmergencyPollingFix.activate({ 
        clearIntervals: true, 
        clearComponentRegistry: true 
      })
    }
  };

  // Legacy aliases
  (window as any).emergencyStop = emergencyStopAllPolling;
  (window as any).quickDiag = quickDiagnosis;
  (window as any).stopPolling = emergencyStopAllPolling;
  (window as any).fixPolling = emergencyStopAllPolling;

  console.log('🆘 Enhanced Emergency functions available:');
  console.log('   window.emergencyStop() - Quick stop all polling');
  console.log('   window.emergencyFix.activate() - Full enhanced fix');
  console.log('   window.emergencyFix.status() - Check system status');
  console.log('   window.emergencyFix.quick.stopPolling() - Aggressive stop');
}

// Export for import in other modules
export { enhancedEmergencyPollingFix as emergencyPollingFix };
export default enhancedEmergencyPollingFix;