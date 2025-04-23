import { NextRequest, NextResponse } from 'next/server';
import { Booking, CustomerUser } from '@/models';
import { connectToDatabase } from '@/utils/database';
import { verifyAdminAuth } from '@/utils/adminAuth';
import { withErrorHandling } from '@/utils/apiMiddleware';
import { logToConsole } from '@/utils/logger';

// Get dashboard metrics
async function handleGetDashboardMetrics(req: NextRequest) {
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
    
    // Get today's date and set to midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get yesterday's date
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Get current month start and previous month start
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Get current week start (last Sunday)
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay());
    
    // Get last week start
    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(currentWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
    
    // Statistics calculations
    
    // 1. Today's bookings
    const todayBookings = await Booking.countDocuments({
      startTime: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
      status: { $in: ['Aprobada', 'Completa'] }
    });
    
    // Yesterday's bookings for comparison
    const yesterdayBookings = await Booking.countDocuments({
      startTime: { $gte: yesterday, $lt: today },
      status: { $in: ['Aprobada', 'Completa'] }
    });
    
    // 2. Monthly revenue
    const currentMonthBookings = await Booking.find({
      startTime: { $gte: currentMonthStart, $lte: currentMonthEnd },
      status: { $in: ['Aprobada', 'Completa'] }
    });
    
    const monthlyRevenue = currentMonthBookings.reduce((total, booking) => total + booking.totalPrice, 0);
    
    // Previous month revenue for comparison
    const previousMonthBookings = await Booking.find({
      startTime: { $gte: previousMonthStart, $lt: currentMonthStart },
      status: { $in: ['Aprobada', 'Completa'] }
    });
    
    const previousMonthRevenue = previousMonthBookings.reduce((total, booking) => total + booking.totalPrice, 0);
    
    // 3. Total hours booked this week
    const currentWeekBookings = await Booking.find({
      startTime: { $gte: currentWeekStart, $lt: today },
      status: { $in: ['Aprobada', 'Completa'] }
    });
    
    const totalHours = currentWeekBookings.reduce((total, booking) => total + booking.duration, 0);
    
    // Last week's hours for comparison
    const lastWeekBookings = await Booking.find({
      startTime: { $gte: lastWeekStart, $lt: lastWeekEnd },
      status: { $in: ['Aprobada', 'Completa'] }
    });
    
    const lastWeekHours = lastWeekBookings.reduce((total, booking) => total + booking.duration, 0);
    
    // 4. New customers this month
    const newCustomers = await CustomerUser.countDocuments({
      createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd }
    });
    
    // Last month's new customers for comparison
    const lastMonthNewCustomers = await CustomerUser.countDocuments({
      createdAt: { $gte: previousMonthStart, $lt: currentMonthStart }
    });
    
    // Calculate percentage changes
    const calculatePercentChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };
    
    const percentChanges = {
      todayBookings: calculatePercentChange(todayBookings, yesterdayBookings),
      monthlyRevenue: calculatePercentChange(monthlyRevenue, previousMonthRevenue),
      totalHours: calculatePercentChange(totalHours, lastWeekHours),
      newCustomers: calculatePercentChange(newCustomers, lastMonthNewCustomers)
    };
    
    // Return the metrics
    return NextResponse.json({
      todayBookings,
      monthlyRevenue,
      totalHours,
      newCustomers,
      percentChange: percentChanges
    });
  } catch (error) {
    logToConsole('error', 'Error getting dashboard metrics:', error);
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
export const GET = withErrorHandling(handleGetDashboardMetrics);