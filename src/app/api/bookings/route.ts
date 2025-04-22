// src/app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Booking, Room, CustomerUser } from '@/models';
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
    if (!data.roomId || !data.startTime || !data.endTime) {
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
    
    // Calculate duration
    const durationMs = endTime.getTime() - startTime.getTime();
    const duration = Math.ceil(durationMs / (1000 * 60 * 60)); // Duration in hours, rounded up
    
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
      status: { $in: ['Revisar', 'Aprobada'] },
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
    
    // Get the authenticated user from session
    const session = await getServerSession(authOptions);
    let userId = null;
    let customerInfo = {
      clientName: data.clientName || 'Guest',
      email: data.email || (session?.user?.email || 'guest@example.com'),
      phoneNumber: data.phoneNumber
    };
    
    // If a user is logged in, use their information and link to their account
    if (session?.user) {
      logToConsole('info', `User authenticated: ${session.user.email}`);
      
      // Try to find the customer in our database
      const customer = await CustomerUser.findOne({ email: session.user.email });
      
      if (customer) {
        // Use customer information from the database
        customerInfo = {
          clientName: `${customer.firstName} ${customer.lastName}`,
          email: customer.email,
          phoneNumber: customer.phoneNumber || data.phoneNumber
        };
        
        userId = customer._id;
        logToConsole('info', `Found customer in database: ${customerInfo.clientName} (${userId})`);
      } else if (session.user.name && session.user.email) {
        // Use info from OAuth provider if customer not in our DB yet
        customerInfo = {
          clientName: session.user.name,
          email: session.user.email,
          phoneNumber: data.phoneNumber
        };
        
        // For NextAuth.js users that might not be in our CustomerUser collection
        if (session.user.id) {
          userId = session.user.id;
          logToConsole('info', `Using NextAuth user ID: ${userId}`);
        }
      }
    } else {
      logToConsole('warn', 'No authenticated user found, creating booking as guest');
    }
    
    // Create the booking with user information
    const booking = new Booking({
      clientName: customerInfo.clientName,
      email: customerInfo.email,
      phoneNumber: customerInfo.phoneNumber,
      roomId: data.roomId,
      startTime,
      endTime,
      duration,
      addOns: data.addOns || [],
      totalPrice: data.totalPrice,
      status: 'Revisar',
      paymentProof: data.paymentProof,
      couponCode: data.couponCode,
      discountAmount: data.discountAmount || 0,
      userId: userId
    });
    
    // Save booking to database
    await booking.save();
    logToConsole('info', `Booking created with ID: ${booking._id} for user: ${customerInfo.clientName}`);
    
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
    
    // Check user authorization - get current user from session
    const session = await getServerSession(authOptions);
    let isAdmin = false;
    let userEmail = '';
    
    if (session?.user) {
      userEmail = session.user.email || '';
      
      // Check if user is an admin (you should implement this based on your auth system)
      // For example, admins might have a special role or be in a specific list
      // This is just a placeholder - replace with your actual admin check
      try {
        const adminUser = await CustomerUser.findOne({ 
          email: userEmail,
          role: 'admin' // Assuming you have a role field
        });
        
        isAdmin = !!adminUser;
      } catch (error) {
        logToConsole('error', 'Error checking admin status:', error);
      }
    }
    
    // Build query
    const query: any = {};
    
    // If not admin, limit to user's own bookings
    if (!isAdmin && userEmail) {
      query.email = userEmail;
    } else if (!isAdmin) {
      // If not admin and no session, return empty results
      // This prevents unauthorized access to all bookings
      return NextResponse.json({
        bookings: [],
        pagination: {
          total: 0,
          page,
          limit,
          pages: 0
        }
      });
    }
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Filter by room if provided
    if (roomId) {
      query.roomId = roomId;
    }
    
    // Filter by email if provided (for admins only)
    if (isAdmin && email) {
      query.email = { $regex: email, $options: 'i' };
    }
    
    // Filter by date range if provided
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