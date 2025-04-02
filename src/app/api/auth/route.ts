import { NextRequest, NextResponse } from 'next/server';
import { CustomerUser, AdminUser } from '@/models';
import AuthService from '@/utils/authService';
import { connectToDatabase } from '@/utils/database';

// Customer Signup Route
export async function POST(req: NextRequest) {
  try {
    // Connect to database first
    await connectToDatabase();
    
    const body = await req.json();
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      phoneNumber 
    } = body;

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { message: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await CustomerUser.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists' }, 
        { status: 400 }
      );
    }

    // Create new user
    const newUser = new CustomerUser({
      firstName,
      lastName,
      email,
      password,
      phoneNumber
    });

    // Save user
    await newUser.save();

    // Generate token
    const token = AuthService.generateToken({
      id: newUser._id.toString(),
      email: newUser.email,
      role: 'customer'
    });

    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    return NextResponse.json({
      token,
      user: userResponse
    }, { status: 201 });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { 
        message: error instanceof Error ? error.message : 'Server error',
        error: error instanceof Error ? error.stack : null 
      }, 
      { status: 500 }
    );
  }
}

// Customer Login Route
export async function GET(req: NextRequest) {
  try {
    // Connect to database first
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const password = searchParams.get('password');

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' }, 
        { status: 400 }
      );
    }

    // Find user
    const user = await CustomerUser.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' }, 
        { status: 400 }
      );
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json(
        { message: 'Invalid credentials' }, 
        { status: 400 }
      );
    }

    // Generate token
    const token = AuthService.generateToken({
      id: user._id.toString(),
      email: user.email,
      role: 'customer'
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return NextResponse.json({
      token,
      user: userResponse
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { 
        message: error instanceof Error ? error.message : 'Server error',
        error: error instanceof Error ? error.stack : null 
      }, 
      { status: 500 }
    );
  }
}