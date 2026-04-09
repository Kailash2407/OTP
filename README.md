# Motor Dashboard Server

Real-time motor telemetry streaming from AWS IoT Core to a 3D interactive dashboard.

## Architecture

```
AWS IoT Core (MQTT)
      ↓
   server.js (Node.js)
      ↓
   Socket.IO
      ↓
motor-dashboard/index.html (3D + Charts + Real-time UI)
```

## Prerequisites

- **Node.js** v14+ installed
- **AWS IoT Credentials** (3 files in root):
  - `private.key`
  - `certificate.pem.crt`
  - `AmazonRootCA1.pem`
- **AWS IoT Endpoint**: `a2k4lnve2p8ceg-ats.iot.ap-south-1.amazonaws.com`
- **MQTT Topic**: `vehicle/motor/data`

## Installation

### 1. Install Dependencies

```bash
npm install
```

Or if you prefer Yarn:

```bash
yarn install
```

### 2. Verify File Structure

Ensure all files are in the root directory:

```
.
├── server.js              ← Main backend server
├── package.json           ← Dependencies
├── private.key            ← AWS IoT private key
├── certificate.pem.crt    ← AWS IoT certificate
├── AmazonRootCA1.pem      ← AWS IoT root CA
└── motor-dashboard/
    ├── index.html         ← Updated with Socket.IO integration
    ├── model.glb          ← 3D motor model (optional)
    └── ...
```

## Running the Server

### Development Mode (with auto-restart)

```bash
npm run dev
```

Requires `nodemon`. Install with:
```bash
npm install --save-dev nodemon
```

### Production Mode

```bash
npm start
```

### Expected Output

```
╔════════════════════════════════════════╗
║  Motor Dashboard Server                 ║
╠════════════════════════════════════════╣
║  HTTP Server: http://localhost:3000    ║
║  AWS IoT: a2k4lnve2p8ceg-ats.iot...   ║
║  MQTT Topic: vehicle/motor/data        ║
║  Client ID: motor-dashboard-xxxx       ║
╚════════════════════════════════════════╝
```

## How It Works

### Backend (server.js)

1. **Express Server**: Serves static files from `motor-dashboard/` folder
2. **AWS IoT Connection**: 
   - Connects using MQTT over TLS with certificates
   - Subscribes to `vehicle/motor/data` topic
   - Receives JSON payloads:
     ```json
     {
       "speed": 2500,
       "current": 12.5,
       "voltage": 48.0,
       "temperature": 65.5
     }
     ```
3. **Socket.IO**: Broadcasts received data to all connected clients in real-time

### Frontend (index.html)

- Loads Socket.IO client library from CDN
- Connects to server automatically
- Listens for `motorData` events
- Updates:
  - Metric cards (speed, current, voltage, temperature)
  - Real-time charts (3 time-series graphs)
  - 3D motor visualization (rotation speed synced to RPM)
  - Connection status indicator
  - Alerts when thresholds exceeded

## Configuration

### Modifying AWS IoT Connection

Edit `server.js` configuration section:

```javascript
const config = {
  aws: {
    endpoint: 'your-endpoint.iot.region.amazonaws.com',
    region: 'ap-south-1',
    topic: 'vehicle/motor/data',
    // ... certificate paths
  },
  server: {
    port: 3000,  // Change default port
  }
};
```

### Modifying Server Port

Set environment variable or edit `config.server.port`:

```bash
# Linux/macOS
PORT=8080 npm start

# Windows PowerShell
$env:PORT=8080; npm start

# Windows CMD
set PORT=8080& npm start
```

### Modifying MQTT Topic

Update in `server.js`:

```javascript
topic: 'your/custom/topic'
```

Also update the subscription in the `device.on('connect')` block.

## Expected MQTT Message Format

The backend expects JSON messages on the subscribed MQTT topic:

```json
{
  "speed": 2500,           // RPM (0-3000 typical)
  "current": 12.5,         // Amperes (0-20 typical)
  "voltage": 48.0,         // Volts (24-240 typical)
  "temperature": 65.5      // Celsius (0-120 typical)
}
```

**Note**: Missing or invalid fields will be logged as a warning but won't crash the server.

## Error Handling

### Connection Failures

- AWS IoT connection errors are logged to console
- Auto-reconnect with 5-second backoff (configurable)
- Client-side status badge shows `IoT ERROR` if connection fails

### JSON Parse Errors

- Invalid MQTT payloads are logged as warnings
- Valid messages continue to process normally

### Network Disconnects

- Client reconnection is automatic
- UI shows `LIVE` when connected, `OFFLINE` when disconnected

## Performance Notes

- Max 40 data points in time-series charts (configurable via `MAX_POINTS`)
- 3D motor visualization runs at 60 FPS (browser-dependent)
- Socket.IO event broadcasting < 10ms latency typical
- Memory footprint: ~80 MB Node.js process

## Troubleshooting

### "Cannot find module" errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### AWS IoT Connection Fails

- Verify certificate paths are correct
- Ensure certificates have correct file permissions
- Check AWS IoT endpoint is correct
- Verify security group rules allow port 8883 (MQTT over TLS)

### Socket.IO Connection Fails

- Open browser DevTools → Console
- Check if `io()` is defined (Socket.IO CDN loaded)
- Verify backend is running (`npm start`)
- Check firewall allows port 3000/8000/etc

### No Data Appearing

- Check that MQTT messages are being published to the correct topic
- Verify JSON format matches expected schema
- Check browser console for `[motorData] Received:` logs
- Check server logs for `[MQTT] Received data:` logs

## Development Tips

### Testing MQTT Publishing

Use AWS IoT Core Console or AWS CLI:

```bash
# Using AWS CLI (requires AWS configuration)
aws iot-data publish \
  --topic vehicle/motor/data \
  --payload '{"speed":2500,"current":12.5,"voltage":48.0,"temperature":65.5}' \
  --region ap-south-1 \
  --endpoint-url https://a2k4lnve2p8ceg-ats.iot.ap-south-1.amazonaws.com
```

### Browser Console Debugging

All events are logged with `[Socket.IO]` or `[motorData]` prefixes:

```javascript
// In browser console
console.log() shows all connection and data events
```

### Server Logging

Server logs include timestamps and event sources:

```
[AWS IoT] Connected to AWS IoT Core
[AWS IoT] Subscribing to topic: vehicle/motor/data
[MQTT] Received data: { speed: 2500, current: 12.5, ... }
[Socket.IO] Client connected. Total: 1
```

## Security Considerations

- **AWS IoT Certificates**: Never commit private keys to version control
- **Environment Variables**: Use for sensitive config in production
- **CORS**: Default allows all origins; restrict in production:
  ```javascript
  cors: {
    origin: 'https://yourdomain.com',
    methods: ['GET', 'POST']
  }
  ```

## Deployment

### Docker

```dockerfile
FROM node:18-slim
WORKDIR /app
COPY . .
RUN npm ci --only=production
EXPOSE 3000
CMD ["npm", "start"]
```

### systemd Service (Linux)

Create `/etc/systemd/system/motor-dashboard.service`:

```ini
[Unit]
Description=Motor Dashboard Server
After=network.target

[Service]
Type=simple
User=nobody
WorkingDirectory=/opt/motor-dashboard
ExecStart=/usr/bin/node /opt/motor-dashboard/server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable motor-dashboard
sudo systemctl start motor-dashboard
sudo systemctl status motor-dashboard
```

## License

MIT

## Support

For issues or questions:
1. Check the logs: `npm start` shows detailed messages
2. Verify file structure matches `Prerequisites` section
3. Confirm AWS IoT credentials are valid
4. Test MQTT connectivity separately
#   O T P  
 #   m o t o r - d a s h b o a r d  
 