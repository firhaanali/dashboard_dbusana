// Simple connection checker to prevent API errors on startup

let backendAvailable = false;
let lastCheck = 0;
const CHECK_INTERVAL = 30000; // 30 seconds

export const isBackendAvailable = (): boolean => {
  return backendAvailable;
};

export const checkBackendConnection = async (): Promise<boolean> => {
  const now = Date.now();
  
  // Skip check if we checked recently
  if (now - lastCheck < CHECK_INTERVAL) {
    return backendAvailable;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch('http://localhost:3001/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-development-only': 'true'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    backendAvailable = response.ok;
    lastCheck = now;
    
    if (backendAvailable) {
      console.log('✅ Backend connection available');
    } else {
      console.log('⚠️ Backend responded but not healthy');
    }
    
    return backendAvailable;
  } catch (error) {
    backendAvailable = false;
    lastCheck = now;
    console.log('⚠️ Backend not available, using fallback data');
    return false;
  }
};

// Initialize connection check on module load
checkBackendConnection();

export default {
  isBackendAvailable,
  checkBackendConnection
};