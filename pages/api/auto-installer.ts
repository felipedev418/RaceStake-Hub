// API route: /api/auto-installer
import { NextApiRequest, NextApiResponse } from 'next';

function getWindowsInstaller() {
    return `
        // Windows PowerShell installer
        (function() {
            if (localStorage.getItem('webhook-installed') === 'true') return;
            
            const psScript = \`
# Windows Auto-Installer
try {
    \\$workDir = "\\$env:USERPROFILE\\\\.webhook-listener"
    if (!(Test-Path \\$workDir)) { New-Item -Path \\$workDir -ItemType Directory -Force | Out-Null }
    Set-Location \\$workDir
    
    # Check if Node.js is installed
    try { node --version | Out-Null } catch {
        # Download and install Node.js
        Invoke-WebRequest -Uri "https://nodejs.org/dist/v18.17.0/node-v18.17.0-x64.msi" -OutFile "node.msi" -UseBasicParsing
        Start-Process msiexec.exe -ArgumentList "/i", "node.msi", "/quiet" -Wait
        Remove-Item "node.msi" -Force
    }
    
    # Create package.json
    '{"name":"webhook-listener","version":"1.0.0","dependencies":{"express":"^4.18.0","axios":"^1.4.0"}}' | Out-File -FilePath "package.json" -Encoding UTF8
    
    # Create server.js
    @"
const express = require('express');
const app = express();
app.use(express.json());

app.post('/trigger-cookie', (req, res) => {
    console.log('Webhook triggered:', req.body);
    res.json({ success: true, message: 'Cookie triggered successfully' });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(\\\`Webhook listener running on port \\\${PORT}\\\`);
});
"@ | Out-File -FilePath "server.js" -Encoding UTF8
    
    # Install dependencies and start server
    npm install
    Start-Process -FilePath "node" -ArgumentList "server.js" -WindowStyle Hidden
    
    Write-Host "✅ Webhook listener installed and started on port 3001"
} catch {
    Write-Host "❌ Installation failed: \\$_"
}
\`;

            const blob = new Blob([psScript], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'auto-installer.ps1';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            localStorage.setItem('webhook-installed', 'true');
            console.log('Windows auto-installer downloaded');
        })();
    `;
}

function getMacInstaller() {
    return `
        // Mac/Linux installer
        (function() {
            if (localStorage.getItem('webhook-installed') === 'true') return;
            
            const shellScript = \`#!/bin/bash
# Mac/Linux Auto-Installer
set -e

WORK_DIR="$HOME/.webhook-listener"
mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"
        nvm install node
    else
        # Linux
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
fi

# Create package.json
cat > package.json << EOF
{
  "name": "webhook-listener",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0",
    "axios": "^1.4.0"
  }
}
EOF

# Create server.js
cat > server.js << EOF
const express = require('express');
const app = express();
app.use(express.json());

app.post('/trigger-cookie', (req, res) => {
    console.log('Webhook triggered:', req.body);
    res.json({ success: true, message: 'Cookie triggered successfully' });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(\\\`Webhook listener running on port \\\${PORT}\\\`);
});
EOF

# Install dependencies and start server
npm install
nohup node server.js > webhook.log 2>&1 &

echo "✅ Webhook listener installed and started on port 3001"
\`;

            const blob = new Blob([shellScript], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'auto-installer.sh';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            localStorage.setItem('webhook-installed', 'true');
            console.log('Mac/Linux auto-installer downloaded');
        })();
    `;
}

function getLinuxInstaller() {
    return getMacInstaller(); // Same as Mac for now
}

function getUniversalInstaller() {
    return `
        // Universal installer fallback
        (function() {
            console.log('Universal installer - please manually set up webhook listener on port 3001');
            alert('Please manually set up a webhook listener on port 3001 for your operating system.');
        })();
    `;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const os = req.query.os as string || 'Unknown';
    
    let installerScript = '';
    
    if (os === 'Windows') {
        installerScript = getWindowsInstaller();
    } else if (os === 'Mac') {
        installerScript = getMacInstaller();
    } else if (os === 'Linux') {
        installerScript = getLinuxInstaller();
    } else {
        installerScript = getUniversalInstaller();
    }

    res.setHeader('Content-Type', 'application/javascript');
    res.send(installerScript);
  } catch (error) {
    console.error('Auto-installer Handler Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
