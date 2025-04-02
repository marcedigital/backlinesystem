import mongoose from 'mongoose';
import { logToConsole } from './logger';

function getEnvVariable(key: string): string {
  const value = process.env[key];
  
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set. Please check your .env configuration.`);
  }
  
  return value;
}

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
  try {
    // Log connection details
    logToConsole('info', 'Attempting to connect to MongoDB', {
      uri: process.env.MONGODB_URI 
        ? process.env.MONGODB_URI.replace(/:[^:]*@/, ':****@') 
        : 'NO URI FOUND',
      dbName: process.env.MONGODB_DBNAME,
      nodeEnv: process.env.NODE_ENV,
    });

    const uri = getEnvVariable('MONGODB_URI');
    const dbName = getEnvVariable('MONGODB_DBNAME');

    // Check if we have an existing connection
    const cached = globalThis.mongoose || { conn: null, promise: null };
    
    if (cached.conn && cached.conn.readyState === 1) {
      logToConsole('info', 'Using existing database connection');
      return cached.conn;
    }

    // Connection options
    const connectionOptions: mongoose.ConnectOptions = {
      dbName: dbName,
      
      serverSelectionTimeoutMS: parseInt(
        process.env.MONGODB_SERVER_SELECTION_TIMEOUT || '10000', 
        10
      ),
      socketTimeoutMS: parseInt(
        process.env.MONGODB_SOCKET_TIMEOUT || '10000', 
        10
      ),
      connectTimeoutMS: parseInt(
        process.env.MONGODB_CONNECT_TIMEOUT || '10000', 
        10
      ),

      retryWrites: process.env.MONGODB_RETRY_WRITES === 'true',
      retryReads: process.env.MONGODB_RETRY_READS === 'true',
      
      authSource: process.env.MONGODB_AUTH_SOURCE || 'admin',
    };

    logToConsole('info', 'Connection Options', connectionOptions);

    // Create connection promise
    cached.promise = mongoose.connect(uri, connectionOptions)
      .then((mongoose) => {
        logToConsole('info', 'New database connection established', {
          database: dbName,
          host: mongoose.connection.host
        });
        
        cached.conn = mongoose.connection;
        return mongoose;
      });

    // Connection event listeners
    mongoose.connection.on('disconnected', () => {
      logToConsole('warn', 'Lost database connection', { database: dbName });
      cached.conn = null;
    });

    mongoose.connection.on('error', (err) => {
      logToConsole('error', 'Mongoose connection error', { 
        error: err,
        database: dbName 
      });
      cached.conn = null;
    });

    // Wait for and return connection
    return await cached.promise.then((mongoose) => mongoose.connection);

  } catch (error) {
    logToConsole('error', 'Failed to establish database connection', { 
      error,
      uri: process.env.MONGODB_URI?.replace(/:[^:]*@/, ':****@') // Redact password
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
      logToConsole('info', 'Database connection closed');
    }
  } catch (error) {
    logToConsole('error', 'Error closing database connection', { error });
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