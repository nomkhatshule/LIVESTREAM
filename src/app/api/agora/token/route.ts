'use server';

import { NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

export async function POST(request: Request) {
  const { channelName, account, role: roleStr } = await request.json();

  // --- 1. Strict Validation ---
  if (!channelName || typeof channelName !== 'string' || channelName.trim() === '') {
    console.error('Token generation failed: channelName is invalid.', { channelName });
    return NextResponse.json({ error: 'channelName is required and must be a non-empty string' }, { status: 400 });
  }

  if (!account || typeof account !== 'string' || account.trim() === '') {
      console.error('Token generation failed: account is invalid.', { account });
      return NextResponse.json({ error: 'account is required and must be a non-empty string' }, { status: 400 });
  }
  
  const userAccount = account; // Already validated as a non-empty string

  // --- 2. Role Determination ---
  let role;
  if (roleStr === 'publisher') {
    role = RtcRole.PUBLISHER;
  } else {
    role = RtcRole.SUBSCRIBER;
  }

  // --- 3. Read Credentials (Most likely point of failure if not set) ---
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    console.error('Agora App ID or Certificate is not configured on the server. Check environment variables.');
    return NextResponse.json({ error: 'Agora App ID or Certificate is not configured' }, { status: 500 });
  }

  // --- 4. Token Generation ---
  const expirationTimeInSeconds = 3600; // 1 hour
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  console.log('--- Attempting to generate Agora Token ---');
  console.log('Using App ID:', appId ? appId.substring(0, 5) + '...' : 'Not Found');
  console.log('Channel Name:', channelName);
  console.log('User Account:', userAccount);
  console.log('Role:', role === RtcRole.PUBLISHER ? 'PUBLISHER' : 'SUBSCRIBER');
  console.log('-----------------------------------------');

  try {
    const token = RtcTokenBuilder.buildTokenWithAccount(
      appId,
      appCertificate,
      channelName,
      userAccount,
      role,
      privilegeExpiredTs
    );
    console.log('Token generated successfully.');
    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating Agora token with RtcTokenBuilder:', error);
    return NextResponse.json({ error: 'Failed to generate token due to an internal library error.' }, { status: 500 });
  }
}
