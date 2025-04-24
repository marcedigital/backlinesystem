// src/app/api/admin/coupons/check-expired/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Coupon } from '@/models';
import { connectToDatabase } from '@/utils/database';
import { verifyAdminAuth } from '@/utils/adminAuth';
import { withErrorHandling } from '@/utils/apiMiddleware';
import { logToConsole } from '@/utils/logger';

// API route that will check and deactivate expired coupons
// This can be run as a scheduled task using a cron job
async function handleCheckExpiredCoupons(req: NextRequest) {
  try {
    // Only admins can trigger this manually, but it could also be triggered by a scheduled task
    const isAdmin = await verifyAdminAuth(req);
    if (!isAdmin) {
      // For scheduled tasks, check for API key
      const apiKey = req.headers.get('x-api-key');
      const validApiKey = process.env.ADMIN_API_KEY;
      
      if (!apiKey || apiKey !== validApiKey) {
        return NextResponse.json(
          { message: 'Unauthorized access' },
          { status: 401 }
        );
      }
    }

    // Connect to database
    await connectToDatabase();
    
    const now = new Date();
    
    // Find active time-limited coupons that have expired
    const expiredCoupons = await Coupon.find({
      active: true,
      couponType: 'time-limited',
      endDate: { $lt: now }
    });
    
    if (expiredCoupons.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired coupons found',
        deactivatedCount: 0
      });
    }
    
    // Deactivate all expired coupons
    const deactivatePromises = expiredCoupons.map(async (coupon) => {
      coupon.active = false;
      await coupon.save();
      return coupon.code;
    });
    
    const deactivatedCodes = await Promise.all(deactivatePromises);
    
    logToConsole('info', `Deactivated ${deactivatedCodes.length} expired coupons: ${deactivatedCodes.join(', ')}`);
    
    return NextResponse.json({
      success: true,
      message: `Deactivated ${deactivatedCodes.length} expired coupons`,
      deactivatedCount: deactivatedCodes.length,
      deactivatedCodes
    });
  } catch (error) {
    logToConsole('error', 'Error checking expired coupons:', error);
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
export const GET = withErrorHandling(handleCheckExpiredCoupons);