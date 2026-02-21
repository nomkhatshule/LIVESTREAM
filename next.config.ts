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
    // This is to solve a bug with the Stream SDK.
    // The SDK is not meant to be used on the server, so we need to tell Webpack to ignore it.
    if (isServer) {
      config.externals.push('@stream-io/video-react-sdk');
    } else {
      // This is to solve a bug with a dependency of a dependency.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "stream": false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
