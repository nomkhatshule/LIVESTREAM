
import { StreamChat } from 'stream-chat';
import {NextResponse} from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId } = body;

    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error('TOKEN ROUTE ERROR: Stream API key or secret is not set.');
      return NextResponse.json({ error: 'Stream API key or secret is not set.' }, { status: 500 });
    }

    if (!userId) {
        console.error('TOKEN ROUTE ERROR: User ID is required but was not provided.');
        return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    // Initialize Stream Chat Client on the server (works for both Chat and Video)
    const serverClient = StreamChat.getInstance(apiKey, apiSecret);
    
    // Generate a token for the user.
    const token = serverClient.createToken(userId);
    
    return NextResponse.json({ token });

  } catch (error: any) {
    console.error('TOKEN ROUTE ERROR: Detailed error generating Stream token:', {
        message: error.message,
        stack: error.stack,
        error: error
    });
    return NextResponse.json({ error: 'Failed to generate Stream token', details: error.message }, { status: 500 });
  }
}
