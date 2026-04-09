# Motor Dashboard - NPM Commands Reference

## Installation

```bash
# Install all dependencies (express, socket.io, aws-iot-device-sdk)
npm install

# Or with yarn
yarn install

# Install with production flag (excludes devDependencies)
npm ci --only=production
```

**What gets installed:**
- ✓ `express` - Web server framework
- ✓ `socket.io` - Real-time bidirectional communication
- ✓ `aws-iot-device-sdk` - AWS IoT MQTT client
- ✓ `nodemon` (dev) - Auto-restart on file changes

## Starting the Server

### Production Mode
```bash
npm start
```

Starts the server normally. Suitable for deployment.

### Development Mode (with auto-restart)
```bash
npm run dev
```

Server automatically restarts when files change (requires `nodemon`).

### Custom Port
```bash
# Windows PowerShell
$env:PORT=8080; npm start

# Windows CMD
set PORT=8080& npm start

# Linux/macOS
PORT=8080 npm start
```

Default port is 3000 if not specified.

## Testing & Debugging

### Check installed packages
```bash
npm list
npm list --depth=0
```

### Check for outdated packages
```bash
npm outdated
```

### Update packages
```bash
npm update           # Update to latest compatible versions
npm install @latest # Update to latest versions (breaking changes possible)
```

### Clean install (if dependencies are corrupted)
```bash
rm -rf node_modules package-lock.json    # Linux/macOS
rmdir /s node_modules & del package-lock.json  # Windows
npm install          # Fresh install
```

## Project Management

### View package info
```bash
npm info socket.io
npm info aws-iot-device-sdk
npm info express
```

### Add new dependencies
```bash
npm install package-name              # Add to dependencies
npm install --save-dev package-name   # Add to devDependencies
```

### Remove dependencies
```bash
npm uninstall package-name
```

### Run custom scripts
```bash
npm run start    # Same as npm start
npm run dev      # Runs nodemon
```

Edit `package.json` scripts section to add more commands.

## Troubleshooting npm

### "command not found: npm"
```bash
# Check if Node.js/npm is installed
node --version
npm --version

# If not installed, download from https://nodejs.org/
```

### "Cannot find module" errors
```bash
# This usually means node_modules is missing or corrupted
npm install

# Or clean install
rm -rf node_modules package-lock.json
npm install
```

### Port 3000 already in use
```bash
# Use different port
PORT=8080 npm start

# Or kill process on port 3000
# Linux/macOS: lsof -i :3000 | kill -9 [PID]
# Windows: netstat -ano | findstr :3000 | taskkill /PID [PID] /F
```

### AWS connection fails but dependencies installed
```bash
# Verify certificates exist in root directory
ls -la private.key certificate.pem.crt AmazonRootCA1.pem

# Check server logs for details
npm start | grep -i error
```

## Docker Commands

### Build Docker image
```bash
docker build -t motor-dashboard:latest .
```

### Run Docker container
```bash
docker run -d \
  --name motor-dashboard \
  -p 3000:3000 \
  -v $(pwd)/certificate.pem.crt:/app/certificate.pem.crt \
  -v $(pwd)/private.key:/app/private.key \
  -v $(pwd)/AmazonRootCA1.pem:/app/AmazonRootCA1.pem \
  motor-dashboard:latest
```

### View Docker logs
```bash
docker logs motor-dashboard
docker logs -f motor-dashboard  # Follow logs
```

### Stop Docker container
```bash
docker stop motor-dashboard
docker rm motor-dashboard
```

## Versions

Check versions installed:

```bash
npm ls express
npm ls socket.io
npm ls aws-iot-device-sdk
npm ls nodemon
```

Current versions in package.json:
- `express`: ^4.18.2
- `socket.io`: ^4.7.2
- `aws-iot-device-sdk`: ^2.2.13
- `nodemon` (dev): ^3.0.2

Update package.json versions and run `npm install` to get newer versions.

## Performance

### Check if npm cache is corrupted
```bash
npm cache verify
npm cache clean --force
npm install
```

### Faster installs with npm ci
```bash
npm ci
# Install exact versions from package-lock.json (faster than npm install)
```

## Help

```bash
npm help                 # General help
npm help install         # Help for specific command
npm search package-name  # Search npm registry
npm info package-name    # Package information
```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm start` | Run production server |
| `npm run dev` | Run with auto-restart (dev mode) |
| `npm list` | Show installed packages |
| `npm outdated` | Check for updates |
| `npm update` | Update packages |
| `npm uninstall pkg` | Remove a package |
| `npm cache clean` | Clear cache |

---

**Most Common Workflow:**

```bash
npm install          # After first clone
npm start            # To run the server
npm run dev          # While developing
```

For more info: https://docs.npmjs.com/
