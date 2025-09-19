// Socket.IO Server for Real-time Jury Evaluation Sync
// Handles broadcasting evaluation updates between all connected devices

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import process from 'process';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173", 
      "http://localhost:3000", 
      "https://*.vercel.app",
      "https://*.onrender.com",
      process.env.CLIENT_URL || "http://localhost:5173"
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(cors());
app.use(express.json());

// Store connected clients and their info
const connectedClients = new Map();
const evaluationStats = {
  totalJuries: 0,
  completedJuries: 0,
  totalTeams: 0,
  lastUpdate: new Date().toISOString()
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔗 New client connected:', socket.id);
  
  // Store client info
  connectedClients.set(socket.id, {
    id: socket.id,
    connectedAt: new Date().toISOString(),
    isAdmin: false,
    juryId: null
  });

  // Broadcast current client count
  io.emit('client-count', {
    count: connectedClients.size,
    timestamp: new Date().toISOString()
  });

  // Client identification (jury or admin)
  socket.on('identify-client', (data) => {
    const clientInfo = connectedClients.get(socket.id);
    if (clientInfo) {
      clientInfo.isAdmin = data.isAdmin || false;
      clientInfo.juryId = data.juryId || null;
      clientInfo.juryName = data.juryName || null;
      
      console.log('👤 Client identified:', {
        socketId: socket.id,
        isAdmin: clientInfo.isAdmin,
        juryId: clientInfo.juryId,
        juryName: clientInfo.juryName
      });
    }
  });

  // Handle jury evaluation updates
  socket.on('jury-evaluation-update', (data) => {
    console.log('📊 Broadcasting jury evaluation update:', {
      juryId: data.juryId,
      timestamp: data.timestamp,
      fromSocket: socket.id
    });

    // Broadcast to all other clients (exclude sender)
    socket.broadcast.emit('jury-evaluation-updated', {
      ...data,
      broadcastedAt: new Date().toISOString()
    });

    // Update evaluation stats
    updateEvaluationStats();
  });

  // Handle jury completion
  socket.on('jury-completion', (data) => {
    console.log('✅ Broadcasting jury completion:', {
      juryId: data.juryId,
      timestamp: data.timestamp,
      fromSocket: socket.id
    });

    // Broadcast to all other clients
    socket.broadcast.emit('jury-completed', {
      ...data,
      broadcastedAt: new Date().toISOString()
    });

    // Update evaluation stats
    evaluationStats.completedJuries++;
    updateEvaluationStats();
  });

  // Handle admin actions
  socket.on('admin-action', (data) => {
    const clientInfo = connectedClients.get(socket.id);
    
    // Only allow admin actions from admin clients
    if (clientInfo && clientInfo.isAdmin) {
      console.log('👨‍💼 Broadcasting admin action:', data.action);
      
      // Broadcast to all clients
      io.emit('admin-action', {
        ...data,
        timestamp: new Date().toISOString(),
        adminSocketId: socket.id
      });

      // Reset stats if it's a reset action
      if (data.action === 'reset-evaluations') {
        evaluationStats.completedJuries = 0;
        evaluationStats.lastUpdate = new Date().toISOString();
        updateEvaluationStats();
      }
    } else {
      console.warn('⚠️ Non-admin client attempted admin action:', socket.id);
      socket.emit('error', { message: 'Admin privileges required' });
    }
  });

  // Handle requests for evaluation statistics
  socket.on('request-evaluation-stats', () => {
    socket.emit('evaluation-stats', evaluationStats);
  });

  // Handle configuration updates
  socket.on('config-update', (data) => {
    const clientInfo = connectedClients.get(socket.id);
    
    if (clientInfo && clientInfo.isAdmin) {
      console.log('⚙️ Broadcasting config update:', data.type);
      
      // Broadcast to all other clients
      socket.broadcast.emit('config-updated', {
        ...data,
        timestamp: new Date().toISOString(),
        adminSocketId: socket.id
      });
    }
  });

  // Handle heartbeat/ping
  socket.on('ping', () => {
    socket.emit('pong', { 
      timestamp: new Date().toISOString(),
      serverTime: Date.now()
    });
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    const clientInfo = connectedClients.get(socket.id);
    console.log('❌ Client disconnected:', {
      socketId: socket.id,
      reason,
      wasAdmin: clientInfo?.isAdmin,
      juryId: clientInfo?.juryId
    });
    
    // Remove from connected clients
    connectedClients.delete(socket.id);
    
    // Broadcast updated client count
    io.emit('client-count', {
      count: connectedClients.size,
      timestamp: new Date().toISOString()
    });
  });

  // Send initial evaluation stats to new client
  socket.emit('evaluation-stats', evaluationStats);
});

// Function to update and broadcast evaluation statistics
function updateEvaluationStats() {
  evaluationStats.lastUpdate = new Date().toISOString();
  
  // Broadcast updated stats to all clients
  io.emit('evaluation-stats', evaluationStats);
}

// REST API endpoints for external integration
app.get('/', (req, res) => {
  res.json({
    message: 'SIH Jury Socket.IO Server',
    status: 'running',
    timestamp: new Date().toISOString(),
    connectedClients: connectedClients.size
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    connectedClients: connectedClients.size,
    evaluationStats,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/clients', (req, res) => {
  const clients = Array.from(connectedClients.values()).map(client => ({
    id: client.id,
    isAdmin: client.isAdmin,
    juryId: client.juryId,
    juryName: client.juryName,
    connectedAt: client.connectedAt
  }));
  
  res.json({
    count: clients.length,
    clients,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/broadcast', (req, res) => {
  const { event, data } = req.body;
  
  if (!event || !data) {
    return res.status(400).json({ error: 'Event and data are required' });
  }
  
  // Broadcast to all connected clients
  io.emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
    source: 'api'
  });
  
  res.json({
    success: true,
    event,
    broadcastedTo: connectedClients.size,
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Server configuration
const PORT = process.env.PORT || process.env.SOCKET_PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

server.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Socket.IO server running on port', PORT);
  console.log('📡 Ready for real-time jury evaluation sync');
  console.log('🌍 Environment:', isProduction ? 'PRODUCTION' : 'DEVELOPMENT');
  console.log('🔗 CORS enabled for:', [
    "http://localhost:5173", 
    "http://localhost:3000", 
    "https://*.vercel.app",
    "https://*.onrender.com",
    process.env.CLIENT_URL || "http://localhost:5173"
  ]);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 Shutting down Socket.IO server...');
  server.close(() => {
    console.log('✅ Socket.IO server closed');
    process.exit(0);
  });
});

export default app;