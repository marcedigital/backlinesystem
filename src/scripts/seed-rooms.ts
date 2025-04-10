import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Explicitly define the path to .env.local
const envPath = path.resolve(process.cwd(), '.env.local');

// Load environment variables with explicit configuration
dotenv.config({ 
  path: envPath,
  debug: true  // Add debug mode to get more information
});

import { connectToDatabase, disconnectFromDatabase } from '../utils/database';
import Room from '../models/room';
import mongoose from 'mongoose';

async function seedRooms() {
  try {
    console.log('🔍 Detailed MongoDB Connection Debugging 🔍');
    
    // Construct connection string manually to ensure proper formatting
    const baseUri = process.env.MONGODB_URI?.split('?')[0];
    const dbName = process.env.MONGODB_DBNAME;

    if (!baseUri) {
      throw new Error('MONGODB_URI is not set correctly');
    }

    // Construct connection string with explicit parameters
    const connectionString = `${baseUri}/${dbName}?retryWrites=true&w=majority`;
    
    console.log('Constructed Connection String:', connectionString.replace(/:[^:]*@/, ':****@'));

    // Manually create connection to get more detailed error information
    try {
      console.log('Attempting direct mongoose connection...');
      await mongoose.connect(connectionString, {
        connectTimeoutMS: 10000,
        socketTimeoutMS: 10000
      });
      console.log('✅ Direct mongoose connection successful');
    } catch (directConnectError) {
      console.error('❌ Direct mongoose connection failed:', directConnectError);
      throw directConnectError;
    }

    console.log('Connecting via utility...');
    await connectToDatabase();
    
    const existingRooms = await Room.find();
    
    if (existingRooms.length === 0) {
      console.log('No existing rooms found. Creating default rooms...');
      
      const roomsToCreate = [
        {
          id: 'room1',
          name: 'Sala 1',
          description: 'Sala de ensayos principal',
          hourlyRate: 10000,
          additionalHourRate: 5000,
          isActive: true,
          googleCalendarId: '0300d6d6eb5334024dad813d7a111841f5d5a504311ca64091eee55f8241c72b@group.calendar.google.com',
          googleCalendarSyncEnabled: false
        },
        {
          id: 'room2',
          name: 'Sala 2',
          description: 'Sala de ensayos secundaria',
          hourlyRate: 10000,
          additionalHourRate: 5000,
          isActive: true,
          googleCalendarId: 'b603cdcf972a68f8fb6254ae3a9918c2aca89987cb03d5a41eae32b6f25d180c@group.calendar.google.com',
          googleCalendarSyncEnabled: false
        }
      ];
      
      const createdRooms = await Room.insertMany(roomsToCreate);
      
      console.log('Default rooms created successfully:');
      createdRooms.forEach(room => {
        console.log(`- ${room.id}: ${room.name}`);
      });
    } else {
      console.log(`Found ${existingRooms.length} existing rooms:`);
      existingRooms.forEach(room => {
        console.log(`- ${room.id}: ${room.name} (CalendarID: ${room.googleCalendarId.substring(0, 10)}...)`);
      });
    }
  } catch (error) {
    console.error('🚨 Error seeding rooms:', error);
    process.exit(1);
  } finally {
    await disconnectFromDatabase();
    console.log('Database connection closed.');
  }
}

// Run the seed function
seedRooms().catch(console.error);