// src/app/api/admin/rooms/[id]/toggle-sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Room } from '@/models';
import { connectToDatabase } from '@/utils/database';
import { verifyAdminAuth } from '@/utils/adminAuth';
import { withErrorHandling } from '@/utils/apiMiddleware';
import { logToConsole } from '@/utils/logger';

// Toggle room calendar sync
async function handleToggleRoomSync(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Get room ID from params
    const { id } = context.params;
    
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
      return NextResponse.json(
        { message: 'Room not found' },
        { status: 404 }
      );
    }
    
    // Toggle sync enabled status
    room.googleCalendarSyncEnabled = !room.googleCalendarSyncEnabled;
    
    // If enabling sync, update last sync time
    if (room.googleCalendarSyncEnabled) {
      room.lastSyncTime = new Date();
    }
    
    await room.save();
    
    return NextResponse.json({
      id: room.id,
      googleCalendarSyncEnabled: room.googleCalendarSyncEnabled,
      lastSyncTime: room.lastSyncTime,
      message: `Calendar sync ${room.googleCalendarSyncEnabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    logToConsole('error', `Error toggling room sync for ID ${context.params.id}:`, error);
    return NextResponse.json(
      { 
        message: error instanceof Error ? error.message : 'Server error',
        error: error instanceof Error ? error.stack : null 
      }, 
      { status: 500 }
    );
  }
}

// Apply error handling to our handler
export const PATCH = withErrorHandling(handleToggleRoomSync);