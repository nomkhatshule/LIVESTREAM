import { NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

export async function POST(request: Request) {
  const { channelName, uid } = await request.json();

  if (!channelName || uid === undefined) {
    return NextResponse.json({ error: 'channelName and uid are required' }, { status: 400 });
  }

  // UID must be a number for the token builder library we are using.
  const numericUid = Number(uid);
  if (isNaN(numericUid)) {
      return NextResponse.json({ error: 'UID must be a number' }, { status: 400 });
  }


  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    return NextResponse.json({ error: 'Agora App ID or Certificate is not configured' }, { status: 500 });
  }

  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600; // 1 hour
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  try {
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      numericUid, // Use the numeric UID
      role,
      privilegeExpiredTs
    );
    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating Agora token:', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
