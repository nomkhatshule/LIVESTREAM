
import { StreamChat } from 'stream-chat';
import {NextResponse} from 'next/server';

export async function POST(req: Request) {
  try {
    const { userId, capabilities } = await req.json();

    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Stream API key or secret is not set.' }, { status: 500 });
    }

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    // Initialize Stream client on the server
    const serverClient = StreamChat.getInstance(apiKey, apiSecret);
    
    // Generate a token for the user with specific capabilities if provided
    const token = serverClient.createToken(userId, undefined, undefined, capabilities);
    
    return NextResponse.json({ token });

  } catch (error) {
    console.error('Error generating Stream token:', error);
    return NextResponse.json({ error: 'Failed to generate Stream token' }, { status: 500 });
  }
}
