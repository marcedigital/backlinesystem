import { NextRequest, NextResponse } from 'next/server';
import { Room } from '@/models';
import { connectToDatabase } from '@/utils/database';
import { verifyAdminAuth } from '@/utils/adminAuth';
import { withErrorHandling } from '@/utils/apiMiddleware';
import { logToConsole } from '@/utils/logger';

// Get all rooms
async function handleGetRooms(req: NextRequest) {
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
    
    // Get all rooms
    const rooms = await Room.find().sort({ id: 1 });
    
    return NextResponse.json({ rooms });
  } catch (error) {
    logToConsole('error', 'Error fetching rooms:', error);
    return NextResponse.json(
      { 
        message: error instanceof Error ? error.message : 'Server error',
        error: error instanceof Error ? error.stack : null 
      }, 
      { status: 500 }
    );
  }
}

// Create or update a room
async function handleCreateUpdateRoom(req: NextRequest) {
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
    
    // Get room data from request body
    const data = await req.json();
    
    // Validate required fields
    if (!data.id || !data.name) {
      return NextResponse.json(
        { message: 'Room ID and name are required' },
        { status: 400 }
      );
    }
    
    // Check if room already exists
    let room = await Room.findOne({ id: data.id });
    let isNewRoom = false;
    
    if (room) {
      // Update existing room
      room.name = data.name;
      room.description = data.description;
      
      if (data.hourlyRate !== undefined) room.hourlyRate = data.hourlyRate;
      if (data.additionalHourRate !== undefined) room.additionalHourRate = data.additionalHourRate;
      if (data.isActive !== undefined) room.isActive = data.isActive;
      if (data.googleCalendarId) room.googleCalendarId = data.googleCalendarId;
      if (data.googleCalendarSyncEnabled !== undefined) room.googleCalendarSyncEnabled = data.googleCalendarSyncEnabled;
    } else {
      // Create new room
      isNewRoom = true;
      room = new Room({
        id: data.id,
        name: data.name,
        description: data.description,
        hourlyRate: data.hourlyRate || 10000,
        additionalHourRate: data.additionalHourRate || 5000,
        isActive: data.isActive !== undefined ? data.isActive : true,
        googleCalendarId: data.googleCalendarId,
        googleCalendarSyncEnabled: data.googleCalendarSyncEnabled !== undefined ? data.googleCalendarSyncEnabled : false
      });
    }
    
    await room.save();
    
    return NextResponse.json({
      room,
      message: isNewRoom ? 'Room created successfully' : 'Room updated successfully'
    }, { status: isNewRoom ? 201 : 200 });
  } catch (error) {
    logToConsole('error', 'Error creating/updating room:', error);
    return NextResponse.json(
      { 
        message: error instanceof Error ? error.message : 'Server error',
        error: error instanceof Error ? error.stack : null 
      }, 
      { status: 500 }
    );
  }
}

// Apply error handling to our handlers
export const GET = withErrorHandling(handleGetRooms);
export const POST = withErrorHandling(handleCreateUpdateRoom);