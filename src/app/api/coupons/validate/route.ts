import { NextRequest, NextResponse } from 'next/server';
import { Coupon } from '@/models';
import { connectToDatabase } from '@/utils/database';
import { logToConsole } from '@/utils/logger';

export async function GET(req: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Get coupon code from query parameters
    const { searchParams } = new URL(req.url);
    const couponCode = searchParams.get('code');
    
    // Validate input
    if (!couponCode) {
      return NextResponse.json(
        { message: 'Coupon code is required' },
        { status: 400 }
      );
    }
    
    // Find coupon by code
    const coupon = await Coupon.findOne({ 
      code: couponCode.toUpperCase() 
    });
    
    // Check if coupon exists
    if (!coupon) {
      return NextResponse.json(
        { message: 'Cupón no encontrado' },
        { status: 404 }
      );
    }
    
    // Check if coupon is active
    if (!coupon.active) {
      return NextResponse.json(
        { message: 'Este cupón no está activo' },
        { status: 400 }
      );
    }
    
    // Check for time-limited coupons
    if (coupon.couponType === 'time-limited') {
      const now = new Date();
      
      // Validate date range
      if (!coupon.startDate || !coupon.endDate) {
        return NextResponse.json(
          { message: 'Cupón no válido' },
          { status: 400 }
        );
      }
      
      if (now < new Date(coupon.startDate) || now > new Date(coupon.endDate)) {
        return NextResponse.json(
          { message: 'Este cupón no está vigente' },
          { status: 400 }
        );
      }
    }
    
    // Return coupon details
    return NextResponse.json({
      id: coupon._id,  
      code: coupon.code,
      discountType: coupon.discountType,
      value: coupon.value,
      couponType: coupon.couponType,
      startDate: coupon.startDate,
      endDate: coupon.endDate,
      active: coupon.active
    });
  } catch (error) {
    logToConsole('error', 'Coupon validation error:', error);
    return NextResponse.json(
      { 
        message: error instanceof Error ? error.message : 'Error validating coupon',
        error: error instanceof Error ? error.stack : null 
      }, 
      { status: 500 }
    );
  }
}