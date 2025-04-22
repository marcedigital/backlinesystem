// src/app/lib/mongodb.ts - Fixed version
import { MongoClient } from 'mongodb';
import { logToConsole } from '@/utils/logger';

// Connection cache interface
interface MongoDBCache {
  client: MongoClient | null;
  promise: Promise<MongoClient> | null;
}

// Extend the NodeJS.Global interface to include our cache
declare global {
  var mongoClient: MongoDBCache;
}

// Required environment variables
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DBNAME;

if (!MONGODB_URI) {
  logToConsole('error', 'Missing MONGODB_URI environment variable');
  throw new Error('Please define the MONGODB_URI environment variable');
}

if (!MONGODB_DB) {
  logToConsole('error', 'Missing MONGODB_DBNAME environment variable');
  throw new Error('Please define the MONGODB_DBNAME environment variable');
}

// Cache object in global scope to prevent reconnections
// Initialize it properly to avoid default export issues
let cached: MongoDBCache = global.mongoClient || { 
  client: null, 
  promise: null 
};

// Make sure we set the global cache
if (!global.mongoClient) {
  global.mongoClient = cached;
}

/**
 * Connect to MongoDB with retry logic
 */
async function connectWithRetry(
  uri: string, 
  options: any,
  retries = 5, 
  delay = 5000
): Promise<MongoClient> {
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logToConsole('info', `MongoDB connection attempt ${attempt}/${retries}`);
      const client = await MongoClient.connect(uri, options);
      logToConsole('info', 'MongoDB client connection established successfully');
      return client;
    } catch (error) {
      lastError = error;
      logToConsole('error', `MongoDB connection attempt ${attempt} failed:`, error);
      
      if (attempt === retries) {
        break;
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  logToConsole('error', `Failed to connect to MongoDB after ${retries} attempts`);
  throw lastError;
}

/**
 * Global is used here to maintain connection between function calls
 * in the development server and serverless functions in production.
 */
export async function connectToMongoClient(): Promise<MongoClient> {
  try {
    if (cached.client) {
      logToConsole('info', 'Using existing MongoDB client connection');
      return cached.client;
    }

    if (!cached.promise) {
      const opts = {
        maxPoolSize: 10, // Optimize for serverless environment
        minPoolSize: 1,
        connectTimeoutMS: parseInt(process.env.MONGODB_CONNECTION_TIMEOUT || '30000'),
        socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT || '45000'),
        serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT || '30000'),
        retryWrites: true,
        retryReads: true,
        w: 'majority'
      };

      const retries = parseInt(process.env.MONGODB_RETRY_COUNT || '5');
      const delay = parseInt(process.env.MONGODB_RETRY_INTERVAL || '5000');
      
      logToConsole('info', 'Creating new MongoDB connection promise');
      cached.promise = connectWithRetry(MONGODB_URI, opts, retries, delay);
    }

    try {
      cached.client = await cached.promise;
      return cached.client;
    } catch (error) {
      // Reset cache on error
      cached.client = null;
      cached.promise = null;
      throw error;
    }
  } catch (error) {
    logToConsole('error', 'Error connecting to MongoDB:', error);
    throw error;
  }
}

// Helper function to get the database
export async function getMongoDb() {
  try {
    const client = await connectToMongoClient();
    if (!client) {
      throw new Error('Failed to get MongoDB client');
    }
    
    const db = client.db(MONGODB_DB);
    if (!db) {
      throw new Error('Failed to get MongoDB database');
    }
    
    return db;
  } catch (error) {
    logToConsole('error', 'Error getting MongoDB database:', error);
    throw error;
  }
}

// Create a ClientPromise that initializes the connection if needed
const clientPromise = (async () => {
  try {
    return await connectToMongoClient();
  } catch (error) {
    logToConsole('error', 'Failed to create client promise:', error);
    throw error;
  }
})();

// Export clientPromise for NextAuth and other uses
export default clientPromise;