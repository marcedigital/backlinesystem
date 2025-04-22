// src/app/api/admin/bookings/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Booking, Room } from '@/models';
import { connectToDatabase } from '@/utils/database';
import { verifyAdminAuth } from '@/utils/adminAuth';
import { withErrorHandling } from '@/utils/apiMiddleware';
import { logToConsole } from '@/utils/logger';
import { createAdminCalendarService } from '@/utils/googleCalendar';

// Change booking status
async function handleChangeBookingStatus(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Get booking ID from params
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
    
    // Get booking data from request body
    const data = await req.json();
    
    // Validate status
    if (!data.status || !['Revisar', 'Aprobada', 'Cancelada', 'Completa'].includes(data.status)) {
      return NextResponse.json(
        { message: 'Invalid status value' },
        { status: 400 }
      );
    }
    
    // Find booking by ID
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return NextResponse.json(
        { message: 'Booking not found' },
        { status: 404 }
      );
    }
    
    // Get old status for comparison
    const oldStatus = booking.status;
    
    // Update status
    booking.status = data.status;
    await booking.save();
    
    // Find associated room for Google Calendar sync
    const room = await Room.findOne({ id: booking.roomId });
    if (!room || !room.googleCalendarSyncEnabled) {
      return NextResponse.json({
        success: true,
        message: `Booking status changed from ${oldStatus} to ${booking.status}`,
        booking
      });
    }
    
    // Handle Google Calendar updates if needed
    let calendarMessage = "";
    
    try {
      // Create calendar service
      const calendarService = await createAdminCalendarService();
      
      if (oldStatus !== 'Aprobada' && data.status === 'Aprobada') {
        // Status changed to Approved - create/update calendar event
        if (booking.googleCalendarEventId) {
          // Update existing event
          await calendarService.updateEvent(booking.roomId, booking.googleCalendarEventId, booking);
          calendarMessage = "Google Calendar event updated.";
        } else {
          // Create new event
          const result = await calendarService.createEvent(booking.roomId, booking);
          if (result.success) {
            booking.googleCalendarEventId = result.eventId;
            await booking.save();
            calendarMessage = "Google Calendar event created.";
          }
        }
      } else if (data.status === 'Cancelada' && booking.googleCalendarEventId) {
        // Status changed to Canceled - delete calendar event
        await calendarService.deleteEvent(booking.roomId, booking.googleCalendarEventId);
        booking.googleCalendarEventId = undefined;
        await booking.save();
        calendarMessage = "Google Calendar event deleted.";
      }
    } catch (calendarError) {
      logToConsole('error', 'Error updating Google Calendar:', calendarError);
      calendarMessage = "Failed to update Google Calendar. Please sync manually.";
    }
    
    return NextResponse.json({
      success: true,
      message: `Booking status changed from ${oldStatus} to ${booking.status}`,
      calendarMessage,
      booking
    });
  } catch (error) {
    logToConsole('error', `Error changing booking status for ID ${context.params.id}:`, error);
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
export const PATCH = withErrorHandling(handleChangeBookingStatus);