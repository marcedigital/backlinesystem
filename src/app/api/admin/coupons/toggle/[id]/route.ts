import { NextRequest, NextResponse } from 'next/server';
import { Coupon } from '@/models';
import { connectToDatabase } from '@/utils/database';
import { verifyAdminAuth } from '@/utils/adminAuth';

// Toggle coupon active status
export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } }
) {
  // Safely extract and await params before using them
  const params = context.params;
  const id = params.id;
  
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
    
    // Find coupon by ID using the extracted id
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return NextResponse.json(
        { message: 'Coupon not found' },
        { status: 404 }
      );
    }
    
    // Toggle active status
    coupon.active = !coupon.active;
    await coupon.save();
    
    return NextResponse.json({
      id: coupon._id,
      active: coupon.active,
      message: `Coupon ${coupon.active ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error(`Error toggling coupon with ID ${id}:`, error);
    return NextResponse.json(
      { 
        message: error instanceof Error ? error.message : 'Server error',
        error: error instanceof Error ? error.stack : null
      }, 
      { status: 500 }
    );
  }
}