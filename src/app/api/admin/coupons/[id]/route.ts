import { NextRequest, NextResponse } from 'next/server';
import { Coupon } from '@/models';
import { connectToDatabase } from '@/utils/database';
import { verifyAdminAuth } from '@/utils/adminAuth';

// GET a single coupon by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Get coupon by ID
    const coupon = await Coupon.findById(params.id);
    if (!coupon) {
      return NextResponse.json(
        { message: 'Coupon not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(coupon);
  } catch (error) {
    console.error(`Error fetching coupon with ID ${params.id}:`, error);
    return NextResponse.json(
      { 
        message: error instanceof Error ? error.message : 'Server error',
        error: error instanceof Error ? error.stack : null
      }, 
      { status: 500 }
    );
  }
}

// UPDATE a coupon
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Find coupon by ID
    const coupon = await Coupon.findById(params.id);
    if (!coupon) {
      return NextResponse.json(
        { message: 'Coupon not found' },
        { status: 404 }
      );
    }
    
    // Check for unique code if it changed
    if (data.code && data.code !== coupon.code) {
      const existingCoupon = await Coupon.findOne({ code: data.code.toUpperCase() });
      if (existingCoupon && existingCoupon._id.toString() !== params.id) {
        return NextResponse.json(
          { message: 'Coupon code already exists' },
          { status: 400 }
        );
      }
    }
    
    // Update and validate
    if (data.code) coupon.code = data.code.toUpperCase();
    if (data.discountType) coupon.discountType = data.discountType;
    if (data.value !== undefined) coupon.value = data.value;
    if (data.couponType) coupon.couponType = data.couponType;
    if (data.startDate) coupon.startDate = new Date(data.startDate);
    if (data.endDate) coupon.endDate = new Date(data.endDate);
    if (data.active !== undefined) coupon.active = data.active;
    
    await coupon.save();
    
    return NextResponse.json(coupon);
  } catch (error) {
    console.error(`Error updating coupon with ID ${params.id}:`, error);
    return NextResponse.json(
      { 
        message: error instanceof Error ? error.message : 'Server error',
        error: error instanceof Error ? error.stack : null
      }, 
      { status: 500 }
    );
  }
}

// DELETE a coupon
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Find and delete coupon
    const coupon = await Coupon.findByIdAndDelete(params.id);
    if (!coupon) {
      return NextResponse.json(
        { message: 'Coupon not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error(`Error deleting coupon with ID ${params.id}:`, error);
    return NextResponse.json(
      { 
        message: error instanceof Error ? error.message : 'Server error',
        error: error instanceof Error ? error.stack : null
      }, 
      { status: 500 }
    );
  }
}