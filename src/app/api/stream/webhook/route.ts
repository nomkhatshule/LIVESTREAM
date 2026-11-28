import { NextRequest, NextResponse } from 'next/server';
import { StreamChat } from 'stream-chat';
import { adminDb } from '@/firebase/server';

export const dynamic = 'force-dynamic';

/**
 * Receives events from Stream. When a livestream call ends (host closes the
 * tab, loses connection, or ends it), mark the broadcast as no longer live.
 *
 * Uses the Admin SDK so the write is not blocked by Firestore security rules
 * (the old version used the client SDK without a signed-in user, so every
 * update was rejected and streams stayed "live" forever).
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
  const apiSecret = process.env.STREAM_API_SECRET;
  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Server is not configured.' }, { status: 500 });
  }

  const signature = req.headers.get('x-signature') ?? req.headers.get('x-stream-signature');
  const body = await req.text();
  if (!signature) {
    return NextResponse.json({ error: 'Signature missing' }, { status: 400 });
  }

  const serverClient = StreamChat.getInstance(apiKey, apiSecret);
  if (!serverClient.verifyWebhook(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const event = JSON.parse(body);
    const endedTypes = ['call.ended', 'call.live_ended', 'call.session_ended'];
    if (endedTypes.includes(event.type) && typeof event.call_cid === 'string') {
      const [callType, broadcastId] = event.call_cid.split(':');
      if (callType === 'livestream' && broadcastId) {
        const ref = adminDb().collection('broadcasts').doc(broadcastId);
        const snap = await ref.get();
        if (snap.exists) {
          await ref.update({
            isLive: false,
            activeChallenge: null,
            activeChallengeType: null,
          });
        }
      }
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stream webhook: failed to process event', error);
    return NextResponse.json({ error: 'Failed to process event' }, { status: 500 });
  }
}
