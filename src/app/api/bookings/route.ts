// src/app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Booking, Room } from '@/models';
import { connectToDatabase } from '@/utils/database';
import { GoogleCalendarService } from '@/utils/googleCalendar';
import { withErrorHandling } from '@/utils/apiMiddleware';
import { logToConsole } from '@/utils/logger';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Create a new booking
async function handleCreateBooking(req: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Get booking data from request body
    const data = await req.json();
    
    // Validate required fields
    if (!data.clientName || !data.email || !data.roomId || !data.startTime || !data.endTime) {
      return NextResponse.json(
        { message: 'Missing required booking information' },
        { status: 400 }
      );
    }
    
    // Check if room exists and is active
    const room = await Room.findOne({ id: data.roomId, isActive: true });
    if (!room) {
      return NextResponse.json(
        { message: 'Selected room does not exist or is not available' },
        { status: 400 }
      );
    }
    
    // Convert date strings to Date objects
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);
    
    // Check if start time is before end time
    if (startTime >= endTime) {
      return NextResponse.json(
        { message: 'End time must be after start time' },
        { status: 400 }
      );
    }
    
    // Check for overlapping bookings
    const overlappingBooking = await Booking.findOne({
      roomId: data.roomId,
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        { startTime: { $lt: endTime, $gte: startTime } },
        { endTime: { $gt: startTime, $lte: endTime } },
        { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
      ]
    });
    
    if (overlappingBooking) {
      return NextResponse.json(
        { message: 'This time slot is already booked' },
        { status: 409 }
      );
    }
    
    // Try to get the user ID from session
    let userId = null;
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        userId = session.user.id;
      }
    } catch (sessionError) {
      logToConsole('error', 'Error getting user session:', sessionError);
      // Continue without user ID
    }
    
    // Create the booking
    const booking = new Booking({
      clientName: data.clientName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      roomId: data.roomId,
      startTime,
      endTime,
      addOns: data.addOns || [],
      totalPrice: data.totalPrice,
      status: 'pending',
      paymentProof: data.paymentProof,
      couponCode: data.couponCode,
      discountAmount: data.discountAmount || 0,
      userId: userId
    });
    
    // Save booking to database
    await booking.save();
    
    // If Google Calendar sync is enabled for this room, create calendar event
    if (room.googleCalendarSyncEnabled) {
      try {
        // This would be replaced with the actual user's token in production
        // For now, we'll use a placeholder/mock token for demonstration
        const accessToken = 'mock-token';
        const calendarService = new GoogleCalendarService(accessToken);
        
        const result = await calendarService.createEvent(room.id, booking);
        
        if (result.success) {
          booking.googleCalendarEventId = result.eventId;
          await booking.save();
        }
      } catch (calendarError) {
        logToConsole('error', 'Error creating calendar event:', calendarError);
        // Continue without Google Calendar event
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Booking created successfully',
      booking: {
        id: booking._id,
        clientName: booking.clientName,
        email: booking.email,
        roomId: booking.roomId,
        startTime: booking.startTime,
        endTime: booking.endTime,
        totalPrice: booking.totalPrice,
        status: booking.status
      }
    }, { status: 201 });
  } catch (error) {
    logToConsole('error', 'Error creating booking:', error);
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
export const POST = withErrorHandling(handleCreateBooking);