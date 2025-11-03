
import Mux from '@mux/mux-node';
import {NextResponse} from 'next/server';

// Initialize the Mux client with credentials from environment variables
const muxClient = new Mux(
  process.env.MUX_TOKEN_ID,
  process.env.MUX_TOKEN_SECRET,
);

export async function POST() {
  try {
    // Correctly call the API on the initialized client instance
    const liveStream = await muxClient.video.liveStreams.create({
      playback_policy: ['public'],
      new_asset_settings: {playback_policy: ['public']},
    });

    return NextResponse.json({
      streamKey: liveStream.stream_key,
      playbackId: liveStream.playback_ids?.[0]?.id,
    });
  } catch (error) {
    console.error('Error creating Mux live stream:', error);
    return NextResponse.json(
      {error: 'Failed to create live stream'},
      {status: 500}
    );
  }
}
