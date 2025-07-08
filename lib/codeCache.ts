// Simple in-memory cache for verification codes
// This will work in Vercel's serverless environment

interface CodeData {
  code: string;
  timestamp: number;
  deviceCode: string;
}

// In-memory cache that persists across function calls within the same serverless instance
const codeCache = new Map<string, CodeData>();

export function storeCode(deviceCode: string, code: string): void {
  codeCache.set(deviceCode, {
    code,
    timestamp: Date.now(),
    deviceCode
  });
  
  // Clean up expired codes (older than 5 minutes)
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
  codeCache.forEach((data, key) => {
    if (data.timestamp < fiveMinutesAgo) {
      codeCache.delete(key);
    }
  });
}

export function getCode(deviceCode: string): CodeData | null {
  const data = codeCache.get(deviceCode);
  if (!data) return null;
  
  // Check if code is still valid (within 5 minutes)
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
  if (data.timestamp < fiveMinutesAgo) {
    codeCache.delete(deviceCode);
    return null;
  }
  
  return data;
}

export function consumeCode(deviceCode: string): CodeData | null {
  const data = getCode(deviceCode);
  if (data) {
    codeCache.delete(deviceCode);
  }
  return data;
}
