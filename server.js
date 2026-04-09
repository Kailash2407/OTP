const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const awsIot = require('aws-iot-device-sdk');

// ── Configuration ──
const config = {
  aws: {
    endpoint: 'a2k4lnve2p8ceg-ats.iot.ap-south-1.amazonaws.com',
    region: 'ap-south-1',
    clientId: 'motor-dashboard-' + Math.random().toString(16).substr(2, 8),
    topic: 'vehicle/motor/data',
    certPath: path.join(__dirname, 'certificate.pem.crt'),
    keyPath: path.join(__dirname, 'private.key'),
    caPath: path.join(__dirname, 'AmazonRootCA1.pem'),
  },
  server: {
    port: process.env.PORT || 3000,
    host: '0.0.0.0',
  },
};

// ── Express + Socket.IO Setup ──
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// ── Serve Static Files ──
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── AWS IoT Connection ──
console.log('[AWS IoT] Initializing connection...');

const device = awsIot.device({
  keyPath: config.aws.keyPath,
  certPath: config.aws.certPath,
  caPath: config.aws.caPath,
  clientId: config.aws.clientId,
  host: config.aws.endpoint,
  region: config.aws.region,
  port: 8883,
  protocol: 'mqtts',
  autoReconnect: true,
  reconnectPeriod: 5000,
});

let connectedClients = 0;
let lastMotorData = null;
let lastThrottleValue = 0;
let isAwsConnected = false;

// ── Apply Throttle Scaling ──
function applyThrottleScaling(motorData, throttlePercent) {
  if (!motorData) return null;

  const throttleFactor = throttlePercent / 100;

  return {
    speed: motorData.speed * throttleFactor,
    current: motorData.current * throttleFactor,
    voltage: motorData.voltage * throttleFactor,
    temperature: motorData.temperature, // Temperature stays same or applies different logic
    rawSpeed: motorData.speed, // Include raw speed for display
    throttle: throttlePercent, // Include current throttle setting
    timestamp: new Date().toISOString(),
  };
}

device.on('connect', () => {
  console.log('[AWS IoT] Connected to AWS IoT Core');
  console.log(`[AWS IoT] Subscribing to topic: ${config.aws.topic}`);
  
  isAwsConnected = true;
  
  device.subscribe(config.aws.topic, (err) => {
    if (err) {
      console.error('[AWS IoT] Subscribe error:', err);
    } else {
      console.log('[AWS IoT] Successfully subscribed');
    }
  });

  // Notify all connected clients
  io.emit('iotStatus', { connected: true });
});

device.on('message', (topic, payload) => {
  try {
    // Parse incoming MQTT message
    const motorData = JSON.parse(payload.toString());

    // Validate expected fields
    if (!motorData.speed || motorData.current === undefined || 
        !motorData.voltage || !motorData.temperature) {
      console.warn('[MQTT] Invalid data structure:', motorData);
      return;
    }

    // Cache latest data
    lastMotorData = {
      ...motorData,
      timestamp: new Date().toISOString(),
    };

    console.log('[MQTT] Received data:', motorData);

    // Apply throttle scaling and emit to all connected Socket.IO clients
    const throttledData = applyThrottleScaling(lastMotorData, lastThrottleValue);
    io.emit('motorData', throttledData || lastMotorData);
  } catch (error) {
    console.error('[MQTT] JSON Parse error:', error.message);
  }
});

device.on('error', (error) => {
  console.error('[AWS IoT] Connection error:', error);
  isAwsConnected = false;
  io.emit('iotStatus', { connected: false, error: error.message });
});

device.on('offline', () => {
  console.warn('[AWS IoT] Device went offline');
  isAwsConnected = false;
  io.emit('iotStatus', { connected: false });
});

device.on('reconnect', () => {
  console.log('[AWS IoT] Attempting to reconnect...');
});

// ── Socket.IO Event Handlers ──
io.on('connection', (socket) => {
  connectedClients++;
  console.log(`[Socket.IO] Client connected. Total: ${connectedClients}`);

  // Send current status
  socket.emit('iotStatus', { connected: isAwsConnected });

  // Send last known data if available
  if (lastMotorData) {
    socket.emit('motorData', lastMotorData);
  }

  // Send last throttle value if available
  if (lastThrottleValue > 0) {
    socket.emit('throttleStatus', { throttle: lastThrottleValue });
  }

  // Handle throttle control from clients (NEW EVENT: 'throttle')
  socket.on('throttle', (value) => {
    try {
      const throttle = parseInt(value);

      // Validate throttle value (0-100)
      if (isNaN(throttle) || throttle < 0 || throttle > 100) {
        console.warn('[Throttle] Invalid throttle value:', throttle);
        return;
      }

      lastThrottleValue = throttle;
      console.log('[Throttle] Updated throttle value to:', throttle, '%');

      // Publish throttle command to MQTT topic: vehicle/motor/control
      device.publish('vehicle/motor/control', throttle.toString(), (err) => {
        if (err) {
          console.error('[Throttle] Publish error:', err);
        } else {
          console.log('Throttle sent:', throttle);
        }
      });

      // Immediately apply throttle scaling to current data and broadcast
      if (lastMotorData) {
        const throttledData = applyThrottleScaling(lastMotorData, throttle);
        io.emit('motorData', throttledData);
        console.log('[Throttle] Broadcasted throttled data to all clients');
      }

      // Broadcast throttle status to all clients
      io.emit('throttleUpdate', { throttle: throttle, timestamp: new Date().toISOString() });

      // Send acknowledgment to sending client
      socket.emit('throttleAck', { throttle: throttle, received: true });
    } catch (error) {
      console.error('[Throttle] Error:', error.message);
    }
  });

  socket.on('disconnect', () => {
    connectedClients--;
    console.log(`[Socket.IO] Client disconnected. Total: ${connectedClients}`);
  });

  socket.on('error', (error) => {
    console.error('[Socket.IO] Error:', error);
  });
});

// ── Server Startup ──
server.listen(config.server.port, config.server.host, () => {
  console.log(`
╔════════════════════════════════════════╗
║  Motor Dashboard Server                 ║
╠════════════════════════════════════════╣
║  HTTP Server: http://localhost:${config.server.port}        ║
║  AWS IoT: ${config.aws.endpoint}  ║
║  MQTT Topic: ${config.aws.topic}         ║
║  Client ID: ${config.aws.clientId.substring(0, 20)}...    ║
╚════════════════════════════════════════╝
  `);
});

// ── Graceful Shutdown ──
process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down gracefully...');
  
  device.end();
  server.close(() => {
    console.log('[Server] Closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n[Server] Shutting down gracefully (SIGTERM)...');
  
  device.end();
  server.close(() => {
    console.log('[Server] Closed');
    process.exit(0);
  });
});

// ── Error Handling ──
process.on('uncaughtException', (error) => {
  console.error('[Fatal] Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Fatal] Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
