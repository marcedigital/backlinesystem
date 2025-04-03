// src/app/api/auth/providers/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // We need to manually construct the providers info on the server
    const providers = {
      google: {
        id: "google",
        name: "Google",
        type: "oauth",
        signinUrl: "/api/auth/signin/google",
        callbackUrl: "/api/auth/callback/google"
      }
    };
    
    return NextResponse.json(providers);
  } catch (error) {
    console.error("Error in providers route:", error);
    return NextResponse.json(
      { error: "Failed to load providers" },
      { status: 500 }
    );
  }
}