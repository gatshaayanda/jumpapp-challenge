import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Allow UploadThing image URLs
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io',
      },
    ],
  },

  // Skip emitting ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Skip TypeScript build errors
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
