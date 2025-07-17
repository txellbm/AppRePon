import type {NextConfig} from 'next';
import withPWA from 'next-pwa';
import runtimeCaching from 'next-pwa/cache';

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default withPWA({
  dest: 'public',
  disable: isDev,
  runtimeCaching,
  register: true,
  skipWaiting: true,
})(nextConfig);
