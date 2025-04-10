// src/app/api/rooms/availability/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Room, Booking } from '@/models';
import { connectToDatabase } from '@/utils/database';
import { createAdminCalendarService } from '@/utils/googleCalendar';
import { withErrorHandling } from '@/utils/apiMiddleware';
import { logToConsole } from '@/utils/logger';

// Get available slots for a specific date and room
async function handleGetAvailability(req: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const roomId = searchParams.get('roomId');
    
    // Validate input
    if (!date) {
      return NextResponse.json(
        { message: 'Date parameter is required' },
        { status: 400 }
      );
    }
    
    // Parse date
    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
      return NextResponse.json(
        { message: 'Invalid date format' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Get room(s)
    let rooms: any[] = [];
    if (roomId) {
      const room = await Room.findOne({ id: roomId, isActive: true });
      if (room) {
        rooms = [room];
      }
    } else {
      rooms = await Room.find({ isActive: true });
    }
    
    if (rooms.length === 0) {
      return NextResponse.json(
        { message: roomId ? 'Room not found or not active' : 'No active rooms found' },
        { status: 404 }
      );
    }
    
    // Set up date range for the selected date
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Get next day (for slots that continue past midnight)
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const startOfNextDay = new Date(nextDay);
    startOfNextDay.setHours(0, 0, 0, 0);
    
    const endOfNextDay = new Date(nextDay);
    endOfNextDay.setHours(6, 0, 0, 0); // Only until 6 AM
    
    // Process each room for availability
    const result: any = {};
    
    for (const room of rooms) {
      // Get existing bookings from the database
      const existingBookings = await Booking.find({
        roomId: room.id,
        status: { $in: ['pending', 'confirmed'] },
        $or: [
          { startTime: { $gte: startOfDay, $lt: endOfDay } },
          { endTime: { $gt: startOfDay, $lte: endOfDay } },
          { startTime: { $lt: startOfDay }, endTime: { $gt: endOfDay } }
        ]
      });
      
      // Get next day bookings
      const nextDayBookings = await Booking.find({
        roomId: room.id,
        status: { $in: ['pending', 'confirmed'] },
        $or: [
          { startTime: { $gte: startOfNextDay, $lt: endOfNextDay } },
          { endTime: { $gt: startOfNextDay, $lte: endOfNextDay } },
          { startTime: { $lt: startOfNextDay }, endTime: { $gt: endOfNextDay } }
        ]
      });
      
      // Initialize unavailable times from bookings
      let unavailableTimes: { start: Date; end: Date }[] = [
        ...existingBookings.map(booking => ({
          start: booking.startTime,
          end: booking.endTime
        })),
        ...nextDayBookings.map(booking => ({
          start: booking.startTime,
          end: booking.endTime
        }))
      ];
      
      // Check Google Calendar if sync is enabled
      if (room.googleCalendarSyncEnabled) {
        try {
          const calendarService = await createAdminCalendarService();
          
          // Get events for the current day
          const events = await calendarService.getEvents(room.id, startOfDay, endOfDay);
          
          // Get events for the next morning (up to 6 AM)
          const nextDayEvents = await calendarService.getEvents(room.id, startOfNextDay, endOfNextDay);
          
          // Add Google Calendar events to unavailable times
          const calendarUnavailableTimes: { start: Date; end: Date }[] = [];
          
          // Process current day events
          for (const event of events) {
            const startDateTime = event.start?.dateTime || event.start?.date;
            const endDateTime = event.end?.dateTime || event.end?.date;
            
            if (startDateTime && endDateTime) {
              calendarUnavailableTimes.push({
                start: new Date(startDateTime as string),
                end: new Date(endDateTime as string)
              });
            }
          }
          
          // Process next day events
          for (const event of nextDayEvents) {
            const startDateTime = event.start?.dateTime || event.start?.date;
            const endDateTime = event.end?.dateTime || event.end?.date;
            
            if (startDateTime && endDateTime) {
              calendarUnavailableTimes.push({
                start: new Date(startDateTime as string),
                end: new Date(endDateTime as string)
              });
            }
          }
          
          unavailableTimes = [...unavailableTimes, ...calendarUnavailableTimes];
        } catch (calendarError) {
          logToConsole('error', `Error fetching Google Calendar events for room ${room.id}:`, calendarError);
          // Continue with existing bookings if Google Calendar fetch fails
        }
      }
      
      // Generate available time slots
      const currentDaySlots = generateTimeSlots(startOfDay, 24, unavailableTimes);
      const nextDaySlots = generateTimeSlots(startOfNextDay, 6, unavailableTimes);
      
      result[room.id] = {
        currentDay: currentDaySlots,
        nextDay: nextDaySlots
      };
    }
    
    return NextResponse.json({
      date: selectedDate.toISOString(),
      nextDay: nextDay.toISOString(),
      availability: result
    });
  } catch (error) {
    logToConsole('error', 'Error getting availability:', error);
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

// Helper function to generate time slots
function generateTimeSlots(
  startDate: Date,
  hours: number,
  unavailableTimes: { start: Date; end: Date }[]
) {
  const slots = [];
  const slotDuration = 60; // minutes
  
  for (let hour = 0; hour < hours; hour++) {
    const slotStart = new Date(startDate);
    slotStart.setHours(slotStart.getHours() + hour);
    slotStart.setMinutes(0, 0, 0);
    
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);
    
    const isAvailable = !unavailableTimes.some(({ start, end }) => {
      return (slotStart < end && slotEnd > start);
    });
    
    slots.push({
      startTime: slotStart.toISOString(),
      endTime: slotEnd.toISOString(),
      isAvailable
    });
  }
  
  return slots;
}

// Apply error handling to our handler
export const GET = withErrorHandling(handleGetAvailability);