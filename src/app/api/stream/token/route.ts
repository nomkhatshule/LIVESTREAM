import { NextResponse } from 'next/server';
import { StreamChat } from 'stream-chat';
import { adminAuth } from '@/firebase/server';

export const dynamic = 'force-dynamic';

/**
 * Issues a Stream token (used for both video and chat) for the signed-in user.
 *
 * The caller must send `Authorization: Bearer <Firebase ID token>`. We verify
 * that token with the Admin SDK and issue a Stream token for *that* user only,
 * so a caller can never get a token for someone else's account.
 */
export async function POST(req: Request) {
  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
  const apiSecret = process.env.STREAM_API_SECRET;
  if (!apiKey || !apiSecret) {
    console.error('Stream token route: STREAM_API_SECRET or NEXT_PUBLIC_STREAM_API_KEY is not set.');
    return NextResponse.json({ error: 'Server is not configured.' }, { status: 500 });
  }

  const header = req.headers.get('authorization') ?? '';
  const idToken = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!idToken) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  let uid: string;
  try {
    ({ uid } = await adminAuth().verifyIdToken(idToken));
  } catch {
    return NextResponse.json({ error: 'Invalid or expired sign-in.' }, { status: 401 });
  }

  try {
    const serverClient = StreamChat.getInstance(apiKey, apiSecret);
    // Tokens expire after 24 hours; clients fetch a new one on next load.
    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
    const token = serverClient.createToken(uid, expiresAt);
    return NextResponse.json({ token });
  } catch (error) {
    console.error('Stream token route: failed to create token', error);
    return NextResponse.json({ error: 'Failed to create token.' }, { status: 500 });
  }
}
