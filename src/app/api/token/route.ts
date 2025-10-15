import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { channelName, uid, role } = body;

    if (!channelName || !uid || !role) {
      return NextResponse.json({ error: 'channelName, uid, and role are required' }, { status: 400 });
    }

    // The role in the URL is numeric: 1 for publisher, 2 for subscriber
    const agoraRole = role === 'publisher' ? 1 : 2;
    const url = `https://agora-token-service-production-d3a3.up.railway.app/rtc/${channelName}/${agoraRole}/uid/${uid}/`;
    
    console.log(`Proxying request to: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('Error from Agora token server:', errorBody);
        return NextResponse.json({ error: 'Failed to fetch token from Agora server', details: errorBody }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ token: data.rtcToken });

  } catch (error) {
    console.error('Internal Server Error in proxy:', error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error in proxy' }, { status: 500 });
  }
}
