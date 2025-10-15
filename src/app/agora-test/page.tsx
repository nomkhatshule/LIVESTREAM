'use client';
import { useState } from 'react';
import AgoraUIKit from 'agora-react-uikit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';

const AgoraTestPage = () => {
  const [videoCall, setVideoCall] = useState(false);
  const [channel, setChannel] = useState('test');

  const rtcProps = {
    appId: appId,
    channel: channel,
    token: null, // Using null token for testing as per the example
  };

  const callbacks = {
    EndCall: () => setVideoCall(false),
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh' }}>
      {videoCall ? (
        <AgoraUIKit rtcProps={rtcProps} callbacks={callbacks} />
      ) : (
        <div className="flex flex-col items-center justify-center w-full gap-4">
            <h1 className="text-2xl font-bold">Agora UI Kit Test</h1>
            <div className="w-full max-w-xs space-y-2">
                <Input 
                    type="text" 
                    placeholder="Enter channel name" 
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                />
                <Button onClick={() => setVideoCall(true)} disabled={!channel} className="w-full">
                    Join Channel
                </Button>
            </div>
            <p className="text-sm text-muted-foreground">Using App ID: {appId}</p>
        </div>
      )}
    </div>
  );
};

export default AgoraTestPage;
