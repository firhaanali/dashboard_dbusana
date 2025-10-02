/**
 * Rate Limit Manager
 * Prevents too many API requests and 429 errors
 */

interface RequestRecord {
  endpoint: string;
  timestamp: number;
  count: number;
}

class RateLimitManager {
  private requests: Map<string, RequestRecord> = new Map();
  private maxRequestsPerMinute = 10; // Conservative limit
  private windowMs = 60000; // 1 minute
  private minInterval = 1000; // Minimum 1 second between same endpoint requests

  private cleanupOldRequests() {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now - record.timestamp > this.windowMs) {
        this.requests.delete(key);
      }
    }
  }

  canMakeRequest(endpoint: string) {
    this.cleanupOldRequests();
    
    const now = Date.now();
    const key = endpoint;
    const existing = this.requests.get(key);

    if (!existing) {
      // First request to this endpoint
      this.requests.set(key, {
        endpoint,
        timestamp: now,
        count: 1
      });
      return { allowed: true };
    }

    // Check if we need to wait due to minimum interval
    const timeSinceLastRequest = now - existing.timestamp;
    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest;
      console.warn(`⏳ Rate limit: Too soon for ${endpoint}, wait ${waitTime}ms`);
      return { allowed: false, waitTime };
    }

    // Check if we've exceeded requests per minute
    if (existing.count >= this.maxRequestsPerMinute) {
      const waitTime = this.windowMs - (now - existing.timestamp);
      console.warn(`⏳ Rate limit: Too many requests to ${endpoint}, wait ${waitTime}ms`);
      return { allowed: false, waitTime };
    }

    // Update the record
    existing.timestamp = now;
    existing.count += 1;
    
    return { allowed: true };
  }

  recordRequest(endpoint: string) {
    const now = Date.now();
    const existing = this.requests.get(endpoint);
    
    if (existing) {
      existing.timestamp = now;
    } else {
      this.requests.set(endpoint, {
        endpoint,
        timestamp: now,
        count: 1
      });
    }
  }

  async waitForRateLimit(endpoint: string): Promise<void> {
    const check = this.canMakeRequest(endpoint);
    if (!check.allowed && check.waitTime) {
      console.log(`⏳ Waiting ${check.waitTime}ms for rate limit on ${endpoint}...`);
      await new Promise(resolve => setTimeout(resolve, check.waitTime));
    }
  }

  getStatus() {
    this.cleanupOldRequests();
    const requestsList = [];
    for (const [key, record] of this.requests.entries()) {
      requestsList.push({
        endpoint: key,
        count: record.count,
        lastRequest: new Date(record.timestamp).toISOString()
      });
    }
    
    return {
      activeEndpoints: this.requests.size,
      requests: requestsList
    };
  }

  reset() {
    this.requests.clear();
    console.log('🔄 Rate limit manager reset');
  }
}

// Create singleton instance
export const rateLimitManager = new RateLimitManager();

// Enhanced API request wrapper with rate limiting
export async function makeRateLimitedRequest<T>(
  endpoint: string,
  requestFn: () => Promise<T>
): Promise<T> {
  // Check rate limit
  await rateLimitManager.waitForRateLimit(endpoint);
  
  // Record the request
  rateLimitManager.recordRequest(endpoint);
  
  try {
    const result = await requestFn();
    console.log(`✅ Rate-limited request to ${endpoint} succeeded`);
    return result;
  } catch (error) {
    console.error(`❌ Rate-limited request to ${endpoint} failed:`, error);
    throw error;
  }
}

// Add to window for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).rateLimitManager = rateLimitManager;
  console.log('⏳ Rate Limit Manager available at window.rateLimitManager');
  console.log('💡 Commands: .getStatus(), .reset()');
}