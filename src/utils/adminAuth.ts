import { NextRequest } from 'next/server';
import { AdminUser } from '@/models';
import { connectToDatabase } from '@/utils/database';
import jwt from 'jsonwebtoken';
import { logToConsole } from '@/utils/logger';
import { Document } from 'mongoose';

// Define an interface for the admin document
interface AdminDocument {
  _id: any;
  email: string;
  name: string;
  isActive: boolean;
  role: string;
  // Include other properties as needed
}

// Define interface for JWT payload
interface AdminJwtPayload {
  id: string;
  email?: string;
  role: string;
  [key: string]: any;
}

export async function verifyAdminAuth(req: NextRequest): Promise<boolean> {
  try {
    // Get token from Authorization header or from cookies
    const authHeader = req.headers.get('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : req.cookies.get('adminToken')?.value;

    if (!token) {
      logToConsole('info', 'Admin auth failed: No token provided');
      return false;
    }

    // Verify token
    let payload: AdminJwtPayload;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      if (!decoded || typeof decoded !== 'object' || !('id' in decoded) || !('role' in decoded)) {
        throw new Error('Invalid token format');
      }
      payload = decoded as AdminJwtPayload;
    } catch (tokenError) {
      logToConsole('error', 'Admin auth failed: Token verification error', tokenError);
      return false;
    }
    
    // Validate role
    if (payload.role !== 'admin') {
      logToConsole('info', 'Admin auth failed: Not an admin role', { role: payload.role });
      return false;
    }

    // Connect to database with error handling
    try {
      await connectToDatabase();
    } catch (dbError) {
      logToConsole('error', 'Admin auth database connection error:', dbError);
      // Don't fail immediately here, still try to find the admin
    }

    // Check if admin exists in database
    try {
      // Use lean() to get a plain JavaScript object and then cast it to our interface
      const admin = await AdminUser.findById(payload.id).lean() as AdminDocument | null;
      
      if (!admin) {
        logToConsole('info', 'Admin auth failed: Admin not found');
        return false;
      }
      
      // Now TypeScript knows that isActive exists on the admin object
      if (!admin.isActive) {
        logToConsole('info', 'Admin auth failed: Admin account is inactive');
        return false;
      }
      
      // Success - admin is authenticated
      return true;
    } catch (findError) {
      logToConsole('error', 'Admin auth verification error:', findError);
      return false;
    }
  } catch (error) {
    logToConsole('error', 'Admin auth verification error:', error);
    return false;
  }
}