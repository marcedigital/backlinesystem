// src/scripts/create-test-booking.ts
/**
 * Utility script to create a test booking in the database
 * Run with: npm run ts-node src/scripts/create-test-booking.ts
 */

import * as dotenv from 'dotenv';
import path from 'path';

// Explicitly define the path to .env.local
const envPath = path.resolve(process.cwd(), '.env.local');

// Load environment variables with explicit configuration
dotenv.config({ 
  path: envPath,
  debug: true
});

import { connectToDatabase, disconnectFromDatabase } from '../utils/database';
import Booking from '../models/booking';
import { createAdminCalendarService } from '../utils/googleCalendar';

async function createTestBooking() {
  try {
    console.log('🔍 Creating Test Booking 🔍');
    console.log('--------------------------------------');
    
    // Connect to database
    await connectToDatabase();
    
    // Create a new booking
    const startTime = new Date();
    startTime.setHours(startTime.getHours() + 1); // 1 hour from now
    startTime.setMinutes(0, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 2); // 2 hours long
    
    const booking = new Booking({
      clientName: 'Cliente de Prueba',
      email: 'test@example.com',
      phoneNumber: '+50688887777',
      roomId: 'room1',
      startTime,
      endTime,
      addOns: [
        {
          id: '1',
          name: 'Alquiler de Platillos',
          price: 2000
        }
      ],
      totalPrice: 17000, // 10000 first hour + 5000 second hour + 2000 addon
      status: 'Revisar',
      paymentProof: 'https://placehold.co/600x400',
      couponCode: 'TEST10',
      discountAmount: 1700
    });
    
    await booking.save();
    console.log('✅ Test booking created successfully!');
    console.log('Booking details:');
    console.log('- ID:', booking._id);
    console.log('- Client:', booking.clientName);
    console.log('- Room:', booking.roomId);
    console.log('- Start Time:', booking.startTime.toISOString());
    console.log('- End Time:', booking.endTime.toISOString());
    console.log('- Status:', booking.status);
    
    // Try to create a Google Calendar event
    try {
      console.log('\nAttempting to create Google Calendar event...');
      const calendarService = await createAdminCalendarService();
      const result = await calendarService.createEvent(booking.roomId, booking);
      
      if (result.success && result.eventId) {
        booking.googleCalendarEventId = result.eventId;
        await booking.save();
        console.log('✅ Google Calendar event created!');
        console.log('- Event ID:', result.eventId);
        console.log('- Event Link:', result.htmlLink);
      }
    } catch (calendarError) {
      console.error('\n❌ Failed to create Google Calendar event:', calendarError);
    }
    
  } catch (error) {
    console.error('\n❌ Error creating test booking:', error);
  } finally {
    await disconnectFromDatabase();
    console.log('\nDatabase connection closed.');
  }
}

// Run the script
createTestBooking().catch(console.error);