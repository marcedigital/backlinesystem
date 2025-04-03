import { NextRequest, NextResponse } from 'next/server';
import { CustomerUser } from '@/models';
import { connectToDatabase } from '@/utils/database';
import { verifyAdminAuth } from '@/utils/adminAuth';
import clientPromise from '@/app/api/lib/mongodb'; 

interface NextAuthUser {
  _id: any;
  id?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  createdAt?: Date;
}

export async function GET(req: NextRequest) {
  try {
    const isAdmin = await verifyAdminAuth(req);
    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Connect to database using Mongoose for CustomerUser
    await connectToDatabase();
    
    // Also get the MongoDB client for direct collection access
    const client = await clientPromise;
    const db = client.db();
    
    // Pagination parameters
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Get users from CustomerUser collection
    const customerUsers = await CustomerUser.find({})
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    // Get users from NextAuth users collection using the MongoDB client
    const nextAuthUsers = await db.collection('users')
      .find({})
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();
    
    // Transform NextAuth users to match your format
    const formattedNextAuthUsers = nextAuthUsers.map((user: NextAuthUser) => ({
      _id: user._id.toString(),
      firstName: user.name?.split(' ')[0] || 'Google',
      lastName: user.name?.split(' ').slice(1).join(' ') || 'User',
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      totalBookings: 0,
      totalSpent: 0,
      googleId: user.id || 'google-user',
      createdAt: user.createdAt || new Date(),
      isGoogleUser: true
    }));
    
    // Combine users from both collections
    // Filter out duplicates based on email
    const emailSet = new Set();
    const allUsers = [];
    
    // Add CustomerUsers first (they take priority)
    for (const user of customerUsers) {
      allUsers.push(user);
      emailSet.add(user.email);
    }
    
    // Add NextAuth users that aren't already included
    for (const user of formattedNextAuthUsers) {
      if (!emailSet.has(user.email)) {
        allUsers.push(user);
        emailSet.add(user.email);
      }
    }
    
    // Count total users from both collections
    const totalCustomerUsers = await CustomerUser.countDocuments({});
    const totalNextAuthUsers = await db.collection('users').countDocuments({});
    
    // Estimate total unique users (this is an approximation)
    const estimatedTotalUnique = totalCustomerUsers + totalNextAuthUsers;
    
    return NextResponse.json({
      users: allUsers,
      pagination: {
        total: estimatedTotalUnique,
        page,
        limit,
        pages: Math.ceil(estimatedTotalUnique / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { 
        message: error instanceof Error ? error.message : 'Error fetching users',
        error: error instanceof Error ? error.stack : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}