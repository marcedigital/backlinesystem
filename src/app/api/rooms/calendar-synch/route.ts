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

    logToConsole('info', 'Starting calendar synchronization process');

    // Connect to database
    await connectToDatabase();
    
    // Get rooms with enabled sync
    const rooms = await Room.find({ googleCalendarSyncEnabled: true });
    
    if (rooms.length === 0) {
      logToConsole('info', 'No rooms found with Google Calendar sync enabled');
      return NextResponse.json({
        success: true,
        message: 'No rooms found with Google Calendar sync enabled',
        syncedRooms: 0
      });
    }

    logToConsole('info', `Found ${rooms.length} rooms with sync enabled`);
    
    // Create admin calendar service
    let calendarService;
    try {
      calendarService = await createAdminCalendarService();
      logToConsole('info', 'Google Calendar service initialized successfully');
    } catch (error) {
      logToConsole('error', 'Failed to initialize Google Calendar service:', error);
      return NextResponse.json(
        { 
          success: false,
          message: 'Failed to initialize Google Calendar service',
          error: error instanceof Error ? error.message : 'Unknown error'
        }, 
        { status: 500 }
      );
    }
    
    // Track sync results
    const syncResults = [];
    
    // Get the sync duration (7 days default)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    
    // Process each room
    for (const room of rooms) {
      try {
        logToConsole('info', `Processing room: ${room.id} (${room.name})`);
        
        // Update last sync time
        room.lastSyncTime = new Date();
        await room.save();
        
        // Fetch events from Google Calendar
        logToConsole('info', `Fetching events for room ${room.id} from Google Calendar`);
        const events = await calendarService.getEvents(room.id, startDate, endDate);
        logToConsole('info', `Retrieved ${events.length} events from Google Calendar for room ${room.id}`);
        
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
        logToConsole('info', `Finding existing bookings for room ${room.id}`);
        const bookings = await Booking.find({
          roomId: room.id,
          startTime: { $gte: startDate },
          endTime: { $lte: endDate },
          status: { $in: ['confirmed', 'pending'] }
        });
        
        logToConsole('info', `Found ${bookings.length} bookings for room ${room.id}`);
        
        // For any booking without a Google Calendar event, create one
        let bookingsUpdated = 0;
        for (const booking of bookings) {
          if (!booking.googleCalendarEventId) {
            try {
              logToConsole('info', `Creating Google Calendar event for booking ${booking._id}`);
              const result = await calendarService.createEvent(room.id, booking);
              
              if (result.success) {
                booking.googleCalendarEventId = result.eventId;
                await booking.save();
                bookingsUpdated++;
                logToConsole('info', `Created Google Calendar event for booking ${booking._id}`);
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
        
        logToConsole('info', `Completed sync for room ${room.id}: found ${events.length} events, updated ${bookingsUpdated} bookings`);
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
    
    const successCount = syncResults.filter(result => result.success).length;
    logToConsole('info', `Calendar sync completed: ${successCount}/${rooms.length} rooms synced successfully`);
    
    return NextResponse.json({
      success: true,
      message: 'Calendar sync completed',
      syncedRooms: successCount,
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