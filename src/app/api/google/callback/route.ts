import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  try {
    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'http://localhost:3000/api/google/callback'
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    console.log('Tokens:', {
      access_token: tokens.access_token ? 'SET' : 'NOT SET',
      refresh_token: tokens.refresh_token ? 'SET' : 'NOT SET',
    });

    // The refresh token is only provided on the first authorization
    if (tokens.refresh_token) {
      console.log('🔑 REFRESH TOKEN:');
      console.log(tokens.refresh_token);
      console.log('\nAdd this to your .env.local file as GOOGLE_REFRESH_TOKEN');
    }

    // Redirect to a success page or back to the main page
    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return NextResponse.json({ 
      error: 'Failed to exchange code for tokens',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}