// Emergency Polling Detector - Detects and stops infinite polling loops

interface PollingEvent {
  url: string;
  timestamp: number;
  component?: string;
  userAgent: string;
}

interface PollingPattern {
  url: string;
  count: number;
  frequency: number; // requests per second
  lastRequest: number;
  firstRequest: number;
  isPolling: boolean;
  component?: string;
}

class EmergencyPollingDetector {
  private events: PollingEvent[] = [];
  private patterns: Map<string, PollingPattern> = new Map();
  private isMonitoring: boolean = false;
  private monitoringInterval?: NodeJS.Timeout;
  private emergencyMode: boolean = false;
  private blockedUrls: Set<string> = new Set();
  
  // Configuration
  private readonly config = {
    maxRequestsPerSecond: 0.5, // Max 1 request per 2 seconds
    maxRequestsPerMinute: 10,
    windowSize: 60000, // 1 minute window
    emergencyThreshold: 20, // Trigger emergency mode after 20 rapid requests
    monitorInterval: 5000 // Check every 5 seconds
  };

  constructor() {
    this.startMonitoring();
    
    // Add to window for debugging
    if (typeof window !== 'undefined') {
      (window as any).pollingDetector = {
        status: () => this.getStatus(),
        patterns: () => this.getPatterns(),
        emergency: {
          enable: () => this.enableEmergencyMode(),
          disable: () => this.disableEmergencyMode(),
          isActive: () => this.emergencyMode
        },
        block: (url: string) => this.blockUrl(url),
        unblock: (url: string) => this.unblockUrl(url),
        clear: () => this.clearHistory()
      };
    }
  }

  // Record a request
  recordRequest(url: string, component?: string): boolean {
    const now = Date.now();
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
    
    // Check if URL is blocked
    if (this.blockedUrls.has(url)) {
      console.warn(`🚫 Request blocked (emergency mode): ${url}`);
      return false;
    }

    // Record the event
    const event: PollingEvent = {
      url,
      timestamp: now,
      component,
      userAgent
    };
    
    this.events.push(event);
    
    // Clean old events (keep only last minute)
    this.events = this.events.filter(e => now - e.timestamp < this.config.windowSize);
    
    // Update pattern analysis
    this.updatePattern(url, now, component);
    
    // Check for polling behavior
    const pattern = this.patterns.get(url);
    if (pattern && pattern.isPolling) {
      console.warn(`🚨 Polling detected for ${url}: ${pattern.count} requests in ${(now - pattern.firstRequest) / 1000}s (${pattern.frequency.toFixed(2)} req/s)`);
      
      // Trigger emergency mode if too many requests
      if (pattern.count > this.config.emergencyThreshold) {
        this.triggerEmergencyMode(url, pattern);
        return false;
      }
    }
    
    return true;
  }

  private updatePattern(url: string, timestamp: number, component?: string) {
    const existing = this.patterns.get(url);
    
    if (!existing) {
      this.patterns.set(url, {
        url,
        count: 1,
        frequency: 0,
        lastRequest: timestamp,
        firstRequest: timestamp,
        isPolling: false,
        component
      });
      return;
    }
    
    existing.count++;
    existing.lastRequest = timestamp;
    existing.component = component || existing.component;
    
    // Calculate frequency
    const duration = (timestamp - existing.firstRequest) / 1000; // seconds
    existing.frequency = duration > 0 ? existing.count / duration : 0;
    
    // Detect polling behavior
    existing.isPolling = existing.frequency > this.config.maxRequestsPerSecond && existing.count > 5;
    
    // Check if requests are too frequent
    const recentEvents = this.events.filter(e => e.url === url && timestamp - e.timestamp < 60000);
    if (recentEvents.length > this.config.maxRequestsPerMinute) {
      existing.isPolling = true;
    }
  }

  private triggerEmergencyMode(url: string, pattern: PollingPattern) {
    console.error(`🚨 EMERGENCY MODE TRIGGERED for ${url}`);
    console.error(`📊 Pattern: ${pattern.count} requests in ${((Date.now() - pattern.firstRequest) / 1000).toFixed(1)}s`);
    console.error(`⚡ Frequency: ${pattern.frequency.toFixed(2)} requests/second`);
    
    // Block the problematic URL
    this.blockUrl(url);
    
    // Enable emergency mode
    this.emergencyMode = true;
    
    // Show user notification if possible
    if (typeof window !== 'undefined' && (window as any).toast) {
      (window as any).toast.error(`🚨 Emergency Mode Activated`, {
        description: `Excessive requests detected for ${url}. Auto-blocked to prevent system overload.`
      });
    }
    
    // Auto-disable emergency mode after 5 minutes
    setTimeout(() => {
      if (this.emergencyMode) {
        console.log('🔄 Auto-disabling emergency mode after 5 minutes');
        this.disableEmergencyMode();
      }
    }, 300000); // 5 minutes
  }

  // Block a URL from making requests
  blockUrl(url: string) {
    this.blockedUrls.add(url);
    console.warn(`🚫 URL blocked: ${url}`);
  }

  // Unblock a URL
  unblockUrl(url: string) {
    this.blockedUrls.delete(url);
    console.log(`✅ URL unblocked: ${url}`);
  }

  // Enable emergency mode manually
  enableEmergencyMode() {
    this.emergencyMode = true;
    console.error('🚨 Emergency mode enabled manually');
  }

  // Disable emergency mode
  disableEmergencyMode() {
    this.emergencyMode = false;
    this.blockedUrls.clear();
    this.clearHistory();
    console.log('✅ Emergency mode disabled - all blocks cleared');
  }

  // Start monitoring
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.analyzePatterns();
    }, this.config.monitorInterval);
    
    console.log('👁️ Emergency polling detector started');
  }

  // Stop monitoring
  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    
    console.log('👁️ Emergency polling detector stopped');
  }

  private analyzePatterns() {
    const now = Date.now();
    const activePatterns = Array.from(this.patterns.values()).filter(p => 
      now - p.lastRequest < 30000 // Active in last 30 seconds
    );
    
    const pollingPatterns = activePatterns.filter(p => p.isPolling);
    
    if (pollingPatterns.length > 0) {
      console.warn(`🚨 Active polling patterns detected:`, pollingPatterns.map(p => ({
        url: p.url,
        frequency: p.frequency.toFixed(2) + ' req/s',
        count: p.count,
        component: p.component
      })));
    }
    
    // Clean old patterns
    for (const [url, pattern] of this.patterns.entries()) {
      if (now - pattern.lastRequest > this.config.windowSize * 2) {
        this.patterns.delete(url);
      }
    }
  }

  // Get current status
  getStatus() {
    const now = Date.now();
    const recentEvents = this.events.filter(e => now - e.timestamp < 60000);
    const activePatterns = Array.from(this.patterns.values()).filter(p => p.isPolling);
    
    return {
      isMonitoring: this.isMonitoring,
      emergencyMode: this.emergencyMode,
      totalEvents: this.events.length,
      recentEvents: recentEvents.length,
      activePatterns: activePatterns.length,
      blockedUrls: Array.from(this.blockedUrls),
      pollingPatterns: activePatterns.map(p => ({
        url: p.url,
        frequency: p.frequency,
        count: p.count,
        component: p.component
      }))
    };
  }

  // Get all patterns
  getPatterns() {
    return Array.from(this.patterns.values());
  }

  // Clear history
  clearHistory() {
    this.events = [];
    this.patterns.clear();
    console.log('🧹 Polling history cleared');
  }

  // Check if request should be allowed
  shouldAllowRequest(url: string, component?: string): boolean {
    if (this.emergencyMode && this.blockedUrls.has(url)) {
      return false;
    }
    
    return this.recordRequest(url, component);
  }
}

// Create global instance
const emergencyPollingDetector = new EmergencyPollingDetector();

// Export for use in API calls
export default emergencyPollingDetector;
export { emergencyPollingDetector };