// src/utils/googleCalendar.ts
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { logToConsole } from './logger';

// Calendar IDs for each room
const CALENDAR_IDS: {[key: string]: string} = {
  'room1': '0300d6d6eb5334024dad813d7a111841f5d5a504311ca64091eee55f8241c72b@group.calendar.google.com',
  'room2': 'b603cdcf972a68f8fb6254ae3a9918c2aca89987cb03d5a41eae32b6f25d180c@group.calendar.google.com'
};

// Scopes required for calendar operations
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

export class GoogleCalendarService {
  private auth: JWT | null = null;

  constructor(authClient: JWT) {
    this.auth = authClient;
  }

  // Get calendar ID for a specific room
  getCalendarId(roomId: string): string {
    return CALENDAR_IDS[roomId] || '';
  }

  // Create a calendar event for a booking
  async createEvent(roomId: string, booking: any) {
    try {
      if (!this.auth) {
        throw new Error('Authentication client not initialized');
      }

      const calendar = google.calendar({ version: 'v3', auth: this.auth });
      const calendarId = this.getCalendarId(roomId);
      
      if (!calendarId) {
        throw new Error(`No calendar ID found for room: ${roomId}`);
      }

      // Format booking data for Google Calendar
      const event = {
        summary: `Reserva - ${booking.clientName}`,
        description: `Reserva para ${booking.clientName}. Contacto: ${booking.email}.`,
        start: {
          dateTime: booking.startTime.toISOString(),
          timeZone: 'America/Costa_Rica',
        },
        end: {
          dateTime: booking.endTime.toISOString(),
          timeZone: 'America/Costa_Rica',
        },
        extendedProperties: {
          private: {
            bookingId: booking._id.toString(),
            clientEmail: booking.email,
          },
        },
      };

      const response = await calendar.events.insert({
        calendarId,
        requestBody: event,
      });

      return {
        success: true,
        eventId: response.data.id,
        htmlLink: response.data.htmlLink,
      };
    } catch (error) {
      logToConsole('error', 'Error creating calendar event:', error);
      throw error;
    }
  }

  // Update an existing calendar event
  async updateEvent(roomId: string, eventId: string, booking: any) {
    try {
      if (!this.auth) {
        throw new Error('Authentication client not initialized');
      }

      const calendar = google.calendar({ version: 'v3', auth: this.auth });
      const calendarId = this.getCalendarId(roomId);
      
      if (!calendarId) {
        throw new Error(`No calendar ID found for room: ${roomId}`);
      }

      // Get existing event
      const existingEvent = await calendar.events.get({
        calendarId,
        eventId,
      });

      // Update event details
      const updatedEvent = {
        ...existingEvent.data,
        summary: `Reserva - ${booking.clientName}`,
        description: `Reserva para ${booking.clientName}. Contacto: ${booking.email}.`,
        start: {
          dateTime: booking.startTime.toISOString(),
          timeZone: 'America/Costa_Rica',
        },
        end: {
          dateTime: booking.endTime.toISOString(),
          timeZone: 'America/Costa_Rica',
        },
      };

      const response = await calendar.events.update({
        calendarId,
        eventId,
        requestBody: updatedEvent,
      });

      return {
        success: true,
        eventId: response.data.id,
        htmlLink: response.data.htmlLink,
      };
    } catch (error) {
      logToConsole('error', 'Error updating calendar event:', error);
      throw error;
    }
  }

  // Delete a calendar event
  async deleteEvent(roomId: string, eventId: string) {
    try {
      if (!this.auth) {
        throw new Error('Authentication client not initialized');
      }

      const calendar = google.calendar({ version: 'v3', auth: this.auth });
      const calendarId = this.getCalendarId(roomId);
      
      if (!calendarId) {
        throw new Error(`No calendar ID found for room: ${roomId}`);
      }

      await calendar.events.delete({
        calendarId,
        eventId,
      });

      return { success: true };
    } catch (error) {
      logToConsole('error', 'Error deleting calendar event:', error);
      throw error;
    }
  }

  // Get events for a specific room and date range
  async getEvents(roomId: string, startDate: Date, endDate: Date) {
    try {
      if (!this.auth) {
        throw new Error('Authentication client not initialized');
      }

      const calendar = google.calendar({ version: 'v3', auth: this.auth });
      const calendarId = this.getCalendarId(roomId);
      
      if (!calendarId) {
        throw new Error(`No calendar ID found for room: ${roomId}`);
      }

      logToConsole('info', `Fetching events for room ${roomId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);

      const response = await calendar.events.list({
        calendarId,
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      logToConsole('info', `Found ${response.data.items?.length || 0} events for room ${roomId}`);

      // Process the events to ensure they have proper date fields
      const processedEvents = (response.data.items || []).map(event => {
        // Ensure start and end have valid dateTime or date values
        if (!event.start) event.start = { dateTime: startDate.toISOString() };
        if (!event.end) event.end = { dateTime: new Date(startDate.getTime() + 3600000).toISOString() };
        
        // Ensure dateTime exists (use date as fallback)
        if (!event.start.dateTime && event.start.date) 
          event.start.dateTime = new Date(event.start.date as string).toISOString();
        
        if (!event.end.dateTime && event.end.date)
          event.end.dateTime = new Date(event.end.date as string).toISOString();
          
        return event;
      });

      return processedEvents;
    } catch (error) {
      logToConsole('error', `Error fetching calendar events for room ${roomId}:`, error);
      throw error;
    }
  }
}

// Create a service with server-side credentials
export async function createAdminCalendarService() {
  try {
    // Check if necessary environment variables are available
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    if (!clientEmail || !privateKey) {
      logToConsole('error', 'Google service account credentials not found in environment variables', {
        clientEmail: clientEmail ? 'SET' : 'NOT SET',
        privateKey: privateKey ? 'SET (length: ' + privateKey.length + ')' : 'NOT SET'
      });
      throw new Error('Google service account credentials not properly configured');
    }

    // Create JWT client
    const jwtClient = new JWT({
      email: clientEmail,
      key: privateKey,
      scopes: SCOPES,
    });

    // Verify credentials by requesting an access token
    logToConsole('info', 'Initializing Google Calendar service with JWT client');
    await jwtClient.authorize();
    logToConsole('info', 'JWT client authorization successful');

    return new GoogleCalendarService(jwtClient);
  } catch (error) {
    logToConsole('error', 'Error creating admin calendar service:', error);
    throw error;
  }
}

// Create a service with user OAuth token for client-side operations
export function createUserCalendarService(accessToken: string) {
  try {
    // Create JWT client with access token
    const jwtClient = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: SCOPES,
      subject: accessToken // Impersonate the user
    });

    return new GoogleCalendarService(jwtClient);
  } catch (error) {
    logToConsole('error', 'Error creating user calendar service:', error);
    throw error;
  }
}