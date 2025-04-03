// src/app/api/admin/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/database';
import { AdminUser } from '@/models';
import { compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();
    
    const { email, password } = await req.json();
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' }, 
        { status: 400 }
      );
    }
    
    // Find admin user
    const admin = await AdminUser.findOne({ email });
    if (!admin) {
      return NextResponse.json(
        { message: 'Invalid credentials' }, 
        { status: 401 }
      );
    }
    
    // Check password
    const isPasswordValid = await compare(password, admin.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Invalid credentials' }, 
        { status: 401 }
      );
    }
    
    // Generate token
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    // Create response with HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name
      }
    });
    
    // Set cookie for admin authentication
    response.cookies.set({
      name: 'adminToken',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    return response;
    
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { 
        message: error instanceof Error ? error.message : 'Server error',
        error: error instanceof Error ? error.stack : null 
      }, 
      { status: 500 }
    );
  }
}