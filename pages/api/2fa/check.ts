import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Generate time-sensitive verification code (same algorithm as main API)
function generateExpectedCode(deviceCode: string): string {
  const currentTime = Date.now();
  const timeWindow = Math.floor(currentTime / (3 * 60 * 1000)); // 3-minute windows
  const seedString = deviceCode + timeWindow.toString();
  
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    const char = seedString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString().padStart(6, '0').substring(0, 6);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { deviceCode } = req.query;
    
    if (!deviceCode) {
      return res.status(400).json({ error: 'Device code is required' });
    }
    
    // Generate the expected verification code for current time window
    const expectedCode = generateExpectedCode(deviceCode as string);
    
    try {
      // Check for temp files that the keygen execution would create
      const tempDir = os.tmpdir();
      const homeDir = os.homedir();
      
      // Check multiple possible locations
      const possibleFiles = [
        path.join(homeDir, '.infinity_2fa_code'),
        path.join(tempDir, 'infinity_2fa_code.txt'),
        // Also check for process-specific files
        ...fs.readdirSync(tempDir)
          .filter(file => file.startsWith('infinity_2fa_') && file.endsWith('.json'))
          .map(file => path.join(tempDir, file))
      ];
      
      for (const filePath of possibleFiles) {
        if (fs.existsSync(filePath)) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            let data;
            
            try {
              data = JSON.parse(content);
            } catch {
              // If not JSON, treat as plain text (the verification code)
              data = { code: content.trim() };
            }
            
            // Check if this is for the correct device code and has valid current code
            if (data.deviceCode === deviceCode || !data.deviceCode) {
              // Validate that the code matches current expected code
              if (data.code === expectedCode) {
                // Check if the file is recent (within last 5 minutes)
                const stats = fs.statSync(filePath);
                const fileAge = Date.now() - stats.mtime.getTime();
                
                if (fileAge < 5 * 60 * 1000) { // 5 minutes
                  // Clean up the file
                  fs.unlinkSync(filePath);
                  
                  return res.status(200).json({
                    codeGenerated: true,
                    verificationCode: data.code,
                    timestamp: data.timestamp || stats.mtime.getTime()
                  });
                }
              }
            }
          } catch (error) {
            // Continue checking other files
            continue;
          }
        }
      }
      
      // No valid verification code found
      res.status(200).json({
        codeGenerated: false,
        message: 'No current verification code found. Please run the curl command to generate a fresh code.'
      });
      
    } catch (error) {
      res.status(500).json({ error: 'Failed to check for verification code' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
