/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'mammoth'],
  },
  webpack: (config) => {
    // Disable disk pack cache on Windows to prevent file locking/EPERM issues during compilation
    config.cache = false;
    return config;
  },
};

export default nextConfig;
