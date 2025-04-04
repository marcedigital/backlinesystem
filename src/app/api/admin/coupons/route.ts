// src/app/api/admin/coupons/route.ts - Updated with improved error handling
import { NextRequest, NextResponse } from 'next/server';
import { Coupon } from '@/models';
import { connectToDatabase } from '@/utils/database';
import { verifyAdminAuth } from '@/utils/adminAuth';
import { withErrorHandling, withDbRetry } from '@/utils/apiMiddleware';
import { logToConsole } from '@/utils/logger';

// GET all coupons with improved error handling
async function handleGetCoupons(req: NextRequest) {
  try {
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
    });
    
    // Get coupons with pagination
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    
    // Use withDbRetry for the database query
    const coupons = await withDbRetry(async () => {
      return Coupon.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    });
    
    const total = await withDbRetry(async () => {
      return Coupon.countDocuments({});
    });
    
    return NextResponse.json({
      coupons,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logToConsole('error', 'Error fetching coupons:', error);
    return NextResponse.json(
      { 
        message: error instanceof Error ? error.message : 'Server error',
        error: error instanceof Error ? error.stack : null
      }, 
      { status: 500 }
    );
  }
}

// CREATE a new coupon with improved error handling
async function handleCreateCoupon(req: NextRequest) {
  try {
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
    });
    
    // Get coupon data from request body
    const data = await req.json();
    
    // Validate required fields
    if (!data.code || data.value === undefined || !data.discountType || !data.couponType) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate coupon type specific fields
    if (data.couponType === 'time-limited' && (!data.startDate || !data.endDate)) {
      return NextResponse.json(
        { message: 'Time-limited coupons require startDate and endDate' },
        { status: 400 }
      );
    }
    
    // Check if coupon code already exists
    const existingCoupon = await withDbRetry(async () => {
      return Coupon.findOne({ code: data.code.toUpperCase() });
    });
    
    if (existingCoupon) {
      return NextResponse.json(
        { message: 'Coupon code already exists' },
        { status: 400 }
      );
    }
    
    // Create new coupon
    const newCoupon = new Coupon({
      code: data.code.toUpperCase(),
      discountType: data.discountType,
      value: data.value,
      couponType: data.couponType,
      startDate: data.startDate,
      endDate: data.endDate,
      active: data.active !== undefined ? data.active : true
    });
    
    await withDbRetry(async () => {
      await newCoupon.save();
    });
    
    return NextResponse.json(newCoupon, { status: 201 });
  } catch (error) {
    logToConsole('error', 'Error creating coupon:', error);
    return NextResponse.json(
      { 
        message: error instanceof Error ? error.message : 'Server error',
        error: error instanceof Error ? error.stack : null
      }, 
      { status: 500 }
    );
  }
}

// Apply the error handling middleware to our handlers
export const GET = withErrorHandling(handleGetCoupons, 50000);
export const POST = withErrorHandling(handleCreateCoupon, 50000);