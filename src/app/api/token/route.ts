import { NextRequest, NextResponse } from 'next/server';
// Correct the import to handle module structure differences.
import agora from 'agora-token';
const { RtcTokenBuilder, RtcRole } = agora;


// This route generates an Agora token directly.
export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch (e: any) {
    console.error('Failed to parse request body as JSON:', e.message);
    return NextResponse.json({ error: 'Invalid request body. Expected JSON.' }, { status: 400 });
  }

  const { channel, role, uid } = body;

  // 1. Validate incoming data
  if (!channel || !role || !uid) {
    const missingParams = [!channel && 'channel', !role && 'role', !uid && 'uid'].filter(Boolean).join(', ');
    console.error(`Token generation failed: Missing parameters in request body. Missing: ${missingParams}`, body);
    return NextResponse.json({ error: `Missing required parameters: ${missingParams}` }, { status: 400 });
  }

  if (typeof channel !== 'string' || typeof uid !== 'string') {
    return NextResponse.json({ error: 'Invalid parameter types: channel and uid must be strings.' }, { status: 400 });
  }

  // 2. Load credentials from environment variables
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    console.error('Agora App ID or Certificate is not configured in environment variables.');
    return NextResponse.json({ error: 'Server configuration error: Agora credentials not set.' }, { status: 500 });
  }

  // 3. Determine the user role for Agora
  const agoraRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
  const expireTime = 3600; // 1 hour expiration time in seconds
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;

  try {
    // 4. Generate the token
    console.log(`Generating token for channel: "${channel}", uid: "${uid}", role: ${role} (Agora role: ${agoraRole})`);
    
    const token = RtcTokenBuilder.buildTokenWithAccount(
      appId,
      appCertificate,
      channel,
      uid, // Use string UID here
      agoraRole,
      privilegeExpireTime
    );

    console.log("Successfully generated Agora token.");
    // 5. Return the token to the client
    return NextResponse.json({ token });

  } catch (error: any) {
    console.error('Error generating Agora token:', error);
    return NextResponse.json({ error: 'Failed to generate token', details: error.message }, { status: 500 });
  }
}
