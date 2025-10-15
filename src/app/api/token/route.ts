import { NextRequest, NextResponse } from 'next/server';

// This route acts as a proxy to the Go token server to avoid CORS issues.
export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch (e: any) {
    console.error('Failed to parse request body as JSON:', e.message);
    return NextResponse.json({ error: 'Invalid request body. Expected JSON.' }, { status: 400 });
  }

  try {
    const { tokenType, channel, role, uid, expire } = body;

    // Validate incoming data
    if (!tokenType || !channel || !role || !uid) {
      console.error('Proxy validation failed. Missing parameters in request body:', body);
      return NextResponse.json({ error: 'Missing required parameters: tokenType, channel, role, uid' }, { status: 400 });
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
    console.error('Error in token proxy API after parsing body:', error);
    // Forward a more specific error message if available
    return NextResponse.json({ error: 'Internal Server Error in proxy', details: error.message }, { status: 500 });
  }
}
