/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Add Cloudinary / S3 host(s) here once file storage is set up (Phase 2)
    ],
  },
};

module.exports = nextConfig;
