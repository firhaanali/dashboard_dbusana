// DEBUG UTIL - Following Clean Dashboard Policy
// Replaced with simple console logging for reliability

// Stub exports to prevent import errors during transition
export const logAdvertisingDebug = (title: string, data: any) => {
  console.log(`📊 ${title}:`, data);
};

export const logApiResponse = (endpoint: string, response: any) => {
  console.log(`🔗 API ${endpoint}:`, response);
};