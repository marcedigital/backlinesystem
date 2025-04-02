import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Define interface for global mongodb connection
interface MongooseConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Define custom NodeJS global type to include mongoose
declare global {
  var mongoose: MongooseConnection | undefined;
}

// Initialize cached connection
const cached: MongooseConnection = global.mongoose || { conn: null, promise: null };

console.log("MongoDB URI (prefix only):", 
  process.env.MONGODB_URI ? 
  process.env.MONGODB_URI.substring(0, 15) + "..." : 
  "undefined");

// If we're in a fresh environment, initialize the global
if (!global.mongoose) {
  global.mongoose = cached;
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts)
      .then((mongoose) => {
        console.log('MongoDB connected successfully');
        return mongoose;
      })
      .catch((error) => {
        console.error('MongoDB connection error:', error);
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}