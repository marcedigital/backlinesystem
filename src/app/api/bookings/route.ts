// src/app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Booking, Room } from '@/models';
import { connectToDatabase } from '@/utils/database';
import { createAdminCalendarService } from '@/utils/googleCalendar';
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
    
    logToConsole('info', 'Creating new booking with data:', {
      clientName: data.clientName,
      email: data.email,
      roomId: data.roomId,
      startTime: data.startTime,
      endTime: data.endTime
    });
    
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
        logToConsole('info', `User ID found in session: ${userId}`);
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
    logToConsole('info', `Booking created with ID: ${booking._id}`);
    
    // If Google Calendar sync is enabled for this room, create calendar event
    if (room.googleCalendarSyncEnabled) {
      try {
        logToConsole('info', `Creating Google Calendar event for room ${room.id}`);
        
        // Use the admin calendar service with service account
        const calendarService = await createAdminCalendarService();
        
        const result = await calendarService.createEvent(room.id, booking);
        
        if (result.success) {
          booking.googleCalendarEventId = result.eventId;
          await booking.save();
          logToConsole('info', `Google Calendar event created with ID: ${result.eventId}`);
        }
      } catch (calendarError) {
        logToConsole('error', 'Error creating calendar event:', calendarError);
        // Continue without Google Calendar event - we can sync it later
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

// Get bookings (with filtering options)
async function handleGetBookings(req: NextRequest) {
  try {
    // Verify authentication (optional, depends on your requirements)
    // const isAuthenticated = await verifyAuth(req);
    // if (!isAuthenticated) {
    //   return NextResponse.json(
    //     { message: 'Unauthorized access' },
    //     { status: 401 }
    //   );
    // }

    // Connect to database
    await connectToDatabase();
    
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const roomId = searchParams.get('roomId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const email = searchParams.get('email');
    
    // Build query
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (roomId) {
      query.roomId = roomId;
    }
    
    if (email) {
      query.email = { $regex: email, $options: 'i' };
    }
    
    if (dateFrom || dateTo) {
      query.startTime = {};
      
      if (dateFrom) {
        query.startTime.$gte = new Date(dateFrom);
      }
      
      if (dateTo) {
        query.startTime.$lte = new Date(dateTo);
      }
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get bookings
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Booking.countDocuments(query);
    
    return NextResponse.json({
      bookings,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logToConsole('error', 'Error getting bookings:', error);
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

// Apply error handling to our handlers
export const POST = withErrorHandling(handleCreateBooking);
export const GET = withErrorHandling(handleGetBookings);