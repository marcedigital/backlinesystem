import { google } from 'googleapis';
import * as readline from 'readline';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Ensure these are set in your .env.local
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Scopes for Google Calendar access
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly'
];

async function generateRefreshToken() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env.local file');
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    'http://localhost:3000/api/google/callback' // Must match your authorized redirect URI
  );

  // Generate the URL for the authorization dialog
  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });

  console.log('Authorize this app by visiting this url:');
  console.log(authorizeUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Enter the code from that page here: ', async (code) => {
    rl.close();
    
    try {
      // Exchange authorization code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      
      console.log('\n🔑 Refresh Token:');
      console.log(tokens.refresh_token);
      console.log('\nAdd this to your .env.local file as GOOGLE_REFRESH_TOKEN');
      
      // Optional: Verify the token by making a calendar request
      oauth2Client.setCredentials(tokens);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      
      const response = await calendar.calendarList.list();
      console.log('\n📅 Your Google Calendars:');
      response.data.items?.forEach(calendar => {
        console.log(`- ${calendar.summary} (ID: ${calendar.id})`);
      });
    } catch (error) {
      console.error('Error getting tokens:', error);
    }
  });
}

// Run the token generation
generateRefreshToken().catch(console.error);