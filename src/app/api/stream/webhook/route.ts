
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { StreamChat } from 'stream-chat';
import { doc, updateDoc } from 'firebase/firestore';
import { initializeFirebaseForServer } from '@/firebase/server-init';

// Initialize firebase to get the firestore instance.
const { firestore: db } = initializeFirebaseForServer();

export async function POST(req: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
  const apiSecret = process.env.STREAM_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Stream API key or secret is not set.' }, { status: 500 });
  }

  const serverClient = StreamChat.getInstance(apiKey, apiSecret);
  
  // 1. Verify the webhook signature
  const signature = headers().get('x-stream-signature');
  const body = await req.text(); // Read the raw body as text

  if (!signature) {
    return NextResponse.json({ error: 'Signature missing' }, { status: 400 });
  }

  try {
    // The StreamChat SDK can verify the webhook signature for us
    if (!serverClient.verifyWebhook(body, signature)) {
       return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  } catch (error) {
     console.error('Webhook signature verification failed:', error);
     return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 });
  }

  // 2. Parse the event and update Firestore
  try {
    const event = JSON.parse(body);

    // We only care about when the livestream call ends
    if (event.type === 'call.ended' && event.call_type === 'livestream') {
      const broadcastId = event.call_cid.split(':')[1];
      
      if (broadcastId) {
        // Use the client-side SDK to update the document.
        const broadcastDocRef = doc(db, 'broadcasts', broadcastId);
        await updateDoc(broadcastDocRef, {
          isLive: false,
          activeChallenge: null, // Also clear any active challenge
          activeChallengeType: null,
        });
        console.log(`Successfully marked broadcast ${broadcastId} as not live.`);
      }
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Error processing webhook event:', error);
    return NextResponse.json({ error: 'Failed to process event' }, { status: 500 });
  }
}
