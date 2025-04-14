// src/scripts/check-google-calendar.ts
/**
 * Utility script to verify Google Calendar service account connection
 * Run with: npm run ts-node src/scripts/check-google-calendar.ts
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

import { createAdminCalendarService } from '../utils/googleCalendar';
import { logToConsole } from '../utils/logger';

async function checkGoogleCalendarConnection() {
  console.log('🔍 Google Calendar Connection Test 🔍');
  console.log('--------------------------------------');
  
  // Check environment variables
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  
  console.log('Environment Variables Check:');
  console.log(`- GOOGLE_SERVICE_ACCOUNT_EMAIL: ${serviceAccountEmail ? '✅ Set' : '❌ Missing'}`);
  console.log(`- GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: ${privateKey ? '✅ Set' : '❌ Missing'}`);
  
  if (!serviceAccountEmail || !privateKey) {
    console.error('\n❌ Error: Missing required environment variables.');
    console.log('\nPlease set the following variables in your .env.local file:');
    console.log('- GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com');
    console.log('- GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
    return;
  }
  
  console.log('\nAttempting to initialize Google Calendar service...');
  
  try {
    // Create calendar service
    const calendarService = await createAdminCalendarService();
    console.log('✅ Successfully initialized Google Calendar service.');
    
    // Test connection by listing events for each room
    const roomIds = ['room1', 'room2'];
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    console.log('\nTesting calendar access for each room:');
    
    for (const roomId of roomIds) {
      try {
        console.log(`\nRoom ID: ${roomId}`);
        console.log(`- Fetching events from ${today.toISOString().split('T')[0]} to ${nextWeek.toISOString().split('T')[0]}`);
        
        const events = await calendarService.getEvents(roomId, today, nextWeek);
        
        console.log(`✅ Successfully accessed calendar for ${roomId}`);
        console.log(`- Found ${events.length} events`);
        
        // List event summaries if any exist
        if (events.length > 0) {
          console.log('- Event summaries:');
          events.slice(0, 5).forEach((event, i) => {
            const start = event.start?.dateTime || event.start?.date || 'unknown';
            console.log(`  ${i+1}. "${event.summary || 'No title'}" (${start})`);
          });
          
          if (events.length > 5) {
            console.log(`  ... and ${events.length - 5} more events`);
          }
        }
      } catch (error) {
        console.error(`❌ Error accessing calendar for ${roomId}:`, error);
      }
    }
    
    console.log('\n✅ Google Calendar connection test completed.');
  } catch (error) {
    console.error('\n❌ Failed to initialize Google Calendar service:');
    console.error(error);
    
    // Provide troubleshooting guidance
    console.log('\nTroubleshooting tips:');
    console.log('1. Verify that your service account has access to the calendars');
    console.log('2. Check that the private key is formatted correctly with line breaks (\\n)');
    console.log('3. Ensure the service account has the Calendar API enabled');
    console.log('4. Make sure the calendar IDs in googleCalendar.ts are correct');
  }
}

// Run the check
checkGoogleCalendarConnection().catch(console.error);