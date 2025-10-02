// Component Polling Fixer - Identifies and fixes components causing infinite polling

interface ComponentPollingInfo {
  componentName: string;
  mountCount: number;
  apiCalls: string[];
  lastActivity: number;
  isProblematic: boolean;
}

class ComponentPollingFixer {
  private componentRegistry = new Map<string, ComponentPollingInfo>();
  private intervalTrackers = new Map<string, NodeJS.Timeout>();
  private debugMode = false;

  // Register a component mount
  registerComponent(componentName: string, apiEndpoints: string[] = []): () => void {
    const existing = this.componentRegistry.get(componentName);
    
    const info: ComponentPollingInfo = {
      componentName,
      mountCount: existing ? existing.mountCount + 1 : 1,
      apiCalls: apiEndpoints,
      lastActivity: Date.now(),
      isProblematic: existing ? existing.isProblematic : false
    };
    
    this.componentRegistry.set(componentName, info);
    
    if (this.debugMode) {
      console.log(`📋 Component registered: ${componentName} (mount count: ${info.mountCount})`);
    }
    
    // Return cleanup function
    return () => {
      const current = this.componentRegistry.get(componentName);
      if (current && current.mountCount > 0) {
        current.mountCount--;
        current.lastActivity = Date.now();
        
        if (current.mountCount === 0) {
          // Component fully unmounted, clean up after delay
          setTimeout(() => {
            const check = this.componentRegistry.get(componentName);
            if (check && check.mountCount === 0) {
              this.componentRegistry.delete(componentName);
              if (this.debugMode) {
                console.log(`🗑️ Component cleaned up: ${componentName}`);
              }
            }
          }, 30000); // 30 second cleanup delay
        }
        
        if (this.debugMode) {
          console.log(`📋 Component unmounted: ${componentName} (remaining: ${current.mountCount})`);
        }
      }
    };
  }

  // Record API call from component
  recordApiCall(componentName: string, endpoint: string) {
    const info = this.componentRegistry.get(componentName);
    if (info) {
      info.lastActivity = Date.now();
      if (!info.apiCalls.includes(endpoint)) {
        info.apiCalls.push(endpoint);
      }
    }
  }

  // Mark component as problematic
  markProblematic(componentName: string, reason: string) {
    const info = this.componentRegistry.get(componentName);
    if (info) {
      info.isProblematic = true;
      console.warn(`🚨 Component marked as problematic: ${componentName} - ${reason}`);
    }
  }

  // Check for problematic patterns
  checkForPollingIssues(): { hasIssues: boolean; issues: string[] } {
    const issues: string[] = [];
    const now = Date.now();
    
    for (const [name, info] of this.componentRegistry.entries()) {
      // Check for multiple mounts of same component
      if (info.mountCount > 3) {
        issues.push(`Component "${name}" has ${info.mountCount} simultaneous mounts (potential memory leak)`);
      }
      
      // Check for components making many API calls
      if (info.apiCalls.length > 5) {
        issues.push(`Component "${name}" is making calls to ${info.apiCalls.length} different endpoints`);
      }
      
      // Check for marketplace analytics specific issues
      if (info.apiCalls.includes('/dashboard/marketplace-analytics') && info.mountCount > 1) {
        issues.push(`Multiple instances of "${name}" are calling marketplace analytics endpoint`);
      }
    }
    
    return {
      hasIssues: issues.length > 0,
      issues
    };
  }

  // Fix common polling issues
  fixPollingIssues(): { fixed: string[]; suggestions: string[] } {
    const fixed: string[] = [];
    const suggestions: string[] = [];
    
    // Clear problematic intervals
    this.intervalTrackers.forEach((interval, key) => {
      clearInterval(interval);
      fixed.push(`Cleared interval for ${key}`);
    });
    this.intervalTrackers.clear();
    
    // Check registry for issues
    const { hasIssues, issues } = this.checkForPollingIssues();
    
    if (hasIssues) {
      suggestions.push('Consider implementing:');
      suggestions.push('- Shared state management for marketplace analytics');
      suggestions.push('- Component-level request deduplication');
      suggestions.push('- Proper cleanup in useEffect returns');
      suggestions.push('- Debounced API calls');
      
      for (const issue of issues) {
        suggestions.push(`- Fix: ${issue}`);
      }
    }
    
    return { fixed, suggestions };
  }

  // Get component statistics
  getComponentStats() {
    const stats = {
      totalComponents: this.componentRegistry.size,
      totalMounts: 0,
      problematicComponents: 0,
      topApiEndpoints: new Map<string, number>(),
      componentDetails: Array.from(this.componentRegistry.entries()).map(([name, info]) => ({
        name,
        mountCount: info.mountCount,
        apiCallCount: info.apiCalls.length,
        apiCalls: info.apiCalls,
        isProblematic: info.isProblematic,
        lastActivity: new Date(info.lastActivity).toLocaleTimeString()
      }))
    };
    
    for (const info of this.componentRegistry.values()) {
      stats.totalMounts += info.mountCount;
      if (info.isProblematic) {
        stats.problematicComponents++;
      }
      
      for (const endpoint of info.apiCalls) {
        const current = stats.topApiEndpoints.get(endpoint) || 0;
        stats.topApiEndpoints.set(endpoint, current + 1);
      }
    }
    
    return stats;
  }

  // Enable debug mode
  enableDebug() {
    this.debugMode = true;
    console.log('🔍 Component polling fixer debug mode enabled');
  }

  // Disable debug mode
  disableDebug() {
    this.debugMode = false;
    console.log('🔍 Component polling fixer debug mode disabled');
  }

  // Clear all tracking data
  clearAll() {
    this.componentRegistry.clear();
    this.intervalTrackers.forEach(interval => clearInterval(interval));
    this.intervalTrackers.clear();
    console.log('🧹 Component registry cleared');
  }
}

// Create global instance
const componentPollingFixer = new ComponentPollingFixer();

// React hook for component registration
export const useComponentTracking = (componentName: string, apiEndpoints?: string[]) => {
  const React = require('react');
  
  React.useEffect(() => {
    const cleanup = componentPollingFixer.registerComponent(componentName, apiEndpoints);
    
    return cleanup;
  }, [componentName]);
  
  const recordApiCall = React.useCallback((endpoint: string) => {
    componentPollingFixer.recordApiCall(componentName, endpoint);
  }, [componentName]);
  
  return { recordApiCall };
};

// Export for debugging
if (typeof window !== 'undefined') {
  (window as any).componentPollingFixer = {
    stats: () => componentPollingFixer.getComponentStats(),
    check: () => componentPollingFixer.checkForPollingIssues(),
    fix: () => componentPollingFixer.fixPollingIssues(),
    debug: {
      enable: () => componentPollingFixer.enableDebug(),
      disable: () => componentPollingFixer.disableDebug()
    },
    clear: () => componentPollingFixer.clearAll()
  };
}

export default componentPollingFixer;
export { componentPollingFixer };