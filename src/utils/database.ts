import mongoose from 'mongoose';
import { createLogger, format, transports } from 'winston';

// Create a logger for database-related events
const dbLogger = createLogger({
  level: 'info',
  format: format.combine(
    format.colorize(),
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level}: ${message}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ 
      filename: 'logs/database.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Set buffer timeout to 30 seconds (30000ms) instead of default 10000ms
mongoose.set('bufferTimeoutMS', 30000);

// Caching the database connection
let isConnected = false;

export async function connectToDatabase() {
  // Check if we have an existing connection
  if (isConnected && mongoose.connection.readyState === 1) {
    dbLogger.info('Using existing database connection');
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bldatabase';

  try {
    // Connect to MongoDB with additional options for stability
    const connection = await mongoose.connect(uri, {
      dbName: process.env.MONGODB_DBNAME || 'bldatabase',
      serverSelectionTimeoutMS: 30000, // Timeout for server selection
      socketTimeoutMS: 45000,         // How long sockets stay open idle
      connectTimeoutMS: 30000,        // Initial connection timeout
    });

    isConnected = true;
    dbLogger.info('New database connection established');

    // Connection event listeners
    mongoose.connection.on('disconnected', () => {
      dbLogger.warn('Lost database connection');
      isConnected = false;
    });

    mongoose.connection.on('error', (err) => {
      dbLogger.error('Mongoose connection error:', err);
      isConnected = false;
    });

    return connection;
  } catch (error) {
    dbLogger.error('Database connection error', error);
    isConnected = false;
    throw error;
  }
}

export async function disconnectFromDatabase() {
  try {
    await mongoose.disconnect();
    isConnected = false;
    dbLogger.info('Database connection closed');
  } catch (error) {
    dbLogger.error('Error closing database connection', error);
  }
}

export { mongoose };