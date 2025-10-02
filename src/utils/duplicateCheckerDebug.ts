/**
 * Debug utilities for duplicate checker in development mode
 */

interface DuplicateCheckDebugInfo {
  endpoint: string;
  requestData: FormData | any;
  response?: any;
  error?: any;
  timing: {
    start: number;
    end?: number;
    duration?: number;
  };
}

class DuplicateCheckerDebug {
  private static instance: DuplicateCheckerDebug;
  private logs: DuplicateCheckDebugInfo[] = [];
  private isEnabled = process.env.NODE_ENV === 'development';

  static getInstance(): DuplicateCheckerDebug {
    if (!DuplicateCheckerDebug.instance) {
      DuplicateCheckerDebug.instance = new DuplicateCheckerDebug();
    }
    return DuplicateCheckerDebug.instance;
  }

  logRequest(endpoint: string, requestData: any): string {
    if (!this.isEnabled) return '';

    const debugInfo: DuplicateCheckDebugInfo = {
      endpoint,
      requestData: this.sanitizeRequestData(requestData),
      timing: {
        start: Date.now()
      }
    };

    const logId = `debug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.logs.push(debugInfo);

    console.group('🔍 Duplicate Checker Debug - Request');
    console.log('Endpoint:', endpoint);
    console.log('Request Data:', debugInfo.requestData);
    console.log('Log ID:', logId);
    console.groupEnd();

    return logId;
  }

  logResponse(logId: string, response: any, isError = false): void {
    if (!this.isEnabled) return;

    const logIndex = this.logs.findIndex(log => 
      log.timing.start === parseInt(logId.split('-')[1])
    );

    if (logIndex === -1) return;

    const log = this.logs[logIndex];
    log.timing.end = Date.now();
    log.timing.duration = log.timing.end - log.timing.start;

    if (isError) {
      log.error = response;
    } else {
      log.response = response;
    }

    console.group('🔍 Duplicate Checker Debug - Response');
    console.log('Log ID:', logId);
    console.log('Duration:', `${log.timing.duration}ms`);
    console.log('Success:', !isError);
    if (isError) {
      console.error('Error:', response);
    } else {
      console.log('Response:', response);
    }
    console.groupEnd();
  }

  private sanitizeRequestData(requestData: any): any {
    if (requestData instanceof FormData) {
      const sanitized: any = {};
      for (const [key, value] of requestData.entries()) {
        if (value instanceof File) {
          sanitized[key] = {
            name: value.name,
            size: value.size,
            type: value.type,
            lastModified: value.lastModified
          };
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    }
    return requestData;
  }

  generateReport(): void {
    if (!this.isEnabled || this.logs.length === 0) return;

    console.group('📊 Duplicate Checker Debug Report');
    console.log('Total Requests:', this.logs.length);
    
    const successful = this.logs.filter(log => log.response && !log.error);
    const failed = this.logs.filter(log => log.error);
    
    console.log('Successful:', successful.length);
    console.log('Failed:', failed.length);
    
    if (failed.length > 0) {
      console.group('❌ Failed Requests');
      failed.forEach((log, index) => {
        console.log(`${index + 1}. ${log.endpoint}:`, log.error);
      });
      console.groupEnd();
    }
    
    const avgDuration = this.logs
      .filter(log => log.timing.duration)
      .reduce((sum, log) => sum + log.timing.duration!, 0) / this.logs.length;
    
    console.log('Average Duration:', `${avgDuration.toFixed(2)}ms`);
    console.groupEnd();
  }

  clear(): void {
    this.logs = [];
    console.log('🧹 Duplicate checker debug logs cleared');
  }

  getLastError(): any {
    const errorLogs = this.logs.filter(log => log.error);
    return errorLogs.length > 0 ? errorLogs[errorLogs.length - 1].error : null;
  }

  checkEndpointHealth(): Promise<boolean> {
    const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '';
    
    return fetch(`${baseUrl}/api/health`)
      .then(response => {
        if (response.ok) {
          console.log('✅ Backend health check passed');
          return true;
        } else {
          console.warn('⚠️ Backend health check failed:', response.status);
          return false;
        }
      })
      .catch(error => {
        console.error('❌ Backend health check error:', error);
        return false;
      });
  }
}

// Export singleton instance for easy use
export const duplicateCheckerDebug = DuplicateCheckerDebug.getInstance();

// Development-only helper functions
export const debugDuplicateChecker = {
  logRequest: (endpoint: string, data: any) => duplicateCheckerDebug.logRequest(endpoint, data),
  logResponse: (logId: string, response: any, isError?: boolean) => duplicateCheckerDebug.logResponse(logId, response, isError),
  generateReport: () => duplicateCheckerDebug.generateReport(),
  clear: () => duplicateCheckerDebug.clear(),
  getLastError: () => duplicateCheckerDebug.getLastError(),
  checkHealth: () => duplicateCheckerDebug.checkEndpointHealth()
};

// Make debugging functions available globally in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).debugDuplicateChecker = debugDuplicateChecker;
  console.log('🔧 Duplicate checker debug tools available as window.debugDuplicateChecker');
}