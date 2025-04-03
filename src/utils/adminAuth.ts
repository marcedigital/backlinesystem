// src/utils/adminAuth.ts
import { NextRequest } from 'next/server';
import { AdminUser } from '@/models';
import AuthService from './authService';

export async function verifyAdminAuth(req: NextRequest): Promise<boolean> {
  try {
    // Get token from Authorization header or from cookies
    const authHeader = req.headers.get('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : req.cookies.get('adminToken')?.value;

    if (!token) {
      return false;
    }

    // Verify token
    const payload = AuthService.verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return false;
    }

    // Check if admin exists in database
    const admin = await AdminUser.findById(payload.id);
    if (!admin || !admin.isActive) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Admin auth verification error:', error);
    return false;
  }
}