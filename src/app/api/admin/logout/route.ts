// src/app/api/admin/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Clear admin token cookie
  response.cookies.delete('adminToken');
  
  return response;
}