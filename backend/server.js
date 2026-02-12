require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Initialize express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO for real-time features
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'OpsFlow API'
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/business', require('./routes/business.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/services', require('./routes/service.routes'));
app.use('/api/leads', require('./routes/lead.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/forms', require('./routes/form.routes'));
app.use('/api/inventory', require('./routes/inventory.routes'));
app.use('/api/messages', require('./routes/message.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/automations', require('./routes/automation.routes'));

// Public booking page endpoint (no auth required)
app.use('/api/public', require('./routes/public.routes'));

// Webhook endpoint
app.use('/api/webhooks', require('./routes/webhook.routes'));

// Socket.IO connection handling for real-time features
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join business room
  socket.on('join-business', (businessId) => {
    socket.join(`business-${businessId}`);
    console.log(`Socket ${socket.id} joined business room: ${businessId}`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Make io accessible to routes
app.set('io', io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 OpsFlow Backend Server                          ║
║                                                       ║
║   ✅ Server running on port ${PORT}                      ║
║   ✅ Socket.IO enabled for real-time updates         ║
║   ✅ Environment: ${process.env.NODE_ENV || 'development'}                    ║
║                                                       ║
║   📡 API: http://localhost:${PORT}                       ║
║   💚 Health: http://localhost:${PORT}/health            ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);

  // Start Automation Scheduler (Check every minute)
  const automationService = require('./services/automation.service');
  setInterval(() => {
    automationService.checkReminders().catch(err => console.error('Automation Error:', err));
  }, 60000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = { app, io };
