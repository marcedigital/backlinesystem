// src/app/api/admin/auth/check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/utils/adminAuth';
import { AdminUser } from '@/models';
import jwt from 'jsonwebtoken';

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
    
    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      if (!decoded || typeof decoded !== 'object') {
        throw new Error('Invalid token');
      }
      
      // Get admin from database
      const admin = await AdminUser.findById(decoded.id).select('-password');
      if (!admin) {
        throw new Error('Admin not found');
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
      console.error('Token verification failed:', error);
      
      // Clear invalid cookie
      const response = NextResponse.json(
        { authenticated: false }, 
        { status: 401 }
      );
      
      response.cookies.delete('adminToken');
      return response;
    }
    
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { authenticated: false }, 
      { status: 500 }
    );
  }
}