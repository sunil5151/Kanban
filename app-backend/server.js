// server.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { testConnection } from './src/config/dbConfig.js';
import authRoutes from './src/routes/authRoutes.js';
import initRoutes from './src/routes/initRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import taskRoutes from './src/routes/taskRoutes.js';
import boardRoutes from './src/routes/boardRoutes.js';
import logRoutes from './src/routes/logRoutes.js';
import conflictRoutes from './src/routes/conflictRoutes.js';
import { initDatabase } from './src/controllers/initController.js';
import { initSocketIO } from './src/controllers/socketController.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
});

// Initialize Socket.IO
initSocketIO(io);

// Make io globally available
global.io = io;
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'https://demo-1-pgla.onrender.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/conflicts', conflictRoutes);
app.use('/init', initRoutes);

// Add this import
import lockRoutes from './src/routes/lockRoutes.js';

// Add this to the routes section
app.use('/api/locks', lockRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/conflicts', conflictRoutes);
app.use('/init', initRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Auth API is running' });
});

// Start server after testing DB connection
testConnection().then(async (connected) => {
  if (connected) {
    // Auto-initialize database on server start
    try {
      console.log('🔄 Initializing database...');
      await initDatabase(null, { json: () => console.log('✅ Database initialized successfully') });
    } catch (error) {
      console.error('❌ Database initialization error:', error);
    }
    
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } else {
    console.error('Failed to connect to database. Server not started.');
    process.exit(1);
  }
});