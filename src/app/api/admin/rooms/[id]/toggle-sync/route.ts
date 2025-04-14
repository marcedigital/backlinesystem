// src/app/api/admin/rooms/[id]/toggle-sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Room } from '@/models';
import { connectToDatabase } from '@/utils/database';
import { verifyAdminAuth } from '@/utils/adminAuth';
import { withErrorHandling } from '@/utils/apiMiddleware';
import { logToConsole } from '@/utils/logger';
import { createAdminCalendarService } from '@/utils/googleCalendar';

// Toggle room calendar sync
async function handleToggleRoomSync(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Get room ID from params
    const { id } = context.params;
    
    logToConsole('info', `Toggling calendar sync for room ${id}`);
    
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
    
    // Find room by ID
    const room = await Room.findOne({ id });
    
    if (!room) {
      logToConsole('warn', `Room not found with ID: ${id}`);
      return NextResponse.json(
        { message: 'Room not found' },
        { status: 404 }
      );
    }
    
    // If enabling sync, check if we can access the calendar
    if (!room.googleCalendarSyncEnabled) {
      try {
        logToConsole('info', `Verifying Google Calendar access for room ${id}`);
        
        // Test the calendar service by initializing it
        const calendarService = await createAdminCalendarService();
        
        // Try to access the calendar
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        await calendarService.getEvents(id, today, tomorrow);
        
        logToConsole('info', `Google Calendar access verified for room ${id}`);
      } catch (error) {
        logToConsole('error', `Cannot access Google Calendar for room ${id}:`, error);
        return NextResponse.json({
          success: false,
          message: 'Cannot access Google Calendar. Please verify service account credentials.',
          error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 400 });
      }
    }
    
    // Toggle sync enabled status
    room.googleCalendarSyncEnabled = !room.googleCalendarSyncEnabled;
    
    // If enabling sync, update last sync time
    if (room.googleCalendarSyncEnabled) {
      room.lastSyncTime = new Date();
    }
    
    await room.save();
    
    logToConsole('info', `Calendar sync ${room.googleCalendarSyncEnabled ? 'enabled' : 'disabled'} for room ${id}`);
    
    return NextResponse.json({
      success: true,
      id: room.id,
      googleCalendarSyncEnabled: room.googleCalendarSyncEnabled,
      lastSyncTime: room.lastSyncTime,
      message: `Calendar sync ${room.googleCalendarSyncEnabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    logToConsole('error', `Error toggling room sync for ID ${context.params.id}:`, error);
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

// Apply error handling to our handler
export const PATCH = withErrorHandling(handleToggleRoomSync);