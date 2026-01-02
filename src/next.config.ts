
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // This is to solve a bug with the Stream SDK.
    // The SDK is not meant to be used on the server, so we need to tell Webpack to ignore it.
    if (isServer) {
      config.externals.push('@stream-io/video-react-sdk');
    }

    return config;
  },
};

export default nextConfig;
