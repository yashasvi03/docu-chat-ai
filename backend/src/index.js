require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import configuration
const { connectDB, serverConfig } = require('./config');

// Import routes
const documentRoutes = require('./routes/documents');
const chatRoutes = require('./routes/chat');
const authRoutes = require('./routes/auth');

// Create Express app
const app = express();
const PORT = serverConfig.port;

// Connect to database
(async () => {
  try {
    await connectDB();
    console.log('Database connected');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
})();

// Middleware
app.use(cors({
  origin: serverConfig.corsOrigin,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running',
    environment: serverConfig.env
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message: err.message || 'Something went wrong on the server',
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${serverConfig.env} mode`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = app;
