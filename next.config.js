/** @type {import('next').NextConfig} */

// Only these image hosts can be optimized by next/image. (Previously any
// website was allowed, which lets anyone use the server as a free image proxy.)
const imageHosts = [
  'firebasestorage.googleapis.com', // uploads: avatars, covers, chat images
  'lh3.googleusercontent.com', // Google sign-in profile photos
  '**.giphy.com', // GIFs in chat
  '**.stream-io-cdn.com', // attachments in direct messages
  'images.unsplash.com',
  'picsum.photos',
  'cdn.pixabay.com',
];

const nextConfig = {
  // Standalone output works best with Firebase App Hosting / containers.
  output: 'standalone',
  images: {
    remotePatterns: imageHosts.map((hostname) => ({ protocol: 'https', hostname })),
  },
  webpack: (config, { isServer }) => {
    // Work around Stream's video SDK not supporting server rendering.
    if (isServer) {
      config.externals.push('@stream-io/video-react-sdk');
    }
    return config;
  },
};

module.exports = nextConfig;
