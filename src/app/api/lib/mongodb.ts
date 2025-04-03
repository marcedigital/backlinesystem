// src/lib/mongodb.ts
import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Interface for mongoose connection
interface MongooseConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Interface for MongoDB client connection
interface MongoDBConnection {
  client: MongoClient | null;
  clientPromise: Promise<MongoClient> | null;
}

// Define custom NodeJS global type to include both connections
declare global {
  var mongoose: MongooseConnection | undefined;
  var mongoClient: MongoDBConnection | undefined;
}

// Initialize cached mongoose connection
const cachedMongoose: MongooseConnection = global.mongoose || { conn: null, promise: null };

// Initialize cached MongoDB client connection
const cachedClient: MongoDBConnection = global.mongoClient || { client: null, clientPromise: null };

console.log("MongoDB URI (prefix only):", 
  process.env.MONGODB_URI ? 
  process.env.MONGODB_URI.substring(0, 15) + "..." : 
  "undefined");

// If we're in a fresh environment, initialize the globals
if (!global.mongoose) {
  global.mongoose = cachedMongoose;
}

if (!global.mongoClient) {
  global.mongoClient = cachedClient;
}

// Connect using mongoose (for models)
export async function connectToDatabase() {
  if (cachedMongoose.conn) {
    return cachedMongoose.conn;
  }

  if (!cachedMongoose.promise) {
    const opts = {
      bufferCommands: false,
    };

    cachedMongoose.promise = mongoose.connect(MONGODB_URI!, opts)
      .then((mongoose) => {
        console.log('MongoDB (mongoose) connected successfully');
        return mongoose;
      })
      .catch((error) => {
        console.error('MongoDB connection error:', error);
        throw error;
      });
  }

  cachedMongoose.conn = await cachedMongoose.promise;
  return cachedMongoose.conn;
}

// Connect using MongoClient (for NextAuth adapter)
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!cachedClient.clientPromise) {
  client = new MongoClient(MONGODB_URI!);
  cachedClient.clientPromise = client.connect()
    .then((client) => {
      console.log('MongoDB (client) connected successfully');
      return client;
    })
    .catch((error) => {
      console.error('MongoDB client connection error:', error);
      throw error;
    });
  
  global.mongoClient = {
    client: null,
    clientPromise: cachedClient.clientPromise
  };
} else {
  clientPromise = cachedClient.clientPromise!;
}

export default cachedClient.clientPromise!;