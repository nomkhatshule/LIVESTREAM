import { NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

export async function POST(request: Request) {
  const { channelName, account } = await request.json();

  if (!channelName || !account) {
    return NextResponse.json({ error: 'channelName and account are required' }, { status: 400 });
  }

  // The account must be a string for buildTokenWithAccount
  if (typeof account !== 'string') {
    return NextResponse.json({ error: 'account must be a string' }, { status: 400 });
  }

  // Directly access the environment variables on the server.
  // The `NEXT_PUBLIC_` prefix is for client-side exposure, but the server can access both.
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    console.error('Agora App ID or Certificate is not configured on the server. Check environment variables.');
    return NextResponse.json({ error: 'Agora App ID or Certificate is not configured' }, { status: 500 });
  }

  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600; // 1 hour
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  try {
    // Use buildTokenWithAccount for string-based UIDs
    const token = RtcTokenBuilder.buildTokenWithAccount(
      appId,
      appCertificate,
      channelName,
      account, // Use the string account
      role,
      privilegeExpiredTs
    );
    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating Agora token:', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
