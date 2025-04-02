import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../lib/mongodb';

// Configure this route to be dynamically rendered
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Attempt to connect to MongoDB
    const mongoose = await connectToDatabase();
    
    // Return success response with connection state info
    return NextResponse.json({ 
      success: true, 
      message: 'MongoDB connected successfully',
      connectionState: mongoose.connection.readyState
      // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    });
  } catch (error) {
    console.error('Database connection error:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to connect to MongoDB',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}