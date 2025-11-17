/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Required for Dockerfile standalone deployment
  // Railway will auto-detect Next.js and handle deployment
  // Environment variables are automatically available via process.env
}

export default nextConfig
