import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
      },
    ],
    unoptimized: true, // Required for static exports
  },
  eslint: {
    // This will allow the build to complete even with ESLint errors
    ignoreDuringBuilds: true,
  },
  // Change from static export to server mode to support API routes
  // output: 'export', // Commented out to enable API routes
  trailingSlash: true, 
  typescript: {
    // Ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
};

// Only apply export configuration when not using API routes
// This is a common pattern for hybrid Next.js applications
if (process.env.EXPORT_MODE === 'true') {
  nextConfig.output = 'export';
}

export default nextConfig;