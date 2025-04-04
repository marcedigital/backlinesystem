// src/app/lib/mongodb.ts - Fixed TypeScript errors
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
  throw new Error('Please define the MONGODB_URI environment variable');
}

if (!MONGODB_DB) {
  throw new Error('Please define the MONGODB_DBNAME environment variable');
}

// Cache object in global scope to prevent reconnections
let cached: MongoDBCache = global.mongoClient || { client: null, promise: null };

// Initialize global cache if not already done
if (!global.mongoClient) {
  global.mongoClient = cached;
}

/**
 * Global is used here to maintain connection between function calls
 * in the development server and serverless functions in production.
 */
export async function connectToMongoClient(): Promise<MongoClient> {
  if (cached.client) {
    logToConsole('info', 'Using existing MongoDB client connection');
    return cached.client;
  }

  if (!cached.promise) {
    const opts = {
      maxPoolSize: 10, // Optimize for serverless environment
      minPoolSize: 1,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 30000,
    };

    cached.promise = MongoClient.connect(MONGODB_URI!, opts)
      .then((client) => {
        logToConsole('info', 'New MongoDB client connection established');
        return client;
      })
      .catch((error) => {
        logToConsole('error', 'MongoDB client connection error', { error });
        throw error;
      });
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
}

// Helper function to get the database
export async function getMongoDb() {
  const client = await connectToMongoClient();
  return client.db(MONGODB_DB);
}

// Export the client promise as the default export
export default cached.promise!;