
import Mux from '@mux/mux-node';
import {NextResponse} from 'next/server';

const {video} = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

export async function POST() {
  try {
    const liveStream = await video.liveStreams.create({
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
