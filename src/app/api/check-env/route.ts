import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    googleClientIdExists: !!process.env.GOOGLE_CLIENT_ID,
    googleClientSecretExists: !!process.env.GOOGLE_CLIENT_SECRET,
    nextAuthUrlExists: !!process.env.NEXTAUTH_URL,
    nextAuthSecretExists: !!process.env.NEXTAUTH_SECRET,
    envMode: process.env.NODE_ENV
  });
}