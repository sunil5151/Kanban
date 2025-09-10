// server.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { testSupabaseConnection } from './src/config/supabaseConfig.js';
import authRoutes from './src/routes/authRoutes.js';
import initRoutes from './src/routes/initRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import taskRoutes from './src/routes/taskRoutes.js';
import boardRoutes from './src/routes/boardRoutes.js';
import logRoutes from './src/routes/logRoutes.js';
import conflictRoutes from './src/routes/conflictRoutes.js';
import lockRoutes from './src/routes/lockRoutes.js';
import { initDatabase } from './src/controllers/initController.js';
import { initSocketIO } from './src/controllers/socketController.js';

const app = express();
const httpServer = createServer(app);

// Configure CORS to allow all origins
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    // Allow all origins
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

const io = new Server(httpServer, {
  cors: corsOptions
});

// Initialize Socket.IO
initSocketIO(io);

// Make io globally available
global.io = io;

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

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
app.use('/api/locks', lockRoutes);
app.use('/init', initRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Auth API is running' });
});

// Start server after testing DB connection
testSupabaseConnection().then(async (connected) => {
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
      console.log(`🌐 CORS enabled for all origins`);
    });
  } else {
    console.error('Failed to connect to database. Server not started.');
    process.exit(1);
  }
});