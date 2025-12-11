import express from 'express';
import { initializeDatabase } from './config/database';
import userRoutes from './routes/userRoutes';
import isolationRoutes from './routes/isolationRoutes';
import consistencyRoutes from './routes/consistencyRoutes';
// Import models to initialize associations
import './models';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', userRoutes);
app.use('/api', isolationRoutes);
app.use('/api', consistencyRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Start server
const startServer = async () => {
  try {
    // Initialize database connection
    await initializeDatabase();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API endpoints available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

