/** @type {import('next').NextConfig} */
const nextConfig = {
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
    ]
  },
  webpack: (config, { isServer }) => {
    // Increase the timeout for loading chunks to 60 seconds
    config.output.chunkLoadTimeout = 60000;

    // This is to solve a bug with the Stream SDK.
    if (isServer) {
      config.externals.push('@stream-io/video-react-sdk');
    }
    return config;
  },
};

module.exports = nextConfig;
