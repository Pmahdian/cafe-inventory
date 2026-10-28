import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // Accept any local network IP in dev
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    // LAN ranges
    '10.*.*.*',
    '172.*.*.*',
    '192.168.*.*',
  ],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:8000/api/:path*', 
      },
    ];
  },
};

export default nextConfig;