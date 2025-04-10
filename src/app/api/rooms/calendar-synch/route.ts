// src/app/api/rooms/calendar-sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Room, Booking } from '@/models';
import { connectToDatabase } from '@/utils/database';
import { createAdminCalendarService } from '@/utils/googleCalendar';
import { verifyAdminAuth } from '@/utils/adminAuth';
import { withErrorHandling } from '@/utils/apiMiddleware';
import { logToConsole } from '@/utils/logger';

// Handler to sync room calendars with Google Calendar
async function handleCalendarSync(req: NextRequest) {
  try {
    // Verify admin authentication
    const isAdmin = await verifyAdminAuth(req);
    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectToDatabase();
    
    // Get rooms with enabled sync
    const rooms = await Room.find({ googleCalendarSyncEnabled: true });
    
    if (rooms.length === 0) {
      return NextResponse.json({
        message: 'No rooms found with Google Calendar sync enabled',
        syncedRooms: 0
      });
    }
    
    // Create admin calendar service
    const calendarService = await createAdminCalendarService();
    
    // Track sync results
    const syncResults = [];
    
    // Get the sync duration (7 days default)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    
    // Process each room
    for (const room of rooms) {
      try {
        // Update last sync time
        room.lastSyncTime = new Date();
        await room.save();
        
        // Fetch events from Google Calendar
        const events = await calendarService.getEvents(room.id, startDate, endDate);
        
        // Convert events to unavailable time blocks
        const blockedTimes = [];
        for (const event of events) {
          const startDateTime = event.start?.dateTime || event.start?.date;
          const endDateTime = event.end?.dateTime || event.end?.date;
          
          if (!startDateTime || !endDateTime) {
            continue; // Skip this event if it doesn't have valid start/end times
          }
          
          blockedTimes.push({
            start: new Date(startDateTime),
            end: new Date(endDateTime),
            eventId: event.id,
            summary: event.summary
          });
        }
        
        // Find existing bookings for this room in the same date range
        const bookings = await Booking.find({
          roomId: room.id,
          startTime: { $gte: startDate },
          endTime: { $lte: endDate },
          status: { $in: ['confirmed', 'pending'] }
        });
        
        // For any booking without a Google Calendar event, create one
        let bookingsUpdated = 0;
        for (const booking of bookings) {
          if (!booking.googleCalendarEventId) {
            try {
              const result = await calendarService.createEvent(room.id, booking);
              
              if (result.success) {
                booking.googleCalendarEventId = result.eventId;
                await booking.save();
                bookingsUpdated++;
              }
            } catch (error) {
              logToConsole('error', `Failed to create calendar event for booking ${booking._id}:`, error);
            }
          }
        }
        
        syncResults.push({
          roomId: room.id,
          roomName: room.name,
          eventsFound: events.length,
          bookingsUpdated,
          success: true
        });
      } catch (roomError) {
        logToConsole('error', `Error syncing room ${room.id}:`, roomError);
        syncResults.push({
          roomId: room.id,
          roomName: room.name,
          success: false,
          error: roomError instanceof Error ? roomError.message : 'Unknown error'
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Calendar sync completed',
      syncedRooms: rooms.length,
      results: syncResults
    });
  } catch (error) {
    logToConsole('error', 'Calendar sync error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Server error',
        error: error instanceof Error ? error.stack : null 
      }, 
      { status: 500 }
    );
  }
}

// Manual sync triggered by admin
export const POST = withErrorHandling(handleCalendarSync);