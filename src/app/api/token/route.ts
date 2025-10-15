import { NextRequest, NextResponse } from 'next/server';

// This route acts as a proxy to the Go token server to avoid CORS issues.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tokenType, channel, role, uid, expire } = body;

    // Validate incoming data
    if (!tokenType || !channel || !role || !uid) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Forward the request to the actual Go token server
    const tokenServerResponse = await fetch('http://localhost:8080/token/getNew', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokenType,
        channel,
        role,
        uid,
        expire: expire || 3600, // Default to 1 hour
      }),
    });

    if (!tokenServerResponse.ok) {
        const errorBody = await tokenServerResponse.text();
        console.error(`Token server responded with ${tokenServerResponse.status}:`, errorBody);
        return NextResponse.json({ error: 'Failed to get token from middleware server', details: errorBody }, { status: tokenServerResponse.status });
    }

    const data = await tokenServerResponse.json();

    // Return the token to the client
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error in token proxy API:', error);
    return NextResponse.json({ error: 'Internal Server Error in proxy' }, { status: 500 });
  }
}
