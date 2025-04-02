import mongoose from 'mongoose';
import { createLogger, format, transports } from 'winston';

// Environment variable validation function
function getEnvVariable(key: string): string {
  const value = process.env[key];
  
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set. Please check your .env configuration.`);
  }
  
  return value;
}

// Create a logger for database-related events
const dbLogger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.colorize(),
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.printf(({ timestamp, level, message, ...metadata }) => {
      let msg = `[${timestamp}] ${level}: ${message}`;
      const metaStr = Object.keys(metadata).length 
        ? ` | ${JSON.stringify(metadata)}` 
        : '';
      return msg + metaStr;
    })
  ),
  transports: [
    new transports.Console(),
    ...(process.env.NODE_ENV === 'production' 
      ? [new transports.File({ 
          filename: 'logs/database.log',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        })] 
      : [])
  ]
});

// Set buffer timeout from environment
const BUFFER_TIMEOUT = parseInt(process.env.MONGOOSE_BUFFER_TIMEOUT || '30000', 10);
mongoose.set('bufferTimeoutMS', BUFFER_TIMEOUT);

// Connection cache interface
interface MongooseConnection {
  conn: mongoose.Connection | null;
  promise: Promise<typeof mongoose> | null;
}

// Use global to maintain connection across serverless environment
const globalThis = global as unknown as { 
  mongoose: MongooseConnection 
};

export async function connectToDatabase() {
  // Retrieve connection parameters from environment variables
  const uri = getEnvVariable('MONGODB_URI');
  const dbName = getEnvVariable('MONGODB_DBNAME');

  // Check if we have an existing connection
  const cached = globalThis.mongoose || { conn: null, promise: null };
  
  if (cached.conn && cached.conn.readyState === 1) {
    dbLogger.info('Using existing database connection');
    return cached.conn;
  }

  try {
    // Connection options with environment-driven configuration
    const connectionOptions: mongoose.ConnectOptions = {
      dbName: dbName,
      
      // Timeout configurations
      serverSelectionTimeoutMS: parseInt(
        process.env.MONGODB_SERVER_SELECTION_TIMEOUT || '30000', 
        10
      ),
      socketTimeoutMS: parseInt(
        process.env.MONGODB_SOCKET_TIMEOUT || '45000', 
        10
      ),
      connectTimeoutMS: parseInt(
        process.env.MONGODB_CONNECT_TIMEOUT || '30000', 
        10
      ),

      // Additional configurable options
      retryWrites: process.env.MONGODB_RETRY_WRITES === 'true',
      retryReads: process.env.MONGODB_RETRY_READS === 'true',
      
      // Authentication options
      authSource: process.env.MONGODB_AUTH_SOURCE || 'admin',
    };

    // Create connection promise
    cached.promise = mongoose.connect(uri, connectionOptions)
      .then((mongoose) => {
        dbLogger.info(`New database connection established`, {
          database: dbName,
          host: mongoose.connection.host
        });
        
        cached.conn = mongoose.connection;
        return mongoose;
      });

    // Connection event listeners
    mongoose.connection.on('disconnected', () => {
      dbLogger.warn('Lost database connection', { database: dbName });
      cached.conn = null;
    });

    mongoose.connection.on('error', (err) => {
      dbLogger.error('Mongoose connection error', { 
        error: err,
        database: dbName 
      });
      cached.conn = null;
    });

    // Wait for and return connection
    return await cached.promise.then((mongoose) => mongoose.connection);

  } catch (error) {
    dbLogger.error('Failed to establish database connection', { 
      error,
      uri: uri.replace(/:[^:]*@/, ':****@') // Redact password
    });
    
    // Reset connection
    globalThis.mongoose = { conn: null, promise: null };
    
    throw error;
  }
}

export async function disconnectFromDatabase() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      dbLogger.info('Database connection closed');
    }
  } catch (error) {
    dbLogger.error('Error closing database connection', { error });
  } finally {
    // Reset global connection cache
    globalThis.mongoose = { conn: null, promise: null };
  }
}

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  try {
    await disconnectFromDatabase();
    process.exit(0);
  } catch {
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  try {
    await disconnectFromDatabase();
    process.exit(0);
  } catch {
    process.exit(1);
  }
});

export { mongoose };