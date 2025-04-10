// src/utils/googleCalendar.ts
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { logToConsole } from './logger';

// Calendar IDs for each room
const CALENDAR_IDS: {[key: string]: string} = {
  'room1': '0300d6d6eb5334024dad813d7a111841f5d5a504311ca64091eee55f8241c72b@group.calendar.google.com',
  'room2': 'b603cdcf972a68f8fb6254ae3a9918c2aca89987cb03d5a41eae32b6f25d180c@group.calendar.google.com'
};

// Scopes required for calendar operations
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;

  constructor(accessToken: string) {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL + '/api/auth/callback/google'
    );

    this.oauth2Client.setCredentials({
      access_token: accessToken
    });
  }

  // Get calendar ID for a specific room
  getCalendarId(roomId: string): string {
    return CALENDAR_IDS[roomId] || '';
  }

  // Create a calendar event for a booking
  async createEvent(roomId: string, booking: any) {
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
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
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
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
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
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
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      const calendarId = this.getCalendarId(roomId);
      
      if (!calendarId) {
        throw new Error(`No calendar ID found for room: ${roomId}`);
      }

      const response = await calendar.events.list({
        calendarId,
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

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
      logToConsole('error', 'Error fetching calendar events:', error);
      throw error;
    }
  }
}

// Create a service with admin/server credentials for syncing
export async function createAdminCalendarService() {
  // Implement token refresh or server-side auth here
  try {
    // This is a placeholder for server-side auth
    const adminAuth = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    
    // In a real implementation, get or refresh token here
    const tokenResponse = await adminAuth.getAccessToken();
    const accessToken = tokenResponse.token || '';
    
    return new GoogleCalendarService(accessToken);
  } catch (error) {
    logToConsole('error', 'Error creating admin calendar service:', error);
    throw error;
  }
}