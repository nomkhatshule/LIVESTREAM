'use server';

import { NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

export async function POST(request: Request) {
  const { channelName, account } = await request.json();

  if (!channelName || typeof channelName !== 'string' || channelName.trim() === '') {
    console.error('Token generation failed: channelName is invalid.', { channelName });
    return NextResponse.json({ error: 'channelName is required and must be a non-empty string' }, { status: 400 });
  }

  // The account can be a string or a number (user ID), but it must be provided.
  // The Agora library will handle converting it. For consistency, we'll treat it as a string.
  const userAccount = account ? String(account) : '';
  if (userAccount.trim() === '') {
      console.error('Token generation failed: account is invalid.', { account });
      return NextResponse.json({ error: 'account is required and must be a non-empty string or number' }, { status: 400 });
  }

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

  console.log('--- Attempting to generate Agora Token ---');
  console.log('Using App ID:', appId.substring(0, 5) + '...');
  console.log('Using App Certificate:', appCertificate.substring(0, 5) + '...');
  console.log('Channel Name:', channelName);
  console.log('User Account:', userAccount);
  console.log('Role:', role);
  console.log('Privilege Expiration:', privilegeExpiredTs);
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
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
