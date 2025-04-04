// src/app/api/admin/coupons/toggle/[id]/route.ts - Updated with improved error handling
import { NextRequest, NextResponse } from 'next/server';
import { Coupon } from '@/models';
import { connectToDatabase } from '@/utils/database';
import { verifyAdminAuth } from '@/utils/adminAuth';
import { withErrorHandling, withDbRetry } from '@/utils/apiMiddleware';
import { logToConsole } from '@/utils/logger';

// Toggle coupon active status with improved error handling
async function handleToggleCoupon(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Safely extract params
    const id = context.params.id;
    
    logToConsole('info', `Toggle coupon request for ID: ${id}`);
    
    // Verify admin authentication
    const isAdmin = await verifyAdminAuth(req);
    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Connect to database with retry logic
    await withDbRetry(async () => {
      await connectToDatabase();
    }, 5, 2000);
    
    // Find coupon by ID
    const coupon = await withDbRetry(async () => {
      return Coupon.findById(id);
    }, 3, 2000);
    
    if (!coupon) {
      return NextResponse.json(
        { message: 'Coupon not found' },
        { status: 404 }
      );
    }
    
    // Toggle active status
    coupon.active = !coupon.active;
    
    // Save with retry logic
    await withDbRetry(async () => {
      await coupon.save();
    }, 3, 2000);
    
    // Log success
    logToConsole('info', `Coupon ${id} toggled to ${coupon.active ? 'active' : 'inactive'}`);
    
    return NextResponse.json({
      id: coupon._id,
      active: coupon.active,
      message: `Coupon ${coupon.active ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    logToConsole('error', `Error toggling coupon with ID ${context.params.id}:`, error);
    return NextResponse.json(
      { 
        message: error instanceof Error ? error.message : 'Server error',
        error: error instanceof Error ? error.stack : null
      }, 
      { status: 500 }
    );
  }
}

// Apply the error handling middleware
export const PATCH = withErrorHandling(handleToggleCoupon, 50000);