import { NextRequest, NextResponse } from 'next/server';
import { AdminUser } from '@/models';
import { connectToDatabase } from '@/utils/database';
import jwt from 'jsonwebtoken';
import { logToConsole } from '@/utils/logger';

export async function GET(req: NextRequest) {
  try {
    // Get token from cookies
    const token = req.cookies.get('adminToken')?.value;
    
    if (!token) {
      return NextResponse.json(
        { authenticated: false }, 
        { status: 401 }
      );
    }
    
    // Verify token with proper error handling
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      if (!decoded || typeof decoded !== 'object') {
        throw new Error('Invalid token');
      }
    } catch (tokenError) {
      logToConsole('error', 'Token verification failed:', tokenError);
      
      // Clear invalid cookie
      const response = NextResponse.json(
        { authenticated: false }, 
        { status: 401 }
      );
      
      response.cookies.delete('adminToken');
      return response;
    }
    
    // Connect to database with error handling
    try {
      await connectToDatabase();
    } catch (dbError) {
      logToConsole('error', 'Database connection error in auth check:', dbError);
      // Don't fail immediately here, let's still try to find the admin
    }
    
    // Get admin from database with error handling
    let admin = null;
    try {
      admin = await AdminUser.findById(decoded.id).select('-password');
      
      if (!admin) {
        throw new Error('Admin not found');
      }
    } catch (findError) {
      logToConsole('error', 'Error finding admin:', findError);
      
      // Clear invalid cookie
      const response = NextResponse.json(
        { authenticated: false }, 
        { status: 401 }
      );
      
      response.cookies.delete('adminToken');
      return response;
    }
    
    // Return admin data
    return NextResponse.json({
      authenticated: true,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name
      }
    });
    
  } catch (error) {
    logToConsole('error', 'Auth check error:', error);
    return NextResponse.json(
      { authenticated: false }, 
      { status: 500 }
    );
  }
}