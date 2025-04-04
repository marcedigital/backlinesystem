import { NextRequest, NextResponse } from 'next/server';
import { Coupon } from '@/models';
import { connectToDatabase } from '@/utils/database';
import { verifyAdminAuth } from '@/utils/adminAuth';

// GET all coupons
export async function GET(req: NextRequest) {
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
    
    // Get coupons with pagination
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    
    const coupons = await Coupon.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Coupon.countDocuments({});
    
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
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { 
        message: error instanceof Error ? error.message : 'Server error',
        error: error instanceof Error ? error.stack : null
      }, 
      { status: 500 }
    );
  }
}

// CREATE a new coupon
export async function POST(req: NextRequest) {
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
    const existingCoupon = await Coupon.findOne({ code: data.code.toUpperCase() });
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
    
    await newCoupon.save();
    
    return NextResponse.json(newCoupon, { status: 201 });
  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json(
      { 
        message: error instanceof Error ? error.message : 'Server error',
        error: error instanceof Error ? error.stack : null
      }, 
      { status: 500 }
    );
  }
}