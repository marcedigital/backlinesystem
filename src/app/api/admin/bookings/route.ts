// src/app/api/admin/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Booking } from '@/models';
import { connectToDatabase } from '@/utils/database';
import { verifyAdminAuth } from '@/utils/adminAuth';
import { withErrorHandling } from '@/utils/apiMiddleware';
import { logToConsole } from '@/utils/logger';

// Get all bookings for admin (with filtering options)
async function handleGetAdminBookings(req: NextRequest) {
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
    
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const roomId = searchParams.get('roomId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const email = searchParams.get('email');
    const clientName = searchParams.get('clientName');
    
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
    
    if (clientName) {
      query.clientName = { $regex: clientName, $options: 'i' };
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
    logToConsole('info', `Fetching admin bookings with query:`, query);
    
    try {
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
    } catch (dbError) {
      logToConsole('error', 'Database error when fetching bookings:', dbError);
      throw new Error(`Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
    }
  } catch (error) {
    logToConsole('error', 'Error getting admin bookings:', error);
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

// Update a booking (admin only)
async function handleUpdateBooking(req: NextRequest) {
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
    
    // Get booking data from request body
    const data = await req.json();
    
    // Validate required fields
    if (!data.id) {
      return NextResponse.json(
        { message: 'Booking ID is required' },
        { status: 400 }
      );
    }
    
    // Find the booking
    const booking = await Booking.findById(data.id);
    
    if (!booking) {
      return NextResponse.json(
        { message: 'Booking not found' },
        { status: 404 }
      );
    }
    
    // Update booking fields
    if (data.status) booking.status = data.status;
    if (data.clientName) booking.clientName = data.clientName;
    if (data.email) booking.email = data.email;
    if (data.phoneNumber) booking.phoneNumber = data.phoneNumber;
    
    // Only allow changing dates/times if not updating to past
    if (data.startTime && data.endTime) {
      const newStartTime = new Date(data.startTime);
      const newEndTime = new Date(data.endTime);
      
      // Make sure end time is after start time
      if (newStartTime >= newEndTime) {
        return NextResponse.json(
          { message: 'End time must be after start time' },
          { status: 400 }
        );
      }
      
      // Update times
      booking.startTime = newStartTime;
      booking.endTime = newEndTime;
      
      // Recalculate duration
      const durationMs = newEndTime.getTime() - newStartTime.getTime();
      booking.duration = Math.ceil(durationMs / (1000 * 60 * 60)); // Duration in hours, rounded up
    }
    
    // Save updated booking
    await booking.save();
    
    return NextResponse.json({
      success: true,
      message: 'Booking updated successfully',
      booking
    });
  } catch (error) {
    logToConsole('error', 'Error updating booking:', error);
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
export const GET = withErrorHandling(handleGetAdminBookings);
export const PATCH = withErrorHandling(handleUpdateBooking);