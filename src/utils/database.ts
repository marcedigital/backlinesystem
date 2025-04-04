import mongoose from 'mongoose';
import { logToConsole } from './logger';

// Connection cache interface
interface MongooseConnection {
  conn: mongoose.Connection | null;
  promise: Promise<typeof mongoose> | null;
}

// Use global to maintain connection across serverless environment
const globalThis = global as unknown as { 
  mongoose: MongooseConnection 
};

// Configuration for MongoDB connection
const MONGODB_RETRY_COUNT = parseInt(process.env.MONGODB_RETRY_COUNT || '5', 10);
const MONGODB_RETRY_INTERVAL = parseInt(process.env.MONGODB_RETRY_INTERVAL || '5000', 10);
const MONGODB_CONNECTION_TIMEOUT = parseInt(process.env.MONGODB_CONNECTION_TIMEOUT || '30000', 10);
const MONGODB_SOCKET_TIMEOUT = parseInt(process.env.MONGODB_SOCKET_TIMEOUT || '45000', 10);
const MONGODB_SERVER_SELECTION_TIMEOUT = parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT || '30000', 10);

// Initialize mongoose cache
if (!globalThis.mongoose) {
  globalThis.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  try {
    // If we have a connection and it's ready, return it
    if (globalThis.mongoose.conn && globalThis.mongoose.conn.readyState === 1) {
      logToConsole('info', 'Using existing database connection');
      return globalThis.mongoose.conn;
    }

    // Required environment variables
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DBNAME;

    if (!uri || !dbName) {
      throw new Error('MongoDB URI and database name must be defined in environment variables');
    }

    // Connection options with longer timeouts for production
    const options: mongoose.ConnectOptions = {
      dbName,
      connectTimeoutMS: MONGODB_CONNECTION_TIMEOUT,
      socketTimeoutMS: MONGODB_SOCKET_TIMEOUT,
      serverSelectionTimeoutMS: MONGODB_SERVER_SELECTION_TIMEOUT,
      maxPoolSize: 10, // Optimize for serverless environment
      minPoolSize: 1,
    };

    logToConsole('info', 'Attempting to connect to MongoDB', {
      uri: uri ? uri.replace(/:[^:]*@/, ':****@') : 'NO URI FOUND',
      dbName,
      environment: process.env.NODE_ENV,
      timeouts: {
        connect: options.connectTimeoutMS,
        socket: options.socketTimeoutMS,
        serverSelection: options.serverSelectionTimeoutMS
      }
    });

    // Create a new connection with retry logic
    if (!globalThis.mongoose.promise) {
      globalThis.mongoose.promise = connectWithRetry(uri, options, MONGODB_RETRY_COUNT);
    }

    // Wait for connection
    const mongooseInstance = await globalThis.mongoose.promise;
    globalThis.mongoose.conn = mongooseInstance.connection;

    // Add event listeners for the connection
    setupConnectionEventListeners(mongooseInstance.connection);

    return globalThis.mongoose.conn;
  } catch (error) {
    // Reset connection on error
    globalThis.mongoose = { conn: null, promise: null };
    logToConsole('error', 'Failed to connect to MongoDB', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
}

// Retry logic for MongoDB connection
async function connectWithRetry(
  uri: string, 
  options: mongoose.ConnectOptions,
  maxRetries: number
): Promise<typeof mongoose> {
  let retries = 0;
  
  while (true) {
    try {
      logToConsole('info', `MongoDB connection attempt ${retries + 1}/${maxRetries}`);
      return await mongoose.connect(uri, options);
    } catch (error) {
      retries++;
      
      if (retries >= maxRetries) {
        logToConsole('error', `Failed to connect to MongoDB after ${maxRetries} attempts`);
        throw error;
      }
      
      logToConsole('warn', `MongoDB connection attempt failed, retrying in ${MONGODB_RETRY_INTERVAL}ms...`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        attempt: retries
      });
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, MONGODB_RETRY_INTERVAL));
    }
  }
}

// Setup event listeners for the MongoDB connection
function setupConnectionEventListeners(connection: mongoose.Connection) {
  connection.on('connected', () => {
    logToConsole('info', 'MongoDB connection established');
  });

  connection.on('disconnected', () => {
    logToConsole('warn', 'MongoDB connection lost');
    globalThis.mongoose.conn = null;
  });

  connection.on('error', (err) => {
    logToConsole('error', 'MongoDB connection error', { error: err });
    globalThis.mongoose.conn = null;
  });

  connection.on('reconnected', () => {
    logToConsole('info', 'MongoDB connection reestablished');
  });
}

// Disconnect from database - useful for cleanup
export async function disconnectFromDatabase() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      logToConsole('info', 'Database connection closed');
    }
  } catch (error) {
    logToConsole('error', 'Error closing database connection', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  } finally {
    // Reset global connection cache
    globalThis.mongoose = { conn: null, promise: null };
  }
}

// Graceful shutdown handlers for Node process
if (typeof process !== 'undefined') {
  // Handle app closing
  process.on('SIGINT', async () => {
    await disconnectFromDatabase();
    process.exit(0);
  });

  // Handle app termination
  process.on('SIGTERM', async () => {
    await disconnectFromDatabase();
    process.exit(0);
  });
}

export { mongoose };